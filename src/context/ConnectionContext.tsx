import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { isNetworkError } from '../lib/errorHandler';

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
      setIsOnline(online);
      setLastChecked(new Date());
      return online;
    } catch {
      setIsOnline(false);
      setLastChecked(new Date());
      return false;
    }
  }, []);

  useEffect(() => {
    checkConnection();
    const interval = setInterval(checkConnection, 30000);
    return () => clearInterval(interval);
  }, [checkConnection]);

  return (
    <ConnectionContext.Provider value={{ isOnline, lastChecked, checkConnection }}>
      {children}
    </ConnectionContext.Provider>
  );
};

export const useConnection = () => useContext(ConnectionContext);
