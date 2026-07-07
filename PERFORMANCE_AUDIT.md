# PERFORMANCE AUDIT

**Project:** peter-webapp (Mentorino)  
**Date:** 2026-07-07  
**Auditor:** Google Performance Engineer  
**Scope:** Full production optimization audit across frontend, backend, infrastructure, and database

---

## EXECUTIVE SUMMARY

| Metric | Result | Grade |
|--------|--------|-------|
| Initial JS Payload | ~3.65 MB (preloaded) | **D** |
| Largest JS Chunk | 1,267 KB (vendor-heavy) | **D** |
| CSS Size | 151 KB | **C** |
| Largest Image | 3,049 KB (mentorino.png) | **F** |
| JS Chunks | 46 files | **B** |
| Code Splitting | Manual chunks configured | **B** |
| React.memo Usage | 5 components only | **D** |
| Index-as-Key | 61+ occurrences | **C** |
| Realtime Channels | ~31 potential simultaneous | **F** |
| Database Indexes | 143 total, 40+ FK columns missing | **B** |
| N+1 Queries | 7+ patterns identified | **D** |
| Cache Headers | Assets: 1 year (good), HTML: none | **B** |
| Compression | Vercel default (Brotli) | **A** |
| Sentry DSN | Placeholder in .env.production | **F** |

---

## 1. BUNDLE & CHUNK ANALYSIS

### 1.1 Initial Load Waterfall

The built `dist/index.html` preloads **5 vendor chunks synchronously** before the app can render:

| Chunk | Size | Contents |
|-------|------|----------|
| `vendor-heavy-CsVOIiN-.js` | **1,267 KB** | hls.js, jspdf, jspdf-autotable, xlsx, @sentry/react |
| `vendor-DNWuMB4a.js` | **828 KB** | motion, recharts, lucide-react |
| `vendor-ui-DIJ46Hb4.js` | **441 KB** | (duplicated vendor content) |
| `feature-heavy-DopVxgpZ.js` | **884 KB** | mentor, messaging, resources, admin features |
| `vendor-data-DDkxoLQr.js` | **242 KB** | @tanstack/react-query, @supabase/supabase-js |
| `index-zEj56tnX.js` | **31 KB** | App shell, router, auth context |
| `index-BW23h_jU.css` | **151 KB** | Tailwind CSS output |

**Total JS preloaded before first paint: ~3.65 MB**

### 1.2 Chunk Organization

```
vendor-heavy ── hls.js (1.6.16), jspdf (4.2.0), xlsx (0.18.5), @sentry/react
vendor-ui ──── lucide-react (0.474.0), recharts (2.15.0), motion (12.38.0)
vendor-data ── @tanstack/react-query (5.100.8), @supabase/supabase-js (2.108.2)
vendor ─────── everything else in node_modules
feature-heavy ── src/features/mentor/, src/features/messaging/, src/features/resources/, src/features/admin/
```

### 1.3 Issues

| # | Issue | Severity | Detail |
|---|-------|----------|--------|
| 1 | **hls.js bundled unconditionally** | **Critical** | hls.js (1.6.16, ~400 KB gzipped) is loaded in the critical path for ALL users, but is only needed for video streaming. Should be dynamic import on video mount. |
| 2 | **jspdf + xlsx bundled unconditionally** | **High** | Report generation libraries (jspdf + jspdf-autotable + xlsx ≈ 600 KB combined) loaded for every user regardless of role. |
| 3 | **feature-heavy chunk too large** | **High** | 884 KB loaded upfront. Contains 4 feature domains merged into one chunk. These should be route-based splitted entries. |
| 4 | **vendor-ui chunk splits poorly** | **Medium** | motion and recharts in the same chunk. recharts alone is ~300 KB; motion is another ~400 KB. Should be separate. |
| 5 | **No bundle analysis in CI** | **Medium** | No `vite-plugin-visualizer` or size budget enforcement in build. |
| 6 | **`reportCompressedSize: false`** | **Low** | Compressed size reporting is disabled in vite config. Useful for debugging bundle issues. |

---

## 2. CODE SPLITTING & LAZY LOADING

### 2.1 Current State

All page-level components in `App.tsx` use `React.lazy()` — good practice.

