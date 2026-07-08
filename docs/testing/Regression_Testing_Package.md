# Regression Testing Package

| Document ID | QA-REG-012 |
|---|---|
| Document Title | Regression Testing Package |
| Version | 1.0 |
| Status | Draft |
| Author | QA Team |
| Date | 2026-07-08 |

---

## Revision History

| Version | Date | Author | Description |
|---------|------|--------|-------------|
| 1.0 | 2026-07-08 | QA Team | Initial release — comprehensive regression suite for Mentorino |

---

## 1. Introduction

This document defines the regression testing package for Mentorino — the complete set of tests that must pass before each release. The regression suite covers all three portals, cross-cutting concerns, and the Supabase data layer.

### Test Execution Strategy

| Regression Level | Scope | Frequency | Estimated Duration |
|-----------------|-------|-----------|-------------------|
| **Smoke** | Critical paths only — auth, landing, dashboard load | Every deployment | ~5 min |
| **Full** | All automated tests | Before release | ~30 min |
| **Manual** | Visual, UX, edge cases | Before major release | ~2-4 hours |

### Test Inventory

| Category | Automated (Playwright) | Automated (Vitest) | Manual | Total |
|----------|----------------------|-------------------|--------|-------|
| Public Website | 16 | 0 | 0 | 16 |
| Student Portal | 14 | 8 | 2 | 24 |
| Mentor Dashboard | 18 | 5 | 3 | 26 |
| Cross-Portal Sync | 0 | 0 | 10 | 10 |
| Database | 2 | 5 | 6 | 13 |
| API / Data Layer | 4 | 6 | 2 | 12 |
| Security | 8 | 2 | 2 | 12 |
| Notification | 0 | 2 | 6 | 8 |
| Email | 0 | 3 | 5 | 8 |
| Performance | 0 | 0 | 8 | 8 |
| **Total** | **62** | **31** | **44** | **137** |

---

## 2. Smoke Test Suite

Smoke tests verify critical paths. These must pass on every deployment.

| ID | Description | Playwright Spec | Project |
|----|-------------|----------------|---------|
| REG-SMOKE-001 | Landing page loads correctly | `e2e/landing.spec.ts` | chromium |
| REG-SMOKE-002 | Auth page renders and login works | `e2e/authentication/auth.spec.ts` | chromium-student1 |
| REG-SMOKE-003 | Student dashboard loads after login | `e2e/student-flow.spec.ts` | chromium-student1 |
| REG-SMOKE-004 | Mentor dashboard loads after login | `e2e/mentor-flow.spec.ts` | chromium-mentor |
| REG-SMOKE-005 | Application form submission | `e2e/application.spec.ts` | chromium-visitor |
| REG-SMOKE-006 | Visitor routes are accessible | `e2e/visitor-flow.spec.ts` | chromium-visitor |
| REG-SMOKE-007 | Protected routes redirect unauthenticated | `e2e/security/cross-role.spec.ts` | chromium |
| REG-SMOKE-008 | No console errors on public routes | `e2e/security/error-monitoring.spec.ts` | chromium |

---

## 3. Full Regression Test Suite (by Document)

### 3.1 Public Website (QA-PUB-004)

| Test ID | Description | Automated | Playwright Project |
|---------|-------------|-----------|-------------------|
| PUB-TC-001 | Landing page load & visual structure | ✅ | chromium, firefox, webkit, mobile |
| PUB-TC-002 | Navigation bar links | ✅ | chromium |
| PUB-TC-004 | About page | ✅ | discovery spec |
| PUB-TC-005 | Programs page | ✅ | discovery spec |
| PUB-TC-006 | 404 not found page | ✅ | discovery spec |
| PUB-TC-007 | Login form validation | ✅ | chromium-student1 |
| PUB-TC-008 | Invalid credentials error | ✅ | chromium-student1 |
| PUB-TC-009 | Authenticated redirect from auth | ✅ | chromium-student1 |
| PUB-TC-010 | Application form navigation | ✅ | chromium-visitor |
| PUB-TC-011 | Complete application submission | ✅ | chromium-visitor |
| PUB-TC-012 | Booking page | ✅ | chromium-visitor |
| PUB-TC-013 | Store page | ✅ | chromium-student1 |
| PUB-TC-014 | Survey page | ✅ | chromium-student1 |
| PUB-TC-015 | Reset password form | ✅ | chromium |
| PUB-TC-016 | Pending approval page | ⚠️ | manual |

### 3.2 Student Portal (QA-STU-002)

