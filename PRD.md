# PRD — Mentorino Premium Mentorship Platform

## 1. Product Overview

**Product Name:** Mentorino  
**Tagline:** Your Career, Guided.  
**Product Type:** Single-page web application (React 19 + TypeScript)  
**Current State:** Client-side SPA with localStorage persistence, mock auth, seeded demo data  
**Target State:** Full-stack solution (Supabase backend) connecting mentors with mentees through applications, scheduling, goal tracking, messaging, events, and analytics  

---

## 2. Problem Statement

Career transitions, academic guidance, and life coaching suffer from fragmented tooling. Aspiring professionals rely on disjointed spreadsheets, calendar apps, messaging threads, and notes to manage mentorship — leading to poor follow-through, missed sessions, and lack of structured progress tracking.

Mentorino solves this by providing a **single unified platform** covering the entire mentorship lifecycle: application → enrollment → 1:1 sessions → goal tracking → messaging → events → analytics.

---

## 3. Target Audience

| Persona | Description | Pain Points |
|---------|-------------|-------------|
| **Mentor** (Peter Mannarino / admin) | Career coach managing 5-50 mentees | Scattered tools, no student health visibility, manual follow-ups, no analytics |
| **Student (mentee)** | Career transitioner, recent grad, or professional seeking guidance | No structured program, hard to track progress, disconnected communication |
| **Visitor** | Prospective applicant browsing the platform | No clear application pipeline, no visibility into program structure |

---

## 4. User Personas

### 4.1 Mentor — Sarah (Admin)
- **Role:** Platform administrator + mentor
- **Needs:** Review applications, manage students at scale, schedule sessions, track student health, communicate in-app, run events, view revenue analytics
- **Goals:** Maximize student success rates, streamline administrative overhead, grow program revenue

### 4.2 Student — Alex (Mentee)
- **Role:** Approved program participant
- **Needs:** View program curriculum, complete tasks and goals, book and attend sessions, message mentor, journal progress, register for events
- **Goals:** Career transition, skill development, accountability

### 4.3 Visitor — Brianna (Prospect)
- **Role:** Unauthenticated browser
- **Needs:** Learn about programs, submit mentorship application, book consultation, browse public content
- **Goals:** Evaluate fit, get accepted into the program

---

## 5. Functional Requirements (MoSCoW Prioritization)

### P1 — Must Have (MVP)

| ID | Requirement | Related FR |
|----|-------------|------------|
| F-01 | Mock authentication with email + password | FR1.1-1.6 |
| F-02 | Role-based routing (visitor, student, mentor) | FR1.5 |
| F-03 | Mentorship application submission with form fields | FR2.1 |
| F-04 | Application review pipeline with approve/reject | FR2.2-2.5 |
| F-05 | Student dashboard with progress summary, upcoming sessions, tasks | FR3.1 |
| F-06 | Goals CRUD with milestone tracking | FR3.2 |
| F-07 | Task assignment, submission, feedback workflow | FR3.3 |
| F-08 | Session scheduling with meeting links and attendance | FR3.4, FR5.1-5.4 |
| F-09 | WhatsApp-style 1:1 and group messaging | FR3.6, FR6.1-6.4 |
| F-10 | Mentor dashboard with student list, health status, quick actions | FR4.1-4.2 |
| F-11 | Program curriculum viewer with HLS video playback | FR3.9, FR7.1-7.2 |
| F-12 | Quiz system within program lessons | FR7.3 |
| F-13 | Events CRUD with registration and capacity management | FR4.6, FR8.1-8.2 |
| F-14 | Analytics widgets (revenue chart, student growth) | FR4.8, FR9.1 |
| F-15 | Responsive layout (sidebar collapses on mobile) | NFR2 |
| F-16 | Lazy-loaded routes for performance | NFR1, NFR6 |
| F-17 | localStorage persistence across sessions | FR1.4, NFR3 |

### P2 — Should Have (v1.1)

