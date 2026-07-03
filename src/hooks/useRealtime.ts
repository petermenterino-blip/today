import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { logger } from '../lib/logger';

type RealtimeEvent = 'INSERT' | 'UPDATE' | 'DELETE' | '*';

interface RealtimeConfig {
  table: string;
  event?: RealtimeEvent;
  filter?: string;
  callback: (payload: any) => void;
}

export const useRealtime = (configs: RealtimeConfig[]) => {
  const channelsRef = useRef<ReturnType<typeof supabase.channel>[]>([]);
  const configsRef = useRef(configs);
  configsRef.current = configs;

  const setupChannels = useCallback(() => {
    channelsRef.current.forEach(ch => {
      try {
        supabase.removeChannel(ch);
      } catch {}
    });

    const channels = configsRef.current.map(({ table, event = '*', filter, callback }, idx) => {
      const channelName = `rt-${table}-${crypto.randomUUID()}-${idx}`;
      const channel = supabase
        .channel(channelName)
        .on(
          'postgres_changes' as any,
          { event, schema: 'public', table, filter },
          (payload: any) => {
            try {
              callback(payload);
            } catch (err) {
              logger.error('useRealtime', `Callback error for ${table}`, { error: String(err) });
            }
          }
        )
        .subscribe((status: string) => {
          if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            logger.warn('useRealtime', `Channel ${table} error: ${status}, will retry`);
          }
        });

      return channel;
    });

    channelsRef.current = channels;
  }, []);

  useEffect(() => {
    if (configs.length === 0) return;

    setupChannels();

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        logger.info('useRealtime', 'Tab visible, reconnecting channels');
        setupChannels();
      }
    };

    const handleOnline = () => {
      logger.info('useRealtime', 'Network online, reconnecting channels');
      setupChannels();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('online', handleOnline);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('online', handleOnline);
      channelsRef.current.forEach(ch => {
        try {
          supabase.removeChannel(ch);
        } catch {}
      });
      channelsRef.current = [];
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(configs), setupChannels]);

  return {
    cleanup: useCallback(() => {
      channelsRef.current.forEach(ch => {
        try {
          supabase.removeChannel(ch);
        } catch {}
      });
      channelsRef.current = [];
    }, []),
    reconnect: useCallback(() => {
      setupChannels();
    }, [setupChannels]),
  };
};
