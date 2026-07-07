# Health Checks

## Overview

Mentorino provides a runtime health check system that verifies all critical services:

- Database (Supabase PostgreSQL)
- Storage (Supabase Storage buckets)
- Authentication (Supabase Auth)
- Edge Functions (Supabase Functions)
- Realtime (Supabase Realtime)
- Email (Resend via Edge Function)

## Usage

### Run Health Check

```typescript
import { runHealthCheck } from '../lib/healthCheck';

const result = await runHealthCheck();
console.log(result.summary);
// "All systems operational" or "DEGRADED: realtime (degraded: ...)"
```

### Health Check Result

```typescript
interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  duration: number;
  components: {
    database: ComponentHealth;
    storage: ComponentHealth;
    auth: ComponentHealth;
    edge_functions: ComponentHealth;
    realtime: ComponentHealth;
    email: ComponentHealth;
  };
  summary: string;
}
```

### Component Health

```typescript
interface ComponentHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  latency: number;
  message: string;
  error?: string;
}
```

## Status Interpretation

| Status | Meaning |
|--------|---------|
| `healthy` | All components operational |
| `degraded` | Non-critical components have issues (edge functions not deployed, email down) |
| `unhealthy` | Critical components are down (database, auth) |

## Integration Points

### Manual Health Check

Access the health check by importing and running:

```typescript
const health = await runHealthCheck();
if (health.status === 'unhealthy') {
  // Alert operations team
}
```

### Startup Integration

The production guard at `src/lib/productionGuard.ts` runs environment validation on startup. For full health checks, call:

```typescript
import { runHealthCheck } from '../lib/healthCheck';

runHealthCheck().then(result => {
  if (result.status !== 'healthy') {
    console.warn('Post-deployment health check:', result.summary);
  }
});
```

## Monitoring Recommendations

1. Run health check every 5 minutes via a cron job
2. Alert if status is `unhealthy` for 2+ consecutive checks
3. Alert if any component latency exceeds 5000ms
4. Log all health check results for trend analysis

## Troubleshooting

| Symptom | Likely Cause | Action |
|---------|-------------|--------|
| Database unhealthy | Network issue or credentials wrong | Check Supabase Dashboard, verify URL/key |
| Storage missing buckets | Migration incomplete | Run storage bucket creation scripts |
| Edge Functions unreachable | Not deployed | Run `supabase functions deploy` |
| Realtime degraded | Not enabled on tables | Enable Realtime in Supabase Dashboard |
| Email degraded | RESEND_API_KEY not set | Set API key in edge function secrets |
