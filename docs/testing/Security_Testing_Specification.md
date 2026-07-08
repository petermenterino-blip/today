# Security Testing Specification

| Document ID | QA-SEC-008 |
|---|---|
| Document Title | Security Testing Specification |
| Version | 1.0 |
| Status | Draft |
| Author | QA Team |
| Date | 2026-07-08 |

---

## Revision History

| Version | Date | Author | Description |
|---------|------|--------|-------------|
| 1.0 | 2026-07-08 | QA Team | Initial release — customized for Supabase RLS + Vite SPA architecture |

---

## 1. Introduction

This document specifies security testing for Mentorino. Since the app is a **Vite SPA with no backend API layer**, security relies on:

1. **Supabase Row-Level Security (RLS)** — database-level access control
2. **Supabase Auth** — authentication via `supabase.auth.signInWithPassword()`
3. **ProtectedRoute component** — frontend route gating
4. **DOMPurify** — XSS sanitization
5. **Sentry** — error monitoring
6. **productionGuard** — startup environment validation

### Threat Model

| Threat | Mitigation |
|--------|-----------|
| Unauthorized data access | RLS policies on all tables |
| Cross-role data leakage | RLS + ProtectedRoute |
| XSS via user input | DOMPurify sanitization |
| Auth bypass | Supabase Auth JWT validation |
| Session hijacking | Auto-refresh, short-lived tokens |
| IDOR (Insecure Direct Object Reference) | RLS filters by user_id |
| CSRF | Supabase handles via JWT |
| Environment misconfiguration | productionGuard startup checks |

---

## 2. Out of Scope

| Feature | Reason |
|---------|--------|
| OAuth / Social login | Not implemented |
| MFA / 2FA | Not implemented |
| Stripe / Payment security | Not implemented |
| Password hashing | Handled by Supabase Auth |
| Password complexity policy | Handled by Supabase Auth |
| API rate limiting | No API layer — handled by Supabase |
| CSP headers | Not configurable in SPA (Vercel-managed) |
| Penetration testing | Third-party engagement needed |

---

## 3. Test Cases

### Module 3.1: Authentication Security

#### SEC-TC-001: Invalid Credentials Handling

| Field | Value |
|-------|-------|
| **Test ID** | SEC-TC-001 |
| **Module** | Authentication |
| **Feature** | Login Security |
| **Priority** | Critical |
| **Severity** | Critical |
| **Test Type** | Security |
| **Test Data** | Invalid email and password combinations |
| **Preconditions** | Navigate to `/#/auth` |

**Objective**: Verify invalid credentials do not leak user information.

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Enter valid email + wrong password | Error: "Invalid login credentials" |
| 2 | Enter non-existent email + any password | Error: "Invalid login credentials" (same message — no user enumeration) |
| 3 | Enter invalid email format | Client-side validation: "Please enter a valid email address" |
| 4 | Observe error messages | Generic error, no indication of whether email exists |

**Automation**: `e2e/authentication/auth.spec.ts`

---

#### SEC-TC-002: Session Persistence and Expiry

| Field | Value |
|-------|-------|
| **Test ID** | SEC-TC-002 |
| **Module** | Authentication |
| **Feature** | Session Management |
| **Priority** | Critical |
| **Severity** | Critical |
| **Test Type** | Security |
| **Test Data** | Valid user session |
| **Preconditions** | User logged in |

**Objective**: Verify session tokens expire and are handled correctly.

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Login as student1 | Session created |
| 2 | Check localStorage for Supabase session | `supabase-auth-token` or similar stored |
| 3 | Manually clear session | App detects missing session |
| 4 | Navigate to protected page | Redirected to `/#/auth` |
| 5 | Login again with same credentials | New session created |

---

### Module 3.2: RLS / Data Isolation

#### SEC-TC-003: Cross-Student Data Isolation

| Field | Value |
|-------|-------|
| **Test ID** | SEC-TC-003 |
| **Module** | Data Isolation |
| **Feature** | Student Isolation |
| **Priority** | Critical |
| **Severity** | Critical |
| **Test Type** | Security |
| **Test Data** | Student1 and Student2 credentials |
| **Preconditions** | Both students have data |

