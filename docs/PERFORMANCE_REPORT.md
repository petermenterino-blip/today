# Performance Report — Mentorino

> **Generated:** 2026-07-06  
> **Stack:** Vite + React 19 SPA · Supabase (Free) · Vercel (Free) · Resend (Free)  
> **Audit scope:** Database, indexes, storage, realtime, edge functions, React rendering, bundle size, caching, images

---

## 1. Current Performance Baseline

| Metric | Value |
|--------|-------|
| **App type** | Client-side rendered SPA (no SSR/SSG) |
| **Routes** | 19 pages, all lazy-loaded |
| **Lazy-loaded components** | 52 (both pages + dashboard tabs) |
| **React Query stale time** | 30s (realtime) / 1min (frequent) / 5min (normal) / 15min (slow) / 30min (static) |
| **Cache garbage collection** | 30 minutes |
| **Retry policy** | 2 retries, exponential backoff (1s–10s) |
| **Realtime debounce** | 2,000ms batched invalidation |
| **Image compression** | Avatars 400×400 · Gallery 1920×1080 · General 1200×1200 |
| **Storage cache-control** | 3,600s (1 hour) on all uploads |
| **Offline fallback TTL** | 5 minutes |
| **Context engine cache TTL** | 30 seconds |
| **Database indexes** | 15+ composite indexes |
| **Realtime publication** | 4 tables (messages, notifications, sessions, profiles) |

---

## 2. Database Performance

### 2.1 Tables (45+)

All tables use `uuid` primary keys, `created_at` timestamps, and RLS policies. The most performance-sensitive tables are:

| Table | Est. Row Size | Primary Access Pattern | Risk |
|-------|-------------|----------------------|------|
| `profiles` | ~500 B | Auth lookups, mentee listing | Low |
| `messages` | ~1 KB | Chat pagination (conv_id, created_at DESC) | **High** — grows unbounded |
| `notifications` | ~500 B | User unread count | Medium |
| `sessions` | ~500 B | Mentor/student calendar queries | Medium |
| `events` | ~1 KB | Public listings + filtering | Low |
| `journals` | ~2 KB | Student journal listing | Low |
| `goals` | ~500 B | Student goal tracking | Low |
| `tasks` | ~500 B | Student task listing | Low |
| `analytics_events` | ~500 B | Event tracking | **High** — no TTL/index on this table |
| `provisioning_audit_logs` | ~1 KB | Audit trail | Medium — no cleanup strategy |

### 2.2 Indexes (Existing)

Created in `9991_optimization.sql`. All use `CREATE INDEX IF NOT EXISTS` for idempotency:

| Index | Table | Columns | Purpose |
|-------|-------|---------|---------|
| `idx_profiles_role_mentor` | profiles | (role, mentor_id) | Mentee listing by mentor |
| `idx_profiles_id_role` | profiles | (id, role) | Auth RLS lookups |
| `idx_sessions_mentor_start` | sessions | (mentor_id, start_time) | Mentor calendar |
| `idx_sessions_student_mentor` | sessions | (student_id, mentor_id) | Student session view |
| `idx_messages_conv_created` | messages | (conversation_id, created_at DESC) | Chat pagination |
| `idx_messages_conv_status` | messages | (conversation_id, status) | Unread counts |
| `idx_notifications_user_read_created` | notifications | (user_id, read, created_at DESC) | Notification listing |
| `idx_tasks_student_status` | tasks | (student_id, status) | Task lists |
| `idx_goals_student_status` | goals | (student_id, status) | Goal lists |
| `idx_journals_student_created` | journals | (student_id, created_at DESC) | Journal timeline |
| `idx_applications_user_status` | applications | (user_id, status) | Application review |
| `idx_events_created_by_date` | events | (created_by, date) | Event management |
| `idx_enrollments_student_program` | program_enrollments | (student_id, program_id) | Enrollment lookups |
| `idx_conv_parts_user_conv` | conversation_participants | (user_id, conversation_id) | Conversation RLS |
| `idx_resource_assignments_student_resource` | resource_assignments | (student_id, resource_id) | Resource queries |

