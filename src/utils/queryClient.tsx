import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { idleRecovery } from '../lib/idleRecovery';
import { logger } from '../lib/logger';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
      refetchIntervalInBackground: false,
    },
    mutations: {
      retry: 1,
      retryDelay: 1000,
    },
  },
});

export const QueryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  React.useEffect(() => {
    idleRecovery.configure({
      onFullRecovery: async () => {
        logger.info('QueryClient', 'Invalidating stale queries after idle recovery');
        await queryClient.invalidateQueries({
          refetchType: 'all',
        });
      },
    });
  }, []);

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
};
