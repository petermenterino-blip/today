export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'critical';
export type LogContext = Record<string, unknown>;

const PREFIX = '[Mentorino]';

const SENSITIVE_KEYS = new Set([
  'password', 'secret', 'token', 'jwt', 'access_token', 'refresh_token',
  'api_key', 'apikey', 'authorization', 'auth', 'cookie', 'session',
  'private_key', 'privatekey', 'service_role_key',
]);

const SENSITIVE_PATTERNS = [
  /eyJ[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}/g,
  /Bearer\s+[a-zA-Z0-9_-]{20,}/gi,
  /(password|secret|token|api[_-]?key)[=:]["']?[^\s&"'`]+/gi,
];

function redactSensitiveValues(key: string): boolean {
  return SENSITIVE_KEYS.has(key.toLowerCase().replace(/[_-]/g, '_'));
}

function redactContext(context?: LogContext): LogContext | undefined {
  if (!context) return undefined;

  const safe: LogContext = {};
  for (const [key, value] of Object.entries(context)) {
    if (redactSensitiveValues(key)) {
      safe[key] = '[REDACTED]';
    } else if (typeof value === 'string' && value.length > 1000) {
      safe[key] = value.slice(0, 1000) + '... [truncated]';
    } else if (typeof value === 'string' && SENSITIVE_PATTERNS.some((p) => p.test(value))) {
      safe[key] = value.replace(
        /eyJ[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}/g,
        '[JWT REDACTED]'
      ).replace(
        /Bearer\s+[a-zA-Z0-9_-]{20,}/gi,
        'Bearer [REDACTED]'
      );
    } else {
      safe[key] = value;
    }
  }
  return safe;
}

const MAX_ERRORS_IN_MEMORY = 50;

function log(level: LogLevel, module: string, message: string, context?: LogContext) {
  const safeContext = redactContext(context);

  const entry = {
    timestamp: new Date().toISOString(),
    level,
    module,
    message,
    environment: import.meta.env.MODE || 'unknown',
    ...(safeContext ? { context: safeContext } : {}),
  };

  const prefix = `${PREFIX}[${module}]`;

  switch (level) {
    case 'critical':
      console.error(prefix, `[CRITICAL] ${message}`, safeContext ?? '');
      break;
    case 'error':
      console.error(prefix, message, safeContext ?? '');
      break;
    case 'warn':
      console.warn(prefix, message, safeContext ?? '');
      break;
    case 'debug':
      if (import.meta.env.DEV) {
        console.debug(prefix, message, safeContext ?? '');
      }
      break;
    default:
      console.log(prefix, message, safeContext ?? '');
  }

  if ((level === 'error' || level === 'critical') && typeof window !== 'undefined') {
    try {
      const existing = JSON.parse(sessionStorage.getItem('mentorino_errors') || '[]');
      existing.push(entry);
      while (existing.length > MAX_ERRORS_IN_MEMORY) existing.shift();
      sessionStorage.setItem('mentorino_errors', JSON.stringify(existing));
    } catch { }
  }
}

export const logger = {
  debug: (module: string, message: string, context?: LogContext) => log('debug', module, message, context),
  info: (module: string, message: string, context?: LogContext) => log('info', module, message, context),
  warn: (module: string, message: string, context?: LogContext) => log('warn', module, message, context),
  error: (module: string, message: string, context?: LogContext) => log('error', module, message, context),
  critical: (module: string, message: string, context?: LogContext) => log('critical', module, message, context),

  getRecentErrors: (): Record<string, unknown>[] => {
    try {
      return JSON.parse(sessionStorage.getItem('mentorino_errors') || '[]');
    } catch {
      return [];
    }
  },

  clearRecentErrors: (): void => {
    try {
      sessionStorage.removeItem('mentorino_errors');
    } catch { }
  },
};
