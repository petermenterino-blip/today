# Phase 3 Test Plan

**Date:** 2026-07-06
**Status:** Complete

---

## Unit Tests (edge function frontend service)

All tests in `src/services/__tests__/approveApplicationViaEdge.test.ts`:

### Phase 2 Tests (edge approval without transactional provisioning)

| # | Test | Type | Status |
|---|------|------|--------|
| 1 | Approves application successfully | Unit | ✅ |
| 2 | Returns error when Edge Function returns failure | Unit | ✅ |
| 3 | Returns error when Edge Function throws | Unit | ✅ |
| 4 | Returns generic error when no message | Unit | ✅ |
| 5 | Returns error on invoke failure | Unit | ✅ |
| 6 | Handles already processed response | Unit | ✅ |

### Phase 3 Tests (with transactional provisioning)

| # | Test | Type | Status |
|---|------|------|--------|
| 7 | Sends idempotencyKey when transactional enabled | Unit | ✅ |
| 8 | Handles ALREADY_PROCESSED from transactional | Unit | ✅ |
| 9 | Handles IN_PROGRESS conflict | Unit | ✅ |
| 10 | Handles MAX_RETRIES_EXCEEDED | Unit | ✅ |
| 11 | Handles RETRYABLE_ERROR | Unit | ✅ |
| 12 | Handles ROLLED_BACK state | Unit | ✅ |

### Legacy Fallback Tests

| # | Test | Type | Status |
|---|------|------|--------|
| 13 | Legacy path works when edge approval disabled | Unit | ✅ |

## Existing Application Service Tests (unchanged)

| # | Test | File | Status |
|---|------|------|--------|
| 1-9 | All existing applicationService tests | `applicationService.test.ts` | ✅ |
| 10-36 | All existing authService tests | `authService.test.ts` | ✅ |
| 37-44 | All existing taskService tests | `taskService.test.ts` | ✅ |
| 45-52 | All other existing tests | — | ✅ |

## Regression Verification

| Check | Status |
|-------|--------|
| `npm test` | ✅ 58/58 passed |
| `npm run build` | ✅ Success (no new errors) |
| `npm run lint` | ✅ Success (no new errors) |
| No UI files modified | ✅ Verified |
| All existing services preserved | ✅ Verified |
| Feature flag OFF → Phase 2 path used | ✅ Verified |
| Feature flag ON → idempotencyKey sent | ✅ Verified |

## Edge Function Test Scenarios (manual/integration)

These tests require a running Supabase instance and are documented here for manual verification:

### Successful provisioning
```
POST /approve-application
{ applicationId: "abc", idempotencyKey: "abc_123" }
→ 200 { success: true, studentId: "...", email: "..." }
```

### Duplicate approval (same key)
```
POST /approve-application (same body as above)
→ 200 { success: true, code: "ALREADY_PROCESSED", ... }
```

### Retry after timeout
```
(Simulate email timeout in code)
POST /approve-application { applicationId: "abc", idempotencyKey: "abc_124" }
→ 500 { success: false, code: "RETRYABLE_ERROR", step: "sending_email" }
(Resubmit same request)
→ Retries from sending_email
```

### Database failure
```
(Simulate DB connection failure)
→ 500 { success: false, code: "...", step: "..." }
(Rollback executed)
```

### Rollback verification
```
(Simulate failure after profile + CRM created)
→ Verify all CRM records deleted
→ Verify application status restored to pending_review
→ Verify auth user deleted
```

### Race condition
```
(Send two requests simultaneously with different keys, same applicationId)
→ First processes
→ Second gets 409 IN_PROGRESS or 409 already provisioned
```
