# Optimization Guide — Mentorino

> **Goal:** Maximize Free Tier headroom.  
> **Principle:** Only safe, verifiable optimizations. No business logic changes.  
> **Priority order:** Critical → High → Medium → Low.

---

## Critical Optimizations (Do First)

### 1. Fix N+1 Queries in Scheduled Edge Function

**File:** `supabase/functions/scheduled/index.ts`

**Problem:** Three tasks iterate over results and query the database per row:

```
session_reminders:  QUERY sessions → for each: QUERY profile (n+1)
progress_summaries: QUERY mentors → for each: QUERY programs → enrollments → students → for each: sessions + goals (n×m)
inactivity_alerts:  QUERY students → for each: QUERY enrollment → mentor profile (n+1)
```

**Fix:** Use batched queries with `IN` clauses:

```typescript
// BEFORE (n+1):
for (const session of sessions) {
  const { data: student } = await supabase
    .from('profiles').select('email, name')
    .eq('id', session.student_id).single()
}

// AFTER (batch):
const studentIds = sessions.map(s => s.student_id)
const { data: students } = await supabase
  .from('profiles').select('id, email, name')
  .in('id', studentIds)

const studentMap = new Map(students?.map(s => [s.id, s]) ?? [])
for (const session of sessions) {
  const student = studentMap.get(session.student_id)
}
```

**Impact:** Reduces DB round trips from O(n) to O(1) per task. Prevents 60s timeout on Supabase Free.

**Verification:** Run `supabase functions serve scheduled` locally and test with 100+ mock records.

---

### 2. Add Table Cleanup for Messages

**Problem:** `messages` table grows unbounded. No archival or deletion strategy.

**Fix:** Add a migration to enable TTL cleanup:

```sql
-- Add a migration for message cleanup
-- Soft-delete messages older than 90 days
create or replace function cleanup_old_messages()
returns void
language plpgsql
security definer
as $$
begin
  update public.messages
  set deleted_at = now()
  where created_at < now() - interval '90 days'
    and deleted_at is null;
end;
$$;
```

Then invoke from the existing `cleanup` task in `scheduled/index.ts`:

```typescript
case 'cleanup': {
  // Existing cleanup...
  
  // Add message cleanup
  await supabase.rpc('cleanup_old_messages')
  
  break
}
```

**Impact:** Bounds the messages table at ~90 days of data. On Supabase Free (500 MB), 90 days of messages at 1 KB each × 1,000 messages/day = 90 MB steady state instead of unbounded growth.

---

## High Optimizations

### 3. Reduce Realtime Channel Count

**Problem:** Each `useRealtimeData` call creates independent channels. A mentor dashboard subscribes to 25+ channels, consuming 5% of the 500-channel free tier limit per user.

**Fix:** Consolidate channels in `realtimeManager.ts`:

```typescript
// BEFORE: One channel per table per hook
const channel = supabase.channel(`rt-data-${table}-${random}`)
channel.on('postgres_changes', { event: '*', schema: 'public', table }, callback)

// AFTER: One channel per hook, filter by schema
const channel = supabase.channel(`rt-hook-${random}`)
for (const { table, queryKey, filter } of configs) {
  channel.on('postgres_changes', { event: '*', schema: 'public', table, filter: filterStr }, callback)
}
```

**File:** `src/lib/realtimeManager.ts`, lines 64-94.

**Impact:** Reduces channels from 25 per user to 1-2 per user. Increases free tier capacity from 20 concurrent users to 250+.

**Verification:** Open DevTools > Network > WS tab. Count channels before and after.

---

### 4. Add Lazy Loading to External Images

**File:** `src/pages/Landing.tsx` (lines ~66, ~441), `src/pages/About.tsx` (line ~9, ~97)

**Problem:** Google Drive images (`lh3.googleusercontent.com`) lack `loading="lazy"`, blocking LCP.

**Fix:**

```tsx
{/* BEFORE */}
<img src={mentorImageUrl} className="..." />

{/* AFTER */}
<img src={mentorImageUrl} className="..." loading="lazy" decoding="async" />
```

Also add explicit `width` and `height` to prevent layout shift:

```tsx
<img 
  src={mentorImageUrl} 
  loading="lazy" 
  decoding="async" 
  width={800} 
  height={600}
  alt="Mentor"
  style={{ aspectRatio: '800/600' }}
/>
```

