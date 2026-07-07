
<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Mentorino - Premium Mentorship Platform

A premium career, education, and life guidance mentorship platform built with React 19, Supabase, and Vite 6.

## Quick Start

```bash
npm install
cp .env.example .env.local  # then set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
npm run dev
```

## Project Structure

```
src/                Application source code
├── app/            App entry, routing
├── components/     Reusable UI (shared/, ui/)
├── constants/      Static constants (query keys)
├── context/        React context providers (Auth, Connection)
├── features/       Feature modules (events, mentor, messaging, resources, settings, student)
├── hooks/          Custom React hooks
├── interfaces/     Domain type interfaces
├── lib/            Core utilities (supabase, sentry, logger)
├── pages/          Route-level page components
├── services/       Data access layer (Supabase queries)
├── test/           Test setup, MSW mocks
├── types/          Base type definitions
└── utils/          Utility functions

docs/               Consolidated documentation
├── architecture/   System architecture, database schema, application flow
├── product/        Business requirements (BRD), product requirements (PRD)
├── development/    Coding standards, development rules
├── security/       Security architecture
├── operations/     Backup & recovery
└── archive/        Historical reports, plans, release docs, legacy docs

supabase/           Database migrations, edge functions, seed data
e2e/                Playwright end-to-end tests
scripts/            Utility scripts
.github/workflows/  CI/CD pipeline
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Type-check and build for production |
| `npm run preview` | Preview production build |
| `npm test` | Run unit tests (Vitest) |
| `npm run test:coverage` | Run tests with coverage |
| `npm run test:e2e` | Run Playwright E2E tests |
| `npm run lint` | TypeScript type-check |

## Documentation

All documentation is in the [docs/](docs/) directory:

- [Architecture Overview](docs/architecture/overview.md)
- [Database Schema](docs/architecture/database.md)
- [Application Flow](docs/architecture/application-flow.md)
- [Business Requirements](docs/product/brd.md)
- [Product Requirements](docs/product/prd.md)
- [Coding Standards](docs/development/standards.md)
- [Development Rules](docs/development/rules.md)
- [Security Architecture](docs/security/architecture.md)
- [Backup & Recovery](docs/operations/backup-recovery.md)

## Tech Stack

- **Frontend:** React 19, TypeScript 5.8, Vite 6, Tailwind CSS 4
- **Routing:** React Router 7 (HashRouter)
- **Data:** TanStack Query 5, Supabase (PostgreSQL + Realtime)
- **Testing:** Vitest, Testing Library, Playwright, MSW
- **Monitoring:** Sentry (optional)
- **CI/CD:** GitHub Actions, Vercel
