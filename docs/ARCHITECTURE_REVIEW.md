# Mentorino — Architecture Review

Version: 1.0

---

## Executive Summary

Mentorino is a well-architected single-page application with a clear migration path from client-side SPA (localStorage) to full-stack serverless (Supabase). The existing architecture documents (ARCHITECTURE.md, BRD.md, PRD.md, APPLICATION_FLOW.md, IMPLEMENTATION_PLAN.md, AUDIT.md) are thorough, consistent, and provide a strong foundation.

The most significant strengths are the service-layer abstraction, the clear phase-gated migration plan, and the strict free-tier awareness. The most significant risks are the monolithic component debt (4 files >1,000 lines), the dual-service pattern (taskService + taskStorage), and the auth migration complexity.

**Overall Assessment**: The architecture is production-ready in concept. The codebase needs disciplined execution of the migration plan. Estimated: ~6-8 weeks of focused engineering for full migration.

---

## 1. Strengths

### 1.1 Service Layer Abstraction

The existing codebase cleanly separates concerns: Components → Hooks → Services → Persistence. None of the 23 pages or 19 components directly manipulate localStorage. This makes the Supabase migration a matter of swapping service implementations rather than rewriting the entire application.

**Impact**: Low migration risk. Each domain can be migrated independently in Phase 3.

### 1.2 Phase-Gated Migration Plan

The IMPLEMENTATION_PLAN.md divides work into 11 clearly defined phases with dependency tracking. The dependency graph shows Phase 0 → 1 → 2 → 3 (with sub-phases 3a-3f) + 4 + 6 → 8, with Phase 5 parallelizable. Each phase produces a working build.

**Impact**: Reduces integration risk. Allows incremental deployment.

### 1.3 Free-Tier First Mentality

ARCHITECTURE.md explicitly considers Supabase Free (2GB DB, 5GB bandwidth, 50MB storage, 50K auth users, 2 always-on edge functions), Vercel Free (100GB bandwidth, 6000 build min/month), PostHog Free (1M events/month), and Sentry Free (5K events/month).

**Impact**: Prevents cost surprise at 1,000 students. Architecture is sustainable on free tier.

### 1.4 Comprehensive Audit

The AUDIT.md document is exceptionally thorough — 360 lines covering file structure, service inventory, hook patterns, monolithic file analysis, database table requirements, RLS policy requirements, and localStorage key mapping. This document alone saves weeks of discovery work.

**Impact**: Migration can begin immediately with clear targets.

### 1.5 TanStack Query Partial Adoption

4 of 13 hooks already use TanStack Query (useSessions, usePrograms, useBookingsQuery, useEventsQuery). The base service (BaseSupabaseService.ts) already exists. This reduces Phase 6 effort by ~30%.

**Impact**: Faster migration, proven patterns for remaining hooks.

### 1.6 No Routing or UI Redesign Needed

The routing structure (HashRouter, lazy-loaded routes) and UI patterns (Tailwind, Lucide, Motion) are already in place. The architecture review found no need to redesign existing UI or add new product features.

**Impact**: Migration is purely infrastructure — no product scope creep.

---

## 2. Weaknesses

### 2.1 Dual Service Pattern (taskService + taskStorage)

The AUDIT correctly identifies that `taskService.ts` and `taskStorage.ts` both handle tasks with different interfaces. This is also true for `applicationService` / `applicationsStorage` patterns. The audit counts 24 services, but some are redundant.

**Risk**: Medium. During migration, which one becomes the canonical Supabase service? Must consolidate before migrating.

**Recommendation**: Phase 0.5 — consolidate redundant services into single canonical services BEFORE Phase 3 migration. Or handle in Phase 11 (cleanup).

### 2.2 Dual Hook Pattern (useBookings + useBookingsQuery)

Two hooks exist for the same domain — one using `useState` + manual CRUD (`useBookings.ts`) and one using TanStack Query (`useBookingsQuery.ts`). Same for events (`useEvents.ts` + `useEventsQuery.ts`).

**Risk**: Low-Medium. Both hooks consume the same service, so different callers use different patterns. But this creates confusion and maintenance burden.

**Recommendation**: Phase 6 should add a step to consolidate duplicate hooks, keeping only the TanStack Query variant.

### 2.3 Monolithic Files

Four files exceed 1,000 lines:
- `MentorDashboard.tsx` — 5,427 lines (largest)
- `MentorScheduler.tsx` — 2,531 lines
- `WhatsAppMessaging.tsx` — 1,298 lines
- `EventManagement.tsx` — 1,112 lines

**Risk**: High. These files are difficult to maintain, test, and review. Any change risks regression across multiple features. Migration hooks for these files are the most complex.

