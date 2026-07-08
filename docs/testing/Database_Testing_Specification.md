# Database Testing Specification

| Document ID | QA-DB-006 |
|---|---|
| Document Title | Database Testing Specification |
| Version | 1.0 |
| Status | Draft |
| Author | QA Team |
| Date | 2026-07-08 |

---

## Revision History

| Version | Date | Author | Description |
|---------|------|--------|-------------|
| 1.0 | 2026-07-08 | QA Team | Initial release — customized for Supabase PostgreSQL schema |

---

## 1. Introduction

This document specifies database testing for Mentorino's Supabase PostgreSQL database. The database contains **42+ tables** in the `public` schema, **7 storage buckets**, **10 SQL functions**, and **3 triggers**. All data access is performed client-side via the Supabase JavaScript SDK with Row-Level Security (RLS) policies.

### Testing Approach

Since Mentorino has no backend API layer, database testing is performed via:

1. **Supabase client queries** — `supabase.from('table').select()` in Vitest/Playwright
2. **Direct SQL (via Supabase dashboard)** — for schema/constraint validation
3. **RLS policy testing** — via `e2e/student-isolation.spec.ts` and `e2e/security/cross-role.spec.ts`
4. **Existing test**: `src/__tests__/rls-isolation.test.ts`

---

## 2. Database Schema Overview

### 2.1 Core Tables (42+)

| Table | Primary Key | Key Columns | RLS Enabled |
|-------|------------|-------------|-------------|
| `profiles` | id (UUID, FK auth.users) | email, name, role, avatar_url, status, health_status, mentor_id, growth_score | Yes |
| `programs` | id (UUID) | mentor_id, title, description, status, visibility, difficulty | Yes |
| `program_enrollments` | (program_id, student_id) | status, enrolled_at, progress | Yes |
| `sessions` | id (UUID) | mentor_id, student_id, title, start_time, end_time, meeting_url, status | Yes |
| `goals` | id (UUID) | student_id, title, description, progress_percentage, status | Yes |
| `tasks` | id (UUID) | student_id, mentor_id, title, description, due_date, status | Yes |
| `journals` | id (UUID) | student_id, type, content, mood, wins, challenges | Yes |
| `bookings` | id (UUID) | user_id, mentor_id, date, time, status | Yes |
| `messages` | id (UUID) | conversation_id, sender_id, content, type, status, file_url | Yes |
| `conversations` | id (UUID) | mentor_id, student_id, last_message, unread_count | Yes |
| `conversation_participants` | (conversation_id, user_id) | — | Yes |
| `events` | id (UUID) | title, description, date, time, location, status, visibility | Yes |
| `event_attendees` | (event_id, user_id) | status, attendance_status | Yes |
| `event_waitlist` | (event_id, user_id) | position, status | Yes |
| `event_activity` | id (UUID) | event_id, user_id, action, description | Yes |
| `event_comments` | id (UUID) | event_id, user_id, content, parent_id | Yes |
| `event_speakers` | id (UUID) | event_id, name, title, bio | Yes |
| `event_feedbacks` | (event_id, user_id) | rating, comment | Yes |
| `event_files` | id (UUID) | event_id, name, type, url | Yes |
| `applications` | id (UUID) | email, first_name, last_name, status, discipline | Yes |
| `application_notes` | id (UUID) | application_id, author_id, content | Yes |
| `application_info_requests` | id (UUID) | application_id, requested_info, response | Yes |
| `notifications` | id (UUID) | user_id, title, message, read, type | Yes |
| `resources` | id (UUID) | title, url, category, is_pinned | Yes |
| `resource_completions` | (resource_id, user_id) | completed_at | Yes |
| `reviews` | id (UUID) | student_id, mentor_id, rating, comment | Yes |
| `tags` | id (UUID) | label, color | Yes |
| `student_tags` | (student_id, tag_id) | — | Yes |
| `custom_forms` | id (UUID) | title, description, fields (JSONB) | Yes |
| `form_submissions` | id (UUID) | form_id, user_id, responses (JSONB) | Yes |
| `products` | id (UUID) | name, description, price, category, status | Yes |
| `transactions` | id (UUID) | user_name, amount, date, product, status | Yes |
| `announcements` | id (UUID) | title, content, priority | Yes |
| `gallery` | id (UUID) | url, title, description, category | Yes |
| `social_links` | id (UUID) | platform, url, label | Yes |
| `website_settings` | key (text) | value (text) | Yes |
| `mentor_settings` | id (UUID) | mentor_id, timezone, session_duration, working_days | Yes |
| `student_progress` | id (UUID) | user_id, program_id, lessons (JSONB) | Yes |
| `dashboard_layouts` | id (UUID) | user_id, layout (JSONB) | Yes |
| `analytics_events` | id (UUID) | user_id, event_type, properties (JSONB) | Yes |
| `student_timeline_events` | id (UUID) | student_id, type, title, description | Yes |
| `shared_files` | id (UUID) | user_id, name, url, type, category | Yes |
| `credentials` | id (UUID) | student_id, title, issuer, issue_date | Yes |

