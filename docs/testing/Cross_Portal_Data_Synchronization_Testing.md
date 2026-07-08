# Cross-Portal Data Synchronization Testing

| Document ID | QA-SYNC-005 |
|---|---|
| Document Title | Cross-Portal Data Synchronization Testing |
| Version | 2.0 |
| Status | Draft |
| Author | QA Team |
| Date | 2026-07-08 |

---

## Revision History

| Version | Date | Author | Description |
|---------|------|--------|-------------|
| 1.0 | 2026-06-15 | QA Team | Initial draft |
| 2.0 | 2026-07-08 | QA Team | Customized for TanStack Query + Supabase Realtime architecture |

---

## 1. Introduction

This document specifies cross-portal data synchronization testing. Mentorino does **not** have instant real-time push across portals. Instead, it uses:

1. **TanStack Query** — automatic cache invalidation and refetching after mutations
2. **Supabase Realtime** — `useRealtime` hook subscribes to `postgres_changes` events with **2-second debounced invalidation** (`debouncedInvalidate`)
3. **Cross-tab sync** — localStorage events for some state sharing

This means data created/modified in one portal is reflected in the other after a **2-3 second delay** (debounce + refetch time).

---

## 2. Architecture

```
Student Portal                          Mentor Portal
    │                                       │
    ├── Mutation (create goal)              │
    │   └── supabase.from('goals').insert() │
    │       └── TanStack Query invalidate   │
    │           └── ['goals'] refetched     │
    │                                       │
    │                                       ├── Realtime subscription
    │                                       │   └── postgres_changes on 'goals'
    │                                       │       └── debouncedInvalidate (2s)
    │                                       │           └── ['goals'] refetched
    │                                       │
    │                                       ├── Or manual navigation refetch
    │                                       │   (staleTime exceeded)
```

### Key Constants

| Parameter | Value | Source |
|-----------|-------|--------|
| Realtime debounce | 2 seconds | `useRealtime` hook |
| TanStack Query stale times | Configurable per query | `constants/queryKeys.ts` |
| Auto-refetch on window focus | Disabled | Playwright config |
| localStorage cross-tab events | `message_sync_ts` | Custom events |

---

## 3. Synchronization Scenarios

| Scenario | Source Portal | Target Portal | Expected Delay |
|----------|-------------|---------------|---------------|
| Mentor creates task | Mentor | Student | ~3s (2s debounce + refetch) |
| Student submits journal | Student | Mentor | ~3s |
| Mentor sends message | Mentor | Student | ~3s (or optimistic) |
| Student sends message | Student | Mentor | ~3s (or optimistic) |
| Mentor updates session | Mentor | Student | ~3s |
| Student completes goal | Student | Mentor | ~3s |
| Mentor approves application | Mentor (Edge Function) | Student | ~3s (after creation) |
| Mentor assigns resource | Mentor | Student | ~3s |
| Mentor creates event | Mentor | Student | ~3s |
| Student registers for event | Student | Mentor | ~3s |

---

## 4. Test Cases

---

#### SYNC-TC-001: Mentor Creates Task → Student Sees It

| Field | Value |
|-------|-------|
| **Test ID** | SYNC-TC-001 |
| **Module** | Cross-Portal Sync |
| **Feature** | Task Creation Sync |
| **Priority** | Critical |
| **Severity** | Critical |
| **Test Type** | Integration / Realtime |
| **Test Data** | Task assigned to Student1 by Mentor |
| **Preconditions** | Mentor and Student1 both have data, Student1 on tasks page |

**Objective**: Verify task created by mentor appears in student's task list.

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Login as mentor | Mentor dashboard |
| 2 | Create a new task assigned to Student1 | Task created via `taskStorage.create()` → `supabase.from('tasks').insert({student_id: student1.id, ...})` |
| 3 | Login as student1 (separate session) | Student portal |
| 4 | Navigate to `/#/student/tasks` | Tasks list loaded (may need refresh) |
| 5 | Verify new task visible | Within ~3 seconds, task appears in student's list |

