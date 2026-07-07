# Performance Checklist — Mentorino

> Pre-deployment checklist. Run before each production release.

---

## Database

- [ ] All tables have `created_at` and `updated_at` timestamps with indexes
- [ ] All foreign keys have matching indexes
- [ ] `EXPLAIN ANALYZE` run on top 5 slowest queries (check Supabase Dashboard)
- [ ] No sequential scans on tables >1,000 rows (check `pg_stat_user_tables`)
- [ ] RLS policies use indexed columns (no full table scans)
- [ ] No `SELECT *` in production queries — select only needed columns
- [ ] `IN` clauses use batched queries (not per-row iteration)
- [ ] All `useSharedRealtimeData` subscriptions are limited to essential tables only
- [ ] Messages table has cleanup mechanism (TTL <90 days)
- [ ] Analytics events table has TTL and index on `(event_type, created_at)`
- [ ] Provisioning audit logs have index on `(provisioning_job_id, created_at)`
- [ ] No `n+1` query patterns in service layer or edge functions

## Indexes

- [x] `idx_messages_conv_created` exists (chat pagination)
- [ ] `idx_messages_sender_created` exists (sender history)
- [ ] `idx_messages_conv_sender_status` exists (unread counts)
- [x] `idx_sessions_mentor_start` exists (mentor calendar)
- [ ] `idx_sessions_student_start` exists (student calendar)
- [x] `idx_notifications_user_read_created` exists (notifications)
- [x] `idx_tasks_student_status` exists (task lists)
- [x] `idx_goals_student_status` exists (goal lists)
- [x] `idx_journals_student_created` exists (journal timeline)
- [x] `idx_profiles_role_mentor` exists (mentee listing)
- [x] `idx_profiles_id_role` exists (auth RLS)
- [ ] `idx_event_attendees_user_event` exists (RSVP)
- [ ] `idx_analytics_events_type_created` exists (analytics)
- [ ] `idx_provisioning_audit_job_created` exists (audit trail)

## Realtime

- [ ] Only essential tables in `supabase_realtime` publication (target: 4-5 max)
- [ ] No duplicate channel subscriptions for the same table
- [ ] Each user opens ≤10 Realtime channels (target: 1-2 consolidated)
- [ ] Debounce time is ≥2,000ms for query invalidation
- [ ] `refetchType: 'active'` is set on all invalidation calls
- [ ] All channels are properly cleaned up on component unmount
- [ ] Presence channels cleaned up (WhatsAppMessaging)
- [ ] Channel naming does not leak PII

## Storage

- [ ] All image uploads go through `compressImage()` utility
- [ ] Avatars: max 400×400, quality 0.8
- [ ] Gallery images: max 1920×1080, quality 0.85
- [ ] No n+1 signed URL generation in `listFiles()`
- [ ] `getPublicUrlFromPath()` uses `getPublicUrl()` for public buckets
- [ ] `cacheControl: '3600'` set on all uploads
- [ ] Orphaned storage files are cleaned up when DB records are deleted
- [ ] File size limits enforced at upload (5 MB avatars, 10 MB docs, 100 MB resources)
- [ ] Signed URLs: minimum necessary expiry time

## Edge Functions

- [ ] No sequential DB queries in loops (batched with `IN` clauses)
- [ ] Rate limiting configured for all functions
- [ ] CORS headers set for all responses
- [ ] Auth verification on all protected functions
- [ ] Error responses include structured JSON (not raw errors)
- [ ] No secrets leaked in error messages or logs
- [ ] `scheduled` function completes within 10s (Supabase Free limit)
- [ ] `gemini` streaming handles partial chunk parsing correctly
- [ ] `approve-application` idempotency keys prevent duplicate provisioning

## Caching

- [ ] TanStack React Query stale times are set per-query (not all default)
- [ ] `gcTime` is set (30 min for normal queries)
- [ ] `refetchOnWindowFocus: false` (avoids unnecessary refetches)
- [ ] `refetchOnReconnect: false` (manual invalidation on reconnect)
- [ ] Offline fallback cache has TTL (5 min)
- [ ] Context engine cache has TTL (30s)
- [ ] IndexedDB or Service Worker for offline support (if implemented)
- [ ] CDN caching configured for static assets (`Cache-Control: public, immutable`)
- [ ] Supabase query results cached client-side (React Query)
- [ ] Public pages have HTTP cache headers