| ID | Requirement | Related FR |
|----|-------------|------------|
| F-18 | Student journal with mentor review | FR3.5 |
| F-19 | Resource links management by category | FR3.7 |
| F-20 | Student event viewing and registration | FR3.8 |
| F-21 | Session notes and attendance tracking | FR5.4 |
| F-22 | Mentor weekly availability scheduler | FR4.10 |
| F-23 | Gallery management (photo events/cohorts) | FR4.9 |
| F-24 | Revenue transactions list with PDF export | FR4.12, FR9.4 |
| F-25 | Student health distribution chart | FR9.2 |
| F-26 | Task completion rates overview | FR9.3 |
| F-27 | Password reset flow (mock) | FR1.3 |
| F-28 | Event files upload (slides, recordings) | FR8.3 |
| F-29 | Attendee feedback collection | FR8.4 |
| F-30 | Message read/unread status | FR6.3 |

### P3 — Could Have (v1.2+)

| ID | Requirement | Related FR |
|----|-------------|------------|
| F-31 | AI-powered student insights panel (stub) | FR4.13 |
| F-32 | Store product management and mock purchases | FR4.11 |
| F-33 | Custom forms builder for mentor | Mentioned in services |
| F-34 | Assignment submissions with file uploads | FR7.4 |
| F-35 | Announcement broadcasting | FR4.x |
| F-36 | Multiple-choice quiz scoring | Extended from F-12 |
| F-37 | Google Calendar sync integration | Referenced in types |

### P4 — Won't Have (v1)

| ID | Requirement | Reason |
|----|-------------|--------|
| F-38 | Real payment gateway | Out of scope — store is mock |
| F-39 | Live video/audio calls | Meeting links are external (Zoom/Meet) |
| F-40 | Real AI/ML insights | Stub only |
| F-41 | Native mobile apps | Web-only v1 |
| F-42 | Multi-mentor support | Single mentor architecture |
| F-43 | Real-time WebSocket messaging | Polling from localStorage |
| F-44 | Public user signup | Accounts created by mentor upon approval |

---

## 6. User Stories

### Visitor
```
As a visitor, I want to browse programs and the about page
so that I can evaluate if this mentorship is right for me.

As a visitor, I want to submit a mentorship application with my goals and background
so that the mentor can review my fit.

As a visitor, I want to book a free consultation call
so that I can discuss my needs before committing.
```

### Student
```
As a student, I want to see my program curriculum with video lessons and quizzes
so that I can learn at my own pace.

As a student, I want to set goals with milestones
so that I can track my progress.

As a student, I want to view and complete assigned tasks
so that I stay accountable.

As a student, I want to chat with my mentor in real-time
so that I can get quick feedback.

As a student, I want to book sessions within available slots
so that I can schedule 1:1 time.

As a student, I want to journal my progress
so that I can reflect and my mentor can provide guidance.
```

### Mentor
```
As a mentor, I want to review and approve/reject applications
so that I can manage who joins the program.

As a mentor, I want a dashboard showing all students with health status
so that I can identify who needs attention.

As a mentor, I want to assign tasks with due dates and review submissions
so that students stay on track.

As a mentor, I want to schedule sessions and mark attendance
so that I can track engagement.

As a mentor, I want to message students individually and in groups
so that communication is seamless.

As a mentor, I want to create and manage events with registration
so that I can run workshops and networking.

As a mentor, I want to view revenue analytics and export reports
so that I can measure business performance.
```

---

## 7. Acceptance Criteria

### Application Pipeline
```
Scenario: Visitor submits application
  Given a visitor on the /apply page
  When they complete all 4 steps of the form
  Then the application is saved with status "pending_review"
  And the visitor sees a success confirmation

Scenario: Mentor approves application
  Given a pending application in the mentor dashboard
  When the mentor clicks "Approve"
  Then a user account is auto-created
  And the applicant's status becomes "approved"
  And the student dashboard becomes accessible to the applicant
```

### Session Scheduling
```
Scenario: Student books a session
  Given the mentor has set availability
  When a student selects an open time slot
  Then a booking is created with status "confirmed"
  And both mentor and student see it in their dashboards
```

### Messaging
```
Scenario: User sends a message
  Given a user is in a conversation
  When they type and send a message
  Then the message appears in the chat
  And the conversation list updates with the last message preview
  And the recipient sees an unread count
```

---

## 8. Non-Functional Requirements

