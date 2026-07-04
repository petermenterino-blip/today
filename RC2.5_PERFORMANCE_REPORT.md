

# Performance Report — Mentorino RC2.5

## 1. Bundle Size

| Chunk | Size (KB) | Content |
|-------|-----------|---------|
| `vendor-zmQ30CgS.js` | 1,715.6 | React, Supabase, TanStack Query, react-router-dom |
| `vendor-ui--8h1D00m.js` | 409.1 | lucide-react, recharts, motion |
| `MentorDashboard-B1EiXSOs.js` | 276.3 | Mentor dashboard |
| `UserDashboard-DVXi07Ge.js` | 89.8 | Student dashboard |
| `WhatsAppMessaging-CGHg0HFo.js` | 61.7 | Messaging |
| `index-DFs94-ue.js` | 51.0 | Entry chunk (App + Layout + shared) |
| `Landing-DdomXSvz.js` | 42.7 | Landing page |
| **Total JS** | **~2.6 MB** | Before compression |

**Estimated gzip**: ~600-800 KB total (vendor ~300 KB gzipped).

## 2. Lazy Loading

| Area | Status |
|------|--------|
| Route-level lazy loading | ✅ All 16 routes use `React.lazy()` |
| Eagerly loaded | `AuthProvider`, `Layout`, `ProtectedRoute`, `ScrollToTop`, `Toaster`, `Router` (~51 KB) |
| Component-level code splitting | ❌ Not used — all lazy loading is route-level only |

## 3. Rendering Performance

| Metric | Status |
|--------|--------|
| `React.memo` usage | ❌ **Zero components** use `React.memo` |
| `useMemo` usage | ⚠️ Only 2 instances in `MentorScheduler.tsx` |
| `useCallback` usage | ⚠️ 5 instances across 3 files |
| Unnecessary re-renders | 🔴 **High** — no memo means entire component tree re-renders on parent change |

**Key hotspots:**
- `ConversationList.tsx` — `filteredConversations` computed on every render without `useMemo`
- `UserDashboard.tsx` — `.filter()` and `.sort()` on `taskActivities`, `sessions` in render body
- `Landing.tsx` — `toggleFaq`, `handleContactChange` recreated on every render

## 4. Query Duplication

### Dashboard On Load — Student (8+ queries)
1. `useApplications` → `applications` table
2. `useBookings` → `bookings` table
3. `useEvents` → `events` table
4. `useTasks` → `tasks` table
5. `useSessions` → `sessions` table
6. `useResources` → `resources` table
7. `programService.fetchAll()` → `programs` table (duplicate of `usePrograms`)
8. `studentService.getAll()` → `profiles` table

### Dashboard On Load — Mentor (12+ queries)
Same 8 as student + `useGoals` + `useJournals` + `customFormService.getAllSubmissions` + `messageService.getConversations` + `tagService.getAll` + `studentService.getAll`

### Duplicate Hooks
- `useBookings.ts` + `useBookingsQuery.ts` — same purpose, different files
- `useEvents.ts` + `useEventsQuery.ts` — same purpose, different files
- `useTasks.ts` + `useActionItems.ts` — partially overlapping

## 5. Image Optimization

| Metric | Status |
|--------|--------|
| Total `<img>` tags | 19 |
| `loading="lazy"` used | 1 / 19 (5%) ❌ |
| Missing `alt` attributes | 5 / 19 ❌ |
| Responsive images (`srcSet`) | 0 / 19 ❌ |
| Modern formats (WebP/AVIF) | 0 / 19 — all Unsplash hotlinks ❌ |

## 6. Realtime Subscriptions

| Issue | Detail |
|-------|--------|
| Stale closure | Empty dependency array `[]` in `useRealtime` — subscriptions never refresh when configs change |
| Redundant re-fetch | `loadData()` called on every INSERT event, negating realtime benefit |
| Channel name collision | `${table}-changes` naming could conflict with multiple instances |
| Cleanup | ✅ Properly removes channels on unmount |
| Reconnection | ⚠️ Relies on Supabase default, no error handling |

## 7. Specific Recommendations

### P0 — Must Fix
1. **Add `React.memo`** to list/grid components: `ConversationList`, `MessageThread`, `ComposeBar`, overview tab components in MentorDashboard
2. **Add `useMemo`** for derived data: `filteredConversations`, sorted sessions, filtered tasks
3. **Consolidate duplicate query hooks**: Merge `useBookings`/`useBookingsQuery`, `useEvents`/`useEventsQuery`

### P1 — Should Fix
4. Add `loading="lazy"` to all 18 `<img>` tags missing it
5. Add `alt` attributes to the 5 images missing them
6. Fix `useRealtime` stale closure (use refs for configs)
7. Reduce parallel dashboard queries: batch or use Supabase joins

### P2 — Optimize
8. Extract dashboard sections into sub-components for better code-splitting
9. Tree-shake unused `lucide-react` icons (import by name, not default)
10. Reduce `chunkSizeWarningLimit` from 2000 KB to 500 KB to surface issues

## Performance Verdict

| Area | Score | Notes |
|------|-------|-------|
| Bundle size | 🟡 2.6 MB raw, ~800 KB gzipped — large but acceptable for initial load |
| Lazy loading | ✅ Excellent — all routes lazy-loaded |
| Rendering | 🔴 No memoization — unnecessary re-renders on every dashboard interaction |
| Query efficiency | 🟡 8-12 parallel queries on dashboard — excessive, needs consolidation |
| Images | 🔴 Only 1/19 images use lazy loading |
| Realtime | 🟡 Functional but has stale closure and redundant re-fetch |
| **Overall** | **NOT READY** for production performance — needs memoization and image optimization |