### 2.2 Storage Buckets (7)

| Bucket | Purpose | Access |
|--------|---------|--------|
| `profile-avatars` | User avatar images | Public read, authenticated write |
| `student-documents` | Application documents | Mentor read, student write |
| `resource-files` | Resource attachments | Mentor CRUD |
| `event-files` | Event materials | Mentor CRUD |
| `gallery-images` | Gallery uploads | Public read, mentor write |
| `shared-files` | Student shared files | Mentor + student access |
| `message-attachments` | Chat file attachments | Conversation participants |

### 2.3 SQL Functions (10)

| Function | Returns | Purpose |
|----------|---------|---------|
| `is_mentor()` | boolean | RLS helper — checks if user has mentor role |
| `is_admin()` | boolean | RLS helper — checks if user has mentor role |
| `insert_notification()` | void | RPC to insert notifications |
| `handle_new_user()` | trigger | On auth.users insert — creates profile |
| `handle_updated_at()` | trigger | Auto-update timestamps |
| `sync_profile_role_to_auth()` | trigger | Sync profile role to auth user_metadata |
| `increment_resource_field()` | void | Resource analytics |
| `upsert_recently_viewed()` | void | Recently viewed tracking |
| `increment_gallery_view_count()` | void | Gallery view counter |
| `get_booking_stats()` | JSON | Booking statistics |

### 2.4 Triggers (3)

| Trigger | Table | Event | Function |
|---------|-------|-------|----------|
| `on_auth_user_created` | auth.users | AFTER INSERT | `handle_new_user()` |
| `trg_sync_profile_role_to_auth` | profiles | AFTER UPDATE | `sync_profile_role_to_auth()` |
| `set_*_updated_at` | Multiple tables | BEFORE UPDATE | `handle_updated_at()` |

### 2.5 Realtime Publication

40+ tables published to `supabase_realtime` including messages, notifications, sessions, goals, tasks, events, profiles, resources, reviews.

---

## 3. Test Cases

### Module 3.1: Schema Validation

#### DB-TC-001: Core Tables Exist

| Field | Value |
|-------|-------|
| **Test ID** | DB-TC-001 |
| **Module** | Schema |
| **Feature** | Table Existence |
| **Priority** | Critical |
| **Severity** | Blocker |
| **Test Type** | Database |
| **Test Data** | None |
| **Preconditions** | Supabase connection available |

**Objective**: Verify all required tables exist in the public schema.

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Query `information_schema.tables` for `profiles` | `profiles` table exists |
| 2 | Query for `programs` | Exists |
| 3 | Query for `sessions` | Exists |
| 4 | Query for `goals` | Exists |
| 5 | Query for `tasks` | Exists |
| 6 | Query for `messages` | Exists |
| 7 | Query for `notifications` | Exists |
| 8 | Query for remaining core tables | All 42+ tables present |

**Validation**:
- **Supabase**: `supabase.from('table').select('*', {count: 'exact', head: true})` returns count ≥ 0 (no error)

---

#### DB-TC-002: Required Columns Present

| Field | Value |
|-------|-------|
| **Test ID** | DB-TC-002 |
| **Module** | Schema |
| **Feature** | Column Presence |
| **Priority** | High |
| **Severity** | Major |
| **Test Type** | Database |
| **Test Data** | None |
| **Preconditions** | Supabase connection |

**Objective**: Verify key tables have required columns.

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Check `profiles` columns | id (UUID), email, name, role, avatar_url, created_at |
| 2 | Check `goals` columns | id, student_id, title, description, progress_percentage, status, created_at, updated_at |
| 3 | Check `messages` columns | id, conversation_id, sender_id, content, type, status, created_at |
| 4 | Check `notifications` columns | id, user_id, title, message, read, type, created_at |

---

### Module 3.2: Data Integrity

#### DB-TC-003: Foreign Key Integrity

