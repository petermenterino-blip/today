# Notification Testing Specification

| Document ID | QA-NOT-009 |
|---|---|
| Document Title | Notification Testing Specification |
| Version | 1.0 |
| Status | Draft |
| Author | QA Team |
| Date | 2026-07-08 |

---

## Revision History

| Version | Date | Author | Description |
|---------|------|--------|-------------|
| 1.0 | 2026-07-08 | QA Team | Initial release — customized for DB-stored in-app notifications |

---

## 1. Introduction

Mentorino uses **database-stored in-app notifications** only. Notifications are stored in the `notifications` table and delivered to users via:

1. **TanStack Query** — `useNotifications` hook fetches notifications from Supabase
2. **Supabase Realtime** — `useRealtime` hook subscribes to `postgres_changes` on `notifications` table for live updates
3. **NotificationDropdown** — UI component displaying recent notifications with unread count

There are **no push notifications**, **no service workers**, and **no cross-device sync**.

### Notification Types

| Type | Trigger | Channel |
|------|---------|---------|
| Session Reminder | Scheduled (24h before session) | In-app + Email |
| Task Due | Task assigned/updated | In-app |
| Task Submitted | Student submits task | In-app (mentor) |
| Message Received | New message in conversation | In-app (via Messaging, not notification table) |
| System Announcement | Admin creates announcement | In-app |
| Application Status | Application approved/rejected | In-app + Email |
| Session Scheduled | Mentor creates session | In-app |
| Goal Milestone | Student reaches goal percentage | In-app |

---

## 2. Architecture

```
Notification Flow:
  1. Trigger event occurs (e.g., session reminder cron)
  2. Supabase RPC insert_notification() called
  3. Row inserted in notifications table
  4. Realtime subscription fires postgres_changes event
  5. useRealtime hook receives event, debouncedInvalidate (2s)
  6. TanStack Query refetches notifications
  7. NotificationDropdown updates UI: badge count, new notification
```

### Tables

| Table | Key Columns |
|-------|------------|
| `notifications` | id, user_id, title, message, read (boolean), type, created_at |
| RPC | `insert_notification(p_user_id, p_title, p_message)` |

---

## 3. Test Cases

### Module 3.1: Notification CRUD

#### NOT-TC-001: Create Notification via RPC

| Field | Value |
|-------|-------|
| **Test ID** | NOT-TC-001 |
| **Module** | Notification CRUD |
| **Feature** | Create Notification |
| **Priority** | High |
| **Severity** | Major |
| **Test Type** | Functional / Integration |
| **Test Data** | User ID, title: "Test Notification", message: "This is a test" |
| **Preconditions** | Authenticated user |

**Objective**: Verify notification is created via RPC call.

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Call `supabase.rpc('insert_notification', {p_user_id: student1Id, p_title: "Test", p_message: "Test message"})` | RPC executes without error |
| 2 | Query `notifications` table | New row exists with correct data, read = false |
| 3 | Verify notification appears in dropdown | Student sees new notification in `NotificationDropdown` |

---

#### NOT-TC-002: Mark Notification as Read

| Field | Value |
|-------|-------|
| **Test ID** | NOT-TC-002 |
| **Module** | Notification CRUD |
| **Feature** | Mark Read |
| **Priority** | High |
| **Severity** | Major |
| **Test Type** | Functional |
| **Test Data** | Existing unread notification ID |
| **Preconditions** | User has unread notifications |

**Objective**: Verify user can mark a notification as read.

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Open notification dropdown | List shows notifications, unread ones highlighted |
| 2 | Click on an unread notification | Notification marked as read via `supabase.from('notifications').update({read: true}).eq('id', notifId)` |
| 3 | Verify UI update | Notification no longer shows as unread |
| 4 | Verify badge count decreases | Unread count decreases by 1 |

**Validation**:
- **Supabase**: `notifications` table row has `read = true`
- **UI**: Notification style changes (no bold/highlight), badge count updates

---

#### NOT-TC-003: Mark All Notifications as Read

| Field | Value |
|-------|-------|
| **Test ID** | NOT-TC-003 |
| **Module** | Notification CRUD |
| **Feature** | Mark All Read |
| **Priority** | Medium |
| **Severity** | Major |
| **Test Type** | Functional |
| **Test Data** | Multiple unread notifications |
| **Preconditions** | User has unread notifications |

