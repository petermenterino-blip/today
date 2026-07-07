# Architecture Overview

**Generated:** 2026-07-06
**Project:** Mentorino (peter-webapp)

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND                                  │
│  React 19 + TypeScript + TailwindCSS 4 + Vite 6                  │
│  ┌───────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────────┐  │
│  │ Pages (19)│ │Features(7)│ │ Hooks(24)│ │ Components (52+) │  │
│  └─────┬─────┘ └─────┬────┘ └────┬─────┘ └────────┬─────────┘  │
│        └──────────────┴──────────┴──────────────────┘            │
│                           │                                       │
│                    ┌──────┴──────┐                                │
│                    │  Services   │                                │
│                    │   (38)      │                                │
│                    └──────┬──────┘                                │
│                           │                                       │
│              ┌────────────┼────────────┐                         │
│              ▼            ▼            ▼                         │
│         AuthContext  ConnectionCtx  supabase Client               │
└──────────────┼────────────┼────────────┼─────────────────────────┘
               │            │            │
               ▼            ▼            ▼
┌─────────────────────────────────────────────────────────────────┐
│                        SUPABASE                                   │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────────┐   │
│  │ Database  │ │   Auth   │ │ Storage  │ │   Realtime        │   │
│  │ Postgres  │ │ GoTrue   │ │  S3      │ │   WebSocket       │   │
│  │ 42 tables │ │ JWT/SAML │ │ 7 buckets│ │   40+ tables      │   │
│  └─────┬────┘ └──────────┘ └──────────┘ └──────────────────┘   │
│        │                                                         │
│        ▼                                                         │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │               Edge Functions (Deno)                       │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐                  │   │
│  │  │  Gemini   │ │  Resend  │ │Scheduled  │                  │   │
│  │  │  AI Chat  │ │  Email   │ │  Cron     │                  │   │
│  │  └────┬─────┘ └────┬─────┘ └─────┬────┘                  │   │
│  │       │             │             │                        │   │
│  │  ┌────┴─────────────┴─────────────┴────┐                  │   │
│  │  │      Auth Middleware (JWT Verify)    │                  │   │
│  │  └──────────────────────────────────────┘                  │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
               │                    │
               ▼                    ▼
┌──────────────────────┐  ┌──────────────────────┐
│   External Services   │  │   External Services  │
│   Google Gemini API   │  │   Resend API (Email) │
└──────────────────────┘  └──────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    MONITORING                                     │
│  Sentry (error tracking)  |  PostHog (analytics — not active)    │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    DEPLOYMENT                                     │
│  Vercel (frontend) | GitHub Actions (CI/CD) | Playwright (E2E)  │
└─────────────────────────────────────────────────────────────────┘
```

## Technology Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Frontend Framework | React | 19.0.0 |
| Language | TypeScript | 5.8 |
| Build Tool | Vite | 6.2 |
| Styling | TailwindCSS | 4.2.4 |
| Routing | react-router-dom | 7.1.1 |
| State/Server Cache | TanStack React Query | 5.100.8 |
| Backend/Database | Supabase (PostgreSQL) | 17.6 |
| Auth | Supabase Auth (GoTrue) | 2.192.0 |
| Edge Runtime | Deno (Supabase Edge Functions) | — |
| AI | Google Gemini 2.0 Flash | — |
| Email | Resend API | — |
| Animations | Motion | 12.38.0 |
| Icons | Lucide React | 0.474.0 |
| Charts | Recharts | 2.15.0 |
| Testing (Unit) | Vitest | 4.1.9 |
| Testing (E2E) | Playwright | 1.61.1 |
| Testing (Mock) | MSW | 2.14.6 |
| Monitoring | Sentry | 10.62.0 |
| Notifications | Sonner (toast) | 2.0.7 |
| PDF | jsPDF | 4.2.0 |
| Spreadsheets | xlsx | 0.18.5 |
| Video | hls.js | 1.6.16 |

## Data Flow Pattern

```
User Action → React Component → Hook → Service → Supabase Client
                                                     │
                                           ┌─────────┴─────────┐
                                           │                   │
                                      Realtime           REST/GraphQL
                                      WebSocket           Request
                                           │                   │
                                      Cache Update        Response
                                           │                   │
                                           └─────────┬─────────┘
                                                     │
                                              React Query Cache
                                                     │
                                              UI Re-render
```

## Key Design Patterns

1. **Service Layer** — All Supabase interactions go through services in `src/services/`
2. **Custom Hooks** — Each domain area has a dedicated hook wrapping services
3. **Centralized Realtime** — `realtimeManager.ts` manages all subscriptions
4. **Error Handling** — `errorHandler.ts` + `serviceHelper.ts` for consistent error patterns
5. **Auth Context** — Single source of truth for user state and role
6. **Lazy Loading** — All pages use `React.lazy()` + `Suspense`
7. **Feature Modules** — Self-contained feature directories with components, hooks, services
