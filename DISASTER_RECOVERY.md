# DISASTER_RECOVERY.md

**Date:** 2026-07-06  
**DR Contact:** DevOps Engineer

---

## 1. Git Rollback

```bash
# Revert last commit (keep changes)
git revert HEAD

# Revert specific commit
git revert <commit-hash>

# Rollback to specific tag
git checkout tags/v1.0.0 -b hotfix/v1.0.0

# Force push reverted state (after team approval)
git push origin main --force-with-lease
```

**Verification:** Confirm `git log --oneline -5` shows correct state.

---

## 2. Migration Rollback

```bash
# Rollback last migration
supabase migration down

# Rollback specific number of steps
supabase migration down --steps 3

# Rollback to specific version
supabase migration list
supabase migration down --target 014
```

### Manual Rollback SQL (for 020_module6_complete.sql)
```sql
-- Reverse: shared_files bucket
DELETE FROM storage.buckets WHERE id = 'shared_files';

-- Reverse: shared_files policies
DROP POLICY IF EXISTS "shared_files_mentor_all" ON storage.objects;
DROP POLICY IF EXISTS "shared_files_student_read" ON storage.objects;

-- Reverse: shared_files table policies
DROP POLICY IF EXISTS "Mentors can read all shared files" ON public.shared_files;
DROP POLICY IF EXISTS "Mentors can insert shared files" ON public.shared_files;
DROP POLICY IF EXISTS "Mentors can update shared files" ON public.shared_files;
DROP POLICY IF EXISTS "Mentors can delete shared files" ON public.shared_files;
DROP POLICY IF EXISTS "Students can read own shared files" ON public.shared_files;
```

**Verification:** Run `supabase db diff` or check policy count.

---

## 3. Database Restore

```bash
# Via Supabase Dashboard
# 1. Go to Database → Backups
# 2. Click "Restore" on the desired backup
# 3. Confirm restore — this spins up a new DB instance

# Via pg_dump (manual backup)
pg_dump --dbname=postgresql://... --format=custom -f backup.dump

# Restore
pg_restore --dbname=postgresql://... --clean --if-exists backup.dump
```

**Verification:** Connect to restored DB and run `SELECT count(*) FROM profiles;`.

---

## 4. Storage Restore

```bash
# Supabase manages storage backups alongside DB
# For manual object restore:

# List objects in bucket
supabase storage list <bucket-name>

# Download all objects
supabase storage download <bucket-name> --recursive

# Upload after restore
supabase storage upload <bucket-name> <local-path> <remote-path>

# For bulk restore, use the Supabase JS API
```

**Verification:** Check bucket object count matches pre-disaster snapshot.

---

## 5. Edge Function Rollback

```bash
# Via Supabase CLI
supabase functions deploy --version <previous-version>

# Via Dashboard
# 1. Go to Edge Functions
# 2. Select function
# 3. Click "Versions"
# 4. Click "Deploy" on previous version

# List all deployed functions
supabase functions list

# Check current version
supabase functions show <function-name>
```

**Verification:** Call the edge function and verify expected behavior.

---

## 6. Deployment Rollback (Vercel)

```bash
# Via Vercel CLI
vercel rollback

# Rollback to specific deployment
vercel rollback <deployment-url-or-id>

# Via Dashboard
# 1. Go to Vercel Project
# 2. Click "Deployments"
# 3. Find last known-good deployment
# 4. Click "..." → "Promote to Production"

# List recent deployments
vercel list
```

**Verification:** Confirm `vercel status` shows previous version active.

---

## 7. Full Recovery Runbook

### Scenario A: Failed Deployment

```
1. NOTIFY: Team + stakeholders
2. ROLLBACK: vercel rollback
3. VERIFY: https://mentorino.com loads correctly
4. FIX: Identify root cause
5. DEPLOY: Fixed version via CI/CD
6. MONITOR: 30 min observation window
```

### Scenario B: Database Corruption

```
1. STOP: Disable write operations (maintenance mode)
2. RESTORE: Supabase backup from 1 hour pre-incident
3. VERIFY: Data integrity checks
4. RECOVER: Replay any lost transactions from logs
5. RESUME: Enable write operations
6. NOTIFY: Users of brief downtime
```

### Scenario C: Security Incident

```
1. CONTAIN: Revoke compromised keys via Supabase Dashboard
2. ROTATE: All API keys (Supabase service role, Resend, Gemini)
3. AUDIT: Check logs for unauthorized access
4. PATCH: Fix vulnerability
5. DEPLOY: Emergency patch
6. NOTIFY: Affected users if data exposed
```

### Scenario D: Third-Party Outage (Resend/Gemini)

```
1. DETECT: Monitoring alerts on email/AI failure rates
2. FALLBACK: Queue emails locally, retry with backoff
3. COMMUNICATE: Status page update
4. RECOVER: Process backlog when service is restored
5. REVIEW: Consider alternative provider for redundancy
```

---

## 8. Backup Schedule

| Asset | Frequency | Retention | Method |
|-------|-----------|-----------|--------|
| Database | Daily (Supabase Pro) | 7 days | Automatic |
| Storage | Daily | 7 days | Automatic |
| Source code | Per commit | Indefinite | Git |
| Environment secrets | Manual | Indefinite | Password manager |
| Edge functions | Per deploy | 10 versions | Supabase versions |

---

## 9. Recovery Testing Schedule

| Test | Frequency | Success Criteria |
|-----|-----------|-----------------|
| Git rollback drill | Monthly | < 15 min to revert |
| Database restore drill | Quarterly | < 30 min to restore |
| Full DR exercise | Quarterly | < 1 hr to full recovery |
| Key rotation drill | Quarterly | < 10 min to rotate keys |

---

## Verdict

```
╔══════════════════════════════════════════════════════════════╗
║  DISASTER RECOVERY: ✅ STRUCTURED — Rollback plans exist    ║
║                                                             ║
║  All recovery paths defined.                                ║
║  Backup schedule adequate for launch.                       ║
║  DR testing schedule recommended quarterly.                 ║
╚══════════════════════════════════════════════════════════════╝
```
