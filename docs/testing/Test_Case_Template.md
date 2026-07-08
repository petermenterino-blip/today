# Test Case Template

| Document ID | QA-TPL-014 |
|---|---|
| Document Title | Test Case Template |
| Version | 1.0 |
| Status | Approved |
| Author | QA Team |
| Date | 2026-07-08 |

---

## Revision History

| Version | Date | Author | Description |
|---------|------|--------|-------------|
| 1.0 | 2026-07-08 | QA Team | Initial release — customized for Mentorino Vite + React 19 + Supabase SDK architecture |

---

## How to Use This Template

1. Copy this template for each test case.
2. Fill in all required fields (marked with *).
3. For Portal-based test cases, use the following prefixes:

| Portal | Prefix | Example |
|--------|--------|---------|
| Public Website | PUB | PUB-TC-001 |
| Student Portal | STU | STU-TC-001 |
| Mentor Dashboard | MNT | MNT-TC-001 |
| Cross-Portal Sync | SYNC | SYNC-TC-001 |
| Database | DB | DB-TC-001 |
| API/Data Layer | API | API-TC-001 |
| Security | SEC | SEC-TC-001 |
| Notification | NOT | NOT-TC-001 |
| Email | EML | EML-TC-001 |
| Performance | PERF | PERF-TC-001 |
| Regression | REG | REG-TC-001 |
| Production Readiness | PRD | PRD-TC-001 |

---

## Template

```markdown
### TC-[NNN]: [Short Descriptive Title]

| Field | Value |
|-------|-------|
| **Test ID** | [PORTAL]-TC-[NNN] |
| **Module** | [Module name e.g., Authentication, Dashboard, Messaging] |
| **Feature** | [Feature name e.g., Login, Goals CRUD, Session Scheduling] |
| **Sub-Feature** | [Specific sub-functionality] |
| **Priority** | [Critical / High / Medium / Low] |
| **Severity** | [Blocker / Critical / Major / Minor / Trivial] |
| **Test Type** | [Functional / UI / Integration / Security / Performance / Regression / Smoke] |
| **Test Data** | [Specific test data required — Supabase table references, user credentials, query parameters] |
| **Preconditions** | [Setup steps required before test execution] |

---

#### Objective

[Clear one-paragraph description of what this test verifies]

---

#### Test Steps

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | [Action] | [Expected behavior] |
| 2 | [Action] | [Expected behavior] |
| 3 | [Action] | [Expected behavior] |
| 4 | [Action] | [Expected behavior] |
| 5 | [Action] | [Expected behavior] |

---

#### Validation Criteria

| Validation Type | Expected Outcome |
|----------------|-----------------|
| **UI** | [Visual confirmation — specific elements visible, text content, styling] |
| **DB / Supabase** | [Supabase query verification — `supabase.from('table').select().eq()` expected row state] |
| **TanStack Query Cache** | [Expected cache key invalidation or data update — e.g., `queryClient.invalidateQueries({queryKey: ['goals']})`] |
| **Zustand Store** | [Expected store state update if applicable — e.g., `useOverviewStore.getState().stats`] |
| **Navigation / HashRouter** | [Expected URL hash change — e.g., `/#/student/goals`] |
| **Supabase Realtime** | [Expected real-time event or debounced invalidation] |
| **Notification** | [Expected in-app notification via `notificationStorage` or `insert_notification()` RPC] |
| **Email** | [Expected email sent via `supabase.functions.invoke('resend')` — to, subject, template] |
| **Toast / Sonner** | [Expected toast notification — success/error/info] |
| **Console / Sentry** | [No console errors; Sentry error count unchanged] |

---

#### Negative Test Cases

| Scenario | Input / Action | Expected Error / Behavior |
|----------|---------------|--------------------------|
| [Scenario] | [Invalid input] | [Supabase error response, toast message, UI validation] |

---

#### Edge Cases

| Scenario | Expected Behavior |
|----------|------------------|
| [Boundary condition] | [Expected handling] |

---

#### Automation Feasibility

| Aspect | Details |
|--------|---------|
| **Automation Possible?** | [Yes / No / Partial] |
| **Tool** | [Playwright / Vitest / Manual] |
| **Playwright Project** | [chromium-visitor / chromium-mentor / chromium-student1 / chromium / firefox / webkit / mobile-chrome / mobile-safari] |
| **Existing Spec File** | [`e2e/[path].spec.ts` — link to existing test file] |
| **Existing Test ID** | [`test.describe` / `test()` title reference if exists] |
| **Estimated Execution Time** | [X seconds / minutes] |

---

## Example: Completed Test Case

### TC-001: Student Login with Valid Credentials

| Field | Value |
|-------|-------|
| **Test ID** | STU-TC-001 |
| **Module** | Authentication |
| **Feature** | Login |
| **Sub-Feature** | Email/Password Authentication |
| **Priority** | Critical |
| **Severity** | Blocker |
| **Test Type** | Functional |
| **Test Data** | Email: `student1.qa@mentorino.test`, Password: `[staging vault]` |
| **Preconditions** | User is on `/#/auth` page, not authenticated, Supabase project is reachable |

