

# Staging Readiness Report — Mentorino RC2.1

## 1. Environment Variables

### Client-Side (`.env.local`)

| Variable | Status | Value |
|----------|--------|-------|
| `VITE_SUPABASE_URL` | ✅ Set | `https://jnazlfhhzxrocvxvmkkc.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | ✅ Set | Valid JWT |
| `VITE_SENTRY_DSN` | ❌ Empty | Not wired in code |
| `VITE_POSTHOG_API_KEY` | ❌ Empty | Not wired in code |
| `VITE_POSTHOG_HOST` | ❌ Empty | Not wired in code |

### Server-Side (Edge Function Secrets)

| Secret | Required By | Status | Action Required |
|--------|-------------|--------|----------------|
| `SUPABASE_URL` | `scheduled/index.ts` | ❌ Not configured | Set via `supabase secrets set` |
| `SUPABASE_SERVICE_ROLE_KEY` | `scheduled/index.ts` | ❌ Not configured | Set via `supabase secrets set` |
| `RESEND_API_KEY` | `resend/index.ts`, `scheduled/index.ts` | ❌ Not configured | Obtain from Resend dashboard |

### Supabase Auth Settings Required

| Setting | Required Value |
|---------|---------------|
| Email/Password Provider | **Enabled** |
| User Signups | **Enabled** |
| Email Confirmation | **Disabled** (recommended for pilot — code has no confirmation handling) |
| Password Reset | **Enabled** with redirect URL configured |

## 2. Edge Functions

| Function | Status | Issues |
|----------|--------|--------|
| `resend` | 🟡 Needs secrets, **CRITICAL**: open email relay — no role validation |
| `scheduled` | 🔴 Needs secrets, **CRITICAL**: service_role key accessible by any JWT holder |
| `gemini` | 🟡 Needs `GEMINI_API_KEY`, no role-based access control |
| `calendar` | ✅ Code complete, requires Google OAuth from client |
| `meet` | ✅ Code complete, requires Google OAuth from client |

## 3. Storage

| Bucket | Status | Issues |
|--------|--------|--------|
| `profile-avatars` | ✅ Complete | Public read, owner write |
| `student-documents` | 🔴 **Broken** | Mentor read policy references non-existent `profiles.mentor_id` column |
| `mentor-resources` | ✅ Complete | Auth read, mentor write |
| `gallery-images` | 🟡 Missing UPDATE policy | Mentors can't update images |

## 4. Realtime

| Publication | Tables Added | Status |
|-------------|-------------|--------|
| `supabase_realtime` | `messages`, `notifications`, `sessions`, `bookings` | ✅ 015_realtime.sql ready |
| Client subscription | `messages` INSERT/UPDATE | ✅ Implemented in WhatsAppMessaging |
| Active subscriptions | `sessions`, `bookings` | ⚠️ Tables in publication but no client subscriptions yet |

## 5. Database Migrations

All 17 migration files are in place (001-015 + 900 + 999). **Issues found:**

| Migration | Issue |
|-----------|-------|
| `008_messages.sql` | ✅ Fixed in RC1.1 — added `sender_name`, `participants` columns |
| `999_rls.sql` | ✅ Fixed in RC1.1 — added conversation_participants, conversations, messages policies |
| `014_storage.sql` | 🔴 **High** — `docs_mentor_read_assigned` policy references `profiles.mentor_id` (DNE) |
| `999_rls.sql` | 🔴 **14 tables have RLS enabled but zero policies** — all event children + functional tables |

## 6. Authentication

| Feature | Status |
|---------|--------|
| Email/Password sign in | ✅ Working |
| Email/Password sign up | ✅ Working |
| Password reset | ✅ Working |
| OAuth/SSO | ❌ Not implemented |
| Invitation flow | ✅ Working (with temp password) |

## Staging Verdict: CONDITIONALLY READY

**Gate 1 — Must fix before staging deployment:**
1. Configure all 4 edge function secrets
2. Fix `docs_mentor_read_assigned` storage policy (broken column ref)
3. Add RLS policies on event child tables (min 4)

**Gate 2 — Must fix before pilot:**
4. Add role validation to `resend` edge function
5. Secure `scheduled` edge function with CRON secret
6. Stop returning temp password to the frontend
