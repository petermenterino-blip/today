import { useSharedRealtimeData } from '../lib/realtimeManager'

interface RealtimeDataConfig {
  table: string
  queryKey: string[]
  filter?: { column: string; value: string }
}

export const useRealtimeData = (configs: RealtimeDataConfig[]) => {
  return useSharedRealtimeData(configs)
}
