import { logger } from './logger';

const KNOWN_CODES: Record<string, string> = {
  'PGRST301': 'You do not have permission to perform this action. Please contact a mentor.',
  'PGRST116': 'The requested resource was not found.',
  'PGRST104': 'The server could not process your request. Please try again.',
  '42501': 'Permission denied. Your account may not have access to this resource.',
  '23505': 'This record already exists.',
  '23503': 'This operation references a record that does not exist.',
  '42P01': 'A database table is missing. Please contact support.',
  'auth/user-not-found': 'No account found with this email address.',
  'auth/wrong-password': 'Invalid email or password.',
  'auth/email-already-in-use': 'An account with this email already exists.',
  'auth/weak-password': 'Password should be at least 6 characters.',
  'auth/invalid-credential': 'Invalid email or password.',
  'auth/too-many-requests': 'Too many attempts. Please try again later.',
  'auth/network-request-failed': 'Network error. Please check your connection.',
  'auth/email-not-confirmed': 'Please verify your email address before signing in.',
  'auth/session-expired': 'Your session has expired. Please log in again.',
};

export interface SafeError {
  message: string;
  userMessage: string;
  code?: string;
  isNetwork: boolean;
  isPermission: boolean;
  isAuth: boolean;
  recoverable: boolean;
}

export function interpretError(error: { code?: string; message?: string } | string | null): string {
  if (!error) return '';

  const message = typeof error === 'string' ? error : error.message || '';
  const code = typeof error === 'string' ? '' : error.code || '';

  if (code && KNOWN_CODES[code]) return KNOWN_CODES[code];

  const msgL = message.toLowerCase();

  if (msgL.includes('permission denied') || msgL.includes('violates row-level security')) {
    return 'You do not have permission to perform this action. Please contact a mentor.';
  }
  if (msgL.includes('failed to fetch') || msgL.includes('networkerror') || msgL.includes('network')) {
    return 'Unable to connect to the server. Please check your internet connection.';
  }
  if (msgL.includes('timeout') || msgL.includes('timed out')) {
    return 'The request timed out. Please try again.';
  }
  if (msgL.includes('jwt') || msgL.includes('token') || msgL.includes('session')) {
    return 'Your session has expired. Please log in again.';
  }
  if (msgL.includes('duplicate key') || msgL.includes('unique constraint')) {
    return 'A record with this information already exists.';
  }
  if (msgL.includes('not found') || msgL.includes('does not exist')) {
    return 'The requested resource was not found.';
  }
  if (msgL.includes('rate limit') || msgL.includes('too many')) {
    return 'Too many requests. Please wait a moment and try again.';
  }

  return message || 'An unexpected error occurred. Please try again.';
}

export function analyzeError(error: unknown): SafeError {
  const message = error instanceof Object ? (error as any)?.message || '' : String(error || '');
  const code = error instanceof Object ? String((error as any)?.code || (error as any)?.status || '') : '';
  const msgL = message.toLowerCase();

  const isNetwork = msgL.includes('failed to fetch') || msgL.includes('networkerror') || msgL.includes('network') || msgL.includes('err_connection');
  const isPermission = code === '42501' || code === 'PGRST301' || msgL.includes('permission denied') || msgL.includes('violates row-level security');
  const isAuth = code.startsWith('auth/') || msgL.includes('jwt') || msgL.includes('unauthorized') || msgL.includes('unauthenticated');

  let recoverable = true;
  if (code === '42P01') recoverable = false;
  if (msgL.includes('fatal')) recoverable = false;

  return {
    message,
    userMessage: interpretError(typeof error === 'object' ? { code, message } : error as string | null),
    code,
    isNetwork,
    isPermission,
    isAuth,
    recoverable,
  };
}

export function isNetworkError(error: unknown): boolean {
  return analyzeError(error).isNetwork;
}

export function isPermissionError(error: unknown): boolean {
  return analyzeError(error).isPermission;
}

export function captureAndLogError(
  module: string,
  operation: string,
  error: unknown,
  context?: Record<string, unknown>
): SafeError {
  const safe = analyzeError(error);

  logger.error(module, `${operation} failed`, {
    errorMessage: safe.message,
    errorCode: safe.code,
    isNetwork: safe.isNetwork,
    isPermission: safe.isPermission,
    ...context,
  });

  return safe;
}

export function createAppError(
  message: string,
  options?: { code?: string; recoverable?: boolean; context?: Record<string, unknown> }
): SafeError {
  const safe: SafeError = {
    message,
    userMessage: KNOWN_CODES[options?.code || ''] || message,
    code: options?.code,
    isNetwork: false,
    isPermission: false,
    isAuth: false,
    recoverable: options?.recoverable ?? true,
  };

  if (options?.context) {
    logger.warn('AppError', message, options.context);
  }

  return safe;
}
