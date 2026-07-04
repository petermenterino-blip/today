

# Security Audit Report — Mentorino


## Critical Issues

### C-1: Hardcoded Plaintext Passwords in Source Code

**File:** `src/services/authService.ts:28-101`
**Severity:** CRITICAL
**Description:** 6 mock user accounts with hardcoded passwords (`password123`) are defined in the source code. These are accessible to anyone who inspects the source or opens browser DevTools. The debug login buttons in `Landing.tsx:1044-1058` expose these credentials directly in the UI.

**Risk:** Any user can authenticate as a mentor or student with known credentials.

**Fix:** Remove mock users from production build. Disable mock mode in production environment.


### C-2: No Registration/Signup Flow — Profile Created Without Auth User

**File:** `src/services/applicationService.ts:257-271`
**Severity:** CRITICAL
**Description:** When a mentor approves an application, a `StudentProfile` is created via `studentService.create()`, but **no Supabase Auth user is created**. The applicant has no way to log in — no password, no invitation email, no auth entry.

**Risk:** Approved applicants are locked out of the system. Data integrity issue — profiles exist without corresponding auth users.

**Fix:** Either create a Supabase Auth user on approval, or implement an invitation email flow with password setup.


## High Issues

### H-1: `.env.local` Committed to Version Control

**File:** `.env.local`
**Severity:** HIGH
**Description:** The local environment file containing real Supabase project URL and anon key is present in the repository alongside `.env.example`. If this repo is made public, the Supabase project URL and anon key are exposed.

**Risk:** While anon keys are public by design, committing them to version control is against security best practices and may expose the project to targeted attacks.

**Fix:** Add `.env.local` to `.gitignore`. Use `.env.example` for template values only.


### H-2: Storage Bucket RLS Policy References Non-Existent Column

**File:** `supabase/migrations/014_storage.sql:24`
**Severity:** HIGH
**Description:** The policy `"docs_mentor_read_assigned"` references `profiles.mentor_id` — a column that does not exist in the `profiles` table schema.

**Risk:** Storage RLS policy will fail at runtime, potentially locking mentors out of assigned student documents or exposing data incorrectly.

**Fix:** Either add `mentor_id` to the `profiles` table, or fix the policy to use the correct column reference.


### H-3: Full User Profiles Stored in localStorage

**Files:** `src/services/authService.ts:174`, `src/context/AuthContext.tsx:62`
**Severity:** HIGH
**Description:** Full user profile data (including role, email, name, application status) is stored in `localStorage` under predictable keys (`mentorino_auth_user`, `mentorino_mock_users`). This data is accessible to any JavaScript running on the same origin.

**Risk:** XSS vulnerability exposes all user data.

**Fix:** Store only session tokens; fetch profile data from server on each session.


## Medium Issues

### M-1: `CORS_HEADERS` Allow All Origins

**Files:** All 5 edge functions
**Severity:** MEDIUM
**Description:** All edge functions set `Access-Control-Allow-Origin: '*'`. While acceptable for Supabase Functions (which have their own auth gateway via the anon key), it broadens the attack surface.


### M-2: Google OAuth Tokens Transmitted in Request Body

**File:** `src/services/edgeFunctionService.ts:65-71`
**Severity:** MEDIUM
**Description:** Google OAuth access tokens are sent in the request body to the `calendar` and `meet` edge functions. Supabase Functions logs may capture these tokens.


### M-3: Missing Input Validation on Edge Functions

**Files:** All 5 edge functions
**Severity:** MEDIUM
**Description:** No input validation (e.g., zod schemas) on edge function request bodies. Malformed or malicious payloads could trigger unexpected behavior.


### M-4: TypeScript `as any` Casts Bypass Type Safety

**Files:** `authService.ts:168`, `AuthContext.tsx:51`, `goalStorage.ts:71`, multiple others
**Severity:** MEDIUM
**Description:** Multiple `as any` casts throughout the codebase bypass TypeScript's type safety, potentially hiding type mismatches at compile time.


## Low Issues

### L-1: No Rate Limiting on Auth Endpoints
Edge functions have no rate limiting configured. Brute-force attacks on auth are possible.

### L-2: Input Sanitization
No evidence of XSS prevention on user-generated content displayed in messaging, goals, journals, or forms.

### L-3: No HTTP Security Headers
No CSP, HSTS, or X-Frame-Options headers configured (Vite default).

### L-4: `admin` Role Missing from Frontend Types
`UserRole` type in `src/types/index.ts` only includes `'student' | 'mentor' | 'visitor'` but `'admin'` is used in DB migration `001_profiles.sql`.


## Summary

| Severity | Count |
|----------|-------|
| CRITICAL | 2 |
| HIGH | 3 |
| MEDIUM | 4 |
| LOW | 4 |
| **Total** | **13** |

**Security Readiness: NOT READY**
