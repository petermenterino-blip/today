import { validateEnvironment, getEnvSummary } from './envValidator';
import { logger } from './logger';

export type StartupStatus = 'ok' | 'warnings' | 'failed';

export interface StartupResult {
  status: StartupStatus;
  messages: string[];
  warnings: string[];
  errors: string[];
}

export function performStartupValidation(): StartupResult {
  const result: StartupResult = {
    status: 'ok',
    messages: [],
    warnings: [],
    errors: [],
  };

  const env = import.meta.env.VITE_APP_ENV || 'development';
  result.messages.push(`Environment: ${env}`);

  const envValidation = validateEnvironment();

  if (!envValidation.valid) {
    result.status = 'failed';
    for (const key of envValidation.missing) {
      const msg = `MISSING REQUIRED ENV: ${key}`;
      result.errors.push(msg);
      logger.critical('ProductionGuard', msg);
    }
    for (const msg of envValidation.invalid) {
      result.errors.push(msg);
      logger.critical('ProductionGuard', `Invalid env var: ${msg}`);
    }
  }

  for (const warning of envValidation.warnings) {
    result.warnings.push(warning);
    logger.warn('ProductionGuard', warning);
  }

  if (env === 'production' && result.status !== 'failed') {
    const envSummary = getEnvSummary();
    logger.info('ProductionGuard', 'Production environment validated', envSummary);
    result.messages.push('Production environment validated successfully');
  }

  if (env === 'production' && result.status === 'failed') {
    result.messages.push('FATAL: Required environment variables are missing or invalid. Application cannot start in production mode.');
  }

  if (result.warnings.length > 0) {
    if (result.status === 'ok') result.status = 'warnings';
  }

  return result;
}

export function shouldBlockStartup(result: StartupResult): boolean {
  if (result.status === 'failed') {
    const env = import.meta.env.VITE_APP_ENV || 'development';
    return env === 'production' || env === 'staging';
  }
  return false;
}
