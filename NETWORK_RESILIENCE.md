# Network Resilience

**Date:** 2026-07-06  
**Component:** ConnectionContext (src/context/ConnectionContext.tsx), edgeFunctionService (src/services/edgeFunctionService.ts)

---

## 1. Offline Detection

| Mechanism | Implementation | Status |
|-----------|---------------|--------|
| Browser `online`/`offline` events | `window.addEventListener('online', ...)` + `('offline', ...)` | ✅ |
| Supabase health check | Polls `supabase.auth.getSession()` every 60s | ⚠️ **60s interval is too long** |
| Fallback detection | `edgeFunctionService` catches fetch errors | ✅ |

**Issue:** ConnectionContext polls health only every 60 seconds. If the network goes down, it takes up to 60s to detect.

---

## 2. Reconnection Strategy

| Mechanism | Implementation | Status |
|-----------|---------------|--------|
| React Query cache invalidation | `idleRecovery.invalidateStaleQueries()` on reconnect | ✅ |
| Debounced reconnect | 500ms delay before resetting state | ✅ |
| Passive mode | Updates status without re-render disruption | ✅ |

---

## 3. Edge Function Resilience

| Function | Timeout | Retry | Fallback |
|----------|---------|-------|----------|
| Gemini | 30s | None (streaming) | Returns error to client |
| Resend | 15s | None (stateless) | Returns error to caller |
| Approve-application | 60s | Max 3 retries (state machine) | Rollback + user notification |
| Scheduled | 30s | None | Silent failure |

---

## 4. Recommendations

| Priority | Action | Details |
|----------|--------|---------|
| MEDIUM | Reduce health check interval to 15-30s | Faster offline detection; trade off against request volume |
| LOW | Add retry to edgeFunctionService calls | Currently no client-side retry for Gemini/Resend calls |

---

## Summary

✅ **PASS** — Network resilience is decent. Offline detection works (60s poll + browser events). React Query cache invalidation on reconnect is well-implemented.
