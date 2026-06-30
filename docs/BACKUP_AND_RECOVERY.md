# Mentorino — Backup & Disaster Recovery Strategy

Version: 1.0

---

## 1. Overview

This document defines the complete automated backup and disaster recovery strategy for Mentorino.

The strategy is designed to operate within free-tier limits while providing production-grade data safety.

### Data Assets

| Asset | Location | Size Estimate | Criticality |
|-------|----------|---------------|-------------|
| PostgreSQL Database | Supabase | ~100MB at 1K students | **Critical** |
| File Storage | Supabase Storage | ~500MB at 1K students | High |
| Source Code | GitHub | ~50MB | **Critical** |
| Environment Secrets | Edge Functions + offline | ~2KB | **Critical** |
| Documentation | GitHub | ~1MB | Medium |

---

## 2. Backup Schedule

| Frequency | Asset | Tool | Destination | Retention |
|-----------|-------|------|-------------|-----------|
| **Daily** | Database | `pg_dump` (script) | Google Drive | 30 days |
| **Weekly** | Storage files | `rclone` | Google Drive | 4 weeks |
| **Weekly** | Full backup bundle | Combined script | Google Drive | 4 weeks |
| **Monthly** | Full backup | Manual + script | Offline (external drive) | 12 months |
| **Continuous** | Source code | `git push` | GitHub | Forever |

---

## 3. Database Backup (Daily)

### 3.1 Tool: `pg_dump` via GitHub Actions

```yaml
# .github/workflows/database-backup.yml
name: Daily Database Backup

on:
  schedule:
    - cron: '0 3 * * *'  # 3:00 AM daily

jobs:
  backup:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Install pg_dump
        run: sudo apt-get install -y postgresql-client

      - name: Dump database
        run: |
          pg_dump \
            --host="${{ secrets.SUPABASE_DB_HOST }}" \
            --port=5432 \
            --username="${{ secrets.SUPABASE_DB_USER }}" \
            --dbname="${{ secrets.SUPABASE_DB_NAME }}" \
            --format=custom \
            --file="mentorino-$(date +%Y-%m-%d).dump" \
            --no-owner \
            --no-acl

      - name: Compress backup
        run: gzip mentorino-$(date +%Y-%m-%d).dump

      - name: Upload to Google Drive
        uses: adityak74/google-drive-upload-git-action@main
        with:
          filename: mentorino-$(date +%Y-%m-%d).dump.gz
          folderId: ${{ secrets.GOOGLE_DRIVE_BACKUP_FOLDER_ID }}
          credentials: ${{ secrets.GOOGLE_DRIVE_SERVICE_ACCOUNT }}
```

### 3.2 Manual Backup Command

```bash
pg_dump \
  --host=aws-0-us-east-1.pooler.supabase.com \
  --port=6543 \
  --username=postgres.XXXXX \
  --dbname=postgres \
  --format=custom \
  --file=mentorino-manual-$(date +%Y-%m-%d).dump \
  --no-owner \
  --no-acl

gzip mentorino-manual-$(date +%Y-%m-%d).dump
```

### 3.3 What the Backup Contains

- All table data (public schema)
- Functions, triggers, RLS policies
- Indexes, constraints, sequences
- Does NOT include: `auth.users` passwords (hashed), `auth.sessions` (recreatable)

Note: Supabase Auth metadata (`auth.users`) is backed up SEPARATELY via Supabase dashboard export.

---

## 4. Storage Backup (Weekly)

### 4.1 Tool: `rclone` via GitHub Actions

```yaml
# .github/workflows/storage-backup.yml
name: Weekly Storage Backup

on:
  schedule:
    - cron: '0 4 * * 0'  # 4:00 AM Sunday

jobs:
  backup:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Install rclone
        run: |
          curl https://rclone.org/install.sh | sudo bash

      - name: Configure rclone
        run: |
          mkdir -p ~/.config/rclone
          cat > ~/.config/rclone/rclone.conf << EOF
          [supabase]
          type = s3
          provider = AWS
          access_key_id = ${{ secrets.SUPABASE_S3_ACCESS_KEY }}
          secret_access_key = ${{ secrets.SUPABASE_S3_SECRET_KEY }}
          endpoint = https://${{ secrets.SUPABASE_PROJECT_ID }}.supabase.co/storage/v1/s3
          region = us-east-1

          [gdrive]
          type = drive
          scope = drive
          token = ${{ secrets.GOOGLE_DRIVE_RCLONE_TOKEN }}
          EOF

      - name: Sync storage to Google Drive
        run: |
          rclone sync supabase:mentorino gdrive:mentorino-backups/storage \
            --backup-dir gdrive:mentorino-backups/storage-archive/$(date +%Y-%m-%d) \
            --progress \
            --verbose

      - name: Notify on failure
        if: failure()
        uses: slackapi/slack-github-action@v1
        with:
          payload: '{"text":"⚠️ Storage backup FAILED"}'
        env:
          SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK }}
```

