# DEPLOYMENT_GUIDE.md

**Date:** 2026-07-06  
**Application:** Mentorino

---

## 1. Prerequisites

### Required Accounts
- [ ] Supabase account (Pro tier recommended)
- [ ] Vercel account (Hobby or Pro)
- [ ] Resend account (for email)
- [ ] Google Cloud account (for Gemini API + OAuth)

### Required Tools
- Node.js 18+
- npm
- Git
- Supabase CLI (`npm install -g supabase`)
- Vercel CLI (`npm install -g vercel`)

---

## 2. Environment Variables

### Frontend (Vercel)
```
VITE_SUPABASE_URL=https://<project>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon-key>
VITE_APP_ENV=production
VITE_ENABLE_EDGE_APPROVAL=true
VITE_ENABLE_TRANSACTIONAL_PROVISIONING=false
```

### Edge Functions (Supabase Secrets)
```
SUPABASE_URL=https://<project>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
RESEND_API_KEY=<resend-api-key>
GEMINI_API_KEY=<gemini-api-key>
RESEND_AUDIENCE_ID=<resend-audience-id>
```

---

## 3. Database Setup

```bash
# Install Supabase CLI
npm install -g supabase

# Link to project
supabase link --project-ref <project-ref>

# Push all migrations
supabase db push

# Verify
supabase db diff
```

---

## 4. Edge Functions Deployment

```bash
# Deploy all functions
supabase functions deploy gemini
supabase functions deploy resend
supabase functions deploy approve-application
supabase functions deploy scheduled

# Set secrets
supabase secrets set SUPABASE_URL=<value>
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=<value>
supabase secrets set RESEND_API_KEY=<value>
supabase secrets set GEMINI_API_KEY=<value>
supabase secrets set RESEND_AUDIENCE_ID=<value>
```

---

## 5. Frontend Deployment (Vercel)

```bash
# Option A: Vercel CLI
vercel --prod

# Option B: Git push (auto-deploy)
git push origin main

# Set env vars via Vercel
vercel env add VITE_SUPABASE_URL
vercel env add VITE_SUPABASE_ANON_KEY
vercel env add VITE_APP_ENV
vercel env add VITE_ENABLE_EDGE_APPROVAL
```

---

## 6. DNS Configuration

### Vercel DNS (for mentorino.com)
```
Type: CNAME
Name: @
Target: cname.vercel-dns.com
```

### Resend DNS (for email deliverability)
```
TXT  @              v=spf1 include:spf.resend.com ~all
CNAME resend._domainkey  <from-resend-dashboard>
TXT  _dmarc         v=DMARC1; p=quarantine;
```

### Supabase Custom Domain (optional)
```
CNAME <custom>.<project>.supabase.co
```

---

## 7. Auth Configuration

### Supabase Auth Settings
- Site URL: `https://mentorino.com`
- Redirect URLs: `https://mentorino.com/auth`, `https://mentorino.com/**`
- Enable Google OAuth (if using):
  - Client ID from Google Cloud Console
  - Client Secret from Google Cloud Console

---

## 8. Post-Deployment Verification

```bash
# 1. Check build
npm run build && npm run lint

# 2. Test edge functions
curl -X POST https://<project>.supabase.co/functions/v1/health

# 3. Verify auth
# Visit https://mentorino.com/auth — should load login page

# 4. Test email
# Trigger a welcome email — verify delivery

# 5. Test AI
# Use AI assistant — verify response

# 6. Check logs
# Supabase Dashboard → Logs → Edge Functions
# Vercel Dashboard → Analytics
```

---

## 9. Monitoring

### Set up after deployment
- [ ] Configure Sentry with `VITE_SENTRY_DSN`
- [ ] Enable Vercel Analytics
- [ ] Set up Uptime monitoring (e.g., Pingdom, UptimeRobot)
- [ ] Configure Supabase Logging alerts

---

## 10. Quick Reference

| Action | Command |
|--------|---------|
| Build | `npm run build` |
| Type check | `npm run lint` |
| Deploy functions | `supabase functions deploy <name>` |
| Push migrations | `supabase db push` |
| Deploy frontend | `vercel --prod` |
| Rollback frontend | `vercel rollback` |
| Rollback migration | `supabase migration down` |