Pages that ARE lazy-loaded:
- LandingPage, ApplicationPage, UserDashboard, MentorDashboard, AuthPage  
- SettingsPage, BookingPage, StorePage, SurveyPage, PrivacyPage, TermsPage  
- FinancialsPage, ConsultationOverviewPage, NotFoundPage  
- AboutPage, ProgramsPage, ConsultationPage, FAQPage, ContactPage, GalleryPage, MentorshipPage  

Pages that ARE NOT lazy-loaded:
- `PendingApproval` — trivial size, acceptable  
- `ResetPassword` — trivial size, acceptable  

### 2.2 Issues

| # | Issue | Severity | Detail |
|---|-------|----------|--------|
| 7 | **No feature sub-splitting** | **Critical** | MentorDashboard (lazy at page level) loads ALL sub-tabs (overview, mentees, sessions, analytics, etc.) in one monolithic chunk via `feature-heavy`. Each tab should be lazily loaded. |
| 8 | **UserDashboard imports all student features upfront** | **High** | `UserDashboard.tsx` imports student components synchronously. Student sub-pages (tasks, goals, journals, etc.) are all in the same route-level lazy chunk. |
| 9 | **Recharts not lazy-loaded** | **High** | Recharts (~300 KB) is imported eagerly in AnalyticsBI.tsx and AdminRevenue.tsx. Should be dynamic import since it's only used in mentor/admin dashboards. |
| 10 | **Lucide-react not tree-shaken effectively** | **Medium** | Layout.tsx imports 33 icon components individually. While tree-shaking works, the `vendor-ui` chunk is still 441 KB. Consider using `lucide-react/dynamic` or `react-lucide-dynamic`. |
| 11 | **Sonner toast loaded globally** | **Low** | sonner (2.0.7) is imported in App.tsx and rendered via `<Toaster>`. Its bundle cost is small (~8 KB), acceptable. |

---

## 3. REACT RENDERING PERFORMANCE

### 3.1 useMemo / useCallback Coverage

| # | Issue | Severity | Location |
|---|-------|----------|----------|
| 12 | **Missing useCallback on sidebar nav map** | **Medium** | `src/components/shared/Layout.tsx:148` — `navItems.map` creates new elements on every render. The sidebar re-renders on every route change. |
| 13 | **AnalyticsBI re-renders entire chart grid** | **High** | `src/features/mentor/components/AnalyticsBI.tsx` — No `React.memo` on chart components (KPICard, chart sections). All 8+ charts re-render on any state change. |
| 14 | **CalendarGrid re-renders all cells** | **High** | `src/features/mentor/components/CalendarGrid.tsx` — Missing React.memo on day cells. Inline handlers cause full re-render on any interaction. |
| 15 | **AdminRevenue re-renders all charts** | **Medium** | `src/features/admin/AdminRevenue.tsx` — No memoization on revenue chart components. |

### 3.2 React.memo Usage

Only 5 components use `React.memo` across the entire codebase. Missing on high-impact components:

| # | Issue | Severity | Component |
|---|-------|----------|-----------|
| 16 | **EventCard missing React.memo** | **Medium** | `src/features/events/EventCard.tsx` — Rendered in lists, re-renders on parent state change. |
| 17 | **ResourceCard missing React.memo** | **Medium** | `src/features/resources/ResourceCard.tsx` — Same pattern as EventCard. |
| 18 | **MessageThread missing React.memo** | **High** | `src/features/messaging/MessageThread.tsx` — Chat messages re-render on every keystroke. |
| 19 | **ConversationList missing React.memo** | **High** | `src/features/messaging/ConversationList.tsx` — List re-renders entirely on new messages. |

### 3.3 Key Props (Index as Key)

| # | Issue | Severity | Location |
|---|-------|----------|----------|
| 20 | **61+ index-as-key occurrences** | **High** | Widespread across CalendarGrid (days), AnalyticsBI (chart mappers), StudentEvents (event lists), MenteesTab, and various `.map()` calls throughout the codebase. Index-as-key causes unnecessary DOM reconciliation and breaks React's rendering optimization. |

### 3.4 Context Re-renders