**Recommendation**: Phase 5 must split these files BEFORE any logic changes. Extract a minimum of 5-8 sub-components per monolithic file. Block Phase 3 migration for these features until after splitting.

### 2.4 Auth as a Bottleneck

Auth migration (Phase 2) is a dependency for EVERYTHING in Phase 3+. If auth migration is delayed or problematic, the entire plan stalls.

**Risk**: High. Single point of failure in the dependency chain.

**Recommendation**: Phase 2 should include a dual-mode auth (mock + Supabase) with a feature flag. This allows Phase 3 to proceed in parallel for services that don't strictly require auth (most of them read based on current user context, which can be mocked). Consider making auth non-blocking.

### 2.5 No CI/CD Pipeline

There is no CI configuration, no linting in CI, no test runner, no automated deployment. The project currently runs only locally.

**Risk**: Medium. Without CI, code quality regressions go undetected. Manual testing becomes the only safety net.

**Recommendation**: Add minimal CI before or during Phase 1: TypeScript check, build check, and lint on PR. Deploy preview environments from Vercel.

### 2.6 Seed Data Duplication

Seed data lives in `src/utils/seedData.ts` (TypeScript) and will need to be replicated in `supabase/seed/seed.sql` (SQL). Maintaining both during migration creates risk of drift.

**Risk**: Medium. If seed data is updated in one place but not the other, tests and development environments diverge.

**Recommendation**: During migration, the TypeScript seed should be the source of truth. SQL seed is generated FROM TypeScript seed. After Phase 3, delete TypeScript seed and use SQL seed exclusively.

---

## 3. Technology Validation

### 3.1 Frontend Stack

| Technology | Verdict | Notes |
|------------|---------|-------|
| React 19 | ✅ **Appropriate** | Latest stable. Concurrent features beneficial for future growth |
| TypeScript | ✅ **Appropriate** | Strict mode configured. Essential for team scalability |
| Vite | ✅ **Appropriate** | Fast builds, ES modules, good ecosystem. No reason to change |
| Tailwind CSS | ✅ **Appropriate** | v4 with `@tailwindcss/vite` plugin. Utility-first matches SPA approach |
| Motion | ✅ **Appropriate** | Lightweight animation library. No reason to change |
| Lucide React | ✅ **Appropriate** | Tree-shakeable icons. No reason to change |
| React Router v7 | ✅ **Appropriate** | Standard React routing. HashRouter is fine for SPA |
| TanStack Query v5 | ✅ **Appropriate** | Gold standard for server state in React. v5 is latest stable |
| Zustand | ⚠️ **Present but unnecessary for now** | Only 1-2 stores likely needed (sidebar, theme). Consider removing if unused |
| Recharts | ✅ **Appropriate** | React-native charting. Works well for revenue/session charts |
| jsPDF | ✅ **Appropriate** | For PDF exports. No better alternative for browser PDF generation |
| Sonner | ✅ **Appropriate** | Lightweight toast library. No reason to change |

### 3.2 Backend Stack

| Technology | Verdict | Notes |
|------------|---------|-------|
| Supabase PostgreSQL | ✅ **Appropriate** | Best-in-class serverless PostgreSQL. Free tier generous for target scale |
| Supabase Auth | ✅ **Appropriate** | Drop-in auth with JWT, RLS integration, password reset |
| Supabase Storage | ✅ **Appropriate** | S3-compatible, RLS integration, signed URLs |
| Supabase Realtime | ✅ **Appropriate** | WebSocket-based, narrow-scope subscriptions |
| Supabase Edge Functions | ✅ **Appropriate** | Deno-based, minimal cold start, integrated with Supabase |
| Google Gemini | ⚠️ **Appropriate but consider alternatives** | See Section 3.4 |
| Resend | ✅ **Appropriate** | Best free tier (100 emails/day). Simple REST API |
| Google Calendar API | ⚠️ **Appropriate but P3 priority** | Complex OAuth flow. Defer until post-MVP |
| Google Meet API | ⚠️ **Appropriate but P3 priority** | Requires Google Calendar API dependency |

### 3.3 Monitoring Stack

| Technology | Verdict | Notes |
|------------|---------|-------|
| PostHog | ✅ **Appropriate** | Best free tier (1M events/month). Self-host option available |
| Sentry | ✅ **Appropriate** | Industry standard error tracking. 5K events/month free is tight — consider Supabase Logs as alternative |

### 3.4 AI Recommendation

**Gemini vs. OpenAI vs. Anthropic**

