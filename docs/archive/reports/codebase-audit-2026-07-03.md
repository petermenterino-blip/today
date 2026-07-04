

# Mentorino Codebase Audit Report

Date: 2026-07-03  
Scope: full local code audit focused on configuration, feature health, and student dashboard <-> mentor dashboard data sync.

## Executive Summary

The application is not fully healthy yet.

The production build passes, but automated tests are failing and several important student-to-mentor sync flows are only partially wired. The largest issue is that approval/application data does not reliably create the relationship records that the rest of the dashboards depend on. Because goals, journals, messaging, student visibility, and mentor access policies depend heavily on `program_enrollments`, many features can appear disconnected after a student applies or gets approved.

There are also mismatches between frontend statuses and database statuses, missing RLS policies for mentor access to form submissions, student intake data being saved into the wrong shape, and query keys that can overwrite filtered/unfiltered dashboard data.

## Verification Results

### Build

Command: `npm run build`

Result: Passed.

### Unit Tests

Command: `npm test`

Result: Failed.

Failures observed:

1. `src/services/__tests__/applicationService.test.ts`
   - `submits an application successfully`
   - Expected submitted application data to include `user_email`, but service returned an empty/undefined mapped row.

2. `src/services/__tests__/applicationService.test.ts`
   - `returns error on submission failure`
   - Expected `Database error`, but service returned `null`.

3. `src/utils/__tests__/dateUtils.test.ts`
   - `getNJISOString`
   - Expected UTC `Z` output, but actual output was offset format like `2026-07-02T14:44:35.000-04:00`.

### E2E Tests

Command: `npx playwright test --reporter=line`

Result: Failed / not clean.

The run was stopped after many repeated failures because it was spending time repeating the same browser setup and responsive selector problems across projects.

Observed failure categories:

- Application flow tests fail because the test waits for `input[placeholder="+1 (555) 000-0000"]`, but the current application form no longer exposes that field/placeholder as expected.
- Landing tests fail because `MEMBERS PORTAL` appears in more than one place, creating strict-mode selector conflicts.
- Footer tests expect old text such as `Mentorino Trajectory Coaching`, but the current footer content has changed.
- Mobile tests fail because header/sidebar links expected by tests are not visible in the same way on mobile layouts.
- Firefox, WebKit, and Mobile Safari projects fail because Playwright browser binaries are missing locally. The output recommends `npx playwright install`.

## Architecture Snapshot

Frontend:

- React + Vite.
- Routing is handled by `HashRouter` in `src/app/App.tsx`.
- Student dashboard route: `/student/*` -> `UserDashboard`.
- Mentor dashboard route: `/mentor/*` -> `MentorDashboard`.
- Shared/protected routes also include settings, store, survey, and revenue pages.

Backend/data:

