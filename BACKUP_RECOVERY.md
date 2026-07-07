# Backup & Disaster Recovery

**App:** Mentorino  
**Last Updated:** 2026-07-06

---

## 1. Data Assets

| Asset | Location | Backup Frequency | Retention | RPO Target |
|-------|----------|-----------------|-----------|------------|
| PostgreSQL Database | Supabase | **Daily** (automated) | 30 days | < 24 hours |
| File Storage | Supabase Storage | **Weekly** (automated) | 4 weeks | < 1 week |
| Auth Users | Supabase Auth | **Weekly** (semi-automated) | 4 weeks | < 1 week |
| Source Code | GitHub | Continuous (git push) | Forever | N/A |
| Environment Secrets | Supabase Secrets + Vercel | **Monthly** (encrypted offline) | 12 months | < 1 month |
| Edge Functions | Supabase + GitHub | Continuous (git push) | Forever | N/A |

---

## 2. Backup Procedures

### 2.1 Database — Automated (Daily via GitHub Actions)

**Workflow:** `.github/workflows/database-backup.yml`

```yaml
name: Daily Database Backup
on:
  schedule:
    - cron: '0 3 * * *'    # 3:00 AM daily
jobs:
  backup:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: sudo apt-get install -y postgresql-client
      - name: Dump database
        run: |
          pg_dump \
            --host="${{ secrets.SUPABASE_DB_HOST }}" \
            --port=6543 \
            --username="${{ secrets.SUPABASE_DB_USER }}" \
            --dbname=postgres \
            --format=custom \
            --file="mentorino-$(date +%Y-%m-%d).dump" \
            --no-owner --no-acl
      - run: gzip mentorino-$(date +%Y-%m-%d).dump
      - name: Upload to Google Drive
        uses: adityak74/google-drive-upload-git-action@main
        with:
          filename: mentorino-$(date +%Y-%m-%d).dump.gz
          folderId: ${{ secrets.GOOGLE_DRIVE_BACKUP_FOLDER_ID }}
          credentials: ${{ secrets.GOOGLE_DRIVE_SERVICE_ACCOUNT }}
```

### 2.2 Database — Manual

```bash
# Full dump
pg_dump \
  --host=aws-0-us-east-1.pooler.supabase.com \
  --port=6543 \
  --username=postgres.<project-ref> \
  --dbname=postgres \
  --format=custom \
  --file=mentorino-$(date +%Y-%m-%d).dump \
  --no-owner --no-acl

gzip mentorino-$(date +%Y-%m-%d).dump

# Schema-only (for migration troubleshooting)
pg_dump --schema-only --no-owner --no-acl \
  --file=mentorino-schema-$(date +%Y-%m-%d).sql \
  "$PRODUCTION_DATABASE_URL"
```

### 2.3 Storage — Automated (Weekly)

```yaml
name: Weekly Storage Backup
on:
  schedule:
    - cron: '0 4 * * 0'    # 4:00 AM Sunday
jobs:
  backup:
    runs-on: ubuntu-latest
    steps:
      - run: curl https://rclone.org/install.sh | sudo bash
      - name: Sync to Google Drive
        run: |
          rclone sync \
            supabase:mentorino \
            gdrive:mentorino-backups/storage \
            --backup-dir gdrive:mentorino-backups/storage-archive/$(date +%Y-%m-%d) \
            --progress --verbose
```

### 2.4 Environment Secrets

```bash
# Export secrets
supabase secrets list > supabase-secrets-$(date +%Y-%m-%d).txt
vercel env list > vercel-env-$(date +%Y-%m-%d).txt

# Encrypt (AES-256)
gpg --symmetric --cipher-algo AES256 \
  supabase-secrets-$(date +%Y-%m-%d).txt \
  vercel-env-$(date +%Y-%m-%d).txt

# Store encrypted files in:
# - Google Drive (encrypted)
# - External SSD, kept in fireproof safe (encrypted)
# Password stored in physical safe (NOT in any digital system)
```

### 2.5 Auth Users

Supabase Auth `auth.users` is NOT included in `pg_dump`.

```bash
# Admin API export (manual)
supabase auth list-users > auth-users-$(date +%Y-%m-%d).json

# Supabase Dashboard alternative
# Authentication > Users > Export CSV
```

---

## 3. Disaster Recovery Procedures

### 3.1 Recovery Tiers

