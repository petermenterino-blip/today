

# Phase 5: Security Review

## Summary
Security posture is **strong in the data layer, inconsistent in the function layer**.

## Strengths
1. **RLS Coverage**: 179 policies across 25 tables — comprehensive
2. **Edge Functions (2/5)**: `scheduled` uses CRON_SECRET; `resend` validates JWT + mentor role
3. **Auth**: Supabase Auth with JWT + secure session management
4. **Protected Routes**: `<ProtectedRoute>` checks `application_status` before rendering
5. **Service Layer**: All queries go through Supabase client (RLS enforced server-side)

## Weaknesses

### Critical: 3 Edge Functions with Zero Auth
| Function | Endpoint | Risk | Action Required |
|----------|----------|------|-----------------|
| `calendar` | HTTP | Anyone can call — no auth check | Add JWT verification |
| `gemini` | HTTP | Anyone can call — no auth check | Add JWT verification |
| `meet` | HTTP | Anyone can call — no auth check | Add JWT verification |

### Medium: Application-Level Checks
- `ProgramApplications` page still has `isPaused` references that may cause UI errors
- Role checks exist in services but are inconsistently applied across all mutations

### Low: Storage Policies
- All storage buckets now have proper RLS (after F2.1 fix)
- `documents` bucket uses mentor_id → program join for scoped read access

## Recommendations
1. **Immediate**: Add JWT verification to `calendar`, `gemini`, and `meet` Edge Functions
2. **Short-term**: Audit all mutation service functions for application-level role checks (defense-in-depth)
3. **Medium-term**: Add rate limiting to Edge Functions
4. **Long-term**: Consider API gateway for centralized auth enforcement

## Security Score: 74/100
- RLS: 35/35 (comprehensive)
- Edge Function auth: 15/35 (2 of 5 secured)
- App-level checks: 14/20 (good but inconsistent)
- Storage: 10/10 (all buckets covered)
