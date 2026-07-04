

# Internal Alpha Checklist — Mentorino RC2.6

> **Note:** This is the pre-flight & environment checklist. For the alpha tester workflow checklist (role-specific testing steps), see `../reports/rc2.6-internal-alpha-checklist.md`.

## Pre-Flight

### Environment
- [ ] `VITE_SUPABASE_URL` set to staging project
- [ ] `VITE_SUPABASE_ANON_KEY` set to staging project anon key
- [ ] Supabase Email/Password auth provider enabled
- [ ] Email confirmation disabled (or confirmation flow implemented)
- [ ] Password reset redirect URL configured

### Edge Function Secrets
- [ ] `SUPABASE_URL` set
- [ ] `SUPABASE_SERVICE_ROLE_KEY` set
- [ ] `RESEND_API_KEY` set (Resend API key obtained and verified)
- [ ] `GEMINI_API_KEY` set (Google AI API key obtained)

### Database
- [ ] All 17 migrations applied (001-015 + 900 + 999)
- [ ] Realtime publication enabled on `messages`, `notifications`, `sessions`, `bookings`
- [ ] Storage buckets created (profile-avatars, student-documents, mentor-resources, gallery-images)
- [ ] Storage RLS policies applied

## Security Gates (Must Fix Before Alpha)

### Critical
- [ ] `scheduled/index.ts` — CRON_SECRET verification implemented (not relying on Authorization header alone)
- [ ] `resend/index.ts` — role validation added (only mentors can send emails)

### High
- [ ] `profiles.mentor_id` storage policy fixed — use program_enrollments → programs join
- [ ] `tempPassword` removed from `approveApplication` return value
- [ ] RLS policies added for event child tables (event_attendees, event_files, event_feedbacks, event_recordings)
- [ ] `authService.ts` default role fallback changed from `'student'` to error/null
- [ ] Edge function role validation — at minimum for gemini/index.ts

### Medium
- [ ] Mentor SELECT on applications scoped to their own program
- [ ] Retry mechanism for invitation flow (orphaned auth user prevention)
- [ ] Email failure on approval shows visible error (not silently swallowed)

## Functional Verification

### Visitor Flows
- [ ] Landing page loads and renders
- [ ] Application form submits successfully
- [ ] Resume document uploads to storage
- [ ] All public pages render (About, Programs, FAQ, Contact, Gallery, Terms, Privacy)

### Authentication
- [ ] Email/password login works
- [ ] Password reset email sent
- [ ] Session persists across page reload
- [ ] Logout clears session and redirects to landing

### Mentor Flows
- [ ] Mentor login → dashboard renders with all tabs
- [ ] Applications tab shows pending applications
- [ ] Approve application → user created in auth → status set to 'invited' → email sent
- [ ] Reject application → status set to 'rejected' → rejection email sent
- [ ] Mentees tab shows assigned students
- [ ] Overview tab shows metrics
- [ ] Tasks tab works
- [ ] Messaging loads conversations

### Student Flows
- [ ] Student login → dashboard renders
- [ ] Goals create/read/update/delete works
- [ ] Journal create/read works (title saved correctly)
- [ ] Sessions list visible
- [ ] Tasks list visible
- [ ] Events visible
- [ ] Booking creates and saves to DB
- [ ] Messaging — create conversation, send/receive messages (realtime)

### Messaging
- [ ] Conversation list loads
- [ ] New conversation creates correctly
- [ ] Messages send and appear in real-time
- [ ] Voice messages record and play back
- [ ] Group conversations work (create, add/remove participants)

## Quality Verification

### Loading States
- [ ] All pages show spinner during data fetch
- [ ] All pages have Suspense fallback
- [ ] Auth loading shows full-screen spinner (not flash of login page)

### Empty States
- [ ] Empty goals shows message
- [ ] Empty journal shows message
- [ ] Empty conversations shows message
- [ ] Empty bookings shows message
- [ ] Empty tasks shows message
- [ ] Empty events shows message

### Error States
- [ ] Failed login shows error message
- [ ] Failed application submit shows error
- [ ] Failed goal create shows error
- [ ] Failed message send shows error
- [ ] Failed booking shows error
- [ ] Failed document upload shows error

### Forms
- [ ] Application form validates required fields
- [ ] Goal form validates title
- [ ] Journal form validates content
- [ ] Login form validates email format
- [ ] Contact form validates required fields

## Performance Verification

### Bundle
- [ ] Vendor chunk < 500 KB gzipped
- [ ] No route chunk > 200 KB

### Images
- [ ] All below-fold images use `loading="lazy"`
- [ ] All images have `alt` attributes

### Rendering
- [ ] Dashboard loads within 3 seconds
- [ ] Conversation list loads within 2 seconds
- [ ] Message thread loads within 1 second

## Environment

### Production Readiness
- [ ] `.env.local` excluded from git (`*.local` in .gitignore ✅)
- [ ] No hardcoded secrets in source code
- [ ] Sentry DSN configured (optional)
- [ ] No `console.log` debug statements in production code
- [ ] `dist/` excluded from git

### Deployment
- [ ] Build succeeds (`tsc --noEmit` + `vite build`)
- [ ] Static assets deploy to CDN/hosting
- [ ] Edge functions deploy to Supabase
- [ ] Supabase Auth configured with proper redirect URLs
- [ ] CORS headers allow staging domain

## Alpha Test Plan

### Day 1 — Smoke Test
- [ ] Create 2 mentor accounts
- [ ] Create 5 student accounts via invitation flow
- [ ] Each mentor takes 2-3 students
- [ ] Verify all 10 journeys from RC2.2

### Day 2-3 — Feature Test
- [ ] Goals: create, update, complete, delete
- [ ] Journal: create, read, edit
- [ ] Messaging: 1:1 and group
- [ ] Booking: create multiple bookings
- [ ] Sessions: view and update attendance

### Day 4-5 — Edge Cases
- [ ] Reject application → verify email sent and status correct
- [ ] Delete goal → verify deletion
- [ ] Archive conversation → verify archived
- [ ] Upload document → verify in storage
- [ ] Reset password → verify new password works

### Day 6-7 — Bug Bash
- [ ] All testers use the app concurrently
- [ ] Report all crashes, data loss, and UX issues
- [ ] Prioritize fixes for production pilot

## Sign-Off

| Role | Name | Date |
|------|------|------|
| ✅ QA Lead | | |
| ✅ Security Lead | | |
| ✅ Product Owner | | |
| ✅ Tech Lead | | |
