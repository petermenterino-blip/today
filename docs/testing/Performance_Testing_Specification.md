# Performance Testing Specification

| Document ID | QA-PERF-011 |
|---|---|
| Document Title | Performance Testing Specification |
| Version | 1.0 |
| Status | Draft |
| Author | QA Team |
| Date | 2026-07-08 |

---

## Revision History

| Version | Date | Author | Description |
|---------|------|--------|-------------|
| 1.0 | 2026-07-08 | QA Team | Initial release — customized for Vite SPA performance metrics |

---

## 1. Introduction

This document specifies performance testing for Mentorino, a **client-rendered Vite SPA**. Performance characteristics differ significantly from server-rendered applications:

- **No SSR** — all rendering happens in the browser
- **Lazy loading** — React `lazy` + `Suspense` for code splitting
- **TanStack Query** — client-side caching reduces redundant network calls
- **Supabase queries** — directly from browser, dependent on network conditions
- **Recharts** — DOM-heavy chart rendering

### Key Performance Metrics

| Metric | Target | Tool |
|--------|--------|------|
| **LCP (Largest Contentful Paint)** | < 2.5s | Lighthouse / Web Vitals |
| **FID (First Input Delay)** | < 100ms | Lighthouse / Web Vitals |
| **CLS (Cumulative Layout Shift)** | < 0.1 | Lighthouse / Web Vitals |
| **TTI (Time to Interactive)** | < 3.5s | Lighthouse |
| **First Load JS Bundle** | < 300KB (critical path) | Vite bundle analyzer |
| **Supabase Query Time** | < 500ms (p95) | Chrome DevTools |
| **TanStack Query Cache Hit Rate** | > 60% | React Query Devtools |
| **Recharts Render Time** | < 500ms (1000 data points) | Chrome DevTools |
| **Message List Scroll** | 60fps (infinite scroll) | Chrome DevTools Performance |

---

## 2. Test Cases

### Module 2.1: Page Load Performance

#### PERF-TC-001: Landing Page Load Time

| Field | Value |
|-------|-------|
| **Test ID** | PERF-TC-001 |
| **Module** | Page Load |
| **Feature** | Landing Page |
| **Priority** | Critical |
| **Severity** | Major |
| **Test Type** | Performance |
| **Test Data** | First visit, cold cache, 3G throttling |
| **Preconditions** | Clear browser cache, network throttling to "Fast 3G" |

**Objective**: Measure landing page load performance.

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Open Chrome DevTools, enable "Fast 3G" throttling | Network throttled |
| 2 | Clear cache and reload `/#/` | Page loads |
| 3 | Capture LCP, FID, CLS via Performance panel | LCP < 2.5s, CLS < 0.1 |
| 4 | Capture JS bundle size | Main bundle < 200KB, total < 300KB |

---

#### PERF-TC-002: Student Dashboard Load Time

| Field | Value |
|-------|-------|
| **Test ID** | PERF-TC-002 |
| **Module** | Page Load |
| **Feature** | Student Dashboard |
| **Priority** | Critical |
| **Severity** | Major |
| **Test Type** | Performance |
| **Test Data** | Student1 authenticated |
| **Preconditions** | Login as student1, clear cache |

**Objective**: Measure student dashboard load with multiple queries.

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Login as student1 | Authenticated |
| 2 | Clear TanStack Query cache | All queries fresh |
| 3 | Navigate to `/#/student` | Dashboard loads with all widgets |
| 4 | Count parallel Supabase queries | Queries executed in parallel (goals, tasks, sessions, events, progress) |
| 5 | Measure total load time | All widgets visible within 3s |

---

### Module 2.2: Supabase Query Performance

#### PERF-TC-003: Query Execution Time

| Field | Value |
|-------|-------|
| **Test ID** | PERF-TC-003 |
| **Module** | Queries |
| **Feature** | Supabase Query Timing |
| **Priority** | High |
| **Severity** | Major |
| **Test Type** | Performance |
| **Test Data** | Standard queries |
| **Preconditions** | Authenticated user, DevTools Network tab open |

**Objective**: Measure Supabase query execution times.

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Open DevTools Network tab | Network recording enabled |
| 2 | Navigate to goals page | Supabase query to `goals` table |
| 3 | Record query duration | `goals` query < 200ms |
| 4 | Navigate to messages | `messages` query with conversation filter |
| 5 | Record query duration | Messages query < 300ms |
| 6 | Filter by Supabase requests in Network tab | All Supabase requests visible with timing |

---

### Module 2.3: TanStack Query Cache

#### PERF-TC-004: Cache Hit Rate