## React Rendering

- [ ] All routes are lazy-loaded with `React.lazy()` + `<Suspense>`
- [ ] All dashboard tabs are lazy-loaded
- [ ] Skeleton loaders for all lazy components (not just spinner)
- [ ] `React.memo` on list components that receive props
- [ ] `useMemo` for expensive computations (not primitive derivations)
- [ ] `useCallback` for callback props passed to child components
- [ ] No `useState` for derived data (use `useMemo` instead)
- [ ] `AuthContext` value is memoized to prevent cascading re-renders
- [ ] No large inline objects/functions in render (causes re-renders)
- [ ] `useDashboard` is split into smaller hooks (not 50+ state vars)

## Bundle Size

- [ ] `reportCompressedSize: true` in vite.config.ts
- [ ] `chunkSizeWarningLimit: 500` (KB) in vite.config.ts
- [ ] `vendor` chunk < 200 KB gzip
- [ ] `vendor-ui` chunk < 150 KB gzip
- [ ] Each lazy page chunk < 100 KB gzip
- [ ] Bundle analysis run in CI (prevents regressions)
- [ ] Tree-shaking verified (no dead imports from `lucide-react`, etc.)
- [ ] Dynamic imports for heavy libraries (jspdf, xlsx, hls.js)
- [ ] No duplicate dependencies in package-lock.json
- [ ] Remove `motion` if animation budget is tight (saves 38 KB gzip)

## Images

- [ ] All `<img>` tags have `loading="lazy"` and `decoding="async"`
- [ ] All `<img>` tags have explicit `width` and `height`
- [ ] All images use modern formats (WebP/AVIF) via `<picture>` element
- [ ] No Google Drive URLs used for production images
- [ ] Hero images preloaded with `<link rel="preload">`
- [ ] Responsive images with `srcSet` for different viewports
- [ ] Image compression applied before upload to Supabase Storage
- [ ] No base64-encoded images in JS bundles

## Monitoring

- [ ] Supabase Database > Query Performance checked weekly
- [ ] Supabase Storage usage tracked monthly
- [ ] Vercel Analytics enabled for RUM data
- [ ] Resend dashboard checked for email quota warnings
- [ ] Sentry error tracking enabled for JS errors
- [ ] Performance tracking (`src/lib/performance.ts`) captures key metrics
- [ ] Health checks (`src/lib/healthCheck.ts`) run on each deployment
- [ ] Bundle size tracked against baseline
- [ ] Lighthouse score: >90 Performance, >90 Accessibility, >90 SEO

## Pre-Launch

- [ ] `npm run build` succeeds
- [ ] `npx tsc --noEmit` passes with 0 errors
- [ ] `npm test` passes (unit tests)
- [ ] Lighthouse audit on Landing, Auth, Student Dashboard, Mentor Dashboard
- [ ] All `<img>` tags audit (lazy loading, dimensions, alt text)
- [ ] Realtime channel count verified in DevTools
- [ ] Supabase query performance reviewed
- [ ] Bundle size within free tier limits
- [ ] Edge function cold start times acceptable (<1s)
- [ ] `.env.production` validated for all required vars

## Free Tier Gate (Stop if Exceeded)

- [ ] Database < 400 MB (Supabase Free: 500 MB)
- [ ] Supabase Bandwidth < 4 GB/month (Free: 5 GB)
- [ ] Supabase Storage < 800 MB (Free: 1 GB)
- [ ] Realtime Connections < 400 concurrent (Free: 500)
- [ ] Edge Function Invocations < 400k/month (Free: 500k)
- [ ] Resend Emails < 2,500/month (Free: 3,000)
- [ ] Vercel Bandwidth < 80 GB/month (Free: 100 GB)
- [ ] Vercel Build Minutes < 5,000/month (Free: 6,000)
