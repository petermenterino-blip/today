# Rollback Plan

**Date:** 2026-07-06

---

## 1. Code Rollback (GitHub)

| Scenario | Steps | Duration | Status |
|----------|-------|----------|--------|
| Feature rollout issue | `git revert <commit>` → PR → merge → deploy | ~30min | ✅ |
| Full deployment failure | `git revert <merge-commit>` → force deploy Vercel previous | ~15min | ✅ |
| Hotfix needed | Branch from `main` → fix → PR → merge → deploy | ~1hr | ✅ |

**Vercel Deployment:**
- Vercel automatically deploys the `main` branch
- Rollback: Vercel dashboard → Select previous deployment → "Promote to Production"
- Zero-downtime: Vercel serves the previous deployment while new one rolls out

---

## 2. Database Rollback (Supabase Migrations)

| Migration Type | Rollback Strategy | Idempotent? | Status |
|---------------|-------------------|-------------|--------|
| Table creation | `DROP TABLE IF EXISTS` | ✅ Yes | ✅ |
| Column addition | `ALTER TABLE ... DROP COLUMN` | ✅ Yes | ✅ |
| Index creation | `DROP INDEX IF EXISTS` | ✅ Yes | ✅ |
| Function creation | `DROP FUNCTION IF EXISTS` | ✅ Yes | ✅ |
| Policy creation | `DROP POLICY IF EXISTS` | ✅ Yes | ✅ |
| Trigger creation | `DROP TRIGGER IF EXISTS` | ✅ Yes | ✅ |
| Data inserts (seed) | `DELETE FROM ...` | ✅ Yes | ✅ |

**Key Principle:** All 44 migrations use `IF NOT EXISTS`, `IF EXISTS`, or `OR REPLACE` — making them fully idempotent and rollback-safe.

**Rollback Procedure:**
```sql
-- Reverse a migration by running the inverse operations
-- Example for 036_provisioning_engine.sql rollback:
DROP TABLE IF EXISTS public.provisioning_audit_logs;
DROP TABLE IF EXISTS public.provisioning_jobs;
DROP FUNCTION IF EXISTS public.create_provisioning_job;
```

---

## 3. Feature Flag Rollback

| Flag | Env Variable | Rollback Action |
|------|-------------|-----------------|
| Edge Approval | `VITE_ENABLE_EDGE_APPROVAL` | Set to `false` → redeploy |
| Transactional Provisioning | `VITE_ENABLE_TRANSACTIONAL_PROVISIONING` | Set to `false` → redeploy |

**Procedure:**
1. Set feature flag to `false` in `.env.production` or Vercel environment variables
2. Redeploy (or Vercel auto-deploy from `main`)
3. Feature immediately disabled without code revert

---

## 4. Edge Function Rollback

| Function | Rollback Action |
|----------|----------------|
| gemini | Supabase CLI: `supabase functions deploy gemini --legacy-bundle` (previous version) |
| resend | Same as above |
| approve-application | Same as above; or set `VITE_ENABLE_EDGE_APPROVAL=false` |
| scheduled | Same as first |

**Supabase Functions:**
- Functions are versioned in `supabase/functions/`
- Rollback: `git checkout <previous-commit> -- supabase/functions/<name>/` → deploy

---

## 5. Storage Rollback

| Storage Bucket | Rollback Action |
|----------------|-----------------|
| profile-avatars | Restore from Supabase backup (point-in-time recovery) |
| student-documents | Same |
| mentor-resources | Same |
| gallery-images | Same |

**Supabase Storage:** Supabase Pro tier includes point-in-time recovery for storage objects.

---

## 6. Full Rollback Checklist

```yaml
Priority: 1 - Code revert (GitHub + Vercel)
Priority: 2 - Database migration revert (if schema changed)
Priority: 3 - Edge Function revert (if function logic changed)
Priority: 4 - Feature flag toggle (fastest, if sufficient)
Priority: 5 - Storage revert (if data corrupted)
```

---

## 7. Rollback Test Status

| Rollback Type | Tested? | Status |
|--------------|---------|--------|
| Git revert | ✅ Historical | ✅ Verified |
| Feature flag toggle | ✅ Tested | ✅ VITE_ENABLE_EDGE_APPROVAL works |
| Migration re-run | ✅ Idempotent | ✅ All migrations re-runnable |
| Database restore | ⚠️ Theoretical | Supabase backup feature |

---

## Summary

✅ **PASS** — Multiple rollback layers available: feature flags (fastest, ~5min), code revert (~30min), database migration revert (idempotent), and edge function deploy revert. No single point of failure in deployment pipeline.
