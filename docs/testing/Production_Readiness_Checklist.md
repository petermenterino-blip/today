# Production Readiness Checklist

| Document ID | QA-PRD-013 |
|---|---|
| Document Title | Production Readiness Checklist |
| Version | 1.0 |
| Status | Approved |
| Author | QA Team |
| Date | 2026-07-08 |

---

## Revision History

| Version | Date | Author | Description |
|---------|------|--------|-------------|
| 1.0 | 2026-07-08 | QA Team | Initial release — customized for Mentorino Vite + React + Supabase architecture |

---

## 1. Introduction

This checklist defines the criteria that must be met before any release to production. Each item must be verified and signed off before deployment.

---

## 2. How to Use This Checklist

1. Run through each section before every production release
2. Mark each item as ✅ Pass, ❌ Fail, ⚠️ Not Applicable, or ⬜ Not Checked
3. For ❌ Fail items, document the issue and obtain sign-off from QA Lead
4. Sign and date at the bottom before approving deployment

---

## 3. Pre-Deployment Verification

### 3.1 Code Quality

| # | Item | Status | Notes |
|---|------|--------|-------|
| 3.1.1 | Code compiles without TypeScript errors (`npx tsc --noEmit`) | ⬜ | |
| 3.1.2 | Vite build succeeds (`npx vite build`) | ⬜ | |
| 3.1.3 | No lint warnings or errors (`npx eslint src/`) | ⬜ | |
| 3.1.4 | No `console.log` or `debugger` statements in production code | ⬜ | |
| 3.1.5 | All environment variables are documented in `.env.example` | ⬜ | |
| 3.1.6 | Feature flags verified (`config/features.ts`) | ⬜ | |

### 3.2 Testing

| # | Item | Status | Notes |
|---|------|--------|-------|
| 3.2.1 | Smoke tests pass (REG-SMOKE-001 to REG-SMOKE-008) | ⬜ | |
| 3.2.2 | Full Playwright regression suite passes | ⬜ | |
| 3.2.3 | Vitest unit tests pass (`npx vitest run`) | ⬜ | |
| 3.2.4 | No new console errors on critical routes | ⬜ | |
| 3.2.5 | Cross-browser tests pass (Chrome, Firefox, Safari) | ⬜ | |
| 3.2.6 | Mobile viewport tests pass (Pixel 9, iPhone 16) | ⬜ | |
| 3.2.7 | Student1 isolation tests pass | ⬜ | |
| 3.2.8 | Cross-role access tests pass | ⬜ | |
| 3.2.9 | Error monitoring spec passes (no 4xx/5xx on public routes) | ⬜ | |
| 3.2.10 | Application form submission and approval flow verified | ⬜ | |

### 3.3 Functional Verification

| # | Item | Status | Notes |
|---|------|--------|-------|
| 3.3.1 | Landing page loads correctly at `/#/` | ⬜ | |
| 3.3.2 | All public routes return 200 (no broken pages) | ⬜ | |
| 3.3.3 | Auth page renders and login works for all roles | ⬜ | |
| 3.3.4 | Student dashboard loads with correct data | ⬜ | |
| 3.3.5 | Mentor dashboard loads with correct data | ⬜ | |
| 3.3.6 | Create/Read/Update/Delete operations work on goals | ⬜ | |
| 3.3.7 | Create/Read/Update/Delete operations work on tasks | ⬜ | |
| 3.3.8 | Messaging works between students and mentors | ⬜ | |
| 3.3.9 | Session scheduling and viewing works | ⬜ | |
| 3.3.10 | Application approval flow works via Edge Function | ⬜ | |
| 3.3.11 | Store page loads with products | ⬜ | |
| 3.3.12 | Survey page loads and accepts submissions | ⬜ | |
| 3.3.13 | Settings page loads and saves changes | ⬜ | |

### 3.4 Security

| # | Item | Status | Notes |
|---|------|--------|-------|
| 3.4.1 | RLS policies tested — student isolation verified | ⬜ | |
| 3.4.2 | Cross-role access blocked (student ↔ mentor) | ⬜ | |
| 3.4.3 | Unauthenticated users cannot access protected routes | ⬜ | |
| 3.4.4 | XSS sanitization (DOMPurify) verified on input fields | ⬜ | |
| 3.4.5 | `productionGuard` validates required env vars on startup | ⬜ | |
| 3.4.6 | Supabase RLS policy audit completed | ⬜ | |
| 3.4.7 | Storage bucket public access verified (no leaked private data) | ⬜ | |

### 3.5 Authentication

| # | Item | Status | Notes |
|---|------|--------|-------|
| 3.5.1 | Login works for all roles (mentor, student) | ⬜ | |
| 3.5.2 | Logout clears session and redirects | ⬜ | |
| 3.5.3 | Password reset flow works | ⬜ | |
| 3.5.4 | Session persists across page reloads | ⬜ | |
| 3.5.5 | `idleRecovery` validates session after idle period | ⬜ | |
| 3.5.6 | Already authenticated users redirected from `/#/auth` | ⬜ | |

