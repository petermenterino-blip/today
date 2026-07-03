import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const isSupabaseAvailable = !!(supabaseUrl && import.meta.env.VITE_SUPABASE_ANON_KEY)

interface RealtimeDataConfig {
  table: string
  queryKey: string[]
  filter?: { column: string; value: string }
}

export const useRealtimeData = (configs: RealtimeDataConfig[]) => {
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!isSupabaseAvailable) return
    if (configs.length === 0) return

    const activeChannels = new Set<string>()

    const channels = configs.map(({ table, queryKey, filter }, idx) => {
      const channelName = `realtime-${table}-${crypto.randomUUID()}-${idx}`
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
            queryClient.invalidateQueries({ queryKey })
          }
        )
        .subscribe()

      activeChannels.add(channelName)
      return channel
    })

    return () => {
      channels.forEach(ch => supabase.removeChannel(ch))
      activeChannels.clear()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(configs), queryClient])

  return null
}
