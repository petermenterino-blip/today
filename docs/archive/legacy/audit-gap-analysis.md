

# Mentorino — Audit & Gap Analysis

Generated from codebase analysis against `ARCHITECTURE.md` v1.0.


## 0.1 File Structure Inventory

### Current vs Target

| Target (spec) | Current | Status |
|---------------|---------|--------|
| `src/app/` | `src/App.tsx` | exists as single file |
| `src/pages/` | `src/pages/` (23 files) | exists but mix of public + protected |
| `src/routes/` | Inline in `App.tsx` | needs extraction |
| `src/components/` | `src/components/` (19 files) | exists but contains feature components |
| `src/features/` | **missing** | needs creation |
| `src/services/` | `src/services/` (24 files) | exists, all localStorage |
| `src/hooks/` | `src/hooks/` (13 files) | exists |
| `src/types/` | `src/types/` (2 files) | exists |
| `src/utils/` | `src/utils/` (5 files) | exists |
| `src/lib/` | **missing** | needs creation (supabase client) |
| `src/constants/` | `src/constants.ts` (1 file) | exists |
| `src/context/` | `src/context/` (1 file) | exists |
| `supabase/migrations/` | **missing** | needs creation |
| `supabase/seed/` | `src/utils/seedData.ts` | needs migration to SQL |
| `edge-functions/` | **missing** | needs creation |
| `docs/` | `docs/` partial | PRD.md, BRD.md, ARCHITECTURE.md |

### Current directory details

| Directory | Files | Lines | % of codebase |
|-----------|-------|-------|---------------|
| `pages/` | 23 | 10,728 | 46.5% |
| `components/` | 19 | 8,678 | 37.6% |
| `services/` | 24 | 1,582 | 6.9% |
| `utils/` | 5 | 749 | 3.2% |
| `hooks/` | 13 | 506 | 2.2% |
| `types/` | 2 | 342 | 1.5% |
| `interfaces/` | 9 | 159 | 0.7% |
| `context/` | 1 | 111 | 0.5% |
| `[root]` | 4 | 201 | 0.9% |
| **Total** | **100** | **~23,056** | **100%** |

### Largest files (top 10)

| File | Lines | Issue |
|------|-------|-------|
| `pages/MentorDashboard.tsx` | 5,427 | **Monolithic** — violates "Keep components focused and modular" |
| `components/MentorScheduler.tsx` | 2,531 | **Monolithic** |
| `components/WhatsAppMessaging.tsx` | 1,298 | **Monolithic** |
| `components/EventManagement.tsx` | 1,112 | **Monolithic** |
| `pages/Landing.tsx` | 1,010 | Large but acceptable for landing page |
| `pages/UserDashboard.tsx` | 813 | Could split |
| `components/StudentProgramView.tsx` | 703 | Could split |
| `utils/seedData.ts` | 639 | Will be replaced by SQL seed |
| `components/GalleryManagement.tsx` | 546 | Could split |
| `pages/Settings.tsx` | 576 | Could split |


## 0.2 Service Audit

### Backend distribution

| Backend | Count | Files |
|---------|-------|-------|
| `localStorage` (raw) | 11 | applicationService, authService, bookingService, eventService, sessionService, programService, profileService, studentProgressService, resourceService, messageStorage, taskService |
| `localStorage` (via `BaseLocalStorageService`) | 10 | taskStorage, notificationStorage, customFormStorage, fileStorage, settingsStorage, goalStorage, journalStorage, tagStorage, studentStorage, formStorage |
| Mock/stub (no persistence) | 2 | geminiService, curriculumService |
| Base class | 1 | baseStorage |
| **Supabase** | **0** | **NONE** |

### Services needing Supabase migration

