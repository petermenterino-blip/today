# Mentor Dashboard Testing Specification

| Document ID | QA-MNT-003 |
|---|---|
| Document Title | Mentor Dashboard Testing Specification |
| Version | 2.0 |
| Status | Draft |
| Author | QA Team |
| Date | 2026-07-08 |

---

## Revision History

| Version | Date | Author | Description |
|---------|------|--------|-------------|
| 1.0 | 2026-06-15 | QA Team | Initial draft |
| 2.0 | 2026-07-08 | QA Team | Customized for Vite + React 19 + HashRouter + Supabase SDK + tab-based navigation |

---

## 1. Introduction

This document specifies testing for the **Mentor Dashboard** — the primary workspace for mentor users. The mentor dashboard uses a **tab-based navigation** pattern via URL query parameters (`/#/mentor?tab=<tabname>`). All data is fetched directly from Supabase via custom hooks and TanStack Query.

### Architecture

- **Main Component**: `MentorDashboard` — renders tab content based on `?tab=` query param
- **Tab Routing**: `/#/mentor` (default → overview) → `/#/mentor?tab=applications` → etc.
- **State**: `useOverviewStore` (Zustand) for mentor overview state
- **Data**: Individual hooks per tab — `useApplications`, `useMentees`, `useAIAssistant`, `useAnalyticsBI`, `useEventManager`, `useApplicationReview`, `useFeedback`, `useProgramManager`, `useOverviewStore`
- **UI**: Shadcn/ui components, Recharts for analytics, motion for animations

---

## 2. Scope

| Tab | Route | Key Features |
|-----|-------|-------------|
| Overview | `/#/mentor` | 20+ widgets: stats, calendar, activity, AI summary |
| Applications | `/#/mentor?tab=applications` | Review, approve, reject, request info |
| Mentees | `/#/mentor?tab=mentees` | Student profiles, health status, tags |
| Messaging | `/#/mentor?tab=messaging` | WhatsApp-style chat with students |
| Sessions | `/#/mentor?tab=sessions` | Schedule, manage, attendance tracking |
| Programs | `/#/mentor?tab=programs` | Program progress tracking |
| Program Progress | `/#/mentor?tab=program-progress` | Student progress per program |
| Feedback | `/#/mentor?tab=feedback` | Reviews + Tasks management |
| Resources | `/#/mentor?tab=resources` | Upload, assign, categorize resources |
| Events | `/#/mentor?tab=events` | Create/manage events |
| Analytics | `/#/mentor?tab=analytics` | BI dashboard (Recharts) |
| AI | `/#/mentor?tab=ai` | Gemini AI-powered insights |
| Gallery | `/#/mentor?tab=gallery` | Image gallery management |
| Bookings | `/#/mentor?tab=bookings` | Visitor booking management |
| Emails | `/#/mentor?tab=emails` | Email templates and sending |
| Growth Audit | `/#/mentor?tab=growth-audit` | Student growth audit forms |
| Financials | `/#/admin/revenue` | Revenue dashboard |
| Settings | `/#/settings` | Preferences |

---

## 3. Test Data

| Role | Email | Data |
|------|-------|------|
| Mentor | `mentor.qa@mentorino.test` | Manages 2 students, applications, tasks, sessions |

---

## 4. Feature Modules & Test Cases

---

### Module 4.1: Overview Tab

#### MNT-TC-001: Overview Tab Load

| Field | Value |
|-------|-------|
| **Test ID** | MNT-TC-001 |
| **Module** | Overview |
| **Feature** | Dashboard Load |
| **Priority** | Critical |
| **Severity** | Blocker |
| **Test Type** | Functional / Integration |
| **Test Data** | Mentor authenticated |
| **Preconditions** | Login as mentor.qa@mentorino.test |

**Objective**: Verify mentor overview tab loads all widgets.

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Login as mentor | Redirected to `/#/mentor` |
| 2 | Observe navigation tabs | Tab bar visible: Overview, Applications, Mentees, Messaging, Sessions, Programs, Feedback, Resources, Events, Analytics, AI, Gallery, Bookings, Emails |
| 3 | Observe Overview workspace | 20+ widgets: stats cards, calendar, activity feed, AI summary, student list |
| 4 | Verify data loaded | Stats show correct counts from Supabase |

**Validation**:
- **Navigation**: URL is `/#/mentor`
- **UI**: All widgets render without layout issues
- **TanStack Query**: Dashboard queries fired for stats, calendar, activity
- **Zustand**: `useOverviewStore.getState()` contains fetched stats

**Automation**: `e2e/mentor-flow.spec.ts`, `e2e/mentor/mentor-journey.spec.ts`

