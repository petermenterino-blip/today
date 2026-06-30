import { useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';

type RealtimeEvent = 'INSERT' | 'UPDATE' | 'DELETE' | '*';

interface RealtimeConfig {
  table: string;
  event?: RealtimeEvent;
  filter?: string;
  callback: (payload: any) => void;
}

export const useRealtime = (configs: RealtimeConfig[]) => {
  const channelsRef = useRef<ReturnType<typeof supabase.channel>[]>([]);

  useEffect(() => {
    const channels = configs.map(({ table, event = '*', filter, callback }) => {
      const channel = supabase
        .channel(`${table}-changes`)
        .on(
          'postgres_changes' as any,
          { event, schema: 'public', table, filter },
          (payload) => callback(payload)
        )
        .subscribe();

      return channel;
    });

    channelsRef.current = channels;

    return () => {
      channels.forEach(ch => supabase.removeChannel(ch));
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(configs)]);

  return {
    cleanup: () => {
      channelsRef.current.forEach(ch => supabase.removeChannel(ch));
      channelsRef.current = [];
    }
  };
};
