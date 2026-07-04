

# Today Implementation Plan 2 - Claude Anti gravity

## Deep Codebase Analysis Report — All Features Status

> **Date:** July 3, 2026
> **Scope:** Full-stack audit of Mentorino platform (React 19 + TypeScript + Vite 6 + Supabase)
> **Methodology:** Three parallel deep-dive agents analyzed Services/Backend, Database/Migrations, and Dashboards/UI


## TABLE OF CONTENTS

1. [Executive Summary](#1-executive-summary)
2. [Services Layer Analysis](#2-services-layer-analysis)
3. [Database & Migration Analysis](#3-database--migration-analysis)
4. [Dashboard & UI Analysis](#4-dashboard--ui-analysis)
5. [Cross-Dashboard Sync Matrix](#5-cross-dashboard-sync-matrix)
6. [Critical Bugs (Severity: CRITICAL)](#6-critical-bugs-severity-critical)
7. [High Severity Bugs](#7-high-severity-bugs)
8. [Medium Severity Bugs](#8-medium-severity-bugs)
9. [Missing CRUD Operations](#9-missing-crud-operations)
10. [Schema-Service Mismatches](#10-schema-service-mismatches)
11. [Configuration Issues](#11-configuration-issues)
12. [Remediation Roadmap](#12-remediation-roadmap)


## 1. Executive Summary

The Mentorino codebase is a large React 19 + TypeScript application with 50+ service files, 24 database tables, and two parallel dashboards (Mentor: 5,700+ lines, Student: 4,100+ lines). The application has a **hybrid storage architecture** — it attempts to use Supabase as primary storage but falls back to localStorage when Supabase is unavailable.

### Key Findings

| Metric | Count |
|--------|-------|
| Total features analyzed | 24 |
| Fully working (all paths) | 12 |
| Partially broken | 8 |
| Completely broken | 4 |
| Critical bugs | 6 |
| High severity bugs | 7 |
| Medium severity bugs | 8 |
| Missing CRUD operations | 5 |

### Most Critical Issues

1. **Dual ID systems** — localStorage uses string IDs (`"1"`, `"2"`, `student-1719...`), Supabase uses UUIDs. Newly approved students get IDs in `student-${Date.now()}` format that don't match seeded data IDs. This causes goals, tasks, journals, sessions, and progress to silently return empty for newly created students.

2. **Dual task service** — `taskStorage.ts` (pure localStorage) and `taskService.ts` (Supabase + localStorage) coexist. Different parts of the app use different services, causing data to be written to one storage and read from another.

3. **Growth audits invisible to mentor** — Students submit growth audit forms that save directly to localStorage bypassing the service layer. No mentor view exists to read this data.

4. **Custom forms inaccessible to students** — Mentors create custom forms, but students have no UI to fill them out. The `Survey.tsx` page uses a different service (`surveyService`) than `customFormService`.

5. **Credentials never delivered** — When a mentor approves a student, the generated password is shown once in a toast notification with no email/SMS delivery mechanism.

6. **Program progress invisible to mentor** — Students complete lessons and take quizzes, but the mentor dashboard has no view to see student program progress or quiz scores.


## 2. Services Layer Analysis

### 2.1 Supabase Configuration

| File | Status | Issues |
|------|--------|--------|
| `src/lib/supabase.ts` | ✅ Properly configured | None |
| `src/lib/supabaseFallback.ts` | ⚠️ Partial | `isSupabaseAvailable()` only checks env vars, doesn't test connection |
| `src/lib/serviceHelper.ts` | ✅ Properly configured | None |
| `src/lib/errorHandler.ts` | ✅ Properly configured | None |

### 2.2 Service Files — Complete Audit

| # | Service | Storage | CRUD Complete | Realtime/Sync | Status |
|---|---------|---------|---------------|---------------|--------|
| 1 | `authService.ts` | Supabase + localStorage | Login/Logout only | ✅ Custom events | ⚠️ Mock fallback UUID mismatch |
| 2 | `applicationService.ts` | Supabase + localStorage | Full CRUD | ✅ `database-sync` event | 🐛 ID format mismatch on approval |
| 3 | `messageService.ts` | localStorage only | Full CRUD | ✅ Custom events | 🐛 Cross-tab sync broken |
| 4 | `sessionService.ts` | Supabase + localStorage | Full CRUD | ✅ `database-sync` event | ✅ Working |
| 5 | `goalStorage.ts` | localStorage only | Full CRUD | ✅ `database-sync` event | 🐛 ID mismatch vulnerability |
| 6 | `taskStorage.ts` | localStorage only | Full CRUD | ✅ `database-sync` event | 🐛 Duplicate with taskService.ts |
| 7 | `taskService.ts` | Supabase + localStorage | Full CRUD | ✅ `database-sync` event | 🐛 Duplicate with taskStorage.ts |
| 8 | `journalStorage.ts` | localStorage only | Full CRUD | ✅ `database-sync` event | 🐛 ID mismatch vulnerability |
| 9 | `eventService.ts` | Supabase + localStorage | Full CRUD | ✅ `database-sync` event | 🐛 No duplicate check in localStorage path |
| 10 | `bookingService.ts` | Supabase + localStorage | Create/Read/Update | ✅ `database-sync` event | 🐛 No deleteBooking |
| 11 | `studentService.ts` | Supabase + localStorage | Full CRUD | ✅ `database-sync` event | 🐛 ID format mismatch |
| 12 | `programService.ts` | Supabase + localStorage | Create/Read/Update | ✅ `database-sync` event | 🐛 No deleteProgram |
| 13 | `studentProgressService.ts` | localStorage only | Full CRUD | ✅ `database-sync` event | 🐛 ID mismatch, mentor can't view |
| 14 | `transactionService.ts` | localStorage only | Create/Read | ✅ `database-sync` event | 🐛 No update/delete |
| 15 | `notificationService.ts` | localStorage only | Full CRUD | ✅ Custom events | ⚠️ Dual path inconsistency |
| 16 | `profileService.ts` | Supabase + localStorage | Read/Update | ✅ Custom events | 🐛 Profile data split |
| 17 | `resourceService.ts` | localStorage only | Create/Read/Delete | ✅ `database-sync` event | 🐛 No updateResource |
| 18 | `customFormService.ts` | localStorage only | Full CRUD | ✅ `database-sync` event | 🐛 Students can't access forms |
| 19 | `surveyService.ts` | localStorage only | Create/Read | ❌ No events | 🐛 No update/delete |
| 20 | `settingsService.ts` | localStorage only | Read/Update | ✅ `database-sync` event | ✅ Working |
| 21 | `tagService.ts` | localStorage only | Full CRUD | ✅ Custom events | ✅ Working |
| 22 | `storageService.ts` | Supabase Storage only | Upload/Delete | ❌ No fallback | 🐛 Breaks in localStorage mode |
| 23 | `visitorBookingService.ts` | localStorage only | Create/Read | ❌ No events | 🐛 No update/delete |
| 24 | `geminiService.ts` | N/A (stub) | None | ❌ | 🐛 Hardcoded mock responses |
| 25 | `curriculumService.ts` | Hardcoded data | Read only | ❌ | 🐛 Not mentor-editable |
| 26 | `edgeFunctionService.ts` | Supabase Edge Functions | Invoke | ❌ No fallback | 🐛 Fails if functions not deployed |
| 27 | `growthAudit` (no service file) | Direct localStorage | Create/Read | ❌ No events | ❌ Bypasses service layer entirely |

### 2.3 Hooks Analysis

| Hook | React Query | Data Source | Status |
|------|-------------|-------------|--------|
| `useBookings` | ✅ Yes | bookingService | ✅ Working |
| `useSessions` | ✅ Yes | sessionService | ✅ Working |
| `useEvents` | ✅ Yes | eventService | ✅ Working |
| `usePrograms` | ✅ Yes | programService | 🐛 Read-only, no mutations |
| `useGoals` | ✅ Yes | goalStorage | ✅ Working |
| `useTasks` | ✅ Yes | taskStorage | 🐛 Uses taskStorage, not taskService |
| `useJournals` | ✅ Yes | journalStorage | ✅ Working |
| `useApplications` | ✅ Yes | applicationService | ✅ Working |
| `useResources` | ✅ Yes | resourceService | ✅ Working |
| `useActionItems` | ❌ No | Direct read | 🐛 No auto-refetch |
| `useDatabaseSync` | ✅ Invalidates all | Storage event listener | ⚠️ All-or-nothing invalidation |
| `useRealtime` | N/A | Supabase Realtime | 🐛 Dead code in localStorage mode |


## 3. Database & Migration Analysis

### 3.1 Supabase Schema

**24 tables defined in migrations:**

| Table | Key Columns | RLS | Status |
|-------|-------------|-----|--------|
| `profiles` | id (uuid PK), role, full_name, email, avatar_url | ✅ Enabled | ✅ Correct |
| `applications` | id (uuid PK), full_name, email, status, reviewer_notes | ✅ Enabled | ✅ Correct |
| `sessions` | id (uuid PK), student_id (FK), mentor_id (FK), title, date, status | ✅ Enabled | ✅ Correct |
| `goals` | id (uuid PK), student_id (FK), title, description, status | ✅ Enabled | ✅ Correct |
| `tasks` | id (uuid PK), student_id (FK), title, description, status, priority | ✅ Enabled | ✅ Correct |
| `journals` | id (uuid PK), student_id (FK), title, content, mood | ✅ Enabled | ✅ Correct |
| `events` | id (uuid PK), title, description, date, location, type, capacity | ✅ Enabled | ✅ Correct |
| `event_registrations` | id (uuid PK), event_id (FK), student_id (FK), status | ✅ Enabled | 🐛 No DELETE policy |
| `event_files` | id (uuid PK), event_id (FK), name, url, type, size | ✅ Enabled | ✅ Correct |
| `event_feedback` | id (uuid PK), event_id (FK), student_id (FK), rating, comment | ✅ Enabled | 🐛 No UPDATE policy |
| `programs` | id (uuid PK), title, description, modules (jsonb), created_by | ✅ Enabled | ✅ Correct |
| `student_progress` | id (uuid PK), student_id (FK), program_id (FK), completed_lessons, quiz_scores | ✅ Enabled | ✅ Correct |
| `conversations` | id (uuid PK), type, name, participants (uuid[]), last_message | ✅ Enabled | ✅ Correct |
| `messages` | id (uuid PK), conversation_id (FK), sender_id (FK), content, type | ✅ Enabled | ✅ Correct |
| `transactions` | id (uuid PK), student_id (FK), type, amount, status | ✅ Enabled | ✅ Correct |
| `bookings` | id (uuid PK), student_id (FK), mentor_id (FK), date, status | ✅ Enabled | 🐛 No DELETE policy |
| `resources` | id (uuid PK), title, url, category, description | ✅ Enabled | ✅ Correct |
| `notifications` | id (uuid PK), user_id (FK), title, message, type, read | ✅ Enabled | ⚠️ Mentor can't insert for students |
| `custom_forms` | id (uuid PK), title, description, fields (jsonb), status | ✅ Enabled | ✅ Correct |
| `form_responses` | id (uuid PK), form_id (FK), respondent_id (FK), answers (jsonb) | ✅ Enabled | 🐛 No UPDATE policy |
| `gallery_items` | id (uuid PK), title, description, url, category | ✅ Enabled | ✅ Correct |
| `settings` | id (uuid PK), user_id (FK, unique), preferences (jsonb), availability | ✅ Enabled | ✅ Correct |
| `tags` | id (uuid PK), name, color, category | ✅ Enabled | ✅ Correct |
| `student_tags` | id (uuid PK), student_id (FK), tag_id (FK) | ✅ Enabled | ✅ Correct |

### 3.2 Schema-Service Mismatches

| Feature | localStorage Structure | Supabase Structure | Impact |
|---------|----------------------|-------------------|--------|
| Events | Embedded registrations array in event object | Separate `event_registrations` table | Data migration impossible without transform |
| Messages | Flat array per conversation | Relational with foreign keys | Incompatible data models |
| Student Progress | Flat array with composite keys (`studentId-programId`) | Relational with FKs | Different query patterns |
| Tags | Tags array on student object | Junction table `student_tags` | Different data model |
| IDs | String IDs (`"1"`, `"2"`, `student-1719...`) | UUIDs | Completely incompatible formats |

### 3.3 Seed Data Issues

| Issue | Details | Severity |
|-------|---------|----------|
| Two separate seed systems | `seedData.ts` (localStorage) vs `seed.sql` (Supabase) — completely independent | CRITICAL |
| ID incompatibility | localStorage uses `"1"`, `"2"`; Supabase uses UUIDs | CRITICAL |
| Auth users not seeded | SQL seed inserts into `profiles` but not `auth.users` — can't log in | CRITICAL |
| Hardcoded passwords | Plain-text passwords in both seed data and migration functions | MEDIUM |
| Test stream URLs | HLS video URLs in seed may be invalid/expired | HIGH |

### 3.4 Database Functions

| Function | Purpose | Status |
|----------|---------|--------|
| `approve_application` | Approve application, create auth user + profile | 🐛 Stores plain-text password in reviewer_notes |
| `reject_application` | Reject application | ✅ Correct |
| `get_student_health` | Compute health metrics from actual data | ✅ Correct |
| `compute_all_student_health` | Batch update health status | ✅ Correct |
| `get_dashboard_stats` | Aggregate mentor dashboard stats | ✅ Correct |
| `create_notification` | Create notification (SECURITY DEFINER to bypass RLS) | ✅ Correct |


## 4. Dashboard & UI Analysis

### 4.1 MentorDashboard.tsx (5,721 lines)

**18 tabs/features in one component:**

| Tab | Component Used | Data Source | Status |
|-----|---------------|-------------|--------|
| overview | Inline | Multiple hooks | 🐛 Revenue reads localStorage directly |
| students | Inline | studentService (direct) | 🐛 No React Query, no auto-refresh |
| applications | Inline | useApplications (RQ) | ✅ Working |
| sessions | Inline | useSessions (RQ) | ✅ Working |
| programs | Inline | usePrograms (RQ) | 🐛 No delete, basic UI |
| events | EventManagement.tsx | useEvents (RQ) | ✅ Working |
| messaging | WhatsAppMessaging.tsx | messageService | 🐛 Cross-tab sync broken |
| analytics | Inline | Direct localStorage | 🐛 Stale data, no auto-refresh |
| gallery | GalleryManagement.tsx | Direct localStorage | ⚠️ File upload broken in localStorage mode |
| scheduler | MentorScheduler.tsx | settingsService | ✅ Working |
| store | Inline | Hardcoded data | ❌ Non-functional mock |
| revenue | Inline | Direct localStorage | 🐛 Stale data, no auto-refresh |
| ai-insights | Inline | geminiService (stub) | ❌ Completely non-functional |
| forms | Inline | customFormService | 🐛 Students can't access forms |
| resources | Inline | useResources (RQ) | 🐛 No edit/update |
| tags | Inline | tagService | ✅ Working |
| settings | Inline | settingsService | ✅ Working |
| notifications | Inline | notificationStorage | ✅ Working |

### 4.2 UserDashboard.tsx (4,177 lines)

**12 tabs/features:**

| Tab | Component Used | Data Source | Status |
|-----|---------------|-------------|--------|
| overview | Inline | Multiple hooks | ✅ Working |
| goals | StudentGoals.tsx | useGoals (RQ) | ✅ Working |
| tasks | StudentTasks.tsx | useTasks (RQ) | 🐛 Uses taskStorage vs taskService mismatch |
| sessions | Inline | useSessions (RQ) | ✅ Working |
| journal | StudentJournal.tsx | useJournals (RQ) | ✅ Working |
| messaging | WhatsAppMessaging.tsx | messageService | 🐛 Cross-tab sync broken |
| programs | StudentProgramView.tsx | usePrograms + studentProgressService | 🐛 Mentor can't see progress |
| events | Inline | useEvents (RQ) | 🐛 No unregister; UI doesn't update |
| resources | Inline | useResources (RQ) | ✅ Working |
| growth-audit | GrowthAuditForm.tsx | Direct localStorage | ❌ Mentor can't see submissions |
| notifications | Inline | notificationStorage | ⚠️ No auto-notifications |
| settings | Inline | profileService | ✅ Working |

### 4.3 Shared Components

| Component | Used By | Status |
|-----------|---------|--------|
| WhatsAppMessaging.tsx | Both dashboards | 🐛 Cross-tab sync, simulated voice |
| VoiceMessagePlayer.tsx | WhatsAppMessaging | 🐛 Simulated audio playback |
| TaskActivityForm.tsx | Both dashboards | ✅ Working |
| StudentProgramView.tsx | UserDashboard | 🐛 Mentor can't see progress |
| StudentGoals.tsx | UserDashboard | ✅ Working |
| StudentTasks.tsx | UserDashboard | 🐛 Task service mismatch |
| StudentJournal.tsx | UserDashboard | ✅ Working |
| MentorScheduler.tsx | MentorDashboard | ✅ Working |
| EventManagement.tsx | MentorDashboard | ✅ Working |
| GalleryManagement.tsx | MentorDashboard | ⚠️ Upload broken in localStorage mode |


## 5. Cross-Dashboard Sync Matrix

| Feature | Mentor Action | Student Visibility | Sync Status |
|---------|--------------|-------------------|-------------|
| Sessions | Create/edit session | View in sessions tab | ✅ Works (if IDs match) |
| Tasks | Assign task | View in tasks tab | ⚠️ Broken in Supabase mode (dual service) |
| Goals | View student goals | Create/edit goals | ✅ Works (if IDs match) |
| Journals | View student journals | Create/edit journals | ✅ Works (if IDs match) |
| Messages | Send message | Receive message | ⚠️ Cross-tab sync broken |
| Events | Create event | View/register | ✅ Works |
| Programs | View programs | View/progress | ⚠️ Mentor can't see progress |
| Applications | Approve/reject | Gets account | 🐛 Credential delivery broken |
| Resources | Add resources | View resources | ✅ Works |
| Growth Audit | N/A (no view) | Submit audit | ❌ Completely broken |
| Notifications | N/A (no auto-create) | View | ⚠️ No auto notifications |
| Custom Forms | Create forms | N/A (no access) | ❌ Students can't fill |
| Quiz Results | N/A (no view) | Take quizzes | ❌ Mentor can't see |
| Bookings | View bookings | Create bookings | ✅ Works (if IDs match) |
| Gallery | Manage gallery | View gallery | ✅ Works |


## 6. Critical Bugs (Severity: CRITICAL)

### C1: Growth Audit Submissions Invisible to Mentor
- **File:** `src/features/growthAudit/GrowthAuditForm.tsx`
- **Root Cause:** Saves directly to `localStorage` (`mentorino_growth_audits`) with no service layer, no React Query hook, no `database-sync` event. MentorDashboard has zero code to read this data.
- **Impact:** Students fill out multi-section assessments that are never seen by anyone.

### C2: Custom Forms Inaccessible to Students
- **Files:** `src/services/customFormService.ts`, `UserDashboard.tsx`
- **Root Cause:** `Survey.tsx` uses `surveyService` (different service/data store) while mentors create forms via `customFormService`. Students have no UI tab to access forms created by their mentor.
- **Impact:** Custom form feature is entirely one-sided — mentors create forms nobody fills.

### C3: Dual ID Format Mismatch
- **Files:** `src/services/applicationService.ts`, `src/utils/seedData.ts`
- **Root Cause:** Seed data uses sequential IDs (`"1"`, `"2"`, `"3"`). `_createStudentAccount` generates IDs like `student-1719000000000`. Services filter by exact ID match.
- **Impact:** Newly approved students see empty goals, tasks, journals, sessions, and progress.

### C4: Dual Task Service Split
- **Files:** `src/services/taskStorage.ts`, `src/services/taskService.ts`, `src/hooks/useTasks.ts`
- **Root Cause:** `useTasks` hook uses `taskStorage` (pure localStorage). Mentor dashboard may use `taskService` (Supabase+localStorage). In Supabase mode, data written through one path is invisible to the other.
- **Impact:** Tasks assigned by mentor may not appear for student, or vice-versa.

### C5: Student Program Progress Invisible to Mentor
- **Files:** `MentorDashboard.tsx`, `StudentProgramView.tsx`
- **Root Cause:** No tab or section in MentorDashboard reads `mentorino_progress` or displays student quiz results.
- **Impact:** Mentors have no visibility into how students are progressing through program curriculum.

### C6: Credentials Never Delivered to Approved Students
- **Files:** `src/services/applicationService.ts`, `MentorDashboard.tsx`
- **Root Cause:** `_createStudentAccount` generates a password and shows it once in a toast notification. No email/SMS delivery mechanism exists.
- **Impact:** Approved students cannot log in unless the mentor manually communicates credentials.


## 7. High Severity Bugs

### H1: Cross-Tab Messaging Sync Failure
- **Root Cause:** Custom events (`new-message`, `database-sync`) don't cross browser tabs. `StorageEvent` only fires for other tabs when `localStorage.setItem` is called.
- **Impact:** Mentor and student in separate tabs don't see messages in real-time.

### H2: File Uploads Broken in localStorage Mode
- **Root Cause:** `storageService.ts` has no localStorage fallback. It requires Supabase Storage.
- **Impact:** Gallery images, task attachments, event files, and profile photos fail silently.

### H3: Analytics Data Stale
- **Root Cause:** Revenue, student health charts read directly from localStorage on mount, not via React Query.
- **Impact:** Analytics don't auto-refresh when underlying data changes.

### H4: Event Registration UI Doesn't Reflect Immediately
- **Root Cause:** No optimistic update after `registerForEvent`. Requires page refresh.
- **Impact:** Student confusion — registered events don't show as registered.

### H5: Student Sessions Tab Depends on ID Match
- **Root Cause:** `useSessions` filters by `studentId === currentUser.id`. If IDs don't match (new vs seed format), sessions are invisible.
- **Impact:** Students can't see their own scheduled sessions.

### H6: Mentor Session Dropdown Stale
- **Root Cause:** Student dropdown in session creation uses direct `studentService.getStudents()` call, not React Query.
- **Impact:** Newly approved students don't appear in dropdown until re-render.

### H7: HLS Video URLs May Be Invalid
- **Root Cause:** Seed data contains sample HLS stream URLs that may be expired or unavailable.
- **Impact:** Program videos won't play for students.


## 8. Medium Severity Bugs

| # | Bug | File(s) | Impact |
|---|-----|---------|--------|
| M1 | No auto-notifications | All services | Key actions don't trigger notifications |
| M2 | Students can't unregister from events | eventService.ts | No cancellation UX |
| M3 | Students can't cancel bookings | bookingService.ts | No cancellation UX |
| M4 | Voice messages simulated | WhatsAppMessaging.tsx | No real audio recording/playback |
| M5 | AI Insights is a stub | geminiService.ts | Non-functional feature |
| M6 | Store is mock only | MentorDashboard.tsx | Non-functional feature |
| M7 | Duplicate event registration in localStorage | eventService.ts | Students can register twice |
| M8 | No student edit for form responses | customFormService.ts | Can't change submitted answers |
| M9 | No student edit for event feedback | eventService.ts | Can't change submitted feedback |
| M10 | Message search empty state | WhatsAppMessaging.tsx | Blank instead of "no results" |
| M11 | Profile data split between Supabase & localStorage | profileService.ts | Inconsistent profile data |


## 9. Missing CRUD Operations

| Service | Missing Operation | Impact |
|---------|------------------|--------|
| `bookingService.ts` | `deleteBooking` | Students can't cancel bookings |
| `programService.ts` | `deleteProgram` | Programs accumulate forever |
| `resourceService.ts` | `updateResource` | Can't edit resource details |
| `transactionService.ts` | `updateTransaction`, `deleteTransaction` | Can't edit or remove transactions |
| `surveyService.ts` | `updateSurvey`, `deleteSurvey` | Can't edit or remove surveys |


## 10. Schema-Service Mismatches

### 10.1 Data Model Differences

| Feature | localStorage (Service) | Supabase (Schema) | Transform Needed |
|---------|----------------------|-------------------|------------------|
| Events | `registrations: EventRegistration[]` embedded | Separate `event_registrations` table | Extract embedded array into join table |
| Events | `files: EventFile[]` embedded | Separate `event_files` table | Extract embedded array |
| Events | `feedback: EventFeedback[]` embedded | Separate `event_feedback` table | Extract embedded array |
| Messages | Flat array of message objects per conversation | Relational `messages` table with FK | Refactor query patterns |
| Progress | Flat array with composite key `${studentId}-${programId}` | Relational with FKs | Different query patterns |
| Tags | `tags: string[]` on student object | Junction table `student_tags` | Normalize many-to-many |
| IDs | String: `"1"`, `"student-1719..."` | UUID: `"00000000-0000-0000-0000-000000000001"` | Regenerate all IDs on migration |

### 10.2 Type System Conflicts

Two parallel type systems exist:
- `src/types/database.ts` — Supabase table row types (generated)
- `src/interfaces/` — Domain model types (manual)

These are structurally different:
- `created_at: string` (interface) vs `created_at: timestamptz` (database type)
- `id: string` (interface) vs `id: uuid` (database type)
- Embedded arrays (interface) vs foreign key joins (database)


## 11. Configuration Issues

| Issue | Detail | Severity |
|-------|--------|----------|
| Duplicate edge function directories | `supabase/functions/` and `edge-functions/` — may go out of sync | MEDIUM |
| Missing env vars | Sentry DSN, PostHog key, Supabase service role key all empty/placeholder | HIGH |
| Hardcoded timezone | All dates in America/New_York regardless of user location | LOW |
| Dead Supabase edge function call | `applicationService.submitApplication` invokes edge function that may not exist | MEDIUM |
| Realtime subscriptions in localStorage mode | `useRealtime` subscribes even when Supabase unavailable | LOW |
| All-or-nothing cache invalidation | `useDatabaseSync` invalidates ALL React Query caches on any change | LOW |


## 12. Remediation Roadmap

### Phase 1: Critical Fixes (Week 1)

| Priority | Fix | Files Affected | Effort |
|----------|-----|---------------|--------|
| P0 | Normalize student ID format across all services | `applicationService.ts`, `seedData.ts`, all `*Storage.ts` | 2 days |
| P0 | Eliminate dual task service — pick one (recommend: `taskService.ts` + React Query) | `taskStorage.ts`, `taskService.ts`, `useTasks.ts` | 1 day |
| P0 | Create Growth Audit service + React Query hook + Mentor view tab | New files + `MentorDashboard.tsx` | 1 day |
| P0 | Add student-facing custom form fill UI | `UserDashboard.tsx`, new form component | 1 day |
| P0 | Add mentor-facing program progress view | `MentorDashboard.tsx`, new component | 1 day |
| P0 | Implement credential delivery (show in application detail, allow copy) | `MentorDashboard.tsx`, `applicationService.ts` | 0.5 day |

### Phase 2: High Priority (Week 2)

| Priority | Fix | Effort |
|----------|-----|--------|
| P1 | Implement `StorageEvent` listener for cross-tab messaging sync | 0.5 day |
| P1 | Add localStorage fallback for `storageService.ts` (base64 data URLs) | 0.5 day |
| P1 | Convert analytics to React Query hooks | 0.5 day |
| P1 | Add optimistic updates for event registration | 0.5 day |
| P1 | Add missing CRUD operations (deleteBooking, deleteProgram, updateResource) | 0.5 day |

### Phase 3: Medium Priority (Week 3)

| Priority | Fix | Effort |
|----------|-----|--------|
| P2 | Auto-notification system for key actions | 1 day |
| P2 | Add unregister from events, cancel bookings | 0.5 day |
| P2 | Real voice recording instead of simulated | 0.5 day |
| P2 | Student edit for form responses and feedback | 0.5 day |
| P2 | Fix empty states and message search | 0.5 day |

### Phase 4: Cleanup (Week 4)

| Priority | Fix | Effort |
|----------|-----|--------|
| P3 | Consolidate edge function directories | 0.5 day |
| P3 | Configure Sentry + PostHog with real keys | 0.5 day |
| P3 | Remove dead Supabase edge function calls | 0.5 day |
| P3 | Add `isSupabaseAvailable()` check to `useRealtime` | 0.5 day |
| P3 | Targeted cache invalidation in `useDatabaseSync` | 0.5 day |
| P3 | Consider timezone configuration instead of hardcoded ET | 0.5 day |


## Appendix A: File Size Analysis

| File | Lines | Notes |
|------|-------|-------|
| `MentorDashboard.tsx` | 5,721 | Should be split into ~18 smaller components |
| `UserDashboard.tsx` | 4,177 | Should be split into ~12 smaller components |
| `WhatsAppMessaging.tsx` | 451 | Manageable |
| `applicationService.ts` | 402 | Manageable |
| `ComposeBar.tsx` | 354 | Manageable |
| `ContactInfoPanel.tsx` | 410 | Manageable |
| `seedData.ts` | ~800+ | Large seed file |

## Appendix B: Storage Key Inventory

All localStorage keys used across the codebase:

| Key | Service | Format |
|-----|---------|--------|
| `current_user` | authService | JSON object |
| `isLoggedIn` | authService | boolean string |
| `mentorino_mock_users` | authService | JSON array |
| `mentorino_students` | studentService | JSON array |
| `mentorino_applications` | applicationService (fallback) | JSON array |
| `mentorino_goals` | goalStorage | JSON array |
| `mentorino_tasks` | taskStorage | JSON array |
| `mentorino_journals` | journalStorage | JSON array |
| `mentorino_sessions` | sessionService (fallback) | JSON array |
| `mentorino_events` | eventService (fallback) | JSON array |
| `mentorino_programs` | programService (fallback) | JSON array |
| `mentorino_resources` | resourceService | JSON array |
| `mentorino_progress` | studentProgressService | JSON array |
| `mentorino_transactions` | transactionService | JSON array |
| `mentorino_notifications` | notificationStorage | JSON array |
| `mentorino_settings` | settingsService | JSON object |
| `mentorino_tags` | tagService | JSON array |
| `mentorino_custom_forms` | customFormService | JSON array |
| `mentorino_form_responses` | customFormService | JSON array |
| `mentorino_surveys` | surveyService | JSON array |
| `mentorino_growth_audits` | GrowthAuditForm (direct) | JSON array |
| `mentorino_visitor_bookings` | visitorBookingService | JSON array |
| `whatsapp_conversations_v4` | messageService | JSON array |
| `whatsapp_messages_v4` | messageService | JSON object |
| `mentorino_seed_version` | seedData | string |
| `gallery_items_v1` | Gallery (direct) | JSON array |
| `gallery_uploaded_images` | Gallery (direct) | JSON array |
| `mentorino_programs` | seedData | JSON array |
| `mentorino_events` | seedData | JSON array |
| `mock_bookings_v2` | bookingService (fallback) | JSON array |
| `avatar_*` | Various | base64 string |
| `session_*` | Auth | string |


*End of Report — 24 features analyzed, 19 bugs found (6 critical, 7 high, 6 medium)*