For this use case (mentorship insights, feedback, summaries), Gemini is:
- ✅ Cheapest API pricing
- ✅ Largest context window (1M tokens — useful for student history)
- ✅ Available via Supabase Edge Function
- ⚠️ Quality difference negligible for summarization/feedback use cases
- ⚠️ OpenAI has stronger ecosystem support

**Recommendation**: Start with Gemini as specified in ARCHITECTURE.md. Design the `aiService` abstraction so that the AI provider can be swapped without changing any consuming code. If quality is insufficient, switching to OpenAI requires only changing one Edge Function.

### 3.5 Vendor Lock-In Assessment

| Dependency | Lock-In Risk | Mitigation |
|------------|-------------|------------|
| Supabase (database) | Low | Standard PostgreSQL — migrate to any PG provider |
| Supabase Auth | Medium | Auth is hard to migrate generically, but user data is in profiles table |
| Supabase Storage | Low | S3-compatible, standard tooling (rclone) |
| Supabase Realtime | Medium | Replaces polling — fall back to polling if needed |
| Supabase Edge Functions | Low | Deno is standard — functions are thin API wrappers |
| Vercel | Low | Static files — migrate to Cloudflare Pages, Netlify, etc. |
| PostHog | Low | Events are standard HTTP calls |
| Sentry | Low | Standard SDK — migrate to any error tracker |

**Overall**: Low lock-in risk. The service layer abstraction is the key mitigation — only services know about Supabase.

---

## 4. Free Tier Strategy Review

### 4.1 Supabase Free Tier Limits vs. Projected Usage

| Resource | Free Tier Limit | Projected Usage at 1K Students | Margin |
|----------|----------------|-------------------------------|--------|
| Database size | 2GB | ~200MB (text + metadata, no blobs) | ✅ 10x margin |
| Bandwidth | 5GB/month | ~3GB API calls + file serving | ⚠️ Tight — optimize queries |
| Storage | 1GB (safety margin) | ~500MB documents + avatars | ✅ 2x margin |
| Auth users | 50,000 | 1,050 (1K students + 50 mentors) | ✅ 47x margin |
| Edge Functions | 2 always-on, 500K invocations | ~50K/month (AI + email + scheduled) | ✅ 10x margin |
| Realtime connections | 200 concurrent | ~50 concurrent (peak usage) | ✅ 4x margin |

### 4.2 Vercel Free Tier Limits

| Resource | Free Limit | Projected Usage | Margin |
|----------|------------|-----------------|--------|
| Bandwidth | 100GB/month | ~10GB static assets | ✅ 10x margin |
| Build minutes | 6,000/month | ~500 (SPA build is fast) | ✅ 12x margin |
| Serverless functions | NOT used | Static SPA only | ✅ N/A |

### 4.3 PostHog Free Tier Limits

| Resource | Free Limit | Projected Usage | Margin |
|----------|------------|-----------------|--------|
| Events | 1M/month | ~50K (10 events/user/month × 500 MAU) | ✅ 20x margin |

### 4.4 Sentry Free Tier Limits

| Resource | Free Limit | Projected Usage | Margin |
|----------|------------|-----------------|--------|
| Events | 5K/month | ~5K | ⚠️ **TIGHT** |

**Recommendation**: Consider replacing Sentry with Supabase Logs + custom error tracking to avoid cost/limit pressure. Or upgrade to Sentry Team ($26/month) if 5K is exceeded.

### 4.5 Resend Free Tier Limits

| Resource | Free Limit | Projected Usage | Margin |
|----------|------------|-----------------|--------|
| Emails | 100/day | ~50/day (reminders + notifications) | ✅ 2x margin |

### 4.6 Free Tier Optimization Recommendations

1. **Minimize Edge Function invocations**: Batch AI requests, cache responses in DB
2. **Minimize DB reads**: Use TanStack Query staleTime effectively (5+ min for non-critical data)
3. **Compress images** before upload: WebP format, max 1200px width
4. **Limit Realtime subscriptions** to active conversations only (unsubscribe on unmount)
5. **Use signed URLs** instead of public download endpoints (bandwidth savings)
6. **Implement pagination** on all list queries (never load >50 items at once)
7. **Rate limit AI calls**: Max 5 Gemini calls per student per day

---

## 5. Risks & Mitigations

