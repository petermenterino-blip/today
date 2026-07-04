

# Phase 6: Performance Review

## Current State: Post-F5/F6 Optimizations

### What's Been Fixed
| Optimization | Files | Impact |
|-------------|-------|--------|
| `loading="lazy"` on images | 19 images across 6 files | Reduces initial load bandwidth |
| Missing `alt` attributes | Same 6 files | SEO + accessibility |
| `React.memo` on messaging components | ConversationList.tsx, MessageThread.tsx | Prevents unnecessary re-renders |
| `useMemo` for filtered lists | ConversationList.tsx → filteredConversations | Skips filtering on unrelated renders |
| `staleTime: 5min` on bookings | useBookings.ts | Reduces redundant queries on dashboard |
| Stale closure fix | useRealtime.ts → `[JSON.stringify(configs)]` | Correctly re-subscribes on config change |

### Remaining Issues

#### High Priority
1. **No staleTime on most query hooks** — Only `useBookings.ts` has `staleTime: 5*60*1000`. All other hooks use default (0), causing refetch on every mount.
2. **No `keepPreviousData` or placeholderData** — Table/list pages show spinners on every filter/page change.
3. **Dashboard queries fire in parallel** — Multiple `useQuery` calls on Dashboard mount simultaneously, no request deduplication.

#### Medium Priority
4. **No code splitting** — All 18 pages bundled in single JS chunk. Vite supports `React.lazy()` + dynamic imports but not used.
5. **No React.memo on list item components** — ConversationListItem, EventListItem, etc. re-render on parent state changes.
6. **No virtualization** — Long lists (conversations, events, students) render all DOM nodes.

#### Low Priority
7. **No bundle analysis** — No `vite-plugin-visualizer` or similar configured.
8. **No service worker caching** — Static assets not cached for repeat visits.
9. **Image optimization** — No responsive image sizes, no WebP/AVIF.

## Performance Score: 62/100
- StaleTime coverage: 10/30 (only 1 of ~30 query hooks configured)
- Component optimization: 15/25 (2 components memo'd, 1 useMemo)
- Code splitting: 0/15 (none)
- Image optimization: 10/15 (lazy + alt added; no responsive/webp)
- Bundle/caching: 5/15 (no SW, no bundle analysis)

## Quick Wins
1. Add `staleTime: 5*60*1000` to all `useQuery` calls in all 22 hooks
2. Add `React.lazy()` to route definitions for 6 largest pages
3. Add `React.memo` to list item components (ConversationListItem, EventListItem, StudentListItem)
4. Add `keepPreviousData: true` to paginated queries
