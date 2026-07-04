import React, { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { isNetworkError } from '../lib/errorHandler';
import { logger } from '../lib/logger';

interface ConnectionContextType {
  isOnline: boolean;
  lastChecked: Date | null;
  checkConnection: () => Promise<boolean>;
}

const ConnectionContext = createContext<ConnectionContextType>({
  isOnline: true,
  lastChecked: null,
  checkConnection: async () => true,
});

const STALE_QUERY_KEYS = [
  ['applications'],
  ['tasks'],
  ['bookings'],
  ['sessions'],
  ['events'],
  ['programs'],
  ['goals'],
  ['journals'],
  ['notifications'],
  ['messages'],
  ['conversations'],
];

export const ConnectionProvider = ({ children }: { children: ReactNode }) => {
  const [isOnline, setIsOnline] = useState(true);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const wasOfflineRef = useRef(false);

  const checkConnection = useCallback(async () => {
    try {
      const { error } = await supabase.from('profiles').select('id', { count: 'exact', head: true }).limit(1);
      const online = !error || !isNetworkError(error);

      if (!online) {
        wasOfflineRef.current = true;
      }

      setIsOnline(online);
      setLastChecked(new Date());

      return online;
    } catch {
      wasOfflineRef.current = true;
      setIsOnline(false);
      setLastChecked(new Date());
      return false;
    }
  }, []);

  useEffect(() => {
    checkConnection();
    const interval = setInterval(checkConnection, 60000);

    const handleOnline = async () => {
      logger.info('ConnectionContext', 'Browser online event');
      setIsOnline(true);
      const online = await checkConnection();
      if (online && wasOfflineRef.current) {
        wasOfflineRef.current = false;
        logger.info('ConnectionContext', 'Connection restored, refetching stale queries');
        const { queryClient } = await import('../utils/queryClient');
        for (const key of STALE_QUERY_KEYS) {
          queryClient.invalidateQueries({ queryKey: key, refetchType: 'active' });
        }
      }
    };

    const handleOffline = () => {
      logger.warn('ConnectionContext', 'Browser offline event');
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      clearInterval(interval);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [checkConnection]);

  return (
    <ConnectionContext.Provider value={{ isOnline, lastChecked, checkConnection }}>
      {children}
    </ConnectionContext.Provider>
  );
};

export const useConnection = () => useContext(ConnectionContext);
