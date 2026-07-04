

# BRD — Mentorino Premium Mentorship Platform

## 1. Executive Summary

**Product:** Mentorino — A one-on-one career, academic, and life guidance mentorship platform built by/for Peter Mannarino.  
**Current State:** Fully client-side SPA (React 19 + TypeScript + Vite) with localStorage persistence. Mock authentication with 6 pre-seeded users. Seed data version v4 initializes 16+ localStorage stores on first load.  
**Target State:** Full-stack solution (Supabase backend) connecting mentors with mentees through applications, scheduling, goal tracking, messaging, events, and analytics.  
**Core Differentiator:** Covers the entire mentorship lifecycle in one platform — from application through enrollment, sessions, progress tracking, communication, and analytics — eliminating fragmented tooling.


## 2. Business Objectives

| # | Objective | Success Metric | Current Baseline | Target |
|---|-----------|----------------|-----------------|--------|
| 1 | Enable mentees to apply and enroll in structured mentorship programs | Application → approval conversion rate | ~100% (demo) | > 60% |
| 2 | Provide mentor with a 360° view of each student's health | Mentor dashboard DAU | N/A (pre-launch) | 5+ sessions/week |
| 3 | Facilitate 1:1 session scheduling, notes, and attendance tracking | Scheduled sessions per month | 4 (seeded demo) | 20+ / month |
| 4 | Support real-time communication | Messages exchanged per week | 7 (seeded demo) | 100+ / week |
| 5 | Allow mentor to host/manage events | Event registrations per event | 0 (seeded) | 15+ avg per event |
| 6 | Track student growth through goals, journals, tasks | Goal completion rate | 65% (demo avg) | > 75% |
| 7 | Monetize consultations and store products | Monthly recurring revenue | $0 (mock) | $2,000+ / month |
| 8 | Generate PDF reports for revenue, attendance, student health | Export actions per month | N/A | 10+ / month |
| 9 | Reduce mentor administrative overhead | Time spent on admin tasks | Manual/spreadsheets | < 2 hrs/week |


## 3. Market Context & Opportunity

### Problem
Career coaches and mentors currently juggle 4-6 separate tools:
- **Calendly** for scheduling
- **WhatsApp/Slack** for messaging
- **Google Sheets** for progress tracking
- **Zoom/Meet** for sessions
- **Email** for applications
- **Manual notes** for student health tracking

This fragmentation leads to:
- Missed follow-ups and sessions
- No centralized student health visibility
- Lost context between conversations
- High administrative overhead

### Solution Value Proposition
Mentorino replaces 4-6 tools with **one unified platform**:
- Application pipeline → automated enrollment
- Built-in scheduler with availability management
- WhatsApp-style messaging integrated into the platform
- Student health dashboard with metrics and alerts
- Program curriculum with video, quizzes, and progress tracking
- Revenue analytics with PDF/Excel export

### Target Market
- **Primary:** Solo career coaches and mentors managing 5-50 students
- **Secondary:** Small mentorship programs, bootcamps, and coaching practices


## 4. Stakeholders

| Stakeholder | Role | Key Concerns |
|-------------|------|--------------|
| **Peter Mannarino** | Product Owner / Mentor | Full visibility into student progress, reduced admin time, revenue growth |
| **Students (mentees)** | End users | Easy application, structured program, accountability, mentor access |
| **Visitors (prospects)** | Prospective users | Clear value proposition, simple application, trust signals |
| **Developer** | Technical implementer | Maintainable code, clear architecture, migration path to backend |


## 5. Functional Requirements

### FR1 — Authentication & Access Control
| ID | Requirement | Priority | Current Status |
|----|-------------|----------|----------------|
| FR1.1 | No public signup — accounts created by mentor upon application approval | P1 | ✅ Implemented |
| FR1.2 | User can log in with email + password | P1 | ✅ Mock (localStorage) |
| FR1.3 | User can request password reset | P2 | ✅ Mock stub |
| FR1.4 | Session persists across page reloads (localStorage) | P1 | ✅ Implemented |
| FR1.5 | Role-based routing: visitor, student, mentor | P1 | ✅ Implemented |
| FR1.6 | Student with pending application sees pending-approval page | P1 | ✅ Implemented |
| FR1.7 | JWT-based authentication via Supabase | P0 (v1) | ❌ Not started |
| FR1.8 | Social login (Google OAuth) | P3 | ❌ Not started |

