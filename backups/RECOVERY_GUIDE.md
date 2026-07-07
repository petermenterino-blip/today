# Recovery Guide — Restore to v1.0 Stable

## Prerequisites
- Git installed
- Node.js 20+
- Supabase CLI (for DB restoration)
- Access to Supabase Dashboard (for storage/auth configuration)
- Backup files from `/backups/` directory
- SQL dump files (if exported) from external storage

## Step 1: Restore GitHub Code to v1.0-stable

```bash
# Option A: Using tag
git checkout v1.0-stable

# Option B: Using branch
git checkout stable-v1
```

If the tag/branch doesn't exist, check out by commit hash:

```bash
git checkout 0be2797
```

## Step 2: Install Dependencies

```bash
npm ci
# or
npm install
```

## Step 3: Restore Environment Variables

Create `.env.local` with the saved values:

```bash
VITE_SUPABASE_URL=https://jnazlfhhzxrocvxvmkkc.supabase.co
VITE_SUPABASE_ANON_KEY=<saved-anon-key>
VITE_SENTRY_DSN=<sentry-dsn-if-configured>
```

## Step 4: Verify Frontend Build

```bash
npm run lint      # tsc --noEmit
npm run build     # tsc -b && vite build
```

## Step 5: Restore the Supabase Schema

### Option A: Using Supabase CLI
```bash
npx supabase link --project-ref jnazlfhhzxrocvxvmkkc
npx supabase db push  # Re-applies all migrations in order
```

### Option B: Using SQL dump
1. Go to Supabase Dashboard → SQL Editor
2. Open `supabase_schema_v1.sql`
3. Run the entire script
4. Verify no errors

### Option C: Re-apply migrations manually
Apply each migration file in order from `supabase/migrations/`:
```bash
for f in supabase/migrations/*.sql; do
  echo "Applying $f..."
  psql <connection-string> -f "$f"
done
```

## Step 6: Restore RLS Policies

RLS policies are embedded in migration files. If restoring from SQL dump:

1. Open `rls_policies_v1.sql` in Supabase SQL Editor
2. Run the script

## Step 7: Restore SQL Functions

Functions are embedded in migration files:
- `public.is_mentor()` — migration 031, 032
- `public.is_admin()` — migration 032
- `public.insert_notification()` — migration 016
- `public.handle_new_user()` — migration 900
- `public.handle_updated_at()` — migration 900
- `public.sync_profile_role_to_auth()` — migration 031
- `public.increment_resource_field()` — migration 024
- `public.upsert_recently_viewed()` — migration 026
- `public.increment_gallery_view_count()` — migration 028
- `public.get_booking_stats()` — migration 028
- And all resource/review/trigger functions

Re-apply with: `npx supabase db push` OR manually run each migration.

## Step 8: Restore Triggers

Triggers are created in their respective migration files:
- `on_auth_user_created` (auth.users) — migration 900
- `trg_sync_profile_role_to_auth` (profiles) — migration 031
- All `set_*_updated_at` triggers — migration 900
- Resource triggers — migration 023_resources
- Review triggers — migration 023_reviews
- Social/Website triggers — migration 029

Re-applied automatically with `npx supabase db push`.

## Step 9: Restore Storage Bucket Configuration

Using Supabase Dashboard:
1. Go to Storage → Buckets
2. Verify all 7 buckets exist (see STORAGE_CONFIGURATION.md)
3. For each bucket, verify:
   - Public/private setting
   - File size limit
   - Allowed MIME types
   - Policies (see STORAGE_CONFIGURATION.md)

To recreate via SQL:
```sql
-- Run the bucket creation SQL from migrations 014, 030_messaging_fixes
-- Then run policy SQL from migrations 014, 017, 020, 023_resources, 030_messaging_fixes
```

## Step 10: Restore Edge Functions

Using Supabase Dashboard:
1. Go to Edge Functions
2. For each function, create and paste the source code:
   - `gemini` — from `supabase/functions/gemini/index.ts`
   - `resend` — from `supabase/functions/resend/index.ts`
   - `scheduled` — from `supabase/functions/scheduled/index.ts`
3. Set environment secrets for each function:
   - `GEMINI_API_KEY` (for gemini)
   - `RESEND_API_KEY` (for resend)
   - `CRON_SECRET` (for scheduled)
   - `SUPABASE_URL` (for scheduled + middleware)
   - `SUPABASE_SERVICE_ROLE_KEY` (for scheduled + middleware)

## Step 11: Restore Authentication Settings

Using Supabase Dashboard:
1. Go to Authentication → Settings
2. Verify/restore:
   - Site URL
   - Redirect URLs
   - Email provider settings
   - JWT expiry settings

## Step 12: Restore Realtime Publication

Using Supabase Dashboard:
1. Go to Database → Publications
2. Verify `supabase_realtime` publication includes all tables listed in SUPABASE_CONFIGURATION.md

Or via SQL:
```sql
-- Run migration 015_realtime.sql and subsequent realtime ALTER PUBLICATION commands
```

## Step 13: Re-enable Seed Data (optional for development)

```bash
# From Supabase CLI
npx supabase db reset

# Or manually run supabase/seed/seed.sql in SQL Editor
```

## Step 14: Deploy Frontend

```bash
# Build
npm run build

# Deploy to Vercel (auto-deploys from git)
git push origin main
# OR manual:
npx vercel --prod
```

## Step 15: Verify All Features

Run through the checklists in FUTURE_CHANGE_CHECKLIST.md to verify:

1. ✅ Frontend builds and serves
2. ✅ Authentication works (login, signup, password reset)
3. ✅ All pages render without errors
4. ✅ Database connections work (CRUD operations)
5. ✅ Storage uploads and downloads work
6. ✅ Realtime updates work (messages, notifications)
7. ✅ AI chat works
8. ✅ Email notifications send
9. ✅ All user roles function correctly
10. ✅ Mentor dashboard loads with data
11. ✅ Student dashboard loads with data
12. ✅ Admin views work