**Validation**:
- **Supabase**: `tasks` table has new row with correct `student_id`
- **TanStack Query (Student)**: `['tasks']` query refetched after realtime invalidation
- **UI**: Task card visible with correct title, due date, status
- **Realtime**: `useRealtime` hook receives `postgres_changes` INSERT event on `tasks` table

**Automation**: `e2e/realtime.spec.ts` (currently skipped — needs unskipping)

---

#### SYNC-TC-002: Student Submits Journal → Mentor Sees It

| Field | Value |
|-------|-------|
| **Test ID** | SYNC-TC-002 |
| **Module** | Cross-Portal Sync |
| **Feature** | Journal Sync |
| **Priority** | High |
| **Severity** | Major |
| **Test Type** | Integration |
| **Test Data** | Student1 creates journal entry |
| **Preconditions** | Student1 and Mentor authenticated |

**Objective**: Verify journal entry created by student appears in mentor's view.

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Login as student1 | Student dashboard |
| 2 | Create a journal entry | Entry saved to `journals` table |
| 3 | Login as mentor | Mentor dashboard |
| 4 | Navigate to student detail or growth audit tab | New journal entry visible in student's journal feed |

---

#### SYNC-TC-003: Message Exchange Between Portals

| Field | Value |
|-------|-------|
| **Test ID** | SYNC-TC-003 |
| **Module** | Cross-Portal Sync |
| **Feature** | Message Sync |
| **Priority** | Critical |
| **Severity** | Critical |
| **Test Type** | Integration / Realtime |
| **Test Data** | Messages exchanged between mentor and Student1 |
| **Preconditions** | Both mentor and Student1 on messaging page |

**Objective**: Verify messages appear in both portals with minimal delay.

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Student1 sends message to mentor | Optimistic update shows message immediately on student side |
| 2 | Check mentor conversation | Within ~3s, message appears in mentor's conversation thread |
| 3 | Mentor replies | Optimistic update on mentor side |
| 4 | Check student conversation | Within ~3s, reply appears on student side |

**Validation**:
- **Supabase Realtime**: `messages` table `postgres_changes` INSERT event
- **TanStack Query**: Debounced invalidation at 2s, refetch
- **UI**: Messages appear in correct order, with correct sender

---

#### SYNC-TC-004: Session Schedule Sync

| Field | Value |
|-------|-------|
| **Test ID** | SYNC-TC-004 |
| **Module** | Cross-Portal Sync |
| **Feature** | Session Sync |
| **Priority** | High |
| **Severity** | Major |
| **Test Type** | Integration |
| **Test Data** | Mentor schedules session with Student1 |
| **Preconditions** | Mentor and Student1 authenticated |

**Objective**: Verify session scheduled by mentor appears in student's session list.

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Mentor schedules session with Student1 | Session inserted in `sessions` table |
| 2 | Student1 navigates to `/#/student/sessions` | New session visible within ~3s |

---

#### SYNC-TC-005: Goal Progress Sync

| Field | Value |
|-------|-------|
| **Test ID** | SYNC-TC-005 |
| **Module** | Cross-Portal Sync |
| **Feature** | Goal Sync |
| **Priority** | Medium |
| **Severity** | Major |
| **Test Type** | Integration |
| **Test Data** | Student1 updates goal progress |
| **Preconditions** | Student1 and Mentor authenticated |

**Objective**: Verify goal progress update by student is visible to mentor.

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Student1 updates goal progress % | Goal updated in `goals` table |
| 2 | Mentor navigates to mentee detail or overview | Updated goal progress visible |

---

#### SYNC-TC-006: Event RSVP Sync

| Field | Value |
|-------|-------|
| **Test ID** | SYNC-TC-006 |
| **Module** | Cross-Portal Sync |
| **Feature** | Event RSVP Sync |
| **Priority** | Medium |
| **Severity** | Major |
| **Test Type** | Integration |
| **Test Data** | Student1 RSVPs to mentor's event |
| **Preconditions** | Mentor created event, Student1 on event page |

**Objective**: Verify event RSVP by student is visible to mentor.

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Student1 RSVPs to an event | `event_attendees` table updated |
| 2 | Mentor navigates to event management | Attendee count/status updated |