---

#### Objective

Verify that a student user can successfully log in using valid email and password credentials via `supabase.auth.signInWithPassword()`, and is redirected to their dashboard.

---

#### Test Steps

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Navigate to `/#/auth` | Auth page renders with login form (email + password inputs, submit button) |
| 2 | Enter valid student email in email field | Email input accepts text, no validation error |
| 3 | Enter valid password in password field | Password input accepts text, characters masked |
| 4 | Click "Sign In" button | Loading state shown on button, Supabase auth call initiated |
| 5 | Wait for authentication | Redirect to `/#/student/dashboard` — student dashboard renders |
| 6 | Verify sidebar navigation | Student navigation items visible: Overview, Programs, Journal, Goals, Tasks, Sessions, Messages, Resources, Events, Profile |

---

#### Validation Criteria

| Validation Type | Expected Outcome |
|----------------|-----------------|
| **UI** | Dashboard renders with overview cards, sidebar shows student navigation |
| **DB / Supabase** | `supabase.auth.getSession()` returns valid session with user.id matching student1 |
| **TanStack Query Cache** | Dashboard queries (goals, tasks, sessions, events) are fetched and cached |
| **Navigation / HashRouter** | URL is `/#/student/dashboard` |
| **Console / Sentry** | No console errors, no Sentry exceptions |

---

#### Negative Test Cases

| Scenario | Input / Action | Expected Error / Behavior |
|----------|---------------|--------------------------|
| Invalid email format | Enter `notanemail` | Client-side validation: "Please enter a valid email address" |
| Wrong password | Valid email + `wrongpassword` | `supabase.auth.signInWithPassword()` returns `{error: {message: "Invalid login credentials"}}`, toast shows "Invalid login credentials" |
| Empty fields | Click Sign In with empty form | Client-side validation: "Email is required" / "Password is required" |
| Non-existent user | `noone@test.com` + any password | Supabase returns `AuthApiError: Invalid login credentials`, toast shown |

---

#### Edge Cases

| Scenario | Expected Behavior |
|----------|------------------|
| Already authenticated user navigates to `/#/auth` | Redirected to `/#/student/dashboard` |
| Network failure during login | `ConnectionContext` shows offline banner, login fails gracefully with error toast |
| Session expired during navigation | `idleRecovery` validates session, redirects to `/#/auth` if invalid |
| Rapid double-click on Sign In | Only one auth request sent (button disabled while loading) |

---

#### Automation Feasibility

| Aspect | Details |
|--------|---------|
| **Automation Possible?** | Yes |
| **Tool** | Playwright |
| **Playwright Project** | chromium-student1 |
| **Existing Spec File** | `e2e/authentication/auth.spec.ts` |
| **Existing Test ID** | Test: "should log in with valid credentials" |
| **Estimated Execution Time** | 15 seconds |
```

---

## Template Field Definitions

| Field | Description |
|-------|-------------|
| **Test ID** | Unique identifier: `{PORTAL}-TC-{NNN}` |
| **Module** | High-level area of the application |
| **Feature** | Specific feature or function being tested |
| **Sub-Feature** | Granular sub-functionality |
| **Priority** | Business/implementation priority for triage |
| **Severity** | Impact level if the test fails |
| **Test Type** | Category of testing |
| **Test Data** | Specific inputs, Supabase table rows, query filters, user credentials |
| **Preconditions** | All setup required before executing step 1 |
| **Objective** | What the test verifies and why |
| **Test Steps** | Numbered actions with expected results |
| **Validation Criteria** | Multi-layer verification (UI, DB/Supabase, TanStack Query, Zustand, Navigation, Realtime, Notification, Email, Toast, Console) |
| **Negative Tests** | Invalid inputs and expected error handling |
| **Edge Cases** | Boundary conditions and special scenarios |
| **Automation Feasibility** | Whether and how to automate, mapping to existing Playwright/Vitest tests |

---

## Quick Reference: Supabase Validation Patterns

| Operation | Supabase Pattern | Validation |
|-----------|-----------------|------------|
| Query | `supabase.from('table').select('*').eq('id', value)` | `{data, error}` — data is array, error is null |
| Single Row | `supabase.from('table').select('*').eq('id', value).single()` | `{data, error}` — data is object or null |
| Insert | `supabase.from('table').insert({...}).select().single()` | `{data, error}` — data is inserted row |
| Update | `supabase.from('table').update({...}).eq('id', value).select().single()` | `{data, error}` — data is updated row |
| Delete | `supabase.from('table').delete().eq('id', value)` | `{data, error}` — data is empty array |
| RPC | `supabase.rpc('function_name', {...})` | `{data, error}` — data is function return |
| Edge Function | `supabase.functions.invoke('name', {body: {...}})` | `{data, error}` — data is function response |
| Auth Sign In | `supabase.auth.signInWithPassword({email, password})` | `{data, error}` — data.session is Session |
| Storage Upload | `supabase.storage.from('bucket').upload(path, file)` | `{data, error}` — data.path is string |
| Realtime | `supabase.channel('name').on('postgres_changes', ...)` | Subscription event callback |
