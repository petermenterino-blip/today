import { appEnv } from './env'

export const features = {
  get edgeApproval(): boolean {
    return import.meta.env.VITE_ENABLE_EDGE_APPROVAL === 'true'
  },

  get transactionalProvisioning(): boolean {
    return import.meta.env.VITE_ENABLE_TRANSACTIONAL_PROVISIONING === 'true'
  },

  get environment(): string {
    return import.meta.env.VITE_APP_ENV || 'development'
  },

  get isStaging(): boolean {
    return appEnv.isStaging
  },

  get isProduction(): boolean {
    return appEnv.isProduction
  },

  get appName(): string {
    return 'Mentorino'
  },
}
