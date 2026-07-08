# Student Portal Testing Specification

| Document ID | QA-STU-002 |
|---|---|
| Document Title | Student Portal Testing Specification |
| Version | 2.0 |
| Status | Draft |
| Author | QA Team |
| Date | 2026-07-08 |

---

## Revision History

| Version | Date | Author | Description |
|---------|------|--------|-------------|
| 1.0 | 2026-06-15 | QA Team | Initial draft |
| 2.0 | 2026-07-08 | QA Team | Customized for Vite + React 19 + HashRouter + Supabase SDK |

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [Scope](#2-scope)
3. [Architecture Notes](#3-architecture-notes)
4. [Test Data](#4-test-data)
5. [Feature Modules](#5-feature-modules)
6. [Test Cases](#6-test-cases)
7. [Automation Mapping](#7-automation-mapping)

---

## 1. Introduction

This document specifies testing for the **Student Portal** of Mentorino. The student portal is accessible by users with the `student` role. All routes are under `/#/student/*` using HashRouter. Data access is performed via the Supabase JavaScript SDK (`supabase.from('table').*()`) with TanStack React Query for caching and state management.

---

## 2. Scope

| Module | Route | Key Features |
|--------|-------|-------------|
| Dashboard (Overview) | `/#/student` | Stats cards, trajectory, events, files widget |
| Programs | `/#/student/programs` | Enrolled programs, program catalog, program detail view |
| Journal | `/#/student/journal` | Daily/weekly entries, mentor feedback |
| Goals | `/#/student/goals` | CRUD goals, progress tracking |
| Tasks | `/#/student/tasks` | Assigned tasks, submission, feedback |
| Reviews | `/#/student/reviews` | Session reviews, feedback |
| Forms | `/#/student/forms` | Growth form, custom form submissions |
| Sessions | `/#/student/sessions` | View scheduled sessions, attendance |
| Messages | `/#/student/messages` | WhatsApp-style messaging with mentor |
| Resources | `/#/student/resources` | Access assigned resources |
| Events | `/#/student/events` | Event list, registration, calendar |
| Profile | `/#/student/profile` | Edit profile, avatar upload |
| Shared Files | `/#/student/files` | Uploaded/shared document view |
| Settings | `/#/settings` | Preferences, notifications (shared) |

---

## 3. Architecture Notes

| Aspect | Implementation |
|--------|---------------|
| **Auth** | `supabase.auth.signInWithPassword()` — session managed by Supabase client |
| **Data Layer** | Custom hooks with TanStack Query (`useGoals`, `useTasks`, `useSessions`, etc.) calling Supabase SDK directly |
| **Caching** | TanStack Query with stale times; cache invalidation on mutations |
| **Realtime** | `useRealtime` hook subscribes to Supabase Realtime channels (2s debounced invalidation) |
| **State** | Local component state + URL query params (no Zustand for student) |
| **Routing** | HashRouter with nested `<Routes>` inside `UserDashboard` |
| **Navigation** | Sidebar with links to each student module |

### Student Portal Data Flow

```
UserDashboard Component
  ├── Sidebar (NavLinks)
  └── <Routes>
       ├── Overview → individual hooks (useSessions, useGoals, useTasks, useEvents)
       ├── Programs → usePrograms → supabase.from('program_enrollments').select(*)
       ├── Goals → useGoals → supabase.from('goals').select(*).eq('student_id', user.id)
       ├── Tasks → useTasks → supabase.from('tasks').select(*).eq('student_id', user.id)
       ├── Sessions → useSessions → supabase.from('sessions').select(*).eq('student_id', user.id)
       ├── Messages → useMessaging → supabase.from('messages').select(*)
       └── ... etc
```

---

## 4. Test Data

| Role | Email | Data |
|------|-------|------|
| Student1 | `student1.qa@mentorino.test` | PM mentee, 3 goals, 3 tasks, 2 sessions, conversations |
| Student2 | `student2.qa@mentorino.test` | Cybersecurity mentee, 3 goals, 2 tasks, 2 sessions |

---

## 5. Feature Modules

### Module 5.1: Dashboard Overview (`/#/student`)

| Feature ID | Feature | Priority |
|------------|---------|----------|
| STU-F01 | Dashboard Page Load | Critical |
| STU-F02 | Overview Stats Cards | High |
| STU-F03 | Trajectory / Learning Progress | High |
| STU-F04 | Upcoming Events Widget | Medium |
| STU-F05 | Files Widget | Medium |

### Module 5.2: Programs (`/#/student/programs`)

| Feature ID | Feature | Priority |
|------------|---------|----------|
| STU-F06 | Enrolled Programs List | High |
| STU-F07 | Program Catalog Browse | Medium |
| STU-F08 | Program Detail View | High |
| STU-F09 | Program Progress Tracking | High |

### Module 5.3: Goals (`/#/student/goals`)

| Feature ID | Feature | Priority |
|------------|---------|----------|
| STU-F10 | Goals List | Critical |
| STU-F11 | Create Goal | High |
| STU-F12 | Edit Goal | High |
| STU-F13 | Delete Goal | Medium |
| STU-F14 | Progress Tracking | High |

### Module 5.4: Tasks (`/#/student/tasks`)

| Feature ID | Feature | Priority |
|------------|---------|----------|
| STU-F15 | Tasks List | Critical |
| STU-F16 | Task Details | High |
| STU-F17 | Task Submission | High |
| STU-F18 | Task Feedback View | Medium |

### Module 5.5: Journal (`/#/student/journal`)

| Feature ID | Feature | Priority |
|------------|---------|----------|
| STU-F19 | Journal Entries List | High |
| STU-F20 | Create Journal Entry | High |
| STU-F21 | Mentor Feedback on Journal | Medium |

### Module 5.6: Sessions (`/#/student/sessions`)

| Feature ID | Feature | Priority |
|------------|---------|----------|
| STU-F22 | Sessions List | High |
| STU-F23 | Session Details | High |
| STU-F24 | Session Attendance | Medium |

### Module 5.7: Messages (`/#/student/messages`)

| Feature ID | Feature | Priority |
|------------|---------|----------|
| STU-F25 | Conversation List | Critical |
| STU-F26 | Send Message | Critical |
| STU-F27 | Receive Message (Realtime) | Critical |
| STU-F28 | Message Read Status | High |
| STU-F29 | Voice Messages | Low |

### Module 5.8: Resources (`/#/student/resources`)

| Feature ID | Feature | Priority |
|------------|---------|----------|
| STU-F30 | Resources List | High |
| STU-F31 | Resource View/Download | High |
| STU-F32 | Resource Completion | Medium |

### Module 5.9: Events (`/#/student/events`)

| Feature ID | Feature | Priority |
|------------|---------|----------|
| STU-F33 | Events List | Medium |
| STU-F34 | Event Registration | High |
| STU-F35 | Event Calendar View | Medium |

### Module 5.10: Profile (`/#/student/profile`)

| Feature ID | Feature | Priority |
|------------|---------|----------|
| STU-F36 | Profile View | High |
| STU-F37 | Edit Profile | High |
| STU-F38 | Avatar Upload | Medium |

### Module 5.11: Forms (`/#/student/forms`)

| Feature ID | Feature | Priority |
|------------|---------|----------|
| STU-F39 | Growth Form | Medium |
| STU-F40 | Custom Form Submissions | Medium |

### Module 5.12: Reviews (`/#/student/reviews`)

| Feature ID | Feature | Priority |
|------------|---------|----------|
| STU-F41 | Reviews List | Medium |
| STU-F42 | Submit Review | Medium |

### Module 5.13: Shared Files (`/#/student/files`)

| Feature ID | Feature | Priority |
|------------|---------|----------|
| STU-F43 | Shared Files List | Low |
| STU-F44 | File Upload | Low |
| STU-F45 | File Download | Low |

### Module 5.14: Settings (`/#/settings`)

| Feature ID | Feature | Priority |
|------------|---------|----------|
| STU-F46 | Settings Page | High |
| STU-F47 | Notification Preferences | Medium |
| STU-F48 | Account Settings | High |

---

## 6. Test Cases

### Module 5.1: Dashboard Overview

#### STU-TC-001: Student Dashboard Load

| Field | Value |
|-------|-------|
| **Test ID** | STU-TC-001 |
| **Module** | Dashboard |
| **Feature** | Page Load |
| **Priority** | Critical |
| **Severity** | Blocker |
| **Test Type** | Functional / Integration |
| **Test Data** | Student1 authenticated |
| **Preconditions** | Login as student1.qa@mentorino.test |

**Objective**: Verify student dashboard loads all sections correctly.

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Login as student1 | Redirected to `/#/student/dashboard` |
| 2 | Observe sidebar | Student sidebar renders with nav items: Overview, Programs, Journal, Goals, Tasks, Reviews, Forms, Sessions, Messages, Resources, Events, Profile |
| 3 | Observe overview cards | Stats cards: sessions, goals, tasks, events loaded |
| 4 | Observe trajectory section | Learning trajectory/progress indicator visible |
| 5 | Observe events widget | Upcoming events displayed (if any) |
| 6 | Observe shared files widget | Recent files displayed (if any) |

**Validation**:
- **Navigation**: URL is `/#/student` (or `/#/student/dashboard`)
- **UI**: All dashboard sections render
- **TanStack Query**: Multiple queries fired — `['goals']`, `['tasks']`, `['sessions']`, `['events']`, `['student_progress']`
- **Console**: No errors from parallel query fetching

**Automation**: `e2e/student-flow.spec.ts`, `e2e/student/student-journey.spec.ts`

---

#### STU-TC-002: Dashboard Stats Cards Data Accuracy

| Field | Value |
|-------|-------|
| **Test ID** | STU-TC-002 |
| **Module** | Dashboard |
| **Feature** | Stats Cards |
| **Priority** | High |
| **Severity** | Major |
| **Test Type** | Integration |
| **Test Data** | Student1 has 3 goals, 3 tasks, 2 sessions |
| **Preconditions** | Student1 logged in, dashboard loaded |

**Objective**: Verify stats cards reflect actual database counts.

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Observe Goals card | Shows count matching `supabase.from('goals').select('*', {count: 'exact', head: true}).eq('student_id', user.id)` |
| 2 | Observe Tasks card | Shows count matching tasks query |
| 3 | Observe Sessions card | Shows count matching sessions query |
| 4 | Observe Events card | Shows count matching events query |

**Validation**:
- **Supabase**: Each count matches actual row count in respective tables
- **TanStack Query**: Query cache contains correct counts

---

### Module 5.3: Goals

#### STU-TC-003: Create Goal

| Field | Value |
|-------|-------|
| **Test ID** | STU-TC-003 |
| **Module** | Goals |
| **Feature** | Create Goal |
| **Priority** | High |
| **Severity** | Major |
| **Test Type** | Functional / Integration |
| **Test Data** | Title: "Complete certification", Description: "Finish by Q3", Status: "in_progress" |
| **Preconditions** | Student1 logged in, on `/#/student/goals` |

**Objective**: Verify student can create a new goal.

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Navigate to `/#/student/goals` | Goals list page renders |
| 2 | Click "Add Goal" or create button | Goal creation form/modal opens |
| 3 | Enter title | Title field accepts input |
| 4 | Enter description | Description field accepts input |
| 5 | Select status (Not Started / In Progress / Completed) | Status dropdown works |
| 6 | Click Save/Submit | Loading state, `goalStorage.create()` called → `supabase.from('goals').insert({...})` |
| 7 | Verify goal appears in list | New goal visible in goals list |

**Validation**:
- **Supabase**: New row in `goals` table with correct `student_id`, title, description
- **UI**: Goal card appears in list with correct data, success toast via Sonner
- **TanStack Query**: `['goals']` query key invalidated and refetched
- **Navigation**: Stays on `/#/student/goals`

**Automation**: `e2e/student-flow.spec.ts`, `e2e/student/student-journey.spec.ts`

---

#### STU-TC-004: Edit Goal

| Field | Value |
|-------|-------|
| **Test ID** | STU-TC-004 |
| **Module** | Goals |
| **Feature** | Edit Goal |
| **Priority** | High |
| **Severity** | Major |
| **Test Type** | Functional |
| **Test Data** | Existing goal updated with new title and description |
| **Preconditions** | Student1 logged in, at least one goal exists |

**Objective**: Verify student can edit an existing goal.

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Navigate to `/#/student/goals` | Goals list visible |
| 2 | Click edit on a goal | Edit form/modal with pre-populated data |
| 3 | Modify title and description | Fields update |
| 4 | Change status | Status updates |
| 5 | Click Save | `goalStorage.update()` → `supabase.from('goals').update({...}).eq('id', goalId)` |
| 6 | Verify changes reflected | Updated data visible in list |

**Validation**:
- **Supabase**: Row updated in `goals` table
- **TanStack Query**: Cache invalidated, refetched
- **UI**: Updated values displayed in goal card

---

#### STU-TC-005: Delete Goal

| Field | Value |
|-------|-------|
| **Test ID** | STU-TC-005 |
| **Module** | Goals |
| **Feature** | Delete Goal |
| **Priority** | Medium |
| **Severity** | Major |
| **Test Type** | Functional |
| **Test Data** | Existing goal to delete |
| **Preconditions** | Student1 logged in, at least one goal exists |

**Objective**: Verify student can delete a goal.

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Navigate to `/#/student/goals` | Goals list visible |
| 2 | Click delete on a goal | Confirmation dialog: "Are you sure?" |
| 3 | Cancel deletion | No change, goal remains |
| 4 | Click delete again, confirm | `goalStorage.delete()` → `supabase.from('goals').delete().eq('id', goalId)` |
| 5 | Verify goal removed | Goal no longer in list |

**Validation**:
- **Supabase**: Row deleted from `goals` table
- **UI**: Goal removed from list, success toast
- **Edge Case**: Deleting last goal shows empty state

---

### Module 5.4: Tasks

#### STU-TC-006: Task List View

| Field | Value |
|-------|-------|
| **Test ID** | STU-TC-006 |
| **Module** | Tasks |
| **Feature** | Tasks List |
| **Priority** | Critical |
| **Severity** | Major |
| **Test Type** | Functional |
| **Test Data** | Student1 has 3 tasks assigned by mentor |
| **Preconditions** | Student1 logged in, on `/#/student/tasks` |

**Objective**: Verify tasks list displays all assigned tasks.

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Navigate to `/#/student/tasks` | Tasks page renders |
| 2 | Observe task cards | Tasks fetched via `useTasks` → `supabase.from('tasks').select('*').eq('student_id', user.id)` |
| 3 | Verify task data | Each card shows: title, description, due date, status, priority |
| 4 | Check status labels | Status values: pending, in_progress, submitted, completed |

**Validation**:
- **Supabase**: Tasks returned from `tasks` table filtered by student_id
- **TanStack Query**: `['tasks']` query key with student filter cached

---

#### STU-TC-007: Submit Task

| Field | Value |
|-------|-------|
| **Test ID** | STU-TC-007 |
| **Module** | Tasks |
| **Feature** | Task Submission |
| **Priority** | High |
| **Severity** | Major |
| **Test Type** | Functional |
| **Test Data** | Task with submission_text or file attachment |
| **Preconditions** | Student1 logged in, task in "in_progress" status |

**Objective**: Verify student can submit a task.

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Navigate to `/#/student/tasks` | Tasks list |
| 2 | Click on a task in progress | Task detail view |
| 3 | Click "Submit" or add submission | Submission form/textarea opens |
| 4 | Enter submission text | Text accepted |
| 5 | (Optional) Attach file | File upload via `supabase.storage.from('shared-files').upload()` |
| 6 | Click Submit | `taskStorage.updateStatus()` → status changes to "submitted" |
| 7 | Verify status update | Task shows "submitted" status |

---

### Module 5.5: Journal

#### STU-TC-008: Create Journal Entry

| Field | Value |
|-------|-------|
| **Test ID** | STU-TC-008 |
| **Module** | Journal |
| **Feature** | Create Journal Entry |
| **Priority** | High |
| **Severity** | Major |
| **Test Type** | Functional |
| **Test Data** | Entry type: daily, content, mood, wins, challenges |
| **Preconditions** | Student1 logged in, on `/#/student/journal` |

**Objective**: Verify student can create a journal entry.

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Navigate to `/#/student/journal` | Journal page renders with entry list |
| 2 | Click "New Entry" | Entry creation form opens |
| 3 | Select entry type (Daily / Weekly) | Type dropdown updates form fields |
| 4 | Enter content | Rich text or textarea accepts content |
| 5 | Enter mood | Mood selector works (emoji or scale) |
| 6 | Enter wins and challenges | Optional fields accept text |
| 7 | Click Save | `journalStorage.create()` → `supabase.from('journals').insert({...})` |
| 8 | Verify entry in list | New journal entry appears |

---

### Module 5.7: Messages

#### STU-TC-009: Send Message

| Field | Value |
|-------|-------|
| **Test ID** | STU-TC-009 |
| **Module** | Messaging |
| **Feature** | Send Message |
| **Priority** | Critical |
| **Severity** | Blocker |
| **Test Type** | Functional / Integration |
| **Test Data** | Message text: "Hello mentor, I have a question about my goals" |
| **Preconditions** | Student1 logged in, has existing conversation with mentor, on `/#/student/messages` |

**Objective**: Verify student can send a message to their mentor.

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Navigate to `/#/student/messages` | Messaging UI loads — conversation list + active thread |
| 2 | Select conversation with mentor | Thread loads with message history |
| 3 | Type message in compose bar | Text appears in input |
| 4 | Click Send button (or Enter) | Message sent via `useMessaging.sendMessage()` → `supabase.from('messages').insert({...})` |
| 5 | Observe message appear | Message appears in thread immediately (optimistic update) |
| 6 | Verify sent status | Message shows "sent" status |

**Validation**:
- **Supabase**: New row in `messages` table with correct `conversation_id`, `sender_id`, `content`
- **UI**: Message bubble appears in thread, aligned right for sent messages
- **TanStack Query**: `['messages', conversationId]` updated optimistically, then invalidated
- **Realtime**: Mentor receives real-time update (2s debounce)

**Automation**: `e2e/student-flow.spec.ts`, `e2e/student/student-journey.spec.ts`

---

#### STU-TC-010: Receive Message in Real-Time

| Field | Value |
|-------|-------|
| **Test ID** | STU-TC-010 |
| **Module** | Messaging |
| **Feature** | Receive Message |
| **Priority** | Critical |
| **Severity** | Critical |
| **Test Type** | Integration / Realtime |
| **Test Data** | Message sent by mentor to student1 |
| **Preconditions** | Student1 logged in, on `/#/student/messages`, conversation with mentor active |

**Objective**: Verify student receives mentor messages via Realtime subscription.

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Have mentor send a message to student1 | (Requires simultaneous mentor session or DB insert) |
| 2 | Wait for Realtime subscription to fire | `useRealtime` hook receives `postgres_changes` event |
| 3 | Observe thread | New message appears in thread within 2-3 seconds |
| 4 | Verify message content | Correct sender, content, timestamp |

**Validation**:
- **Supabase Realtime**: Channel receives `INSERT` on `messages` table
- **TanStack Query**: Debounced invalidation fires after 2s, refetches messages
- **UI**: New message bubble appears

**Note**: `e2e/realtime.spec.ts` is currently ALL SKIPPED — these tests need unskipping for coverage.

---

### Module 5.10: Profile

#### STU-TC-011: Edit Profile

| Field | Value |
|-------|-------|
| **Test ID** | STU-TC-011 |
| **Module** | Profile |
| **Feature** | Edit Profile |
| **Priority** | High |
| **Severity** | Major |
| **Test Type** | Functional |
| **Test Data** | Updated name, bio, phone |
| **Preconditions** | Student1 logged in, on `/#/student/profile` |

**Objective**: Verify student can edit their profile.

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Navigate to `/#/student/profile` | Profile page renders with current data |
| 2 | Click "Edit" | Edit form with pre-populated fields |
| 3 | Update name, bio, phone | Fields accept new values |
| 4 | Click Save | `profileService.updateProfile()` → `supabase.from('profiles').update({...}).eq('id', user.id)` |
| 5 | Verify changes | Profile displays updated data |

---

#### STU-TC-012: Avatar Upload

| Field | Value |
|-------|-------|
| **Test ID** | STU-TC-012 |
| **Module** | Profile |
| **Feature** | Avatar Upload |
| **Priority** | Medium |
| **Severity** | Major |
| **Test Type** | Functional |
| **Test Data** | Image file (JPEG/PNG, < 5MB) |
| **Preconditions** | Student1 logged in, on `/#/student/profile` |

**Objective**: Verify student can upload a profile avatar.

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Navigate to `/#/student/profile` | Profile page |
| 2 | Click avatar upload area | File picker opens |
| 3 | Select image file | Client-side compression via `imageCompression` utility |
| 4 | Wait for upload | `supabase.storage.from('profile-avatars').upload()` |
| 5 | Verify new avatar | Avatar updates in UI, profile shows new image |

**Validation**:
- **Supabase Storage**: File stored in `profile-avatars` bucket
- **UI**: New avatar displayed, success toast
- **Event**: `user-avatar-changed` custom event fired

---

### Module 5.14: Settings

#### STU-TC-013: Settings Page — Notification Preferences

| Field | Value |
|-------|-------|
| **Test ID** | STU-TC-013 |
| **Module** | Settings |
| **Feature** | Notification Preferences |
| **Priority** | High |
| **Severity** | Major |
| **Test Type** | Functional |
| **Test Data** | Toggle notification settings |
| **Preconditions** | Student1 logged in, on `/#/settings` |

**Objective**: Verify student can update notification preferences.

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Navigate to `/#/settings` | Settings page renders with sections |
| 2 | Find notification preferences | Toggle switches for different notification types |
| 3 | Toggle a setting off | Setting saved, preference updated in DB |
| 4 | Toggle setting back on | Preference restored |

---

### Cross-Cutting Security

#### STU-TC-014: Student Cannot Access Mentor Routes

| Field | Value |
|-------|-------|
| **Test ID** | STU-TC-014 |
| **Module** | Security |
| **Feature** | Route Protection |
| **Priority** | Critical |
| **Severity** | Critical |
| **Test Type** | Security |
| **Test Data** | Student1 authenticated |
| **Preconditions** | Student1 logged in |

**Objective**: Verify student cannot access mentor-only routes.

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Navigate to `/#/mentor` | Redirected to `/#/auth` or 403/404 |
| 2 | Navigate to `/#/mentor?tab=applications` | Redirected or blocked |
| 3 | Navigate to `/#/admin/revenue` | Redirected or blocked |

**Automation**: `e2e/security/cross-role.spec.ts`

---

## 7. Automation Mapping

### Existing Playwright Coverage

| Test Cases | Spec File | Current Status |
|-----------|-----------|---------------|
| STU-TC-001, STU-TC-002 | `e2e/student-flow.spec.ts`, `e2e/student/student-journey.spec.ts` | ✅ Existing |
| STU-TC-003, STU-TC-004, STU-TC-005 | `e2e/student-flow.spec.ts` (goals section) | ✅ Existing |
| STU-TC-006, STU-TC-007 | `e2e/student/student-journey.spec.ts` (tasks section) | ✅ Existing |
| STU-TC-008 | `e2e/student/student-journey.spec.ts` (journal section) | ✅ Existing |
| STU-TC-009 | `e2e/student-flow.spec.ts` (messaging section) | ✅ Existing |
| STU-TC-010 | `e2e/realtime.spec.ts` | ⚠️ ALL SKIPPED |
| STU-TC-011, STU-TC-012 | `e2e/student-flow.spec.ts` (profile section) | ✅ Existing |
| STU-TC-013 | Not automated | ❌ Missing |
| STU-TC-014 | `e2e/security/cross-role.spec.ts` | ✅ Existing |

### Playwright Project Assignment

| Tests | Project |
|-------|---------|
| All STU-TC | chromium-student1 |
| STU-TC-014 | chromium-student1 (security) |
| Smoke subset | chromium, firefox, webkit, mobile-chrome, mobile-safari |
