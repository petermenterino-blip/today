# Project Architecture

## Overview

- **Application Name:** peter-webapp (Mentorino Platform)
- **Purpose:** Mentorship management platform connecting students with mentors
- **Frontend:** React 19 + TypeScript + Vite 6
- **Backend:** Supabase (PostgreSQL, Auth, Storage, Realtime, Edge Functions)
- **State Management:** TanStack React Query v5 + React Context
- **Routing:** React Router DOM v7 (HashRouter)
- **Styling:** Tailwind CSS v4 + motion (Framer Motion successor)
- **Charts:** Recharts
- **Icons:** Lucide React
- **Notifications:** Sonner (toast) + Supabase Realtime (in-app)
- **Monitoring:** Sentry
- **Testing:** Vitest (unit) + Playwright (e2e) + MSW (mocks)
- **CI/CD:** GitHub Actions + Vercel auto-deploy
- **Deployment:** Vercel (frontend), Supabase (backend)

## Folder Structure

```
today/
├── src/                          # Frontend source code
│   ├── app/                      # App entry point (routing)
│   ├── components/               # Shared UI components
│   │   ├── shared/               # Layout, ErrorBoundary, ProtectedRoute, etc.
│   │   └── ui/                   # ConfirmDialog, EmptyState
│   ├── constants/                # Constants and query keys
│   ├── context/                  # React contexts (Auth, Connection)
│   ├── features/                 # Feature modules
│   │   ├── admin/                # Admin features (Revenue, Events, Gallery)
│   │   ├── events/               # Events components
│   │   ├── mentor/               # Mentor dashboard + components + hooks
│   │   ├── messaging/            # WhatsApp-style messaging
│   │   ├── resources/            # Resource library
│   │   ├── settings/             # User settings
│   │   └── student/              # Student dashboard features
│   ├── hooks/                    # Shared custom hooks (20+ hooks)
│   ├── interfaces/               # TypeScript interfaces (form, goal, journal, etc.)
│   ├── lib/                      # Core libraries (supabase, realtime, sentry, etc.)
│   ├── pages/                    # Page components (19 pages)
│   ├── services/                 # Service layer (30+ services)
│   ├── test/                     # Test utilities + mocks
│   ├── types/                    # TypeScript type definitions
│   └── utils/                    # Utilities (date, queryClient, toast, etc.)
├── supabase/
│   ├── functions/                # Edge Functions
│   │   ├── gemini/               # AI chat via Gemini API
│   │   ├── resend/               # Email sending via Resend
│   │   ├── scheduled/            # Cron tasks (reminders, alerts, summaries)
│   │   └── middleware/           # Shared auth middleware
│   ├── migrations/               # 42 SQL migration files
│   └── seed/                     # Seed data
├── e2e/                          # Playwright E2E tests
├── scripts/                      # Utility scripts (seedAuthUsers)
├── .github/workflows/            # CI configuration
└── .vercel/                      # Vercel project link
```

## Routing Architecture

HashRouter with lazy-loaded routes:

- **Public:** `/`, `/auth`, `/about`, `/programs`, `/consultation`, `/faq`, `/contact`, `/gallery`, `/privacy`, `/terms`, `/apply`, `/booking`, `/store`, `/survey`
- **Protected:** `/dashboard`, `/settings`, `/pending-approval`, `/consultation-overview`
- **Admin:** `/admin/revenue`
- **Role-based switching:** AuthContext determines role → renders StudentDashboard, MentorDashboard, or Admin views

## Data Flow

1. Components use custom hooks (e.g., `useSessions`, `useGoals`)
2. Hooks use React Query (`useQuery`/`useMutation`) with Supabase service functions
3. Service functions call `supabase` client (DB, Auth, Storage, Functions)
4. Realtime subscriptions via `realtimeManager.ts` invalidate React Query cache on changes
5. ConnectionContext monitors online/offline status, debounces reconnections

## Environment Variables

| Variable | Source | Required |
|----------|--------|----------|
| `VITE_SUPABASE_URL` | `import.meta.env` | Yes |
| `VITE_SUPABASE_ANON_KEY` | `import.meta.env` | Yes |
| `VITE_SENTRY_DSN` | `import.meta.env` | No |
| `SUPABASE_SERVICE_ROLE_KEY` | `process.env` | For seeding |
