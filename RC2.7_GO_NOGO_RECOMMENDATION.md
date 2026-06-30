# Go/No-Go Recommendation — Mentorino RC2

## Decision: NOT READY

## Why

Mentorino is **conditionally ready for staging** but **not ready for an internal alpha** until 6 critical issues are resolved.

## Must-Fix Gates

### Gate 1 — Security (Critical, blocks staging)
| # | Issue | Severity | Fix Effort |
|---|-------|----------|------------|
| 1 | `scheduled/index.ts` exposes service_role key to any JWT holder | 🔴 CRITICAL | 1 hour |
| 2 | `resend/index.ts` is an open email relay for authenticated users | 🔴 CRITICAL | 1 hour |

### Gate 2 — Security (High, blocks alpha)
| # | Issue | Severity | Fix Effort |
|---|-------|----------|------------|
| 3 | Storage policy references non-existent `profiles.mentor_id` column | 🟠 HIGH | 30 min |
| 4 | Temp password returned to frontend API response | 🟠 HIGH | 15 min |
| 5 | 14 tables have RLS enabled with zero policies | 🟠 HIGH | 2-3 hours |
| 6 | `authService.ts` defaults missing profile role to 'student' | 🟠 HIGH | 15 min |

### Gate 3 — Quality (High, blocks alpha)
| # | Issue | Severity | Fix Effort |
|---|-------|----------|------------|
| 7 | Hardcoded mentor ID 'mentor-1' and student name 'Alex Student' in messaging | 🔴 HIGH | 30 min |
| 8 | Journal `title` field collected but never persisted | 🟠 HIGH | 15 min |
| 9 | Journal mood values mismatch (UI vs interface) | 🟠 HIGH | 15 min |
| 10 | Unhandled rejection on journal create | 🟠 HIGH | 15 min |
| 11 | `application_status` may be undefined in ProtectedRoute | 🟠 HIGH | 15 min |

### Gate 4 — Performance (Medium, pre-alpha)
| # | Issue | Severity | Fix Effort |
|---|-------|----------|------------|
| 12 | No `React.memo` anywhere — heavy unnecessary re-renders | 🟡 MEDIUM | 2-3 hours |
| 13 | Only 1/19 images use `loading="lazy"` | 🟡 MEDIUM | 30 min |
| 14 | 8-12 parallel DB queries on dashboard load | 🟡 MEDIUM | 2 hours |
| 15 | Realtime stale closure in `useRealtime` | 🟡 MEDIUM | 30 min |

## Why Not "Not Ready" Without Qualification

Despite these issues, **many things are solid**:

✅ All routes are lazy-loaded
✅ RLS is enabled on 40+ tables (14 need policies, but the framework is there)
✅ Auth flow is clean (no hardcoded credentials, no insecure fallback paths)
✅ Error handling exists in 14/21 components
✅ Loading states exist in 16/21 components
✅ Empty states exist in 12/15 data-driven components
✅ Build compiles with zero errors
✅ TypeScript passes with zero errors

## Effort Estimate

| Phase | Issues | Estimated Effort |
|-------|--------|------------------|
| Gate 1 (Critical) | 2 | 2 hours |
| Gate 2 (High Security) | 4 | 3-4 hours |
| Gate 3 (High Quality) | 5 | 1-2 hours |
| Gate 4 (Medium Performance) | 4 | 4-5 hours |
| **Total Before Alpha** | **12** | **~12-14 hours** |

## Recommended Path

### Week 1: Gate 1 + Gate 2 (5 hours)
1. Fix `scheduled/index.ts` — add CRON_SECRET verification
2. Fix `resend/index.ts` — add role validation
3. Fix storage policy `docs_mentor_read_assigned`
4. Remove password from approveApplication return
5. Fix default role fallback in authService.ts
6. Add RLS policies for event child tables (4 minimum)

→ **Re-evaluate: READY FOR STAGING DEPLOYMENT**

### Week 2: Gate 3 + Gate 4 (6-8 hours)
7. Fix hardcoded messaging values
8. Fix Journal title/mood/error issues
9. Fix ProtectedRoute application_status
10. Add React.memo to key list components
11. Add loading="lazy" to images
12. Consolidate duplicate query hooks

→ **Re-evaluate: READY FOR INTERNAL ALPHA**

### Week 3-4: Edge Functions + Polish
13. Add role validation to gemini/index.ts
14. Fix Realtime stale closure
15. Scoping mentor application reads
16. Add retry mechanism for invitation flow

→ **Re-evaluate: READY FOR CLOSED PILOT**

## Verdict

| Stage | Current | After Gate 1 | After Gate 2 | After Gate 3+4 |
|-------|---------|--------------|--------------|----------------|
| Staging Deployment | ❌ | ✅ | ✅ | ✅ |
| Internal Alpha | ❌ | ❌ | ❌ | ✅ |
| Closed Pilot | ❌ | ❌ | ❌ | Conditional |

**Recommendation:** Begin Gate 1 immediately. Re-assess after each gate. The architecture is sound — the issues are concentrated in 3-4 areas (edge function auth, storage policy, component rendering, missing RLS policies).