| Field | Value |
|-------|-------|
| **Test ID** | DB-TC-003 |
| **Module** | Integrity |
| **Feature** | Foreign Keys |
| **Priority** | Critical |
| **Severity** | Blocker |
| **Test Type** | Database |
| **Test Data** | None |
| **Preconditions** | Supabase connection |

**Objective**: Verify foreign key constraints are enforced.

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Insert goal with non-existent student_id | Error: foreign key violation |
| 2 | Insert message with non-existent conversation_id | Error: foreign key violation |
| 3 | Insert session with non-existent mentor_id | Error: foreign key violation |
| 4 | Attempt to delete student with existing goals | Error: foreign key violation (or cascade — verify behavior) |

---

#### DB-TC-004: Unique Constraints

| Field | Value |
|-------|-------|
| **Test ID** | DB-TC-004 |
| **Module** | Integrity |
| **Feature** | Unique Constraints |
| **Priority** | High |
| **Severity** | Major |
| **Test Type** | Database |
| **Test Data** | None |
| **Preconditions** | Supabase connection |

**Objective**: Verify unique constraints prevent duplicate data.

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Insert duplicate conversation_participants row | Error: unique constraint violation (if composite PK) |
| 2 | Verify no duplicate `profiles` for same auth user | Unique constraint on profiles.id (FK to auth.users) |

---

### Module 3.3: RLS Policies

#### DB-TC-005: Student RLS — Own Data Only

| Field | Value |
|-------|-------|
| **Test ID** | DB-TC-005 |
| **Module** | RLS |
| **Feature** | Student Data Isolation |
| **Priority** | Critical |
| **Severity** | Critical |
| **Test Type** | Security / Database |
| **Test Data** | Student1 and Student2 authenticated |
| **Preconditions** | Both students exist with data |

**Objective**: Verify Student1 cannot read Student2's data.

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Login as Student1 | Authenticated |
| 2 | Query `goals` table filtered by Student2's ID | Empty result or error (RLS blocks) |
| 3 | Query `tasks` filtered by Student2's ID | Empty result |
| 4 | Query `sessions` not involving Student1 | Empty result |
| 5 | Query `journals` not owned by Student1 | Empty result |

**Validation**:
- **Supabase**: `supabase.from('goals').select('*').eq('student_id', 'student2-uuid')` returns `{data: [], error: null}` (RLS silently filters)
- **Existing Test**: `e2e/student-isolation.spec.ts`, `src/__tests__/rls-isolation.test.ts`

---

#### DB-TC-006: Mentor RLS — Can Read Own Students

| Field | Value |
|-------|-------|
| **Test ID** | DB-TC-006 |
| **Module** | RLS |
| **Feature** | Mentor Data Access |
| **Priority** | Critical |
| **Severity** | Critical |
| **Test Type** | Security / Database |
| **Test Data** | Mentor authenticated |
| **Preconditions** | Mentor has students |

