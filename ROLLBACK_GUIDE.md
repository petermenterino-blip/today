# ROLLBACK_GUIDE.md

**Date:** 2026-07-06  
**Application:** Mentorino

---

## Quick Rollback

### Vercel (Frontend)
```bash
vercel rollback
# or
vercel rollback <deployment-id>
```

### Edge Functions (Supabase)
```bash
# Via Supabase dashboard
# Functions → [function] → Versions → Deploy previous
```

### Database (Supabase)
```bash
# Via Supabase dashboard
# Database → Backups → Restore
```

---

## Rollback by Scenario

### Scenario 1: Bad Frontend Deploy

**Symptoms:** 5xx errors, broken UI, routing failures

**Steps:**
1. `vercel rollback` — reverts to previous production deployment
2. Verify site loads correctly
3. Fix the issue on a branch
4. Deploy via normal CI/CD

**Time:** 2 minutes

---

### Scenario 2: Bad Database Migration

**Symptoms:** Schema errors, data integrity issues, RLS failures

**Steps:**
```bash
# Option A: Migration rollback
supabase migration down

# Option B: SQL rollback (if migration tool not available)
# Run the reverse migration SQL
```

**Time:** 5 minutes

---

### Scenario 3: Edge Function Failure

**Symptoms:** AI not responding, emails not sending, approvals failing

**Steps:**
1. Supabase Dashboard → Edge Functions
2. Select failing function
3. Click "Versions" tab
4. Click "Deploy" on previous working version
5. Monitor function logs for errors

**Time:** 3 minutes

---

### Scenario 4: Security Incident

**Symptoms:** Unauthorized access, data breach, compromised keys

**Steps:**
1. **IMMEDIATE:** Revoke all API keys in Supabase Dashboard
2. Rotate `SUPABASE_SERVICE_ROLE_KEY`
3. Rotate `RESEND_API_KEY`
4. Rotate `GEMINI_API_KEY`
5. Force all users to re-authenticate:
   ```sql
   -- Invalidate all sessions
   UPDATE auth.sessions SET deleted_at = now() WHERE deleted_at IS NULL;
   ```
6. Deploy security patch
7. Notify affected users

**Time:** 10 minutes for containment

---

## Rollback Commands Reference

```bash
# Git
git revert HEAD                          # Revert latest commit
git revert <hash>                        # Revert specific commit
git reset --hard <hash>                  # Force reset (use carefully)

# Supabase
supabase migration down                  # Rollback last migration
supabase migration down --steps 3        # Rollback 3 migrations
supabase migration list                  # List all migrations

# Vercel
vercel list                              # List deployments
vercel rollback                          # Rollback to previous
vercel rollback <id>                     # Rollback to specific

# Database SQL Rollback for shared_files
DELETE FROM storage.buckets WHERE id = 'shared_files';
DROP POLICY IF EXISTS "shared_files_mentor_all" ON storage.objects;
DROP POLICY IF EXISTS "shared_files_student_read" ON storage.objects;
```

---

## Verification After Rollback

- [ ] Application loads without errors
- [ ] Authentication works
- [ ] Data displays correctly
- [ ] No error logs in Supabase
- [ ] No 5xx in Vercel analytics
- [ ] Edge functions respond correctly