**Objective**: Verify Student1 cannot access Student2's data.

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Login as Student1 | Dashboard loads with Student1's data |
| 2 | Try to navigate to Student2's profile URL | Blocked or empty |
| 3 | Query goals filtered by Student2's ID | RLS returns empty set |
| 4 | Query tasks not assigned to Student1 | RLS returns empty set |

**Automation**: `e2e/student-isolation.spec.ts`, `src/__tests__/rls-isolation.test.ts`

---

#### SEC-TC-004: Cross-Role Data Isolation (Student → Mentor)

| Field | Value |
|-------|-------|
| **Test ID** | SEC-TC-004 |
| **Module** | Data Isolation |
| **Feature** | Cross-Role Isolation |
| **Priority** | Critical |
| **Severity** | Critical |
| **Test Type** | Security |
| **Test Data** | Student1 authenticated |
| **Preconditions** | Student1 logged in |

**Objective**: Verify student cannot access mentor-only data.

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Login as Student1 | Student dashboard |
| 2 | Navigate to `/#/mentor` | Redirected to `/#/auth` or 404 |
| 3 | Navigate to `/#/mentor?tab=applications` | Redirected or blocked |
| 4 | Navigate to `/#/admin/revenue` | Redirected or blocked |
| 5 | Try to query applications table | RLS returns empty (student has no access) |

**Automation**: `e2e/security/cross-role.spec.ts`

---

#### SEC-TC-005: Cross-Role Data Isolation (Mentor → Student)

| Field | Value |
|-------|-------|
| **Test ID** | SEC-TC-005 |
| **Module** | Data Isolation |
| **Feature** | Cross-Role Isolation |
| **Priority** | Critical |
| **Severity** | Critical |
| **Test Type** | Security |
| **Test Data** | Mentor authenticated |
| **Preconditions** | Mentor logged in |

**Objective**: Verify mentor cannot access student routes.

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Login as mentor | Mentor dashboard |
| 2 | Navigate to `/#/student` | Redirected or blocked |
| 3 | Navigate to `/#/student/goals` | Redirected or blocked |

---

#### SEC-TC-006: Unauthenticated Route Protection

| Field | Value |
|-------|-------|
| **Test ID** | SEC-TC-006 |
| **Module** | Data Isolation |
| **Feature** | Visitor Route Protection |
| **Priority** | Critical |
| **Severity** | Critical |
| **Test Type** | Security |
| **Test Data** | Unauthenticated |
| **Preconditions** | No auth session |

**Objective**: Verify unauthenticated users cannot access protected routes.

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Navigate to `/#/student` | Redirected to `/#/auth` |
| 2 | Navigate to `/#/mentor` | Redirected to `/#/auth` |
| 3 | Navigate to `/#/store` | Redirected to `/#/auth` |
| 4 | Navigate to `/#/survey` | Redirected to `/#/auth` |
| 5 | Navigate to `/#/settings` | Redirected to `/#/auth` |

**Automation**: `e2e/security/cross-role.spec.ts`, `e2e/visitor-flow.spec.ts`

---

### Module 3.3: XSS Prevention

#### SEC-TC-007: XSS via User Input Fields

| Field | Value |
|-------|-------|
| **Test ID** | SEC-TC-007 |
| **Module** | XSS |
| **Feature** | Input Sanitization |
| **Priority** | Critical |
| **Severity** | Critical |
| **Test Type** | Security |
| **Test Data** | `<script>alert('XSS')</script>` in profile name, goal title, message content |
| **Preconditions** | Student1 authenticated |

**Objective**: Verify XSS payloads are sanitized via DOMPurify.

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Update profile name to `<script>alert('XSS')</script>` | DOMPurify sanitizes input, script tag removed or escaped |
| 2 | Create a goal with XSS in title | Title sanitized, no script execution |
| 3 | Send message with XSS content | Message sanitized, no script execution |
| 4 | Verify no alert() fires | No JavaScript execution from injected scripts |

