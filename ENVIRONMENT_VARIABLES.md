# Environment Variables Reference

**App:** Mentorino  
**Last Updated:** 2026-07-06

All client-side variables must be prefixed with `VITE_`. Server-side (edge function) secrets are set via Supabase CLI or Dashboard.

---

## 1. Client-Side (Vite) Variables

Set in Vercel Dashboard > Project > Settings > Environment Variables, or in `.env.production`.

### 1.1 Required

| Variable | Validation | Default | Where to Get |
|----------|-----------|---------|--------------|
| `VITE_SUPABASE_URL` | Must start `https://`, contain `supabase.co` | — | Supabase Dashboard > Settings > API |
| `VITE_SUPABASE_ANON_KEY` | Must start `eyJ`, length > 50 | — | Supabase Dashboard > Settings > API |
| `VITE_APP_ENV` | One of: `development`, `staging`, `production` | `development` | Set per environment |

**Startup blocks** if any required var is missing or fails validation in production mode.

### 1.2 Feature Flags

| Variable | Values | Default | Purpose |
|----------|--------|---------|---------|
| `VITE_ENABLE_EDGE_APPROVAL` | `true` / `false` | `false` | Route application approval through secure edge function (enable in prod) |
| `VITE_ENABLE_TRANSACTIONAL_PROVISIONING` | `true` / `false` | `false` | State machine with idempotency/retry/rollback (requires `EDGE_APPROVAL=true`) |

### 1.3 Optional Monitoring

| Variable | Format | If Unset |
|----------|--------|----------|
| `VITE_SENTRY_DSN` | `https://<key>@<project>.ingest.us.sentry.io/<id>` | Error monitoring disabled |
| `VITE_POSTHOG_API_KEY` | `phc_<hex>` | Analytics disabled |
| `VITE_POSTHOG_HOST` | `https://<host>` | Defaults to PostHog cloud |

---

## 2. Server-Side (Supabase Edge Function Secrets)

Set via `supabase secrets set KEY=value` or Supabase Dashboard > Edge Functions > Secrets.

### 2.1 Required

| Variable | Used By | Sensitivity | Purpose |
|----------|---------|-------------|---------|
| `SUPABASE_URL` | All functions | Low | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | All functions | **CRITICAL** | Bypasses RLS — admin operations |
| `RESEND_API_KEY` | `resend`, `approve-application`, `scheduled` | **HIGH** | Email delivery via Resend |

### 2.2 Optional

| Variable | Used By | Purpose |
|----------|---------|---------|
| `GEMINI_API_KEY` | `gemini` | Google Gemini AI API key |
| `CRON_SECRET` | `scheduled` | Authenticate cron requests (shared secret) |

---

## 3. CI/CD Secrets (GitHub Actions)

Set in GitHub > Settings > Secrets and Variables > Actions.

| Secret | Purpose |
|--------|---------|
| `SUPABASE_DB_HOST` | Hostname for `pg_dump` backup |
| `SUPABASE_DB_USER` | Database user (typically `postgres.<ref>`) |
| `SUPABASE_DB_NAME` | Database name (typically `postgres`) |
| `GOOGLE_DRIVE_SERVICE_ACCOUNT` | JSON key for Google Drive backup upload |
| `GOOGLE_DRIVE_BACKUP_FOLDER_ID` | Folder ID for backup storage |
| `SLACK_WEBHOOK` | Backup failure notifications |

---

## 4. Sentinel Values (Treated as Unconfigured)

The startup guard rejects these values and blocks the app:

```
your_supabase_project_url
your_supabase_anon_key
placeholder-for-CI
placeholder-key
```

---

## 5. Validation Rules

### Production (fail-fast — blocks startup)

| Check | Condition | Error |
|-------|-----------|-------|
| `VITE_SUPABASE_URL` | Missing / sentinel / not HTTPS / no `supabase.co` | Blocks app |
| `VITE_SUPABASE_ANON_KEY` | Missing / sentinel / not JWT format / < 50 chars | Blocks app |
| `VITE_APP_ENV` | Missing / not `production` | Blocks app |
| `VITE_SENTRY_DSN` | Missing | Warning only (app starts) |
| Transactional provisioning without edge approval | Flag inconsistency | Warning only |

### Edge Functions (startup guard in Deno)

| Check | Condition | Action |
|-------|-----------|--------|
| `SUPABASE_URL` | Missing | Function returns 500 |
| `SUPABASE_SERVICE_ROLE_KEY` | Missing | Function returns 500 |
| `RESEND_API_KEY` | Missing | Email functions return 500 |
| `CRON_SECRET` | Missing | Warning in logs |

---

## 6. Key Rotation Procedure

### Supabase Anon Key
```bash
# 1. Generate new key in Supabase Dashboard > Settings > API
# 2. Update Vercel: vercel env rm VITE_SUPABASE_ANON_KEY; vercel env add
# 3. Redeploy: vercel --prod
# 4. Verify auth flows still work
```

### Service Role Key
```bash
# 1. Generate new key in Supabase Dashboard > Settings > API
# 2. Update edge function secrets: supabase secrets set SUPABASE_SERVICE_ROLE_KEY=<new>
# 3. Verify edge functions respond
# 4. Rotate old key out of any offline backups
```

### Resend API Key
```bash
# 1. Generate new key in Resend Dashboard
# 2. supabase secrets set RESEND_API_KEY=<new>
# 3. Send test email via resend function
```

---

## 7. File Reference

| File | Git | Purpose |
|------|-----|---------|
| `.env` | Committed | CI-safe defaults (development placeholders) |
| `.env.example` | Committed | Template with all variables documented |
| `.env.production` | Committed | Production template (secrets redacted) |
| `.env.staging` | Committed | Staging config with real staging keys |
| `.env.local` | **Never commit** | Local overrides, real secrets |

---

## 8. Common Issues

| Symptom | Likely Cause | Fix |
|---------|-------------|-----|
| Blank screen, "Startup Blocked" | Missing / invalid `VITE_SUPABASE_URL` or `VITE_APP_ENV` | Check Vercel env vars, redeploy |
| Auth fails silently | Wrong `VITE_SUPABASE_ANON_KEY` | Verify key matches Supabase project |
| Edge functions return 500 | Missing `SUPABASE_SERVICE_ROLE_KEY` | `supabase secrets set` |
| Emails not sending | Missing `RESEND_API_KEY` | Set secret in Supabase |
| Sentry shows no data | `VITE_SENTRY_DSN` not set | Configure DSN in Vercel env vars |
