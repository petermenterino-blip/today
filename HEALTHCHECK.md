# Health Check Reference

**App:** Mentorino  
**Last Updated:** 2026-07-06

The application provides a runtime health check that validates all 6 critical services in parallel. This is NOT a network-accessible HTTP endpoint — it is consumed programmatically within the app and via external monitoring scripts.

---

## 1. API (Programmatic)

```typescript
import { runHealthCheck } from './src/lib/healthCheck';

const result: HealthCheckResult = await runHealthCheck();
```

### Response Shape

```typescript
interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;        // ISO 8601
  duration: number;         // Total wall-clock time in ms
  components: {
    database:         ComponentHealth;
    storage:          ComponentHealth;
    auth:             ComponentHealth;
    edge_functions:   ComponentHealth;
    realtime:         ComponentHealth;
    email:            ComponentHealth;
  };
  summary: string;          // Human-readable status
}

interface ComponentHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  latency: number;          // ms per component
  message: string;
  error?: string;
}
```

### Sample Healthy Response

```json
{
  "status": "healthy",
  "timestamp": "2026-07-06T12:00:00.000Z",
  "duration": 2340,
  "components": {
    "database":       { "status": "healthy",   "latency": 120,  "message": "Database reachable (120ms)" },
    "storage":        { "status": "healthy",   "latency": 200,  "message": "Storage reachable (200ms), 4 buckets" },
    "auth":           { "status": "healthy",   "latency": 90,   "message": "Auth reachable (90ms), no active session" },
    "edge_functions": { "status": "healthy",   "latency": 450,  "message": "Edge Functions reachable (450ms)" },
    "realtime":       { "status": "healthy",   "latency": 800,  "message": "Realtime connected (800ms)" },
    "email":          { "status": "healthy",   "latency": 500,  "message": "Email function reachable (500ms)" }
  },
  "summary": "All systems operational"
}
```

---

## 2. Components Checked

| # | Component | Method | Critical | Degraded When |
|---|-----------|--------|----------|---------------|
| 1 | **Database** | `SELECT id FROM profiles LIMIT 1` | **Yes** | — |
| 2 | **Auth** | `supabase.auth.getSession()` | **Yes** | — |
| 3 | **Storage** | `storage.listBuckets()` | No | Missing expected buckets |
| 4 | **Edge Functions** | Invoke `gemini` with health payload | No | Function not deployed |
| 5 | **Realtime** | Subscribe to `health-check` channel (5s timeout) | No | Timeout / channel error |
| 6 | **Email** | Invoke `resend` with health payload | No | Function not deployed |

Critical components (`database`, `auth`): if either is `unhealthy`, overall status is `unhealthy`.  
Non-critical components: if any is `unhealthy` → overall `degraded`.

---

## 3. Status Interpretation

| Overall Status | Meaning | Action Required |
|---------------|---------|-----------------|
| `healthy` | All 6 components operational | None |
| `degraded` | Non-critical component(s) down (edge functions not deployed, email down, storage missing buckets) | Investigate within 4 hours |
| `unhealthy` | Database or Auth unreachable | **P0 incident — investigate immediately** |

---

## 4. External Monitoring Integration

### 4.1 GitHub Actions Scheduled Health Check

Add this workflow to `.github/workflows/health-check.yml`:

```yaml
name: Health Check
on:
  schedule:
    - cron: '*/5 * * * *'   # every 5 minutes
  workflow_dispatch:

jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - name: Run health check
        run: |
          npx tsx -e "
            const { runHealthCheck } = require('./src/lib/healthCheck');
            runHealthCheck().then(r => {
              console.log(JSON.stringify(r, null, 2));
              process.exit(r.status === 'unhealthy' ? 1 : 0);
            });
          "
      - name: Notify on failure
        if: failure()
        uses: slackapi/slack-github-action@v1
        with:
          payload: '{"text":"❌ Health check FAILED — mentoring platform may be down"}'
        env:
          SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK }}
```

### 4.2 Better Stack / Pingdom Integration

Use the application login page as a synthetic monitor:
- **URL:** `https://mentorino.app/`
- **Expected status:** 200
- **Check interval:** 1 minute
- **Alert after:** 2 consecutive failures

For deeper checks, deploy a lightweight Deno edge function that wraps the health check and exposes it at `/functions/v1/health`.

### 4.3 Prometheus / Grafana (Optional)

Export health metrics as Prometheus-style text:

```text
# HELP mentorino_health_status Overall platform health (1=healthy, 2=degraded, 3=unhealthy)
# TYPE mentorino_health_status gauge
mentorino_health_status{env="production"} 1

# HELP mentorino_component_latency_ms Per-component health check latency
# TYPE mentorino_component_latency_ms gauge
mentorino_component_latency_ms{component="database"} 120
mentorino_component_latency_ms{component="auth"} 90
mentorino_component_latency_ms{component="storage"} 200
```

---

## 5. Alert Thresholds

| Metric | Warning | Critical | Action |
|--------|---------|----------|--------|
| Overall health | `degraded` for 1 check | `degraded` for 3+ consecutive | Investigate |
| Overall health | — | `unhealthy` once | **Immediate P0** |
| Database latency | > 1000ms | > 3000ms | Check Supabase status |
| Auth latency | > 1000ms | > 3000ms | Check Supabase Auth |
| Any component latency | > 5000ms | — | Investigate slow dependency |
| Error rate (Sentry) | > 1% | > 5% | Check for regressions |

---

## 6. Troubleshooting

| Unhealthy Component | Likely Root Cause | Fix |
|--------------------|-------------------|-----|
| Database | Supabase project paused / credentials changed / network restricted | Verify in Supabase Dashboard, check `VITE_SUPABASE_URL` |
| Auth | Supabase Auth disabled / JWT secret rotated | Check Auth settings in Supabase Dashboard |
| Storage | Storage disabled / buckets deleted / RLS blocks listing | Verify `storage.listBuckets()` permissions |
| Edge Functions | Functions not deployed / function crashed | `supabase functions deploy <name>`, check logs |
| Realtime | Realtime not enabled on tables / Websocket blocked | Enable Replication in Supabase Dashboard |
| Email | `RESEND_API_KEY` expired / Resend account suspended | Check Resend Dashboard, rotate key |