### FR2 — Application & Enrollment
| ID | Requirement | Priority | Current Status |
|----|-------------|----------|----------------|
| FR2.1 | Visitor submits mentorship application (form with goals, background) | P1 | ✅ 4-step form |
| FR2.2 | Mentor reviews application details | P1 | ✅ Implemented |
| FR2.3 | Mentor approves/rejects with optional notes | P1 | ✅ Implemented |
| FR2.4 | On approval, system auto-creates a user account | P1 | ✅ localStorage create |
| FR2.5 | Approved student uses credentials to sign in | P1 | ✅ Implemented |
| FR2.6 | Email notification sent on approval/rejection | P2 | ❌ Not started |
| FR2.7 | Document upload (resume, portfolio) with application | P2 | ⚠️ Basic URL field |

### FR3 — Student Dashboard
| ID | Requirement | Priority | Current Status |
|----|-------------|----------|----------------|
| FR3.1 | Overview: progress summary, upcoming sessions, recent tasks | P1 | ✅ Implemented |
| FR3.2 | Goals: CRUD goals with milestones, status tracking | P1 | ✅ Implemented |
| FR3.3 | Tasks: view and complete assigned tasks with file uploads | P1 | ✅ Implemented |
| FR3.4 | Sessions: view upcoming/past 1:1 sessions with meeting links | P1 | ✅ Implemented |
| FR3.5 | Journal: daily/weekly journal entries viewable by mentor | P2 | ✅ Implemented |
| FR3.6 | Messaging: WhatsApp-style 1:1 and group chat with mentor | P1 | ✅ Implemented |
| FR3.7 | Resources: curated links by category | P2 | ✅ Implemented |
| FR3.8 | Events: view and register for mentor-hosted events | P2 | ✅ Implemented |
| FR3.9 | Programs: view curriculum, watch lesson videos, take quizzes | P1 | ✅ Implemented |

### FR4 — Mentor Dashboard
| ID | Requirement | Priority | Current Status |
|----|-------------|----------|----------------|
| FR4.1 | Overview: analytics widgets (revenue, student health, quick actions) | P1 | ✅ Implemented |
| FR4.2 | Students list: health status, tags, metrics | P1 | ✅ Implemented |
| FR4.3 | Applications: full review workflow with approval pipeline | P1 | ✅ Implemented |
| FR4.4 | Sessions: schedule, reschedule, add notes, track attendance | P1 | ✅ Implemented |
| FR4.5 | Programs: create/edit/view mentorship programs | P1 | ✅ Implemented |
| FR4.6 | Events: full CRUD with registration, capacity, files, feedback | P1 | ✅ Implemented |
| FR4.7 | Messaging: inbox with all student conversations | P1 | ✅ Implemented |
| FR4.8 | Analytics: revenue chart, student growth, task completion | P1 | ✅ Implemented |
| FR4.9 | Gallery: photo management for events/cohorts | P2 | ✅ Implemented |
| FR4.10 | Scheduler: weekly availability configuration | P2 | ✅ Implemented |
| FR4.11 | Store: product management | P3 | ⚠️ Mock products |
| FR4.12 | Revenue: transaction list with PDF export | P2 | ✅ Implemented |
| FR4.13 | AI Insights: AI-powered student analytics | P3 | ⚠️ Stub only |
| FR4.14 | Custom forms builder for student surveys | P2 | ⚠️ Basic CRUD |

### FR5 — Scheduling & Booking
| ID | Requirement | Priority | Current Status |
|----|-------------|----------|----------------|
| FR5.1 | Mentor sets weekly availability (day, start/end time) | P2 | ✅ Implemented |
| FR5.2 | Student books a session within available slots | P1 | ✅ Implemented |
| FR5.3 | Booking confirmed with meeting link and status tracking | P1 | ✅ Implemented |
| FR5.4 | Attendance can be marked (present/absent/excused) | P2 | ✅ Implemented |
| FR5.5 | Recurring session support | P2 | ⚠️ Basic |
| FR5.6 | Google Calendar two-way sync | P3 | ❌ Not started |