---

#### MNT-TC-002: Overview Tab Navigation

| Field | Value |
|-------|-------|
| **Test ID** | MNT-TC-002 |
| **Module** | Overview |
| **Feature** | Tab Navigation |
| **Priority** | Critical |
| **Severity** | Major |
| **Test Type** | Functional |
| **Test Data** | Mentor authenticated |
| **Preconditions** | Login as mentor, on `/#/mentor` |

**Objective**: Verify all tab navigations update URL and render correct content.

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Click "Applications" tab | URL: `/#/mentor?tab=applications`, Applications tab renders |
| 2 | Click "Mentees" tab | URL: `/#/mentor?tab=mentees`, Mentees tab renders |
| 3 | Click "Messaging" tab | URL: `/#/mentor?tab=messaging`, Messaging renders |
| 4 | Click "Sessions" tab | URL: `/#/mentor?tab=sessions`, Sessions renders |
| 5 | Click "Programs" tab | URL: `/#/mentor?tab=programs`, Programs renders |
| 6 | Click "Feedback" tab | URL: `/#/mentor?tab=feedback`, Reviews + Tasks renders |
| 7 | Click "Resources" tab | URL: `/#/mentor?tab=resources`, Resources renders |
| 8 | Click "Events" tab | URL: `/#/mentor?tab=events`, Events renders |
| 9 | Click "Analytics" tab | URL: `/#/mentor?tab=analytics`, Analytics renders |
| 10 | Click "AI" tab | URL: `/#/mentor?tab=ai`, AI Dashboard renders |
| 11 | Click "Gallery" tab | URL: `/#/mentor?tab=gallery`, Gallery renders |
| 12 | Click "Bookings" tab | URL: `/#/mentor?tab=bookings`, Bookings renders |
| 13 | Click "Emails" tab | URL: `/#/mentor?tab=emails`, Emails renders |

---

### Module 4.2: Applications Tab

#### MNT-TC-003: Applications List

| Field | Value |
|-------|-------|
| **Test ID** | MNT-TC-003 |
| **Module** | Applications |
| **Feature** | Applications List |
| **Priority** | Critical |
| **Severity** | Blocker |
| **Test Type** | Functional |
| **Test Data** | Mentor has pending applications |
| **Preconditions** | Login as mentor, navigate to `/#/mentor?tab=applications` |

**Objective**: Verify mentor can view all applications.

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Navigate to `/#/mentor?tab=applications` | Applications table/list renders |
| 2 | Observe columns | Applicant name, email, program, status, date |
| 3 | Check status filter | Filter for pending/approved/rejected works |
| 4 | Click on an application | Application detail view opens (drawer or modal) |

**Validation**:
- **Supabase**: `applications` table queried via `useApplications` hook
- **TanStack Query**: `['applications']` query key cached

---

#### MNT-TC-004: Approve Application (Edge Function)

| Field | Value |
|-------|-------|
| **Test ID** | MNT-TC-004 |
| **Module** | Applications |
| **Feature** | Application Approval |
| **Priority** | Critical |
| **Severity** | Blocker |
| **Test Type** | Functional / Integration |
| **Test Data** | Pending application with valid ID |
| **Preconditions** | Mentor logged in, on application detail of a pending application |

**Objective**: Verify mentor can approve an application via Supabase Edge Function.

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Open pending application detail | Full application details visible |
| 2 | Click "Approve" button | Confirmation dialog: "Approve this application?" |
| 3 | Confirm approval | Loading state, `supabase.functions.invoke('approve-application', {body: {applicationId}})` called |
| 4 | Wait for response | Edge Function creates auth user + profile, returns success |
| 5 | Verify status change | Application status changes to "approved" or "invited" |
| 6 | Verify new student appears in Mentees tab | New student visible in mentee list |

**Validation**:
- **Edge Function**: `supabase.functions.invoke('approve-application')` returns `{success: true, studentId, email}`
- **Supabase**: `applications` table status updated, new row in `profiles` table
- **UI**: Success toast, status badge updated
- **TanStack Query**: `['applications']` and `['mentees']` invalidated

**Automation**: `e2e/mentor-flow.spec.ts` (application approval section)

---

#### MNT-TC-005: Reject Application

| Field | Value |
|-------|-------|
| **Test ID** | MNT-TC-005 |
| **Module** | Applications |
| **Feature** | Application Rejection |
| **Priority** | High |
| **Severity** | Major |
| **Test Type** | Functional |
| **Test Data** | Pending application |
| **Preconditions** | Mentor logged in, on pending application detail |