---

### Module 3.4: Error Monitoring

#### SEC-TC-008: Console Error Monitoring

| Field | Value |
|-------|-------|
| **Test ID** | SEC-TC-008 |
| **Module** | Monitoring |
| **Feature** | Console Error Detection |
| **Priority** | High |
| **Severity** | Major |
| **Test Type** | Security / Monitoring |
| **Test Data** | All public routes |
| **Preconditions** | None |

**Objective**: Verify no unhandled errors on any public route.

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Navigate to `/#/` | No console errors |
| 2 | Navigate to `/#/about` | No console errors |
| 3 | Navigate to `/#/programs` | No console errors |
| 4 | Navigate to each public route | Zero console errors on all routes |

**Automation**: `e2e/security/error-monitoring.spec.ts`

---

#### SEC-TC-009: Sentry Error Tracking

| Field | Value |
|-------|-------|
| **Test ID** | SEC-TC-009 |
| **Module** | Monitoring |
| **Feature** | Sentry Integration |
| **Priority** | Medium |
| **Severity** | Major |
| **Test Type** | Security / Monitoring |
| **Test Data** | None |
| **Preconditions** | App configured with Sentry DSN |

**Objective**: Verify Sentry captures unhandled exceptions.

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Trigger an unhandled error (e.g., invalid component state) | Error captured by `@sentry/react` |
| 2 | Check Sentry dashboard (if accessible) | Error event visible with stack trace |
| 3 | Verify expected errors are NOT sent | Auth errors filtered from Sentry |

---

### Module 3.5: Environment Security

#### SEC-TC-010: Production Guard Validation

| Field | Value |
|-------|-------|
| **Test ID** | SEC-TC-010 |
| **Module** | Environment |
| **Feature** | productionGuard |
| **Priority** | High |
| **Severity** | Critical |
| **Test Type** | Security |
| **Test Data** | Missing required env variables |
| **Preconditions** | App startup |

**Objective**: Verify `productionGuard` blocks startup if required env vars are missing.

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Start app with missing `VITE_SUPABASE_URL` | App shows error screen, does not render main UI |
| 2 | Start app with missing `VITE_SUPABASE_ANON_KEY` | App shows error screen |
| 3 | Start app with all required vars | App starts normally |

---

### Module 3.6: IDOR Testing

#### SEC-TC-011: IDOR — Direct UUID Manipulation

| Field | Value |
|-------|-------|
| **Test ID** | SEC-TC-011 |
| **Module** | IDOR |
| **Feature** | Direct Object Reference |
| **Priority** | Critical |
| **Severity** | Critical |
| **Test Type** | Security |
| **Test Data** | Another user's UUID |
| **Preconditions** | Authenticated as Student1 |

**Objective**: Verify user cannot access another user's data by manipulating UUIDs in queries.

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Query goals with another student's UUID | RLS returns empty (not error) |
| 2 | Try to update another student's goal | RLS blocks update |
| 3 | Try to delete another student's goal | RLS blocks delete |

---

## 4. Automation Mapping

| Test Cases | Playwright Spec | Status |
|-----------|----------------|--------|
| SEC-TC-001, SEC-TC-002 | `e2e/authentication/auth.spec.ts` | ✅ Existing |
| SEC-TC-003 | `e2e/student-isolation.spec.ts`, `src/__tests__/rls-isolation.test.ts` | ✅ Existing |
| SEC-TC-004, SEC-TC-005, SEC-TC-006 | `e2e/security/cross-role.spec.ts` | ✅ Existing |
| SEC-TC-007 | Manual / Vitest | ❌ Missing |
| SEC-TC-008 | `e2e/security/error-monitoring.spec.ts` | ✅ Existing |
| SEC-TC-009 | Manual (Sentry dashboard) | ❌ Missing |
| SEC-TC-010 | Manual (env var configuration) | ❌ Missing |
| SEC-TC-011 | `e2e/student-isolation.spec.ts` | ✅ Existing |
