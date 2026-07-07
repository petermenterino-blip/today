# Mentorino Bug Report

## Summary

| Severity | Count |
|---|---:|
| Critical | 2 |
| High | 4 |
| Medium | 3 |
| Low | 2 |
| Total | 11 |

## MQA-001

**Severity/Priority:** Critical / P0  
**Module:** Supabase RLS  
**Steps:** Authenticate as any student; access or mutate rows in resource assignments, favorites, comments, versions, activity, completions, downloads, recently viewed, reviews, or review history.  
**Expected:** Access is limited to the user's own rows or assigned mentor scope.  
**Actual:** Migration `034_complete_schema_sync.sql` creates `Authenticated full access` for all operations on eleven tables.  
**Screenshot:** N/A, static security finding.  
**Console/Network:** Not executed against production to avoid data access.  
**Database Impact:** Cross-tenant read/write/delete exposure.  
**Frontend Impact:** UI route guards cannot prevent direct API access.  
**Suggested Fix:** Replace blanket policies with row-owner, participant, assignment, and mentor-scope policies; test with separate JWT identities.

## MQA-002

**Severity/Priority:** Critical / P0  
**Module:** Application approval / Auth  
**Steps:** Mentor approves an application.  
**Expected:** A secure server/Edge Function uses service-role privileges to create the student atomically.  
**Actual:** Browser code calls `supabase.auth.signUp`, generates and emails a temporary password, and performs profile/CRM writes client-side.  
**Database Impact:** Partial account state and privilege-boundary failure.  
**Frontend Impact:** The approving browser session may be changed by signup behavior.  
**Suggested Fix:** Move provisioning to a verified mentor-only Edge Function and use a transaction/idempotency key.

## MQA-003

**Severity/Priority:** High / P1  
**Module:** Application approval synchronization  
**Steps:** Cause CRM initialization or welcome email to fail during approval.  
**Expected:** Approval is rolled back or clearly marked incomplete and retryable.  
**Actual:** CRM initialization is not awaited and both CRM/email errors are swallowed; application status still becomes `invited`.  
**Database Impact:** Missing goals, conversations, progress, layouts, or analytics records.  
**Frontend Impact:** Mentor sees apparent success while the student cannot complete the journey.  
**Suggested Fix:** Await all required operations, persist provisioning state, and expose retry/reconciliation.

## MQA-004

**Severity/Priority:** High / P1  
**Module:** Invitation acceptance  
**Steps:** Anonymous invited applicant attempts invitation lookup by email/token.  
**Expected:** A narrowly scoped secure endpoint validates the invitation.  
**Actual:** Client queries `applications`, while RLS allows select only for the owning authenticated user or mentor.  
**Database Impact:** None.  
**Frontend Impact:** Invitation lookup can return no record for the intended anonymous user.  
**Suggested Fix:** Use a signed, expiring token through an Edge Function.

## MQA-005

**Severity/Priority:** High / P1  
**Module:** Test coverage / Mentor role  
**Steps:** Run the repository E2E suite.  
**Expected:** Mentor overview, students, applications, sessions, programs, resources, analytics, messaging, AI, gallery, bookings, settings, notifications, and logout are covered.  
**Actual:** No mentor E2E tests exist.  
**Frontend Impact:** Major regressions can ship undetected.  
**Suggested Fix:** Add a mentor storage state and page/workflow suite against staging.

## MQA-006

**Severity/Priority:** High / P1  
**Module:** Security regression testing  
**Steps:** Run automated tests.  
**Expected:** Visitor/student/mentor JWT and RLS isolation tests execute.  
**Actual:** No live RLS or cross-role authorization tests exist.  
**Suggested Fix:** Add API-level policy tests with isolated users and seeded ownership boundaries.

## MQA-007

**Severity/Priority:** Medium / P2  
**Module:** Realtime observability  
**Steps:** Subscribe to realtime tables and call `getActiveChannelCount()`.  
**Expected:** Current active channel count.  
**Actual:** Function always returns `0`.  
**Suggested Fix:** Track channel registration/removal and assert no duplicate subscriptions.

## MQA-008

**Severity/Priority:** Medium / P2  
**Module:** Cross-browser E2E  
**Steps:** Run the configured five Playwright projects.  
**Expected:** Suite completes within the CI budget.  
**Actual:** Audit run exceeded ten minutes and left workers active.  
**Suggested Fix:** Split projects, reduce repeated setup, add project time budgets, and make mobile assertions responsive-aware.

## MQA-009

**Severity/Priority:** Medium / P2  
**Module:** Test assertions  
**Steps:** Run unit approval test with email invocation unavailable.  
**Expected:** Required welcome-email failure fails or is explicitly asserted as non-blocking.  
**Actual:** Test passes while stderr reports `sendEmail` cannot read `invoke`.  
**Suggested Fix:** Assert the intended contract and mock the Edge Function explicitly.

## MQA-010

**Severity/Priority:** Low / P3  
**Module:** Playwright artifacts  
**Actual:** Trace/video are retry-only, screenshots are failure-only, and network/console/coverage are not persisted.  
**Suggested Fix:** Add CI artifact policy and custom attachments for console/network summaries.

## MQA-011

**Severity/Priority:** Low / P3  
**Module:** Documentation  
**Actual:** Application-flow documentation describes localStorage persistence while current services use Supabase extensively.  
**Suggested Fix:** Update architecture and test-environment documentation after behavior is stabilized.