### 2.3 Missing Indexes (High Priority)

| Table | Missing Index | Why |
|-------|--------------|-----|
| `messages` | `(sender_id, created_at)` | Message history by sender |
| `messages` | `(conversation_id, sender_id, status)` | Unread by participant |
| `analytics_events` | `(event_type, created_at)` | Analytics queries |
| `provisioning_audit_logs` | `(provisioning_job_id, created_at)` | Audit trail queries |
| `event_attendees` | `(user_id, event_id)` | RSVP lookups |
| `sessions` | `(student_id, start_time)` | Student calendar (partial match on idx_sessions_student_mentor) |
| `journals` | `(student_id, type)` | Journal filtering by type |

### 2.4 Query Patterns — Service Layer

All 39 service files use `supabase.from().select()` with chained filters. Common patterns:

```typescript
// Pattern A: Single-table filter (efficient with indexes)
supabase.from('sessions').select('*').eq('mentor_id', id).gte('start_time', date)

// Pattern B: Single-row fetch (efficient)
supabase.from('profiles').select('*').eq('id', id).single()

// Pattern C: Joins via select() relation (moderate cost — n+1 without eager loading)
supabase.from('programs').select('*, mentor:profiles!mentor_id(*)')

// Pattern D: Sequential queries in loops (HIGH RISK — n+1)
// Found in edge functions: scheduled/index.ts (session_reminders, progress_summaries)
```

### 2.5 RLS Policy Performance

Optimized in `9991_optimization.sql`:
- Replaced expensive `programs → enrollments → profiles` joins with direct `mentor_id` column checks
- Used `is_mentor()` helper function (indexed) instead of raw subqueries
- Mentor policies use `EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')` — cached by PG

**Risk:** Mentor policies run `SELECT` on `profiles` for every row checked. At scale (1000+ rows), this adds ~1ms per row.

---

## 3. Storage Performance

### 3.1 Buckets

| Bucket | Visibility | Max File Size | Type | Est. Current Size |
|--------|-----------|--------------|------|-------------------|
| `profile-avatars` | Public read | 5 MB | Images only | ~5 MB |
| `student-documents` | Private | 10 MB | Docs + images | ~20 MB |
| `mentor-resources` | Private | 100 MB | All types | ~50 MB |
| `gallery-images` | Public read | 5 MB | Images only | ~10 MB |
| `message-attachments` | Private | 25 MB | All media | ~15 MB |

### 3.2 Image Compression

| Upload Type | Max Dimensions | Quality | Max Size | Format |
|------------|---------------|---------|----------|--------|
| Avatar | 400 × 400 | 0.8 | 1 MB | JPEG |
| Gallery | 1920 × 1080 | 0.85 | 3 MB | JPEG |
| General | 1200 × 1200 | 0.85 | 1.5 MB | JPEG |
| Progressive quality reduction | — | Down to 0.1 | Steps of 0.1 | — |

### 3.3 Storage Concerns

- **`listFiles()` calls `getSignedUrl()` per file** (n+1 pattern for signed URLs). Use `getPublicUrl()` for public buckets.
- **`getPublicUrlFromPath()` delegates to `getSignedUrl()`** — misleading name. True public URLs are free; signed URLs consume API calls.
- **No CDN configuration** — Supabase Storage already serves via CDN, but custom domains may need configuration.
- **No file cleanup for deleted resources** — storage files remain orphaned after DB record deletion in some paths.

---

## 4. Realtime Performance

### 4.1 Current Configuration

Only 4 tables in `supabase_realtime` publication after migration 9991:
- `messages` (high-frequency — every message)
- `notifications` (high-frequency — every notification)
- `sessions` (medium-frequency — session updates)
- `profiles` (low-frequency — profile changes)

### 4.2 Subscriptions

