# Mentorino — Implementation Plan

Based on `ARCHITECTURE.md` v1.0

---

## Overview

Migrate the current client-side SPA (localStorage, mock auth, type-oriented) to the target architecture (Supabase, RLS, feature-oriented, production-ready).

- **Current**: 28 pages, 19 components, 24 services, 13 hooks, ~73,000 lines, localStorage, mock auth
- **Target**: Supabase PostgreSQL + Auth + RLS + Storage + Edge Functions, TanStack Query, feature-oriented folders, Vercel SPA hosting

---

## Phase 0 — Audit & Gap Analysis

**Goal**: Document every deviation between current codebase and architecture spec. No code changes.

### 0.1 Inventory current file structure
- Map all 97 files against target folder layout (`app/`, `pages/`, `routes/`, `components/`, `features/`, `services/`, `hooks/`, `types/`, `utils/`, `lib/`, `constants/`, `supabase/migrations/`, `supabase/seed/`, `edge-functions/`)
- Identify which files stay, which move, which split, which delete

### 0.2 Audit each service against spec
- 24 services — for each: does it have a Supabase counterpart? Does it need one?
- Mark `localStorage` vs `supabase` vs `hybrid`

### 0.3 Audit each hook against spec
- 13 hooks — for each: does it use `useState`+manual CRUD or TanStack Query?
- Mark: `useState` (needs migration), `useQuery` (already compliant)

### 0.4 Identify monolithic files for splitting
- `MentorDashboard.tsx` (5,721 lines) — list of extractable sub-components
- `MentorScheduler.tsx` (2,727 lines) — list of extractable sub-components
- `WhatsAppMessaging.tsx` (1,381 lines) — list of extractable sub-components

### 0.5 Document all DB tables needed
- From current types/interfaces + service usage, derive full PostgreSQL schema
- Tables: users/profiles, programs, sessions, goals, tasks, journals, bookings, messages, events, applications, notifications, surveys, analytics_events

### 0.6 Document RLS policy requirements
- For each table: who can SELECT/INSERT/UPDATE/DELETE

### 0.7 Output
- `docs/AUDIT.md` with full findings

---

## Phase 1 — Supabase Project & Schema

**Goal**: Supabase project ready with all tables, RLS, seed data.

### 1.1 Create Supabase project
- Sign up / use existing Supabase account
- Note: `SUPABASE_URL`, `SUPABASE_ANON_KEY`