| ID | Requirement | Target | Measure |
|----|-------------|--------|---------|
| NFR1 | Performance — initial load time | < 2s | React.lazy + Suspense + code splitting |
| NFR2 | Responsive design | Mobile + desktop | Sidebar collapses on < 768px |
| NFR3 | Data persistence | No data loss on refresh | localStorage + sync events |
| NFR4 | Security architecture | JWT/Supabase ready | Service abstraction layer supports migration |
| NFR5 | Accessibility | WCAG 2.1 AA target | Semantic HTML, keyboard navigation |
| NFR6 | Code organization | Modular, lazy-loaded | Feature-based routing with React.lazy |
| NFR7 | Browser compatibility | Modern browsers | ES2020 target via Vite |
| NFR8 | Offline resilience | Graceful degradation | Memory fallback if localStorage unavailable |

---

## 9. UI/UX Requirements

### Design System
- **Framework:** Tailwind CSS (utility-first)
- **Animation:** Motion library (framer-motion)
- **Icons:** Lucide React
- **Color Palette:** Black/white/indigo
- **Typography:** Bold uppercase (`font-black`, `tracking-tighter`) for headings
- **Border Radius:** Large (up to 80px), heavy use of rounded corners (32px+)
- **Layout:** Sidebar navigation (collapsible) + main content area

### Key Screens
| Screen | Route | Description |
|--------|-------|-------------|
| Landing | `/` | Full marketing page: hero, process, about, philosophy, programs, testimonials, FAQ, contact |
| Auth | `/auth` | Sign-in form with redirect |
| Application | `/apply` | 4-step application form (profile, meeting pref, goals, documents) |
| Student Dashboard | `/student/*` | Overview, programs, goals, tasks, sessions, events, journal, messaging |
| Mentor Dashboard | `/mentor/*` | Students, applications, scheduler, analytics, events, messaging, forms, files, settings |
| Admin Revenue | `/admin/revenue` | Revenue chart, transaction table, PDF/Excel export |

---

## 10. Technical Architecture

### Current (v0 — Client-side SPA)
```
┌─────────────────────────────────────┐
│          Presentation Layer          │
│  React 19 + TypeScript + Tailwind   │
│  Lazy-loaded pages + Suspense       │
├─────────────────────────────────────┤
│          Business Logic Layer        │
│  Custom hooks (React Query + state)  │
│  AuthContext (React Context)         │
├─────────────────────────────────────┤
│          Service Layer               │
│  Domain services (auth, app, event)  │
│  BaseLocalStorageService<T> (CRUD)   │
├─────────────────────────────────────┤
│          Persistence Layer           │
│  browser localStorage (25+ keys)     │
│  Memory fallback                     │
└─────────────────────────────────────┘
```

### Target (v1 — Full-stack with Supabase)
```
┌─────────────────────────────────────┐
│          Frontend SPA (React)        │
│  Same as current + Supabase client   │
├─────────────────────────────────────┤
│          Supabase Backend            │
│  Auth (JWT) + PostgreSQL DB          │
│  Row Level Security policies         │
│  Real-time subscriptions             │
├─────────────────────────────────────┤
│          External Services           │
│  HLS video hosting                   │
│  File storage (Supabase Storage)     │
│  Google Calendar API (future)        │
└─────────────────────────────────────┘
```

### Tech Stack
| Category | Current | Target |
|----------|---------|--------|
| **Framework** | React 19 | React 19 |
| **Language** | TypeScript 5.8 | TypeScript 5.8 |
| **Build** | Vite 6 | Vite 6 |
| **Styling** | Tailwind CSS 4 | Tailwind CSS 4 |
| **State** | React Query + useState | React Query + Zustand (optional) |
| **Routing** | React Router v7 (HashRouter) | React Router v7 |
| **Charts** | Recharts | Recharts |
| **PDF** | jsPDF + jspdf-autotable | Same |
| **Messaging** | localStorage polling | Supabase Realtime |
| **Backend** | None | Supabase |
| **Video** | hls.js | hls.js |
| **Auth** | Mock (localStorage) | Supabase Auth (JWT) |

---

## 11. Data Models (Key Entities)

