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

type ChannelSub = {
  channel: RealtimeChannel
  tables: Set<string>
  refCount: number
  subscribed: boolean
  handlers: Set<string>
}

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const isSupabaseAvailable = !!(supabaseUrl && import.meta.env.VITE_SUPABASE_ANON_KEY)

function makeChannelKey(table: string, filter?: string): string {
  return filter ? `${table}|${filter}` : table
}

const sharedChannels = new Map<string, ChannelSub>()

function getOrCreateChannel(table: string, filter?: { column: string; value: string }): { channel: RealtimeChannel; key: string } {
  const filterStr = filter ? `${filter.column}=eq.${filter.value}` : undefined
  const key = makeChannelKey(table, filterStr)
  const existing = sharedChannels.get(key)
  if (existing) {
    existing.refCount++
    return { channel: existing.channel, key }
  }
  const channelName = `rt-shared-${key}-${crypto.randomUUID().slice(0, 8)}`
  const channel = supabase.channel(channelName)
  sharedChannels.set(key, { channel, tables: new Set([table]), refCount: 1, subscribed: false, handlers: new Set() })
  return { channel, key }
}

function releaseChannel(key: string) {
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

function ensureSubscribed(entry: ChannelSub) {
  if (entry.subscribed) return
  entry.channel.subscribe((status: string) => {
    if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
      logger.warn('realtimeManager', `Channel error: ${status}`)
    }
  })
  entry.subscribed = true
}

function configsEqual(a: ChannelEntry[], b: ChannelEntry[]): boolean {
  if (a.length !== b.length) return false
  for (let i = 0; i < a.length; i++) {
    if (a[i].table !== b[i].table) return false
    if (a[i].queryKey.length !== b[i].queryKey.length) return false
    for (let j = 0; j < a[i].queryKey.length; j++) {
      if (a[i].queryKey[j] !== b[i].queryKey[j]) return false
    }
    if (Boolean(a[i].filter) !== Boolean(b[i].filter)) return false
    if (a[i].filter && b[i].filter && (a[i].filter!.column !== b[i].filter!.column || a[i].filter!.value !== b[i].filter!.value)) return false
  }
  return true
}

export function useSharedRealtimeData(configs: ChannelEntry[]) {
  const queryClient = useQueryClient()
  const keysRef = useRef<string[]>([])
  const configsRef = useRef(configs)
  const initializedRef = useRef(false)

  if (!initializedRef.current || !configsEqual(configsRef.current, configs)) {
    configsRef.current = configs
  }

  useEffect(() => {
    if (!isSupabaseAvailable) return
    const currentConfigs = configsRef.current
    if (currentConfigs.length === 0) return

    const keys: string[] = []

    for (const { table, queryKey, filter } of currentConfigs) {
      const { channel, key } = getOrCreateChannel(table, filter)
      const entry = sharedChannels.get(key)!

      const handlerId = `invalidate:${queryKey.join('|')}`
      if (!entry.handlers.has(handlerId)) {
        channel.on(
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
              logger.error('useSharedRealtimeData', `Invalidation error for ${table}`, { error: String(err) })
            }
          }
        )
        entry.handlers.add(handlerId)
      }

      ensureSubscribed(entry)
      keys.push(key)
    }

    keysRef.current = keys
    initializedRef.current = true

    return () => {
      for (const key of keysRef.current) {
        releaseChannel(key)
      }
      keysRef.current = []
    }
  }, [queryClient])

  return null
}

export function useSharedSubscription(configs: SubscribeEntry[]) {
  const keysRef = useRef<string[]>([])
  const configsRef = useRef(configs)
  configsRef.current = configs

  useEffect(() => {
    if (configs.length === 0) return

    const keys: string[] = []

    for (let i = 0; i < configsRef.current.length; i++) {
      const { table, event = '*', filter, callback } = configsRef.current[i]
      const filterStr = filter || undefined
      const key = makeChannelKey(table, filterStr)
      const { channel } = getOrCreateChannel(table, undefined)
      const entry = sharedChannels.get(key)!

      const handlerId = `cb_${i}`
      if (!entry.handlers.has(handlerId)) {
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
        )
        entry.handlers.add(handlerId)
      }

      ensureSubscribed(entry)
      keys.push(key)
    }

    keysRef.current = keys

    return () => {
      for (const key of keysRef.current) {
        releaseChannel(key)
      }
      keysRef.current = []
    }
  }, [])

  return {
    cleanup: useCallback(() => {
      for (const key of keysRef.current) {
        releaseChannel(key)
      }
      keysRef.current = []
    }, []),
    reconnect: useCallback(() => {
      // Supabase handles reconnection natively — no-op
    }, []),
  }
}