| # | Issue | Severity | Detail |
|---|-------|----------|--------|
| 21 | **AuthContext ref-based optimization** | **Low** (good) | The ref-based diffing (`lastUserIdRef`, `lastRoleRef`) prevents unnecessary state updates. Well implemented. |
| 22 | **ConnectionContext polls every 60s** | **Medium** | `src/context/ConnectionContext.tsx:60` — Polls Supabase every 60s even when user is inactive. Consider increasing to 120s or using visibility-based polling. |

### 3.5 State Management

| # | Issue | Severity | Detail |
|---|-------|----------|--------|
| 23 | **Server data in local state** | **Medium** | Several components hold server data in local state (`useState`) that should be derived from React Query cache. Creates stale data and cascade re-renders. |

---

## 4. SUPABASE — QUERIES

### 4.1 N+1 Query Patterns

| # | Issue | Severity | Location |
|---|-------|----------|----------|
| 24 | **enrichConversation() — N+1** | **Critical** | `src/services/messageService.ts:116` — `getConversations()` calls `Promise.all(convs.map(enrichConversation))`, which issues 2N additional `profiles` queries for N conversations. |
| 25 | **resourceService.notifyResourceCreated() — N+1** | **High** | `src/services/resourceService.ts:527-548` — Loops per student and per enrollment to insert notifications individually. |
| 26 | **socialLinksService.save() — N+1** | **Medium** | `src/services/socialLinksService.ts:29-52` — One query per link in a loop. |
| 27 | **Storage update() re-fetches** | **Medium** | `journalStorage.ts:106`, `notificationStorage.ts:128`, `taskStorage.ts:110`, `goalStorage.ts:131` — Each calls `getById()` after mutation, adding an unnecessary read query. |

### 4.2 Over-fetching (SELECT *)

| # | Issue | Severity | Location |
|---|-------|----------|----------|
| 28 | **Widespread SELECT *** | **High** | 15+ occurrences across `applicationService.ts`, `resourceService.ts`, `visitorBookingService.ts`, `crmInitializationService.ts`, `websiteSettingsService.ts`, `aiAssistant.ts`, `eventService.ts`. Most queries fetch ALL columns when only a subset is needed. |
| 29 | **Nested wildcard in eventService** | **Medium** | `src/services/eventService.ts:13-22` — `EVENT_FULL_FIELDS` uses `*` with 6 joined relations (`event_speakers(*)`, etc.) fetched unconditionally. |
| 30 | **Nested wildcard in aiAssistant** | **Medium** | `src/services/aiAssistant.ts:100` — `.select('*, student:profiles(*)')` fetches entire profile object. |

### 4.3 Missing Pagination

| # | Issue | Severity | Location |
|---|-------|----------|----------|
| 31 | **15+ queries lack pagination** | **High** | `eventService.ts` (fetchAll, fetchUpcoming, fetchLive, fetchByProgram, getAttendees, getActivity, exportAttendees), `resourceService.ts` (getAssignments, getCompletions, getComments), `studentService.ts` (getByMentor), `contextEngine.ts` (7 methods). Any table with >100 rows will degrade. |
| 32 | **contextEngine fetches all data** | **High** | `src/services/contextEngine.ts:54-158` — 7 methods that fetch mentor data without `.range()` or `.limit()`. Could fetch thousands of rows. |

### 4.4 Inefficient Filters

| # | Issue | Severity | Location |
|---|-------|----------|----------|
| 33 | **Leading-wildcard ILIKE** | **High** | `applicationService.ts:110`, `resourceService.ts:21,732`, `studentService.ts:182`, `visitorBookingService.ts:208` — `ilike.%search%` prevents index usage entirely. |
| 34 | **OR conditions across columns** | **Medium** | `bookingService.ts:88` — OR across `user_id` and `mentor_id`. Consider UNION. |
| 35 | **5 separate count queries** | **Medium** | `reviewService.ts:340-369` — 5 individual count queries where `COUNT(*) FILTER (WHERE ...)` would suffice. |

### 4.5 Count + Data Duplication

| # | Issue | Severity | Location |
|---|-------|----------|----------|
| 36 | **Duplicate query chains** | **High** | `resourceService.ts:69-75` — `applyFilters()` chain runs twice: once for count, once for data. For complex filters, this doubles query time. |