| Test ID | Description | Automated | Playwright Project |
|---------|-------------|-----------|-------------------|
| STU-TC-001 | Student dashboard load | ✅ | chromium-student1 |
| STU-TC-002 | Dashboard stats cards | ✅ | chromium-student1 |
| STU-TC-003 | Create goal | ✅ | chromium-student1 |
| STU-TC-004 | Edit goal | ✅ | chromium-student1 |
| STU-TC-005 | Delete goal | ✅ | chromium-student1 |
| STU-TC-006 | Task list view | ✅ | chromium-student1 |
| STU-TC-007 | Submit task | ⚠️ | chromium-student1 (partial) |
| STU-TC-008 | Create journal entry | ✅ | chromium-student1 |
| STU-TC-009 | Send message | ✅ | chromium-student1 |
| STU-TC-010 | Receive message in real-time | ⚠️ | skipped (realtime) |
| STU-TC-011 | Edit profile | ✅ | chromium-student1 |
| STU-TC-012 | Avatar upload | ⚠️ | chromium-student1 (partial) |
| STU-TC-013 | Settings notification prefs | ❌ | not automated |
| STU-TC-014 | Student cannot access mentor routes | ✅ | chromium-student1 |

### 3.3 Mentor Dashboard (QA-MNT-003)

| Test ID | Description | Automated | Playwright Project |
|---------|-------------|-----------|-------------------|
| MNT-TC-001 | Overview tab load | ✅ | chromium-mentor |
| MNT-TC-002 | Tab navigation | ✅ | chromium-mentor |
| MNT-TC-003 | Applications list | ✅ | chromium-mentor |
| MNT-TC-004 | Approve application | ✅ | chromium-mentor |
| MNT-TC-005 | Reject application | ⚠️ | chromium-mentor (partial) |
| MNT-TC-006 | Send message to student | ✅ | chromium-mentor |
| MNT-TC-007 | Schedule session | ✅ | chromium-mentor |
| MNT-TC-008 | AI dashboard load | ✅ | chromium-mentor |
| MNT-TC-009 | Analytics BI dashboard | ✅ | chromium-mentor |
| MNT-TC-010 | Create event | ✅ | chromium-mentor |
| MNT-TC-011 | Upload resource | ✅ | chromium-mentor |
| MNT-TC-012 | Gallery management | ✅ | chromium-mentor |
| MNT-TC-013 | Visitor bookings | ✅ | chromium-mentor |
| MNT-TC-014 | Revenue dashboard | ❌ | not automated |
| MNT-TC-015 | Growth audit | ✅ | chromium-mentor |
| MNT-TC-016 | Program progress | ✅ | chromium-mentor |
| MNT-TC-017 | Email templates | ❌ | not automated |
| MNT-TC-018 | Mentor cannot access student routes | ✅ | chromium-mentor |

### 3.4 Cross-Portal Sync (QA-SYNC-005)

| Test ID | Description | Automated | Notes |
|---------|-------------|-----------|-------|
| SYNC-TC-001 | Task created by mentor → student sees | ⚠️ | realtime tests skipped |
| SYNC-TC-002 | Journal submitted by student → mentor sees | ⚠️ | realtime tests skipped |
| SYNC-TC-003 | Message exchange between portals | ⚠️ | realtime tests skipped |
| SYNC-TC-004 | Session schedule sync | ❌ | not automated |
| SYNC-TC-005 | Goal progress sync | ❌ | not automated |
| SYNC-TC-006 | Event RSVP sync | ❌ | not automated |
| SYNC-TC-007 | Resource completion sync | ❌ | not automated |
| SYNC-TC-008 | Offline handling | ❌ | manual |
| SYNC-TC-009 | Idle recovery session validation | ❌ | manual |
| SYNC-TC-010 | Cross-tab localStorage sync | ❌ | manual |

### 3.5 Database (QA-DB-006)

| Test ID | Description | Automated | Tool |
|---------|-------------|-----------|------|
| DB-TC-001 | Core tables exist | ❌ | schema check |
| DB-TC-002 | Required columns present | ❌ | schema check |
| DB-TC-003 | Foreign key integrity | ❌ | manual |
| DB-TC-004 | Unique constraints | ❌ | manual |
| DB-TC-005 | Student RLS — own data only | ✅ | Vitest / Playwright |
| DB-TC-006 | Mentor RLS — can read own students | ✅ | Playwright |
| DB-TC-007 | Visitor RLS — no access | ✅ | Playwright |
| DB-TC-008 | Handle new user trigger | ❌ | manual |
| DB-TC-009 | Updated at trigger | ❌ | manual |
| DB-TC-010 | Storage bucket CRUD | ⚠️ | partial (Playwright) |
| DB-TC-011 | Insert notification RPC | ❌ | manual |
| DB-TC-012 | is_mentor() helper | ❌ | manual |
| DB-TC-013 | Query performance | ❌ | manual |

