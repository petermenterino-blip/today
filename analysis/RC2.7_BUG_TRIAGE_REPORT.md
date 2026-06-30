# RC2.7 — Bug Triage Report

## Methodology
All issues discovered during RC2 analysis phases (environment validation, workflow testing, UX review, security validation, performance validation). Classified by severity.

---

## Critical Bugs (Fix Immediately)

| # | Issue | Location | Impact | Effort |
|---|-------|----------|--------|--------|
| C1 | 3 edge functions have **no real auth** — only check header exists, never validate JWT | `edge-functions/{calendar,meet,gemini}/index.ts` | Anyone can call these functions; gemini API key could be drained | 1 day |
| C2 | **No Google OAuth flow** on frontend — `googleAccessToken` never obtained | Frontend (no component found) | Calendar sync and Meet link generation completely non-functional | 2-3 days |
| C3 | `custom_forms` and `form_templates` tables have **RLS enabled but zero policies** | `supabase/migrations/999_rls.sql` | Any authenticated user can read/write all form data | 0.5 day |

---

## High Bugs (Fix Before Internal Alpha)

| # | Issue | Location | Impact | Effort |
|---|-------|----------|--------|--------|
| H1 | No email verification on registration | `authService.ts` | Users can register without verified email | 0.5 day |
| H2 | No `staleTime` on 13/14 query hooks | All `hooks/*.ts` except `useBookings.ts` | Network request on every component mount | 0.5 day |
| H3 | Empty dashboard tabs render nothing | `features/student/UserDashboard.tsx`, `features/mentor/MentorDashboard.tsx` | User confusion, perceived brokenness | 2-3 days |
| H4 | Analytics drill-down tabs are empty | `features/admin/analytics` or equivalent | Business users cannot explore data | 1-2 days |
| H5 | No confirmation dialogs for destructive actions | Throughout | Accidental deletes (messages, events, etc.) | 1 day |
| H6 | Stale `application_status` after approval | `AuthContext.tsx` — depends on manual `user-profile-changed` event | Approved user may be stuck on pending page | 0.5 day |
| H7 | Heavy libraries (jspdf, xlsx) imported eagerly | `pages/Reports` or equivalent | Bundle size includes PDF/Excel libs even if not used | 0.25 day |

---

## Medium Bugs (Document for Post-Alpha)

| # | Issue | Location | Effort |
|---|-------|----------|--------|
| M1 | No empty states on any list page (9/11 pages affected) | Various pages | 2 days |
| M2 | No breadcrumbs for deep navigation | Throughout | 0.5 day |
| M3 | Mobile table overflow on wide data tables | Various pages | 0.5 day |
| M4 | No ARIA labels or accessibility attributes | Throughout | 1 day |
| M5 | Settings "Integrations" tab is a stub | `features/settings/Settings.tsx` | 1 day |
| M6 | Student detail view is incomplete | `features/mentor/components/` | 1 day |
| M7 | Booking calendar layout shift on load | `pages/Booking.tsx` | 0.5 day |
| M8 | No rate limiting on any endpoint | Throughout | 1 day |
| M9 | No audit logging for sensitive operations | Throughout | 2 days |
| M10 | Edge function failures surface as generic toast | `services/edgeFunctionService.ts` | 0.5 day |

---

## Low Bugs (Document for Future)

| # | Issue | Location | Effort |
|---|-------|----------|--------|
| L1 | No bundle analysis configured | `vite.config.ts` | 0.25 day |
| L2 | No image optimization pipeline | Build config | 0.5 day |
| L3 | No service worker / offline support | Not configured | 1 day |
| L4 | No breadcrumbs for navigation | Throughout | 0.5 day |
| L5 | Form validation lacks inline error messages | Throughout | 2 days |
| L6 | No keyboard navigation / focus management | Throughout | 3 days |
| L7 | `noUnusedLocals` not enabled in tsconfig | `tsconfig.json` | 0.25 day |

---

## Previously Fixed Issues (Verified)

These were addressed in F1-F6 sprints and remain fixed:

| # | Issue | Sprint | Status |
|---|-------|--------|--------|
| P1 | CRON_SECRET missing from scheduled function | F1.1 | ✅ Verified |
| P2 | resend function had no auth | F1.2 | ✅ Verified (JWT + role) |
| P3 | Storage policy used wrong join (profiles.mentor_id) | F2.1 | ✅ Verified |
| P4 | Event child tables had no RLS | F2.2 | ✅ Verified (new migration) |
| P5 | Zero-policy tables had no RLS | F2.3 | ✅ Verified (new migration) |
| P6 | Password leaked in approveApplication return | F3.1 | ✅ Verified |
| P7 | Role fallbacks used 'student' instead of null | F3.2 | ✅ Verified |
| P8 | Hardcoded mentor IDs in WhatsApp messaging | F4.1 | ✅ Verified |
| P9 | Journal missing title on save | F4.2 | ✅ Verified |
| P10 | Journal handleSave missing try/catch | F4.3 | ✅ Verified |
| P11 | ProtectedRoute crashing on null application_status | F4.4 | ✅ Verified |
| P12 | StudentEvents toast outside try/catch | F4.5 | ✅ Verified |
| P13 | Booking onBook not async, no error handling | F4.6 | ✅ Verified |
| P14 | Hardcoded mentor names in ConversationList | F4.7 | ✅ Verified |
| P15 | Missing lazy loading on images | F5.1 | ✅ Verified |
| P16 | Missing alt text on images | F5.2 | ✅ Verified |
| P17 | useRealtime stale closure | F5.3 | ✅ Verified |
| P18 | useBookings duplicate hooks, no staleTime | F5.4/F6.3 | ✅ Verified |
| P19| React.memo missing on messaging components | F6.1 | ✅ Verified |
| P20 | useMemo missing for filteredConversations | F6.2 | ✅ Verified |

---

## Bug Count Summary

| Severity | New | Fixed (Verified) |
|----------|-----|-----------------|
| Critical | 3 | 5 |
| High | 7 | 15 |
| Medium | 10 | 0 |
| Low | 7 | 0 |
| **Total** | **27** | **20** |

---

## Recommended Fix Order

```
Week 1:
  C1 — Fix 3 edge function auth (1 day)
  C2 — Implement Google OAuth flow (2-3 days)
  C3 — Add RLS for custom_forms + form_templates (0.5 day)
  H2 — Add staleTime to all query hooks (0.5 day)

Week 2:
  H1 — Add email verification option (0.5 day)
  H5 — Add confirmation dialogs (1 day)
  H6 — Fix stale application_status (0.5 day)
  H7 — Lazy-load heavy libraries (0.25 day)
  M1 — Add empty states (2 days)

Week 3:
  M3 — Mobile table responsiveness (0.5 day)
  M4 — Basic accessibility (1 day)
  M5-M7 — Feature stubs (2.5 days)
  M10 — Improve edge function error UX (0.5 day)
```
