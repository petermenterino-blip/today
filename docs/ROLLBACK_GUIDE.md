# Rollback Guide

## Overview

This document covers rollback procedures for all Mentorino platform components:
- Git version control
- Vercel deployment
- Feature flags
- Supabase database
- Edge functions

## 1. Git Rollback

### Revert a Merge Commit

```bash
# Find the merge commit
git log --oneline --merges -5

# Revert the merge
git revert -m 1 <merge-commit-hash>

# Push the revert
git push origin master
```

### Rollback to Specific Commit

```bash
# Find the target commit
git log --oneline -10

# Create a revert commit for a range
git revert --no-commit <last-good-commit>..HEAD
git commit -m "rollback: revert to <commit-hash>"
git push origin master
```

### Reset Protected Branch (with force push — use with caution)

```bash
# WARNING: This rewrites history. Only use in emergency.
git reset --hard <target-commit>
git push --force origin master
```

## 2. Vercel Deployment Rollback

### Via Vercel Dashboard

1. Go to Vercel Dashboard > Project > Deployments
2. Find the last known-good deployment
3. Click the three dots (...) > "Promote to Production"
4. Wait for deployment to complete
5. Verify health check passes

### Via Vercel CLI

```bash
# List recent deployments
vercel list --prod

# Rollback to a specific deployment
vercel rollback <deployment-url-or-id>

# Rollback to the previous deployment
vercel rollback
```

## 3. Feature Flag Rollback

Feature flags are controlled via environment variables. Rollback is instantaneous.

### Via Vercel Dashboard

1. Go to Vercel Dashboard > Project > Settings > Environment Variables
2. Edit the feature flag variable:
   - Set `VITE_ENABLE_EDGE_APPROVAL=false` to disable edge approval
   - Set `VITE_ENABLE_TRANSACTIONAL_PROVISIONING=false` to disable transactional provisioning
3. Trigger a redeployment (or wait for automatic redeployment)
4. Verify the feature is disabled

### Via Client-Side Fallback

The application checks feature flags at runtime. No code changes needed:

```typescript
// feature flag usage — just flip the env var
if (features.edgeApproval) {
  // Use edge function
} else {
  // Use browser-side fallback
}
```

## 4. Supabase Database Rollback

### Via Migration Revert

```bash
# List migrations
supabase migration list

# Create a migration to revert the last migration
supabase migration new revert_migration_name
# Write SQL to undo the changes...

# Apply the revert
supabase db push
```

### Point-in-Time Recovery (Pro Plan)

1. Go to Supabase Dashboard > Database > Backups
2. Click "Restore" on the desired backup
3. Select point-in-time (available within 7 days on Pro)
4. Confirm restoration

### Manual SQL Revert

```sql
-- Example: Revert a migration that added a column
ALTER TABLE profiles DROP COLUMN IF EXISTS new_column;

-- Example: Revert a policy change
DROP POLICY IF EXISTS problematic_policy ON profiles;
-- Re-apply previous policy
```

### Data Recovery

```bash
# Download latest backup
supabase db dump --linked > rollback_$(date +%Y%m%d).sql

# Restore from backup (destructive — replaces current data)
psql "$PRODUCTION_DATABASE_URL" < rollback_backup.sql
```

## 5. Edge Function Rollback

### Via Supabase CLI

```bash
# Deploy a specific version (Supabase doesn't support versioning natively)
# Strategy: Keep the previous working function code locally
git checkout <previous-tag> -- supabase/functions/function-name/
supabase functions deploy function-name

# Or disable by removing function secrets
supabase secrets unset RESEND_API_KEY  # Example: disable email
```

### Disable Edge Function

Temporarily disable edge function usage via feature flag:

```bash
# Set VITE_ENABLE_EDGE_APPROVAL=false in Vercel env vars
# This makes the client bypass edge functions entirely
```

## 6. Full Application Rollback

### Complete Rollback Sequence

```bash
# Step 1: Revert feature flags (instant, no deploy needed)
# Set VITE_ENABLE_EDGE_APPROVAL=false in Vercel

# Step 2: Revert database
supabase db dump --linked > pre_rollback_backup.sql
# Apply revert migration

# Step 3: Revert edge functions
git checkout <previous-tag> -- supabase/functions/
supabase functions deploy approve-application
supabase functions deploy gemini
supabase functions deploy resend
supabase functions deploy scheduled

# Step 4: Revert frontend (Vercel)
vercel rollback

# Step 5: Verify health
# Run health check and verify all services
```

## 7. Verification After Rollback

```typescript
// Run health check
import { runHealthCheck } from '../lib/healthCheck';

const health = await runHealthCheck();
console.log('Post-rollback health:', health.summary);
```

### Verification Checklist

- [ ] Application loads without errors
- [ ] Authentication works
- [ ] Database queries succeed
- [ ] Storage operations work
- [ ] Realtime connections established
- [ ] Email sending (if applicable)
- [ ] Edge functions (if applicable)
- [ ] No errors in Sentry
- [ ] All feature flags at expected values

## 8. Prevention

### Pre-Deployment Checklist

- Tag releases: `git tag v1.2.3 && git push --tags`
- Document schema changes in PR descriptions
- Keep rollback scripts ready before starting deployment
- Test rollback on staging before production

### Version Tagging

```bash
# Create a release tag
git tag -a v1.2.3 -m "Release v1.2.3"
git push origin v1.2.3

# List tags for rollback reference
git tag -l | sort -V
```
