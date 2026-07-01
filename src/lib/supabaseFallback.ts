import { isNetworkError } from './errorHandler';

type FallbackCache<T> = { data: T; timestamp: number };

const cache = new Map<string, FallbackCache<any>>();
const CACHE_TTL = 5 * 60 * 1000;

function getFromCache<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > CACHE_TTL) {
    cache.delete(key);
    return null;
  }
  return entry.data;
}

function setCache<T>(key: string, data: T): void {
  cache.set(key, { data, timestamp: Date.now() });
}

export async function safeQuery<T>(
  name: string,
  fn: () => PromiseLike<{ data: T | null; error: any }>,
  fallback: T,
  cacheKey?: string,
): Promise<{ data: T | null; error: string | null }> {
  try {
    const result = await fn();
    if (result.error) {
      if (isNetworkError(result.error)) {
        console.warn(`[${name}] Supabase network error, using fallback`, result.error);
        if (cacheKey) {
          const cached = getFromCache<T>(cacheKey);
          if (cached) return { data: cached, error: 'Working offline — showing cached data.' };
        }
        return { data: fallback, error: 'Unable to connect. Please check your connection.' };
      }
      return { data: null, error: result.error.message || result.error };
    }
    if (cacheKey && result.data !== null) {
      setCache(cacheKey, result.data);
    }
    return { data: result.data, error: null };
  } catch (err: any) {
    console.warn(`[${name}] Unexpected error, using fallback`, err);
    if (cacheKey) {
      const cached = getFromCache<T>(cacheKey);
      if (cached) return { data: cached, error: 'Showing cached data.' };
    }
    return { data: fallback, error: err?.message || 'An unexpected error occurred.' };
  }
}

export async function safeMutate<T>(
  name: string,
  fn: () => PromiseLike<{ data: T | null; error: any }>,
  invalidateCacheKey?: string,
): Promise<{ data: T | null; error: string | null }> {
  try {
    const result = await fn();
    if (result.error) {
      if (isNetworkError(result.error)) {
        return { data: null, error: 'Unable to connect. Changes could not be saved.' };
      }
      return { data: null, error: result.error.message || result.error };
    }
    if (invalidateCacheKey) {
      cache.delete(invalidateCacheKey);
    }
    return { data: result.data, error: null };
  } catch (err: any) {
    return { data: null, error: err?.message || 'An unexpected error occurred.' };
  }
}
