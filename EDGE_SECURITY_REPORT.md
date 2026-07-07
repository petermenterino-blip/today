# Edge Functions Security Report

**Date:** 2026-07-06
**Audit scope:** All 4 edge functions + middleware/auth.ts

---

## 1. Error Leakage

### VERIFIED & FIXED

| Function | File:Line | Before | After |
|---|---|---|---|
| **gemini** | `index.ts:146` | `err.message` leaked in streaming response | `'AI response error'` |
| **gemini** | `index.ts:186-188` | `err.message` leaked in catch-all | `'AI request failed. Please try again.'` |
| **resend** | `index.ts:100-101` | `err.message` returned directly | `'Failed to send email'` |
| **scheduled** | `index.ts:236-237` | `err.message` returned directly | `'Scheduled task failed'` |
| **approve-application** | `index.ts:252` | `err.message` returned via respond() | `'An unexpected error occurred'` |
| **approve-application** | `index.ts:325` | `err.message` returned in StepResult | `'CRM initialization error'` |
| **approve-application** | `index.ts:342` | `err.message` returned in StepResult | `'Email send error'` |
| **approve-application** | `index.ts:669` | `err.message` returned in StepResult | `'CRM initialization error'` |
| **approve-application** | `index.ts:764` | `err.message` returned in StepResult | `'Email send error'` |

Total: **9 leak points found, 9 fixed.**

## 2. Authentication

| Function | Status | Detail |
|---|---|---|
| **gemini** | PASS | Uses `verifyAuth()` + `requireRole(['student', 'mentor'])` |
| **resend** | PASS | Uses `verifyAuth()` + `requireRole(['mentor'])` |
| **approve-application** | PASS | Uses `verifyAuth()` + `requireRole(['mentor'])` |
| **scheduled** | PASS | Uses `CRON_SECRET` header comparison (correct for cron triggers) |

## 3. Authorization

| Function | Status | Detail |
|---|---|---|
| **gemini** | PASS | Role-checked for student/mentor |
| **resend** | PASS | Role-checked for mentor only |
| **approve-application** | PASS | Role-checked for mentor only + application-level ownership check |
| **scheduled** | PASS | Cron-secret protected (no user roles needed) |

## 4. CORS

| Function | Status | Detail |
|---|---|---|
| **gemini** | PASS | CORS headers present, OPTIONS handler |
| **resend** | PASS | CORS headers present, OPTIONS handler |
| **approve-application** | PASS | CORS headers present, OPTIONS handler |
| **scheduled** | PASS | CORS headers present, OPTIONS handler |
| **middleware/auth.ts** | FIXED | Duplicate `getCorsHeaders()` declarations consolidated |

### Duplicate `getCorsHeaders` Fix

**File:** `middleware/auth.ts:91-111`
**Before:** Two declarations of `getCorsHeaders()` — the first was dead code.
**After:** Single declaration using `CORS_HEADERS` constant with dynamic origin substitution.

## 5. Input Validation

| Function | Status | Detail |
|---|---|---|
| **gemini** | WEAK | JSON body parsed but no schema validation; `prompt` could be missing/empty |
| **resend** | ADEQUATE | Checks `template` against known keys; validates `to` is present (by destructuring) |
| **approve-application** | ADEQUATE | Validates `applicationId` and `idempotencyKey` types |
| **scheduled** | ADEQUATE | Validates `task` against known cases |

## 6. Logging

| Function | Status | Detail |
|---|---|---|
| **gemini** | WEAK | No structured logging; errors swallowed silently |
| **resend** | WEAK | No structured logging |
| **approve-application** | GOOD | Full audit logging via `provisioning_audit_logs` table |
| **scheduled** | WEAK | No structured logging |

---

## Previously Reported (No Longer Applicable)

| Issue | Status |
|---|---|
| `getCorsHeaders` declared twice | FIXED |
| `resend` temporary password in plaintext email | Already fixed in previous session (`approve-application` uses "Forgot Password" flow instead) |
| `scheduled` missing auth | Uses `CRON_SECRET` — correct for cron job pattern |

---

## Remaining Non-P0 Issues (deferred)

- No structured error logging in gemini/resend/scheduled
- No request correlation IDs
- No timeout handling on external API calls (Resend, Gemini)
- `gemini` missing input validation on `prompt` field

**Validation:**
- `npm run build` — PASS (exit 0)
- `npm run lint` — PASS (exit 0)
