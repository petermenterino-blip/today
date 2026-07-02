const KNOWN_CODES: Record<string, string> = {
  'PGRST301': 'You do not have permission to perform this action. Please contact an admin.',
  'PGRST116': 'The requested resource was not found.',
  'PGRST104': 'The server could not process your request. Please try again.',
  '42501': 'Permission denied. Your account may not have access to this resource.',
  '23505': 'This record already exists.',
  '23503': 'This operation references a record that does not exist.',
  '42P01': 'The visitor_bookings table does not exist. Please run the database migration (018_visitor_bookings.sql) in your Supabase SQL Editor to create it.',
  'auth/user-not-found': 'No account found with this email address.',
  'auth/wrong-password': 'Invalid email or password.',
  'auth/email-already-in-use': 'An account with this email already exists.',
  'auth/weak-password': 'Password should be at least 6 characters.',
  'auth/invalid-credential': 'Invalid email or password.',
  'auth/too-many-requests': 'Too many attempts. Please try again later.',
  'auth/network-request-failed': 'Network error. Please check your connection.',
};

export function interpretError(error: { code?: string; message?: string } | string | null): string {
  if (!error) return '';

  const message = typeof error === 'string' ? error : error.message || '';
  const code = typeof error === 'string' ? '' : error.code || '';

  if (code && KNOWN_CODES[code]) return KNOWN_CODES[code];

  if (message.includes('permission denied') || message.includes('violates row-level security')) {
    return 'You do not have permission to perform this action. Please contact an admin.';
  }
  if (message.includes('Failed to fetch') || message.includes('NetworkError') || message.includes('network')) {
    return 'Unable to connect to the server. Please check your internet connection.';
  }
  if (message.includes('timeout') || message.includes('Timed out')) {
    return 'The request timed out. Please try again.';
  }
  if (message.includes('JWT') || message.includes('jwt') || message.includes('token')) {
    return 'Your session has expired. Please log in again.';
  }
  if (message.includes('duplicate key') || message.includes('unique constraint')) {
    return 'A record with this information already exists.';
  }

  return message || 'An unexpected error occurred. Please try again.';
}

export function isNetworkError(error: unknown): boolean {
  const message = error instanceof Object ? (error as any)?.message || '' : String(error || '');
  return message.includes('Failed to fetch') || message.includes('NetworkError') || message.includes('network') || message.includes('ERR_CONNECTION');
}

export function isPermissionError(error: unknown): boolean {
  const msg = error instanceof Object ? (error as any)?.message || '' : String(error || '');
  const code = error instanceof Object ? (error as any)?.code || '' : '';
  return code === '42501' || code === 'PGRST301' || msg.includes('permission denied') || msg.includes('violates row-level security');
}