---

## 5. GitHub + Source Code Backup

Source code backup is inherent in Git workflow:

| Mechanism | Coverage |
|-----------|----------|
| `git push` to GitHub | All commits |
| GitHub private repo | Full history |
| Local clones | Developer machines |
| Release tags | Stable checkpoints |

### 5.1 Backup Verification

```bash
# Verify local clone has latest
git fetch origin
git log --oneline origin/main -1

# Verify remote is accessible
gh repo view mentorino --json defaultBranch
```

---

## 6. Environment Secrets Backup

### 6.1 Encrypted Offline Backup

```bash
# Export edge function secrets
supabase secrets list > supabase-secrets-$(date +%Y-%m-%d).txt

# Export Vercel environment variables
vercel env list > vercel-env-$(date +%Y-%m-%d).txt

# Encrypt with GPG
gpg --symmetric --cipher-algo AES256 \
  supabase-secrets-$(date +%Y-%m-%d).txt \
  vercel-env-$(date +%Y-%m-%d).txt
```

The encrypted file is stored:
- Google Drive (encrypted)
- Offline external drive (encrypted)
- Password stored in physical safe (NOT in any digital system)

### 6.2 Secret Inventory

| Secret | Location | Backup Method |
|--------|----------|---------------|
| SUPABASE_URL | Vercel + .env.example | In backup doc |
| SUPABASE_ANON_KEY | Vercel + .env.example | In backup doc |
| SUPABASE_SERVICE_ROLE_KEY | Supabase secrets | GPG-encrypted file |
| GEMINI_API_KEY | Supabase secrets | GPG-encrypted file |
| RESEND_API_KEY | Supabase secrets | GPG-encrypted file |
| GOOGLE_CLIENT_ID | Supabase secrets | GPG-encrypted file |
| GOOGLE_CLIENT_SECRET | Supabase secrets | GPG-encrypted file |
| SENTRY_DSN | Vercel | In backup doc |
| VITE_POSTHOG_KEY | Vercel | In backup doc |
| SUPABASE_DB_HOST | GitHub Actions secrets | GPG-encrypted file |
| SUPABASE_DB_USER | GitHub Actions secrets | GPG-encrypted file |
| SUPABASE_DB_NAME | GitHub Actions secrets | GPG-encrypted file |
| GOOGLE_DRIVE_SERVICE_ACCOUNT | GitHub Actions secrets | GPG-encrypted file |
| GOOGLE_DRIVE_BACKUP_FOLDER_ID | GitHub Actions secrets | GPG-encrypted file |

---

## 7. Disaster Recovery Procedures

### 7.1 Recovery Tiers

| Tier | RTO (Recovery Time) | RPO (Recovery Point) | Scenario |
|------|---------------------|----------------------|----------|
| T1 | < 1 hour | < 24 hours | Database corruption |
| T2 | < 4 hours | < 1 week | Full Supabase outage |
| T3 | < 24 hours | < 1 month | Catastrophic failure |
| T4 | < 48 hours | N/A | Migration to new provider |

### 7.2 T1 — Database Corruption Recovery

```bash
# Step 1: Download latest backup
rclone copy gdrive:mentorino-backups/database/mentorino-YYYY-MM-DD.dump.gz ./restore/

# Step 2: Decompress
gunzip mentorino-YYYY-MM-DD.dump.gz

# Step 3: Restore to Supabase (requires service_role or superuser)
pg_restore \
  --host=$SUPABASE_DB_HOST \
  --port=5432 \
  --username=$SUPABASE_DB_USER \
  --dbname=postgres \
  --clean \
  --if-exists \
  --no-owner \
  --no-acl \
  mentorino-YYYY-MM-DD.dump

# Step 4: Verify
psql --host=$SUPABASE_DB_HOST --username=$SUPABASE_DB_USER --dbname=postgres -c "SELECT count(*) FROM profiles;"
```

### 7.3 T2 — Full Supabase Outage Recovery

```
1. Verify outage is not DNS/network issue
2. Download latest database backup from Google Drive
3. Download latest storage backup from Google Drive
4. Set up new PostgreSQL instance:
   Option A: Neon (free tier, PostgreSQL-compatible)
   Option B: Railway (free tier, PostgreSQL)
   Option C: Self-hosted PostgreSQL (temporary)
5. Restore database to new PostgreSQL instance
6. Set up new storage:
   Option A: AWS S3 (free tier: 5GB)
   Option B: Backblaze B2 (free tier: 10GB)
   Option C: Cloudflare R2 (free tier: 10GB)
7. Update environment variables:
   - New DATABASE_URL
   - New STORAGE_ENDPOINT
   - New STORAGE_ACCESS_KEY
   - New STORAGE_SECRET_KEY
8. Deploy frontend with new env vars:
   - VITE_SUPABASE_URL → new Supabase/Neon URL
   - VITE_SUPABASE_ANON_KEY → new anon key
9. Verify:
   - Login works
   - Data loads
   - Files accessible
   - All features functional
```

