# FINAL_LAUNCH_CHECKLIST.md

**Date:** 2026-07-06  
**Application:** Mentorino

---

## 🚦 Pre-Launch (24 Hours Before)

### Infrastructure

- [ ] **Supabase Pro upgrade** — Dashboard → Billing → Pro ($25/mo)
- [ ] **Supabase production URL** — Verify `VITE_SUPABASE_URL` in Vercel
- [ ] **Supabase anon key** — Verify `VITE_SUPABASE_ANON_KEY` in Vercel
- [ ] **Edge function secrets** — Set `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, `GEMINI_API_KEY`
- [ ] **Resend domain** — Add `notifications@mentorino.com` → verify via DNS
- [ ] **Resend API key** — Create and store in Supabase secrets
- [ ] **Gemini API key** — Create and store in Supabase secrets

### DNS

- [ ] **Vercel DNS** — Point `mentorino.com` CNAME to `cname.vercel-dns.com`
- [ ] **SPF record** — `v=spf1 include:spf.resend.com ~all`
- [ ] **DKIM record** — CNAME from Resend dashboard
- [ ] **DMARC record** — `v=DMARC1; p=quarantine; rua=mailto:dmarc@mentorino.com`
- [ ] **SSL certificate** — Auto via Vercel, verify green lock

### Build & Deploy

- [ ] ✅ `npm run build` — Zero errors
- [ ] ✅ `npm run lint` — Zero errors
- [ ] **Edge functions deploy** — `supabase functions deploy`
- [ ] **Database migrations** — `supabase db push`
- [ ] **Vercel deploy** — Push to production branch

---

## 🚀 Launch Day

### Phase 1: Soft Launch (30 min)

- [ ] Deploy to production
- [ ] Visit https://mentorino.com — loads correctly
- [ ] Register a test student account
- [ ] Approve application as mentor
- [ ] Login as student, navigate dashboard
- [ ] Send test email via Resend
- [ ] Test Gemini AI assistant
- [ ] Check Supabase logs for errors

### Phase 2: Monitor (2 hours)

- [ ] Supabase logs — no auth errors
- [ ] Edge function logs — no failures
- [ ] Vercel analytics — no 5xx errors
- [ ] Email delivery — no bounces
- [ ] Realtime — subscriptions active

### Phase 3: Full Launch

- [ ] Enable public access
- [ ] Post on social channels
- [ ] Monitor error rates for 24 hours
- [ ] Scale resources if needed

---

## 📋 Post-Launch (First Week)

### Daily

- [ ] Check Supabase logs
- [ ] Check Vercel analytics
- [ ] Verify email deliverability
- [ ] Verify AI responses

### Week 1

- [ ] Review error tracking (Sentry)
- [ ] Performance review (Lighthouse)
- [ ] User feedback collection
- [ ] Check database size / storage usage

---

## 🆘 Rollback Triggers

| Trigger | Action | Target Time |
|---------|--------|-------------|
| 5xx errors > 1% | Rollback Vercel deployment | 5 min |
| Email delivery failure > 10% | Fallback to console/supabase internal email | 15 min |
| Auth failures > 5% | Rollback to previous version | 10 min |
| Security incident | Full DR plan activation | Immediate |
| Database corruption | Restore from backup | 30 min |

---

## ✅ Launch Approval

| Approver | Role | Signature |
|----------|------|-----------|
| | DevOps | _____________ |
| | QA Lead | _____________ |
| | Product Owner | _____________ |
| | Security Lead | _____________ |
