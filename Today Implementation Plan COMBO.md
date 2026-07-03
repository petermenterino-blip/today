# 📋 Today Implementation Plan COMBO
## Mentorino — Complete Analysis + Implementation Roadmap

**Date:** July 3, 2026  
**Source 1:** Plan 1 — GITHUBchat (Implementation tasks & scheduling)  
**Source 2:** Plan 2 — Claude Anti gravity (Deep codebase audit & bug findings)  

---

## TABLE OF CONTENTS

1. [Executive Summary](#1-executive-summary)
2. [Bug Inventory — Merged & Prioritized](#2-bug-inventory--merged--prioritized)
3. [Unified Implementation Roadmap](#3-unified-implementation-roadmap)
4. [File Change Summary](#4-file-change-summary)
5. [Cross-Dashboard Sync Requirements](#5-cross-dashboard-sync-requirements)
6. [Testing Protocol](#6-testing-protocol)
7. [Daily Schedule](#7-daily-schedule)
8. [Success Criteria](#8-success-criteria)

---

## 1. Executive Summary

### State of the Codebase

| Metric | Value |
|--------|-------|
| Total features analyzed | 24 |
| Fully working | 12 |
| Partially broken | 8 |
| Completely broken | 4 |
| Critical bugs (Plan 1 + Plan 2 merged) | 11 |
| High severity bugs | 11 |
| Medium severity bugs | 12 |
| Missing CRUD operations | 5 |
| Files that need changes | ~35 |
| Estimated effort | 60-70 hours |

### How Plan 1 and Plan 2 Complement Each Other

**Plan 1 (GITHUBchat)** is an implementation guide focused on:
- Securing edge functions (3 files)
- Adding real-time subscriptions (8 hooks)
- Fixing task/goal sync between dashboards
- Fixing messaging system
- Fixing event RSVP persistence
- 5-day schedule with hourly tasks

**Plan 2 (Claude Anti gravity)** is a comprehensive audit that found:
- 6 critical bugs Plan 1 missed (ID mismatch, dual task service, growth audit, custom forms, credential delivery, program progress)
- 7 high-severity bugs Plan 1 missed (cross-tab messaging, file uploads, analytics, etc.)
- Schema-service mismatches between localStorage and Supabase
- Missing CRUD operations
- 30+ localStorage key inventory

**The COMBO** adds the missing Plan 2 findings as new phases (Phase 1.3, Phase 2.3, Phase 4) and reprioritizes everything.

### Critical Path (Must Fix Before Anything Works Reliably)

```
Phase 1.3 (ID Normalization) ──► Phase 1.2 (Real-time) ──► Phase 2 (Task/Goal Sync)
        │                                                    │
        ├── Phase 1.1 (Edge Security)                        ├── Phase 2.3 (Dual Service)
        │                                                    │
        └── Phase 1.4 (Cross-tab Messaging)                  └── Phase 3 (All Features)
```

---

## 2. Bug Inventory — Merged & Prioritized

### 🔴 CRITICAL (11 bugs)

| ID | Bug | Found In | Plan 1 | Plan 2 | Fix Phase |
|----|-----|----------|--------|--------|-----------|
| C1 | **Dual ID format mismatch** — New students get `student-${Date.now()}` while seed data uses `"1"`, `"2"`; all ID-based lookups fail | `applicationService.ts`, `seedData.ts`, all `*Storage.ts` | ❌ MISSED | ✅ Found | Phase 1.3 |
| C2 | **Dual task service** — `taskStorage.ts` vs `taskService.ts`; different parts of app use different services | `taskStorage.ts`, `taskService.ts`, `useTasks.ts` | ❌ MISSED | ✅ Found | Phase 2.3 |
| C3 | **Growth audit invisible to mentor** — Students submit, mentor has no view | `GrowthAuditForm.tsx`, `MentorDashboard.tsx` | ❌ MISSED | ✅ Found | Phase 3.5 |
| C4 | **Custom forms inaccessible to students** — Mentor creates, student can't fill | `customFormService.ts`, `UserDashboard.tsx` | ❌ MISSED | ✅ Found | Phase 3.6 |
| C5 | **Credentials never delivered** — Password shown once in toast, no delivery mechanism | `applicationService.ts`, `MentorDashboard.tsx` | ❌ MISSED | ✅ Found | Phase 3.7 |
| C6 | **Program progress invisible to mentor** — No mentor view for lessons/quizzes | `MentorDashboard.tsx`, `studentProgressService.ts` | ❌ MISSED | ✅ Found | Phase 3.8 |
| C7 | **Task creation doesn't sync to student** — Mentor creates, student doesn't see | `useTasks.ts`, `useFeedback.ts` | ✅ Addressed | ✅ Found | Phase 2.1 |
| C8 | **Goal updates don't sync to student** — Mentor updates, student sees old value | `useMentees.ts`, `StudentGoals.tsx` | ✅ Addressed | ✅ Found | Phase 2.2 |
| C9 | **Messages not persisting/not real-time** — Messages lost on refresh, cross-tab broken | `WhatsAppMessaging.tsx`, `messageService.ts` | ✅ Addressed | ✅ Found | Phase 3.1 + 1.4 |
| C10 | **Event RSVP doesn't persist** — Status reverts on page refresh | `EventManagement.tsx`, `eventService.ts` | ✅ Addressed | ✅ Found | Phase 3.2 |
| C11 | **Edge functions unprotected** — No auth checks on Gemini/Meet/Calendar endpoints | `edge-functions/*/index.ts` | ✅ Addressed | ❌ Not in scope | Phase 1.1 |

### 🔴 HIGH (11 bugs)

| ID | Bug | Fix Phase |
|----|-----|-----------|
| H1 | **Cross-tab messaging sync failure** — Custom events don't cross browser tabs | Phase 1.4 |
| H2 | **File uploads broken in localStorage mode** — `storageService.ts` has no fallback | Phase 3.9 |
| H3 | **Analytics data stale** — Direct localStorage reads, not React Query | Phase 2.4 |
| H4 | **Event registration UI doesn't update** — Requires page refresh after register | Phase 3.2 |
| H5 | **Student sessions depend on ID match** — Wrong ID format = empty sessions list | Phase 1.3 |
| H6 | **Mentor session dropdown stale** — Student list not React Query, misses new students | Phase 2.4 |
| H7 | **HLS video URLs may be invalid** — Seed data test streams may be down | Phase 3.10 |
| H8 | **Task service mismatch** — Different service paths for same data | Phase 2.3 |
| H9 | **Profile data split** — Supabase vs localStorage profile inconsistency | Phase 3.11 |
| H10 | **Auth users not seeded in Supabase** — SQL seed skips `auth.users` | Phase 4.1 |
| H11 | **Missing env vars** — Sentry DSN, PostHog key, service role key all empty | Phase 4.2 |

### 🟡 MEDIUM (12 bugs)

| ID | Bug | Fix Phase |
|----|-----|-----------|
| M1 | No auto-notifications for key actions | Phase 3.12 |
| M2 | Students can't unregister from events | Phase 3.2 |
| M3 | Students can't cancel bookings | Phase 3.13 |
| M4 | Voice messages are simulated (no real recording) | Phase 3.14 |
| M5 | AI Insights tab is a stub (geminiService.ts) | Phase 3.15 |
| M6 | Store tab is non-functional mock | Phase 4.3 |
| M7 | Duplicate event registration in localStorage | Phase 3.2 |
| M8 | Student can't edit form responses or feedback | Phase 3.16 |
| M9 | Message search shows blank instead of "no results" | Phase 3.1 |
| M10 | Duplicate edge function directories | Phase 4.4 |
| M11 | Realtime subscriptions fire in localStorage mode | Phase 4.5 |
| M12 | All-or-nothing cache invalidation | Phase 4.6 |

---

## 3. Unified Implementation Roadmap

### PHASE 1: FOUNDATION (Days 1-2 · 20 hours)

The core infrastructure that everything else depends on. Fix these first.

---

#### Phase 1.1: Secure Edge Functions (4 hours)
*From Plan 1 Task 1.1*

| File | Change |
|------|--------|
| `edge-functions/middleware/auth.ts` | CREATE — Reusable JWT validation middleware |
| `edge-functions/gemini/index.ts` | MODIFY — Add auth check |
| `edge-functions/meet/index.ts` | MODIFY — Add auth check |
| `edge-functions/calendar/index.ts` | MODIFY — Add auth check |

**Validation:**
- [ ] Each endpoint with valid JWT → 200 OK
- [ ] Each endpoint without token → 401
- [ ] Each endpoint with invalid token → 401

---

#### Phase 1.2: Real-Time Subscriptions (6 hours)
*From Plan 1 Task 1.2*

| File | Change |
|------|--------|
| `src/hooks/useRealtimeData.ts` | CREATE — Reusable real-time subscription hook |
| `src/hooks/useApplications.ts` | MODIFY — Add subscription |
| `src/hooks/useBookings.ts` | MODIFY — Add subscription |
| `src/hooks/useEvents.ts` | MODIFY — Add subscription |
| `src/hooks/useGoals.ts` | MODIFY — Add subscription |
| `src/hooks/useJournals.ts` | MODIFY — Add subscription |
| `src/hooks/useSessions.ts` | MODIFY — Add subscription |
| `src/hooks/useTasks.ts` | MODIFY — Add subscription |
| `src/hooks/usePrograms.ts` | MODIFY — Add subscription |

Plus fix mutation `onSuccess` callbacks in all hooks to properly invalidate queries.

**Validation:**
- [ ] Supabase logs show subscription connections
- [ ] Mentor creates goal → Student sees within 2s
- [ ] Student updates task → Mentor sees within 2s
- [ ] No console errors

---

#### Phase 1.3: ID Normalization (8 hours)
*NEW — From Plan 2 finding C1*

**Root Cause:** `applicationService._createStudentAccount` generates IDs like `student-${Date.now()}` while seed data uses `"1"`, `"2"`, `"3"`. Services filter by exact ID match, causing all queries to return empty for newly created students.

**Approach:** Unify ID format across the application. Since localStorage uses string IDs, migrate everything to use the pattern `{prefix}-{timestamp}` consistently.

| File | Change |
|------|--------|
| `src/utils/seedData.ts` | MODIFY — Regenerate all seed IDs to `student-1718...` format |
| `src/services/applicationService.ts` | MODIFY — Keep existing format (already uses correct pattern) |
| `src/services/studentService.ts` | MODIFY — Ensure `getStudentById` uses correct ID format |
| `src/services/goalStorage.ts` | MODIFY — Ensure `getGoalsByStudent` uses correct ID format |
| `src/services/taskStorage.ts` | MODIFY — Ensure `getTasksByStudent` uses correct ID format |
| `src/services/journalStorage.ts` | MODIFY — Ensure `getJournalsByStudent` uses correct ID format |
| `src/services/sessionService.ts` | MODIFY — Ensure filtering uses correct ID format |
| `src/services/studentProgressService.ts` | MODIFY — Ensure progress key uses correct ID format |
| `src/services/bookingService.ts` | MODIFY — Ensure booking filtering uses correct ID format |

**Validation:**
- [ ] After approval, new student appears in mentor's student list
- [ ] New student's goals, tasks, journals, sessions all load correctly
- [ ] Seed student (converted) data still works
- [ ] Mentor can assign tasks to new student and student sees them

---

#### Phase 1.4: Cross-Tab Messaging Sync (2 hours)
*NEW — From Plan 2 finding H1*

**Root Cause:** Custom events (`new-message`, `database-sync`) only work within the same browser tab. `StorageEvent` (native localStorage) fires for other tabs but only on `setItem` calls, which the current code doesn't trigger for messaging.

| File | Change |
|------|--------|
| `src/services/messageService.ts` | MODIFY — After writing messages, also call `localStorage.setItem` with a timestamp key to trigger `StorageEvent` |
| `src/hooks/useDatabaseSync.ts` | MODIFY — Add `StorageEvent` listener for messaging keys |
| `src/features/messaging/WhatsAppMessaging.tsx` | MODIFY — Listen for cross-tab storage events and refresh messages |

**Validation:**
- [ ] Tab A (mentor): Send message
- [ ] Tab B (student): Message appears within 2s without manual refresh
- [ ] Vice versa: Student sends, mentor sees

---

### PHASE 2: CORE SYNC FIXES (Days 2-3 · 16 hours)

Fix all data synchronization between mentor and student dashboards.

---

#### Phase 2.1: Fix Task Sync (4 hours)
*From Plan 1 Task 2.1 + Plan 2 finding C7*

| File | Change |
|------|--------|
| `src/hooks/useTasks.ts` | MODIFY — Add mutation invalidation + real-time subscription |
| `src/features/student/StudentTasks.tsx` | MODIFY — Add real-time subscription |
| `src/features/mentor/hooks/useFeedback.ts` | MODIFY — Add mutation success callbacks |
| `src/services/taskService.ts` | MODIFY — Standardize on this service (see Phase 2.3) |

**Validation:**
- [ ] Mentor creates task → Student sees within 2s
- [ ] Student completes task → Mentor sees completion within 2s
- [ ] Task persists after refresh on both sides

---

#### Phase 2.2: Fix Goal Sync (4 hours)
*From Plan 1 Task 2.2 + Plan 2 finding C8*

| File | Change |
|------|--------|
| `src/hooks/useGoals.ts` | MODIFY — Add mutation invalidation + real-time subscription |
| `src/features/student/StudentGoals.tsx` | MODIFY — Add real-time subscription |
| `src/features/mentor/hooks/useMentees.ts` | MODIFY — Add goal mutation with invalidation |

**Validation:**
- [ ] Mentor updates goal title → Student sees new title within 2s
- [ ] Student creates goal → Mentor sees in student detail view within 2s
- [ ] Goal progress updates sync both ways

---

#### Phase 2.3: Eliminate Dual Task Service (4 hours)
*NEW — From Plan 2 finding C2*

**Root Cause:** `taskStorage.ts` (pure localStorage) and `taskService.ts` (Supabase + localStorage) exist in parallel. `useTasks` uses `taskStorage`, but some mentor code uses `taskService`. Data written through one path is invisible to the other.

**Approach:** Consolidate onto `taskService.ts` (Supabase-first with localStorage fallback) and update all imports.

| File | Change |
|------|--------|
| `src/hooks/useTasks.ts` | MODIFY — Switch from `taskStorage` to `taskService` |
| `src/services/taskStorage.ts` | DEPRECATE — Add deprecation notice, keep for backward compat |
| `src/features/mentor/hooks/useDashboard.ts` | MODIFY — Ensure uses `taskService` |
| `src/features/student/StudentTasks.tsx` | MODIFY — Ensure uses updated `useTasks` |
| `src/features/admin/shared/TaskActivityForm.tsx` | MODIFY — Ensure uses `taskService` |

**Validation:**
- [ ] Mentor creates task → stored in both localStorage + Supabase
- [ ] Student sees task in all views
- [ ] Old task data (from `taskStorage`) still accessible
- [ ] No duplicate data or writes

---

#### Phase 2.4: Convert Direct Reads to React Query (4 hours)
*NEW — From Plan 2 findings H3, H6*

**Root Cause:** Analytics tab, revenue tab, and student dropdown read directly from localStorage instead of using React Query hooks. Data goes stale and doesn't auto-refresh.

| File | Change |
|------|--------|
| `src/hooks/useTransactions.ts` | CREATE — React Query hook for transactions |
| `src/hooks/useStudentList.ts` | CREATE — React Query hook for student list |
| `MentorDashboard.tsx` (analytics section) | MODIFY — Use `useTransactions` instead of direct read |
| `MentorDashboard.tsx` (session form) | MODIFY — Use `useStudentList` instead of direct read |

**Validation:**
- [ ] New transaction appears in analytics within 5s without refresh
- [ ] Newly approved student appears in session dropdown immediately
- [ ] Chart data updates automatically

---

### PHASE 3: FEATURE COMPLETION (Days 3-5 · 24 hours)

Fix all broken or incomplete features.

---

#### Phase 3.1: Fix Messaging System (6 hours)
*From Plan 1 Task 3.1 + Plan 2 findings C9, M9*

| File | Change |
|------|--------|
| `src/services/messageService.ts` | MODIFY — Ensure Supabase persistence + StorageEvent for cross-tab |
| `src/hooks/useMessaging.ts` | CREATE — React Query hook for messaging |
| `src/features/messaging/WhatsAppMessaging.tsx` | MODIFY — Use `useMessaging`, fix empty states, cross-tab sync |
| `src/features/messaging/ConversationList.tsx` | MODIFY — Add "no results" empty state |

**Validation:**
- [ ] Messages persist after refresh
- [ ] Messages sync cross-tab within 2s
- [ ] Search shows "No results found" for non-matching queries
- [ ] Sender name appears correctly on both sides

---

#### Phase 3.2: Fix Events + RSVP (4 hours)
*From Plan 1 Task 3.2 + Plan 2 findings C10, H4, M2, M7*

| File | Change |
|------|--------|
| `src/services/eventRsvpService.ts` | CREATE — RSVP service with upsert |
| `src/hooks/useEventRsvp.ts` | CREATE — React Query hook for RSVP |
| `src/services/eventService.ts` | MODIFY — Add duplicate check in localStorage path |
| `src/features/admin/EventManagement.tsx` | MODIFY — Use `useEventRsvp`, add unregister |
| `UserDashboard.tsx` (events section) | MODIFY — Optimistic UI after registration |
| Supabase migration | MODIFY — Add DELETE policy on `event_registrations` |

**Validation:**
- [ ] RSVP persists after refresh
- [ ] Student can change/unregister RSVP
- [ ] Duplicate registration prevented in both modes
- [ ] Mentor sees updated attendee count without refresh

---

#### Phase 3.3: Fix Sessions + Bookings (2 hours)
*From Plan 2 findings M3, H5*

| File | Change |
|------|--------|
| `src/services/bookingService.ts` | MODIFY — Add `deleteBooking` function |
| Supabase migration | MODIFY — Add DELETE policy on `bookings` |
| `UserDashboard.tsx` (sessions tab) | MODIFY — Add cancel/unregister button |

**Validation:**
- [ ] Student can cancel booking
- [ ] Mentor sees cancellation
- [ ] Session list loads correctly for newly created students (after Phase 1.3)

---

#### Phase 3.4: Fix Analytics (2 hours)
*From Plan 2 H3 (covered in Phase 2.4)*

Fully addressed by Phase 2.4 — converting to React Query hooks.

---

#### Phase 3.5: Fix Growth Audit Visibility (3 hours)
*NEW — From Plan 2 finding C3*

| File | Change |
|------|--------|
| `src/services/growthAuditService.ts` | CREATE — Service layer for growth audits |
| `src/hooks/useGrowthAudits.ts` | CREATE — React Query hook |
| `src/features/growthAudit/GrowthAuditForm.tsx` | MODIFY — Use service instead of direct localStorage |
| `MentorDashboard.tsx` | MODIFY — Add "Growth Audits" tab/section with student selector |
| `src/features/mentor/components/StudentGrowthAuditView.tsx` | CREATE — Display component for mentor |

**Validation:**
- [ ] Student submits growth audit
- [ ] Mentor sees audit results in dedicated view
- [ ] Data persists after refresh
- [ ] `database-sync` event fires properly

---

#### Phase 3.6: Fix Custom Forms for Students (3 hours)
*NEW — From Plan 2 finding C4*

| File | Change |
|------|--------|
| `UserDashboard.tsx` | MODIFY — Add "Forms" tab |
| `src/features/student/StudentForms.tsx` | CREATE — Form fill component |
| `src/features/student/StudentFormResponse.tsx` | CREATE — View/Edit response component |
| Supabase migration | MODIFY — Add UPDATE policy on `form_responses` |

**Validation:**
- [ ] Student sees assigned forms
- [ ] Student can fill and submit
- [ ] Student can edit submitted response
- [ ] Mentor sees response in forms tab

---

#### Phase 3.7: Fix Credential Delivery (2 hours)
*NEW — From Plan 2 finding C5*

| File | Change |
|------|--------|
| `MentorDashboard.tsx` (applications tab) | MODIFY — Show generated credentials in application detail view, add "Copy Credentials" button |
| `src/services/applicationService.ts` | MODIFY — Store generated credentials more prominently |

**Validation:**
- [ ] When mentor approves application, credentials visible in UI
- [ ] Mentor can copy credentials
- [ ] Mentor can re-view credentials later (not just toast)

---

#### Phase 3.8: Fix Program Progress Visibility (3 hours)
*NEW — From Plan 2 finding C6*

| File | Change |
|------|--------|
| `MentorDashboard.tsx` | MODIFY — Add "Program Progress" tab/section |
| `src/features/mentor/components/StudentProgramProgress.tsx` | CREATE — View showing student's completed lessons, quiz scores, last accessed |
| `src/services/studentProgressService.ts` | MODIFY — Add method to get progress by student for mentor view |

**Validation:**
- [ ] Mentor selects a student → sees their program progress
- [ ] Shows: completed lessons count, quiz scores, last accessed date
- [ ] Progress updates when student completes new content

---

#### Phase 3.9: Fix File Upload Fallback (2 hours)
*NEW — From Plan 2 finding H2*

| File | Change |
|------|--------|
| `src/services/storageService.ts` | MODIFY — Add localStorage fallback (store as base64 data URL) |

**Validation:**
- [ ] With Supabase: file uploads to storage bucket
- [ ] Without Supabase: file stored as base64 in localStorage
- [ ] File renders in both modes
- [ ] 25MB size limit enforced in both modes

---

#### Phase 3.10: Fix Video Playback (1 hour)
*NEW — From Plan 2 finding H7*

| File | Change |
|------|--------|
| `src/services/curriculumService.ts` | MODIFY — Add validation that HLS URLs are reachable, provide fallback message |

**Validation:**
- [ ] If HLS URL is invalid, show user-friendly message
- [ ] Video player doesn't crash
- [ ] Progress tracking still works even if video fails

---

#### Phase 3.11: Fix Profile Data Split (2 hours)
*NEW — From Plan 2 finding H9*

| File | Change |
|------|--------|
| `src/services/profileService.ts` | MODIFY — Sync Supabase and localStorage on profile update + load |

**Validation:**
- [ ] Profile update saves to both Supabase and localStorage
- [ ] On load, Supabase data takes precedence if available
- [ ] No data loss on mode switch

---

#### Phase 3.12: Auto-Notifications (3 hours)
*NEW — From Plan 2 finding M1*

| File | Change |
|------|--------|
| `src/services/notificationService.ts` | MODIFY — Add helper functions for common notification types |
| `src/services/sessionService.ts` | MODIFY — Dispatch notification on session creation |
| `src/services/taskService.ts` | MODIFY — Dispatch notification on task assignment |
| `src/services/eventService.ts` | MODIFY — Dispatch notification on event registration |

**Validation:**
- [ ] Session created → student gets notification
- [ ] Task assigned → student gets notification
- [ ] Event reminder → student gets notification

---

#### Phase 3.13: Fix Bookings (1 hour)
*Covered in Phase 3.3*

---

#### Phase 3.14: Fix Voice Messages (2 hours)
*NEW — From Plan 2 finding M4*

| File | Change |
|------|--------|
| `src/services/storageService.ts` | MODIFY — Add `uploadVoiceMessage` method |
| `src/features/messaging/ComposeBar.tsx` | MODIFY — Upload actual recording to storage, use real URL |
| `src/features/messaging/VoiceMessagePlayer.tsx` | MODIFY — Handle real audio URLs with fallback |

**Validation:**
- [ ] Voice recording captures real audio
- [ ] Audio uploads to Supabase Storage
- [ ] Recipient can play back the recording
- [ ] Falls back gracefully if mic unavailable

---

#### Phase 3.15: Fix AI Insights (2 hours)
*NEW — From Plan 2 finding M5*

| File | Change |
|------|--------|
| `src/services/geminiService.ts` | MODIFY — Replace stub with actual Gemini API call |
| `src/hooks/useAIAssistant.ts` | MODIFY — Ensure proper error handling and loading states |

**Validation:**
- [ ] AI Insights returns real responses
- [ ] Loading state shown during API call
- [ ] Error state shown on failure

---

#### Phase 3.16: Student Edit for Forms + Feedback (2 hours)
*NEW — From Plan 2 finding M8*

| File | Change |
|------|--------|
| Supabase migration | MODIFY — Add UPDATE policy on `form_responses` and `event_feedback` |
| `UserDashboard.tsx` (events) | MODIFY — Allow editing submitted feedback |
| `src/features/student/StudentFormResponse.tsx` | MODIFY — Allow editing submitted form |

**Validation:**
- [ ] Student can edit event feedback
- [ ] Student can edit form responses
- [ ] Mentor sees updated values

---

### PHASE 4: CLEANUP & CONFIG (Day 5 · 8 hours)

Fix configuration issues, technical debt, and edge cases.

---

#### Phase 4.1: Seed Auth Users in Supabase (2 hours)

| File | Change |
|------|--------|
| `supabase/seed/seed.sql` | MODIFY — Add `auth.users` inserts with proper UUIDs matching profiles |

---

#### Phase 4.2: Configure Environment Variables (1 hour)

| File | Change |
|------|--------|
| `.env.local` | MODIFY — Add real Sentry DSN, PostHog key, Supabase service role key |

---

#### Phase 4.3: Deprecate Store Tab (1 hour)

| File | Change |
|------|--------|
| `MentorDashboard.tsx` | MODIFY — Remove "Store" tab or add `HIDE_STORE` env flag |

---

#### Phase 4.4: Consolidate Edge Function Directories (1 hour)

| File | Change |
|------|--------|
| `edge-functions/` | DELETE — Move any unique content to `supabase/functions/` |

---

#### Phase 4.5: Guard Realtime in localStorage Mode (1 hour)

| File | Change |
|------|--------|
| `src/hooks/useRealtime.ts` | MODIFY — Check `isSupabaseAvailable()` before subscribing |

---

#### Phase 4.6: Targeted Cache Invalidation (1 hour)

| File | Change |
|------|--------|
| `src/hooks/useDatabaseSync.ts` | MODIFY — Accept specific query keys to invalidate instead of all |

---

#### Phase 4.7: Delete Stale localStorage on Version Bump (1 hour)

| File | Change |
|------|--------|
| `src/utils/seedData.ts` | MODIFY — Add migration logic to transform old ID formats to new ones |

---

## 4. File Change Summary

### Files to CREATE (12)

| # | File | Phase |
|---|------|-------|
| 1 | `edge-functions/middleware/auth.ts` | 1.1 |
| 2 | `src/hooks/useRealtimeData.ts` | 1.2 |
| 3 | `src/hooks/useMessaging.ts` | 3.1 |
| 4 | `src/services/eventRsvpService.ts` | 3.2 |
| 5 | `src/hooks/useEventRsvp.ts` | 3.2 |
| 6 | `src/hooks/useTransactions.ts` | 2.4 |
| 7 | `src/hooks/useStudentList.ts` | 2.4 |
| 8 | `src/services/growthAuditService.ts` | 3.5 |
| 9 | `src/hooks/useGrowthAudits.ts` | 3.5 |
| 10 | `src/features/mentor/components/StudentGrowthAuditView.tsx` | 3.5 |
| 11 | `src/features/student/StudentForms.tsx` | 3.6 |
| 12 | `src/features/mentor/components/StudentProgramProgress.tsx` | 3.8 |

### Files to MODIFY (45+)

| Area | Files | Phase |
|------|-------|-------|
| Edge functions | `gemini/index.ts`, `meet/index.ts`, `calendar/index.ts` | 1.1 |
| Data hooks | `useApplications`, `useBookings`, `useEvents`, `useGoals`, `useJournals`, `useSessions`, `useTasks`, `usePrograms` | 1.2 |
| Storage services | `goalStorage.ts`, `taskStorage.ts`, `journalStorage.ts`, `sessionService.ts`, `studentProgressService.ts`, `bookingService.ts` | 1.3 |
| Seed data | `seedData.ts` | 1.3 |
| Application service | `applicationService.ts` | 1.3 |
| Student service | `studentService.ts` | 1.3 |
| DB sync hook | `useDatabaseSync.ts` | 1.4 |
| Messaging | `WhatsAppMessaging.tsx`, `messageService.ts`, `ConversationList.tsx` | 1.4, 3.1 |
| Task service | `taskService.ts`, `taskStorage.ts`, `useTasks.ts`, `StudentTasks.tsx`, `useFeedback.ts`, `TaskActivityForm.tsx` | 2.3 |
| Dashboard | `MentorDashboard.tsx` | 2.4, 3.5, 3.7, 3.8 |
| Events | `EventManagement.tsx`, `eventService.ts`, `UserDashboard.tsx` (events) | 3.2 |
| Bookings | `bookingService.ts` | 3.3 |
| Growth audit | `GrowthAuditForm.tsx` | 3.5 |
| Custom forms | `UserDashboard.tsx` (add tab) | 3.6 |
| File uploads | `storageService.ts` | 3.9 |
| Curriculum | `curriculumService.ts` | 3.10 |
| Profile | `profileService.ts` | 3.11 |
| Notifications | `notificationService.ts`, `sessionService.ts`, `taskService.ts`, `eventService.ts` | 3.12 |
| Voice messages | `ComposeBar.tsx`, `VoiceMessagePlayer.tsx` | 3.14 |
| AI Insights | `geminiService.ts`, `useAIAssistant.ts` | 3.15 |
| Supabase | `seed.sql`, migration files | 4.1 |
| Config | `.env.local` | 4.2 |
| Directory cleanup | Delete `edge-functions/` | 4.4 |
| Realtime | `useRealtime.ts` | 4.5 |

---

## 5. Cross-Dashboard Sync Requirements

Every feature pair must pass this checklist:

```
Feature                    Mentor Action ➔ Student Sees    Student Action ➔ Mentor Sees
─────────────────────────────────────────────────────────────────────────────────────
Sessions                   ✅ Create session                ✅ Attend & mark status
Tasks                      ✅ Assign task                   ✅ Complete task
Goals                      ✅ View & update                 ✅ Create & update
Journals                   ✅ View                          ✅ Create entries
Messages                   ✅ Send                          ✅ Reply
Events                     ✅ Create & manage               ✅ Register & RSVP
Programs                   ✅ View curriculum               ✅ Take lessons & quizzes
Resources                  ✅ Add resources                 ✅ View resources
Growth Audit               ✅ View results (NEW)            ✅ Submit audit (FIXED)
Custom Forms               ✅ Create forms                  ✅ Fill forms (NEW)
Notifications              N/A (system auto)                ✅ Receive (FIXED)
Bookings                   ✅ View & confirm                ✅ Create & cancel
Gallery                    ✅ Manage photos                 ✅ View gallery
```

**After all phases complete, every cell in the above matrix must be ✅.**

---

## 6. Testing Protocol

### Per-Phase Validation

Every phase must pass these checks before moving to the next:

```
1. TypeScript compilation: npx tsc --noEmit → 0 errors
2. Vite dev server starts:   npm run dev → no errors
3. Feature works in browser: manual test per spec
4. Data persists after:      page refresh
5. Cross-tab sync works:     open in 2 tabs, verify both update
```

### Complete Regression Test (End of Phase 4)

| Test | Steps | Expected |
|------|-------|----------|
| T1 — Student Approval | Mentor approves application → New student can log in → Student sees empty dashboard (not error) | ✅ |
| T2 — Task Assignment | Mentor assigns task → Student sees in tasks tab → Student completes → Mentor sees completion | ✅ |
| T3 — Goal Tracking | Student creates goal → Mentor sees → Mentor updates → Student sees update | ✅ |
| T4 — Messaging | Mentor sends message → Student receives in same tab → Student receives in different tab | ✅ |
| T5 — Event RSVP | Student registers → Status shows "Attending" → Refresh → Still "Attending" → Unregister → Works | ✅ |
| T6 — Growth Audit | Student submits audit → Mentor sees in dedicated view → Data persists | ✅ |
| T7 — Custom Form | Mentor creates form → Student sees form tab → Student fills → Mentor sees response | ✅ |
| T8 — Program Progress | Student completes lesson → Quiz score recorded → Mentor sees progress | ✅ |
| T9 — File Upload | Mentor uploads event image → Shows in gallery → With Supabase → Without Supabase | ✅ |
| T10 — Sessions | Mentor schedules session → Student sees in calendar → Student attends → Mentor marks attendance | ✅ |
| T11 — Bookings | Student books slot → Mentor sees booking → Student cancels → Mentor sees cancellation | ✅ |
| T12 — Notifications | Mentor assigns task → Student gets notification → Student marks read | ✅ |
| T13 — Real-Time | Open mentor in Tab A, student in Tab B → Make change in Tab A → Tab B updates within 2s | ✅ |
| T14 — Voice Message | Student records voice → Sends → Mentor plays recording → Audio is real (not simulated) | ✅ |

---

## 7. Daily Schedule

### Day 1 (8 hours)
```
08:00-12:00  Phase 1.1 — Secure edge functions (4h)
12:00-13:00  Lunch
13:00-15:00  Phase 1.2 — Create useRealtimeData + start hooks (2h)
15:00-17:00  Phase 1.2 — Finish hooks + mutation callbacks (2h)
```
**Deliverable:** Edge functions secured, real-time infra ready

### Day 2 (8 hours)
```
08:00-12:00  Phase 1.3 — ID normalization (4h)
12:00-13:00  Lunch
13:00-15:00  Phase 1.3 — Continue ID normalization (2h)
15:00-17:00  Phase 1.4 — Cross-tab messaging sync (2h)
```
**Deliverable:** ID formats unified, cross-tab messaging working

### Day 3 (8 hours)
```
08:00-10:00  Phase 2.1 — Fix task sync (2h)
10:00-12:00  Phase 2.2 — Fix goal sync (2h)
12:00-13:00  Lunch
13:00-15:00  Phase 2.3 — Eliminate dual task service (2h)
15:00-17:00  Phase 2.4 — Convert direct reads to React Query (2h)
```
**Deliverable:** All core sync working between dashboards

### Day 4 (8 hours)
```
08:00-10:00  Phase 3.1 — Fix messaging system (2h)
10:00-12:00  Phase 3.2 — Fix events + RSVP (2h)
12:00-13:00  Lunch
13:00-15:00  Phase 3.3 — Fix sessions + bookings (1h)
             Phase 3.5 — Fix growth audit visibility (1h)
15:00-17:00  Phase 3.6 — Fix custom forms for students (2h)
```
**Deliverable:** 4 broken features restored

### Day 5 (8 hours)
```
08:00-10:00  Phase 3.7 — Credential delivery + Phase 3.8 — Progress visibility (2h)
10:00-12:00  Phase 3.9 — File upload fallback + Phase 3.10 — Video playback (2h)
12:00-13:00  Lunch
13:00-15:00  Phase 3.11-3.16 — Profile, notifications, voice, AI insights (2h)
15:00-17:00  Phase 4.1-4.7 — Cleanup tasks (2h)
```
**Deliverable:** All 24 features working, config cleanup done

---

## 8. Success Criteria

### Phase 1 Complete
- [ ] 3 edge functions secured with JWT auth
- [ ] Real-time subscriptions active on 8 data tables
- [ ] ID format unified — new and old students both work
- [ ] Cross-tab messaging sync works (2s delay max)

### Phase 2 Complete
- [ ] Tasks sync mentor ↔ student in real-time
- [ ] Goals sync mentor ↔ student in real-time
- [ ] Single task service (no duplicate)
- [ ] All dashboard reads go through React Query

### Phase 3 Complete
- [ ] Messages persist, sync cross-tab
- [ ] Event RSVP persists, allows unregister
- [ ] Sessions + bookings fully CRUD
- [ ] Growth audits visible to mentor
- [ ] Custom forms fillable by students
- [ ] Credentials delivered reliably
- [ ] Program progress visible to mentor
- [ ] File uploads work in both modes
- [ ] Voice messages are real recordings
- [ ] AI Insights returns real responses

### Phase 4 Complete
- [ ] Supabase seed fully working (auth + profiles)
- [ ] Environment variables configured
- [ ] No duplicate directories
- [ ] Realtime guarded for localStorage mode
- [ ] Targeted cache invalidation
- [ ] All TypeScript errors resolved

### Final Gate
- [ ] All 14 regression tests pass (T1-T14)
- [ ] All 24 features working in both localStorage and Supabase modes
- [ ] Cross-dashboard sync matrix: 100% ✅
- [ ] `npx tsc --noEmit` — zero errors
- [ ] `npm run dev` — zero warnings
- [ ] Production build succeeds

---

## Quick Reference

### Key Commands
```bash
npm run dev              # Start Vite dev server
npx tsc --noEmit         # TypeScript type check
npm run build            # Production build
supabase functions serve # Local edge function testing
```

### Merge Conflict Resolution Order
Since all phases touch different files, conflicts should be minimal:
- Phase 1.1: `edge-functions/` only
- Phase 1.2: `src/hooks/` only
- Phase 1.3: `src/services/` + `seedData.ts`
- Phase 1.4: `WhatsAppMessaging.tsx` + `messageService.ts`
- Phase 2.1-2.4: `src/features/` + `src/hooks/`
- Phase 3.1-3.16: Various, mostly independent files
- Phase 4.1-4.7: Config + cleanup

### Commit Message Convention
```
[Phase X.Y] Description

- Bullet list of changes
- Reference issues fixed
```

---

**Status:** Ready to implement  
**Estimated Total Time:** 60-70 hours (5 days, 1 developer)  
**Overall Priority:** 🔴 PRODUCTION BLOCKER  

**This COMBO merges all 52 findings from Plan 1 (implementation tasks) and Plan 2 (deep audit) into a single unified roadmap.**
