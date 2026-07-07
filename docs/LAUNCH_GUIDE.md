# Launch Guide

## Pre-Launch Checklist

### Week Before Launch

- [ ] All 44 database migrations applied to production Supabase
- [ ] All 4 edge functions deployed to production
- [ ] Storage buckets created with correct RLS policies
- [ ] Realtime enabled on `messages`, `notifications`, `sessions`, `bookings`
- [ ] Production environment variables configured in Vercel
- [ ] Sentry DSN configured for error monitoring
- [ ] CI pipeline passes on `master` branch
- [ ] All Playwright E2E tests pass
- [ ] Unit tests pass with coverage

### 48 Hours Before Launch

- [ ] Staging deployment verified end-to-end
- [ ] Email templates tested with Resend
- [ ] Cron jobs configured in Supabase
- [ ] Health check run on staging
- [ ] Load testing completed (if applicable)
- [ ] SSL certificate verified (Vercel handles this automatically)

### 24 Hours Before Launch

- [ ] Final production build verified
- [ ] Rollback procedure documented and tested
- [ ] Support contact established
- [ ] Monitoring alerts configured
- [ ] Backup of production database taken

### Launch Day

- [ ] Deploy to production (Vercel)
- [ ] Run health check immediately after deploy
- [ ] Test authentication flow
- [ ] Test application submission flow
- [ ] Test mentor dashboard
- [ ] Test messaging/realtime
- [ ] Monitor Sentry for errors (first 30 min)
- [ ] Monitor Supabase for unusual queries (first hour)

### Post-Launch (First Week)

- [ ] Daily health check review
- [ ] Check Sentry error trends daily
- [ ] Monitor free tier usage
- [ ] Collect user feedback
- [ ] Review application logs

## Deployment Steps

```bash
# 1. Build
npm run build

# 2. Deploy edge functions
supabase functions deploy approve-application
supabase functions deploy gemini
supabase functions deploy resend
supabase functions deploy scheduled

# 3. Deploy frontend to Vercel
vercel --prod

# 4. Verify
curl https://mentorino.app/
```

## Rollback Steps

See [ROLLBACK_GUIDE.md](./ROLLBACK_GUIDE.md) for complete rollback procedures.

## Health Verification

After deployment, verify:

1. **Application loads**: Visit the production URL
2. **Authentication**: Sign in with a test account
3. **Database**: Create and query data
4. **Storage**: Upload and download files
5. **Realtime**: Open two sessions and verify real-time updates
6. **Email**: Trigger a welcome email
7. **Edge Functions**: Test Gemini AI and scheduled tasks
8. **SSL**: Verify HTTPS is working

## Communication

| Channel | Purpose |
|---------|---------|
| Sentry | Error monitoring and alerting |
| Vercel Dashboard | Deployment status and logs |
| Supabase Dashboard | Database and infrastructure monitoring |

## Emergency Contacts

- **Infrastructure**: Check project README for maintainer contacts
- **Supabase**: Supabase Dashboard support
- **Vercel**: Vercel support (vercel.com/help)