**Impact:** Improves LCP by 200-500ms. Reduces initial page weight.

---

### 5. Add HTTP Caching Headers for Public Pages

**Problem:** SPA serves all assets uncached. Public pages (Landing, About, Programs, FAQ, Gallery, etc.) could benefit from CDN caching.

**Fix in `vite.config.ts`:** Use a caching middleware (Vercel `vercel.json` or CDN):

```json
// vercel.json
{
  "headers": [
    {
      "source": "/assets/(.*)",
      "headers": [
        { "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }
      ]
    }
  ]
}
```

**Impact:** Reduces Vercel bandwidth by 60-80% for repeat visitors. Static assets (JS/CSS bundles, images) serve from CDN cache.

---

### 6. Add TTL Index for Analytics Events

**File:** Varies (likely `src/services/` or migration)

**Problem:** `analytics_events` table has no index on `(event_type, created_at)` and no cleanup strategy.

**Fix:** Add migration:

```sql
create index if not exists idx_analytics_events_type_created
  on public.analytics_events(event_type, created_at);

-- Auto-cleanup events older than 90 days
create or replace function cleanup_analytics_events()
returns void
language plpgsql
security definer
as $$
begin
  delete from public.analytics_events
  where created_at < now() - interval '90 days';
end;
$$;
```

Add to `cleanup` task in scheduled edge function.

---

## Medium Optimizations

### 7. Enable Bundle Analysis in CI

**File:** `.github/workflows/ci.yml`

**Problem:** `reportCompressedSize: false` is set in vite.config.ts and there's no bundle size monitoring.

**Fix:**

```typescript
// vite.config.ts
build: {
  reportCompressedSize: true,  // Enable
  chunkSizeWarningLimit: 500,  // Reduce from 2000 KB
}
```

Add a bundle analysis step to CI:

```yaml
# .github/workflows/ci.yml
- name: Analyze Bundle
  run: npx vite-bundle-analyzer
```

**Impact:** Prevents accidental bundle bloat. Catches large dependencies before deployment.

---

### 8. Fix `getPublicUrlFromPath` Misuse

**File:** `src/services/storageService.ts` (line 29-31)

**Problem:** `getPublicUrlFromPath()` calls `getSignedUrl()` instead of `getPublicUrl()`. Public buckets (profile-avatars, gallery-images) don't need signed URLs, which consume API quota.

**Fix:**

```typescript
async getPublicUrlFromPath(bucket: BucketName, path: string): Promise<string> {
  const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(path)
  return publicUrl
}
```

**Impact:** Reduces Supabase Storage API calls for public assets. Signed URL generation counts against rate limits.

---

### 9. Optimize `listFiles()` — Remove N+1 Signed URLs

**File:** `src/services/storageService.ts` (lines 77-85)

**Problem:** `listFiles()` calls `getSignedUrl()` per file in a loop.

**Fix:** For public buckets, use `getPublicUrl()` directly:

```typescript
async listFiles(bucket: BucketName, userId: string): Promise<{ name: string; url: string }[]> {
  const { data, error } = await supabase.storage.from(bucket).list(userId)
  if (error) throw error
  const files = data || []
  return files.map(f => ({
    name: f.name,
    url: supabase.storage.from(bucket).getPublicUrl(`${userId}/${f.name}`).data.publicUrl,
  }))
}
```

For private buckets, batch signed URLs using the REST API instead of per-file calls.

---

### 10. Add Missing Indexes

**File:** Create new migration `9994_performance_indexes.sql`

```sql
-- Messages: sender history lookups
create index if not exists idx_messages_sender_created
  on public.messages(sender_id, created_at desc);

-- Messages: unread counts per conversation participant
create index if not exists idx_messages_conv_sender_status
  on public.messages(conversation_id, sender_id, status);

-- Sessions: student calendar queries
create index if not exists idx_sessions_student_start
  on public.sessions(student_id, start_time);

-- Event attendees: RSVP lookups
create index if not exists idx_event_attendees_user_event
  on public.event_attendees(user_id, event_id);

-- Journals: filter by type
create index if not exists idx_journals_student_type_created
  on public.journals(student_id, type, created_at desc);

-- Provisioning audit: job history
create index if not exists idx_provisioning_audit_job_created
  on public.provisioning_audit_logs(provisioning_job_id, created_at desc);
```

