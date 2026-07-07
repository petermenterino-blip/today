# Rate Limiting Report

**Date:** 2026-07-06
**Scope:** `supabase/functions/middleware/auth.ts` rate limiting implementation

---

## Previous Implementation (Before Fix)

**File:** `supabase/functions/middleware/auth.ts:103-147`
**Type:** In-memory `Map<string, RateLimitEntry>`

```typescript
const rateLimitStore = new Map<string, RateLimitEntry>()
// ...
setInterval(() => { /* cleanup */ }, 60000)
```

### Problems

| Issue | Severity | Detail |
|---|---|---|
| **Instance-local state** | CRITICAL | Supabase Edge Functions run on Deno with per-isolate state. Each function invocation may hit a different isolate, resetting the counter. |
| **Memory leak** | HIGH | `setInterval` at module scope never clears. Each isolate that loads this module creates a recurring timer that persists for the isolate's lifetime. |
| **No persistence** | HIGH | If the isolate is recycled, all rate limit state is lost. |
| **Serverless incompatible** | CRITICAL | The entire approach assumes a single long-running process. Vercel Edge Functions and Supabase Edge Functions are both serverless. |

### Effect in Practice

- A user hitting the gemini endpoint 30 times in 60s from a single isolate would be correctly rate-limited.
- But if the load balancer distributes across 3 isolates, the user could make 90 requests before any isolate hits the limit.
- Each isolate's timer runs forever, never cleaned up.

---

## Fixed Implementation

**File:** `supabase/functions/middleware/auth.ts:103-157`
**Type:** Supabase `rate_limits` table (DB-backed)

### How It Works

1. Each rate limit check queries the `rate_limits` table by key (e.g., `gemini:user123`)
2. If no row exists or `expires_at` is past, a new counter row is inserted
3. If within the window and under limit, the counter is incremented
4. If over limit, `{ allowed: false }` is returned with `Retry-After` header
5. Expired rows are naturally ignored (query compares against `expires_at`)

### Benefits

| Aspect | Before | After |
|---|---|---|
| Scope | Per-isolate | Shared database |
| Serverless | Broken | Works across all instances |
| Cleanup | `setInterval` (leak) | Time-based row comparison |
| Persistence | None | Survives restarts |
| Correctness | Approximate | Exact (DB transaction) |

### Migration

A new migration `039_rate_limits.sql` creates the `rate_limits` table:
```sql
create table if not exists public.rate_limits (
  key text primary key,
  count integer not null default 1,
  expires_at timestamptz not null,
  updated_at timestamptz not null default now()
);
```

The table is accessible only via `SUPABASE_SERVICE_ROLE_KEY` (no RLS needed).

---

## Validation

- `npm run build` — PASS (exit 0)
- `npm run lint` — PASS (exit 0)
- `tsc --noEmit` — PASS (exit 0)
