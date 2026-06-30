# Security Verification Report — Mentorino RC2.4

## Risk Summary

| Severity | Count | Action |
|----------|-------|--------|
| 🔴 CRITICAL | 2 | Must fix before any deployment |
| 🟠 HIGH | 5 | Must fix before pilot |
| 🟡 MEDIUM | 7 | Should fix before pilot |
| 🟢 LOW | 8 | Address post-pilot |

## 🔴 CRITICAL Findings

### C1 — `resend/index.ts`: Open Email Relay (edge-functions/resend/index.ts:39-47)
**Issue**: The function only checks for the presence of an `Authorization` header. It does not validate the caller's identity or role. Any authenticated user (including students) can send templated emails to any recipient address, impersonating `notifications@mentorino.com`.
**Impact**: Phishing from the project domain, spam, reputational damage.
**Fix**: Extract caller JWT via `supabase.auth.getUser()`, verify they have `mentor` role, and restrict `to` address to the caller's own email or verified mentees.

### C2 — `scheduled/index.ts`: Service Role Key Exposed (edge-functions/scheduled/index.ts:20-26)
**Issue**: The function creates a Supabase admin client using `SUPABASE_SERVICE_ROLE_KEY` (bypasses all RLS). Any authenticated user with a valid JWT can trigger any of the 4 tasks: read all profiles, send emails, cancel all scheduled sessions, soft-delete notifications.
**Impact**: Total data exfiltration, destructive operations, mass email abuse.
**Fix**: Replace `Authorization` header check with a `CRON_SECRET` verification. The Supabase cron scheduler sends a specific secret; the function should validate against it rather than accepting any JWT.

## 🟠 HIGH Findings

### H1 — Temp Password Leaked to Frontend (services/applicationService.ts:319)
**Issue**: `approveApplication` returns `{ data: { ... password: tempPassword } }` to the caller (the mentor's browser). This exposes the newly created student's password in the API response.
**Impact**: Password visible in browser dev tools, network logs, state management.
**Fix**: Remove `password` from the returned data object. The password should only travel via the welcome email.

### H2 — Broken Storage Policy (supabase/migrations/014_storage.sql:22-30)
**Issue**: The `docs_mentor_read_assigned` policy references `profiles.mentor_id` which does not exist in the `profiles` table schema.
**Impact**: Mentor read access to student documents is completely broken — SQL error on every attempt.
**Fix**: Replace with a subquery through `program_enrollments` → `programs` to determine mentor-student relationship.

### H3 — 14 Tables with Zero RLS Policies (supabase/migrations/999_rls.sql)
**Issue**: RLS is enabled on 40+ tables but 14 have zero policies. All client operations against these tables are denied.
**Affected Tables**: `event_attendees`, `event_files`, `event_feedbacks`, `event_recordings`, `application_notes`, `application_info_requests`, `student_tags`, `student_timeline_events`, `custom_forms`, `form_templates`, `mentor_availability`, `products`, `transactions`, `announcements`
**Impact**: All frontend operations against these tables silently fail (denied by RLS).
**Fix**: Add at minimum SELECT and INSERT policies for authenticated users on tables with functional frontend use.

### H4 — Default Role Fallback to 'student' (services/authService.ts:51,111,136)
**Issue**: If the auth trigger fails to create a profile row, `profile?.role || 'student'` defaults to 'student'. A mentor whose profile trigger failed would be treated as a student.
**Impact**: Privilege escalation (mentor → student is downgrade, but admin → student is privilege loss). If combined with other bugs, a regular user could be treated as student with unintended access.
**Fix**: Return an error/null instead of defaulting to 'student'.

### H5 — Edge Functions Lack Role-Based Access Control
**Issue**: All edge functions only check `Authorization` header existence, not JWT claims. `gemini/index.ts` allows any authenticated user to invoke paid AI API calls at project cost.
**Impact**: Cost abuse, unlimited AI API usage by any student.
**Fix**: Add role validation (e.g., `Deno.env.get('SUPABASE_URL')` + `createClient()` + `supabase.auth.getUser()` to verify caller).

## 🟡 MEDIUM Findings

| # | Finding | File | Detail |
|---|---------|------|--------|
| M1 | Mentor SELECT on applications is unscoped | 999_rls.sql:331-334 | Any mentor reads ALL applications, not just their program's |
| M2 | Orphaned auth user on approval failure | applicationService.ts:279-322 | `signUp` before status update — network error creates orphan |
| M3 | Email failure silently swallowed | applicationService.ts:312-314 | User created but never receives credentials |
| M4 | No invitation expiry | applicationService.ts | Invited status has no TTL |
| M5 | `user-profile-changed` event unauthenticated | AuthContext.tsx:67 | Any script can trigger profile re-fetch |
| M6 | Route protection relies on in-memory user | ProtectedRoute.tsx | No JWT expiry check on route access |
| M7 | GEMINI_API_KEY exposed to all authenticated users | gemini/index.ts | No role check, no rate limit |

## 🟢 LOW Findings

| # | Finding | Detail |
|---|---------|--------|
| L1 | No client-side rate limiting on login | Relies solely on Supabase server-side limits |
| L2 | Password reset triggers on first click | No confirmation prompt |
| L3 | Invitation token is application UUID | Predictable if application IDs are leaked |
| L4 | Profiles INSERT/DELETE policies missing | Handled by auth trigger so not needed client-side |
| L5 | Various tables missing DELETE policies | Not exposed in current frontend code |
| L6 | No explicit session timeout | Relies on Supabase token expiry (1 hour) |
| L7 | Student can "enroll" with status 'approved' | Bypasses mentor review in browse programs |
| L8 | No CAPTCHA on application form | No spam prevention on public form |

## RLS Coverage Matrix (40 Tables)

| Policy Coverage | Tables |
|----------------|--------|
| ✅ Complete (3-4 ops) | profiles, programs, sessions, conversations, conversation_participants |
| 🟡 Partial (1-2 ops) | goals, tasks, journals, bookings, messages, events, applications, notifications, tags, resources, mentor_settings, dashboard_layouts, form_submissions, ai_chat_history, student_progress, analytics_events, goal_milestones, surveys, survey_responses, shared_files, form_templates, applications |
| 🔴 Zero policies | event_attendees, event_files, event_feedbacks, event_recordings, application_notes, application_info_requests, student_tags, student_timeline_events, custom_forms, mentor_availability, products, transactions, announcements |

## Recommendations (Priority Order)

### Before Staging Deployment:
1. Fix `scheduled/index.ts` — add CRON_SECRET verification
2. Fix `resend/index.ts` — add role validation  
3. Fix storage policy `docs_mentor_read_assigned`
4. Add RLS policies for event child tables

### Before Pilot/Alpha:
5. Remove password from approveApplication return
6. Add default role fallback → error instead of 'student'
7. Add role validation to gemini/index.ts
8. Add RLS scoping for mentor application reads
