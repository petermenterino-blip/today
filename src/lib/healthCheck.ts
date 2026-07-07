import { supabase } from './supabase';
import { logger } from './logger';

export type HealthStatus = 'healthy' | 'degraded' | 'unhealthy';
export type HealthComponent = 'database' | 'storage' | 'auth' | 'edge_functions' | 'realtime' | 'email';

export interface HealthCheckResult {
  status: HealthStatus;
  timestamp: string;
  duration: number;
  components: Record<HealthComponent, ComponentHealth>;
  summary: string;
}

export interface ComponentHealth {
  status: HealthStatus;
  latency: number;
  message: string;
  error?: string;
}

async function checkDatabase(): Promise<ComponentHealth> {
  const start = performance.now();
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .limit(1);

    const latency = Math.round(performance.now() - start);

    if (error) {
      return {
        status: 'unhealthy',
        latency,
        message: 'Database query failed',
        error: error.message,
      };
    }

    return {
      status: 'healthy',
      latency,
      message: `Database reachable (${latency}ms)`,
    };
  } catch (err: unknown) {
    const latency = Math.round(performance.now() - start);
    return {
      status: 'unhealthy',
      latency,
      message: 'Database unreachable',
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

async function checkStorage(): Promise<ComponentHealth> {
  const start = performance.now();
  try {
    const { data: buckets, error } = await supabase.storage.listBuckets();
    const latency = Math.round(performance.now() - start);

    if (error) {
      return {
        status: 'unhealthy',
        latency,
        message: 'Storage API call failed',
        error: error.message,
      };
    }

    const expectedBuckets = ['profile-avatars', 'student-documents', 'mentor-resources', 'gallery-images'];
    const existing = buckets.map((b) => b.name);
    const missing = expectedBuckets.filter((b) => !existing.includes(b));

    if (missing.length > 0) {
      return {
        status: 'degraded',
        latency,
        message: `Storage reachable but missing buckets: ${missing.join(', ')}`,
      };
    }

    return {
      status: 'healthy',
      latency,
      message: `Storage reachable (${latency}ms), ${buckets.length} buckets`,
    };
  } catch (err: unknown) {
    const latency = Math.round(performance.now() - start);
    return {
      status: 'unhealthy',
      latency,
      message: 'Storage unreachable',
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

async function checkAuth(): Promise<ComponentHealth> {
  const start = performance.now();
  try {
    const { data, error } = await supabase.auth.getSession();
    const latency = Math.round(performance.now() - start);

    if (error) {
      return {
        status: 'unhealthy',
        latency,
        message: 'Auth service error',
        error: error.message,
      };
    }

    return {
      status: 'healthy',
      latency,
      message: `Auth reachable (${latency}ms)${data.session ? ', active session found' : ', no active session'}`,
    };
  } catch (err: unknown) {
    const latency = Math.round(performance.now() - start);
    return {
      status: 'unhealthy',
      latency,
      message: 'Auth service unreachable',
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

async function checkEdgeFunctions(): Promise<ComponentHealth> {
  const start = performance.now();
  try {
    const { error } = await supabase.functions.invoke('gemini', {
      body: { type: 'health', prompt: 'ping' },
      headers: { 'X-Health-Check': 'true' },
    });
    const latency = Math.round(performance.now() - start);

    if (error) {
      if (error.message?.includes('not found') || error.message?.includes('404')) {
        return {
          status: 'degraded',
          latency,
          message: 'Edge Functions endpoint reachable but gemini function may not be deployed',
          error: error.message,
        };
      }
      return {
        status: 'degraded',
        latency,
        message: 'Edge Functions responded with error',
        error: error.message,
      };
    }

    return {
      status: 'healthy',
      latency,
      message: `Edge Functions reachable (${latency}ms)`,
    };
  } catch (err: unknown) {
    const latency = Math.round(performance.now() - start);
    return {
      status: 'degraded',
      latency,
      message: 'Edge Functions unreachable (may not be deployed)',
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

async function checkRealtime(): Promise<ComponentHealth> {
  const start = performance.now();
  try {
    const channel = supabase.channel('health-check');
    const status = await new Promise<string>((resolve) => {
      const timeout = setTimeout(() => resolve('TIMEOUT'), 5000);
      channel.subscribe((s: string) => {
        clearTimeout(timeout);
        resolve(s);
      });
    });

    const latency = Math.round(performance.now() - start);

    try { supabase.removeChannel(channel); } catch { }

    if (status === 'SUBSCRIBED') {
      return {
        status: 'healthy',
        latency,
        message: `Realtime connected (${latency}ms)`,
      };
    }

    if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
      return {
        status: 'degraded',
        latency,
        message: `Realtime channel status: ${status}`,
      };
    }

    return {
      status: 'degraded',
      latency,
      message: `Realtime unexpected status: ${status}`,
    };
  } catch (err: unknown) {
    const latency = Math.round(performance.now() - start);
    return {
      status: 'unhealthy',
      latency,
      message: 'Realtime unreachable',
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

async function checkEmail(): Promise<ComponentHealth> {
  const start = performance.now();
  try {
    const { error } = await supabase.functions.invoke('resend', {
      body: { template: 'health_check', to: 'health@mentorino.app', data: {} },
      headers: { 'X-Health-Check': 'true' },
    });
    const latency = Math.round(performance.now() - start);

    if (error) {
      if (error.message?.includes('not found') || error.message?.includes('404')) {
        return {
          status: 'degraded',
          latency,
          message: 'Email function may not be deployed',
          error: error.message,
        };
      }
      return {
        status: 'degraded',
        latency,
        message: 'Email function responded with error',
        error: error.message,
      };
    }

    return {
      status: 'healthy',
      latency,
      message: `Email function reachable (${latency}ms)`,
    };
  } catch (err: unknown) {
    const latency = Math.round(performance.now() - start);
    return {
      status: 'degraded',
      latency,
      message: 'Email function unreachable',
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function runHealthCheck(): Promise<HealthCheckResult> {
  const start = performance.now();

  const [database, storage, auth, edge_functions, realtime, email] = await Promise.allSettled([
    checkDatabase(),
    checkStorage(),
    checkAuth(),
    checkEdgeFunctions(),
    checkRealtime(),
    checkEmail(),
  ]);

  const components: Record<HealthComponent, ComponentHealth> = {
    database: database.status === 'fulfilled' ? database.value : { status: 'unhealthy', latency: 0, message: 'Check failed', error: 'Promise rejected' },
    storage: storage.status === 'fulfilled' ? storage.value : { status: 'unhealthy', latency: 0, message: 'Check failed', error: 'Promise rejected' },
    auth: auth.status === 'fulfilled' ? auth.value : { status: 'unhealthy', latency: 0, message: 'Check failed', error: 'Promise rejected' },
    edge_functions: edge_functions.status === 'fulfilled' ? edge_functions.value : { status: 'unhealthy', latency: 0, message: 'Check failed', error: 'Promise rejected' },
    realtime: realtime.status === 'fulfilled' ? realtime.value : { status: 'unhealthy', latency: 0, message: 'Check failed', error: 'Promise rejected' },
    email: email.status === 'fulfilled' ? email.value : { status: 'unhealthy', latency: 0, message: 'Check failed', error: 'Promise rejected' },
  };

  const allHealthy = Object.values(components).every((c) => c.status === 'healthy');
  const anyUnhealthy = Object.values(components).some((c) => c.status === 'unhealthy');
  const status: HealthStatus = allHealthy ? 'healthy' : anyUnhealthy ? 'unhealthy' : 'degraded';

  const totalDuration = Math.round(performance.now() - start);

  const unhealthyComponents = Object.entries(components)
    .filter(([_, c]) => c.status !== 'healthy')
    .map(([name, c]) => `${name} (${c.status}: ${c.message})`);

  const summary = unhealthyComponents.length > 0
    ? `${status.toUpperCase()}: ${unhealthyComponents.join('; ')}`
    : 'All systems operational';

  const result: HealthCheckResult = {
    status,
    timestamp: new Date().toISOString(),
    duration: totalDuration,
    components,
    summary,
  };

  if (status !== 'healthy') {
    logger.warn('HealthCheck', summary, { components });
  }

  return result;
}

export function getHealthEmoji(component: ComponentHealth): string {
  switch (component.status) {
    case 'healthy': return '\u2705';
    case 'degraded': return '\u26A0\uFE0F';
    case 'unhealthy': return '\u274C';
  }
}

export function isServiceHealthy(check: ComponentHealth): boolean {
  return check.status === 'healthy' || check.status === 'degraded';
}
