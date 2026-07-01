/// <reference path="../types/sentry.d.ts" />

const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN;

export const initSentry = (): void => {
  if (!SENTRY_DSN) return;
  try {
    import('@sentry/react').then((Sentry) => {
      Sentry.init({
        dsn: SENTRY_DSN,
        environment: import.meta.env.MODE,
        tracesSampleRate: 0.1,
      });
    });
  } catch {
    // Sentry not available
  }
};