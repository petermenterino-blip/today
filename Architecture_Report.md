# Architecture Report

**Project:** Mentorino  
**Audit Date:** 2026-07-06  
**Auditor:** Principal Software Architect

---

## 1. Technology Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Frontend Framework | React | 19.0.0 |
| Build Tool | Vite | 6.2 |
| TypeScript | TypeScript | 5.8 |
| Routing | React Router DOM (HashRouter) | 7.1.1 |
| Styling | Tailwind CSS | 4.2.4 |
| Server State | TanStack React Query | 5.100.8 |
| Backend | Supabase (PostgreSQL, Auth, Realtime, Storage, Edge Functions) | Latest |
| AI | Google Gemini 2.0 Flash | Edge Function |
| Email | Resend API | Edge Function |
| Animation | Motion | 12.38 |
| Charts | Recharts | 2.15.0 |
| Icons | Lucide React | 0.474.0 |
| Notifications | Sonner | 2.0.7 |
| Testing (Unit) | Vitest + Testing Library | 4.1.9 |
| Testing (E2E) | Playwright | Latest |
| CI/CD | GitHub Actions | - |
| Deployment | Vercel | - |

---

## 2. Directory Structure

```
mentorino/
├── src/                    # Application source
│   ├── app/                # Root component + routing
│   ├── components/         # Shared UI components
│   │   ├── shared/         # Layout, Footer, Header, ErrorBoundary, ProtectedRoute
│   │   └── ui/             # ConfirmDialog, EmptyState
│   ├── config/             # Environment + feature flags
│   ├── constants/          # Query keys, stale times, mock data
│   ├── context/            # AuthContext, ConnectionContext
│   ├── features/           # Feature modules
│   │   ├── admin/          # Revenue, Event/Gallery management
│   │   ├── events/         # Event CRUD
│   │   ├── mentor/         # Dashboard, Calendar, Apps, Analytics, AI
│   │   ├── messaging/      # WhatsApp-style chat
│   │   ├── resources/      # Resource library
│   │   ├── settings/       # User settings
│   │   └── student/        # Dashboard, Goals, Tasks, Journal, Sessions
│   ├── hooks/              # 24 custom hooks (useMessaging, useRealtime, etc.)
│   ├── interfaces/         # TypeScript interfaces
│   ├── lib/                # Core utilities (supabase client, realtime, logger, etc.)
│   ├── pages/              # 19 page components
│   ├── services/           # 41 API service modules
│   ├── test/               # Test setup, mock server, test utils
│   ├── types/              # Shared types
│   └── utils/              # QueryClient, date utils, toast helpers
├── e2e/                    # Playwright E2E tests
│   ├── *.spec.ts           # 10 test files
│   └── helpers/            # Auth mocking helpers
├── supabase/
│   ├── migrations/         # 44 migration files
│   ├── seed/               # Seed data
│   └── functions/          # 5 edge functions
├── scripts/                # Seed scripts, standalone SQL
├── backups/                # Reference docs/snapshots
├── docs/                   # Documentation
├── codex/                  # Legacy planning docs
└── playwright.config.ts    # Playwright configuration
```

---

## 3. Architecture Patterns

### 3.1 Frontend Architecture

**Component Tree:**
```
App.tsx (HashRouter)
├── Public Routes
│   ├── Landing, About, Programs, FAQ, Contact, Gallery
│   ├── Auth (login/reset password)
│   ├── Application (multi-step form)
│   └── Booking, Consultation, Store, Survey
├── Protected Routes
│   ├── /student/* → UserDashboard (role: student)
│   ├── /mentor/* → MentorDashboard (role: mentor)
│   ├── /settings (role: student|mentor)
│   └── /admin/revenue (role: mentor)
└── NotFound (fallback)
```

**State Management:**
- **Server state:** TanStack React Query (90% of data)
- **Auth state:** React Context (AuthContext)
- **Connection state:** React Context (ConnectionContext)
- **URL state:** HashRouter params
- **Local state:** React useState (forms, modals, UI toggles)