| Tier | RTO | RPO | Scenario |
|------|-----|-----|----------|
| **T1** | < 1 hour | < 24 hours | Database corruption, accidental data deletion |
| **T2** | < 4 hours | < 1 week | Full Supabase outage (DB + Storage) |
| **T3** | < 24 hours | < 1 month | Catastrophic failure (all infrastructure lost) |
| **T4** | < 48 hours | N/A | Migration to alternate provider |

### 3.2 T1 — Database Corruption

```bash
# 1. Stop the bleeding — disable writes
supabase db run --file scripts/disable_writes.sql

# 2. Download latest backup
rclone copy gdrive:mentorino-backups/database/mentorino-YYYY-MM-DD.dump.gz \
  ./restore/

# 3. Decompress
gunzip ./restore/mentorino-YYYY-MM-DD.dump.gz

# 4. Restore
pg_restore \
  --host="$SUPABASE_DB_HOST" --port=5432 \
  --username="$SUPABASE_DB_USER" --dbname=postgres \
  --clean --if-exists --no-owner --no-acl \
  ./restore/mentorino-YYYY-MM-DD.dump

# 5. Verify
psql "$PRODUCTION_DATABASE_URL" -c "
  SELECT count(*) as profiles FROM profiles;
  SELECT count(*) as applications FROM applications;
  SELECT count(*) as messages FROM messages;
"

# 6. Re-enable writes
supabase db run --file scripts/enable_writes.sql
```

### 3.3 T2 — Full Supabase Outage

```
1. Verify outage: https://status.supabase.com
2. Download latest DB + storage backups from Google Drive
3. Provision new Supabase project (Supabase Dashboard)
4. Link new project: supabase link --project-ref <new-ref>
5. Push all migrations: supabase db push
6. Restore data: pg_restore ... mentorino-YYYY-MM-DD.dump
7. Restore storage: rclone sync gdrive:...storage/ supabase:mentorino
8. Deploy edge functions to new project
9. Set all secrets in new project
10. Update Vercel env vars with new project URL + keys
11. Redeploy frontend: vercel --prod
12. Verify: run health check
```

### 3.4 T3 — Catastrophic Failure

```
1. Acquire latest monthly offline backup (external SSD from safe)
2. Set up new Supabase project
3. Push all migrations from supabase/migrations/
4. Restore database from offline backup
5. Restore storage from offline backup
6. Deploy edge functions, set secrets
7. Deploy frontend to Vercel
8. Update DNS if custom domain
9. Verify end-to-end health
```

### 3.5 T4 — Provider Migration

```
1. Provision target PostgreSQL (e.g., Neon, AWS RDS)
2. Restore latest database dump
3. Update supabase.ts client config
4. Migrate storage to target (if changing providers)
5. Update environment variables in Vercel
6. Deploy frontend
7. Run full test suite against new infra
```

---

## 4. Monthly Offline Backup Procedure

**First Saturday of each month:**

1. Trigger DB backup: `gh workflow run database-backup.yml`
2. Trigger storage backup: `gh workflow run storage-backup.yml`
3. Download to external SSD:
   ```bash
   rclone copy gdrive:mentorino-backups/ /Volumes/MENTORINO-BACKUP/YYYY-MM/
   ```
4. Encrypt and export secrets:
   ```bash
   supabase secrets list | gpg --symmetric --output /Volumes/MENTORINO-BACKUP/YYYY-MM/secrets.gpg
   ```
5. Verify backup integrity:
   ```bash
   pg_restore --list /Volumes/MENTORINO-BACKUP/YYYY-MM/mentorino-latest.dump | head -20
   ```
6. Disconnect SSD, store in fireproof safe

---

## 5. Verification Schedule

| Check | Frequency | Tool | Action on Failure |
|-------|-----------|------|-------------------|
| Backup job completion | Daily | GitHub Actions UI | Check logs, re-run |
| Database file integrity | Weekly | `pg_restore --list` | Re-run backup |
| Storage sync integrity | Weekly | `rclone check` | Re-sync |
| Full restore test | Monthly | Temp Supabase project | Investigate & fix |
| Secrets decryption | Quarterly | `gpg --decrypt` | Check GPG key + password |
| Provider migration test | Quarterly | Alternate PostgreSQL | Fix migration scripts |

---

## 6. Cost Summary

| Service | Feature | Monthly Cost |
|---------|---------|-------------|
| GitHub Actions | 2,000 min/mo | Free (backup uses < 60 min) |
| Google Drive | 15 GB storage | Free (backup < 2 GB) |
| Supabase Pro | Daily backups, 7-day retention | Included in plan |
| `pg_dump` / `rclone` / `gpg` | Standard tools | Free |
| **Total** | | **$0** |