---

## 5. SUPABASE — INDEXES

### 5.1 Current State: 143 indexes across all migration files

Well-indexed tables: sessions (6), events (10), reviews (11+), notifications (4), messages (5), tasks (5), goals (4), journals (3), applications (4), resources child tables

### 5.2 Critical Missing Indexes

| # | Issue | Severity | Missing Index |
|---|-------|----------|--------------|
| 37 | **sessions.program_id** | **High** | FK → programs(id). Sessions filtered by program have no index. |
| 38 | **bookings.program_id** | **High** | FK → programs(id). Bookings filtered by program. |
| 39 | **bookings.mentor_id** | **High** | FK → profiles(id). Added in migration 033, no index. |
| 40 | **applications.program_id** | **High** | FK → programs(id). Applications filtered by program. |
| 41 | **resources.created_by** | **Medium** | FK → profiles(id). Resources filtered by creator. |
| 42 | **event_activity.user_id** | **Medium** | FK → profiles(id). No index on user_id lookups. |
| 43 | **event_comments.user_id** | **Medium** | FK → profiles(id). |
| 44 | **event_feedbacks.user_id** | **Medium** | FK → profiles(id). |
| 45 | **event_waitlist.user_id** | **Medium** | FK → profiles(id). |
| 46 | **conversations.admin_id** | **Low** | FK → profiles(id). Rarely queried. |
| 47 | **40+ FK columns missing indexes** | **Medium** | Shared_files, surveys, transactions, analytics_events, provisioning_jobs, mentor_availability, etc. |

### 5.3 Index Quality Issues

| # | Issue | Severity | Detail |
|---|-------|----------|--------|
| 48 | **Duplicate indexes** | **Low** | `idx_enrollments_student` / `idx_program_enrollments_student` both on student_id. Adds write overhead. |
| 49 | **Partial indexes underutilized** | **Low** | Only reviews use `WHERE deleted_at IS NULL` partial indexes. Could benefit tasks, goals, notifications. |

---

## 6. SUPABASE — REALTIME

### 6.1 Channel Overload

| # | Issue | Severity | Detail |
|---|-------|----------|--------|
| 50 | **~31 simultaneous channels** | **Critical** | `useSharedRealtimeData` creates 24 channels across hooks. `useSharedSubscription` adds 5. Direct channels add 2. **Supabase free tier limit is 10 channels per client.** This will cause connection failures in production. |
| 51 | **Channel naming prevents deduplication** | **High** | `src/lib/realtimeManager.ts:43` — `generateChannelName()` uses `crypto.randomUUID()` per render cycle. Unique names prevent Supabase's internal channel deduplication and cause stale orphan channels if cleanup fails. |
| 52 | **Real-time on low-frequency tables** | **Medium** | Tables like `transaction`, `gallery_items`, `student_profiles` subscribe to realtime changes but are infrequently updated. Each wastes a channel slot. |

### 6.2 Realtime Publication

| # | Issue | Severity | Detail |
|---|-------|----------|--------|
| 53 | **Realtime publication limited to 4 tables** | **Low** (correct) | Migration 9991 correctly limits `supabase_realtime` publication to `messages`, `notifications`, `sessions`, `profiles`. However, the channel creation in `useSharedRealtimeData` subscribes to tables not in this publication. |

---

## 7. IMAGES

### 7.1 Image Audit

| Asset | Size | Dimensions (est.) | Issues |
|-------|------|-------------------|--------|
| `public/images/mentorino.png` | **3,049 KB** | Likely >4000px | **Not resized, wrong format (PNG should be WebP/AVIF)** |
| `public/images/event-1.jpeg` | **2,198 KB** | >3000px | **Not resized, no srcset, no WebP** |
| `public/images/event-2.jpeg` | **2,135 KB** | >3000px | **Not resized, no srcset, no WebP** |
| `public/images/event-3.jpeg` | **1,031 KB** | >2000px | **Not resized** |
| `public/images/event-4.jpg` | **74 KB** | Reasonable | OK |