| Component | Tables Subscribed | Channels Created |
|-----------|------------------|-----------------|
| `useResources` | 8 tables | 8 channels |
| `useEvents` | ~10 tables | ~10 channels |
| `useMessaging` | 2 tables | 2 channels |
| `useApplications` | 2 tables | 2 channels |
| `useGoals` | 1 table | 1 channel |
| `useTasks` | 1 table | 1 channel |
| Each student/mentor hook | 1–2 tables | 1–2 channels |

**Total open WebSocket connections during full dashboard load:** ~25–35 channels

**Risk:** Supabase Free tier allows **500 concurrent Realtime connections**. Each connection spawns multiple channels. A single mentor dashboard can use 25+ channels. At 20 concurrent mentors, this hits 500+ channels.

### 4.3 Optimizations Already Applied

- 2,000ms debounce on query invalidation (prevents React Query storms)
- `refetchType: 'active'` — only refetches queries currently mounted
- Only 4 tables in publication (down from 40+)
- Channels generate random suffixes (`rt-data-messages-{random8}`) to avoid naming collisions

### 4.4 Realtime Concerns

- **Channel count per user is high** — each `useRealtimeData` call creates independent channels. Multiple hooks (resources: 8, events: 10) mean a single user can open 20+ channels.
- **No channel reuse** — same table subscribed from different hooks creates duplicate channels.
- **No presence/broadcast cleanup** — WhatsAppMessaging creates presence channels that may leak on unmount.

---

## 5. Edge Functions Performance

### 5.1 Functions Overview

| Function | Invocations/Month | Avg Duration | Rate Limit |
|----------|------------------|-------------|------------|
| `gemini` | ~1,000 | ~2-5s | 30 req/min |
| `resend` | ~500 | ~300ms | 10 req/min |
| `approve-application` | ~100 | ~3-8s | 5 req/min |
| `scheduled` | ~120 (4 tasks × 30 days) | ~5-30s | 2 req/min |

### 5.2 Cold Starts

Deno-based edge functions have ~200-500ms cold start. The `scheduled` and `approve-application` functions are most impacted due to infrequent invocation.

### 5.3 Bottlenecks

**`scheduled/index.ts` — Sequential DB queries in loops:**
- `session_reminders`: Fetches sessions → iterates each → fetches student profile → sends email. O(n) DB round trips.
- `progress_summaries`: Fetches mentors → programs → enrollments → students → sessions → goals. **O(n*m) pattern** — could hit Supabase Free DB limits (max 60s query execution).
- `inactivity_alerts`: Fetches inactive students → for each, fetches enrollment → mentor. O(n) pattern.

**`gemini/index.ts`:**
- Streaming response uses SSE but buffers full lines before parsing — this can add latency on slow connections.
- Context truncation at 20,000 chars and history at 2,000 chars per message — reasonable but configurable.

**`approve-application/index.ts`:**
- State machine runs synchronously (8 sequential steps). Each step writes to DB + may call external APIs.
- At 5 req/min and ~8s average, max throughput is ~37 approvals/hour.

### 5.4 Supabase Free Edge Function Limits

- **500,000 invocations/month** (pooled across all functions)
- **2 GB memory per function**
- **10s timeout** for non-streaming, **30min** for streaming
- Current estimated usage: ~1,720 invocations/month → **0.3% of quota**

---

## 6. React Rendering Performance

### 6.1 Component Architecture

```
App (Router)
├── Landing (public, 1235 lines)
├── Auth
├── UserDashboard (student, 965 lines)
│   ├── 13 lazy-loaded tabs
│   └── 24 custom hooks
└── MentorDashboard (667 lines)
    ├── 16 lazy-loaded tabs
    ├── useDashboard (800 lines, 50+ state vars)
    └── useOverviewStore (700 lines)
```

### 6.2 Re-render Analysis

