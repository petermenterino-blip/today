# Mentorino — Application Flow & Business Logic

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                    PRESENTATION LAYER                               │
│  Pages (Lazy-loaded) → Components (Reusable UI)                     │
│     - Landing, Auth, UserDashboard, MentorDashboard                 │
│     - StudentGoals, WhatsAppMessaging, EventManagement, etc.        │
└───────────────────────────┬─────────────────────────────────────────┘
                            │ calls hooks / receives state
┌───────────────────────────▼─────────────────────────────────────────┐
│                      HOOK LAYER (Business Logic)                     │
│  Custom hooks encapsulating state + data access:                     │
│     useSessions(), useTasks(), useGoals(), useEvents(), ...          │
│  Two patterns:                                                       │
│     a) useState + manual localStorage CRUD (useGoals, useJournals)   │
│     b) TanStack useQuery/useMutation (useSessions, usePrograms)      │
└───────────────────────────┬─────────────────────────────────────────┘
                            │ calls service methods
┌───────────────────────────▼─────────────────────────────────────────┐
│                      SERVICE LAYER (Data Access)                     │
│  Services abstracting persistence:                                   │
│     - BaseLocalStorageService<T> (generic CRUD)                      │
│     - Domain services: authService, bookingService, eventService...  │
└───────────────────────────┬─────────────────────────────────────────┘
                            │ reads/writes
┌───────────────────────────▼─────────────────────────────────────────┐
│                      PERSISTENCE LAYER                               │
│  browser localStorage (16+ keys prefixed mentorino_*)                │
│  Seed versioning: mentorino_seed_version → "v4"                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## User Journey Flows

### 1. Visitor → Student Pipeline

```
Landing Page (/)
    │
    ▼
Application Page (/apply)
    │  Fills: name, email, goal, linkedin, resume, focus_area
    │  Submits → applicationService.submitApplication()
    │  → localStorage: mentorino_applications (status: 'pending_review')
    │  No account is created at this point
    ▼
Visitor returns to site — can only browse public pages
    │  Cannot sign in yet (no account exists)
    │
    │  Mentor reviews & approves via MentorDashboard
    │  → applicationService.approveApplication()
    │    → updates application.status = 'approved'
    │    → AUTO-CREATES user account in mentorino_mock_users
    │      (email + generated password)
    │    → creates StudentProfile in mentorino_students
    ▼
Applicant receives credentials (shared by mentor)
    │
    ▼
Sign In (/auth) with generated email + password
    │
    ▼
Student Dashboard (/student/*) ─── Full access granted
```

### 2. Auth Flow

```
App.tsx mounts
    │
    ▼
AuthProvider initializes
    │  authService.getCurrentUser()
    │    → reads localStorage key "mentorino_auth_user"
    │    → parses JSON or returns null
    │
    ├── Found user? ──→ setUser(), setRole(), authLoading = false
    │                      → Routes render with role-based access
    │
    └── No user? ────→ setUser(null), role='visitor', authLoading = false
                          → Public routes only (Landing, Auth, Apply)
```

### 3. Session Scheduling Flow

```
Mentor sets availability (MentorScheduler)
    │  → localStorage: mentorino_availability
    ▼
Student views open slots → picks date/time
    │  → bookingService.insert({ date, time, status: 'confirmed' })
    │  → localStorage: mentorino_bookings
    ▼
Mentor & Student see session in their dashboards
    │
    ├── Session happens → Mentor marks attendance
    │     → bookingService.update(id, { attendance: 'present'|'absent'|'excused' })
    │
    └── Mentor adds session notes
          → sessionService.create() → localStorage: mentorino_sessions
```

### 4. Goal & Task Lifecycle

```
Mentor creates TaskActivity (assigns to student)
    │  → taskService.create() → localStorage: mentorino_tasks
    ▼
Student sees task in StudentTasks
    │  Completes, submits file + description
    │  → taskService.update(id, { status: 'submitted' })
    ▼
Mentor reviews submission, gives feedback
    │  → taskService.update(id, { status: 'approved'|'rejected', feedback })
    ▼
Goal tracking (student self-service):
    │  Student creates goal → goalStorage.create()
    │  Updates milestones → marks status 'in_progress' / 'completed'
    │  → localStorage: mentorino_goals
```

### 5. Messaging Flow

```
WhatsAppMessaging mounts
    │  messageStorage.getConversations(userId)
    │  → localStorage: whatsapp_conversations_v4
    ▼
User selects conversation
    │  messageStorage.getMessages(conversationId)
    │  → localStorage: whatsapp_messages_v4
    ▼
User sends message
    │  messageStorage.sendMessage({ conversationId, content, type: 'text' })
    │  → pushes to messages array in localStorage
    │  → updates conversation.lastMessage + unreadCount
    │  → dispatches custom event 'new-message'
    ▼
Recipient's UI refreshes (via event listener → re-reads localStorage)
```

### 6. Program Curriculum Flow

```
StudentProgramView mounts
    │  usePrograms() → curriculumService.getPrograms()
    │  → reads hardcoded curriculum data from curriculumService.ts
    ▼
Student views program modules → lessons
    │  Selects a lesson → HLS video player renders (hls.js)
    │  Watches video → progress tracked via studentProgressService
    │  → localStorage: mentorino_progress
    ▼
Completes lesson → unlocks quiz
    │  Takes quiz (multiple choice) → scored immediately
    │  Quiz result stored in progress
    ▼
Completes all modules → program.progress = 100%
```