| # | Issue | Severity | Detail |
|---|-------|----------|--------|
| 54 | **Largest image is 3 MB (mentorino.png)** | **Critical** | This is likely a logo/hero image. Should be ≤100 KB with WebP/AVIF format. A 3 MB PNG adds 1-3 seconds of LCP delay on 4G. |
| 55 | **No image optimization pipeline** | **Critical** | No `vite-plugin-imagemin`, no `sharp`, no `<picture>` with srcset. Images are served as-is. |
| 56 | **No responsive images** | **High** | None of the images use `srcset` or `sizes` attributes. Desktop-sized images served to mobile. |
| 57 | **No WebP/AVIF conversion** | **High** | JPEG/PNG formats are 30-50% larger than equivalent WebP. AVIF would save another 20-30%. |
| 58 | **No lazy loading on images** | **Medium** | While `loading="lazy"` is used in 27 places, event images in `EventCard` must be verified. |
| 59 | **Event images served from `/images/`** | **Medium** | These are static images bundled in the build. They should be served from Supabase Storage with CDN + transform. |

---

## 8. FONTS

| # | Issue | Severity | Detail |
|---|-------|----------|--------|
| 60 | **Google Fonts render-blocking** | **High** | `index.html:9` — Font CSS is loaded via `<link>` in `<head>` without `media="print" onload="this.media='all'"` pattern or `font-display: swap`. The browser blocks rendering until font loads. |
| 61 | **Entire Inter font family loaded** | **Medium** | The Google Fonts URL loads ALL weights (100..900) and ALL italics. This is a ~150 KB font file. On a design using only Regular (400), Medium (500), Semibold (600), Bold (700). |
| 62 | **No font-display: swap in loaded CSS** | **Medium** | The Google Fonts stylesheet may not include `font-display: swap`. Should be verified and custom `@font-face` with `font-display: swap` used instead. |

---

## 9. CACHING & COMPRESSION

### 9.1 Vercel Configuration

```json
{
  "source": "/assets/(.*)",
  "headers": [{ "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }]
}
```

| # | Issue | Severity | Detail |
|---|-------|----------|--------|
| 63 | **No Cache-Control for index.html** | **High** | `index.html` has no explicit cache header. Vercel defaults may vary. Should set `max-age=0, must-revalidate` to ensure immediate updates. |
| 64 | **No Cache-Control for images** | **High** | `/images/*` is not matched by the `assets/(.*)` pattern. Images are served without caching, causing repeat downloads. |
| 65 | **No Service Worker** | **Medium** | No Workbox or vite-plugin-pwa. No offline support beyond OfflineBanner. No precaching of app shell. |

### 9.2 Compression

| # | Issue | Severity | Detail |
|---|-------|----------|--------|
| 66 | **Vercel Brotli compression** | **A** (good) | Vercel automatically applies Brotli to text assets. No action needed. |

---

## 10. PACKAGE ANALYSIS

### 10.1 Unused / Redundant Dependencies

| # | Issue | Severity | Detail |
|---|-------|----------|--------|
| 67 | **dompurify imported but usage unverified** | **Medium** | `dompurify` (3.4.11) is imported but only used in a few places. Verify all user-generated content actually sanitizes through it. |
| 68 | **xlsx (0.18.5) + jspdf (4.2.0) heavy** | **High** | Combined ~500 KB for spreadsheet/PDF export. If only used in admin/mentor dashboards, should be lazy-loaded at the component level. |
| 69 | **hls.js (1.6.16) usage** | **High** | ~400 KB video streaming library. Verify actual usage patterns — may not be needed on all pages. |

### 10.2 DevDependencies in Production

| # | Issue | Severity | Detail |
|---|-------|----------|--------|
| 70 | **All devDependencies correct** | **A** (good) | @types, testing libraries, vite, vitest, playwright, msw, jsdom are correctly in devDependencies. No prod leaks. |

---

## 11. SENTRY & MONITORING

| # | Issue | Severity | Detail |
|---|-------|----------|--------|
| 71 | **Sentry DSN is a placeholder** | **Critical** | `.env.production:19` — `VITE_SENTRY_DSN=https://xxxxx@xxxxx.ingest.us.sentry.io/xxxxx` — This will fail to initialize Sentry in production. No error monitoring is active. |
| 72 | **Sentry initialized lazily via dynamic import** | **Low** | `src/lib/sentry.ts:8` — `import('@sentry/react')` means Sentry initializes after mount, not before. For error capture during early startup, this may miss critical boot errors. |