| Field | Value |
|-------|-------|
| **Test ID** | PERF-TC-004 |
| **Module** | Caching |
| **Feature** | TanStack Query Cache |
| **Priority** | Medium |
| **Severity** | Major |
| **Test Type** | Performance |
| **Test Data** | Repeat navigation |
| **Preconditions** | React Query Devtools open |

**Objective**: Verify TanStack Query cache reduces redundant requests.

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Open React Query Devtools | Devtools panel visible |
| 2 | Navigate to `/#/student/goals` | Goals query fetched and cached |
| 3 | Navigate to `/#/student/tasks` | Tasks query fetched |
| 4 | Navigate back to `/#/student/goals` | Goals loaded from cache (no network request) |
| 5 | Verify cache hit | Query status: "stale" or "fresh", no network tab activity |

---

### Module 2.4: Code Splitting & Bundle Size

#### PERF-TC-005: Lazy Loaded Chunks

| Field | Value |
|-------|-------|
| **Test ID** | PERF-TC-005 |
| **Module** | Bundling |
| **Feature** | Code Splitting |
| **Priority** | Medium |
| **Severity** | Major |
| **Test Type** | Performance |
| **Test Data** | All routes |
| **Preconditions** | DevTools Network tab |

**Objective**: Verify lazy-loaded chunks are loaded on demand.

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Load landing page — observe Network tab | Only main bundle + landing chunk loaded |
| 2 | Navigate to `/#/student` | Student dashboard chunk loaded on demand |
| 3 | Navigate to `/#/mentor` | Mentor dashboard chunk loaded on demand |
| 4 | Navigate to `/#/student/goals` | Goals chunk (if separate) loaded on demand |
| 5 | Verify no unused chunks | Only necessary chunks loaded for current route |

---

### Module 2.5: Rendering Performance

#### PERF-TC-006: Recharts Rendering

| Field | Value |
|-------|-------|
| **Test ID** | PERF-TC-006 |
| **Module** | Rendering |
| **Feature** | Chart Performance |
| **Priority** | Low |
| **Severity** | Minor |
| **Test Type** | Performance |
| **Test Data** | Large dataset for charts |
| **Preconditions** | Mentor with sufficient analytics data |

**Objective**: Measure Recharts rendering performance with data.

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Navigate to `/#/mentor?tab=analytics` | BI Analytics tab loads |
| 2 | Observe chart rendering | Charts render without layout shift |
| 3 | Interact with filter (date range) | Charts update smoothly, < 500ms re-render |
| 4 | Check FPS during interaction | > 30fps during chart transitions |

---

#### PERF-TC-007: Message List Scroll Performance

| Field | Value |
|-------|-------|
| **Test ID** | PERF-TC-007 |
| **Module** | Rendering |
| **Feature** | Message List |
| **Priority** | Medium |
| **Severity** | Major |
| **Test Type** | Performance |
| **Test Data** | Conversation with 50+ messages |
| **Preconditions** | Authenticated, messaging tab open |

**Objective**: Verify message list scrolling is smooth.

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Open messaging tab with long conversation | Messages loaded |
| 2 | Scroll to top (load older messages) | Infinite scroll works, new messages load |
| 3 | Scroll down quickly | Smooth scrolling, no jank, 60fps |
| 4 | Check for layout shifts | No content jumping during scroll |

---

### Module 2.6: Animation Performance

#### PERF-TC-008: Motion Animation Smoothness

| Field | Value |
|-------|-------|
| **Test ID** | PERF-TC-008 |
| **Module** | Rendering |
| **Feature** | Animations |
| **Priority** | Low |
| **Severity** | Minor |
| **Test Type** | Performance |
| **Test Data** | Pages with motion animations |
| **Preconditions** | Chrome DevTools Performance panel |

**Objective**: Verify motion animations run at 60fps.

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Record performance during page transitions | Frame rate > 30fps during animations |
| 2 | Record during sidebar collapse/expand | Smooth animation, no dropped frames |
| 3 | Record during modal open/close | Animation completes within 300ms, no jank |

---

## 3. Automation Mapping

| Test Cases | Tool | Automation Possible? | Status |
|-----------|------|--------------------|--------|
| PERF-TC-001, PERF-TC-002 | Lighthouse (Playwright) | Yes | ❌ Missing |
| PERF-TC-003 | Playwright (Network API) | Yes | ❌ Missing |
| PERF-TC-004 | Playwright + React Query Devtools | Partial | ❌ Missing |
| PERF-TC-005 | Playwright (chunk loading assertion) | Yes | ❌ Missing |
| PERF-TC-006 | Chrome DevTools (manual) | Manual | ❌ Missing |
| PERF-TC-007 | Playwright (scroll + paint metrics) | Partial | ❌ Missing |
| PERF-TC-008 | Chrome DevTools (manual) | Manual | ❌ Missing |
