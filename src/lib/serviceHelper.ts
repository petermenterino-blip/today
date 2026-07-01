import { interpretError, isNetworkError } from './errorHandler';

export function handleError<T>(error: any, fallbackData: T | null = null): { data: T | null; error: string | null } {
  if (!error) return { data: fallbackData, error: null };

  if (isNetworkError(error)) {
    return { data: fallbackData, error: 'Unable to connect. Please check your internet connection.' };
  }

  return { data: fallbackData, error: interpretError(error) };
}

export function withError<T>(fn: () => T, fallbackData: T | null = null): { data: T | null; error: string | null } {
  try {
    return { data: fn(), error: null };
  } catch (err: any) {
    return handleError(err, fallbackData);
  }
}
