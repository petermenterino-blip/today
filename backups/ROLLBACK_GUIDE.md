# Rollback Guide — Restore to v1.0 Stable from Future State

## When to Use This Guide

Use this procedure when:
- A new feature breaks existing functionality
- A database migration causes schema errors
- An application update introduces regressions
- You need to revert to the proven stable version
- The production system is degraded or down

## Pre-Rollback Checklist

- [ ] Confirm the severity: is this a full rollback or partial fix?
- [ ] Notify team/users of planned downtime
- [ ] Take a snapshot of the CURRENT state (in case you need to return to it)
- [ ] Ensure backup files are accessible
- [ ] Ensure Supabase Dashboard access is available

## Rollback Procedure

### Step 1: Stop All Changes

```bash
# Freeze any active development
# Create a branch marking the current failed state
git checkout -b failed-state-$(date +%Y%m%d_%H%M%S)
git add -A
git commit -m "Snapshot of failed state before rollback"
git checkout master  # or main
```

### Step 2: Reset Git to Stable Version

```bash
# Hard reset to the stable commit
git reset --hard 0be2797

# Force push to update remote (⚠️ DANGER — coordinate with team)
git push --force origin main  # or master
```

### Step 3: Verify the Git State

```bash
git log --oneline -3
# Should show:
# 0be2797 fix: cleanup realtimeManager, auth improvements, resource service fixes...
# 3b03b04 fix: simplify ErrorBoundary, add JWT fallback in auth...
# 1f3223a fix: infinite RLS recursion on profiles...
```

### Step 4: Revert Database Schema

**⚠️ WARNING: Database rollback is destructive. Data added after v1.0 may be lost.**

#### Option A: Full DB Reset (discards all changes after v1.0)
```bash
# If you have Supabase CLI linked:
npx supabase db reset  # Resets to migration state

# OR re-apply all migrations from scratch:
# 1. Drop all public tables (careful!)
# 2. Run all migrations in order
```

#### Option B: Selective Rollback (if later migrations can be reverted)
```bash
# Create reverse migrations for each migration after the stable point
# Example: if migration 035 caused the issue:
# CREATE MIGRATION 035_reverse.sql with DROP/ALTER statements

# Apply the reverse migrations
```

#### Option C: Point-in-Time Recovery
Use Supabase's built-in point-in-time recovery:
1. Go to Supabase Dashboard → Database → Backups
2. Select a backup from before the breaking change
3. Restore to a new project
4. Update `.env.local` with new project credentials

### Step 5: Restore Environment Variables

```bash
# Verify .env.local contains the original values
cat .env.local
# VITE_SUPABASE_URL=https://jnazlfhhzxrocvxvmkkc.supabase.co
# VITE_SUPABASE_ANON_KEY=<original-key>
```

### Step 6: Reinstall Dependencies

```bash
rm -rf node_modules package-lock.json
npm install
```

### Step 7: Verify Frontend Build

```bash
npm run lint && npm run build
# Must complete without errors
```

### Step 8: Re-deploy to Production

```bash
# Push to trigger Vercel auto-deploy
git push origin main

# OR manual deploy
npx vercel --prod
```

### Step 9: Verify Production Deployment

- [ ] Visit production URL — site loads without errors
- [ ] Login works
- [ ] Key pages render
- [ ] Database CRUD operations work
- [ ] Storage uploads/downloads work
- [ ] Realtime updates work

### Step 10: Restore Edge Functions

If edge functions were modified:
1. Go to Supabase Dashboard → Edge Functions
2. For each function, revert to the v1.0 source code from `supabase/functions/`
3. Verify environment secrets are intact

### Step 11: Restore Storage Bucket Policies

If storage policies were modified:
1. Go to Supabase Dashboard → Storage
2. Re-apply policies from STORAGE_CONFIGURATION.md

### Step 12: Run Verification Tests

```bash
# Unit tests
npm test

# E2E tests (if CI is set up)
npm run test:e2e
```

## Post-Rollback Actions

- [ ] Document what caused the failure
- [ ] Create a fix branch from the stable tag for re-implementation
- [ ] Update the CI/CD pipeline if needed
- [ ] Notify team/users that the system is restored
- [ ] Schedule a post-mortem to prevent recurrence

## Emergency Rollback (Production Down)

If production is completely down and speed is critical:

```bash
# 1. Hard reset
git reset --hard 0be2797

# 2. Force push (⚠️ overrides remote)
git push --force origin main

# 3. Vercel auto-deploys (or trigger manually)
# 4. Wait 2-5 minutes for deployment
# 5. Verify site is operational
```

## Rollback Success Criteria

- [ ] Production URL loads without errors
- [ ] Login/signup works
- [ ] All CRUD operations on key tables work
- [ ] File uploads/downloads work
- [ ] AI assistant responds
- [ ] Email notifications send
- [ ] Realtime updates flow
- [ ] All user roles (student, mentor, admin) function correctly
- [ ] No JavaScript console errors
- [ ] Database functions return expected results