### 7. Event Management Flow

```
Mentor creates event (EventManagement component)
    │  → eventService.create() with title, date, capacity, banner
    │  → localStorage: mentorino_events
    ▼
Mentor publishes event (status: 'published')
    ▼
Student browses events → registers
    │  → pushes userId to event.attendees[]
    │  → creates EventRegistration record
    ▼
Event day → Mentor marks attendance
    │  → updates registration.attendanceStatus
    ▼
Event ends → Mentor uploads files (slides, recording)
    │  → event.files.push(file)
    ▼
Attendees can submit feedback (rating + comment)
```

### 8. Application Approval Pipeline (Mentor-side Logic)

```
MentorDashboard > Applications tab mounts
    │  useApplications() → applicationService.getAll()
    │  → filters by status: pending / approved / rejected
    ▼
Mentor reviews pending application
    │  Can view: full form data, linkedin, resume, goal statement
    ▼
Mentor decision:
    │
    ├── Approve:
    │     applicationService.approveApplication(applicationId)
    │       1. Updates application.status = 'approved'
    │       2. Creates StudentProfile record in localStorage
    │       3. Updates auth user's application_status = 'approved'
    │       4. Dispatches 'user-profile-changed' event
    │     → Student dashboard unlocks
    │
    └── Reject:
          applicationService.update(id, { status: 'rejected' })
          → Student sees rejection status (no further action)
```

---

## Data Models (localStorage Keys)

| Key | Type | Description |
|-----|------|-------------|
| `mentorino_auth_user` | JSON | Current authenticated user + profile |
| `mentorino_applications` | Array | Mentorship applications |
| `mentorino_students` | Array | Student profiles (health, tags, metrics) |
| `mentorino_sessions` | Array | 1:1 session records |
| `mentorino_bookings` | Array | Booking/scheduling records |
| `mentorino_goals` | Array | Student goals with milestones |
| `mentorino_tasks` | Array | Task activities assigned by mentor |
| `mentorino_journals` | Array | Student journal entries |
| `mentorino_events` | Array | Network events created by mentor |
| `mentorino_programs` | Array | Mentorship programs |
| `mentorino_progress` | Array | Lesson/program progress |
| `mentorino_resources` | Array | Curated resource links |
| `mentorino_tags` | Array | Student categorization tags |
| `mentorino_notifications` | Array | System notifications |
| `mentorino_availability` | Array | Mentor weekly schedule |
| `mentorino_products` | Array | Store products |
| `mentorino_purchases` | Array | User purchase history |
| `mentorino_transactions` | Array | Revenue transactions |
| `mentorino_settings` | Object | Mentor preferences |
| `mentorino_announcements` | Array | Platform announcements |
| `mentorino_files` | Array | Uploaded file records |
| `mentorino_forms` | Array | Custom form templates |
| `mentorino_form_submissions` | Array | Form responses |
| `mentorino_gallery` | Array | Gallery images |
| `whatsapp_conversations_v4` | Array | Messaging conversations |
| `whatsapp_messages_v4` | Array | Individual messages |
| `sidebar_collapsed` | boolean | UI preference |
| `mentorino_seed_version` | string | Seed data version |

---

## Key Business Logic Rules

### Role-Based Access
- `visitor` → Landing, About, Programs, FAQ, Contact, Gallery, Auth, Apply, Consultation
- `student` → All visitor routes + /student/* (dashboard)
- `mentor` → All routes + /mentor/* (management dashboard) + /admin/revenue

### Application → Student Pipeline
- No public signup exists. The only way to get an account is through the application → approval pipeline
- Visitors submit an application without creating an account
- Upon approval, the system auto-creates a user account (email + generated password) and a `StudentProfile`
- The mentor shares the login credentials with the applicant
- Only users with `application_status === 'approved'` can access the student dashboard
- Applicants with `pending` status see the pending-approval page if they somehow sign in (existing seeded users)

### Student Health Calculation
- Students have a `healthStatus: 'active' | 'needs_attention' | 'at_risk'` computed from:
  - `attendanceRate` — session attendance %
  - `goalCompletionRate` — goals completed vs total
  - `activityLevel` — recent logins/interactions

### Session Attendance Tracking
- Mentor marks attendance post-session
- Attendance rate feeds into student health metrics
- Sessions with `attendance: 'absent'` lower the health score

### Event Registration Constraints
- Events have `capacity` (max attendees) and optional `waitlistLimit`
- Registration closes at `registrationDeadline`
- Students cannot register twice for the same event

### Data Seeding Logic
- On app init, `seedDatabase()` in `main.tsx` runs
- Checks `mentorino_seed_version` against current seed version (`v4`)
- If different → clears all mentorino_* + whatsapp_* keys → re-seeds 16+ collections
- This ensures demo data is fresh on first load or after seed version bumps

### Cross-Component Synchronization
- Uses custom DOM events (`user-profile-changed`, `database-sync`, `new-message`)
- Components listen via `window.addEventListener` to refresh state without prop drilling
- TanStack Query's automatic refetch on window focus provides additional sync
