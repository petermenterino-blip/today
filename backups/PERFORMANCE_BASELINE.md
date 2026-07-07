# Performance Baseline

## Frontend Build

| Metric | Value |
|--------|-------|
| Build command | `tsc -b && vite build` |
| Build tool | Vite 6 |
| Type check | tsc --noEmit (passes) |
| Output directory | dist/ |
| Chunk size warning limit | 2000 KB |
| Report compressed size | Disabled |

## Bundle Chunk Strategy

| Chunk | Contents |
|-------|----------|
| `vendor` | All node_modules except UI libs |
| `vendor-ui` | lucide-react, recharts, motion |
| Per-page chunks | Auto code-split per route |

## Current Chunk Sizes (from dist/)

| Chunk | Size |
|-------|------|
| vendor | ~200-300 KB |
| vendor-ui | ~150-200 KB |
| Auth | ~50-70 KB |
| MentorDashboard | ~80-100 KB |
| UserDashboard | ~50-70 KB |
| Others | ~20-50 KB each |

## Test Performance

| Test Suite | Type | Configuration |
|------------|------|---------------|
| Unit tests | Vitest | jsdom environment, globals: true |
| Coverage | V8 provider | text, html, lcov reporters |
| E2E tests | Playwright | 5 projects (chromium, firefox, webkit, mobile-chrome, mobile-safari) |
| E2E retries | CI: 2, Local: 0 | |
| E2E workers | CI: 4, Local: 2 | |

## React Query Configuration

| Setting | Value |
|---------|-------|
| default staleTime | 30 seconds (30000 ms) |
| default gcTime | 5 minutes (300000 ms) |
| refetchOnWindowFocus | Not explicitly set (default: true) |
| retry | 1 (default) |

## Realtime Configuration

| Setting | Value |
|---------|-------|
| Connection check interval | 60 seconds |
| Online/offline detection | navigator.onLine + window events |
| Debounce reconnection | Yes |
| Stale query invalidation on reconnect | Yes |

## Database Indexes

All tables have indexes on:
- Primary keys (automatic)
- Foreign keys (where performance matters)
- Frequently filtered columns (status, role, type, date)
- Frequently sorted columns (created_at DESC)
- Composite indexes for common query patterns

## Performance Optimizations Applied

| Optimization | Status | Details |
|-------------|--------|---------|
| Code splitting | ✅ | Per-route lazy loading |
| Manual chunking | ✅ | vendor + vendor-ui + pages |
| React Query caching | ✅ | staleTime, gcTime configured |
| Realtime deduplication | ✅ | Centralized realtimeManager |
| N+1 query fixes | ✅ | Batch queries with .in() |
| Targeted query invalidation | ✅ | Per-table cache invalidation |
| Image compression | ✅ | Before upload to storage |
| Loading gate removal | ✅ | No double-loading screens |
| RLS optimization | ✅ | JWT-based checks avoid table scans |