### FR6 — Communication
| ID | Requirement | Priority | Current Status |
|----|-------------|----------|----------------|
| FR6.1 | Real-time messaging (1:1 and group conversations) | P1 | ✅ localStorage polling |
| FR6.2 | Send text messages, images, files, voice messages | P1 | ✅ Simulated |
| FR6.3 | Message read/unread status, timestamps | P2 | ✅ Implemented |
| FR6.4 | Conversation list with last message preview | P1 | ✅ Implemented |
| FR6.5 | Group chat creation and management | P1 | ✅ Implemented |
| FR6.6 | Message pinning, archiving, muting | P2 | ✅ Implemented |
| FR6.7 | Voice message recording and playback | P2 | ⚠️ Simulated |
| FR6.8 | Audio/video call simulation | P3 | ⚠️ UI only |

### FR7 — Content & Learning
| ID | Requirement | Priority | Current Status |
|----|-------------|----------|----------------|
| FR7.1 | Programs structured as modules → lessons → topics | P1 | ✅ Hardcoded curriculum |
| FR7.2 | Video playback via HLS stream (hls.js) | P1 | ✅ Implemented |
| FR7.3 | Quizzes with multiple-choice questions | P1 | ✅ Implemented |
| FR7.4 | Assignments with descriptions and file submissions | P2 | ✅ UI + storage |
| FR7.5 | Progress tracking across lessons and modules | P1 | ✅ localStorage |
| FR7.6 | Mentor-managed program curriculum | P2 | ⚠️ Basic CRUD |

### FR8 — Events
| ID | Requirement | Priority | Current Status |
|----|-------------|----------|----------------|
| FR8.1 | Create events with title, date, location, capacity, banner | P1 | ✅ Implemented |
| FR8.2 | Publish/unpublish, manage registrations | P1 | ✅ Implemented |
| FR8.3 | Upload event files (slides, PDFs, recordings) | P2 | ✅ Implemented |
| FR8.4 | Collect and manage attendee feedback | P2 | ✅ Implemented |
| FR8.5 | Waitlist management when capacity reached | P2 | ⚠️ Capacity tracking exists |
| FR8.6 | Event recording links with platform metadata | P2 | ✅ Implemented |

### FR9 — Analytics & Reporting
| ID | Requirement | Priority | Current Status |
|----|-------------|----------|----------------|
| FR9.1 | Revenue line chart with time filters (7d/30d/90d/1y) | P1 | ✅ Recharts |
| FR9.2 | Student health distribution chart | P2 | ✅ Implemented |
| FR9.3 | Task completion rates overview | P2 | ✅ Implemented |
| FR9.4 | PDF export of revenue/analytics reports | P2 | ✅ jsPDF |
| FR9.5 | Excel/CSV export of transaction data | P2 | ✅ xlsx |
| FR9.6 | Student growth trends over time | P3 | ❌ Not started |


## 6. Non-Functional Requirements

| ID | Requirement | Target | Current State |
|----|-------------|--------|---------------|
| NFR1 | Performance — page load via lazy loading | < 2s initial load | ✅ React.lazy + Suspense |
| NFR2 | Responsive — mobile + desktop layouts | Sidebar collapses on mobile | ✅ Tailwind responsive |
| NFR3 | Data Persistence — no data loss on refresh | localStorage + sync events | ✅ 25+ keys maintained |
| NFR4 | Security — mock auth ready for JWT/Supabase | Architecture supports migration | ✅ Service abstraction |
| NFR5 | Accessibility — semantic HTML, keyboard navigation | WCAG 2.1 AA target | ⚠️ Partial |
| NFR6 | Code organization — lazy-loaded routes | React.lazy + Suspense | ✅ All routes lazy |
| NFR7 | Browser compatibility | Chrome, Firefox, Safari, Edge | ✅ Vite ES2020 |
| NFR8 | Offline fallback | Memory storage if localStorage unavailable | ✅ BaseLocalStorageService |
| NFR9 | Code quality — TypeScript strict mode | `tsc --noEmit` passes | ✅ Configured |
| NFR10 | SEO — public pages indexable | Meta tags, semantic HTML | ⚠️ Partial |


## 7. Scope