- Supabase client is configured in `src/lib/supabase.ts`.
- If `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are missing, the client falls back to localhost/placeholder values. This can hide a configuration problem until runtime.
- Several services use Supabase directly. Some use `safeQuery`/`safeMutate` fallback behavior, which can return cached or fallback data after network/database errors.

Important tables/features:

- `applications`
- `profiles`
- `programs`
- `program_enrollments`
- `tasks`
- `goals`
- `journals`
- `sessions`
- `bookings`
- `messages` / `conversations`
- `custom_forms`
- `form_submissions`

## Student/Mentor Sync Matrix

| Feature | Student writes/fills | Mentor reads/reviews | Current status | Main issue |
| --- | --- | --- | --- | --- |
| Public application | `applications` via `applicationService.submitApplication` | Mentor application review | Broken/partial | Insert does not return selected row, so service maps `{}` after submission. |
| Application approval | Mentor approves application | Student profile should be created | Broken/partial | Approval creates auth/profile but does not link `applications.user_id` or create `program_enrollments`. |
| Student visibility | `profiles` | Mentor dashboard student list | Partial | Mentor can read profiles broadly, but update/related access depends on enrollments. |
| Goals | `goals` | Mentor goals view | Partial/broken after approval | RLS allows mentor access through `program_enrollments`; approval does not create enrollment. |
| Journals | `journals` | Mentor journal view | Partial/broken after approval | Same enrollment dependency as goals. |
| Tasks | `tasks` | Mentor task/feedback view | Partial | Mentor-created tasks can sync, but student-created task/intake flow uses hard-coded mentor id and mismatched status handling. |
| Second application/intake | `TaskActivityForm` data | Mentor audit/review expected | Broken/partial | Large intake payload is stringified into task description; service only persists a few task fields. |
| Feedback | task status/mentor response | Student sees feedback | Partial | Mentor feedback hook only filters `pending`; student submitted tasks use `submitted`. |
| Sessions | `sessions` | Both dashboards read sessions | Mostly OK if IDs are correct | Requires correct student/mentor ids and RLS. |
| Bookings | `bookings` / visitor bookings | Mentor booking tabs | Partial | Student dashboard refresh comment says filtering is not implemented and relies on RLS. |
| Messaging | conversations/messages | Both dashboards | Broken/partial | Student auto-conversation depends on `program_enrollments`; missing enrollment prevents auto-init. |
| Custom forms | `form_submissions` | Mentor dashboard form submissions | Broken by RLS | RLS allows users to read own submissions only; no mentor read policy exists. |
| Program progress | `student_progress` | Student/mentor views | Partial | Dashboard calls async cache init without awaiting before calculating progress. |

## Critical Findings

### 1. Application submission does not return the inserted row

File: `src/services/applicationService.ts`

Relevant lines:

- `submitApplication` starts at line 132.
- Insert is called around line 154.
- The return maps `(data ?? [{}])[0]` around line 174.

Problem:

Supabase `insert()` does not return rows unless `.select()` is chained. The service returns a mapped empty object after submission. This explains the failing unit test and can make application submission appear successful while the frontend has no real inserted application data.

Impact:

- Application success state can be misleading.
- Tests fail.
- Follow-up UI state cannot trust returned application data.

Recommended fix:

Add `.select().single()` to the application insert and map the actual returned row. Ensure the error branch is tested with the same call chain.

### 2. Approval does not create the relationships needed for dashboard sync

File: `src/services/applicationService.ts`

Relevant lines:

- `approveApplication` starts at line 308.
- It signs up the user and upserts `profiles`.
- It updates application status to `invited` around line 343.

Problem:

Approval does not:

- update `applications.user_id` with the created auth user id;
- create `program_enrollments`;
- assign the student to a mentor/program in the relational model.

Impact:

- Student application remains disconnected from the created auth/profile user.
- Mentor policies for goals and journals depend on `program_enrollments`.
- Messaging auto-initialization depends on enrollment/program mentor linkage.
- Mentor dashboard and student dashboard can show different worlds.

Recommended fix:

On approval, in one server-side/transactional flow:

- create or find the auth user;
- upsert the profile;
- set `applications.user_id`;
- create `program_enrollments` for selected/default program;
- ensure the program has a valid mentor id;
- then send the invitation email.

### 3. Application status mapping is inconsistent

Files:

- `src/services/applicationService.ts`
- `src/features/mentor/hooks/useApplicationReview.ts`

Relevant lines:

- DB `pending_review` is mapped to frontend `pending`.
- `useApplicationReview` initializes `appStatus` as `pending_review` at line 13.
- Pending applications are filtered with `app.status === 'pending'` at line 33.

Problem:

The frontend mixes database statuses and frontend statuses. `invited` is also mapped into `approved`, so the specific invited state can be lost.

Impact:

- Mentor filters can show the wrong results.
- Counts can be wrong.
- Review tabs can drift from database state.

Recommended fix:

Choose one canonical status model at the UI boundary. Either keep DB statuses everywhere or map once and make all filters use the mapped values.

### 4. Application filtering refresh is tied to selected application

File: `src/features/mentor/hooks/useApplicationReview.ts`

Relevant lines:

- Filter effect checks `if (selectedApplication)` before `refreshApps(...)`.

Problem:

Search/status/discipline/page changes only refresh the application list when an application is selected.

Impact:

- Mentor filtering and pagination can appear broken.

Recommended fix:

Run list refresh whenever filters change. Keep application detail refresh separate.

### 5. `useApplications` has one global query key for filtered and unfiltered lists

File: `src/hooks/useApplications.ts`

Problem:

The hook uses a single `['applications']` query key even when refreshing with filter params. Filtered results can overwrite the same cache used by unfiltered dashboard views.

Impact:

- Counts and tabs can show incomplete or stale applications.

Recommended fix:

Include filter params in query keys, or split list/detail/cache responsibilities.

### 6. Mentor cannot read form submissions under current RLS

Files:

- `src/services/customFormService.ts`
- `src/features/mentor/hooks/useDashboard.ts`
- `supabase/migrations/999_rls.sql`

Relevant lines:

- Mentor dashboard calls `customFormService.getAllSubmissions()` around `src/features/mentor/hooks/useDashboard.ts:259`.
- RLS only allows `form_submissions` select where `user_id = auth.uid()`.

Problem:

There is no mentor read policy for `form_submissions`.

Impact:

- Students may submit forms, but mentor dashboard cannot reliably see them.

Recommended fix:

Add a mentor read policy. Ideally restrict by enrollment/program mentor relationship, not all mentors globally, unless global mentor access is intended.

### 7. Student second application/intake data is not properly persisted

Files:

- `src/features/student/TaskActivityForm.tsx`
- `src/features/student/StudentTasks.tsx`
- `src/services/taskService.ts`

Relevant lines:

- `TaskActivityForm` submits many `intake_*` and `counselor_*` fields around lines 204-273.
- `StudentTasks` saves the second application as a task with `description: JSON.stringify(data)` around lines 208-215.
- `taskService.insert` only persists `student_id`, `mentor_id`, `title`, `description`, `due_date`, `priority`, and `status`.

Problem:

The intake form is not stored as structured intake data. It is compressed into a task description string, while many expected fields are not first-class persisted fields.

Impact:

- Mentor review cannot reliably query/filter/display submitted intake details.
- File/base64 data can bloat task descriptions.
- Data entered by students may not reflect where the mentor dashboard expects it.

Recommended fix:

Create a dedicated table for student intake/audit submissions, or store the payload in a structured JSONB column such as `growth_fields` and make mentor UI read that same field.

### 8. Student-created tasks use a hard-coded mentor id

File: `src/features/student/StudentTasks.tsx`

Relevant lines:

- `mentorId: 'mentor-1'` is used around lines 193-195 and 210-212.

Problem:

The task is not assigned to the actual mentor/auth id. In the DB policy, task insert requires `mentor_id = auth.uid()` for mentors; student-created tasks with a fake mentor id are unlikely to satisfy real RLS or mentor sync.

Impact:

- Submitted student activity may not be visible to the correct mentor.
- Inserts may fail under real RLS.

Recommended fix:

Derive mentor id from enrollment/program data, or create a student-submission table where `student_id = auth.uid()` is allowed by RLS.

### 9. Task feedback filters only pending tasks

File: `src/features/mentor/hooks/useFeedback.ts`

Relevant line:

- `pendingTasks = taskActivities.filter(t => t.status === 'pending')`

Problem:

Student second applications are saved as `submitted`, not `pending`. Mentor feedback will miss those if it only looks for `pending`.

Impact:

- Submitted work can fail to appear in the mentor review queue.

Recommended fix:

Define task workflow statuses clearly: `pending`, `submitted`, `reviewed`, `completed`, etc. Mentor review should include `submitted` items.

### 10. Program progress can calculate before cache is loaded

Files:

- `src/services/studentProgressService.ts`
- `src/features/student/UserDashboard.tsx`

Relevant lines:

- `studentProgressService.initCache()` is async.
- `UserDashboard` calls it without awaiting around line 112.
- Progress is calculated from module-level `progressCache` later.

Problem:

Dashboard progress can be calculated before cache has loaded.

Impact:

- Progress can show 0 or stale values until a refresh/re-render.

Recommended fix:

Use React Query or component state for progress loading, and calculate only after data is available.

### 11. Mixed fallback behavior can hide real failures

Files:

- `src/lib/supabaseFallback.ts`
- services using `safeQuery` / `safeMutate`

Problem:

Some services return fallback/cached data on network errors while others fail directly. This makes feature health hard to detect.

Impact:

- Dashboard can look partially populated even when Supabase access is broken.
- Student/mentor views may not match because one feature is cached while another is live.

Recommended fix:

Use a consistent data access policy. Show explicit offline/degraded states instead of silently falling back for core mentor/student sync features.

## Database/RLS Notes

Important RLS behavior from `supabase/migrations/999_rls.sql`:

- Mentors can read student goals only through `program_enrollments`.
- Mentors can read student journals only through `program_enrollments`.
- Task participants can read tasks if `student_id = auth.uid()` or `mentor_id = auth.uid()`.
- Mentors can insert/update tasks only when `mentor_id = auth.uid()`.
- Form submissions can only be read by the submitting user.

This means the missing enrollment creation during application approval is not small. It blocks or weakens several dashboard sync paths.

## Priority Fix Plan

### P0 - Must fix first

1. Fix `applicationService.submitApplication` to return inserted rows correctly.
2. Fix approval flow to link `applications.user_id` and create `program_enrollments`.
3. Add correct mentor RLS policy for `form_submissions`.
4. Replace hard-coded `mentor-1` with real mentor/enrollment linkage.
5. Store second application/intake submissions in a structured table or JSONB field read by mentor dashboard.

### P1 - Dashboard reliability

1. Normalize application statuses across DB, service, and UI.
2. Fix application review filter refresh behavior.
3. Give filtered application queries distinct React Query keys.
4. Update mentor task review to include `submitted` tasks.
5. Make student/mentor task, booking, and message hooks explicitly filter by current user/role instead of relying only on broad fetches.

### P2 - Test and environment cleanup

1. Install Playwright browsers with `npx playwright install`.
2. Update e2e selectors to match current responsive UI and footer copy.
3. Add end-to-end tests for:
   - application submitted -> mentor sees application;
   - mentor approves -> profile/enrollment created;
   - student submits intake -> mentor sees submitted intake;
   - student creates goal/journal -> mentor sees it;
   - mentor creates task/session -> student sees it.

## Final Assessment

Everything is not fully configured and working.

The app builds, but tests are failing and the student/mentor sync is incomplete in several critical places. The core missing piece is the lifecycle connection from application approval to student profile to program enrollment to mentor-owned data access. Until that is fixed, several dashboard features will continue to look inconsistent even if their individual UI components render correctly.
