# Prioritized Fix List — Pre-Pilot

Must be fixed before inviting real users. Ordered by impact.

---

## Blocker (Must Fix Before Pilot)

### B-1: Implement user registration/signup flow
- **Files:** `Auth.tsx`, `AuthContext.tsx`, `authService.ts`
- **Issue:** No way for approved applicants to create an account
- **Fix options:**
  - Add email-based invitation with password setup on approval (preferred)
  - Or expose existing `signup()` method in Auth.tsx and send welcome email via Resend edge function from `approveApplication()`
- **Estimate:** 2-3 days

### B-2: Build Applications tab UI for mentor dashboard
- **Files:** `MentorDashboard.tsx:151` (TODO placeholder)
- **Issue:** Mentor has no UI to review, filter, or act on applications
- **Fix:** Build `<ApplicationsTab>` component using existing `useApplicationReview` hook — filtering, approve/reject buttons, notes, info requests
- **Estimate:** 1-2 days

---

## Critical (Fix Before Pilot)

### C-1: Remove hardcoded credentials from production build
- **Files:** `authService.ts:28-101`, `Landing.tsx:1044-1058`
- **Issue:** 6 mock users with `password123` exposed in source; debug login buttons on landing page
- **Fix:** Wrap mock users in `if (import.meta.env.DEV)` and disable debug buttons in production
- **Estimate:** 0.5 day

### C-2: Fix rejected applicant messaging
- **Files:** `ProtectedRoute.tsx:32-34`, `PendingApproval.tsx`
- **Issue:** Rejected users see "Application Pending" — misleading
- **Fix:** Add `application_status` check in PendingApproval.tsx to show rejection message + reason if available
- **Estimate:** 0.5 day

### C-3: Add `.env.local` to `.gitignore`
- **File:** `.gitignore`
- **Issue:** Real Supabase credentials committed to repo
- **Fix:** Add `.env.local` to `.gitignore` and remove committed file from tracking
- **Estimate:** 0.25 day

### C-4: Fix Storage RLS policy
- **File:** `supabase/migrations/014_storage.sql:24`
- **Issue:** References `profiles.mentor_id` which doesn't exist
- **Fix:** Add `mentor_id` column to profiles migration or rewrite policy
- **Estimate:** 0.25 day

---

## High (Strongly Recommended Before Pilot)

### H-1: Replace messaging polling with Supabase Realtime
- **Files:** `WhatsAppMessaging.tsx:125-129`
- **Issue:** 2-second polling wastes bandwidth and battery
- **Fix:** Use `useRealtime` hook with `postgres_changes` on `messages` table
- **Estimate:** 1 day

### H-2: Add automatic notification triggers
- **Files:** Various services
- **Issue:** No notifications created for booking confirmations, goal completions, task completions, application approval
- **Fix:** Add `notificationStorage.create()` calls after key lifecycle events
- **Estimate:** 1 day

### H-3: Set up Sentry error tracking
- **Files:** `main.tsx` (new)
- **Issue:** No runtime error visibility
- **Fix:** Add `@sentry/react` package, initialize with DSN from env var
- **Estimate:** 0.5 day

### H-4: Add React error boundary
- **Files:** New component + `App.tsx`
- **Issue:** Any uncaught render error produces white screen
- **Fix:** Add `<ErrorBoundary>` wrapping routes with fallback UI
- **Estimate:** 0.5 day

---

## Medium (Fix Before Pilot If Time Allows)

### M-1: Reconcile type definitions
- **Files:** `src/types/` vs `src/interfaces/`
- **Issue:** Same domain models defined with different shapes in two locations
- **Fix:** Consolidate to one location, remove the other

### M-2: Fix `dateUtils.getNJISOString()` timezone bug
- **File:** `src/utils/dateUtils.ts`
- **Issue:** Returns Z-suffixed string with non-UTC Eastern Time values

### M-3: Fix `applicationService.uploadDocument` userId parameter
- **File:** `src/services/applicationService.ts:201`
- **Issue:** Passes literal string `'applications'` instead of real user ID

### M-4: Add `aria-label` to icon-only buttons
- **Files:** Multiple components
- **Issue:** Missing accessibility labels

### M-5: Add `alt` attributes to `<img>` tags
- **Files:** `Landing.tsx`, `Gallery.tsx`, `GalleryManagement.tsx`
- **Issue:** 7 images without alt text

### M-6: Create specific Analytics tab or remove from navigation
- **File:** `MentorDashboard.tsx`
- **Issue:** Analytics tab renders empty `<div>` — either implement or hide

---

## Low (Post-Pilot)

### L-1: Remove duplicate Google Fonts Inter load
### L-2: Remove dead code (BaseSupabaseService, unused imports)
### L-3: Remove data URL gallery from localStorage (use Supabase Storage)
### L-4: Fix contact form (use API instead of localStorage)
### L-5: Re-enable HMR in vite.config.ts
### L-6: Add `admin` role to frontend UserRole type

---

## Effort Summary

| Priority | Count | Estimated Effort |
|----------|-------|-----------------|
| Blocker | 2 | 3-5 days |
| Critical | 4 | 1.5 days |
| High | 4 | 3 days |
| Medium | 6 | 2-3 days |
| Low | 6 | 1-2 days |
| **Total** | **22** | **~10-14 days** |

**Pre-pilot minimum (Blockers + Critical + Top High):** ~6-8 days