---

## 12. CORE WEB VITALS PREDICTIONS

Based on the audit findings:

| Metric | Prediction | Bottleneck |
|--------|------------|------------|
| **LCP** | **3-5s** (Poor) | 3 MB hero image + 3.65 MB JS + render-blocking font |
| **FID/INP** | **200-400ms** (Needs Improvement) | 56+ inline handlers, no memoization on chart interactions |
| **CLS** | **0.15-0.3** (Needs Improvement) | No explicit dimensions on images, fallback loaders may shift content |
| **TTFB** | **<200ms** (Good) | Vercel edge + Supabase should be fast |
| **FCP** | **2-4s** (Poor) | Massive JS preload + CSS blocking + font loading |

---

## 13. CRITICAL ISSUES (Must Fix Before Production)

| Rank | Issue | ID |
|------|-------|----|
| **C-1** | 3 MB hero image (mentorino.png) blocks LCP | #54 |
| **C-2** | No image optimization pipeline (WebP, srcset) | #55 |
| **C-3** | Realtime: ~31 channels exceeds 10-channel limit | #50 |
| **C-4** | hls.js + jspdf + xlsx in critical path (2.3 MB) | #1, #2 |
| **C-5** | N+1 in messageService.enrichConversation | #24 |
| **C-6** | Sentry DSN is placeholder — no error monitoring | #71 |
| **C-7** | Feature-heavy chunk (884 KB) loaded upfront | #3 |
| **C-8** | No service worker / offline precaching | #65 |

---

## 14. HIGH PRIORITY ISSUES

| Rank | Issue | ID |
|------|-------|----|
| **H-1** | Google Fonts render-blocking | #60 |
| **H-2** | No Cache-Control for images in vercel.json | #64 |
| **H-3** | No Cache-Control for index.html | #63 |
| **H-4** | 61+ index-as-key occurrences | #20 |
| **H-5** | Missing React.memo on MessageThread, ConversationList | #18, #19 |
| **H-6** | CalendarGrid full re-render | #14 |
| **H-7** | AnalyticsBI full chart re-render | #13 |
| **H-8** | Recharts not lazy-loaded | #9 |
| **H-9** | 15+ queries lack pagination | #31 |
| **H-10** | Widespread SELECT * | #28 |
| **H-11** | Leading-wildcard ILIKE patterns (cannot use indexes) | #33 |
| **H-12** | sessions.program_id missing index | #37 |
| **H-13** | bookings.program_id and bookings.mentor_id missing indexes | #38, #39 |
| **H-14** | applications.program_id missing index | #40 |
| **H-15** | contextEngine fetches all data without limit | #32 |
| **H-16** | Duplicate query chains in resourceService | #36 |
| **H-17** | No responsive images / no WebP | #56, #57 |
| **H-18** | Realtime channel naming prevents dedup | #51 |
| **H-19** | Entire Inter font family loaded (100-900) | #61 |

---

## 15. MEDIUM PRIORITY ISSUES

| Rank | Issue | ID |
|------|-------|----|
| **M-1** | No bundle analysis tooling | #5 |
| **M-2** | Lucide-react tree-shaking insufficient (441 KB) | #10 |
| **M-3** | Missing useCallback on Layout sidebar | #12 |
| **M-4** | EventCard, ResourceCard missing React.memo | #16, #17 |
| **M-5** | ConnectionContext polls every 60s | #22 |
| **M-6** | Server data in local state pattern | #23 |
| **M-7** | socialLinksService N+1 | #26 |
| **M-8** | Storage update() re-fetches | #27 |
| **M-9** | Nested wildcard in eventService | #29 |
| **M-10** | Nested wildcard in aiAssistant | #30 |
| **M-11** | OR conditions across columns (bookingService) | #34 |
| **M-12** | 5 separate count queries (reviewService) | #35 |
| **M-13** | event_activity, event_comments, event_feedbacks missing user_id index | #42-45 |
| **M-14** | resources.created_by missing index | #41 |
| **M-15** | Realtime: low-frequency table subscriptions | #52 |
| **M-16** | No `font-display: swap` in custom fonts | #62 |
| **M-17** | dompurify usage verification | #67 |
| **M-18** | Event images not served via CDN | #59 |
| **M-19** | Missing lazy loading on some images | #58 |