| # | Service | localStorage Key | Priority |
|---|---------|-----------------|----------|
| 1 | `authService.ts` | `mentorino_auth_user`, `mentorino_mock_users` | **Critical** — gates everything |
| 2 | `profileService.ts` | `mentorino_profile_*` | **Critical** |
| 3 | `applicationService.ts` | `mentorino_applications` | High |
| 4 | `sessionService.ts` | `mentorino_sessions` | High |
| 5 | `programService.ts` | `mentorino_programs` | High |
| 6 | `messageStorage.ts` | `whatsapp_messages_v4`, `whatsapp_conversations_v4` | High |
| 7 | `bookingService.ts` | `mock_bookings_v2` | Medium |
| 8 | `eventService.ts` | `mock_events_v2` | Medium |
| 9 | `taskService.ts` | `mentorino_tasks` | Medium |
| 10 | `goalStorage.ts` | `mentorino_goals` | Medium |
| 11 | `journalStorage.ts` | `mentorino_journals` | Medium |
| 12 | `resourceService.ts` | `mentorino_resources` | Medium |
| 13 | `studentProgressService.ts` | `mentorino_progress` | Medium |
| 14 | `studentStorage.ts` | `mentorino_students`, `mentorino_student_timelines` | Low |
| 15 | `notificationStorage.ts` | `mentorino_notifications` | Medium |
| 16 | `taskStorage.ts` | `mentorino_tasks` | Low (duplicates `taskService`) |
| 17 | `settingsStorage.ts` | `mentorino_mentor_settings`, `mentorino_dashboard_layouts` | Low |
| 18 | `customFormStorage.ts` | `mentorino_custom_forms`, `mentorino_form_submissions` | Low |
| 19 | `formStorage.ts` | `mentorino_form_templates`, `mentorino_form_submissions` | Low |
| 20 | `fileStorage.ts` | `mentorino_shared_files` | Low |
| 21 | `tagStorage.ts` | `mentorino_tags` | Low |
| 22 | `geminiService.ts` | **none (stub)** | Needs Edge Function |
| 23 | `curriculumService.ts` | **none (pure function)** | Stays as-is |

### Files with "TODO: Replace with Supabase" comments

| File | Line | Comment |
|------|------|---------|
| `taskStorage.ts` | 9 | `// TODO: Replace with Supabase API` |
| `notificationStorage.ts` | 9 | `// TODO: Replace with Supabase API` |
| `settingsStorage.ts` | 9 | `// TODO: Replace with Supabase API` |
| `goalStorage.ts` | 9 | `// TODO: Replace with Supabase API` |
| `journalStorage.ts` | 9 | `// TODO: Replace with Supabase API query` |
| `studentStorage.ts` | 9 | `// TODO: Replace with Supabase API` |
| `formStorage.ts` | 15 | `// TODO: Replace with Supabase API` |

### Service layer violations

**Architecture rule**: "Components must never communicate directly with Supabase" — currently trivially obeyed since no Supabase exists. All components talk to services.

**Architecture rule**: "Every feature must have its own service" — partially satisfied. There are 24 services, but some are redundant (e.g., `taskService.ts` + `taskStorage.ts` both handle tasks with different interfaces).


## 0.3 Hook Audit

### Data fetching pattern distribution

| Pattern | Count | Files |
|---------|-------|-------|
| `useState` + manual CRUD | 8 | useActionItems, useApplications, useBookings, useEvents, useGoals, useJournals, useResources, useTasks |
| TanStack Query | 4 | useBookingsQuery, useEventsQuery, usePrograms, useSessions |
| Utility (no data) | 1 | useDatabaseSync |

### Hooks needing TanStack Query migration

| Hook | Current Pattern | Service | Priority |
|------|----------------|---------|----------|
| `useActionItems.ts` | `useState` + CRUD | taskStorage | Medium |
| `useApplications.ts` | `useState` + CRUD | applicationService | High |
| `useBookings.ts` | `useState` + CRUD | bookingService | Low (has TQ variant) |
| `useEvents.ts` | `useState` + CRUD | eventService | Low (has TQ variant) |
| `useGoals.ts` | `useState` + CRUD | goalStorage | Medium |
| `useJournals.ts` | `useState` + CRUD | journalStorage | Medium |
| `useResources.ts` | `useState` + CRUD | resourceService | Low |
| `useTasks.ts` | `useState` + CRUD | taskService | Medium |

### Duplicate hook pairs (same domain, different pattern)

| Domain | `useState` variant | TanStack Query variant |
|--------|-------------------|----------------------|
| Bookings | `useBookings.ts` | `useBookingsQuery.ts` |
| Events | `useEvents.ts` | `useEventsQuery.ts` |

These duplicates should be consolidated to TanStack Query only, with the `useState` variant removed.

### Direct localStorage access in hooks

**None.** All hooks delegate to services. This is good — service abstraction is working.


## 0.4 Monolithic Files for Splitting

### 1. `pages/MentorDashboard.tsx` — 5,427 lines

