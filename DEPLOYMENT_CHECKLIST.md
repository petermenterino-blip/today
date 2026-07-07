# DEPLOYMENT_CHECKLIST.md

**Date:** 2026-07-06  
**Target:** Production Launch

---

## 1. Environment Variables

### Required for Build (Vite — client-side)
| Variable | Source | Status |
|----------|--------|--------|
| `VITE_SUPABASE_URL` | Supabase Project Settings → API → Project URL | ⚠️ Set placeholder — verify production URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase Project Settings → API → Anon Key | ⚠️ Set placeholder — verify production key |
| `VITE_APP_ENV` | Set to `production` | ⚠️ Not set |
| `VITE_ENABLE_EDGE_APPROVAL` | `true` for production | ⚠️ Set to `false` |
| `VITE_SENTRY_DSN` (optional) | Sentry Project → Client Keys → DSN | ⚠️ Not configured |

### Required for Edge Functions (Supabase Secrets)
| Secret | Source | Status |
|--------|--------|--------|
| `SUPABASE_URL` | Supabase Project URL | ⚠️ Must set |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Project Settings → API → Service Role Key | ⚠️ Must set |
| `RESEND_API_KEY` | Resend Dashboard → API Keys | ⚠️ Must set |
| `GEMINI_API_KEY` | Google AI Studio → API Keys | ⚠️ Must set |
| `RESEND_AUDIENCE_ID` | Resend Dashboard → Audiences | ⚠️ Must set |

### Set via Supabase Dashboard
```
Supabase → Edge Functions → [function-name] → Environment Variables
```

---

## 2. Supabase Setup

| Task | Status | Instructions |
|------|--------|-------------|
| Project type upgraded to Pro | ⚠️ Not done | `Free → Pro ($25/mo)` when exceeding limits |
| Custom domain configured | ⚠️ Not done | Supabase Dashboard → Settings → Custom Domain |
| Database migrations applied | ✅ Done | All migrations up to `0302_messaging_fixes.sql` |
| Storage buckets created | ✅ Done | Via migrations `014_storage.sql` + `020_module6_complete.sql` |
| Edge functions deployed | ✅ Done | `gemini`, `resend`, `approve-application`, `scheduled` |
| Auth redirect URLs configured | ⚠️ Must verify | Supabase → Auth → URL Configuration → Add production URL |
| Email templates customized | ✅ Done | Welcome template includes temp password |
| RLS policies verified | ✅ Done | All tables + storage buckets |
| Realtime enabled | ✅ Done | `supabase_realtime` publication configured |

### Auth URL Configuration (Supabase Dashboard)
```
Site URL: https://mentorino.com
Redirect URLs:
- https://mentorino.com/auth
- https://mentorino.com/**
```

---

## 3. Vercel Setup

| Task | Status | Details |
|------|--------|---------|
| Git repository connected | ⚠️ Must verify | Vercel → Import Git Repository |
| Build command | ✅ Configured | `npm run build` |
| Output directory | ✅ Configured | `dist` |
| Environment variables set | ⚠️ Must verify | Add all `VITE_*` vars |
| Custom domain configured | ⚠️ Not done | Vercel → Domains → `mentorino.com` |
| SSL certificate | ✅ Auto | Vercel provisions SSL automatically |
| Preview deployments | ✅ Default | Vercel auto-creates preview per PR |
| Production branch | ⚠️ Must verify | Set to `main` or `production` |
| Framework preset | ✅ Auto | Vite detected automatically |

### Vercel Environment Variables
```
VITE_SUPABASE_URL=<production-url>
VITE_SUPABASE_ANON_KEY=<production-anon-key>
VITE_APP_ENV=production
VITE_ENABLE_EDGE_APPROVAL=true
VITE_SENTRY_DSN=<production-dsn> (optional)
```

---

## 4. Resend Setup

| Task | Status | Details |
|------|--------|---------|
| Domain verified | ⚠️ **REQUIRED** | Add `notifications@mentorino.com` in Resend Dashboard |
| SPF record | ⚠️ Required | `v=spf1 include:spf.resend.com ~all` |
| DKIM records | ⚠️ Required | CNAME records from Resend Dashboard |
| DMARC policy | ⚠️ Recommended | `v=DMARC1; p=quarantine;` |
| API key created | ⚠️ Must do | Resend Dashboard → API Keys |
| Sent From address | ✅ Hardcoded | `notifications@mentorino.com` |
| API key in Supabase secrets | ⚠️ Must set | Edge function env var |

---

## 5. Gemini Setup

| Task | Status | Details |
|------|--------|---------|
| API key created | ⚠️ Must do | Google AI Studio → Get API Key |
| Model selected | ⚠️ Review | Currently uses `flash-exp` — switch to stable `flash` |
| API key in Supabase secrets | ⚠️ Must set | Edge function env var |
| Rate limits configured | ✅ Done | 30 requests/min in code |
| Quota sufficient | ⚠️ Verify | Free tier: 60 requests/min |

---

## 6. Google OAuth Setup

| Task | Status | Details |
|------|--------|---------|
| OAuth consent screen | ⚠️ Must verify | Google Cloud Console → APIs & Services → OAuth |
| Client ID created | ⚠️ Must verify | For production domain |
| Client secret created | ⚠️ Must verify | Keep secure |
| Supabase OAuth config | ⚠️ Must verify | Supabase → Auth → Providers → Google |
| Redirect URI configured | ⚠️ Must verify | `https://mentorino.com/auth/v1/callback` |

---

## 7. Storage Configuration

| Bucket | Public | Size Limit | Status |
|--------|--------|------------|--------|
| `profile-avatars` | ✅ Public | 2 MB | ✅ Migrated |
| `student-documents` | ❌ Private | 10 MB | ✅ Migrated |
| `mentor-resources` | ❌ Private | 50 MB | ✅ Migrated |
| `gallery-images` | ✅ Public | 5 MB | ✅ Migrated |
| `message-attachments` | ❌ Private | 25 MB | ✅ Migrated |
| `shared_files` | ❌ Private | 50 MB | ✅ Migrated (020_module6_complete.sql) |

---

## 8. Realtime Configuration

| Check | Status | Details |
|-------|--------|---------|
| Supabase Realtime enabled | ✅ Done | `supabase_realtime` publication |
| Tables in publication | ✅ Done | ~20 tables enabled |
| Client subscription setup | ✅ Done | `realtimeManager.ts` handles subscriptions |
| Presence enabled | ✅ Verified | For online status |

---

## 9. Cron Jobs

| Job | Status | Details |
|-----|--------|---------|
| Scheduled edge function | ✅ Deployed | `scheduled` function for maintenance tasks |

---

## 10. Pre-Launch Verification

| Check | Command | Expected |
|-------|---------|----------|
| Build succeeds | `npm run build` | ✅ PASS |
| TypeScript check | `npm run lint` | ✅ PASS |
| Edge functions deploy | `supabase functions deploy` | ⚠️ Must do |
| Database migrations | `supabase db push` | ⚠️ Must verify |
| Production preview | `npm run preview` | ✅ PASS |

---

## Summary

```
╔══════════════════════════════════════════════════════════════╗
║  DEPLOYMENT: ⚠️ Ready with actions                          ║
║                                                             ║
║  ✅ Build & TypeScript pass                                  ║
║  ✅ Migrations applied                                       ║
║  ✅ Edge functions deployed                                  ║
║  ⚠️ DNS / Domain verification needed                         ║
║  ⚠️ Resend domain verification needed                        ║
║  ⚠️ Vercel env vars need production values                   ║
╚══════════════════════════════════════════════════════════════╝
```