---

## 16. LOW PRIORITY ISSUES

| Rank | Issue | ID |
|------|-------|----|
| **L-1** | `reportCompressedSize: false` in vite config | #6 |
| **L-2** | Sonner toast — minimal impact | #11 |
| **L-3** | AuthContext optimization is actually good (no action) | #21 |
| **L-4** | Duplicate indexes (enrollments) | #48 |
| **L-5** | Partial indexes underutilized | #49 |
| **L-6** | conversations.admin_id missing index | #46 |
| **L-7** | 40+ FK columns missing indexes (low-traffic tables) | #47 |
| **L-8** | Sentry dynamic import timing | #72 |
| **L-9** | Realtime publication correctly limited | #53 |

---

## 17. PERFORMANCE METRICS SUMMARY

```
                    ┌─────────────────────────────────────────────────────┐
                    │            PERFORMANCE SCORECARD                    │
                    ├─────────────────────────────────────────────────────┤
                    │  Bundle Size            ████████░░░░  3.65 MB   D  │
                    │  Code Splitting         ████████░░░░  Good      B  │
                    │  Lazy Loading           ████████░░░░  Good      B  │
                    │  React Memoization      ████░░░░░░░░  Poor      D  │
                    │  Image Optimization     ██░░░░░░░░░░  Critical  F  │
                    │  Font Loading           ████░░░░░░░░  Poor      D  │
                    │  Cache Headers          ██████░░░░░░  Fair      C  │
                    │  Compression            ████████████  Great     A  │
                    │  Database Queries       ████░░░░░░░░  Poor      D  │
                    │  Database Indexes       ████████░░░░  Good      B  │
                    │  Realtime Channels      ██░░░░░░░░░░  Failing   F  │
                    │  N+1 Prevention         ████░░░░░░░░  Poor      D  │
                    │  Pagination             ████░░░░░░░░  Poor      D  │
                    │  Monitoring             ██░░░░░░░░░░  None      F  │
                    ├─────────────────────────────────────────────────────┤
                    │  OVERALL                ████░░░░░░░░  44/100   D   │
                    └─────────────────────────────────────────────────────┘
```

---

## 18. RECOMMENDED ROADMAP

### Phase 1 — Immediate (0-2 days)
1. Fix Sentry DSN placeholder
2. Optimize hero image (mentorino.png → WebP, ≤100 KB, 1200px max)
3. Add image cache headers to vercel.json
4. Fix realtime channel overload (consolidate subscriptions, implement connection pooling)
5. Add `font-display: swap` to Font loading

### Phase 2 — Short-term (3-7 days)
1. Dynamic import hls.js, jspdf, xlsx (lazy on route/component mount)
2. Split feature-heavy chunk into route-based entries
3. Add pagination to all unbounded queries
4. Add missing FK indexes (sessions.program_id, bookings.program_id, bookings.mentor_id, applications.program_id)
5. Fix N+1 in messageService (batch profile queries)
6. Implement image pipeline: WebP + srcset via build plugin

### Phase 3 — Medium-term (1-2 weeks)
1. Add React.memo to top 10 re-rendering components
2. Fix all 61+ index-as-key instances
3. Add lazy loading for recharts
4. Replace SELECT * with specific column selects
5. Replace leading-wildcard ILIKE with full-text search (tsvector)
6. Add service worker via vite-plugin-pwa

### Phase 4 — Long-term (2-4 weeks)
1. Implement route-based code splitting for mentor tabs
2. Add bundle visualizer and size budgets to CI
3. Implement proper pagination across all list pages
4. Add partial indexes for soft-delete tables
5. Add server-side rendering or static generation for landing/marketing pages

---

*Audit performed using static analysis of source code, build output, configuration files, and SQL schema. Network measurements are estimates based on standard 4G throttling (10 Mbps, 100ms RTT).*