### In-Scope (v1.0)
- Full mentorship lifecycle: Application → Approval → Dashboard → Sessions → Growth
- Student self-service (goals, tasks, journal, messaging, programs, quizzes)
- Mentor management (students, sessions, events, analytics, applications, messages)
- Revenue tracking with chart visualization and PDF/Excel export
- WhatsApp-style messaging with 1:1 and group conversations
- Program curriculum with HLS video playback and quizzes
- Event management with registration, files, and feedback
- Student health monitoring with computed metrics
- Growth Audit multi-section form
- Gallery management with category filtering
- Offline-first: all data persists in localStorage

### Out-of-Scope (v1.0)
- Real payment gateway (store is mock)
- Live video/audio calls (meeting links are external)
- Real AI / ML insights (stub only)
- Native mobile apps
- Multi-mentor support (single mentor architecture)
- Real-time WebSocket messaging
- Public user signup (accounts created by mentor)
- Google Calendar sync
- Email notifications


## 8. Constraints

| # | Constraint | Impact | Mitigation |
|---|------------|--------|------------|
| 1 | 100% client-side (no backend server) | All data in browser localStorage | Service abstraction layer enables future backend migration |
| 2 | localStorage ~5MB limit | Cannot store large files or media | File metadata stored; actual files URL-linked |
| 3 | Mock auth — no real security | Not production-ready | Architecture supports Supabase Auth migration |
| 4 | No real-time WebSocket | Messaging uses localStorage polling with custom events | Cross-tab sync via `database-sync` window events |
| 5 | Single mentor architecture | Cannot scale to multi-mentor without refactor | RBAC ready for role expansion |
| 6 | Manual seed version management | Data resets on version bump | Version checks prevent unnecessary reseeding |


## 9. Assumptions

| # | Assumption | Risk if Wrong |
|---|------------|---------------|
| 1 | Single mentor operates the platform | High — if multi-mentor needed, significant refactor required |
| 2 | Students have consistent internet access | Medium — no offline-first beyond localStorage |
| 3 | Mentor shares login credentials manually with approved students | Medium — no automated email delivery |
| 4 | External meeting links (Zoom/Meet) cover session needs | Low — video calls were out-of-scope intentionally |
| 5 | localStorage is sufficient for demo/MVP data volume | Low — ~5MB limit adequate for text + small metadata |
| 6 | Users access from modern browsers | Low — ES2020 target via Vite |
| 7 | All times are America/New_York | Medium — hardcoded timezone via getNJDate() |


## 10. Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|:----------:|:------:|------------|
| localStorage data loss (clear cache) | Medium | High | Seed data auto-restores on version mismatch |
| Mock auth security breach | High | High | No real user data; path to Supabase Auth designed |
| Single mentor becomes bottleneck | Medium | Medium | Dashboard designed for efficiency; automation reduces load |
| Browser storage quota exceeded | Low | Medium | All file storage is URL-based, not data-URL |
| Seed data version conflicts | Low | Medium | Version key comparison prevents unnecessary resets |
| Cross-tab messaging sync delays | Medium | Low | Custom events + event listeners handle sync |
| Technical debt from frontend-only architecture | Medium | Medium | Service layer abstraction enables clean migration |


## 11. Data Migration Path

### Current: localStorage
```
Component → Hook → Service → localStorage
```

### Target: Supabase
```
Component → Hook → React Query → Supabase Client → PostgreSQL
```

### Migration Strategy
1. Create Supabase project with matching schema (tables for each localStorage entity)
2. Implement Supabase client service replacing each domain service
3. Swap React Query `queryFn` to call Supabase instead of localStorage
4. Migrate auth to Supabase Auth (JWT)
5. Enable real-time subscriptions for messaging and notifications
6. Remove localStorage fallback after validation

### Schema Mapping
| localStorage Key | Proposed Supabase Table |
|-----------------|------------------------|
| `mentorino_mock_users` | `auth.users` (Supabase Auth) + `profiles` |
| `mentorino_applications` | `applications` |
| `mentorino_students` | `student_profiles` |
| `mentorino_sessions` | `sessions` |
| `mock_bookings_v2` | `bookings` |
| `mentorino_goals` | `goals` |
| `mentorino_tasks` | `tasks` |
| `mentorino_journals` | `journals` |
| `mentorino_events` | `events` |
| `mentorino_programs` | `programs` |
| `mentorino_progress` | `student_progress` |
| `whatsapp_conversations_v4` | `conversations` |
| `whatsapp_messages_v4` | `messages` |
| `mentorino_transactions` | `transactions` |


