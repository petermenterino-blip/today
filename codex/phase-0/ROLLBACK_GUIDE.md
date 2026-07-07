# Rollback Guide — Return to v1.0 Stable Baseline

**Version:** v1.0-stable (commit `0be2797`)

---

## Quick Rollback (Git Tag)

```bash
# Option A: Restore code from tag
git checkout v1.0-stable

# Option B: Restore from commit hash
git checkout 0be2797

# Option C: Restore from stable branch
git checkout stable-v1

# Install dependencies
npm ci

# Verify
npm run build
```

## Database Rollback

### Using Supabase CLI
```bash
# Link project
npx supabase link --project-ref jnazlfhhzxrocvxvmkkc

# Re-apply all migrations in order
npx supabase db push
```

### Using SQL Dump
```sql
-- Open Supabase Dashboard → SQL Editor
-- Run: supabase_schema_v1.sql (from backups/)
-- Run: rls_policies_v1.sql
-- Run: storage_configuration_v1.sql
```

### Manual Migration Rollback
```bash
# Apply migrations sequentially
for f in supabase/migrations/*.sql; do
  psql <connection-string> -f "$f"
done
```

## Storage Rollback

1. Go to Supabase Dashboard → Storage → Buckets
2. Verify all 7 buckets exist
3. Re-apply bucket policies from `backups/storage_configuration_v1.sql`

## Edge Function Rollback

1. Go to Supabase Dashboard → Edge Functions
2. Re-deploy each function from source:
   - `gemini` → `supabase/functions/gemini/index.ts`
   - `resend` → `supabase/functions/resend/index.ts`
   - `scheduled` → `supabase/functions/scheduled/index.ts`
3. Set environment secrets: GEMINI_API_KEY, RESEND_API_KEY, CRON_SECRET, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

## Auth Configuration Rollback

1. Go to Supabase Dashboard → Authentication → Settings
2. Verify: Site URL, Redirect URLs, Email provider config, JWT expiry

## Environment Variables

```
VITE_SUPABASE_URL=https://jnazlfhhzxrocvxvmkkc.supabase.co
VITE_SUPABASE_ANON_KEY=<from .env.local>
VITE_SENTRY_DSN=<optional>
```

## Verification Checklist

After rollback, verify:

- [ ] `npm run build` passes
- [ ] Login works (student + mentor accounts)
- [ ] All pages render without errors
- [ ] CRUD operations work on all tables
- [ ] Storage uploads/downloads function
- [ ] Realtime updates work (messages, notifications)
- [ ] AI chat responds
- [ ] Email notifications send
- [ ] Mentor dashboard loads with data
- [ ] Student dashboard loads with data

## Git Tags Reference

| Tag | Phase | Description |
|-----|-------|-------------|
| `v1.0-stable` | Pre-Phase-0 | Current stable baseline (existing tag) |
| `v1.0-base-stable` | Phase 0 | Recommended tag for this baseline |

## Migrations to Revert (if rolling back from a future phase)

| If You Are On | Rollback By |
|---------------|-------------|
| Phase 1 (RLS) | Revert migration → restore previous policies |
| Phase 2 (Edge Functions) | Disable new edge function → re-enable old browser implementation |
| Phase 3 (Provisioning) | Revert transactional migration → restore old flow |
| Phase 4 (Invitation) | Disable signed-token flow → re-enable email lookup |

## Database Backup Location

All backup files are stored in `C:\Users\Naresh.M\Downloads\today\backups\`:
- `supabase_schema_v1.sql` — Full database schema
- `storage_configuration_v1.sql` — Storage bucket configuration
- `realtime_publication_v1.sql` — Realtime publication configuration
- `DATABASE_SCHEMA.md` — Human-readable schema documentation
- `RECOVERY_GUIDE.md` — Step-by-step recovery instructions
