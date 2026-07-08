# QA Evidence Binder — Mentorino Production

**Generated**: (date)
**Playwright**: 1.61.1
**Target**: Production (https://today-ten-zeta.vercel.app)
**Result**: 100/100 PASS (Chromium)

## Test Suite Summary
| Suite | Tests | Pass | Fail |
|-------|-------|------|------|
| REG-SMK (smoke) | 10 | 10 | 0 |
| PUB (public website) | 21 | 21 | 0 |
| STU (student portal) | 13 | 13 | 0 |
| MNT (mentor dashboard) | 15 | 15 | 0 |
| API (contract) | 10 | 10 | 0 |
| SYN (cross-portal sync) | 4 | 4 | 0 |
| DB (database integrity) | 10 | 10 | 0 |
| EML (email workflows) | 7 | 7 | 0 |
| NOT (notifications) | 6 | 6 | 0 |
| SEC (security) | 7 | 7 | 0 |
| PERF (performance) | 7 | 7 | 0 |

## Key Production Observations
1. SPA uses hash routing (`#/student`, `#/mentor?tab=applications`)
2. Auth page placeholders: name@example.com, button "SIGN IN"
3. Contact form placeholders: e.g. John Doe, e.g. john@example.com
4. No /api/* REST proxy deployed — Supabase direct calls only
5. Student sidebar: Overview, Programs, Journal, Goals, Tasks, Reviews, etc.
6. Mentor tab: `students` is actually `?tab=mentees`
7. Application form is multi-step wizard ("PROGRAM AUDIT")
8. No frontend RBAC — SPA renders any hash route without redirect
9. No meta description tag in HTML head
10. Rate-limit headers absent on all responses

## Selector Reference
- Auth email: `input[placeholder="name@example.com"]`
- Auth password: `input[type="password"]`
- Auth submit: `button:has-text("SIGN IN")`
- Contact name: `input[placeholder*="John Doe" i]`
- Contact email: `input[placeholder*="john@example" i]`
- Contact message: `textarea[placeholder*="Tell Peter" i]`
- Contact submit: `button:has-text("Send Message")`
- Student nav: sidebar links to `#/student/*`
- Mentor applications: heading h1 "Applications"
- Success message: h3 "Message Sent!"

## API Endpoints Status
All `/api/*` endpoints return 404 — API proxy not deployed on production.
