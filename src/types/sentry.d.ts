declare module '@sentry/react' {
  export interface SentryOptions {
    dsn: string;
    environment?: string;
    tracesSampleRate?: number;
  }
  export function init(options: SentryOptions): void;
}