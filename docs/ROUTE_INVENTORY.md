# Route Inventory

**Router:** HashRouter (react-router-dom v7.1.1)
**Protection:** ProtectedRoute component with role-based access

---

## Public Routes (Visitor — no auth required)

| Path | Component | Description |
|------|-----------|-------------|
| `/` | LandingPage | Landing page (role-aware) |
| `/about` | AboutPage | About Mentorino |
| `/programs` | ProgramsPage | View public programs |
| `/consultation` | ConsultationPage | Consultation info |
| `/faq` | FAQPage | Frequently asked questions |
| `/contact` | ContactPage | Contact form |
| `/gallery` | GalleryPage | Public gallery |
| `/mentorship` | MentorshipPage | Mentorship information |
| `/auth` | AuthPage | Login/signup page (redirects to /dashboard if already logged in) |
| `/pending-approval` | PendingApproval | Application pending status |
| `/booking` | BookingPage | Book a consultation |
| `/book-call` | BookingPage | Alias for booking |
| `/privacy` | PrivacyPage | Privacy policy |
| `/terms` | TermsPage | Terms of service |
| `/reset-password` | ResetPasswordPage | Password reset form |
| `/apply` | ApplicationPage | Submit mentorship application |
| `/consultation-overview` | ConsultationOverviewPage | Consultation details |
| `*` | NotFoundPage | 404 catch-all |

## Protected Routes — Student only (`/student/*`)

| Path | Component | Nav Label |
|------|-----------|-----------|
| `/student` | UserDashboard (Overview tab) | Overview |
| `/student/programs` | StudentProgramView | Programs |
| `/student/journal` | StudentJournal | Journal |
| `/student/goals` | StudentGoals | Goals |
| `/student/tasks` | StudentTasks | Tasks |
| `/student/reviews` | StudentReviews | Reviews |
| `/student/forms` | StudentForms | Forms |
| `/student/sessions` | StudentSessions | Sessions |
| `/student/messages` | (Messaging via UserDashboard) | Messages |
| `/student/resources` | (Resources via UserDashboard) | Resources |
| `/student/events` | StudentEvents | Events |
| `/student/profile` | StudentEditProfile | Profile |
| `/dashboard/*` | Redirect → `/student/*` | Legacy redirect |

## Protected Routes — Mentor only (`/mentor/*`)

| Path | Component | Nav Label | Tab Param |
|------|-----------|-----------|-----------|
| `/mentor` | MentorDashboard | Overview | (no tab) |
| `/mentor?tab=messaging` | MentorDashboard → Messaging | Messaging | messaging |
| `/mentor?tab=mentees` | MentorDashboard → MenteesTab | Students | mentees |
| `/mentor?tab=applications` | MentorDashboard → ApplicationsTab | Applications | applications |
| `/mentor?tab=sessions` | MentorDashboard → SessionSidebar | Sessions | sessions |
| `/mentor?tab=programs` | MentorDashboard → ProgramProgressTab | Programs | programs |
| `/mentor?tab=program-progress` | MentorDashboard → ProgramProgressTab | Progress | program-progress |
| `/mentor?tab=feedback` | MentorDashboard → ReviewsTab | Reviews | feedback |
| `/mentor?tab=resources` | MentorDashboard → ResourceDashboard | Resources | resources |
| `/mentor?tab=events` | MentorDashboard → EventManagement | Events | events |
| `/mentor?tab=analytics` | MentorDashboard → AnalyticsBI | Analytics | analytics |
| `/mentor?tab=ai` | MentorDashboard → AIDashboard | AI Insights | ai |
| `/mentor?tab=gallery` | MentorDashboard → GalleryManagement | Gallery | gallery |
| `/mentor?tab=bookings` | MentorDashboard → VisitorBookingsTab | Bookings | bookings |

## Protected Routes — Student & Mentor

| Path | Component | Allowed Roles |
|------|-----------|---------------|
| `/store` | StorePage | student, mentor |
| `/survey` | SurveyPage | student, mentor |
| `/settings` | SettingsPage | student, mentor |

## Protected Routes — Mentor

| Path | Component | Allowed Roles | Note |
|------|-----------|---------------|------|
| `/admin/revenue` | AdminRevenuePage | mentor | Restricted to mentor role check |

## Route Access Summary

| Role | Public Routes | Student Routes | Mentor Routes | Shared Protected |
|------|---------------|----------------|---------------|------------------|
| Visitor | ✅ All | ❌ | ❌ | ❌ |
| Student | ✅ All | ✅ All | ❌ | ✅ store, survey, settings |
| Mentor | ✅ All | ❌ | ✅ All | ✅ store, survey, settings |

## Missing/Notable Routes

| Path | Issue |
|------|-------|
| `/admin/*` | Mentor routes not fully implemented; `/admin/revenue` uses `mentor` role check |
| `/dashboard/*` | Redirect to `/student` — legacy route kept for compatibility |
| No mentor route for `tab=growth-audits` | Listed in services but no nav item |
| No mentor route for `tab=form-builder` | FormBuilderModal exists but no dedicated route |
| No mentor panel for user management | Missing entirely |
