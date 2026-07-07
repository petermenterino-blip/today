# TECHNICAL_DEBT.md

**Date:** 2026-07-06  
**Auditor:** Principal Architect

---

## Inventory

### 1. Dead Code (Low Priority)

| File | Lines | Reason | Effort to Remove |
|------|-------|--------|------------------|
| `src/services/geminiService.ts` | 16 | Superseded by `aiAssistant.ts` + `edgeFunctionService.ts` | 5 min |
| `src/services/taskStorage.ts` | 128 | Deprecated — use `taskService.ts` instead | 15 min |
| `src/hooks/useActionItems.ts` | ~80 | Never imported | 5 min |
| `src/hooks/useEventRsvp.ts` | ~60 | Never imported | 5 min |
| `src/hooks/useFileUpload.ts` | ~60 | Never imported | 5 min |
| `src/hooks/useTransactions.ts` | ~50 | Never imported | 5 min |
| `src/lib/realtimeManager.ts:getActiveChannelCount()` | 3 lines | Hardcoded to return 0 | 2 min |

### 2. Type Safety

| Issue | Count | Files | Effort to Fix |
|-------|-------|-------|---------------|
| `: any` type annotations | 350+ | 77 | Large — many are pragmatic casts |
| `as any` casts | ~50 | 20+ | Medium — define proper interfaces |
| Untyped API responses | ~30 | 15 | Medium — add response types |

### 3. Code Style

| Issue | Count | Files | Effort |
|-------|-------|-------|--------|
| `console.warn` instead of `logger.warn()` | 42 occurrences | 19 | Medium — replace all calls |
| Duplicate `getCorsHeaders` | 2 definitions | `middleware/auth.ts` | 2 min |
| `index.css` inline in `src/` root | 1 file | — | Move to `src/styles/` |

### 4. Testing Gaps

| Area | Coverage | Notes |
|------|----------|-------|
| Unit tests | Partial | Core services covered, many components not |
| E2E tests | Partial | Playwright tests exist, coverage gaps |
| Edge function tests | None | Manual testing only |

### 5. Missing Features (Non-Blocking)

| Feature | Priority | Notes |
|---------|----------|-------|
| Virus scanning on uploads | Low | MIME validation exists, no AV scan |
| Orphan cleanup cron | Low | No cleanup on user deletion |
| Email plain-text alternatives | Low | HTML-only emails |
| Rate limiting on custom endpoints | Low | Only edge functions have rate limits |

---

## Repayment Plan

### Sprint 1 (Post-Launch Week 1)
- Remove dead code files (30 min)
- Clean up `console.warn` → `logger.warn` (1 hr)
- Remove duplicate `getCorsHeaders` (2 min)
- Set up Sentry error tracking (1 hr)

### Sprint 2 (Post-Launch Week 2)
- Add proper type definitions for top 5 `any`-heavy files (2 hr)
- Add CSP and security headers via `vercel.json` (30 min)
- Add `List-Unsubscribe` to emails (30 min)

### Sprint 3 (Post-Launch Month 1)
- Full type coverage for analytics module (3 hr)
- Add virus scanning via Supabase Storage webhook (4 hr)
- Add orphan cleanup cron job (2 hr)

### Future
- Migrate Gemini from `flash-exp` to stable `flash` model
- Add email format validation
- Add plain-text email alternatives

---

## Summary

```
Total estimated technical debt: ~40 hours
Critical debt: 0 hours
High debt: 0 hours
Medium debt: ~15 hours
Low debt: ~25 hours

Status: ✅ HEALTHY — debt is manageable and non-blocking
```
