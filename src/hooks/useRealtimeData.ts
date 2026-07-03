import { useEffect, useRef, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { logger } from '../lib/logger'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const isSupabaseAvailable = !!(supabaseUrl && import.meta.env.VITE_SUPABASE_ANON_KEY)

interface RealtimeDataConfig {
  table: string
  queryKey: string[]
  filter?: { column: string; value: string }
}

export const useRealtimeData = (configs: RealtimeDataConfig[]) => {
  const queryClient = useQueryClient()
  const channelsRef = useRef<ReturnType<typeof supabase.channel>[]>([])
  const configsRef = useRef(configs)
  configsRef.current = configs

  const setupChannels = useCallback(() => {
    channelsRef.current.forEach(ch => {
      try { supabase.removeChannel(ch) } catch {}
    })

    const channels = configsRef.current.map(({ table, queryKey, filter }, idx) => {
      const channelName = `rt-data-${table}-${crypto.randomUUID()}-${idx}`
      const channel = supabase
        .channel(channelName)
        .on(
          'postgres_changes' as any,
          {
            event: '*',
            schema: 'public',
            table,
            filter: filter ? `${filter.column}=eq.${filter.value}` : undefined,
          },
          () => {
            try {
              queryClient.invalidateQueries({ queryKey })
            } catch (err) {
              logger.error('useRealtimeData', `Invalidation error for ${table}`, { error: String(err) })
            }
          }
        )
        .subscribe((status: string) => {
          if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            logger.warn('useRealtimeData', `Channel ${table} error: ${status}`)
          }
        })

      return channel
    })

    channelsRef.current = channels
  }, [queryClient])

  useEffect(() => {
    if (!isSupabaseAvailable) return
    if (configs.length === 0) return

    setupChannels()

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        logger.info('useRealtimeData', 'Tab visible, reconnecting data channels')
        setupChannels()
      }
    }

    const handleOnline = () => {
      logger.info('useRealtimeData', 'Network online, reconnecting data channels')
      setupChannels()
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('online', handleOnline)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('online', handleOnline)
      channelsRef.current.forEach(ch => {
        try { supabase.removeChannel(ch) } catch {}
      })
      channelsRef.current = []
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(configs), setupChannels])

  return null
}