Extractable sub-components:
- `MentorStatsCards` — student count, session count, revenue, etc.
- `MentorStudentList` — student table with search, filter, health status
- `MentorSessionCalendar` — embedded calendar view of sessions
- `MentorTaskFeed` — task activity feed with filters
- `MentorActivityLog` — recent activity timeline
- `MentorRevenueChart` — revenue/growth visualization
- `MentorHeader` — top section with welcome + quick actions
- `MentorTabs` — tab navigation for dashboard sections

### 2. `components/MentorScheduler.tsx` — 2,531 lines

Extractable sub-components:
- `ScheduleCalendar` — month/week/day calendar grid
- `ScheduleForm` — session creation/editing form
- `SessionTimeSlots` — time slot picker
- `RecurringScheduleConfig` — recurring schedule UI
- `SessionDetailCard` — individual session display
- `CalendarFilters` — filters for calendar view
- `AvailabilityEditor` — working hours/timezone config

### 3. `components/WhatsAppMessaging.tsx` — 1,298 lines

Extractable sub-components:
- `MessageBubble` — individual message display (text/image/file/voice)
- `MessageInput` — text input with file/voice attachment
- `ThreadList` — conversation sidebar
- `AttachmentPreview` — file/voice recording preview
- `ConversationHeader` — header with participant info
- `MessageSearch` — search within conversation
- `EmojiPicker` / QuickReplies

### 4. `components/EventManagement.tsx` — 1,112 lines

Extractable sub-components:
- `EventList` — event listing with filters
- `EventForm` — create/edit event form
- `EventAttendees` — attendee management with QR check-in
- `EventAnalytics` — attendance/feedback charts
- `EmailNotificationForm` — event email notifications
- `EventCalendar` — calendar integration view

### 5. `pages/Landing.tsx` — 1,010 lines

Could split into:
- `HeroSection`
- `FeaturesSection`
- `PricingSection`
- `CTASection`
- `TestimonialsSection`


## 0.5 Database Tables Required

### Core tables

| Table | Source Type | Key Fields | Source Files |
|-------|-------------|------------|--------------|
| `profiles` | `User` + `StudentProfile` | id, email, name, role, avatar_url, status, health_status, tags, metrics, created_at, updated_at | types/index.ts, interfaces/student.interface.ts, seedData.ts |
| `programs` | `Program` | id, title, description, duration, mentor_id, category, difficulty, status, visibility, outcomes, skills_covered, student_count, max_students, image, prerequisites, created_at, updated_at | types/index.ts |
| `program_enrollments` | seed data pattern | id, program_id, student_id, status, enrolled_at, completed_at | seedData.ts |
| `sessions` | `Session` | id, mentor_id, student_id, program_id, title, description, start_time, end_time, meeting_url, recording_url, attendance_status, notes, status, meeting_type, session_type, recurring_session, reminder_time, created_at, updated_at | interfaces/session.interface.ts, seedData.ts |
| `goals` | `Goal` (interfaces) | id, student_id, title, description, progress_percentage, status, blockers, notes, target_date, created_at, updated_at | interfaces/goal.interface.ts, seedData.ts |
| `goal_milestones` | `Milestone` | id, goal_id, title, completed | interfaces/goal.interface.ts |
| `tasks` | `ActionItem` + `TaskActivity` | id, student_id, mentor_id, title, description, due_date, status, priority, file_url, feedback, created_at, updated_at | interfaces/task.interface.ts, types/index.ts |
| `journals` | `JournalEntry` | id, student_id, type, content, mood, wins, challenges, mentor_comments, reviewed_by_mentor, created_at, updated_at | interfaces/journal.interface.ts, seedData.ts |
| `bookings` | `Booking` | id, user_id, program_id, user_name, date, time, status, type, meeting_link, notes, attendance, created_at | types/index.ts |
| `messages` | `Message` | id, sender_id, conversation_id, content, timestamp, status, type, audio_url, duration | types/messaging.ts |
| `conversations` | `Conversation` | id, student_id, mentor_id, is_group, name, description, admin_id, last_message, last_message_time, unread_count, pinned, archived, created_at | types/messaging.ts, seedData.ts |
| `conversation_participants` | `Conversation.participants` | id, conversation_id, user_id | types/messaging.ts |
| `events` | `NetworkEvent` | id, title, date, time, end_time, timezone, location, meeting_link, venue, image, capacity, registration_deadline, speaker, visibility, status, tags, description, cover_image, duration, waitlist_limit, requirements, event_color, created_at, updated_at | types/index.ts |
| `event_attendees` | `NetworkEvent.attendees` | id, event_id, user_id, registration_status, attendance_status, registered_at | types/index.ts |
| `applications` | `Application` | id, user_id, email, first_name, last_name, phone, discipline, reason_for_applying (JSON), status, mentor_type, meeting_preference, frequency, seriousness, location, focus_area, program_id, top_strength, needs_focus, created_at, updated_at | types/index.ts, seedData.ts |
| `notifications` | `Notification` | id, user_id, title, message, read, type, link, created_at | interfaces/notification.interface.ts, seedData.ts |
| `resources` | `ResourceLink` | id, title, url, category, is_pinned, lesson_id, created_at | types/index.ts |
| `surveys` | (from Survey.tsx usage) | id, title, description, created_at | pages/Survey.tsx |
| `survey_responses` | (from Survey.tsx usage) | id, survey_id, user_id, rating, feedback, created_at | pages/Survey.tsx |