### 1.2 Environment setup
- Create `.env.local` with `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
- Update `.env.example` to include these

### 1.3 Database migrations
Write SQL migration files in `supabase/migrations/`:

| Migration | Tables |
|-----------|--------|
| `001_profiles.sql` | `profiles` (extends `auth.users`) |
| `002_programs.sql` | `programs`, `program_enrollments` |
| `003_sessions.sql` | `sessions` |
| `004_goals.sql` | `goals`, `goal_milestones` |
| `005_tasks.sql` | `tasks` |
| `006_journals.sql` | `journals` |
| `007_bookings.sql` | `bookings` |
| `008_messages.sql` | `messages` |
| `009_events.sql` | `events` |
| `010_applications.sql` | `applications` |
| `011_notifications.sql` | `notifications` |
| `012_surveys.sql` | `surveys`, `survey_responses` |
| `013_analytics.sql` | `analytics_events` |

Each migration includes:
- UUID PKs, FKs with CASCADE, indexes, constraints
- `created_at`, `updated_at` timestamps
- `deleted_at` for soft delete where appropriate
- `created_by`, `updated_by` FK to `auth.users`

### 1.4 Row Level Security
Write `supabase/migrations/999_rls.sql`:
- Per-table policies: SELECT (own / assigned), INSERT (own), UPDATE (own / mentor), DELETE (soft)
- Mentor role: broader read on assigned students
- Admin role: full access

### 1.5 Seed data
Write `supabase/seed/seed.sql`:
- 6 auth users matching existing mock data (mentor-1 + 5 students)
- Programs, sessions, goals, tasks, journals, messages, etc.
- ID values must match existing `MENTORINO_SEED_DATA` for continuity

### 1.6 Install dependency
```bash
npm install @supabase/supabase-js
```

### 1.7 Create Supabase client
`src/lib/supabase.ts`:
- `createClient(supabaseUrl, supabaseAnonKey)`
- Export typed `supabase` instance

---

## Phase 2 — Core Infrastructure

**Goal**: Auth working with Supabase; BaseSupabaseService ready.

### 2.1 Base service
Create `src/services/BaseSupabaseService.ts`:
```typescript
class BaseSupabaseService<T extends { id: string }> {
  constructor(protected tableName: string) {}
  async getAll(): Promise<T[]> { ... }
  async getById(id: string): Promise<T | null> { ... }
  async create(data: Omit<T, 'id' | 'created_at'>): Promise<T> { ... }
  async update(id: string, data: Partial<T>): Promise<T> { ... }
  async softDelete(id: string): Promise<void> { ... }
}
```
Each method calls `supabase.from(this.tableName).select/insert/update/delete` with RLS.

### 2.2 Auth migration
Replace `src/services/authService.ts`:

| Current (mock) | Target (Supabase Auth) |
|----------------|----------------------|
| Hardcoded users | `supabase.auth.signInWithPassword` |
| `MENTORINO_USERS` localStorage key | `supabase.auth.getSession` |
| Manual password check | `supabase.auth.signOut` |
| Local user profiles | `profiles` table synced via trigger |

**Files to modify:**
- `src/services/authService.ts` — full rewrite
- `src/contexts/AuthContext.tsx` — use `supabase.auth.onAuthStateChange` listener
- Remove `MENTORINO_USERS` localStorage usage

### 2.3 Auth trigger & profile sync
Create `supabase/migrations/900_auth_triggers.sql`:
- `ON AUHT USER CREATED` → insert row into `profiles`
- `ON AUHT USER DELETED` → soft-delete `profiles` row

### 2.4 Auth UI update
- Verify login page works with real Supabase Auth
- Add password reset flow via `supabase.auth.resetPasswordForEmail`
- Remove mock login debug panel

---

## Phase 3 — Service Migration (Data Layer)

**Goal**: All 24 services migrated from localStorage to Supabase. Each swap is contained to the service file — hooks and pages remain unchanged.

### 3a — User & Profile Services

| Service | Current | Target |
|---------|---------|--------|
| `authService` | mock → Phase 2 | Done in 2.2 |
| `userService` | localStorage | `profiles` table |
| `mentorService` | localStorage | `profiles` with `role='mentor'` |
| `studentService` | localStorage | `profiles` with `role='student'` |

### 3b — Program & Session Services

| Service | Current | Target |
|---------|---------|--------|
| `programService` | localStorage | `programs` table |
| `sessionService` | localStorage + some TanStack | `sessions` table |

### 3c — Goal & Task Services

| Service | Current | Target |
|---------|---------|--------|
| `goalService` | localStorage | `goals` table |
| `taskService` | localStorage | `tasks` table |

### 3d — Journal & Booking & Message Services

| Service | Current | Target |
|---------|---------|--------|
| `journalService` | localStorage | `journals` table |
| `bookingService` | localStorage | `bookings` table |
| `messageService` | localStorage | `messages` table |

### 3e — Application, Event & Notification Services

| Service | Current | Target |
|---------|---------|--------|
| `applicationService` | localStorage | `applications` table |
| `eventService` | localStorage | `events` table |
| `notificationService` | localStorage | `notifications` table |

### 3f — Analytics, Survey & Remaining Services

| Service | Current | Target |
|---------|---------|--------|
| `surveyService` | localStorage | `surveys` + `survey_responses` |
| `analyticsService` | localStorage | `analytics_events` |
| Any other services | localStorage | mapped table |

### Per-service migration pattern:
1. Create Supabase implementation (implements same interface as localStorage version)
2. Swap import in consuming hook(s)
3. Update hook to use TanStack Query if still on `useState`
4. Test all pages that consume the hook
5. Remove localStorage code for that domain
6. Remove corresponding `MENTORINO_*` key references

---

## Phase 4 — Edge Functions

**Goal**: All secure operations behind Supabase Edge Functions. No API keys in client.

### 4.1 Set up Edge Functions tooling
```bash
npm install -g supabase
supabase init
supabase functions new gemini
supabase functions new calendar
supabase functions new meet
supabase functions new resend
supabase functions new scheduled
```

### 4.2 Gemini Edge Function
`supabase/functions/gemini/index.ts`:
- Accept `{ prompt, context }` POST body
- Validate JWT (reject unauthenticated)
- Call Google Gemini API with API key from `Deno.env`
- Cache result in DB (avoid duplicate calls)
- Return `{ result }`

**Client**: `src/services/aiService.ts`
- POST to `supabase.functions.invoke('gemini', { body })`
- Never touches Gemini API key

### 4.3 Calendar Edge Function
`supabase/functions/calendar/index.ts`:
- Accept `{ action, eventData }`
- Create/update/delete Google Calendar events
- Called after booking confirmation

### 4.4 Meet Edge Function
`supabase/functions/meet/index.ts`:
- Accept `{ sessionId }`
- Create Google Meet link
- Store link in `sessions.meet_link`

### 4.5 Resend Edge Function
`supabase/functions/resend/index.ts`:
- Accept `{ template, to, data }`
- Send email via Resend API
- Templates: welcome, session_reminder, application_update

### 4.6 Scheduled Edge Function
`supabase/functions/scheduled/index.ts`:
- Daily: session reminders (check upcoming sessions, send emails)
- Weekly: inactivity alerts, progress summaries
- Triggered by Supabase cron

### 4.7 Environment secrets
```bash
supabase secrets set GEMINI_API_KEY=...
supabase secrets set GOOGLE_CLIENT_ID=...
supabase secrets set GOOGLE_CLIENT_SECRET=...
supabase secrets set RESEND_API_KEY=...
```

---

## Phase 5 — Folder Restructure

**Goal**: Move from type-oriented to feature-oriented layout. No logic changes — pure reorganization + splitting.

### 5.1 Create target structure
```
src/
  app/              App.tsx, root providers
  pages/            public pages (Landing, About, Apply, Auth, Mentorship)
  routes/           route config, route guards
  components/       truly shared (Layout, Sidebar, LoadingSpinner, EmptyState, ErrorState)
  features/         feature pods
    student/        StudentDashboard, StudentGoals, StudentJournals, etc.
    mentor/         MentorDashboard, MentorScheduler, MentorStudents, etc.
    goals/          GoalCard, GoalForm, GoalList, useGoals, GoalService
    sessions/       SessionCard, SessionList, SessionCalendar, useSessions
    journals/       JournalEntry, JournalList, useJournals
    messaging/      MessageThread, MessageList, useMessages, WhatsAppMessaging
    programs/       ProgramCard, ProgramList, usePrograms
    analytics/      AnalyticsCharts, ProgressReport, useAnalytics
    ai/             AIAssistant, AIInsights, useAI
    auth/           LoginForm, AuthGuard, useAuth
  services/         flattened (or keep in features/ — TBD)
  hooks/            shared cross-feature hooks only
  types/            shared types/interfaces
  utils/            shared utilities
  lib/              supabase.ts, external wrappers
  constants/        routes, roles, enums
  supabase/         migrations/, seed/
  edge-functions/   gemini/, calendar/, meet/, resend/, scheduled/
  docs/             PRD.md, BRD.md, ARCHITECTURE.md, AUDIT.md, IMPLEMENTATION_PLAN.md