| # | Risk | Severity | Likelihood | Impact | Mitigation |
|---|------|----------|------------|--------|------------|
| 1 | Auth migration blocks all Phase 3+ work | **High** | Medium | Delays entire project | Dual-mode auth with feature flag; allow Phase 3 to start with mock user context |
| 2 | Monolithic files cause merge conflicts during refactoring | **High** | High | Slow Phase 5 | Split BEFORE Phase 3 starts; each file extracted in its own PR |
| 3 | localStorage seed data out of sync with SQL seed | **Medium** | Medium | Test data drift during migration | Source of truth is TypeScript seed; generate SQL from it |
| 4 | Edge Function cold starts impact user experience | **Medium** | Low | Slow AI responses | Warm-up functions via scheduled keep-alive; show loading states |
| 5 | RLS policy mistakes expose data | **High** | Low (with testing) | Data breach | Test RLS with per-role SQL queries before going live |
| 6 | Bandwidth overage on Supabase Free (5GB) | **Medium** | Medium | Service disruption | Optimize assets; use CDN for videos; compress responses |
| 7 | Realtime subscription limits at peak usage | **Low** | Low | Delayed messages | Fall back to polling when Realtime channel is full |
| 8 | Migrating auth users from mock to Supabase | **Medium** | Medium | Existing seeded users lose access | Pre-seed Supabase Auth with matching users; script the migration |
| 9 | Post-MVP feature creep during migration | **High** | Medium | Scope expansion delays launch | Strictly enforce "Phase N-1 must be complete before Phase N" |

---

## 6. Contradictions Found Between Documents

### 6.1 Role Definitions

| Document | Roles Defined |
|----------|---------------|
| ARCHITECTURE.md | No explicit role table; mentions student + mentor + admin |
| BRD.md | `visitor`, `student`, `mentor` |
| PRD.md | `visitor`, `student`, `mentor` |
| APPLICATION_FLOW.md | `visitor`, `student`, `mentor` |
| AUDIT.md | `student`, `mentor`, `admin` (future) |

**Resolution**: Keep `visitor`, `student`, `mentor` for v1. `admin` is deferred as stated in BRD. Update all docs to be consistent.

### 6.2 Database Table Count

| Document | Tables Listed |
|----------|---------------|
| ARCHITECTURE.md | ~13 tables (migration list) |
| BRD.md | 13 tables (schema mapping) |
| AUDIT.md | 30 tables (comprehensive audit) |

**Resolution**: AUDIT.md's 30-table list is the authoritative source (it was generated from actual codebase analysis). The implementation plan should be updated to reflect 30 tables, not 13.

### 6.3 File Modification Estimates

IMPLEMENTATION_PLAN.md estimates ~80 created, ~120 modified, ~35 deleted. At 235 total file changes across 11 phases, this seems conservative given 64+ TypeScript files and the full restructure in Phase 5. Estimated actual: ~100 created, ~150 modified, ~40 deleted.

**Resolution**: Update estimates in IMPLEMENTATION_PLAN.md to reflect audit findings (30+ tables, 24 services, 100 files total).

### 6.4 localStorage Key Mapping

| Document | Mapping |
|----------|---------|
| BRD.md | 14 localStorage keys mapped |
| APPLICATION_FLOW.md | 27 localStorage keys listed |
| AUDIT.md | 28 localStorage keys + 7 duplicate findings |

**Resolution**: Use AUDIT.md as authoritative source (28 keys). Update BRD.md schema mapping to include all keys.

### 6.5 Service Count

| Document | Count |
|----------|-------|
| ARCHITECTURE.md | 16 services listed |
| AUDIT.md | 24 services found (with some redundant) |

**Resolution**: Use AUDIT.md. Consolidate redundant services before Phase 3. Target: ~20 canonical services.

---

## 7. Migration Risk Assessment

### 7.1 Phase-by-Phase Risk

| Phase | Risk Level | Reason |
|-------|-----------|--------|
| Phase 0 (Audit) | ✅ **Low** | Already done — AUDIT.md exists |
| Phase 1 (Schema) | ✅ **Low** | SQL migrations are well-understood; no application code changes |
| Phase 2 (Auth) | ⚠️ **Medium-High** | Auth gates everything; mock → Supabase transition is complex |
| Phase 3 (Services) | ⚠️ **Medium** | 24 services to migrate; some have duplicate implementations |
| Phase 4 (Edge Functions) | ✅ **Low-Medium** | Standard Supabase Edge Function patterns |
| Phase 5 (Folder Restructure) | ⚠️ **Medium** | 100+ files move; import path changes are error-prone |
| Phase 6 (TanStack Query) | ✅ **Low** | 4/13 hooks already done; pattern is established |
| Phase 7 (Storage) | ✅ **Low** | Standard Supabase Storage integration |
| Phase 8 (Realtime) | ✅ **Low** | Narrow-scope subscriptions (messaging only) |
| Phase 9 (Monitoring) | ✅ **Low** | Standard SDK integration |
| Phase 10 (Production) | ⚠️ **Medium** | Many moving parts; state audit is comprehensive |
| Phase 11 (Cleanup) | ✅ **Low** | Remove dead code; update docs |

