export type AppEnvironment = 'development' | 'staging' | 'production'

function getEnv(): AppEnvironment {
  const env = import.meta.env.VITE_APP_ENV
  if (env === 'staging') return 'staging'
  if (env === 'production') return 'production'
  return 'development'
}

function isLocal(): boolean {
  return !import.meta.env.VITE_SUPABASE_URL
    || import.meta.env.VITE_SUPABASE_URL.includes('localhost')
    || import.meta.env.VITE_SUPABASE_URL.includes('placeholder')
}

export const appEnv = {
  get current(): AppEnvironment {
    return getEnv()
  },

  get isDevelopment(): boolean {
    return getEnv() === 'development'
  },

  get isStaging(): boolean {
    return getEnv() === 'staging'
  },

  get isProduction(): boolean {
    return getEnv() === 'production'
  },

  get isLocal(): boolean {
    return isLocal()
  },

  get isSupabaseConnected(): boolean {
    return !isLocal()
  },
}