```

### 5.2 Move strategy
Each file moves in 1 commit:
1. Create target directory
2. Move file (no content change)
3. Update all import paths
4. Verify build passes

### 5.3 Split monolithic files
- **MentorDashboard** (5,721 lines):
  - Extract: MentorStatsCards, MentorStudentList, MentorSessionCalendar, MentorTaskFeed, MentorActivityLog
- **MentorScheduler** (2,727 lines):
  - Extract: ScheduleCalendar, ScheduleForm, SessionTimeSlots, RecurringScheduleConfig
- **WhatsAppMessaging** (1,381 lines):
  - Extract: MessageBubble, MessageInput, ThreadList, AttachmentPreview

### 5.4 Cleanup
- Delete orphaned/unused files identified in Phase 0
- Remove `src/pages/` after all pages moved to `src/features/` or `src/pages/`
- Remove `src/hooks/` after feature-specific hooks moved to `src/features/*/`

---

## Phase 6 — TanStack Query Adoption

**Goal**: Every data-fetching hook uses TanStack Query. Zero `useState`+manual CRUD patterns.

### 6.1 Audit remaining hooks
- From Phase 0 list: which hooks still use `useState` instead of `useQuery`

### 6.2 Migrate each hook

Pattern:
```typescript
// Before (useState + manual CRUD)
const [goals, setGoals] = useState<Goal[]>([]);
useEffect(() => { goalService.getAll().then(setGoals); }, []);

// After (TanStack Query)
const { data: goals, isLoading, error } = useQuery({
  queryKey: ['goals', userId],
  queryFn: () => goalService.getAll(),
});
```

### 6.3 Add mutations
```typescript
const createGoal = useMutation({
  mutationFn: (data: CreateGoalInput) => goalService.create(data),
  onSuccess: () => queryClient.invalidateQueries({ queryKey: ['goals'] }),
});
```

### 6.4 Configure QueryClient
- `src/lib/queryClient.ts` — default staleTime, retry, refetchOnWindowFocus
- Add `QueryClientProvider` in `src/app/App.tsx`

---

## Phase 7 — Storage Migration

**Goal**: File uploads use Supabase Storage with RLS.

### 7.1 Create storage buckets
- `student-documents` — per-student folder access
- `mentor-resources` — mentor-only write, student read
- `profile-avatars` — public read, own-write

### 7.2 Storage RLS policies
- Students: `(storage.foldername())[1] = auth.uid()::text`
- Mentors: broader read on assigned students' folders

### 7.3 Create storage service
`src/services/storageService.ts`:
```typescript
class StorageService {
  async uploadStudentDocument(file: File, studentId: string): Promise<string>
  async getSignedUrl(path: string): Promise<string>
  async deleteFile(path: string): Promise<void>
}
```

### 7.4 Swap file uploads
- Replace any `localStorage`-based file handling with `storageService.upload`
- Update Application.tsx, profile editing, document uploads

---

## Phase 8 — Realtime Subscriptions

**Goal**: Messaging and notifications use Supabase Realtime. No polling.

### 8.1 Enable Realtime on tables
- `messages` — new message notifications
- `notifications` — real-time badge updates
- `sessions` — status changes

### 8.2 Subscribe in hooks
```typescript
supabase
  .channel('messages')
  .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `chat_id=eq.${chatId}` }, handleNewMessage)
  .subscribe()
```

### 8.3 Cleanup subscriptions on unmount

---

## Phase 9 — Monitoring & Analytics

**Goal**: Sentry + PostHog configured. No excessive event logging.

### 9.1 Sentry
```bash
npm install @sentry/react
```
- `src/lib/sentry.ts` — `Sentry.init` with DSN from env
- Wrap root component with `Sentry.ErrorBoundary`
- Configure performance tracing for route changes

### 9.2 PostHog
```bash
npm install posthog-js
```
- `src/lib/posthog.ts` — `posthog.init` with API key from env
- Track events: `signup`, `login`, `session_booked`, `goal_created`, `journal_written`, `program_enrolled`, `application_submitted`, `message_sent`
- Capture `$pageview` for meaningful pages only

---

## Phase 10 — Production Readiness

**Goal**: Everything works, nothing is broken, no dead paths.

### 10.1 State audit
Every component verified for:
- Loading state (skeleton or spinner)
- Empty state (helpful message + CTA)
- Error state (message + retry button)
- Success state (confirmation toast or redirect)

### 10.2 Performance checks
- Lazy loading confirmed on all routes
- TanStack Query cache TTLs tuned
- No unnecessary re-renders (React.memo where justified)
- Bundle size audit (`vite-plugin-visualizer`)

### 10.3 Vercel deployment
- `vercel.json`:
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```
- Connect GitHub repo → Vercel
- Set environment variables in Vercel dashboard
- Verify preview deployments and production build

### 10.4 Free tier audit
Verify against limits:
- Supabase Free: 2GB DB, 5GB bandwidth, 50MB storage, 50K auth users, 2 always-on edge functions
- Vercel Free: 100GB bandwidth, 6000 build minutes/month
- PostHog Free: 1M events/month
- Sentry Free: 5K events/month

### 10.5 Backup scripts
- `scripts/backup-db.sh` — `pg_dump` → Google Drive upload
- `scripts/backup-storage.sh` — `rclone` sync → Google Drive
- Document monthly backup procedure in `docs/BACKUP.md`

### 10.6 Disaster recovery doc
`docs/DISASTER_RECOVERY.md`:
- Step-by-step restore from backup
- Alternate PostgreSQL provider instructions
- Environment variable recovery

---

## Phase 11 — Cleanup & Docs

**Goal**: No dead code, no mock data, no localStorage references.

### 11.1 Remove localStorage code
- Delete `BaseLocalStorageService.ts`
- Remove all `MENTORINO_*` key constants
- Remove all seed data files
- Remove `localStorage.getItem/setItem` calls in services

### 11.2 Remove mock auth
- Delete mock user data
- Remove debug login panels
- Remove password checking logic

### 11.3 Remove dead imports
- Run TypeScript `noUnusedLocals` check
- Remove unused imports across all files

### 11.4 Update docs
- `PRD.md` — reflect live architecture
- `BRD.md` — reflect live architecture
- `ARCHITECTURE.md` — final version
- `README.md` — setup instructions with Supabase + Vercel

### 11.5 Final build verification
```bash
npm run build   # zero errors, zero warnings
```

---

## Dependency Graph

```
Phase 0 (Audit)
  └→ Phase 1 (Supabase Project + Schema)
       └→ Phase 2 (Auth + Base Service)
            ├→ Phase 3 (Service Migration)
            │    ├→ 3a (Users)
            │    ├→ 3b (Programs/Sessions)
            │    ├→ 3c (Goals/Tasks)
            │    ├→ 3d (Journals/Bookings/Messages)
            │    ├→ 3e (Applications/Events/Notifications)
            │    └→ 3f (Analytics/Surveys)
            ├→ Phase 4 (Edge Functions)
            └→ Phase 6 (TanStack Query)
                 └→ Phase 8 (Realtime)
Phase 5 (Folder Restructure) — can run parallel to Phases 6–8
Phase 7 (Storage)
Phase 9 (Monitoring & Analytics)
Phase 10 (Production Readiness)
Phase 11 (Cleanup & Docs)
```

---

## File Modification Count (Estimated)

| Phase | Files Created | Files Modified | Files Deleted |
|-------|--------------|----------------|---------------|
| 0 | 1 | 0 | 0 |
| 1 | 14+ | 3 | 0 |
| 2 | 2 | 3 | 0 |
| 3 | 20+ | 30+ | 0 |
| 4 | 6 | 1 | 0 |
| 5 | 30+ | 50+ | 15+ |
| 6 | 0 | 13 | 0 |
| 7 | 1 | 3 | 0 |
| 8 | 0 | 3 | 0 |
| 9 | 2 | 2 | 0 |
| 10 | 3 | 5 | 0 |
| 11 | 0 | 5 | 20+ |
| **Total** | **~80** | **~120** | **~35** |

---

## Key Principles

1. **One phase at a time** — each phase produces a working build
2. **No broken windows** — if a PR leaves the app broken, fix before moving on
3. **Services first** — Supabase communication only in services; never in components
4. **TanStack Query everywhere** — zero `useEffect`+`useState` data fetching by Phase 6
5. **Security in DB** — RLS is the authorization boundary, not frontend checks
6. **Free-tier aware** — every decision considers Supabase/Vercel free limits
7. **Portable** — only services/ knows about Supabase; swap provider by changing services/ only