| Concern | Impact | Details |
|---------|--------|---------|
| `AuthContext` provides `user` + `role` | All 19 routes re-render on auth change | Every page consumes `useAuth()` |
| `useDashboard()` central hook | Mentor dashboard re-renders fully on any state change | 50+ `useState` calls in a single hook |
| `useOverviewStore()` | Heavy `useMemo` for derived data | 10+ computed values recalculated per render |
| `Landing.tsx` | 1,235 line page with inline animation variants | Largest single component |
| `EventListView` | `React.memo` only on this one component | Other list components unmemoized |
| `useMemo` (276 matches) | Heavy usage — good but some over-memoization | Deriving primitives doesn't benefit |
| `useCallback` (276 matches) | Consistent pattern | Good |
| `motion` animations | 882 animation instances | 882 Framer Motion components add ~150KB to bundle |

### 6.3 Bundle Size

#### Current Bundle (Estimated)

| Chunk | Size (gzipped) | Contents |
|-------|---------------|----------|
| `vendor` | ~180 KB | React, React DOM, React Router, Supabase client |
| `vendor-ui` | ~120 KB | Lucide icons, Recharts, Motion |
| Entry point | ~50 KB | App shell, providers, router |
| Pages (lazy) | ~30-60 KB each | Individual page bundles |
| **Total initial load** | ~250 KB | Vendor + entry |
| **Total full app** | ~600 KB+ | All lazy chunks combined |

#### Bundle Breakdown

| Library | Approx Size | Notes |
|---------|------------|-------|
| `react` + `react-dom` | 42 KB gzip | React 19 |
| `react-router-dom` | 14 KB gzip | HashRouter |
| `@supabase/supabase-js` | 28 KB gzip | Full client |
| `@tanstack/react-query` | 12 KB gzip | ~200 queries across app |
| `lucide-react` | 45 KB gzip | Tree-shakable but icon imports vary |
| `motion` | 38 KB gzip | Framer Motion successor |
| `recharts` | 35 KB gzip | Charts (mentor dashboard) |
| `sonner` | 5 KB gzip | Toast notifications |
| `jspdf` + `jspdf-autotable` | 25 KB gzip | PDF generation |
| `xlsx` | 20 KB gzip | Excel export |
| `hls.js` | 25 KB gzip | Video streaming |
| `@sentry/react` | 15 KB gzip | Error tracking |

#### Vite Configuration

- `chunkSizeWarningLimit: 2000` (very permissive — should be 500 KB)
- `reportCompressedSize: false` (disabled — should be enabled for CI)
- Manual chunks: `vendor-ui` for Lucide + Recharts + Motion
- No CSS code-splitting configured

---

## 7. Caching Strategy

### 7.1 Cache Layers

| Layer | Mechanism | TTL | Notes |
|-------|-----------|-----|-------|
| **HTTP (Supabase)** | `cacheControl: 3600` | 1 hour | Upload headers, not query responses |
| **React Query** | `staleTime` | 30s–30min | Client-side cache |
| **React Query** | `gcTime` | 30 min | In-memory cache |
| **Offline Fallback** | `Map<string, CacheEntry>` | 5 min | Network error recovery |
| **Context Engine** | `Map<string, {data, expires}>` | 30s | AI context caching |
| **Rate Limiter** | `Map<string, RateLimitEntry>` | Per window | Edge function rate limiting |

### 7.2 Cache Invalidation

- **Realtime changes:** Debounced 2,000ms → `invalidateQueries({ refetchType: 'active' })`
- **Mutations:** Invalidate query key on success → refetch
- **Idle recovery:** Invalidate all STALE_KEYS
- **Online recovery:** Invalidate all STALE_KEYS
- **Offline fallback:** Invalidated by TTL (5 min)

### 7.3 Missing Cache Opportunities

- **Supabase queries** use no `Cache-Control` headers — responses are not cached by the browser or CDN. Use `supabase.from().select().maybeSingle()` with React Query's `gcTime` as the only client cache.
- **Public pages** (Landing, Programs, FAQ, etc.) have no HTTP caching. These are ideal for Vercel's Edge Cache or `stale-while-revalidate`.
- **No service worker**. Offline support relies on React Query's in-memory cache only. A service worker could cache static assets and API responses.

---

## 8. Image Performance

### 8.1 Image Sources