| Entity | Storage Key | Fields |
|--------|-------------|--------|
| **User** | `mentorino_auth_user` / `mentorino_mock_users` | id, email, name, role, password, profile |
| **Application** | `mentorino_applications` | id, user_email, status, goal, focus_area, program_id |
| **StudentProfile** | `mentorino_students` | user_id, name, healthStatus, metrics, tags |
| **Session** | `mentorino_sessions` | id, mentorId, studentId, startTime, endTime, attendanceStatus |
| **Booking** | `mock_bookings_v2` | id, user_id, date, time, status, meeting_link |
| **Goal** | `mentorino_goals` (via goalStorage) | id, studentId, title, milestones, progressPercentage, status |
| **Task** | `mentorino_tasks` (via taskStorage) | id, studentId, mentorId, title, dueDate, status |
| **Journal** | `mentorino_journals` (via journalStorage) | id, studentId, type, mood, wins, challenges |
| **NetworkEvent** | `mentorino_events` | id, title, date, location, capacity, attendees, files |
| **Program** | `mentorino_programs` | id, title, description, duration, status, modules |
| **Curriculum** | Hardcoded in curriculumService | Module[] → Lesson[] → Topic/Quiz/Assignment |
| **Conversation** | `whatsapp_conversations_v4` | id, participants, lastMessage, unreadCount |
| **Message** | `whatsapp_messages_v4` | id, senderId, conversationId, content, type, timestamp |
| **Transaction** | `mentorino_transactions` | id, user_name, amount, date, product, status |
| **Product** | `mentorino_products` | id, name, price, category, salesCount, status |

---

## 12. Current Implementation Status

| Feature | Status | Notes |
|---------|--------|-------|
| Landing page | ✅ Complete | ~1000 lines, 8 sections |
| Auth (mock) | ✅ Complete | localStorage-based, 6 mock users |
| Application pipeline | ✅ Complete | 4-step form, approval auto-creates user |
| Student dashboard | ✅ Complete | 850 lines, monolithic |
| Mentor dashboard | ✅ Complete | 5721 lines, most complex file |
| Messaging | ✅ Complete | 1381 lines, full WhatsApp-style |
| Scheduler | ✅ Complete | 2727 lines, multi-view calendar |
| Event management | ✅ Complete | CRUD + registrations + files |
| Program viewer | ✅ Complete | HLS video + quizzes |
| Goals + tasks | ✅ Complete | CRUD with assignment workflow |
| Journal | ✅ Complete | Daily/weekly with mentor feedback |
| Analytics (revenue) | ✅ Complete | Charts + PDF/Excel export |
| Gallery | ✅ Complete | CRUD with category filter |
| AI insights | ⚠️ Stub | Returns dummy responses |
| Store | ⚠️ Mock | Products without real payments |
| Custom forms | ⚠️ Basic | Template + submission CRUD |
| Google Calendar sync | ❌ Not implemented | Types exist, no integration |
| Real-time messaging | ❌ Not implemented | localStorage polling only |
| Supabase backend | ❌ Not implemented | Env vars declared, no integration |
| Testing | ❌ Not implemented | No test files |

---

## 13. Constraints

| # | Constraint | Impact |
|---|------------|--------|
| 1 | 100% client-side (no backend server) | All data in localStorage (~5MB limit) |
| 2 | Mock auth (no real security) | Not production-ready |
| 3 | No real-time WebSocket | Messaging uses localStorage polling |
| 4 | Single mentor architecture | Cannot scale to multi-mentor |
| 5 | localStorage size limits (~5MB) | Media/file storage constrained |

---

## 14. Future Scope (Post-v1)

| Feature | Priority | Notes |
|---------|----------|-------|
| Supabase backend migration | P0 | Core infrastructure |
| Real-time messaging via WebSockets | P0 | Supabase Realtime |
| JWT-based authentication | P0 | Supabase Auth |
| File/media storage (Supabase Storage) | P1 | Replace data URLs |
| Multi-mentor support | P1 | RBAC expansion |
| Google Calendar sync | P2 | Two-way sync |
| Real payment integration (Stripe) | P2 | For store + consultations |
| AI-powered insights (Gemini API) | P2 | Replace stubs |
| Native mobile apps | P3 | React Native |
| Video/audio calls (WebRTC) | P3 | Replace external links |

---

## 15. Glossary

| Term | Definition |
|------|------------|
| **Health Status** | Computed metric: `active` / `needs_attention` / `at_risk` based on attendance, goal completion, activity |
| **Growth Audit** | Multi-section form tracking PB cards, LinkedIn, resume, roadmap, networking, certifications |
| **Synapse Section** | Video background section on landing page using HLS |
| **The Vault** | Store section for purchasing programs/services |
| **ActionItem** | Interface for tasks (bidirectional mapping with TaskActivity) |