## 12. Technical Architecture (Current)

```
Frontend (React 19 + TypeScript + Vite)
│
├── Pages (28 lazy-loaded route components)
│   ├── Public: Landing, About, Programs, FAQ, Contact, Gallery, Apply, Auth
│   ├── Student: UserDashboard (/student/*), Booking, Store, Survey
│   └── Mentor: MentorDashboard (/mentor/*), AdminRevenue (/admin/revenue)
│
├── Components (15 reusable)
│   ├── Layout: Layout (sidebar), VisitorHeader, Footer, ProtectedRoute
│   ├── Student: StudentProgramView, StudentGoals, StudentTasks, StudentJournal
│   ├── Mentor: MentorScheduler, EventManagement, GalleryManagement
│   └── Shared: WhatsAppMessaging, TaskActivityForm, VoiceMessagePlayer
│
├── Hooks (14)
│   ├── React Query: useSessions, usePrograms, useEventsQuery, useBookingsQuery
│   └── State-based: useTasks, useGoals, useJournals, useActionItems, useApplications
│
├── Services (22)
│   ├── Domain: authService, applicationService, eventService, sessionService
│   ├── Storage: goalStorage, journalStorage, taskStorage, studentStorage
│   └── Utility: geminiService (stub), curriculumService (static)
│
└── Utils: toast, dateUtils, progressUtils, seedData, queryClient
```


## 13. Key Business Logic Rules

### Application → Student Pipeline
- No public signup. The only way to get an account is through mentor approval.
- Upon approval, the system auto-creates a user account with generated credentials.
- Only users with `application_status === 'approved'` can access the student dashboard.

### Student Health Calculation
Students have `healthStatus` computed from:
- `attendanceRate` — session attendance %
- `goalCompletionRate` — goals completed vs total
- `activityLevel` — recent logins/interactions

### Event Registration Constraints
- Events have `capacity` (max attendees) and optional waitlist
- Registration closes at `registrationDeadline`
- Students cannot register twice for the same event

### Role-Based Access
| Role | Allowed Routes |
|------|---------------|
| visitor | Landing, About, Programs, FAQ, Contact, Gallery, Auth, Apply, Consultation |
| student | All visitor routes + /student/* dashboard + /booking, /store, /survey |
| mentor | All routes + /mentor/* dashboard + /admin/revenue |

### Data Seeding
- On app init, `seedDatabase()` checks `mentorino_seed_version` against current version (v4)
- On mismatch → clears all data → re-seeds 16+ collections with demo data
- Ensures fresh demo data on first load or after version bumps

### Cross-Component Synchronization
- Custom DOM events: `user-profile-changed`, `database-sync`, `new-message`
- Components listen via `window.addEventListener` to refresh state
- TanStack Query's refetchOnWindowFocus provides additional sync


## 14. Codebase Size & Complexity

| Metric | Value |
|--------|-------|
| Total TypeScript files | 64+ |
| Total lines (src/) | ~20,000+ |
| Largest file | `MentorDashboard.tsx` — 5,721 lines |
| Components | 15 |
| Pages | 28 |
| Hooks | 14 |
| Services | 22 |
| Interfaces | 9 files |
| Types | 3 files |
| localStorage keys managed | 25+ |
| Dependencies | 12 production, 4 dev |


## 15. Success Metrics & KPIs

| Category | Metric | Target |
|----------|--------|--------|
| **Engagement** | Active students / total enrolled | > 80% |
| **Engagement** | Sessions attended / scheduled | > 85% |
| **Engagement** | Messages sent per student per week | > 10 |
| **Progress** | Goal completion rate | > 75% |
| **Progress** | Program completion rate | > 60% |
| **Quality** | Average session rating (1-5) | > 4.2 |
| **Business** | Monthly active users | > 30 |
| **Business** | Revenue per student (monthly) | > $100 |
| **Technical** | Page load time | < 2s |
| **Technical** | TypeScript compilation errors | 0 |
