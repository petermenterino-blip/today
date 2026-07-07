# KNOWN_ISSUES.md

**Date:** 2026-07-06  
**Status:** Open

---

## 🔴 Critical (0)

*None — all critical issues resolved.*

---

## 🟡 High (0)

*None — all high issues resolved or documented as external blockers.*

---

## 🟠 Medium (5)

| # | Issue | Location | Impact | Workaround | Target Fix |
|---|-------|----------|--------|------------|------------|
| M1 | Security headers (CSP, HSTS, X-Frame-Options) not configured | `index.html` / Vercel config | Low — modern browser defaults mitigate most risks | Add `vercel.json` headers config | Post-launch week 1 |
| M2 | No error tracking/monitoring | — | Medium — issues may go unnoticed | Manual log checking | Post-launch week 1 |
| M3 | `allowedHosts: ["all"]` in vite config | `vite.config.ts:20` | Low — dev-only, not in production build | Ignore — production uses built assets | Next dev cycle |
| M4 | Duplicate `getCorsHeaders` middleware function | `middleware/auth.ts:91,107` | Low — second definition overrides first | Clean up with lint pass | Post-launch |
| M5 | No `List-Unsubscribe` header in email templates | Edge functions | Low — may affect deliverability scores | Add header post-launch | Post-launch |

---

## 🟢 Low (8)

| # | Issue | Location | Impact |
|---|-------|----------|--------|
| L1 | 350+ `: any` type annotations across codebase | 77 source files | Code maintainability, no runtime impact |
| L2 | `geminiService.ts` is dead code (never imported) | `src/services/geminiService.ts` | ~16 lines, no impact |
| L3 | `taskStorage.ts` is dead code (deprecated) | `src/services/taskStorage.ts` | ~128 lines, uses `console.warn` for logging |
| L4 | `useActionItems.ts` — dead hook | `src/hooks/useActionItems.ts` | No impact |
| L5 | `useEventRsvp.ts` — dead hook | `src/hooks/useEventRsvp.ts` | No impact |
| L6 | `useFileUpload.ts` — dead hook | `src/hooks/useFileUpload.ts` | No impact |
| L7 | `useTransactions.ts` — dead hook | `src/hooks/useTransactions.ts` | No impact |
| L8 | `realtimeManager.ts:getActiveChannelCount()` hardcoded to return 0 | `src/lib/realtimeManager.ts:47-49` | Metrics inaccuracy |

---

## ⚠️ External Blockers (Must Do Before Launch)

| # | Item | Owner | Notes |
|---|------|-------|-------|
| B1 | Resend domain: verify `notifications@mentorino.com` | DevOps | Needs DNS TXT record |
| B2 | SPF/DKIM/DMARC DNS records | DevOps | Required for email deliverability |
| B3 | Vercel production env vars | DevOps | Set `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, etc. |
| B4 | Supabase Pro upgrade | DevOps | Free tier limits: 500MB DB, 2GB bandwidth |
| B5 | Custom domain DNS | DevOps | Point `mentorino.com` to Vercel |

---

## Summary

```
Critical:  0
High:      0
Medium:    5
Low:       8
External:  5
───────────────
Total:    18
```