### 7.2 Overall Migration Timeline Estimate

| Phase | Estimated Effort | Dependencies |
|-------|-----------------|--------------|
| Phase 0 | ✅ Done | None |
| Phase 1 | 2-3 days | Phase 0 |
| Phase 2 | 3-5 days | Phase 1 |
| Phase 3 | 10-15 days | Phase 2 |
| Phase 4 | 5-7 days | Phase 2 |
| Phase 5 | 5-7 days | None (parallel) |
| Phase 6 | 3-5 days | Phase 3 |
| Phase 7 | 2-3 days | Phase 3 |
| Phase 8 | 2-3 days | Phase 6 |
| Phase 9 | 1-2 days | Phase 2 |
| Phase 10 | 3-5 days | Phases 1-9 |
| Phase 11 | 2-3 days | Phases 1-10 |

**Total Estimated**: ~6-8 weeks (full-time single developer)

---

## 8. Recommendations

### 8.1 Immediate (Before Migration)

1. **Consolidate duplicate services** (taskService + taskStorage, applicationService + etc.)
2. **Split monolithic files** (MentorDashboard, MentorScheduler, WhatsAppMessaging, EventManagement) into sub-components
3. **Set up CI** (TypeScript check + build on every PR)
4. **Set up Vercel project** (preview deployments)
5. **Add `.gitignore` entries** for `.env.local`, `dist/`, `node_modules/`

### 8.2 During Migration

6. **Dual-mode auth**: Allow mock auth to coexist with Supabase Auth during transition
7. **One domain at a time** in Phase 3: complete one service migration fully before starting the next
8. **Test RLS policies early**: Before Phase 3 begins, test all RLS policies against the schema
9. **Maintain seed data parity**: TypeScript seed and SQL seed must match during migration

### 8.3 Post-Migration

10. **Remove Sentry if 5K event limit is problematic** (use Supabase Logs)
11. **Monitor free tier usage** monthly (set up alerts at 75% of limits)
12. **Quarterly restore test** (verify backups)
13. **Update all documentation** to reflect final architecture

### 8.4 Architecture Improvements for v2

14. **Multi-mentor support**: Add `programs.mentor_id` to support multiple mentors per program
15. **Google Calendar sync**: Two-way sync for session bookings
16. **Real payment integration**: Stripe for consultations and store products
17. **Offline support**: Service Worker + IndexedDB for basic offline access

---

## 9. Production Readiness Assessment

| Criterion | Current State | Target State | Gap |
|-----------|--------------|--------------|-----|
| Authentication | Mock (localStorage) | Supabase Auth + JWT + RLS | ❌ Full migration needed |
| Authorization | Frontend role checks | RLS-enforced database policies | ❌ Full migration needed |
| Data Persistence | localStorage (~5MB) | PostgreSQL (2GB) | ❌ Full migration needed |
| Error Monitoring | None | Sentry | ❌ Not implemented |
| Analytics | None | PostHog | ❌ Not implemented |
| Performance | Lazy-loaded routes | + TanStack Query cache, pagination | ⚠️ Partial |
| Security | No real auth | JWT + RLS + input validation | ❌ Not implemented |
| Backup | None | Daily automated + weekly | ❌ Not implemented |
| CI/CD | None | GitHub Actions + Vercel | ❌ Not implemented |
| Testing | None | Unit + integration + E2E | ❌ Not implemented |
| Documentation | Good (6 docs) | + 6 new architecture docs | ✅ Docs being produced |
| Deployment | Local only | Vercel SPA | ❌ Not deployed |

**Overall Production Readiness**: 10% (pre-migration)

**Target Production Readiness Post-Migration**: 90%

---

## 10. Conclusion

Mentorino's architecture is fundamentally sound. The service layer abstraction, thorough documentation, and clear migration plan demonstrate strong engineering discipline. The codebase is a typical MVP — functional but not production-ready — which is exactly the stage where this migration should happen.

The most critical path forward:
1. Split the monolithic files NOW (before any backend work)
2. Phase 1 (schema) can begin immediately
3. Auth migration should be designed with a dual-mode fallback to unblock Phase 3
4. One domain at a time for service migration

**Final Verdict**: Architecturally approved for migration. The 6 new architecture documents (DATABASE_ARCHITECTURE.md, SECURITY.md, BACKUP_AND_RECOVERY.md, CODING_STANDARDS.md, DEVELOPMENT_RULES.md, and this review) provide sufficient specification to begin implementation.

Estimated time to production: **6-8 weeks** for a single developer working full-time.