**Objective**: Verify mentor can reject an application.

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Open pending application detail | Full details |
| 2 | Click "Reject" | Confirmation dialog |
| 3 | (Optional) Enter rejection reason | Reason field accepts text |
| 4 | Confirm rejection | `supabase.from('applications').update({status: 'rejected'}).eq('id', id)` |
| 5 | Verify status | Status changes to "rejected" |

---

### Module 4.3: Messaging Tab

#### MNT-TC-006: Mentor Messaging — Send to Student

| Field | Value |
|-------|-------|
| **Test ID** | MNT-TC-006 |
| **Module** | Messaging |
| **Feature** | Send Message |
| **Priority** | Critical |
| **Severity** | Blocker |
| **Test Type** | Functional |
| **Test Data** | Message to Student1 |
| **Preconditions** | Mentor logged in, on `/#/mentor?tab=messaging` |

**Objective**: Verify mentor can send messages to students.

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Navigate to messaging tab | Conversation list loads with student conversations |
| 2 | Select a student conversation | Message thread loads |
| 3 | Type message in compose bar | Input accepts text |
| 4 | Click Send | `useMessaging.sendMessage()` → `supabase.from('messages').insert({...})` |
| 5 | Verify message sent | Message appears in thread |

**Automation**: `e2e/mentor-flow.spec.ts` (messaging section)

---

### Module 4.4: Sessions Tab

#### MNT-TC-007: Schedule Session

| Field | Value |
|-------|-------|
| **Test ID** | MNT-TC-007 |
| **Module** | Sessions |
| **Feature** | Schedule Session |
| **Priority** | High |
| **Severity** | Major |
| **Test Type** | Functional |
| **Test Data** | Student: Student1, Title: "Weekly Check-in", Duration: 60min |
| **Preconditions** | Mentor logged in, on `/#/mentor?tab=sessions` |

**Objective**: Verify mentor can schedule a session with a student.

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Navigate to sessions tab | Calendar grid + session list visible |
| 2 | Click "Schedule Session" or click on calendar slot | Session creation form/modal opens |
| 3 | Select student | Student dropdown populated from mentees |
| 4 | Enter title, date, time, duration | Fields accept input |
| 5 | Click "Create" | `sessionStorage.create()` → `supabase.from('sessions').insert({...})` |
| 6 | Verify session appears | Session visible in calendar and session list |

**Validation**:
- **Supabase**: New row in `sessions` table
- **UI**: Session card visible in calendar grid
- **TanStack Query**: `['sessions']` invalidated

---

### Module 4.5: AI Dashboard Tab

#### MNT-TC-008: AI Dashboard Load

| Field | Value |
|-------|-------|
| **Test ID** | MNT-TC-008 |
| **Module** | AI Dashboard |
| **Feature** | AI Insights |
| **Priority** | Medium |
| **Severity** | Major |
| **Test Type** | Functional |
| **Test Data** | Mentor with student data |
| **Preconditions** | Mentor logged in, on `/#/mentor?tab=ai` |

**Objective**: Verify AI Dashboard loads and displays Gemini-powered insights.

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Navigate to AI tab | AI Dashboard renders |
| 2 | Observe AI summary | Summary cards/text loaded from Gemini via `supabase.functions.invoke('gemini')` |
| 3 | Interact with AI chat | Chat input accepts questions, Gemini responds |
| 4 | Verify AI responses | Responses are relevant to student/mentor data |

**Validation**:
- **Edge Function**: `supabase.functions.invoke('gemini', {body: {prompt, context}})` returns response
- **UI**: AI chat messages render correctly
- **TanStack Query**: `['ai-insights']` query cached

---

### Module 4.6: Analytics Tab

#### MNT-TC-009: Analytics BI Dashboard

| Field | Value |
|-------|-------|
| **Test ID** | MNT-TC-009 |
| **Module** | Analytics |
| **Feature** | BI Dashboard |
| **Priority** | Medium |
| **Severity** | Major |
| **Test Type** | Functional / UI |
| **Test Data** | Mentor with sufficient data for charts |
| **Preconditions** | Mentor logged in, on `/#/mentor?tab=analytics` |

**Objective**: Verify Analytics BI dashboard renders Recharts correctly.

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Navigate to analytics tab | BI Dashboard renders |
| 2 | Observe charts | Recharts (bar, line, pie) rendered with data |
| 3 | Interact with filters | Date range/type filters update chart data |
| 4 | Verify data accuracy | Chart data matches Supabase aggregations |

---

### Module 4.7: Events Tab

#### MNT-TC-010: Create Event

