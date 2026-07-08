# Master Testing Strategy

| Document ID | QA-STRAT-001 |
|---|---|
| Document Title | Master Testing Strategy |
| Version | 2.0 |
| Status | Approved |
| Author | QA Team |
| Date | 2026-07-08 |

---

## Revision History

| Version | Date | Author | Description |
|---------|------|--------|-------------|
| 1.0 | 2026-06-15 | QA Team | Initial strategy |
| 2.0 | 2026-07-08 | QA Team | Customized for Mentorino Vite + React 19 + Supabase SDK architecture |

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [Application Architecture Overview](#2-application-architecture-overview)
3. [Testing Objectives](#3-testing-objectives)
4. [Scope of Testing](#4-scope-of-testing)
5. [Out of Scope](#5-out-of-scope)
6. [Testing Levels](#6-testing-levels)
7. [Testing Types](#7-testing-types)
8. [Test Environment](#8-test-environment)
9. [Test Data Strategy](#9-test-data-strategy)
10. [Automation Strategy](#10-automation-strategy)
11. [Manual Testing Strategy](#11-manual-testing-strategy)
12. [Defect Management](#12-defect-management)
13. [Entry and Exit Criteria](#13-entry-and-exit-criteria)
14. [Roles and Responsibilities](#14-roles-and-responsibilities)
15. [Tools and Infrastructure](#15-tools-and-infrastructure)
16. [Test Deliverables](#16-test-deliverables)
17. [Risk and Mitigation](#17-risk-and-mitigation)
18. [Appendices](#18-appendices)

---

## 1. Introduction

Mentorino is a mentorship management platform connecting students with mentors. It is built as a **single-page application (SPA)** using **React 19 + Vite 6 + TypeScript**, deployed on **Vercel**. The backend is powered entirely by **Supabase** (Auth, Postgres, Realtime, Storage, Edge Functions). There is **no traditional REST API layer** — all data access is performed client-side via the **Supabase JavaScript SDK** (`supabase.from('table').*()`).

This document defines the master testing strategy, covering all three portals:

- **Public Website** — Landing, About, Programs, Booking, Contact, FAQ, Store, Survey, Gallery, Mentorship, Apply, Privacy, Terms
- **Student Portal** — Dashboard, Programs, Goals, Tasks, Journal, Sessions, Messages, Resources, Events, Forms, Reviews, Files, Profile, Settings
- **Mentor Dashboard** — Overview, Applications, Mentees, Messaging, Sessions, Programs, Resources, Events, Analytics, AI, Gallery, Bookings, Financials, Growth Audit, Emails, Settings

### References

| Document | Location |
|----------|----------|
| Route Inventory | `docs/ROUTE_INVENTORY.md` |
| Feature Inventory | `docs/FEATURE_INVENTORY.md` |
| API Contract (Edge Functions) | `docs/API_CONTRACT.md` |
| Database Documentation | `docs/DATABASE_DOCUMENTATION.md` |
| Test Users | `docs/TEST_USERS.md` |
| Playwright Config | `playwright.config.ts` |
| E2E Tests | `e2e/*.spec.ts` |
| Unit Tests | `src/**/__tests__/*.test.ts` |

---

## 2. Application Architecture Overview

Mentorino is a **Vite 6 SPA** with **no server-side rendering**. The architecture is:

```
Browser (React 19 SPA)
    │
    ├── HashRouter (react-router-dom v7 — all routes use /#/ prefix)
    │
    ├── AuthContext + AuthService → supabase.auth.signInWithPassword()
    │
    ├── TanStack React Query v5 (server state, caching, invalidation)
    │
    ├── Zustand (useOverviewStore — client-side mentor state)
    │
    ├── Supabase JS Client SDK:
    │   ├── supabase.from('table').select() — PostgREST queries
    │   ├── supabase.auth.* — Authentication
    │   ├── supabase.storage.from('bucket') — File storage
    │   ├── supabase.functions.invoke('name') — Edge Functions
    │   └── supabase.channel('name') — Realtime subscriptions
    │
    ├── Google Gemini AI (via Edge Function)
    ├── Resend (email via Edge Function)
    ├── Sentry + PostHog (monitoring & analytics)
    ├── Sonner (toast notifications)
    └── Recharts (charts & analytics visualization)
```

### Key Architectural Decisions Affecting Testing

| Decision | Testing Implication |
|----------|-------------------|
| **No REST API layer** | All API testing must use `supabase.from().*()` patterns, not HTTP endpoints |
| **HashRouter** | All URLs use `/#/` prefix — route assertions must include it |
| **TanStack Query v5** | Cache invalidation, stale-while-revalidate, and optimistic updates must be tested |
| **Supabase Realtime** | 2-second debounced invalidation on subscriptions, not instant push |
| **Client-side Auth** | Auth is handled entirely by `supabase-js` — no server-side session |
| **Zustand** | Client-side store state must be verified independently |
| **No SSR** | Performance metrics are SPA-centric (LCP, FID, CLS on client render) |

---

## 3. Testing Objectives

1. **Functional Correctness**: All features across all three portals work as specified
2. **Data Integrity**: Supabase CRUD operations maintain data consistency across tables
3. **Cross-Portal Sync**: Data created/modified in one portal is reflected in others within acceptable latency
4. **Security**: Role-based access control via Supabase RLS prevents unauthorized data access
5. **Performance**: The SPA loads efficiently, queries are optimized, and animations are smooth
6. **Reliability**: Offline detection, session recovery, and error boundaries handle failures gracefully
7. **Regression Prevention**: Existing functionality is not broken by new changes

---

## 4. Scope of Testing

### In Scope

| Area | Details |
|------|---------|
| **Public Website** | All 17 public routes — Landing, About, Programs, Consultation, FAQ, Contact, Gallery, Mentorship, Auth, Apply, Booking, Book Call, Privacy, Terms, Reset Password, Consultation Overview, 404 |
| **Student Portal** | All 13 student routes — Dashboard, Programs, Journal, Goals, Tasks, Reviews, Forms, Sessions, Messages, Resources, Events, Profile, Settings |
| **Mentor Dashboard** | All 14+ mentor tabs — Overview, Applications, Mentees, Feedback, Bookings, Messaging, Events, Programs, Sessions, Resources, Analytics, AI, Gallery, Emails, Growth Audit, Program Progress |
| **Shared Features** | Store, Survey, Settings (shared between student and mentor) |
| **Authentication** | Login, Signup (invitation), Password Reset, Session Management, Idle Recovery |
| **Supabase Data Layer** | All CRUD operations across 42+ tables via SDK, RLS policies, Edge Functions, Storage, Realtime |
| **Cross-Portal Sync** | Data synchronization between student and mentor portals via TanStack Query + Realtime |
| **Notifications** | In-app notification storage, retrieval, real-time updates, unread counts |
| **Email** | Transactional emails via Resend Edge Function — welcome, reminders, summaries |
| **Security** | RLS isolation, XSS (DOMPurify), auth bypass, error monitoring |
| **Performance** | Page load metrics, query performance, TanStack Query cache efficiency, bundle size |

### Out of Scope

- OAuth / Social login (not implemented)
- MFA / Two-factor authentication (not implemented)
- Stripe / Payment processing (not implemented)
- WhatsApp integration (UI exists but incomplete)
- Video streaming / HLS player (dependency exists but no UI)
- Voice message recording (UI exists but incomplete)
- Google Calendar sync (not implemented)
- Native mobile apps (web-only)
- Load testing (k6 not configured — future consideration)
- Visual regression testing (no infrastructure)

---

## 6. Testing Levels

### 6.1 Unit Testing (Level 1)

**Framework**: Vitest (configured in `package.json`)
**Scope**: Individual services, hooks, utilities, and components in isolation

| Target | Examples | Tool |
|--------|---------|------|
| Services | `authService`, `applicationService`, `taskService`, `bookingService` | Vitest + MSW |
| Hooks | `useApplications`, `useTasks`, `useGoals` | Vitest + custom render |
| Utilities | `dateUtils`, `progressUtils`, `errorHandler`, `logger`, `envValidator` | Vitest |
| Components | `ContactForm`, `NotificationDropdown`, `EmptyState`, `ConfirmDialog` | Vitest + React Testing Library |
| Contexts | `AuthContext`, `ConnectionContext` | Vitest + custom render |
| Edge Function Integration | `approve-application`, `gemini`, `resend` | Vitest + MSW |

**Existing test files**: Found in `src/**/__tests__/` — `authService.test.ts`, `applicationService.test.ts`, `approveApplicationViaEdge.test.ts`, `taskService.test.ts`, `rls-isolation.test.ts`, `errorHandler.test.ts`, `logger.test.ts`, `envValidator.test.ts`, `dateUtils.test.ts`, `progressUtils.test.ts`, `AuthContext.test.tsx`

### 6.2 Integration Testing (Level 2)

**Scope**: Interactions between components, hooks, and Supabase

| Integration Point | Verification |
|------------------|-------------|
| Hook → Supabase SDK | Query returns expected `{data, error}` shape |
| Component → Zustand Store | Store updates on user interaction |
| Component → TanStack Query | Cache invalidation triggers refetch |
| Component → Sonner Toast | Toast shown on success/error |
| Auth Context → Supabase Auth | `signInWithPassword` → session state |
| Connection Context → Online/Offline | UI reacts to connection changes |

### 6.3 End-to-End Testing (Level 3)

**Framework**: Playwright
**Configuration**: `playwright.config.ts` — 9 projects (setup, 4 role-specific, cross-browser x3, mobile x2)
**Base URL**: `https://today-ten-zeta.vercel.app`
**Auth Setup**: `e2e/auth.setup.ts` — authenticates mentor + student1 via Supabase

| Project | Target | Test Files |
|---------|--------|-----------|
| chromium-visitor | Public routes, auth page, application | `e2e/visitor-flow.spec.ts`, `e2e/landing.spec.ts`, `e2e/auth.spec.ts` |
| chromium-mentor | Mentor dashboard all tabs | `e2e/mentor-flow.spec.ts`, `e2e/mentor/mentor-journey.spec.ts` |
| chromium-student1 | Student portal all modules | `e2e/student-flow.spec.ts`, `e2e/student/student-journey.spec.ts` |
| chromium | Cross-cutting tests | Discovery, auth, application, error monitoring |
| firefox | Cross-browser verification | Same as chromium (role-specific excluded) |
| webkit | Cross-browser verification | Same as chromium |
| mobile-chrome | Mobile viewport | Same as chromium |
| mobile-safari | Mobile viewport | Same as chromium |

**Existing E2E test files (18 total)**:

| File | Coverage |
|------|----------|
| `e2e/auth.setup.ts` | Auth setup for mentor + student1 |
| `e2e/auth.spec.ts` | Auth page UI elements |
| `e2e/authentication/auth.spec.ts` | Login form, validation, errors, redirects |
| `e2e/landing.spec.ts` | Landing page brand, nav, CTA, footer |
| `e2e/application.spec.ts` | 4-step application form submission |
| `e2e/student-flow.spec.ts` | Student dashboard, goals, tasks, journal, sessions, messaging, resources, events, profile |
| `e2e/student/student-journey.spec.ts` | Comprehensive student journey |
| `e2e/student-dashboard.spec.ts` | Mocked API student dashboard (MSW) |
| `e2e/student-isolation.spec.ts` | Student2 cannot see Student1 data |
| `e2e/mentor-flow.spec.ts` | Mentor overview, applications, mentees, messaging, resources, sessions, analytics, settings |
| `e2e/mentor/mentor-journey.spec.ts` | Comprehensive mentor journey |
| `e2e/visitor-flow.spec.ts` | Public routes, auth, application, redirects |
| `e2e/realtime.spec.ts` | (ALL SKIPPED) Realtime message tests |
| `e2e/security/cross-role.spec.ts` | Cross-role access restrictions |
| `e2e/security/error-monitoring.spec.ts` | Console errors, network errors, CSP, Supabase health |
| `e2e/smoke/discovery.spec.ts` | Crawls 45+ routes for status, title, interactive elements |
| `e2e/debug-auth.spec.ts` | Auth mocking approaches |

---

## 7. Testing Types

| Type | Description | Tools |
|------|-------------|-------|
| **Functional** | Verify features work per specification | Playwright, Vitest |
| **UI/UX** | Verify layout, styling, responsiveness, animations | Playwright, manual |
| **Integration** | Verify component → Supabase → component data flow | Vitest, MSW |
| **Security** | Verify RLS, auth, XSS, error handling | Playwright, Vitest |
| **Performance** | Verify load time, query speed, animation FPS | Lighthouse, Chrome DevTools |
| **Regression** | Verify existing features after changes | Playwright (all projects) |
| **Smoke** | Verify critical paths on each deployment | Playwright (chromium-visitor/mentor/student1) |
| **Cross-Browser** | Verify functionality across Chrome, Firefox, Safari | Playwright (chromium, firefox, webkit) |
| **Mobile** | Verify responsive behavior on mobile viewports | Playwright (mobile-chrome, mobile-safari) |
| **Accessibility** | Verify basic a11y compliance | Playwright, axe-core (future) |
| **Realtime** | Verify Supabase Realtime subscription behavior | Playwright (currently skipped) |
| **Offline** | Verify ConnectionContext offline/online transitions | Manual (future Playwright) |

---

## 8. Test Environment

### Environments

| Environment | URL | Supabase Project | Notes |
|-------------|-----|-----------------|-------|
| **Production** | `https://today-ten-zeta.vercel.app` | `jnazlfhhzxrocvxvmkkc` | Live user data |
| **Staging** | Same (no separate staging) | Same | Testing against production Supabase |
| **Local Dev** | `http://localhost:5173` | Local/configurable | Vite dev server |

### Playwright Execution

```
npx playwright test                          # Run all tests (9 projects)
npx playwright test --project=chromium-student1  # Run student tests only
npx playwright test --project=chromium-mentor    # Run mentor tests only
npx playwright test --project=chromium-visitor   # Run visitor tests only
npx playwright test e2e/student-flow.spec.ts     # Run specific spec
npx playwright test --headed           # Run with browser visible
npx playwright test --debug            # Run with Playwright Inspector
```

### Vitest Execution

```
npx vitest run                          # Run all unit tests
npx vitest                              # Watch mode
npx vitest --coverage                   # Run with coverage report
```

---

## 9. Test Data Strategy

### Test Users (from `docs/TEST_USERS.md`)

| Role | Email | Data |
|------|-------|------|
| Mentor | `mentor.qa@mentorino.test` | Manages 2 students, approves applications, creates tasks |
| Student1 | `student1.qa@mentorino.test` | PM mentee, 3 goals, 3 tasks, 2 sessions |
| Student2 | `student2.qa@mentorino.test` | Cybersecurity mentee, 3 goals, 2 tasks, 2 sessions |
| Visitor | (no auth) | One pending application |

**Security**: Staging-only accounts. Passwords in staging vault, not in source.

### Data Seeding

Test users have pre-seeded data:
- **Goals** (3 each) with milestones
- **Tasks** assigned by mentor
- **Sessions** scheduled
- **Conversations** with mentor (messages)
- **Notifications** (session reminders, task due, system)
- **Timeline events** (application, goals, sessions)
- **Journal entries** (daily + weekly)
- **Student progress** tracked

---

## 10. Automation Strategy

### Tier 1 — Critical Path (100% Automated)

- Authentication flows (login, logout, password reset)
- Dashboard loading for all three roles
- Core CRUD (goals, tasks, sessions, journals)
- Messaging (send, receive, conversation list)
- Application submission (visitor)
- Application review (mentor approve/reject)
- Navigation and route protection
- Cross-role data isolation

### Tier 2 — Important (70%+ Automated)

- Resource management (upload, assign, view)
- Event CRUD (create, edit, RSVP)
- Program enrollment and progress
- Settings/profile editing
- Gallery management
- File upload/shared files
- Store browsing
- Survey submission

### Tier 3 — Nice to Have (Automate as feasible)

- AI Dashboard interactions
- Analytics BI charts
- Realtime synchronization edge cases
- Offline/connection recovery
- Form builder (custom forms)
- Credential issuing
- Growth audits
- Voice messages

### Tier 4 — Manual Only

- Visual design consistency
- Animation smoothness
- Accessibility compliance (until axe-core integrated)
- Cross-browser visual differences
- Production-specific checks (Sentry, env vars)

---

## 11. Manual Testing Strategy

Manual testing focuses on areas difficult to automate:

- **Exploratory Testing**: Unscripted testing of new features
- **Usability Testing**: Navigation flow, information architecture
- **Visual Testing**: Design consistency, responsive breakpoints
- **Edge Case Discovery**: Unusual data combinations, rapid interactions
- **Production Verification**: Post-deployment smoke tests on live environment

---

## 12. Defect Management

| Severity | Definition | Response Time | Resolution Target |
|----------|-----------|--------------|------------------|
| **Blocker** | Prevents further testing, data loss, security breach | Immediate | 4 hours |
| **Critical** | Major feature broken, no workaround | 1 hour | 24 hours |
| **Major** | Feature broken but workaround exists | 4 hours | 3 days |
| **Minor** | Cosmetic issue, non-critical UI glitch | 24 hours | Next sprint |
| **Trivial** | Typo, very minor styling | 48 hours | Backlog |

### Defect Fields

- ID, Title, Description, Steps to Reproduce, Expected vs Actual
- Environment, Browser, Screen Size
- Severity, Priority
- Screenshot/Video (Playwright trace/video)
- Console errors (Sentry event ID if available)
- Assigned To, Status, Resolution

---

## 13. Entry and Exit Criteria

### Test Execution Entry Criteria

- Code deployed to target environment
- Smoke tests pass (discovery spec)
- Test users exist with seeded data
- No P1/P2 defects open against feature under test

### Test Execution Exit Criteria

- All P0-P2 test cases executed
- No P0/P1 defects unresolved
- Regression suite passes at 95%+
- Performance within baseline thresholds
- Security tests pass (RLS, authentication, XSS)

### Release Exit Criteria

- Full regression suite passes
- Production readiness checklist complete
- Sentry error rate stable or improved
- Supabase query performance within norms

---

## 14. Roles and Responsibilities

| Role | Responsibility |
|------|---------------|
| QA Lead | Strategy, planning, reporting, sign-off |
| QA Engineer | Test case creation, manual testing, defect reporting |
| Automation Engineer | Playwright + Vitest test development and maintenance |
| Developer | Unit tests, bug fixes, test support |
| Product Owner | Feature acceptance, priority decisions |
| DevOps | Environment setup, CI/CD pipeline |

---

## 15. Tools and Infrastructure

| Category | Tool | Purpose |
|----------|------|---------|
| **Test Framework (E2E)** | Playwright 1.52+ | Browser automation across Chrome, Firefox, WebKit, mobile |
| **Test Framework (Unit)** | Vitest | Fast unit and integration testing |
| **Mocking** | MSW | Mock Supabase and Edge Function responses |
| **Auth** | Supabase JS SDK | Authentication in Playwright setup |
| **Monitoring** | Sentry | Error tracking and monitoring |
| **Analytics** | PostHog | User behavior analytics |
| **CI** | (TBD — no `.github/` found) | Automated test execution |
| **Reporting** | Playwright HTML Reporter | Visual test reports |
| **Performance** | Lighthouse, Chrome DevTools | Performance measurement |
| **Version Control** | Git | Source and test asset management |

---

## 16. Test Deliverables

| Deliverable | Location | Description |
|-------------|----------|-------------|
| Master Testing Strategy | `docs/testing/QA_Master_Testing_Strategy.md` | This document |
| Student Portal Tests | `docs/testing/Student_Portal_Testing_Specification.md` | QA-STU-002 |
| Mentor Dashboard Tests | `docs/testing/Mentor_Dashboard_Testing_Specification.md` | QA-MNT-003 |
| Public Website Tests | `docs/testing/Public_Website_Testing_Specification.md` | QA-PUB-004 |
| Cross-Portal Sync Tests | `docs/testing/Cross_Portal_Data_Synchronization_Testing.md` | QA-SYNC-005 |
| Database Tests | `docs/testing/Database_Testing_Specification.md` | QA-DB-006 |
| API/Data Layer Tests | `docs/testing/API_Testing_Specification.md` | QA-API-007 |
| Security Tests | `docs/testing/Security_Testing_Specification.md` | QA-SEC-008 |
| Notification Tests | `docs/testing/Notification_Testing_Specification.md` | QA-NOT-009 |
| Email Tests | `docs/testing/Email_Testing_Specification.md` | QA-EML-010 |
| Performance Tests | `docs/testing/Performance_Testing_Specification.md` | QA-PERF-011 |
| Regression Tests | `docs/testing/Regression_Testing_Package.md` | QA-REG-012 |
| Production Checklist | `docs/testing/Production_Readiness_Checklist.md` | QA-PRD-013 |
| Test Case Template | `docs/testing/Test_Case_Template.md` | QA-TPL-014 |
| Playwright Test Files | `e2e/*.spec.ts` | Automated E2E test files |
| Unit Test Files | `src/**/__tests__/*.test.ts` | Automated unit tests |

---

## 17. Risk and Mitigation

| Risk | Impact | Probability | Mitigation |
|------|--------|------------|------------|
| No separate staging environment | Tests run against production Supabase | Medium | Use test users with known data; avoid destructive tests |
| Supabase rate limits on staging | Test flakiness under parallel execution | Medium | Stagger test execution; monitor Supabase usage |
| No CI/CD pipeline | Tests not run automatically | High | Run manually before each release; establish CI as priority |
| Realtime tests all skipped | No sync coverage | High | Prioritize unskipping realtime tests |
| Limited test user data | Hard to test edge cases | Medium | Add seed scripts for test data scenarios |
| Client-side only architecture | No server-side validation to test | Low | Focus on RLS and Supabase constraint testing |

---

## 18. Appendices

### Appendix A: Route Reference

| Portal | Route Prefix | Router |
|--------|-------------|--------|
| Public | `/#/` | HashRouter |
| Student | `/#/student/*` | HashRouter (nested) |
| Mentor | `/#/mentor/*` | HashRouter (query params) |
| Shared | `/#/store`, `/#/survey`, `/#/settings` | HashRouter |

### Appendix B: Supabase Reference

| Resource | Identifier |
|----------|-----------|
| Supabase Project | `jnazlfhhzxrocvxvmkkc` |
| Database Tables | 42+ in `public` schema |
| Storage Buckets | 7 buckets |
| Edge Functions | `approve-application`, `gemini`, `resend` |
| Realtime Channels | 40+ tables published |

### Appendix C: Test ID Prefixes

| Prefix | Portal/Domain |
|--------|--------------|
| PUB | Public Website |
| STU | Student Portal |
| MNT | Mentor Dashboard |
| SYNC | Cross-Portal Sync |
| DB | Database |
| API | API/Data Layer |
| SEC | Security |
| NOT | Notification |
| EML | Email |
| PERF | Performance |
| REG | Regression |
| PRD | Production Readiness |
| TPL | Template |