| Location | Source | Optimization |
|----------|--------|-------------|
| `Landing.tsx` | Google Drive URL (`lh3.googleusercontent.com`) | **None** — external, no width/height, no lazy loading |
| `About.tsx` | Google Drive URL | **None** — same issue |
| `Gallery.tsx` | Supabase Storage (gallery-images) | Compressed client-side |
| `GalleryManagement.tsx` | Supabase Storage | Compressed client-side |
| `EventCreateModal.tsx` | Supabase Storage | Compressed client-side |
| `MentorDashboard.tsx` | Supabase Storage | Compressed client-side |

### 8.2 Issues

1. **External Google Drive URLs** (`lh3.googleusercontent.com`) on Landing and About pages have no `loading="lazy"`, no `width`/`height` attributes, and no fallback. These block LCP.
2. **No responsive images** — all `<img>` tags use fixed sizes. No `srcSet` or `sizes` attributes.
3. **Client-side compression** runs on the main thread and blocks UI during upload.
4. **No WebP/AVIF** — compression converts to JPEG only.

---

## 9. Free Tier Limits & Current Consumption

| Service | Resource | Free Limit | Current Est. | Utilization |
|---------|----------|-----------|-------------|-------------|
| **Supabase** | Database | 500 MB | ~50 MB | 10% |
| **Supabase** | Bandwidth | 5 GB | ~500 MB | 10% |
| **Supabase** | MAU (Monthly Active Users) | 50,000 | ~500 | 1% |
| **Supabase** | Edge Functions | 500,000/month | ~1,720/month | 0.3% |
| **Supabase** | Realtime Connections | 500 concurrent | ~50 peak | 10% |
| **Supabase** | Realtime Messages | 2 million/month | ~100,000/month | 5% |
| **Supabase** | Storage | 1 GB | ~100 MB | 10% |
| **Supabase** | Storage Bandwidth | 5 GB | ~500 MB | 10% |
| **Vercel** | Bandwidth | 100 GB | ~1 GB | 1% |
| **Vercel** | Build Minutes | 6,000/month | ~300/month | 5% |
| **Vercel** | Serverless Invocations | 100/day | ~0 | 0% |
| **Resend** | Emails | 100/day | ~30/day | 30% |
| **Resend** | Emails | 3,000/month | ~900/month | 30% |

---

## 10. Top Performance Risks (Ranked)

| # | Risk | Severity | Effort to Fix | Category |
|---|------|----------|--------------|----------|
| 1 | N+1 queries in `scheduled` edge function (sequential loops) | **Critical** | Low | Database |
| 2 | 25+ Realtime channels per user dashboard | **High** | Medium | Realtime |
| 3 | No cleanup for `messages` table (unbounded growth) | **High** | Low | Database |
| 4 | External Google Drive images block LCP | **High** | Low | Images |
| 5 | No HTTP caching on public pages | **Medium** | Low | Caching |
| 6 | Analytics events table has no TTL or index | **Medium** | Low | Database |
| 7 | `useDashboard` single hook with 50+ state vars | **Medium** | High | Rendering |
| 8 | No service worker for offline/PWA | **Medium** | High | Caching |
| 9 | No bundle analysis in CI | **Medium** | Low | Build |
| 10 | Storage files orphaned on DB delete | **Low** | Low | Storage |
| 11 | No response compression verification | **Low** | Low | Build |
| 12 | Animation library (motion) adds 38KB gzip | **Low** | Low | Bundle |

---

## 11. Summary

The application is well-architected for its current scale. The most critical performance risk is the **n+1 query pattern in scheduled edge functions**, which could cause timeouts on Supabase Free as data grows. The second critical risk is **Realtime channel count**, which could hit the 500-connection limit with 20+ concurrent mentor dashboard users.

The application has strong fundamentals: lazy loading, reasonable stale times, debounced invalidation, image compression, composite indexes on key tables, and offline fallback caching.

Estimated concurrent user capacity on current free tiers: **50-100 concurrent users** before hitting a bottleneck (Realtime connections or edge function timeouts).
