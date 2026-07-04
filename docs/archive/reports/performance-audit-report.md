

# Performance Audit Report — Mentorino


## 1. Bundle Analysis

### Build Output

| Asset | Size | Notes |
|-------|------|-------|
| `vendor` (node_modules) | ~250 KB gzip | All vendor code |
| `vendor-ui` (lucide, recharts, motion) | ~80 KB gzip | UI-specific libraries |
| Application code | ~200 KB gzip | Routes, components, services |
| CSS | ~30 KB gzip | Tailwind-generated |

**Total:** ~560 KB gzip initial load

### Code Splitting

| Splitting Strategy | Status | Notes |
|--------------------|--------|-------|
| Route-level (React.lazy) | COMPLETE | 20+ pages lazy-loaded via `React.lazy` + `Suspense` |
| Vendor chunks (manualChunks) | COMPLETE | `vendor` and `vendor-ui` separated |
| Component-level | NONE | No dynamic imports for heavy components |


## 2. Large Components

| Component | Lines | Issues |
|-----------|-------|--------|
| `src/pages/Landing.tsx` | 1,074 | Single massive file; could be split into sections |
| `src/features/student/UserDashboard.tsx` | 855 | God component; sub-routes render inline + conditional |
| `src/features/mentor/MentorDashboard.tsx` | 503 | Orchestrates all tabs; receives 29+ props |
| `src/features/mentor/hooks/useDashboard.ts` | ~600 | God hook; manages all mentor state |
| `src/features/messaging/WhatsAppMessaging.tsx` | ~500 | Tightly coupled messaging hub |
| `src/components/shared/Layout.tsx` | 344 | Sidebar + header + mobile drawer |
| `src/pages/Gallery.tsx` | 606 | localStorage-based, data URL handling |


## 3. Re-render Analysis

| Issue | Severity | Evidence |
|-------|----------|----------|
| `UserDashboard.tsx` filters arrays in render body | MEDIUM | `assignedApps` filter at line ~500 re-runs every render, not memoized |
| `MentorDashboard.tsx` passes new objects on every render | MEDIUM | Inline object/array literals in JSX create new references each render |
| `WhatsAppMessaging.tsx` 2-second polling | HIGH | Polling every 2s re-fetches ALL conversations and messages, triggering full re-renders |
| No `React.memo` on heavy components | LOW | Components re-render when parent re-renders |
| No `useMemo` on derived data in dashboards | LOW | Array.filter/.map results recomputed every render |


## 4. Data Fetching

| Query Pattern | Status | Notes |
|---------------|--------|-------|
| TanStack Query | USED | `staleTime: 60s`, `retry: 1` — good defaults |
| Query deduplication | PRESENT | TanStack Query handles this |
| Parallel queries | PRESENT | Multiple `useSessions`, `useGoals`, etc. fire in parallel |
| Waterfall queries | DETECTED | Some components fetch sequentially (e.g., user → profile → sessions) |
| Polling (messaging) | INEFFICIENT | 2-second interval re-fetches everything |


## 5. Memoization

| Technique | Usage | Notes |
|-----------|-------|-------|
| `React.memo` | NONE | No components wrapped with `React.memo` |
| `useMemo` | MINIMAL | Used in a few hooks but not consistently |
| `useCallback` | MINIMAL | Used in event handlers in some hooks |
| `useRef` | PRESENT | Used for scroll management, previous value tracking |


## 6. Expensive Operations

| Operation | Location | Impact |
|-----------|----------|--------|
| localStorage seed check on every load | `main.tsx:9` | `seedDatabase()` runs synchronously and clears/re-writes localStorage on version mismatch; could block initial render |
| Gallery data URLs in localStorage | `Gallery.tsx` | Base64-encoded images stored in localStorage can exceed 5MB quota |
| PDF generation (jsPDF) | `useAIAssistant.ts` | Synchronous PDF generation could block UI thread |
| Excel generation (xlsx) | `AdminRevenue.tsx` | Synchronous file generation |


## 7. Recommendations (Measurable Impact Only)

| Priority | Issue | Expected Impact |
|----------|-------|-----------------|
| HIGH | Replace messaging polling with Supabase Realtime subscription | Eliminates 2s network requests when idle |
| HIGH | Seed data optimization — skip if Supabase mode is active | Prevents unnecessary localStorage operations |
| MEDIUM | Add `useMemo` to derived data in dashboards | Reduces re-render work on data change |
| MEDIUM | `React.memo` on MessageThread and ConversationList | Reduces re-renders on conversation switch |
| LOW | Code-split Gallery.tsx heavy sections | Shaves ~50KB from initial bundle |


## Performance Readiness: NEEDS WORK

The app is functional but has measurable inefficiencies:
- Messaging polling is the top performance concern (continuous network requests)
- Large god components cause unnecessary re-render chains
- No memoization strategy in place