| Field | Value |
|-------|-------|
| **Test ID** | MNT-TC-010 |
| **Module** | Events |
| **Feature** | Create Event |
| **Priority** | High |
| **Severity** | Major |
| **Test Type** | Functional |
| **Test Data** | Title: "Guest Speaker", Date: future date, Location: "Online" |
| **Preconditions** | Mentor logged in, on `/#/mentor?tab=events` |

**Objective**: Verify mentor can create a new event.

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Navigate to events tab | Event management page renders |
| 2 | Click "Create Event" | Event creation modal opens |
| 3 | Fill event details | Title, description, date, time, location, visibility |
| 4 | Click "Save" | `eventService.create()` → `supabase.from('events').insert({...})` |
| 5 | Verify event listed | New event appears in event list |

---

### Module 4.8: Resources Tab

#### MNT-TC-011: Upload Resource

| Field | Value |
|-------|-------|
| **Test ID** | MNT-TC-011 |
| **Module** | Resources |
| **Feature** | Upload Resource |
| **Priority** | High |
| **Severity** | Major |
| **Test Type** | Functional |
| **Test Data** | PDF file, title: "Study Guide" |
| **Preconditions** | Mentor logged in, on `/#/mentor?tab=resources` |

**Objective**: Verify mentor can upload and assign resources.

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Navigate to resources tab | Resource dashboard renders |
| 2 | Click "Upload" | Upload modal opens |
| 3 | Select file | File selected, metadata fields shown |
| 4 | Enter title, category | Fields accept input |
| 5 | Click "Upload" | File uploaded to `supabase.storage.from('resource-files')`, metadata to `resources` table |
| 6 | Verify resource listed | Resource appears in resource list |

---

### Module 4.9: Gallery Tab

#### MNT-TC-012: Gallery Management

| Field | Value |
|-------|-------|
| **Test ID** | MNT-TC-012 |
| **Module** | Gallery |
| **Feature** | Gallery Management |
| **Priority** | Medium |
| **Severity** | Major |
| **Test Type** | Functional |
| **Test Data** | Image file for gallery |
| **Preconditions** | Mentor logged in, on `/#/mentor?tab=gallery` |

**Objective**: Verify mentor can manage gallery images.

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Navigate to gallery tab | Gallery management renders |
| 2 | Click "Add Image" | Upload modal opens |
| 3 | Select image, add title/category | Fields accept input |
| 4 | Upload | `galleryService.create()` → `supabase.storage.from('gallery-images')` + `gallery` table |
| 5 | Verify image in gallery | Image thumbnail visible |
| 6 | Edit image details | Title, category updateable |
| 7 | Delete image | Image removed from gallery |

---

### Module 4.10: Bookings Tab

#### MNT-TC-013: Visitor Bookings Management

| Field | Value |
|-------|-------|
| **Test ID** | MNT-TC-013 |
| **Module** | Bookings |
| **Feature** | Visitor Bookings |
| **Priority** | High |
| **Severity** | Major |
| **Test Type** | Functional |
| **Test Data** | Existing visitor bookings |
| **Preconditions** | Mentor logged in, on `/#/mentor?tab=bookings` |

**Objective**: Verify mentor can view and manage visitor bookings.

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Navigate to bookings tab | Visitor bookings list/table renders |
| 2 | Observe booking details | Name, date, time, status columns |
| 3 | Click on booking | Booking detail drawer opens |
| 4 | Update booking status | Status change saved to `bookings` table |

---

### Module 4.11: Financials

#### MNT-TC-014: Revenue Dashboard

| Field | Value |
|-------|-------|
| **Test ID** | MNT-TC-014 |
| **Module** | Financials |
| **Feature** | Revenue Dashboard |
| **Priority** | Medium |
| **Severity** | Major |
| **Test Type** | Functional |
| **Test Data** | Mentor authenticated |
| **Preconditions** | Mentor logged in, navigate to `/#/admin/revenue` |

**Objective**: Verify revenue dashboard loads transaction data.

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Navigate to `/#/admin/revenue` | Revenue dashboard renders |
| 2 | Observe transaction table | Transactions from `transactions` table displayed |
| 3 | Observe revenue charts | Revenue charts rendered via Recharts |
| 4 | Verify data accuracy | Transaction amounts and dates match DB |

---

### Module 4.12: Growth Audit Tab

#### MNT-TC-015: Growth Audit

| Field | Value |
|-------|-------|
| **Test ID** | MNT-TC-015 |
| **Module** | Growth Audit |
| **Feature** | Student Growth Audit |
| **Priority** | Medium |
| **Severity** | Minor |
| **Test Type** | Functional |
| **Test Data** | Student with growth data |
| **Preconditions** | Mentor logged in, on `/#/mentor?tab=growth-audit` |

