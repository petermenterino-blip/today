# Future Change Detection Checklist

Use this checklist to compare ANY future change against the v1.0 Stable baseline.

## Frontend Files

### Source Files — Track modifications in:
- [ ] `src/app/App.tsx` (routing)
- [ ] `src/main.tsx` (entry point)
- [ ] `src/context/AuthContext.tsx` (authentication)
- [ ] `src/context/ConnectionContext.tsx` (connectivity)
- [ ] `src/lib/supabase.ts` (client init)
- [ ] `src/lib/realtimeManager.ts` (realtime)
- [ ] `src/lib/sentry.ts` (error monitoring)
- [ ] `src/lib/errorHandler.ts` (error handling)
- [ ] `src/lib/idleRecovery.ts` (session recovery)
- [ ] `src/utils/queryClient.tsx` (React Query config)

### Pages — Track changes in `src/pages/`:
- [ ] Landing, Auth, About, Programs, Consultation, FAQ, Contact, Gallery
- [ ] Application, Booking, Store, Survey, ResetPassword
- [ ] Privacy, Terms, NotFound, ConsultationOverview, PendingApproval

### Components — Track changes in `src/components/`:
- [ ] Layout, Footer, VisitorHeader, ProtectedRoute, ErrorBoundary
- [ ] OfflineBanner, ScrollToTop, NotificationDropdown
- [ ] ConfirmDialog, EmptyState

### Features — Track changes in `src/features/`:
- [ ] Student dashboard files (13 files)
- [ ] Mentor dashboard + 11 overview widgets
- [ ] Messaging (7 files)
- [ ] Resources (12 files)
- [ ] Admin (3 files)
- [ ] Settings
- [ ] Events (4 files)

### Hooks — Track changes in `src/hooks/`:
- [ ] All 20+ data hooks

### Services — Track changes in `src/services/`:
- [ ] All 30+ service files

## Database Schema

### Tables — Track any changes to:
- [ ] Existing tables (structure changes)
- [ ] New tables added
- [ ] Tables removed
- [ ] Column additions/modifications/removals
- [ ] Data type changes
- [ ] Constraint changes (CHECK, UNIQUE, NOT NULL)
- [ ] Default value changes
- [ ] Index additions/removals

### Key Tables to Monitor:
- [ ] `profiles` — Most sensitive, many RLS policies depend on it
- [ ] `sessions`, `goals`, `tasks`, `journals`, `bookings` — Core features
- [ ] `messages`, `conversations`, `conversation_participants` — Messaging
- [ ] `events`, `event_attendees` — Events
- [ ] `applications` — Applications
- [ ] `notifications` — Notifications
- [ ] `resources` + related tables — Resource library
- [ ] `reviews`, `review_history` — Reviews

### New Migration Files — Track additions in `supabase/migrations/`:
- [ ] Any new migration files added
- [ ] Check for DROP/ALTER on existing objects

## Row Level Security (RLS)

### Policy Changes — Track:
- [ ] New policies added
- [ ] Existing policies modified
- [ ] Policies removed
- [ ] RLS disabled on any table

### Sensitive Policy Patterns:
- [ ] `is_mentor()` — Must use JWT claims, NOT query profiles
- [ ] `is_admin()` — Must use JWT claims, NOT query profiles
- [ ] Any policy querying `profiles` table inside another profiles policy

## SQL Functions

### Track changes to:
- [ ] `public.is_mentor()` — must stay JWT-based
- [ ] `public.is_admin()` — must stay JWT-based
- [ ] `public.sync_profile_role_to_auth()` — role sync trigger
- [ ] `public.insert_notification()` — security definer
- [ ] New functions added
- [ ] Existing functions modified

## Triggers

### Track changes to:
- [ ] `on_auth_user_created` — profile auto-creation
- [ ] `trg_sync_profile_role_to_auth` — role sync
- [ ] All `set_*_updated_at` triggers
- [ ] Resource/review/gallery triggers
- [ ] Any new trigger added

## Storage