### 3.2 Data Flow

```
UI Component
  → Custom Hook (useGoals, useMessaging, etc.)
    → Service Layer (goalStorage, messageService, etc.)
      → Supabase Client (REST or Realtime)
        → Supabase Backend
          → RLS Enforced
            → PostgreSQL
```

### 3.3 Realtime Architecture

```
Client subscribes via Supabase JS Realtime
  → postgres_changes on messages/conversations/notifications/sessions/bookings
    → useRealtimeData hook
      → Debounce (2s)
        → queryClient.invalidateQueries()
          → React Query refetch
            → UI updates
```

---

## 4. Strengths

| Aspect | Rating | Notes |
|--------|--------|-------|
| Code Organization | ✅ GOOD | Feature-based modules, clear separation |
| TypeScript Coverage | ✅ EXCELLENT | 119 TSX + 153 TS files, strict mode |
| Error Handling | ✅ GOOD | ErrorBoundary, errorHandler utility, Sentry integration |
| Testing | ✅ GOOD | 160 unit tests + 90+ E2E tests |
| Build Pipeline | ✅ GOOD | Vite + tsc -b, sub-2s incremental |
| Database | ✅ GOOD | 44 migrations, RLS on all tables, comprehensive indexes |
| Security | ✅ GOOD | RLS, JWT, role-based access, rate limiting |
| Realtime | ✅ GOOD | Debounced invalidation, cleanup on unmount |

---

## 5. Issues Found

| Severity | Issue | Location | Recommendation |
|----------|-------|----------|---------------|
| MEDIUM | Duplicate function definition | `supabase/functions/middleware/auth.ts:91` and `:107` | `getCorsHeaders` defined twice; second overwrites first |
| MEDIUM | Wildcard CORS in error responses | `middleware/auth.ts:17,29,43,69,77` | Should use `getCorsHeaders` instead of hardcoded `'*'` |
| LOW | Empty hooks directory | `src/features/settings/hooks/` | Remove or populate |
| LOW | Mock data in constants | `src/constants/constants.ts` | MOCK_PRODUCTS/MOCK_TRANSACTIONS unused |
| INFO | 504 HTML files outside src | Likely in backups/codex/docs | Stale documentation, consider cleanup |
| INFO | 44 database migrations | Sequential, many fix migrations | Consider squashing for production |

---

## 6. Code Quality Metrics

| Metric | Value | Assessment |
|--------|-------|------------|
| Source files | 1046 | Manageable |
| TypeScript files | 272 | Good coverage |
| Services | 41 | Well-modularized |
| Hooks | 24 | Good abstraction |
| Pages | 19 | Reasonable |
| Unit test files | 12 | Adequate, ~160 tests |
| E2E test files | 10 | Comprehensive |
| DB Migrations | 44 | Many iterative fixes |
| Dependencies | 28 (16+12) | Lean |
| Lint errors | 0 | ✅ Clean |
| TypeScript errors | 0 | ✅ Clean |
| Build output | 84 assets | ✅ Clean |

---

## 7. Scalability Assessment

| Factor | Current | 100 Users | 1000 Users | 10000 Users |
|--------|---------|-----------|------------|-------------|
| Database | Seeded data | ✅ OK | ✅ OK | ⚠️ Need connection pooling |
| Realtime | Debounced 2s | ✅ OK | ✅ OK | ⚠️ Monitor channel count |
| Edge Functions | Rate-limited | ✅ OK | ✅ OK | ⚠️ Scale Deno workers |
| Auth | Supabase Auth | ✅ OK | ✅ OK | ⚠️ Monitor tier limits |
| Storage | Basic buckets | ✅ OK | ✅ OK | ⚠️ CDN recommended |
| Frontend | Vite SPA | ✅ OK | ✅ OK | ⚠️ Consider ISR/SSR for landing |
