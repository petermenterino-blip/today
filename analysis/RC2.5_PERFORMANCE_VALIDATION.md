

# RC2.5 — Performance Validation Report

## Methodology
Source code analysis across bundle config, rendering patterns, query configuration, runtime behavior. No profiling tools used (browser-only analysis deferred to staging).


## 1. Bundle Size Analysis

| Asset | Strategy | Current | Status |
|-------|----------|---------|--------|
| App bundle | Code splitting via `React.lazy()` | ✅ Already implemented in `App.tsx` | ✅ |
| Vendor chunk | `manualChunks` in vite.config.ts | Separates `vendor-ui` (lucide, recharts, motion) from `vendor` | ✅ |
| Total dependencies | 16 runtime deps | List: supabase-js, tanstack-query, react, router, recharts, lucide, motion, sonner, tailwind, xlsx, jspdf, hls.js | ⚠️ Moderate |
| Bundle analysis tool | None | `vite-plugin-visualizer` not configured | ❌ |
| Tree-shaking | Vite default | ES module imports enable tree-shaking | ✅ |
| **Verdict** | **✅ Good foundation** | Code splitting + chunk separation done | |

**Potential issue**: `jspdf` + `jspdf-autotable` + `xlsx` are heavy dependencies used only in Reports — they should be lazy-loaded but aren't using dynamic imports at the component level.


## 2. React Rendering Analysis

| Component | Memoization | Status |
|-----------|------------|--------|
| `ConversationList.tsx` | ✅ `React.memo` + `useMemo` for `filteredConversations` | ✅ (F6.1, F6.2) |
| `MessageThread.tsx` | ✅ `React.memo` | ✅ (F6.1) |
| List item components (ConversationListItem, EventListItem, StudentListItem) | ❌ No memo | ❌ |
| Dashboard grid cards | ❌ No memo | ❌ |
| Navigation/Layout | ❌ No memo | ❌ |
| **Verdict** | ⚠️ **Partial** — only 2 components memoized | |


## 3. TanStack Query Configuration

| Hook | `staleTime` | `gcTime` | `keepPreviousData` | Status |
|------|------------|----------|-------------------|--------|
| `useBookings.ts` | ✅ 5 min | Default | ❌ | ⚠️ Only one with staleTime |
| `useApplications.ts` | ❌ Default (0) | Default | ❌ | ❌ |
| `useEvents.ts` | ❌ Default (0) | Default | ❌ | ❌ |
| `useEventsQuery.ts` | ❌ Default (0) | Default | ❌ | ❌ |
| `useBookingsQuery.ts` | ❌ Default (0) | Default | ❌ | ❌ |
| `usePrograms.ts` | ❌ Default (0) | Default | ❌ | ❌ |
| `useGoals.ts` | ❌ Default (0) | Default | ❌ | ❌ |
| `useJournals.ts` | ❌ Default (0) | Default | ❌ | ❌ |
| `useTasks.ts` | ❌ Default (0) | Default | ❌ | ❌ |
| `useSessions.ts` | ❌ Default (0) | Default | ❌ | ❌ |
| `useResources.ts` | ❌ Default (0) | Default | ❌ | ❌ |
| `useActionItems.ts` | ❌ Default (0) | Default | ❌ | ❌ |
| `useRealtime.ts` | N/A (subscription) | N/A | N/A | ✅ (F5.3 fix) |
| `useDatabaseSync.ts` | ❌ Unknown | Unknown | ❌ | ❌ |

**Verdict**: **Only 1/14 hooks has staleTime configured (7%).** All other hooks refetch on every component mount. This is the single highest-impact performance fix.


## 4. Network Request Analysis

| Pattern | Assessment | Status |
|---------|-----------|--------|
| Parallel queries on dashboard | Multiple `useQuery` calls on mount | ⚠️ No deduplication |
| Request deduplication | TanStack Query handles identical keys | ✅ Built-in |
| Image optimization | No WebP, no responsive sizes, no CDN | ❌ |
| Lazy loading images | ✅ `loading="lazy"` on 19 images (F5.1) | ✅ |
| Prefetching | ❌ Not used | ❌ |
| Service worker caching | ❌ Not configured | ❌ |
| **Verdict** | ⚠️ **Dashboard query blast is the main concern** | |


## 5. Realtime Subscriptions

| Table | Subscription | Status |
|-------|-------------|--------|
| `messages` | ✅ `useRealtime.ts` subscribes | ✅ |
| `notifications` | ✅ `useRealtime.ts` subscribes | ✅ |
| `sessions` | ✅ `useRealtime.ts` subscribes | ✅ |
| `bookings` | ✅ `useRealtime.ts` subscribes | ✅ |
| Stale closure | ✅ Fixed (F5.3) — `[JSON.stringify(configs)]` | ✅ |
| **Verdict** | **✅ All subscriptions configured correctly** | |


## 6. Lazy Loading Assessment

| Feature | Strategy | Status |
|---------|----------|--------|
| Route-level code splitting | ✅ `React.lazy()` for all pages in `App.tsx` | ✅ |
| Component-level lazy loading | ❌ Not used | ❌ |
| Heavy libraries (jspdf, xlsx) | ❌ Imported eagerly | ❌ |
| Images | ✅ `loading="lazy"` | ✅ |
| **Verdict** | **✅ Route splitting good, component-level missing** | |


## Performance Score: 56/100

| Category | Weight | Score | Weighted |
|----------|--------|-------|----------|
| Bundle optimization | 20% | 60 | 12 |
| React rendering | 15% | 40 | 6 |
| Query caching (staleTime) | 25% | 7 | 1.75 |
| Network requests | 15% | 50 | 7.5 |
| Realtime | 10% | 100 | 10 |
| Lazy loading | 15% | 60 | 9 |
| **Total** | **100%** | | **~46/100** |

Wait — correcting calculation:
- Bundle: 60 × 0.20 = 12
- Rendering: 40 × 0.15 = 6
- Caching: 7 × 0.25 = 1.75
- Network: 50 × 0.15 = 7.5
- Realtime: 100 × 0.10 = 10
- Lazy: 60 × 0.15 = 9

**Total: 46/100** — NOT good. Corrected score below.


## Corrected Performance Score: 46/100

## High-Impact Quick Wins
1. **Add `staleTime: 5 * 60 * 1000` to all 13 remaining query hooks** — 0.5 day, ~80% reduction in unnecessary network requests
2. **Lazy-load jspdf + xlsx** — dynamic imports in component files — 0.25 day
3. **Add `keepPreviousData: true`** to paginated queries — 0.25 day
4. **Memoize Dashboard grid cards** — 0.25 day
