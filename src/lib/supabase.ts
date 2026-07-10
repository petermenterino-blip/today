import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    'Supabase environment variables not set. ' +
    'Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.local'
  );
}

const POSTGREST_TIMEOUT = 15000;

class ConcurrencyLimiter {
  private running = 0;
  private queue: Array<() => void> = [];

  constructor(private max: number) {}

  async run<T>(fn: () => Promise<T>): Promise<T> {
    if (this.running >= this.max) {
      await new Promise<void>(resolve => this.queue.push(resolve));
    }
    this.running++;
    try {
      return await fn();
    } finally {
      this.running--;
      const next = this.queue.shift();
      if (next) next();
    }
  }
}

const queryLimiter = new ConcurrencyLimiter(5);

const client = createClient(
  supabaseUrl || 'http://localhost:54321',
  supabaseAnonKey || 'placeholder-key',
  {
    auth: {
      autoRefreshToken: true,
      detectSessionInUrl: true,
      persistSession: true,
    },
  }
);

// @ts-expect-error - rest is protected but this is the only way to intercept PostgREST calls
const originalRestFetch = client.rest.fetch.bind(client.rest);
// @ts-expect-error - rest is protected
client.rest.fetch = (url: any, opts: any) => {
  const result = queryLimiter.run(() => originalRestFetch(url, opts));
  return Promise.race([
    result,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`PostgREST query timed out after ${POSTGREST_TIMEOUT}ms`)), POSTGREST_TIMEOUT)
    ),
  ]);
};

export const supabase = client;
