import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { isNetworkError } from '../lib/errorHandler';
import { logger } from '../lib/logger';
import { queryClient } from '../utils/queryClient';

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

export const ConnectionProvider = ({ children }: { children: ReactNode }) => {
  const [isOnline, setIsOnline] = useState(true);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  const checkConnection = useCallback(async () => {
    try {
      const { error } = await supabase.from('profiles').select('id', { count: 'exact', head: true }).limit(1);
      const online = !error || !isNetworkError(error);
      const wasOffline = isOnline === false && online === true;
      setIsOnline(online);
      setLastChecked(new Date());

      if (wasOffline) {
        logger.info('ConnectionContext', 'Connection restored, refetching queries');
        queryClient.invalidateQueries({ refetchType: 'all' });
      }

      return online;
    } catch {
      setIsOnline(false);
      setLastChecked(new Date());
      return false;
    }
  }, [isOnline]);

  useEffect(() => {
    checkConnection();
    const interval = setInterval(checkConnection, 30000);

    const handleOnline = () => {
      logger.info('ConnectionContext', 'Browser online event');
      setIsOnline(true);
      checkConnection();
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
