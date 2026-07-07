# Frontend Documentation

## Tech Stack
- React 19.0.0
- TypeScript ~5.8.2
- Vite 6.2.0
- Tailwind CSS v4.2.4
- TanStack React Query v5.100.8
- React Router DOM v7.1.1
- Motion v12.38.0 (animations)
- Recharts v2.15.0 (charts)
- Lucide React 0.474.0 (icons)
- Sonner v2.0.7 (toasts)

## Entry Point
`src/main.tsx` → `src/app/App.tsx`

## Pages (19)

| Page | Route | Path |
|------|-------|------|
| Landing | Public | `/` |
| Auth | Public | `/auth` |
| About | Public | `/about` |
| Programs | Public | `/programs` |
| Consultation | Public | `/consultation` |
| FAQ | Public | `/faq` |
| Contact | Public | `/contact` |
| Gallery | Public | `/gallery` |
| Privacy | Public | `/privacy` |
| Terms | Public | `/terms` |
| Application | Public | `/apply` |
| Booking | Public | `/booking` |
| Store | Public | `/store` |
| Survey | Public | `/survey` |
| ResetPassword | Public | `/reset-password` |
| ConsultationOverview | Protected | `/consultation-overview` |
| UserDashboard | Protected (student) | `/dashboard` |
| MentorDashboard | Protected (mentor) | `/dashboard` |
| AdminRevenue | Protected (admin) | `/admin/revenue` |
| Settings | Protected | `/settings` |
| PendingApproval | Protected | `/pending-approval` |
| NotFound | Any | `*` |

## Component Architecture

### Shared Components (`src/components/shared/`)
- `Layout.tsx` — Main app layout with sidebar navigation
- `ProtectedRoute.tsx` — Role-based access guard (student/mentor/admin)
- `Footer.tsx` — Public site footer
- `VisitorHeader.tsx` — Public site navigation header
- `ErrorBoundary.tsx` — React error boundary with Sentry integration
- `OfflineBanner.tsx` — Connection status indicator
- `ScrollToTop.tsx` — Scroll reset on route change
- `NotificationDropdown.tsx` — Notification bell menu with unread count

### UI Components (`src/components/ui/`)
- `ConfirmDialog.tsx` — Confirmation modal dialog
- `EmptyState.tsx` — Empty state placeholder with icon and message

### Feature: Student Dashboard (`src/features/student/`)
- `UserDashboard.tsx` — Tabbed layout: Journal, Goals, Sessions, Events, Application, Messages, Schedule
- `StudentEditProfile.tsx` — Profile editing
- `StudentEvents.tsx` — Event listing for students
- `StudentForms.tsx` — Form submissions
- `StudentGoals.tsx` — Goal management
- `StudentJournal.tsx` — Journal entries
- `StudentProgramView.tsx` — Program progress
- `StudentReviews.tsx` — Reviews
- `StudentSessions.tsx` — Session history
- `StudentSharedFiles.tsx` — Shared files
- `StudentTasks.tsx` — Task list
- `GrowthForm.tsx` — Growth tracking form
- `TaskActivityForm.tsx` — Task activity logging

### Feature: Mentor Dashboard (`src/features/mentor/`)
- `MentorDashboard.tsx` — 12+ tabs: Overview, Mentees, Tasks, Applications, VisitorBookings, GrowthAudit, ProgramProgress, Reviews, AnalyticsBI, AI, Resources, Events, Gallery, WhatsApp
- `MentorScheduler.tsx` — Calendar scheduling with drag-and-drop
- **Overview Widgets (11):** ActivityTimelineWidget, AIDailySummaryWidget, AtRiskStudentsWidget, CalendarOverviewWidget, CalendarPreviewWidget, CommunicationHubWidget, CurrentProgramInfo, EventsWidget, HealthOverviewWidget, HeroSidePanel, MentorWorkspaceStatus, NewApplicationsCard, NotificationsPreviewWidget, OperationalMetricsWidget, PerformanceCardsWidget, QuickActionModals, QuickActionsBar, RecentlyViewedWidget, SummaryStatsRow, TodayPrioritiesWidget, WorkspaceMetricsChart
- **Tab Components:** OverviewTab, MenteesTab, TasksTab, ApplicationsTab, VisitorBookingsTab, GrowthAuditTab, ProgramProgressTab, ReviewsTab, AnalyticsBI, AIDashboard, Resources tab, Events tab, Gallery tab, WhatsApp tab

### Feature: Messaging (`src/features/messaging/`)
- `WhatsAppMessaging.tsx` — Main container with conversation list + message thread
- `ConversationList.tsx` — Sidebar with search, filters, pins
- `MessageThread.tsx` — Message bubbles with loading/status
- `ComposeBar.tsx` — Text input + file upload + audio recording
- `ConversationHeader.tsx` — Contact info panel header
- `ContactInfoPanel.tsx` — Slide-out details with shared files
- `VoiceMessagePlayer.tsx` — Audio playback

### Feature: Resources (`src/features/resources/`)
- `ResourceDashboard.tsx` — Search, filter, paginate resources
- `ResourceCard.tsx` — Resource card display
- `ResourceDetailModal.tsx` — Detail view
- `ResourceFilters.tsx` — Filter sidebar
- `ResourceStatsCards.tsx` — Statistics cards
- `UploadModal.tsx` — Resource upload
- `AssignResourceModal.tsx` — Assign to students/programs
- `ResourceAnalyticsPanel.tsx` — Usage analytics
- `PreviewModal.tsx` — File preview
- `CommentsSection.tsx` — Comments
- `CategoryManagementModal.tsx` — Category CRUD
- `VersionHistoryPanel.tsx` — Version history

### Feature: Admin (`src/features/admin/`)
- `AdminRevenue.tsx` — Revenue dashboard with charts + Excel export
- `EventManagement.tsx` — Full event management (CRUD, attendees, check-in, feedback)
- `GalleryManagement.tsx` — Gallery CRUD with file upload

## Custom Hooks (20+)

### Data Hooks (React Query + Realtime)
`useBookings`, `useSessions`, `useNotifications`, `useMessaging`, `useApplications`, `useGoals`, `useTasks`, `useJournals`, `usePrograms`, `useEvents`, `useGallery`, `useReviews`, `useResources`, `useStudentList`, `useCustomForms`, `useGrowthAudits`, `useActionItems`, `useTransactions`, `useVisitorBookings`, `useEventRsvp`, `useFileUpload`, `useRealtimeData`, `useRealtime`, `useDatabaseSync`

### Mentor Feature Hooks
`useOverviewStore` (Zustand-like store), `useDashboard`, `useAnalyticsBI`, `useAIAssistant`, `useCalendar`, `useApplicationReview`, `useEventManager`, `useFeedback`, `useMentees`, `useProgramManager`

## Key Libraries (`src/lib/`)
- `supabase.ts` — Supabase client initialization
- `realtimeManager.ts` — Centralized realtime subscription logic
- `errorHandler.ts` — Network error detection and interpretation
- `serviceHelper.ts` — Error handling for service calls
- `sentry.ts` — Sentry initialization
- `supabaseFallback.ts` — safeQuery/safeMutate for local fallback
- `idleRecovery.ts` — Auto session refresh after idle period
- `logger.ts` — Logging utility