### Supporting tables

| Table | Source Type | Key Fields | Source |
|-------|-------------|------------|--------|
| `tags` | `StudentTag` | id, label, color | types/index.ts |
| `student_tags` | many-to-many | id, student_id, tag_id | types/index.ts |
| `student_progress` | seed data pattern | id, user_id, program_id, started_at, completed_at, lessons (JSONB) | seedData.ts |
| `student_timeline_events` | `StudentTimelineEvent` | id, student_id, type, title, description, timestamp | interfaces/student.interface.ts |
| `mentor_settings` | `MentorSettings` | id, mentor_id, timezone, session_duration, buffer_time, notifications_enabled, working_days, available_hours_start, available_hours_end, created_at, updated_at | interfaces/settings.interface.ts |
| `dashboard_layouts` | `DashboardLayout` | id, user_id, layout (JSONB) | interfaces/settings.interface.ts |
| `custom_forms` | `CustomForm` | id, title, description, fields (JSONB), assigned_to, created_at | types/index.ts |
| `form_templates` | `FormTemplate` | id, title, type, fields (JSONB), created_at, updated_at | interfaces/form.interface.ts |
| `form_submissions` | `FormSubmission` (both) | id, form_id, user_id/student_id, responses (JSONB), submitted_at | types/index.ts + interfaces/form.interface.ts |
| `shared_files` | `SharedFile` | id, user_id, name, url, type, category, shared_at | types/index.ts |
| `mentor_availability` | `MentorAvailability` | id, mentor_id, days (JSONB) | types/index.ts |
| `products` | `Product` | id, name, description, price, image, category, sales_count, status | types/index.ts |
| `transactions` | `Transaction` | id, user_name, amount, date, product, status | types/index.ts |
| `announcements` | `Announcement` | id, title, content, priority, program_type, created_at | types/index.ts |
| `ai_chat_history` | `AIChatMessage` | id, user_id, role, content, timestamp | types/index.ts |
| `analytics_events` | (spec requirement) | id, user_id, event_type, properties (JSONB), created_at | ARCHITECTURE.md |


## 0.6 RLS Policy Requirements

### By table

| Table | SELECT | INSERT | UPDATE | DELETE |
|-------|--------|--------|--------|--------|
| `profiles` | own row; mentor can read assigned students | own row (via auth trigger) | own row; mentor can update students they mentor | soft-delete own |
| `programs` | public (published) | mentor only | mentor own | mentor own (soft) |
| `program_enrollments` | own; mentor for their students | own (student) | mentor only | mentor only (soft) |
| `sessions` | own (both student/mentor) | mentor only | mentor own; student can update attendance | mentor own (soft) |
| `goals` | own; mentor for their students | own (student) | own; mentor | own; mentor (soft) |
| `goal_milestones` | own; mentor for students | own; mentor | own; mentor | own; mentor |
| `tasks` | own; mentor for their students | mentor only | mentor; student can update status | mentor only (soft) |
| `journals` | own; mentor for their students | own (student) | own; mentor can add comments | own (soft) |
| `bookings` | own; mentor for their students | own (student) | mentor | mentor (soft) |
| `messages` | participants of conversation | participants of conversation | own | own (soft) |
| `conversations` | participant | participant (student+mentor) | participant | participant (soft) |
| `conversation_participants` | participant | admin | admin | admin |
| `events` | public (published) | mentor/admin | mentor own | mentor own (soft) |
| `event_attendees` | own; mentor for their event | own (student) | mentor | mentor |
| `applications` | own (student); all (mentor) | any (public) | mentor | mentor (soft) |
| `notifications` | own | system (edge function) | own (mark read) | own |
| `resources` | all authenticated | mentor | mentor | mentor (soft) |
| `surveys` | all authenticated | own | own | own (soft) |
| `survey_responses` | own; mentor for students | own | none | none |
| `mentor_settings` | own (mentor) | own | own | own |
| `form_submissions` | own; mentor for students | own | own | mentor (soft) |
| `shared_files` | own; mentor for students | own | own | own |

