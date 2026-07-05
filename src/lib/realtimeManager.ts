import { useEffect, useRef, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from './supabase';
import { logger } from './logger';

type ChannelEntry = {
  table: string
  queryKey: string[]
  filter?: { column: string; value: string }
}

type SubscribeEntry = {
  table: string
  event?: 'INSERT' | 'UPDATE' | 'DELETE' | '*'
  filter?: string
  callback: (payload: any) => void
}

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const isSupabaseAvailable = !!(supabaseUrl && import.meta.env.VITE_SUPABASE_ANON_KEY)

function makeFilterStr(filter?: { column: string; value: string }): string | undefined {
  return filter ? `${filter.column}=eq.${filter.value}` : undefined
}

const debounceTimers = new Map<string, ReturnType<typeof setTimeout>>()

function debouncedInvalidate(queryClient: ReturnType<typeof useQueryClient>, queryKey: string[], delay = 2000) {
  const key = queryKey.join('|')
  const existing = debounceTimers.get(key)
  if (existing) clearTimeout(existing)
  debounceTimers.set(key, setTimeout(() => {
    debounceTimers.delete(key)
    try {
      queryClient.invalidateQueries({ queryKey, refetchType: 'active' })
    } catch (err) {
      logger.error('realtimeManager', `Invalidation error for ${key}`, { error: String(err) })
    }
  }, delay))
}

function generateChannelName(kind: string, table: string): string {
  return `rt-${kind}-${table}-${crypto.randomUUID().slice(0, 8)}`
}

export function getActiveChannelCount(): number {
  return 0
}

export function useSharedRealtimeData(configs: ChannelEntry[]) {
  const queryClient = useQueryClient()
  const channelsRef = useRef<RealtimeChannel[]>([])
  const configsKeyRef = useRef('')

  const currentKey = configs.map(c => `${c.table}|${c.queryKey.join(',')}|${c.filter?.column ?? ''}|${c.filter?.value ?? ''}`).join('||')

  useEffect(() => {
    if (!isSupabaseAvailable) return
    if (configs.length === 0) return

    const channels: RealtimeChannel[] = []

    for (const { table, queryKey, filter } of configs) {
      const filterStr = makeFilterStr(filter)
      const channelName = generateChannelName('data', table)
      const channel = supabase.channel(channelName)

      logger.debug('realtimeManager', `Channel created: ${channelName}`)

      channel.on(
        'postgres_changes' as any,
        {
          event: '*',
          schema: 'public',
          table,
          filter: filterStr,
        },
        () => {
          debouncedInvalidate(queryClient, queryKey, 2000)
        }
      )

      channel.subscribe((status: string) => {
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          logger.warn('realtimeManager', `Channel error: ${status} for ${channelName}`)
        }
        if (status === 'SUBSCRIBED') {
          logger.debug('realtimeManager', `Subscribed: ${channelName}`)
        }
      })

      channels.push(channel)
    }

    channelsRef.current = channels
    configsKeyRef.current = currentKey

    return () => {
      for (const ch of channelsRef.current) {
        const name = ch.topic || 'unknown'
        logger.debug('realtimeManager', `Removing channel: ${name}`)
        try { supabase.removeChannel(ch) } catch (err) {
          logger.error('realtimeManager', `Error removing channel ${name}`, { error: String(err) })
        }
      }
      channelsRef.current = []
    }
  }, [currentKey, queryClient])

  return null
}

export function useSharedSubscription(configs: SubscribeEntry[]) {
  const channelsRef = useRef<RealtimeChannel[]>([])

  const configsKey = configs.map(c => `${c.table}|${c.event ?? '*'}|${c.filter ?? ''}`).join('||')

  useEffect(() => {
    if (!isSupabaseAvailable) return
    if (configs.length === 0) return

    const channels: RealtimeChannel[] = []

    for (let i = 0; i < configs.length; i++) {
      const { table, event = '*', filter, callback } = configs[i]
      const filterStr = filter || undefined
      const channelName = generateChannelName('sub', table)
      const channel = supabase.channel(channelName)

      logger.debug('realtimeManager', `Channel created: ${channelName}`)

      channel.on(
        'postgres_changes' as any,
        { event, schema: 'public', table, filter: filterStr },
        (payload: any) => {
          try {
            callback(payload)
          } catch (err) {
            logger.error('useSharedSubscription', `Callback error for ${table}`, { error: String(err) })
          }
        }
      )

      channel.subscribe((status: string) => {
        if (status === 'SUBSCRIBED') {
          logger.debug('realtimeManager', `Subscribed: ${channelName}`)
        }
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          logger.warn('realtimeManager', `Channel error: ${status} for ${channelName}`)
        }
      })

      channels.push(channel)
    }

    channelsRef.current = channels

    return () => {
      for (const ch of channelsRef.current) {
        const name = ch.topic || 'unknown'
        logger.debug('realtimeManager', `Removing channel: ${name}`)
        try { supabase.removeChannel(ch) } catch (err) {
          logger.error('realtimeManager', `Error removing channel ${name}`, { error: String(err) })
        }
      }
      channelsRef.current = []
    }
  }, [configsKey])

  return {
    cleanup: useCallback(() => {
      for (const ch of channelsRef.current) {
        const name = ch.topic || 'unknown'
        logger.debug('realtimeManager', `Cleanup removing channel: ${name}`)
        try { supabase.removeChannel(ch) } catch {}
      }
      channelsRef.current = []
    }, []),
    reconnect: useCallback(() => {
      // Supabase handles reconnection natively — no-op
    }, []),
  }
}
