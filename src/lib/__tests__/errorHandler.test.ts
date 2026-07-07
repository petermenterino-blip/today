import { describe, it, expect, vi, beforeEach } from 'vitest';
import { interpretError, analyzeError, isNetworkError, isPermissionError, createAppError } from '../errorHandler';

vi.mock('../logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

describe('interpretError', () => {
  it('returns empty string for null input', () => {
    expect(interpretError(null)).toBe('');
  });

  it('returns default message for undefined-like input', () => {
    expect(interpretError({} as any)).toBe('An unexpected error occurred. Please try again.');
  });

  it('maps known error codes to user-friendly messages', () => {
    expect(interpretError({ code: 'PGRST301' })).toBe('You do not have permission to perform this action. Please contact a mentor.');
    expect(interpretError({ code: 'PGRST116' })).toBe('The requested resource was not found.');
    expect(interpretError({ code: '23505' })).toBe('This record already exists.');
    expect(interpretError({ code: '42501' })).toBe('Permission denied. Your account may not have access to this resource.');
    expect(interpretError({ code: 'auth/user-not-found' })).toBe('No account found with this email address.');
    expect(interpretError({ code: 'auth/wrong-password' })).toBe('Invalid email or password.');
    expect(interpretError({ code: 'auth/email-already-in-use' })).toBe('An account with this email already exists.');
    expect(interpretError({ code: 'auth/weak-password' })).toBe('Password should be at least 6 characters.');
    expect(interpretError({ code: 'auth/invalid-credential' })).toBe('Invalid email or password.');
    expect(interpretError({ code: 'auth/too-many-requests' })).toBe('Too many attempts. Please try again later.');
    expect(interpretError({ code: 'auth/session-expired' })).toBe('Your session has expired. Please log in again.');
  });

  it('matches permission denied in message text', () => {
    const result = interpretError({ message: 'permission denied for table profiles' });
    expect(result).toBe('You do not have permission to perform this action. Please contact a mentor.');

  });

  it('should return the error message when no patterns match', () => {
    const result = interpretError({ message: 'Unknown error' });
    expect(result).toBe('Unknown error');
  });

  it('matches network errors in message text', () => {
    expect(interpretError({ message: 'Failed to fetch' })).toBe('Unable to connect to the server. Please check your internet connection.');
    expect(interpretError({ message: 'NetworkError' })).toBe('Unable to connect to the server. Please check your internet connection.');
    expect(interpretError({ message: 'network timeout' })).toBe('Unable to connect to the server. Please check your internet connection.');
  });

  it('matches timeout errors', () => {
    expect(interpretError({ message: 'Request timed out' })).toBe('The request timed out. Please try again.');
    expect(interpretError({ message: 'timeout of 5000ms exceeded' })).toBe('The request timed out. Please try again.');
  });

  it('matches JWT/session errors', () => {
    expect(interpretError({ message: 'JWT expired' })).toBe('Your session has expired. Please log in again.');
    expect(interpretError({ message: 'invalid token' })).toBe('Your session has expired. Please log in again.');
    expect(interpretError({ message: 'session not found' })).toBe('Your session has expired. Please log in again.');
  });

  it('matches duplicate key errors', () => {
    expect(interpretError({ message: 'duplicate key value violates unique constraint' })).toBe('A record with this information already exists.');
  });

  it('matches not found errors', () => {
    expect(interpretError({ message: 'relation "profiles" does not exist' })).toBe('The requested resource was not found.');
  });

  it('matches rate limit errors', () => {
    expect(interpretError({ message: 'rate limit exceeded' })).toBe('Too many requests. Please wait a moment and try again.');
    expect(interpretError({ message: 'Too many requests' })).toBe('Too many requests. Please wait a moment and try again.');
  });

  it('returns the message for unknown errors', () => {
    expect(interpretError({ message: 'Something unexpected happened' })).toBe('Something unexpected happened');
  });

  it('handles string input', () => {
    expect(interpretError('Direct string error')).toBe('Direct string error');
  });

  it('handles network error string', () => {
    expect(interpretError('NetworkError')).toBe('Unable to connect to the server. Please check your internet connection.');
  });
});

describe('analyzeError', () => {
  it('classifies network errors', () => {
    const result = analyzeError({ message: 'Failed to fetch' });
    expect(result.isNetwork).toBe(true);
    expect(result.isPermission).toBe(false);
    expect(result.isAuth).toBe(false);
    expect(result.recoverable).toBe(true);
  });

  it('classifies permission errors', () => {
    const result = analyzeError({ code: '42501', message: 'permission denied' });
    expect(result.isPermission).toBe(true);
    expect(result.isNetwork).toBe(false);
  });

  it('classifies RLS violation as permission error', () => {
    const result = analyzeError({ message: 'violates row-level security' });
    expect(result.isPermission).toBe(true);
  });

  it('classifies auth errors', () => {
    const result = analyzeError({ code: 'auth/invalid-credential' });
    expect(result.isAuth).toBe(true);
    expect(result.isNetwork).toBe(false);
  });

  it('classifies JWT errors as auth', () => {
    const result = analyzeError({ message: 'jwt expired' });
    expect(result.isAuth).toBe(true);
  });

  it('marks fatal errors as non-recoverable', () => {
    const result = analyzeError({ code: '42P01' });
    expect(result.recoverable).toBe(false);
  });

  it('marks fatal message as non-recoverable', () => {
    const result = analyzeError({ message: 'Fatal error occurred' });
    expect(result.recoverable).toBe(false);
  });
});

describe('isNetworkError', () => {
  it('returns true for network errors', () => {
    expect(isNetworkError({ message: 'Failed to fetch' })).toBe(true);
  });

  it('returns false for non-network errors', () => {
    expect(isNetworkError({ message: 'permission denied' })).toBe(false);
  });
});

describe('isPermissionError', () => {
  it('returns true for permission errors', () => {
    expect(isPermissionError({ code: '42501' })).toBe(true);
  });

  it('returns false for non-permission errors', () => {
    expect(isPermissionError({ message: 'not found' })).toBe(false);
  });
});

describe('createAppError', () => {
  it('creates a safe error with default values', () => {
    const err = createAppError('Something went wrong');
    expect(err.message).toBe('Something went wrong');
    expect(err.userMessage).toBe('Something went wrong');
    expect(err.isNetwork).toBe(false);
    expect(err.isPermission).toBe(false);
    expect(err.isAuth).toBe(false);
    expect(err.recoverable).toBe(true);
  });

  it('creates a safe error with known code', () => {
    const err = createAppError('Duplicate', { code: '23505' });
    expect(err.userMessage).toBe('This record already exists.');
  });

  it('marks error as non-recoverable', () => {
    const err = createAppError('Fatal', { recoverable: false });
    expect(err.recoverable).toBe(false);
  });
});
