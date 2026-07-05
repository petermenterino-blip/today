import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { STALE_TIMES } from '../constants/queryKeys';
import { idleRecovery } from '../lib/idleRecovery';
import { logger } from '../lib/logger';

const STALE_KEYS = [
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

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: STALE_TIMES.normal,
      gcTime: 30 * 60 * 1000,
      retry: 2,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
      refetchOnWindowFocus: false,
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
        for (const key of STALE_KEYS) {
          queryClient.invalidateQueries({ queryKey: key, refetchType: 'active' });
        }
      },
    });
  }, []);

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
};
