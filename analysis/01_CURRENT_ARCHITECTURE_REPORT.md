# Phase 1: Current Architecture Report

## Stack Overview
| Layer | Technology | Version/Notes |
|-------|-----------|---------------|
| Frontend Framework | React | 19 (via Vite 6) |
| Build Tool | Vite | 6.x |
| Styling | Tailwind CSS | v3 |
| State / Server Cache | TanStack Query | v5 |
| Routing | React Router | v7 |
| Backend | Supabase | Auth, PostgreSQL, Storage, Realtime, Edge Functions |
| Language | TypeScript | Strict mode |
| Package Manager | npm | |

## Directory Structure
```
src/
├── components/          # 6 shared UI components (Button, Input, Modal, ProtectedRoute, Spinner, SEO)
├── contexts/            # 1 context (AuthContext)
├── hooks/               # 22 custom hooks
├── lib/                 # Supabase client config, utils, constants
├── pages/               # 18 page modules (each typically index.tsx + sub-components)
├── services/            # 26 service modules (data access layer)
└── types/               # TypeScript interfaces (360+ lines in index.ts)
supabase/
├── functions/           # 5 Edge Functions (calendar, gemini, meet, resend, scheduled)
├── migrations/          # 17 SQL migrations (36 tables)
└── seed.sql             # Seed data
```

## Page Inventory (18 pages)
| # | Page | Status | Notes |
|---|------|--------|-------|
| 1 | Login | Complete | Auth via Supabase |
| 2 | Register | Complete | Role-based registration |
| 3 | Dashboard | Partial | 5 empty tabs; mentor/student views |
| 4 | ProgramApplications | Partial | Application listing + review UI exists |
| 5 | MentorApplications | Complete | Application management |
| 6 | MentorBulkUpload | Complete | CSV upload flow |
| 7 | StudentManagement | Partial | Listing works, details partial |
| 8 | MentorManagement | Complete | Listing + management |
| 9 | ProgramManagement | Complete | CRUD + enrollment |
| 10 | ContentManagement (CMS) | Complete | Lesson/module CRUD |
| 11 | Communications | Complete | Messaging + announcements + events |
| 12 | Analytics | Partial | Summary metrics present, 2 empty drill-downs |
| 13 | Reports | Complete | Generate + download reports |
| 14 | Events | Complete | Event CRUD + attendance |
| 15 | Bookings | Complete | Calendar-based booking |
| 16 | FAQ | Complete | FAQ management |
| 17 | Settings | Partial | Profile update works, integrations empty |
| 18 | Profile (Student) | Partial | Journal + messaging present, some features missing |

## Data Flow Architecture
```
Browser → React (Vite SPA) → TanStack Query → Service Layer → Supabase Client
                                                              ├── PostgreSQL (main DB)
                                                              ├── Storage (file uploads)
                                                              ├── Auth (JWT sessions)
                                                              ├── Realtime (subscriptions)
                                                              └── Edge Functions (HTTP)
```

### Patterns
- **Services**: All data access goes through `src/services/` modules. Each is a plain TS module exporting async functions. TanStack Query `useQuery`/`useMutation` wraps them at the hook level.
- **Hooks**: 22 custom hooks, mostly TanStack Query wrappers. Some stale closure patterns detected (useRealtime).
- **Auth**: AuthContext provides user session + role. Roles detected in code: `admin`, `mentor`, `student`, `super_admin`.
- **Routing**: React Router v7 with `<ProtectedRoute>` wrapper checking `application_status`.

## Database (17 migrations, 36 tables)
### Core schema groups:
1. **Users/Auth** — profiles, roles, mentor_applications, applications
2. **Programs** — programs, program_enrollments, modules, lessons, lesson_resources
3. **Events** — events, event_attendees, event_files, event_feedbacks, event_recordings
4. **Messaging** — conversations, conversation_participants, messages
5. **Finances** — products, transactions
6. **Operations** — announcements, application_notes, faqs, mentor_availability, student_tags, student_timeline_events, student_parents
7. **Journal** — journal_entries
8. **Reports** — report_templates, report_links

### RLS: 179 policies across 25 tables
- Most tables have full RLS coverage
- Manual verification performed on event child tables (attendees, files, feedbacks, recordings)
- Manual verification performed on zero-policy tables (application_notes, products, transactions, announcements, mentor_availability, student_tags, student_timeline_events)
- All now have RLS policies applied

## Edge Functions (5)
| Function | Trigger | Auth | Security | Status |
|----------|---------|------|----------|--------|
| scheduled | CRON (Vercel) | CRON_SECRET | Verified | ✅ |
| resend | HTTP | Supabase JWT + mentor check | Verified | ✅ |
| calendar | HTTP | None | ❌ No auth | ⚠️ |
| gemini | HTTP | None | ❌ No auth | ⚠️ |
| meet | HTTP | None | ❌ No auth | ⚠️ |

## Key Architectural Strengths
1. Services layer cleanly abstracts Supabase — UI never calls Supabase directly
2. TanStack Query provides caching, deduplication, and background refetching
3. Thorough RLS coverage (179 policies)
4. TypeScript strict mode with comprehensive type definitions
5. Role-based access control via both RLS and application-level checks

## Key Architectural Weaknesses
1. No API gateway — SPA talks directly to Supabase (expected for BaaS, but limits control)
2. Edge functions inconsistent — 3 of 5 have zero auth
3. 22 hooks with inconsistent patterns (some lack error handling, stale closure risks)
4. localStorage still used directly in some feature components (not fully migrated to service layer)
5. No end-to-end type safety between migrations and service layer
