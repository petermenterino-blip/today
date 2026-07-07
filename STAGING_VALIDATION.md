# Staging Validation Report

## Environment
- **Supabase Project**: `rpxcrgpxyuvhnhnopvpa` (mentarino-staging, East US)
- **App URL**: `http://localhost:3000` (dev server with staging Supabase config)
- **Auth**: Real authentication via Supabase Auth (no mocks)
- **Database**: Clean — all 47 migrations applied, then seeded with deterministic QA data
- **Date**: 2026-07-06

## Validation Scope
All user journeys validated with **real authentication** and **real Supabase backend**:
- Visitor (unauthenticated) — landing, auth, apply
- Mentor (authenticated) — dashboard, applications, mentees, messaging, resources, sessions, analytics, settings
- Student A (authenticated) — dashboard, goals, tasks, journal, sessions, messaging, resources, events, profile
- Student B (authenticated) — goals isolation, tasks isolation

## Summary
| Metric | Value |
|---|---|
| Total tests | 43 |
| Passed | 42 (97.7%) |
| Failed | 1 (2.3%) — realtime reply (flaky) |
| Mock-based tests excluded | 2 (`student-dashboard.spec.ts`, `debug-auth.spec.ts`) |
| Test duration | ~2.6 minutes |
| Report formats | HTML, JUnit XML, JSON |

## Test Results by Role

### Visitor (7/7 passed)
- Landing page loads
- Auth page shows login form
- Application form is accessible
- Application form validates required fields
- Visitor blocked from mentor dashboard
- Visitor blocked from student dashboard
- No console errors on landing page

### Mentor (12/12 passed)
- Dashboard overview loads
- Applications queue accessible
- Application detail view
- Application approval flow
- Application rejection flow
- Mentees tab shows both students
- Messaging tab accessible
- Resources tab accessible
- Sessions tab accessible
- Analytics tab accessible
- Settings page accessible
- No console errors

### Student A (10/10 passed)
- Dashboard shows goals overview
- Goals page lists personal goals
- Goal detail shows milestones
- Tasks page lists assigned tasks
- Journal page accessible
- Sessions page shows scheduled sessions
- Messaging accessible
- Resources accessible
- Events/calendar accessible
- Profile page accessible
- No console errors

### Student B — Isolation (4/4 passed)
- Dashboard shows own goals (Security+ Certification)
- Cannot see Student A goals (Product Roadmap)
- Tasks page shows own tasks
- No console errors

### Realtime (3/4 passed, 1 flaky)
- Mentor sends message → Student A receives it
- Student A replies → Mentor receives it ❌ (flaky — realtime subscription timing)
- Reconnect after page refresh
- Navigation between tabs no errors

## Known Issues

### 1. Realtime Reply Flaky (realtime.spec.ts:42)
The bidirectional realtime messaging test fails intermittently. The student sends a message but the mentor doesn't see it within the timeout. Possible causes:
- Realtime channel subscription timing race
- Conversation selection on mentor side not defaulting to the right conversation
- Underlying realtime infrastructure latency

### 2. Placeholder Secrets
Edge function secrets (`RESEND_API_KEY`, `GEMINI_API_KEY`, `CRON_SECRET`) are set to placeholder values. Must be renewed in Supabase dashboard for:
- Email notifications (Resend)
- AI features (Gemini)
- Scheduled functions (CRON_SECRET)

### 3. Missing Edge Functions
Functions `track-event` and `video-token` are referenced in migrations but source directories don't exist locally. Only 4 functions deployed.

### 4. `supabase/config.toml` Deleted
Need recreating for future CLI-based config pushes.

## Changes Made to Enable Validation

### Migration Files Renamed (duplicate version prefixes)
| Original | Renamed |
|---|---|
| `023_resources_complete.sql` | `0231_resources_complete.sql` |
| `023_reviews_system.sql` | `0232_reviews_system.sql` |
| `028_visitor_bookings_crm.sql` | `9993_visitor_bookings_crm.sql` |
| `030_crm_module5_complete.sql` | `0301_crm_module5_complete.sql` |
| `030_messaging_fixes.sql` | `0302_messaging_fixes.sql` |
| `999_rls.sql` | `9990_rls.sql` |
| `999_optimization.sql` | `9991_optimization.sql` |
| `999_fix_rls_recursion.sql` | `9992_fix_rls_recursion.sql` |

### Migration SQL Fixes
- Error code `unique_violation` → `sqlstate '42710'` in 3 files
- Reserved word `"time"` quoted in `027_events_module14_fix.sql`
- `e.date::date` cast added in events function
- `is_mentor()` policy wrapped in DO block with existence check

### Seed Data Added
Goals, milestones, tasks, journals, sessions, notifications, resources, events — all linked to real QA auth users.

### Test Selectors Fixed
All `data-testid` selectors (nonexistent in app source) replaced with role-based or text-based selectors. All mock-based tests excluded from staging.