### 7.4 T3 — Catastrophic Failure Recovery

```
1. Acquire latest monthly offline backup
2. Set up new Supabase project
3. Run all migrations from supabase/migrations/
4. Restore database from backup
5. Restore storage files
6. Reconfigure Edge Functions with secrets
7. Deploy frontend
8. Update DNS (if custom domain)
9. Verify end-to-end
```

### 7.5 T4 — Migration to Another PostgreSQL Provider

This procedure is tested quarterly to ensure vendor portability.

```
1. Provision target PostgreSQL (e.g., Neon, Railway, AWS RDS)
2. Restore latest database dump
3. Update supabase.ts client to point to new Supabase project or direct PostgreSQL
4. Update service layer if provider-specific APIs differ
5. Reconfigure RLS (if new Supabase project)
6. Migrate storage to target provider
7. Update environment variables
8. Deploy
9. Verify against test suite
```

---

## 8. Monthly Offline Backup Procedure

### 8.1 Process (First Saturday of Each Month)

```
1. Trigger database backup:
   gh workflow run database-backup.yml

2. Trigger storage backup:
   gh workflow run storage-backup.yml

3. Download both to local machine:
   rclone copy gdrive:mentorino-backups/database/mentorino-latest.dump.gz /offline-drive/mentorino/$(date +%Y-%m)/
   rclone copy gdrive:mentorino-backups/storage /offline-drive/mentorino/$(date +%Y-%m)/

4. Export and encrypt secrets:
   supabase secrets list | gpg --symmetric --output /offline-drive/mentorino/$(date +%Y-%m)/secrets.gpg

5. Verify backup integrity:
   pg_restore --list /offline-drive/mentorino/$(date +%Y-%m)/mentorino-latest.dump | head -20

6. Disconnect external drive and store in fireproof safe
```

### 8.2 Offline Storage Requirements

| Item | Specification |
|------|---------------|
| Drive type | External SSD (500GB+), encrypted |
| File system | APFS (Mac) or ext4 (Linux) |
| Encryption | LUKS (Linux) or FileVault (Mac) |
| Physical storage | Fireproof safe, offsite copy |
| Label format | `MENTORINO-BACKUP-YYYY-MM` |

---

## 9. Backup Verification Schedule

| Check | Frequency | Action |
|-------|-----------|--------|
| Backup job completion | Daily | Verify GitHub Actions passed |
| Database integrity | Weekly | `pg_restore --list` to verify file valid |
| Storage integrity | Weekly | `rclone check` between Supabase and Google Drive |
| Full restore test | Monthly | Spin up temporary Supabase project, restore, verify |
| Secret restore test | Quarterly | Decrypt secrets backup, verify against current |
| Migration test | Quarterly | Restore to alternate PostgreSQL provider |

---

## 10. Recovery Time Objectives

| Scenario | Target RTO | Actual (estimated) |
|----------|-----------|-------------------|
| Accidental data deletion | < 1 hour | ~15 min |
| Database corruption | < 2 hours | ~30 min |
| Storage data loss | < 4 hours | ~1 hour |
| Full Supabase outage | < 8 hours | ~2 hours |
| Catastrophic (all infra lost) | < 48 hours | ~6 hours |
| Migration to new provider | < 24 hours | ~4 hours |

---

## 11. Cost Analysis (Free Tier)

| Service | Backup Feature | Cost |
|---------|---------------|------|
| GitHub Actions | 2,000 min/month free | Free (backups use < 60 min) |
| Google Drive | 15GB free | Free (backup < 2GB) |
| pg_dump | Standard PostgreSQL tool | Free |
| rclone | Open source | Free |
| GPG | Standard encryption | Free |

Total monthly backup cost: **$0**

---

## 12. Supabase Auth Users Backup

Supabase Auth users (`auth.users` table) are NOT included in `pg_dump` schema backups.

### Alternative Backup Methods

1. **Supabase Dashboard Export (Manual)**
   - Authentication → Users → Export CSV
   - Saved to Google Drive monthly

2. **Admin API Backup (Automated — Future)**
   - Edge function calls `supabase.auth.admin.listUsers()`
   - Saves paginated results to a backup table
   - Backs up `email`, `created_at`, `last_sign_in_at`, `user_metadata`
   - Passwords cannot be exported (hashed in Auth system)

3. **Re-creation Process**
   - On full restore, users must reset passwords via "Forgot Password" flow
   - Profile data is restored from `profiles` table
   - Enrollment data is restored from `program_enrollments`, `sessions`, etc.

---

## 13. Monitoring Alerts

| Alert Condition | Action |
|----------------|--------|
| Backup workflow fails 2+ consecutive days | Email notification to developer |
| Database size exceeds 1.5GB (75% of free tier) | Upgrade to Pro or prune data |
| Storage size exceeds 500MB | Prune old files or upgrade |
| Restore test fails | Investigate and fix immediately |
| Secrets decryption fails | Check GPG key + password |
