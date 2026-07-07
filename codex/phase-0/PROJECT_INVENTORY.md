# Project Inventory

**Generated:** 2026-07-06
**Project:** Mentorino (peter-webapp)
**Tech Stack:** React 19 + TypeScript + Vite + Supabase + TailwindCSS 4

---

## Source Tree

```
src/
├── app/App.tsx                     # Root app with routing
├── main.tsx                        # Entry point
├── pages/                          # 19 page components
├── components/                     # Shared UI components
│   ├── shared/                     # Layout, ProtectedRoute, ErrorBoundary, etc.
│   └── ui/                         # ConfirmDialog, EmptyState
├── features/                       # 7 feature modules
│   ├── admin/                      # AdminRevenue, EventManagement, GalleryManagement
│   ├── events/                     # EventCard, EventCreateModal, EventDetailView, EventListView
│   ├── mentor/                     # MentorDashboard, MentorScheduler, 42+ sub-components
│   ├── messaging/                  # ComposeBar, ContactInfoPanel, ConversationHeader, etc.
│   ├── resources/                  # ResourceDashboard, UploadModal, PreviewModal, etc.
│   ├── settings/                   # Settings panel
│   └── student/                    # UserDashboard, StudentGoals, StudentTasks, etc.
├── hooks/                          # 24 custom React hooks
├── services/                       # 38 service modules + 3 test files
├── context/                        # AuthContext, ConnectionContext
├── lib/                            # supabase.ts, realtimeManager.ts, logger.ts, etc.
├── interfaces/                     # 10 interface modules (form, goal, journal, etc.)
├── types/                          # Core types (User, Session, Application, etc.)
├── constants/                      # Query keys, stale times
├── utils/                          # dateUtils, queryClient, toast, etc.
└── test/                           # Test setup, mocks, test-utils
```

## Backups Inventory

```
backups/
├── API_DOCUMENTATION.md
├── AUTHENTICATION_CONFIGURATION.md
├── BACKEND_DOCUMENTATION.md
├── BACKUP_MANIFEST.md
├── DATABASE_SCHEMA.md
├── edge-functions/
│   ├── auth-middleware.ts
│   ├── gemini.ts
│   ├── resend.ts
│   └── scheduled.ts
├── environment_variables.md
├── FEATURE_INVENTORY.md
├── FRONTEND_DOCUMENTATION.md
├── FUTURE_CHANGE_CHECKLIST.md
├── PERFORMANCE_BASELINE.md
├── PROJECT_ARCHITECTURE.md
├── realtime_publication_v1.sql
├── RECOVERY_GUIDE.md
├── ROLLBACK_GUIDE.md
├── SECURITY_AUDIT.md
├── STABLE_BASE_VERSION.md
├── storage_configuration_v1.sql
├── STORAGE_CONFIGURATION.md
├── SUPABASE_CONFIGURATION.md
├── supabase_schema_v1.sql
└── TEST_REPORT.md
```

## Supabase Migrations (43 files)

| Migration | Purpose |
|-----------|---------|
| 001 | profiles table |
| 002 | programs + program_enrollments |
| 003 | sessions |
| 004 | goals |
| 005 | tasks |
| 006 | journals |
| 007 | bookings |
| 008 | messages |
| 009 | events |
| 010 | applications |
| 011 | notifications |
| 012 | supplementary |
| 013 | profile_extras |
| 014 | storage |
| 015 | realtime |
| 016 | notification_rpc |
| 017 | public_storage |
| 018 | visitor_bookings |
| 020 | module6_complete |
| 021 | module12_complete |
| 022 | sessions_rls_policies |
| 023 | events_module14, resources_complete, reviews_system |
| 024 | resource_functions |
| 025 | reviews_fix |
| 026 | resource_completions |
| 027 | events_module14_fix |
| 028 | gallery_module, visitor_bookings_crm |
| 029 | module19_complete |
| 030 | crm_auto_create, crm_module5, messaging_fixes |
| 031 | fix_is_mentor_jwt |
| 032 | fix_admin_policy_recursion |
| 033 | sync_missing_columns |
| 034 | complete_schema_sync |
| 900 | auth_triggers |
| 999 | fix_rls_recursion, optimization, rls |

## Edge Functions (3 deployed)

| Function | Runtime | Auth | Purpose |
|----------|---------|------|---------|
| gemini | Deno | JWT (student/mentor/admin) | AI chat via Gemini 2.0 Flash |
| resend | Deno | JWT (mentor/admin) | Transactional emails via Resend |
| scheduled | Deno | CRON_SECRET | Cron jobs (reminders, alerts, cleanup) |
| middleware/auth | Deno (shared) | N/A | JWT verification, role checking, CORS |

## Test Infrastructure

| File | Type |
|------|------|
| src/test/setup.ts | Vitest setup |
| src/test/test-utils.tsx | Test utilities |
| src/test/mocks/handlers.ts | MSW handlers |
| src/test/mocks/server.ts | MSW server |
| e2e/ | Playwright E2E tests |
| playwright.config.ts | Playwright configuration |