### 3.6 API / Data Layer (QA-API-007)

| Test ID | Description | Automated | Tool |
|---------|-------------|-----------|------|
| API-TC-001 | Select goals by student ID | ❌ | Vitest |
| API-TC-002 | Insert goal | ❌ | Vitest |
| API-TC-003 | Update goal | ❌ | Vitest |
| API-TC-004 | Delete goal | ❌ | Vitest |
| API-TC-005 | Select messages by conversation | ❌ | Vitest |
| API-TC-006 | Paginated query with range | ❌ | Vitest |
| API-TC-007 | Approve application edge function | ✅ | Vitest |
| API-TC-008 | Gemini AI edge function | ❌ | Vitest |
| API-TC-009 | Resend email edge function | ❌ | Vitest |
| API-TC-010 | Sign in with password | ✅ | Playwright |
| API-TC-011 | Get current session | ✅ | Playwright |
| API-TC-012 | Storage file upload | ⚠️ | partial (Playwright) |
| API-TC-013 | Realtime channel subscription | ⚠️ | skipped (Playwright) |

### 3.7 Security (QA-SEC-008)

| Test ID | Description | Automated | Tool |
|---------|-------------|-----------|------|
| SEC-TC-001 | Invalid credentials handling | ✅ | Playwright |
| SEC-TC-002 | Session persistence and expiry | ✅ | Playwright |
| SEC-TC-003 | Cross-student data isolation | ✅ | Playwright / Vitest |
| SEC-TC-004 | Student cannot access mentor routes | ✅ | Playwright |
| SEC-TC-005 | Mentor cannot access student routes | ✅ | Playwright |
| SEC-TC-006 | Unauthenticated route protection | ✅ | Playwright |
| SEC-TC-007 | XSS via user input | ❌ | Manual |
| SEC-TC-008 | Console error monitoring | ✅ | Playwright |
| SEC-TC-009 | Sentry error tracking | ❌ | Manual |
| SEC-TC-010 | Production guard validation | ❌ | Manual |
| SEC-TC-011 | IDOR — UUID manipulation | ✅ | Playwright |

### 3.8 Notification (QA-NOT-009)

| Test ID | Description | Automated | Notes |
|---------|-------------|-----------|-------|
| NOT-TC-001 | Create notification via RPC | ❌ | Vitest |
| NOT-TC-002 | Mark notification as read | ❌ | Playwright |
| NOT-TC-003 | Mark all as read | ❌ | Playwright |
| NOT-TC-004 | Empty notification state | ❌ | Playwright |
| NOT-TC-005 | Real-time notification reception | ⚠️ | replay tests skipped |
| NOT-TC-006 | Notification dropdown interaction | ❌ | Playwright |
| NOT-TC-007 | Session reminder notification | ❌ | Manual (cron) |
| NOT-TC-008 | Task due notification | ❌ | Manual (cron) |

### 3.9 Email (QA-EML-010)

| Test ID | Description | Automated | Notes |
|---------|-------------|-----------|-------|
| EML-TC-001 | Fetch all templates | ❌ | Vitest |
| EML-TC-002 | Fetch template by key | ❌ | Vitest |
| EML-TC-003 | Render template with variables | ❌ | Vitest |
| EML-TC-004 | Send templated email | ❌ | Vitest |
| EML-TC-005 | Send with invalid address | ❌ | Vitest |
| EML-TC-006 | Send broadcast email | ❌ | Vitest |
| EML-TC-007 | Session reminder email (24h) | ❌ | Manual |
| EML-TC-008 | Welcome email on approval | ❌ | Manual |

### 3.10 Performance (QA-PERF-011)

| Test ID | Description | Automated | Notes |
|---------|-------------|-----------|-------|
| PERF-TC-001 | Landing page load time | ❌ | Lighthouse |
| PERF-TC-002 | Student dashboard load | ❌ | Lighthouse |
| PERF-TC-003 | Supabase query execution time | ❌ | DevTools |
| PERF-TC-004 | TanStack Query cache hit rate | ❌ | DevTools |
| PERF-TC-005 | Lazy loaded chunks | ❌ | DevTools |
| PERF-TC-006 | Recharts rendering performance | ❌ | DevTools |
| PERF-TC-007 | Message list scroll performance | ❌ | DevTools |
| PERF-TC-008 | Motion animation smoothness | ❌ | DevTools |

---

## 4. Existing Test Files Reference

### 4.1 Playwright E2E Specs (18 files)