**Objective**: Verify "Mark All as Read" functionality.

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Open notification dropdown | Multiple unread notifications visible |
| 2 | Click "Mark all as read" | `supabase.from('notifications').update({read: true}).eq('user_id', userId)` |
| 3 | Verify all marked | All notifications show as read |
| 4 | Verify badge | Badge count becomes 0 |

---

#### NOT-TC-004: Empty Notification State

| Field | Value |
|-------|-------|
| **Test ID** | NOT-TC-004 |
| **Module** | Notification CRUD |
| **Feature** | Empty State |
| **Priority** | Low |
| **Severity** | Minor |
| **Test Type** | UI |
| **Test Data** | User with no notifications |
| **Preconditions** | User logged in, no notifications in DB |

**Objective**: Verify notification dropdown shows empty state.

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Open notification dropdown | "No notifications" or equivalent empty state message |
| 2 | Verify no badge | No unread badge on notification icon |

---

### Module 3.2: Real-time Notifications

#### NOT-TC-005: Real-time Notification Reception

| Field | Value |
|-------|-------|
| **Test ID** | NOT-TC-005 |
| **Module** | Real-time |
| **Feature** | Live Notification |
| **Priority** | High |
| **Severity** | Major |
| **Test Type** | Integration / Realtime |
| **Test Data** | New notification inserted while user is on page |
| **Preconditions** | User logged in, notification dropdown open |

**Objective**: Verify notification appears in real-time via Realtime subscription.

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Have a new notification inserted (via RPC or DB insert) | `useRealtime` hook receives `postgres_changes` event |
| 2 | Wait for debounce (2s) + refetch | Notification appears in dropdown |
| 3 | Verify badge count | Unread badge count increments |

---

### Module 3.3: Notification Dropdown UI

#### NOT-TC-006: Notification Dropdown Interaction

| Field | Value |
|-------|-------|
| **Test ID** | NOT-TC-006 |
| **Module** | UI |
| **Feature** | Notification Dropdown |
| **Priority** | High |
| **Severity** | Major |
| **Test Type** | UI / Functional |
| **Test Data** | User with mixed read/unread notifications |
| **Preconditions** | User logged in |

**Objective**: Verify notification dropdown renders and behaves correctly.

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Click notification icon (bell) | Dropdown opens |
| 2 | Observe notification list | Notifications rendered with title, message, timestamp, read/unread styling |
| 3 | Click outside dropdown | Dropdown closes |
| 4 | Click notification icon again | Dropdown opens with refreshed data |

---

### Module 3.4: Notification Triggers

#### NOT-TC-007: Session Reminder Notification

| Field | Value |
|-------|-------|
| **Test ID** | NOT-TC-007 |
| **Module** | Triggers |
| **Feature** | Session Reminder |
| **Priority** | Medium |
| **Severity** | Major |
| **Test Type** | Functional |
| **Test Data** | Upcoming session |
| **Preconditions** | Session scheduled within 24 hours |

**Objective**: Verify session reminder notification is created.

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Ensure a session exists within 24 hours | (Test depends on cron/scheduled function) |
| 2 | Check notifications | Notification created: "Session Reminder: [session title] at [time]" |

---

#### NOT-TC-008: Task Due Notification

| Field | Value |
|-------|-------|
| **Test ID** | NOT-TC-008 |
| **Module** | Triggers |
| **Feature** | Task Due |
| **Priority** | Medium |
| **Severity** | Major |
| **Test Type** | Functional |
| **Test Data** | Task with approaching due date |
| **Preconditions** | Task assigned, due date near |

**Objective**: Verify task due notification appears.

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Mentor assigns task with near-term due date | Task created |
| 2 | Student checks notifications | Notification: "Task due: [task title]" |
| 3 | Student submits task | Notification updated or new notification for mentor: "[Student] submitted [task]" |

---

## 4. Automation Mapping

| Test Cases | Tool | Status |
|-----------|------|--------|
| NOT-TC-001 | Vitest (RPC call) | ❌ Missing |
| NOT-TC-002, NOT-TC-003 | Playwright (dropdown interaction) | ❌ Missing |
| NOT-TC-004 | Playwright (UI) | ❌ Missing |
| NOT-TC-005 | Playwright (realtime) | ⚠️ Skipped (realtime.spec.ts) |
| NOT-TC-006 | Playwright (UI interaction) | ❌ Missing |
| NOT-TC-007, NOT-TC-008 | Manual (cron-dependent) | ❌ Missing |
