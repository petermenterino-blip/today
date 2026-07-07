# Risk Register — Phase 0 Baseline

**Assessment Date:** 2026-07-06
**Scope:** Current application state before any production improvements

---

## Security Risks

| ID | Risk | Severity | Details | Recommended Phase |
|----|------|----------|---------|-------------------|
| S-01 | **Browser-side account creation** | 🔴 Critical | `applicationService.approveApplication()` creates auth users from browser using `supabase.auth.signUp()`. Exposes service role access. | Phase 2 |
| S-02 | **Blanket RLS policies** | 🔴 Critical | Some tables may have `authenticated` policies without proper role isolation | Phase 1 |
| S-03 | **No visitor isolation** | 🟡 High | Visitors can view some data that should be restricted | Phase 1 |
| S-04 | **CORS wide open on edge functions** | 🟡 High | All edge functions allow `*` origin | Phase 2 |
| S-05 | **Email lookup invitation** | 🟡 High | Invitation via email lookup is insecure; no signed token | Phase 4 |
| S-06 | **No rate limiting on auth** | 🟡 Medium | No custom rate limiting on login/signup endpoints | Phase 2 |
| S-07 | **Service role key exposure risk** | 🟡 Medium | Scheduled function uses SERVICE_ROLE_KEY from env | Phase 3 |
| S-08 | **No audit logging for mentor actions** | 🟡 Medium | No tracking of who approved/rejected applications | Phase 2 |

## Technical Debt

| ID | Issue | Severity | Details |
|----|-------|----------|---------|
| T-01 | **Inconsistent error handling** | 🟡 High | Some services throw, others return `{data, error}` pattern |
| T-02 | **No TypeScript strict mode** | 🟡 Medium | `strict: true` not enabled in tsconfig |
| T-03 | **Backup edge-function files cause lint errors** | 🟢 Low | `backups/edge-functions/` Deno files fail tsc |
| T-04 | **No config.toml** | 🟢 Low | Supabase CLI config file missing |
| T-05 | **Magic strings in services** | 🟡 Medium | Table names, column references not centralized |
| T-06 | **CamelCase/snake_case mixing** | 🟡 Medium | Manual mapping in multiple services |
| T-07 | **No index on frequently queried columns** | 🟡 Medium | Some tables missing query-optimized indexes |
| T-08 | **Mock data in constants.ts** | 🟢 Low | Hardcoded mock products/transactions |

## Scalability Risks

| ID | Risk | Severity | Details |
|----|------|----------|---------|
| SC-01 | **All realtime uses `*` event** | 🟡 Medium | No filtering by INSERT/UPDATE/DELETE — unnecessary cache invalidation |
| SC-02 | **No pagination in some queries** | 🟡 Medium | Some service queries fetch all rows without limit |
| SC-03 | **No connection pooling limits** | 🟢 Low | Default Supabase pooler settings |
| SC-04 | **No database read replicas** | 🟢 Low | Single Postgres instance for all workloads |

## Performance Risks

| ID | Risk | Severity | Details |
|----|------|----------|---------|
| P-01 | **40+ realtime subscriptions** | 🟡 Medium | All tables published to realtime — potential WebSocket overhead |
| P-02 | **Debounced cache invalidation** | 🟢 Low | 2s debounce may cause stale data briefly |
| P-03 | **No bundle size monitoring** | 🟢 Low | No CI check for bundle size increases |
| P-04 | **No Lighthouse CI budget** | 🟢 Low | No performance budgets enforced |

## Missing Tests

| ID | Gap | Severity | Details |
|----|-----|----------|---------|
| MT-01 | **No RLS policy tests** | 🔴 Critical | No tests verifying row-level security isolation |
| MT-02 | **No E2E auth flow tests** | 🟡 High | Playwright tests exist but auth flows not covered |
| MT-03 | **No mentor dashboard tests** | 🟡 High | 42+ components with minimal test coverage |
| MT-04 | **No student feature tests** | 🟡 High | 13 student features without E2E coverage |
| MT-05 | **No edge function tests** | 🟡 Medium | No tests for Gemini, Resend, or Scheduled functions |
| MT-06 | **No storage upload tests** | 🟡 Medium | File upload flows not tested |
| MT-07 | **No realtime integration tests** | 🟡 Medium | Subscription behavior not tested |
| MT-08 | **No invitation flow tests** | 🟡 Medium | No tests for the browser-side invitation flow |

## Documentation Gaps

| ID | Gap | Severity |
|----|-----|----------|
| D-01 | No API documentation for frontend developers | 🟡 Medium |
| D-02 | No deployment runbook | 🟡 Medium |
| D-03 | No incident response plan | 🟡 Medium |
| D-04 | No onboarding guide for new developers | 🟢 Low |
| D-05 | No environment setup guide (beyond .env) | 🟢 Low |

## Single Points of Failure

| ID | SPOF | Severity | Details |
|----|------|----------|---------|
| F-01 | **Supabase project** | 🔴 Critical | Single Supabase project for all environments |
| F-02 | **Single Postgres instance** | 🟡 High | No failover replica configured |
| F-03 | **Email delivery** | 🟡 High | All notifications depend on Resend API availability |
| F-04 | **Gemini API** | 🟡 High | AI features depend on Google Gemini API availability |
| F-05 | **Auth provider** | 🟡 High | Single Supabase Auth provider — no fallback |

## Risk Summary

| Category | Critical | High | Medium | Low |
|----------|----------|------|--------|-----|
| Security | 2 | 4 | 2 | 0 |
| Technical Debt | 0 | 1 | 4 | 3 |
| Scalability | 0 | 0 | 3 | 2 |
| Performance | 0 | 0 | 1 | 3 |
| Missing Tests | 1 | 3 | 4 | 0 |
| Documentation | 0 | 0 | 3 | 2 |
| SPOF | 1 | 3 | 0 | 0 |
| **Total** | **4** | **11** | **17** | **10** |