---

## Low Optimizations

### 11. Reduce `useDashboard()` Hook Scope

**File:** `src/features/mentor/hooks/useDashboard.tsx` (~800 lines, 50+ state variables)

**Problem:** One monolithic hook manages all mentor dashboard state. Any state change triggers full re-render of all tabs.

**Fix:** Split into smaller hooks by concern:

```typescript
// Instead of one useDashboard() returned from a single hook:
// useDashboard()          → Tab state, routing (10 vars)
// useSessionBooking()    → Session scheduling (8 vars)
// useCalendarState()     → Calendar (5 vars)
// useCustomFormsState()   → Forms (5 vars)
```

**Impact:** Reduces unnecessary re-renders. Improves perceived performance on tab switches. Each tab only re-renders when its own data changes.

---

### 12. Add Bundle Splitting for Heavy Libraries

**File:** `vite.config.ts`

**Problem:** `jspdf` + `xlsx` + `hls.js` are loaded in the initial vendor chunk but are only used on specific pages.

**Fix:** Split heavy libraries further:

```typescript
manualChunks(id) {
  if (id.includes('node_modules')) {
    if (id.includes('lucide-react')) return 'vendor-icons'
    if (id.includes('recharts')) return 'vendor-charts'
    if (id.includes('motion')) return 'vendor-animation'
    if (id.includes('jspdf') || id.includes('xlsx')) return 'vendor-office'
    if (id.includes('hls.js')) return 'vendor-video'
    return 'vendor-core'
  }
}
```

---

### 13. Memoize `EventListView`

**File:** `src/features/events/EventListView.tsx`

Only `EventListView` uses `React.memo`. Other list components should also memoize to prevent re-renders when filters change:

```tsx
export const MenteesTab = React.memo(MenteesTabUnmemoized)
export const VisitorBookingsTab = React.memo(VisitorBookingsTabUnmemoized)
export const ResourceList = React.memo(ResourceListUnmemoized)
```

---

### 14. Mark `useResources` Realtime as Optional

**Problem:** `useResources` subscribes to 8 realtime tables. Resources change infrequently but consume 8 channels.

**Fix:** Make realtime optional and only subscribe when the resources tab is active:

```typescript
export const useResources = (enableRealtime = true) => {
  useRealtimeData(enableRealtime ? [
    { table: 'resources', queryKey: [QK.resources] },
    // ... 8 tables
  ] : [])
}
```

---

## Quick Wins (5-Minute Fixes)

| # | Fix | File | Change |
|---|-----|------|--------|
| 15 | Add `loading="lazy"` to all `<img>` tags | Multiple | `loading="lazy" decoding="async"` |
| 16 | Enable `reportCompressedSize` | `vite.config.ts` | `reportCompressedSize: true` |
| 17 | Reduce `chunkSizeWarningLimit` | `vite.config.ts` | `chunkSizeWarningLimit: 500` |
| 18 | Add explicit dimensions to images | `Landing.tsx`, `About.tsx` | `width={800} height={600}` |
| 19 | Fix `getPublicUrlFromPath` to use public URLs | `storageService.ts` | `getPublicUrl()` |
| 20 | Add message cleanup to scheduled task | `scheduled/index.ts` | `supabase.rpc('cleanup_old_messages')` |

---

## Verification Steps

After each optimization, verify:

1. **Build:** `npm run build` succeeds with no errors
2. **Typecheck:** `npx tsc --noEmit` passes
3. **Tests:** `npm test` passes
4. **Bundle size:** Check `dist/` output for reduced sizes
5. **Realtime:** Count WS channels in DevTools before/after
6. **DB queries:** Check Supabase logs for query duration reductions
7. **LCP:** Run Lighthouse before/after on Landing page

## Monitoring Recommendations

1. **Add `vite-plugin-bundle-analyzer`** to dev dependencies for bundle visualization
2. **Monitor Supabase query stats** in Supabase Dashboard > Database > Query Performance
3. **Set up Vercel Analytics** for real user monitoring (RUM)
4. **Check Supabase Storage** monthly for orphaned files
5. **Watch Resend dashboard** for email quota warnings
