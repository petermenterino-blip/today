type LogLevel = 'info' | 'warn' | 'error' | 'debug';
type LogContext = Record<string, unknown>;

const PREFIX = '[Mentorino]';

function log(level: LogLevel, module: string, message: string, context?: LogContext) {
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    module,
    message,
    ...(context ? { context } : {}),
  };

  const prefix = `${PREFIX}[${module}]`;

  switch (level) {
    case 'error':
      console.error(prefix, message, context ?? '');
      break;
    case 'warn':
      console.warn(prefix, message, context ?? '');
      break;
    case 'debug':
      console.debug(prefix, message, context ?? '');
      break;
    default:
      console.log(prefix, message, context ?? '');
  }

  if (level === 'error' && typeof window !== 'undefined') {
    try {
      const existing = JSON.parse(sessionStorage.getItem('mentorino_errors') || '[]');
      existing.push(entry);
      if (existing.length > 50) existing.shift();
      sessionStorage.setItem('mentorino_errors', JSON.stringify(existing));
    } catch {}
  }
}

export const logger = {
  info: (module: string, message: string, context?: LogContext) => log('info', module, message, context),
  warn: (module: string, message: string, context?: LogContext) => log('warn', module, message, context),
  error: (module: string, message: string, context?: LogContext) => log('error', module, message, context),
  debug: (module: string, message: string, context?: LogContext) => log('debug', module, message, context),
};
