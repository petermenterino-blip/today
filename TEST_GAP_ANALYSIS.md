# Test Gap Analysis

## Priority 1 — Security-Critical (covered)

| Component | Status | Coverage |
|-----------|--------|----------|
| Auth Service (signIn, signUp, signOut, getCurrentUser) | ✅ Complete | 89-92% |
| AuthContext (login, logout, session init, refresh) | ✅ Complete | 65% |
| ProtectedRoute (role-based route guard) | ✅ Complete | 91% |
| RLS Isolation (cross-tenant data access) | ✅ Adequate | 100% of mocked paths |
| Logger (PII redaction, sensitive data handling) | ✅ Complete | 98% |
| Error Handler (error classification, user messaging) | ✅ Complete | 91% |

## Priority 2 — Not Tested (high impact)

| Area | Files | Risk | Effort |
|------|-------|------|--------|
| **Edge functions** (approve-application, gemini, resend) | 3 | HIGH | Need Deno test runner |
| **Service layer** (event, messaging, resource, goal, session services) | ~30 files | MEDIUM | 2-3 days |
| **Database migration SQL** (RLS policies, triggers, functions) | ~30 files | HIGH | Need pgTAP or similar |
| **Supabase middleware auth** (verifyAuth, requireRole, rate limit) | 1 | HIGH | Need Deno test runner |

## Priority 3 — Not Tested (medium impact)

| Area | Files | Notes |
|------|-------|-------|
| **Custom hooks** (useGoals, useTasks, useMessaging, etc.) | ~25 | Mock Supabase queries |
| **Components** (Layout, VisitorHeader, Gallery, etc.) | ~50+ | Role-conditional rendering |
| **Pages** (Landing, Application, Auth, Dashboard) | ~20 | Integration with services |

## Priority 4 — Low Risk / Low Impact

| Area | Files | Notes |
|------|-------|-------|
| `healthCheck.ts` | 1 | Simple HTTP health check |
| `performance.ts` | 1 | Performance tracking |
| `idleRecovery.ts` | 1 | Browser event handling |
| `sentry.ts` | 1 | One-liner init |
| `constants.ts`, `queryKeys.ts` | 2 | Trivial constants |

## Identified Security Gaps

1. **ProtectedRoute pending-approval redirect is unreachable** — The `application_status` check at `ProtectedRoute.tsx:31` never triggers because students pass the `allowedRoles.includes(role)` check first. A student with `application_status: 'pending'` can access all student routes.

2. **Frontend UserRole type missing `'mentor'`** — The type at `src/types/index.ts:1` only includes `'student' | 'mentor' | 'visitor'`, but edge functions and database recognize `'mentor'`.

## Infrastructure Gaps

1. **No Deno test setup** — Edge functions in `supabase/functions/` cannot be tested with Vitest.
2. **E2E requires staging** — Playwright tests cannot run without a running Supabase staging instance.
