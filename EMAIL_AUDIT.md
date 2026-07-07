# Email Validation & Edge Function Audit

**Date:** 2026-07-06  
**Services:** Resend (supabase/functions/resend/index.ts), Approve-Application (supabase/functions/approve-application/index.ts)

---

## 1. Email Templates

### Template Inventory (resend/index.ts)

| Template | Subject | Variables Used | Variables Passed | Issue |
|----------|---------|---------------|------------------|-------|
| `welcome` | Welcome to Mentorino! | `name`, `email`, `tempPassword` | `name`, `email`, `tempPassword` | ✅ **FIXED** — Now includes all 3 variables |
| `session_reminder` | Session Reminder | `name`, `time`, `mentor_name` | `name`, `time`, `mentor_name` | OK |
| `application_update` | Application Update | `name`, `status` | `name`, `status` | OK |
| `notification` | New Notification | `name`, `message` | `name`, `message` | OK |

### Approve-Application Emails (approve-application/index.ts)

| Phase | Method | Recipient | Includes tempPassword? | Password Delivery |
|-------|--------|-----------|----------------------|-------------------|
| Phase 2 | `phase2SendEmail()` | `to` (student email) | ❌ (ignores it) | Tells user to use "Forgot Password" |
| Phase 3 | `stepSendEmail()` | `to` (student email) | ❌ (ignores it) | Tells user to use "Forgot Password" |

---

## 2. Production Issues Found

### CRITICAL (FIXED): Welcome template missing tempPassword
- **File:** `supabase/functions/resend/index.ts:15` (welcome template)
- **Finder:** `applicationService.ts:428-432` passes `{name, email, tempPassword}`
- **Impact:** Before fix, approved students received a welcome email with NO password. They'd need to use "Forgot Password" flow or contact support to log in.
- **Fix Applied:** Updated welcome template to include `email` and `tempPassword` in HTML body, with a link to login and instructions to change password.

---

## 3. Security Review

### Sender Verification
| Check | Status | Details |
|-------|--------|---------|
| `from` domain verified in Resend | ⚠️ Unknown | Hardcoded as `notifications@mentorino.com` |
| SPF/DKIM configured | ⚠️ Unknown | Must verify domain in Resend dashboard |

### Authentication
| Check | Status | Details |
|-------|--------|---------|
| Endpoint requires auth token | ✅ | `verifyAuth()` called for all endpoints |
| Access control | ✅ | `requireRole()` for mentor |
| API key security | ✅ | `DENO_ENV` for Resend API key, not exposed to client |

### Rate Limiting
| Check | Status | Details |
|-------|--------|---------|
| Resend endpoint | ✅ | 10 requests/minute, burst 5 |
| Approve-application | ⚠️ N/A | No explicit rate limit (relies on idempotency key) |
| Retry logic | ✅ | Max 3 retries with backoff (approve-application only) |

---

## 4. HTML & Security

| Check | Status | Details |
|-------|--------|---------|
| HTML escaping | ✅ | `esc()` in resend, `escapeHtml()` in approve-application |
| No mail merge injection | ✅ | All variables escaped |
| Unsubscribe link | ❌ **Missing** | No `List-Unsubscribe` header or link in any template |
| Plain-text alternative | ❌ **Missing** | HTML-only emails — spam filters penalize this |

---

## 5. Error Handling

| Scenario | Behaviour | Status |
|----------|-----------|--------|
| API key missing | Phase 2/3: returns failure | ✅ |
| Resend API down | Returns error, non-blocking by caller | ✅ |
| Invalid email | ❌ No email format validation before sending | ⚠️ Low |
| Rate limited | Resend endpoint: returns 429 | ✅ |

---

## 6. Recommendations

| Priority | Action | Details |
|----------|--------|---------|
| HIGH | Verify `notifications@mentorino.com` sender in Resend | Emails may bounce or land in spam |
| MEDIUM | Normalize welcome email approach | Two flows: one sends password, one tells "Forgot Password" — pick one |
| LOW | Add `List-Unsubscribe` header | Required for bulk senders; improves deliverability |
| LOW | Validate email format before API call | Add regex check for `to` addresses |
| INFO | Add plain-text version of emails | HTML-only emails get lower deliverability scores |

---

## Summary

✅ **PASS** (with 1 critical fix applied) — The critical bug (missing temp password in welcome email) is fixed. Edge function has proper auth, rate limiting, and error handling. Missing unsubscribe link and email validation are low-severity improvements.