**Objective**: Verify growth audit tab renders student progress data.

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Navigate to growth audit tab | Growth audit view renders |
| 2 | Select a student | Student growth metrics displayed |
| 3 | Verify metrics | Progress, goals, sessions data aggregated |

---

### Module 4.13: Program Progress Tab

#### MNT-TC-016: Program Progress Tracking

| Field | Value |
|-------|-------|
| **Test ID** | MNT-TC-016 |
| **Module** | Programs |
| **Feature** | Program Progress |
| **Priority** | High |
| **Severity** | Major |
| **Test Type** | Functional |
| **Test Data** | Students enrolled in programs |
| **Preconditions** | Mentor logged in, on `/#/mentor?tab=program-progress` |

**Objective**: Verify program progress tracking shows correct data.

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Navigate to program progress tab | Progress dashboard renders |
| 2 | Observe student progress cards | Each student's progress in enrolled programs shown |
| 3 | Verify progress calculations | Progress % matches `studentProgressService.calculateProgramProgress()` |

---

### Module 4.14: Emails Tab

#### MNT-TC-017: Email Templates

| Field | Value |
|-------|-------|
| **Test ID** | MNT-TC-017 |
| **Module** | Emails |
| **Feature** | Email Templates |
| **Priority** | Medium |
| **Severity** | Minor |
| **Test Type** | Functional |
| **Test Data** | Existing email templates |
| **Preconditions** | Mentor logged in, on `/#/mentor?tab=emails` |

**Objective**: Verify email templates can be viewed and managed.

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Navigate to emails tab | Email template list renders |
| 2 | View a template | Template details (subject, body, variables) visible |
| 3 | Edit and save template | Template updated via `emailTemplateService.update()` |
| 4 | Send test email | `edgeFunctionService.sendEmail()` invoked |

---

### Cross-Cutting: Route Protection

#### MNT-TC-018: Mentor Cannot Access Student Routes

| Field | Value |
|-------|-------|
| **Test ID** | MNT-TC-018 |
| **Module** | Security |
| **Feature** | Route Protection |
| **Priority** | Critical |
| **Severity** | Critical |
| **Test Type** | Security |
| **Test Data** | Mentor authenticated |
| **Preconditions** | Mentor logged in |

**Objective**: Verify mentor cannot access student-only routes.

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Navigate to `/#/student` | Redirected or blocked |
| 2 | Navigate to `/#/student/goals` | Redirected or blocked |

**Automation**: `e2e/security/cross-role.spec.ts`

---

## 5. Automation Mapping

| Test Cases | Spec File | Status |
|-----------|-----------|--------|
| MNT-TC-001, MNT-TC-002 | `e2e/mentor-flow.spec.ts`, `e2e/mentor/mentor-journey.spec.ts` | ✅ Existing |
| MNT-TC-003, MNT-TC-004, MNT-TC-005 | `e2e/mentor-flow.spec.ts` (applications) | ✅ Existing |
| MNT-TC-006 | `e2e/mentor-flow.spec.ts` (messaging) | ✅ Existing |
| MNT-TC-007 | `e2e/mentor/mentor-journey.spec.ts` (sessions) | ✅ Existing |
| MNT-TC-008 | `e2e/mentor/mentor-journey.spec.ts` (AI) | ✅ Existing |
| MNT-TC-009 | `e2e/mentor/mentor-journey.spec.ts` (analytics) | ✅ Existing |
| MNT-TC-010 | `e2e/mentor/mentor-journey.spec.ts` (events) | ✅ Existing |
| MNT-TC-011 | `e2e/mentor/mentor-journey.spec.ts` (resources) | ✅ Existing |
| MNT-TC-012 | `e2e/mentor/mentor-journey.spec.ts` (gallery) | ✅ Existing |
| MNT-TC-013 | `e2e/mentor/mentor-journey.spec.ts` (bookings) | ✅ Existing |
| MNT-TC-014 | Not automated | ❌ Missing |
| MNT-TC-015 | `e2e/mentor/mentor-journey.spec.ts` (growth-audit) | ✅ Existing |
| MNT-TC-016 | `e2e/mentor/mentor-journey.spec.ts` (program-progress) | ✅ Existing |
| MNT-TC-017 | Not automated | ❌ Missing |
| MNT-TC-018 | `e2e/security/cross-role.spec.ts` | ✅ Existing |

### Playwright Project Assignment

| Tests | Project |
|-------|---------|
| All MNT-TC | chromium-mentor |
| MNT-TC-018 | chromium-mentor (security) |
| Smoke subset | chromium, firefox, webkit, mobile-chrome, mobile-safari |