### Bucket Changes — Track:
- [ ] New buckets created
- [ ] Existing buckets modified (public, size limit, MIME types)
- [ ] Buckets deleted
- [ ] Bucket policies added/modified/removed

### Sensitive Buckets:
- [ ] `profile-avatars` — public read
- [ ] `mentor-resources` — private, large size
- [ ] `student-documents` — private, anonymous uploads under `applications/`
- [ ] `message-attachments` — private, participant-only access

## Authentication

### Track changes to:
- [ ] New OAuth providers added
- [ ] Email provider configuration
- [ ] Redirect URLs
- [ ] Site URL
- [ ] JWT expiry settings
- [ ] Session duration
- [ ] Email confirmation requirements
- [ ] User sign-up policies

## Edge Functions

### Track changes to:
- [ ] `gemini` — AI function
- [ ] `resend` — Email function
- [ ] `scheduled` — Cron tasks
- [ ] New functions added
- [ ] Environment secrets added/modified

## Environment Variables

### Track additions/modifications to:
- [ ] `VITE_SUPABASE_URL`
- [ ] `VITE_SUPABASE_ANON_KEY`
- [ ] `VITE_SENTRY_DSN`
- [ ] `SUPABASE_SERVICE_ROLE_KEY`
- [ ] `GEMINI_API_KEY`
- [ ] `RESEND_API_KEY`
- [ ] `CRON_SECRET`
- [ ] Any new variables

## Dependencies

### Package.json — Track:
- [ ] New dependencies added
- [ ] Dependencies removed
- [ ] Version upgrades (major/minor/patch)
- [ ] DevDependencies changes

### Key Dependencies:
- [ ] `@supabase/supabase-js` — Backend connectivity
- [ ] `react`, `react-dom` — Core framework
- [ ] `react-router-dom` — Routing
- [ ] `@tanstack/react-query` — Data fetching
- [ ] `vite` — Build tool
- [ ] `typescript` — Language
- [ ] `tailwindcss` — Styling

## Build Configuration

### Track changes to:
- [ ] `vite.config.ts`
- [ ] `tsconfig.json`
- [ ] `.gitignore`
- [ ] `playwright.config.ts`
- [ ] `.github/workflows/ci.yml`

## Realtime

### Track changes to:
- [ ] `supabase_realtime` publication tables
- [ ] Realtime manager in `src/lib/realtimeManager.ts`
- [ ] Channel subscriptions

## Comparison Procedure

When reviewing any change:

```bash
# 1. Compare Git diff
git diff 0be2797..HEAD --stat  # Show changed files
git diff 0be2797..HEAD         # Show full diff

# 2. Check for new migration files
git diff --name-only 0be2797..HEAD -- supabase/migrations/

# 3. Check for schema changes
git diff 0be2797..HEAD -- supabase/

# 4. Check for dependency changes
git diff 0be2797..HEAD -- package.json

# 5. Check for env variable changes
git diff 0be2797..HEAD -- .env*

# 6. Verify RLS is intact
# Compare RLS policies in migrations and Dashboard

# 7. Run verification tests
npm run lint && npm test && npm run build
```

## Change Impact Assessment

For each change, assess:
- [ ] Does it break any existing feature?
- [ ] Does it modify any RLS policy?
- [ ] Does it add/modify/remove any database column?
- [ ] Does it change the auth flow?
- [ ] Does it introduce new environment variables?
- [ ] Does it change storage configuration?
- [ ] Does it modify edge functions?
- [ ] Does it upgrade critical dependencies?
- [ ] Does it change the build process?
- [ ] Does it affect TypeScript compilation?

## Change Sign-off

Before merging any change, verify:
- [ ] TypeScript compiles (`tsc --noEmit`)
- [ ] Unit tests pass (`vitest run`)
- [ ] Build succeeds (`vite build`)
- [ ] E2E tests pass (if applicable)
- [ ] No new console errors
- [ ] RLS policies are not broken
- [ ] Auth flow is not broken
- [ ] Storage operations work
- [ ] Realtime subscriptions work
- [ ] All user roles function correctly
