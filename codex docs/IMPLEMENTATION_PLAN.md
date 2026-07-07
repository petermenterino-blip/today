# Mentorino Implementation Plan

No fixes were made during this audit.

| Priority | Work | Estimate | Complexity | Dependencies | Primary files | Risk | Sprint |
|---|---|---:|---|---|---|---|---|
| Critical | Replace authenticated full-access RLS policies | 4-6 days | High | Staging DB, policy matrix | `supabase/migrations/034_complete_schema_sync.sql`, new migration | High | Sprint 1 |
| Critical | Move application approval/account creation to Edge Function | 5-8 days | High | Service role, email provider | `applicationService.ts`, `supabase/functions/` | High | Sprint 1 |
| High | Make provisioning atomic, awaited, idempotent, and recoverable | 4-6 days | High | Approval Edge Function | CRM/application services | High | Sprint 1 |
| High | Implement signed invitation acceptance | 3-5 days | Medium | Email templates, token storage | Auth/application services | Medium | Sprint 1 |
| High | Create isolated QA Supabase project and role fixtures | 2-4 days | Medium | CI secrets | Playwright config, seed scripts | Medium | Sprint 1 |
| High | Add mentor and cross-role Playwright suites | 8-12 days | High | QA environment | `e2e/` | Medium | Sprint 2 |
| High | Add RLS/JWT integration tests | 5-8 days | High | Disposable DB/users | `e2e/` or policy test harness | High | Sprint 2 |
| Medium | Add realtime synchronization and duplicate-channel tests | 5-7 days | Medium | Two browser contexts | realtime hooks, E2E | Medium | Sprint 2 |
| Medium | Stabilize and shard browser/device matrix | 3-5 days | Medium | CI runners | Playwright config | Low | Sprint 2 |
| Medium | Add accessibility and performance budgets | 4-6 days | Medium | axe/Lighthouse or equivalent | CI/test tooling | Low | Sprint 3 |
| Low | Persist console, network, coverage, trace, and video artifacts | 2-3 days | Low | Artifact storage | Playwright config/reporters | Low | Sprint 3 |
| Low | Reconcile architecture documentation | 1-2 days | Low | Final implementation | `docs/` | Low | Sprint 3 |

## Recommended Next Sprint

Sprint 1 should be release-blocker work only:

1. Establish the staging database and test identities.
2. Remove blanket authenticated access policies.
3. Replace browser-side approval with a mentor-authorized Edge Function.
4. Make provisioning transactional/idempotent and surface failures.
5. Add policy tests proving student-to-student and student-to-mentor isolation.

Exit criteria: zero P0 defects, invitation-to-login succeeds in staging, and unauthorized API tests pass for visitor, student A, student B, and mentor.