### Roles

| Role | Scope |
|------|-------|
| `student` | Own data; read access to assigned programs, sessions, resources |
| `mentor` | Own data + read/write on assigned students' data |
| `admin` | Full access (future) |


## 0.7 Current localStorage Keys

Complete list of 26+ keys:

| Key | Service | Type |
|-----|---------|------|
| `mentorino_auth_user` | authService | Auth session |
| `mentorino_mock_users` | authService | Mock user DB |
| `mentorino_applications` | applicationService + seedData | Applications |
| `mentorino_sessions` | sessionService + seedData | Sessions |
| `mentorino_programs` | programService + seedData | Programs |
| `mentorino_progress` | studentProgressService + seedData | Student progress |
| `mentorino_resources` | resourceService + seedData | Resources |
| `mentorino_tasks` | taskService + taskStorage | Tasks (dual) |
| `mentorino_notifications` | notificationStorage | Notifications |
| `mentorino_custom_forms` | customFormStorage | Custom forms |
| `mentorino_form_submissions` | customFormStorage + formStorage | Form submissions |
| `mentorino_shared_files` | fileStorage | Shared files |
| `mentorino_mentor_settings` | settingsStorage | Mentor settings |
| `mentorino_dashboard_layouts` | settingsStorage | Dashboard layouts |
| `mentorino_goals` | goalStorage | Goals |
| `mentorino_journals` | journalStorage | Journals |
| `mentorino_tags` | tagStorage | Tags |
| `mentorino_students` | studentStorage | Student profiles |
| `mentorino_student_timelines` | studentStorage | Timeline events |
| `mentorino_form_templates` | formStorage | Form templates |
| `mentorino_profile_{userId}` | profileService | User profiles |
| `mentorino_profile_settings_{profileId}` | profileService | Profile settings |
| `mock_events_v2` | eventService + seedData | Events |
| `mock_bookings_v2` | bookingService + seedData | Bookings |
| `whatsapp_messages_v4` | messageStorage | Messages |
| `whatsapp_conversations_v4` | messageStorage | Conversations |
| `mentorino_seed_version` | seedData | Seed version marker |
| `mentorino_purchases` | App.tsx | Store purchases |


## Key Gaps Summary

| Area | Current State | Target State | Gap |
|------|--------------|--------------|-----|
| **Database** | localStorage (~26 keys) | Supabase PostgreSQL (~30 tables) | Full migration needed |
| **Auth** | Mock (6 hardcoded users) | Supabase Auth + JWT + RLS | Full rewrite |
| **Services** | localStorage CRUD | Supabase queries via service layer | Swap implementation per service |
| **Hooks** | 8 useState, 4 TanStack Query | All TanStack Query | 8 hooks to migrate |
| **Folder structure** | Type-oriented | Feature-oriented | Full restructure |
| **Monoliths** | 4 files >1,000 lines | Split into focused components | 4 files to decompose |
| **Edge Functions** | None (`geminiService` is stub) | 5 edge functions | New code |
| **Realtime** | Custom events (`database-sync`) | Supabase Realtime | Subscription setup |
| **Monitoring** | None | Sentry + PostHog | New integration |
| **AI** | Stub responses | Gemini via Edge Function | Full reimplementation |
| **Calendar** | None | Google Calendar API via Edge Function | New integration |
| **Email** | None | Resend via Edge Function | New integration |
| **Storage** | localStorage | Supabase Storage + RLS | New integration |
| **Deployment** | Local dev only | Vercel SPA hosting | CI/CD setup |
| **Backup** | None | Automated daily/weekly | Scripts + docs |