---

#### SYNC-TC-007: Resource Completion Sync

| Field | Value |
|-------|-------|
| **Test ID** | SYNC-TC-007 |
| **Module** | Cross-Portal Sync |
| **Feature** | Resource Completion Sync |
| **Priority** | Low |
| **Severity** | Minor |
| **Test Type** | Integration |
| **Test Data** | Student1 marks resource as completed |
| **Preconditions** | Mentor assigned resource to Student1 |

**Objective**: Verify resource completion by student is visible to mentor.

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Student1 marks resource as completed | `resource_completions` table updated |
| 2 | Mentor views resource dashboard | Completion status updated |

---

#### SYNC-TC-008: Connection Context — Offline Handling

| Field | Value |
|-------|-------|
| **Test ID** | SYNC-TC-008 |
| **Module** | Cross-Portal Sync |
| **Feature** | Offline Behavior |
| **Priority** | Medium |
| **Severity** | Major |
| **Test Type** | Functional |
| **Test Data** | Connection state changes |
| **Preconditions** | User authenticated |

**Objective**: Verify application handles offline/online transitions gracefully.

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | User online | Normal operation, data fetches work |
| 2 | Simulate offline (disconnect network) | `ConnectionContext` detects offline, `OfflineBanner` shown |
| 3 | Attempt to create data | Mutation fails, error toast shown |
| 4 | Restore connection | `ConnectionContext` detects online, `OfflineBanner` hidden, queries refetch |
| 5 | Verify data sync | Any pending operations handled (or noted as lost) |

**Validation**:
- **ConnectionContext**: State transitions between `online` and `offline`
- **UI**: `OfflineBanner` component visible when offline, hidden when online
- **TanStack Query**: Failed mutations are tracked, queries refetch on reconnect

---

#### SYNC-TC-009: Idle Recovery — Session Revalidation

| Field | Value |
|-------|-------|
| **Test ID** | SYNC-TC-009 |
| **Module** | Cross-Portal Sync |
| **Feature** | Idle Recovery |
| **Priority** | Medium |
| **Severity** | Major |
| **Test Type** | Security / Functional |
| **Test Data** | User returns after idle period |
| **Preconditions** | User authenticated, then idle |

**Objective**: Verify idle recovery validates session after prolonged inactivity.

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Login and wait for idle timeout | `idleRecovery` module activates |
| 2 | Interact with page after idle period | Session validated via `supabase.auth.getSession()` |
| 3 | If session expired | Redirect to `/#/auth` |
| 4 | If session valid | Continue normally, no disruption |

---

#### SYNC-TC-010: Cross-Tab LocalStorage Sync

| Field | Value |
|-------|-------|
| **Test ID** | SYNC-TC-010 |
| **Module** | Cross-Portal Sync |
| **Feature** | Cross-Tab Sync |
| **Priority** | Low |
| **Severity** | Minor |
| **Test Type** | Functional |
| **Test Data** | Multiple tabs of same app |
| **Preconditions** | User authenticated, two browser tabs open |

**Objective**: Verify localStorage-based cross-tab synchronization.

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Open two tabs as student1 | Both tabs on dashboard |
| 2 | Tab 1: Create a new goal | Goal created, localStorage event fired |
| 3 | Tab 2: Wait | Tab 2 detects localStorage change, refetches data |

---

## 5. Automation Mapping

| Test Case | Playwright Spec | Current Status |
|-----------|----------------|----------------|
| SYNC-TC-001 to SYNC-TC-007 | `e2e/realtime.spec.ts` | ⚠️ ALL SKIPPED |
| SYNC-TC-008 | Not automated | ❌ Missing |
| SYNC-TC-009 | Not automated | ❌ Missing |
| SYNC-TC-010 | Not automated | ❌ Missing |

### Priority for Unskipping Realtime Tests

The `e2e/realtime.spec.ts` file contains tests for messaging sync that are **all skipped**. Unskipping these should be a priority to validate the core cross-portal sync mechanism.