### 3.6 Data Integrity

| # | Item | Status | Notes |
|---|------|--------|-------|
| 3.6.1 | Create operations persist to correct Supabase tables | ⬜ | |
| 3.6.2 | Update operations modify correct rows | ⬜ | |
| 3.6.3 | Delete operations remove correct rows | ⬜ | |
| 3.6.4 | Foreign key constraints enforced | ⬜ | |
| 3.6.5 | Unique constraints prevent duplicates | ⬜ | |

### 3.7 Monitoring & Observability

| # | Item | Status | Notes |
|---|------|--------|-------|
| 3.7.1 | Sentry DSN configured and capturing errors | ⬜ | |
| 3.7.2 | PostHog configured and tracking events | ⬜ | |
| 3.7.3 | `logger.ts` structured logging works | ⬜ | |
| 3.7.4 | `errorHandler.ts` correctly interprets Supabase errors | ⬜ | |
| 3.7.5 | `healthCheck` utility reports Supabase connectivity | ⬜ | |

### 3.8 Performance

| # | Item | Status | Notes |
|---|------|--------|-------|
| 3.8.1 | Landing page LCP < 2.5s (Lighthouse) | ⬜ | |
| 3.8.2 | Student dashboard loads in < 3s | ⬜ | |
| 3.8.3 | Mentor dashboard loads in < 3s | ⬜ | |
| 3.8.4 | No layout shifts (CLS < 0.1) | ⬜ | |
| 3.8.5 | Supabase queries complete in < 500ms | ⬜ | |

### 3.9 Connectivity & Offline

| # | Item | Status | Notes |
|---|------|--------|-------|
| 3.9.1 | `ConnectionContext` detects online/offline state | ⬜ | |
| 3.9.2 | `OfflineBanner` shown when offline | ⬜ | |
| 3.9.3 | Mutations fail gracefully when offline | ⬜ | |
| 3.9.4 | Reconnection refetches stale data | ⬜ | |

### 3.10 Infrastructure

| # | Item | Status | Notes |
|---|------|--------|-------|
| 3.10.1 | Vite build outputs verified (correct chunks, no missing assets) | ⬜ | |
| 3.10.2 | Supabase project connected with correct credentials | ⬜ | |
| 3.10.3 | Supabase Edge Functions deployed and working | ⬜ | |
| 3.10.4 | Storage buckets configured with correct RLS policies | ⬜ | |
| 3.10.5 | Custom domain working (if applicable) | ⬜ | |
| 3.10.6 | SSL/TLS certificate valid | ⬜ | |

---

## 4. Production Environment Validation

### 4.1 Environment Variables

| Variable | Required | Present | Source |
|----------|----------|---------|--------|
| `VITE_SUPABASE_URL` | Yes | ⬜ | Supabase project settings |
| `VITE_SUPABASE_ANON_KEY` | Yes | ⬜ | Supabase project settings |
| `VITE_SENTRY_DSN` | No (optional) | ⬜ | Sentry project settings |
| `VITE_POSTHOG_KEY` | No (optional) | ⬜ | PostHog project settings |
| `VITE_POSTHOG_HOST` | No (optional) | ⬜ | PostHog instance URL |
| `VITE_GEMINI_API_KEY` | No (optional) | ⬜ | Google AI Studio |

### 4.2 Supabase Project Settings

| Item | Value | Verified |
|------|-------|---------|
| Project URL | `https://jnazlfhhzxrocvxvmkkc.supabase.co` | ⬜ |
| JWT expiry | Default (1 hour) | ⬜ |
| RLS enabled | All production tables | ⬜ |
| Realtime enabled | Required tables | ⬜ |
| Edge Functions deployed | approve-application, gemini, resend | ⬜ |
| Storage buckets public | profile-avatars, gallery-images | ⬜ |

---

## 5. Release Sign-Off

| Role | Name | Signature | Date |
|------|------|-----------|------|
| **QA Lead** | | | |
| **Developer** | | | |
| **Product Owner** | | | |

### Decision

| Option | Selection |
|--------|-----------|
| ✅ **Approved for Production** | ⬜ |
| ❌ **Blocked** — issues identified | ⬜ |
| ⚠️ **Conditional Approval** — see notes | ⬜ |

### Issues / Notes

```

[Enter any issues, blockers, or conditional approval notes here]

```

---

## 6. Post-Deployment Verification

| # | Item | Status | Notes |
|---|------|--------|-------|
| 6.1 | Smoke tests pass against production URL | ⬜ | |
| 6.2 | Sentry error rate stable (no increase) | ⬜ | |
| 6.3 | Supabase query performance within norms | ⬜ | |
| 6.4 | Test users can log in | ⬜ | |
| 6.5 | Application form submission works | ⬜ | |
| 6.6 | Login flow works for all roles | ⬜ | |
| 6.7 | No broken routes (404s) | ⬜ | |
| 6.8 | Storage uploads/downloads work | ⬜ | |
| 6.9 | Realtime subscriptions active | ⬜ | |