**Objective**: Verify mentor can read data of their own students.

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Login as mentor | Authenticated |
| 2 | Query goals for Student1 | Goals returned (Student1 is mentor's student) |
| 3 | Query tasks for Student1 | Tasks returned |
| 4 | Query sessions | Sessions involving mentor's students returned |

---

#### DB-TC-007: RLS — Visitor (Unauthenticated) Access

| Field | Value |
|-------|-------|
| **Test ID** | DB-TC-007 |
| **Module** | RLS |
| **Feature** | Visitor Data Access |
| **Priority** | High |
| **Severity** | Critical |
| **Test Type** | Security / Database |
| **Test Data** | Unauthenticated user |
| **Preconditions** | No auth session |

**Objective**: Verify unauthenticated users cannot access protected data.

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Without auth, query `goals` table | Empty result (RLS blocks unauthenticated) |
| 2 | Query `profiles` table | Only public profiles returned (if any) |
| 3 | Query `applications` | Empty result or error |

---

### Module 3.4: Trigger Functions

#### DB-TC-008: Handle New User Trigger

| Field | Value |
|-------|-------|
| **Test ID** | DB-TC-008 |
| **Module** | Triggers |
| **Feature** | Auto Profile Creation |
| **Priority** | Critical |
| **Severity** | Blocker |
| **Test Type** | Database |
| **Test Data** | New auth user created |
| **Preconditions** | Supabase Auth user creation |

**Objective**: Verify `on_auth_user_created` trigger creates profile on signup.

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Create new auth user via `supabase.auth.signUp()` | Auth user created |
| 2 | Check `profiles` table | Corresponding profile exists with id = auth.users.id |
| 3 | Verify default role | Profile role is 'student' (default) |

---

#### DB-TC-009: Updated At Trigger

| Field | Value |
|-------|-------|
| **Test ID** | DB-TC-009 |
| **Module** | Triggers |
| **Feature** | Timestamp Updates |
| **Priority** | High |
| **Severity** | Major |
| **Test Type** | Database |
| **Test Data** | Existing row |
| **Preconditions** | Any table with `updated_at` column |

**Objective**: Verify `updated_at` is automatically set on row updates.

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Update a row in `goals` table | `updated_at` timestamp updates to current time |
| 2 | Update a row in `tasks` table | `updated_at` timestamp updates |
| 3 | Update a row in `sessions` table | `updated_at` timestamp updates |

---

### Module 3.5: Storage Buckets

#### DB-TC-010: Storage Bucket CRUD

| Field | Value |
|-------|-------|
| **Test ID** | DB-TC-010 |
| **Module** | Storage |
| **Feature** | Bucket Operations |
| **Priority** | High |
| **Severity** | Major |
| **Test Type** | Database |
| **Test Data** | Test image file |
| **Preconditions** | Authenticated user |

**Objective**: Verify storage buckets allow correct CRUD operations.

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Upload file to `profile-avatars` | File uploaded, public URL returned |
| 2 | List files in bucket | Uploaded file appears in list |
| 3 | Download file | File content matches original |
| 4 | Delete file | File removed from bucket |

**Validation**:
- **Supabase Storage**: `supabase.storage.from('profile-avatars').upload()` / `.list()` / `.download()` / `.remove()`

---

### Module 3.6: SQL Functions

#### DB-TC-011: Insert Notification RPC

| Field | Value |
|-------|-------|
| **Test ID** | DB-TC-011 |
| **Module** | Functions |
| **Feature** | Notification RPC |
| **Priority** | High |
| **Severity** | Major |
| **Test Type** | Database |
| **Test Data** | User ID, title, message |
| **Preconditions** | Authenticated user |

**Objective**: Verify `insert_notification()` RPC creates notification.

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Call `supabase.rpc('insert_notification', {p_user_id, p_title, p_message})` | RPC executes, no error |
| 2 | Query `notifications` table | New notification row exists with correct data |

---

#### DB-TC-012: is_mentor() Helper

| Field | Value |
|-------|-------|
| **Test ID** | DB-TC-012 |
| **Module** | Functions |
| **Feature** | Role Check |
| **Priority** | High |
| **Severity** | Major |
| **Test Type** | Database |
| **Test Data** | Mentor and student users |
| **Preconditions** | Supabase connection |

**Objective**: Verify `is_mentor()` function returns correct boolean.

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Execute `select is_mentor()` as mentor | Returns `true` |
| 2 | Execute `select is_mentor()` as student | Returns `false` |
| 3 | Execute `select is_mentor()` as unauthenticated | Returns `false` |

---

### Module 3.7: Performance & Indexes

#### DB-TC-013: Query Performance

| Field | Value |
|-------|-------|
| **Test ID** | DB-TC-013 |
| **Module** | Performance |
| **Feature** | Query Execution Time |
| **Priority** | Medium |
| **Severity** | Major |
| **Test Type** | Database / Performance |
| **Test Data** | Standard queries |
| **Preconditions** | Supabase connection |

**Objective**: Verify common queries execute within acceptable time.

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Query goals by student_id | Execution time < 200ms |
| 2 | Query messages by conversation_id | Execution time < 300ms |
| 3 | Query notifications by user_id | Execution time < 200ms |
| 4 | Query sessions by mentor_id with date range | Execution time < 300ms |

---

## 4. Automation Mapping

| Test Cases | Automation | Tool | Status |
|-----------|-----------|------|--------|
| DB-TC-001 to DB-TC-004 | Partial | Vitest (schema checks) | ❌ Missing |
| DB-TC-005 to DB-TC-007 | Yes | Playwright / Vitest | ✅ `e2e/student-isolation.spec.ts`, `rls-isolation.test.ts` |
| DB-TC-008, DB-TC-009 | Manual | Supabase Dashboard | ❌ Missing |
| DB-TC-010 | Yes | Playwright (file upload) | Partial (in e2e tests) |
| DB-TC-011, DB-TC-012 | Partial | Vitest | ❌ Missing |
| DB-TC-013 | Manual | Supabase Query Performance | ❌ Missing |
