import { useSharedSubscription } from '../lib/realtimeManager'

type RealtimeEvent = 'INSERT' | 'UPDATE' | 'DELETE' | '*'

interface RealtimeConfig {
  table: string
  event?: RealtimeEvent
  filter?: string
  callback: (payload: any) => void
}

export const useRealtime = (configs: RealtimeConfig[]) => {
  return useSharedSubscription(configs)
}