| File | Lines | Coverage | Status |
|------|-------|----------|--------|
| `e2e/auth.setup.ts` | — | Auth setup for mentor + student1 | ✅ |
| `e2e/auth.spec.ts` | — | Auth page UI elements | ✅ |
| `e2e/authentication/auth.spec.ts` | — | Login form, validation, errors | ✅ |
| `e2e/landing.spec.ts` | — | Landing page brand, nav, CTA, footer | ✅ |
| `e2e/application.spec.ts` | — | 4-step application form | ✅ |
| `e2e/student-flow.spec.ts` | — | Student dashboard, goals, tasks, journal | ✅ |
| `e2e/student/student-journey.spec.ts` | — | Comprehensive student journey | ✅ |
| `e2e/student-dashboard.spec.ts` | — | Mocked API student dashboard | ✅ |
| `e2e/student-isolation.spec.ts` | — | Student2 cannot see Student1 data | ✅ |
| `e2e/mentor-flow.spec.ts` | — | Mentor all tabs | ✅ |
| `e2e/mentor/mentor-journey.spec.ts` | — | Comprehensive mentor journey | ✅ |
| `e2e/visitor-flow.spec.ts` | — | Public routes, auth, application | ✅ |
| `e2e/realtime.spec.ts` | — | ALL SKIPPED — messaging sync | ⚠️ |
| `e2e/security/cross-role.spec.ts` | — | Cross-role access | ✅ |
| `e2e/security/error-monitoring.spec.ts` | — | Console errors, CSP, health | ✅ |
| `e2e/smoke/discovery.spec.ts` | — | 45+ route discovery | ✅ |
| `e2e/debug-auth.spec.ts` | — | Auth mocking approaches | ✅ |

### 4.2 Vitest Unit Tests (11 files)

| File | Coverage |
|------|----------|
| `src/__tests__/authService.test.ts` | Auth service functions |
| `src/__tests__/applicationService.test.ts` | Application service |
| `src/__tests__/approveApplicationViaEdge.test.ts` | Edge function integration |
| `src/__tests__/taskService.test.ts` | Task service CRUD |
| `src/__tests__/rls-isolation.test.ts` | RLS policy testing |
| `src/__tests__/errorHandler.test.ts` | Error handling |
| `src/__tests__/logger.test.ts` | Logger utility |
| `src/__tests__/envValidator.test.ts` | Environment validation |
| `src/__tests__/dateUtils.test.ts` | Date utilities |
| `src/__tests__/progressUtils.test.ts` | Progress calculation |
| `src/__tests__/AuthContext.test.tsx` | Auth context behavior |

---

## 5. Traceability Matrix

| Feature Area | Test Doc | Test Cases | Automated | Manual | Coverage % |
|-------------|----------|-----------|-----------|--------|------------|
| Public Website | QA-PUB-004 | 16 | 14 | 2 | 87% |
| Student Portal | QA-STU-002 | 14 | 12 | 2 | 85% |
| Mentor Dashboard | QA-MNT-003 | 18 | 16 | 2 | 89% |
| Cross-Portal Sync | QA-SYNC-005 | 10 | 0 | 10 | 0% |
| Database | QA-DB-006 | 13 | 2 | 11 | 15% |
| API / Data Layer | QA-API-007 | 13 | 4 | 9 | 30% |
| Security | QA-SEC-008 | 11 | 8 | 3 | 72% |
| Notification | QA-NOT-009 | 8 | 0 | 8 | 0% |
| Email | QA-EML-010 | 8 | 0 | 8 | 0% |
| Performance | QA-PERF-011 | 8 | 0 | 8 | 0% |
| **Total** | — | **119** | **56** | **63** | **47%** |

---

## 6. Playwright Projects Summary

| Project | Browsers | Role Auth | Test Files |
|---------|---------|-----------|------------|
| setup | Chrome | — | `auth.setup.ts` |
| chromium-visitor | Chrome | None | visitor, landing, auth, application |
| chromium-mentor | Chrome | mentor | mentor-flow, mentor-journey |
| chromium-student1 | Chrome | student1 | student-flow, student-journey |
| chromium-realtime | Chrome | mentor+student1 | realtime (ALL SKIPPED) |
| chromium | Chrome | setup | discovery, auth, error-monitoring, cross-role, student-isolation |
| firefox | Firefox | setup | Same as chromium (minus role-specific) |
| webkit | Safari | setup | Same as chromium |
| mobile-chrome | Pixel 9 | setup | Same as chromium |
| mobile-safari | iPhone 16 | setup | Same as chromium |

### Execution Commands

```bash
# Smoke tests (fast)
npx playwright test --project=chromium --project=chromium-student1 --project=chromium-mentor --project=chromium-visitor --grep @smoke

# Full regression
npx playwright test

# Single project
npx playwright test --project=chromium-student1

# Specific spec
npx playwright test e2e/student/student-journey.spec.ts

# Unit tests
npx vitest run

# Unit tests with coverage
npx vitest run --coverage
```
