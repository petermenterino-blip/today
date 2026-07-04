import { useEffect, useRef, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
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

type ChannelSub = {
  channel: ReturnType<typeof supabase.channel>
  tables: Set<string>
  refCount: number
}

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const isSupabaseAvailable = !!(supabaseUrl && import.meta.env.VITE_SUPABASE_ANON_KEY)

function makeChannelKey(table: string, filter?: string): string {
  return filter ? `${table}|${filter}` : table
}

const sharedChannels = new Map<string, ChannelSub>()

function getOrCreateChannel(table: string, filter?: { column: string; value: string }): ReturnType<typeof supabase.channel> {
  const filterStr = filter ? `${filter.column}=eq.${filter.value}` : undefined
  const key = makeChannelKey(table, filterStr)
  const existing = sharedChannels.get(key)
  if (existing) {
    existing.refCount++
    return existing.channel
  }
  const channelName = `rt-shared-${key}-${crypto.randomUUID().slice(0, 8)}`
  const channel = supabase.channel(channelName)
  sharedChannels.set(key, { channel, tables: new Set([table]), refCount: 1 })
  return channel
}

function releaseChannel(table: string, filter?: { column: string; value: string }) {
  const filterStr = filter ? `${filter.column}=eq.${filter.value}` : undefined
  const key = makeChannelKey(table, filterStr)
  const entry = sharedChannels.get(key)
  if (!entry) return
  entry.refCount--
  if (entry.refCount <= 0) {
    try { supabase.removeChannel(entry.channel) } catch {}
    sharedChannels.delete(key)
  }
}

export function getActiveChannelCount(): number {
  return sharedChannels.size
}

export function useSharedRealtimeData(configs: ChannelEntry[]) {
  const queryClient = useQueryClient()
  const channelsRef = useRef<{ key: string; channel: ReturnType<typeof supabase.channel> }[]>([])
  const configsRef = useRef(configs)
  configsRef.current = configs

  const setupChannels = useCallback(() => {
    for (const ch of channelsRef.current) {
      releaseChannel(
        ch.key.includes('|') ? ch.key.split('|')[0] : ch.key,
        undefined
      )
    }
    channelsRef.current = []

    const channels = configsRef.current.map(({ table, queryKey, filter }) => {
      const filterStr = filter ? `${filter.column}=eq.${filter.value}` : undefined
      const key = makeChannelKey(table, filterStr)
      const channel = getOrCreateChannel(table, filter)

      channel.on(
        'postgres_changes' as any,
        { event: '*', schema: 'public', table, filter: filterStr },
        () => {
          try {
            queryClient.invalidateQueries({ queryKey })
          } catch (err) {
            logger.error('useSharedRealtimeData', `Invalidation error for ${table}`, { error: String(err) })
          }
        }
      ).subscribe((status: string) => {
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          logger.warn('useSharedRealtimeData', `Channel ${table} error: ${status}`)
        }
      })

      channelsRef.current.push({ key, channel })
      return channel
    })
  }, [queryClient])

  useEffect(() => {
    if (!isSupabaseAvailable) return
    if (configs.length === 0) return

    setupChannels()

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        setupChannels()
      }
    }

    const handleOnline = () => {
      setupChannels()
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('online', handleOnline)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('online', handleOnline)
      for (const ch of channelsRef.current) {
        releaseChannel(
          ch.key.includes('|') ? ch.key.split('|')[0] : ch.key,
          undefined
        )
      }
      channelsRef.current = []
    }
  }, [setupChannels])

  return null
}

export function useSharedSubscription(configs: SubscribeEntry[]) {
  const channelsRef = useRef<{ key: string; channel: ReturnType<typeof supabase.channel> }[]>([])
  const configsRef = useRef(configs)
  configsRef.current = configs

  const setupChannels = useCallback(() => {
    for (const ch of channelsRef.current) {
      releaseChannel(ch.key, undefined)
    }
    channelsRef.current = []

    const channels = configsRef.current.map(({ table, event = '*', filter, callback }, idx) => {
      const key = makeChannelKey(table, filter)
      const channel = getOrCreateChannel(table, undefined)

      channel.on(
        'postgres_changes' as any,
        { event, schema: 'public', table, filter },
        (payload: any) => {
          try {
            callback(payload)
          } catch (err) {
            logger.error('useSharedSubscription', `Callback error for ${table}`, { error: String(err) })
          }
        }
      ).subscribe((status: string) => {
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          logger.warn('useSharedSubscription', `Channel ${table} error: ${status}`)
        }
      })

      channelsRef.current.push({ key, channel })
      return channel
    })
  }, [])

  useEffect(() => {
    if (configs.length === 0) return
    setupChannels()

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        setupChannels()
      }
    }

    const handleOnline = () => {
      setupChannels()
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('online', handleOnline)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('online', handleOnline)
      for (const ch of channelsRef.current) {
        releaseChannel(ch.key, undefined)
      }
      channelsRef.current = []
    }
  }, [setupChannels])

  return {
    cleanup: useCallback(() => {
      for (const ch of channelsRef.current) {
        releaseChannel(ch.key, undefined)
      }
      channelsRef.current = []
    }, []),
    reconnect: useCallback(() => {
      setupChannels()
    }, [setupChannels]),
  }
}
