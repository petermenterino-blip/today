# RLS Security Matrix — Phase 1 Audit

> **Date:** 2026-07-06  
> **Scope:** All 42+ tables with Row-Level Security enabled  
> **Severity:** CRITICAL = blanket full access, HIGH = blanket authenticated per-table, MEDIUM = missing granularity

## Convention
- 🔴 **CRITICAL** — `FOR ALL` with `USING (true)` or `auth.role() = 'authenticated'` on ALL operations
- 🟠 **HIGH** — `SELECT` with `auth.role() = 'authenticated'` (acceptable but ideal would be role-scoped)
- 🟡 **MEDIUM** — Missing DELETE or UPDATE policy
- 🟢 **LOW** — Policy exists but could be more specific
- ✅ **SECURE** — Proper owner/role isolation

---

## CORE TABLES

| # | Table | Current Policies | Risk | Required Fix |
|---|-------|-----------------|------|-------------|
| 1 | `profiles` | "Users can read own" (SELECT own), "Mentors can read assigned students" (SELECT is_mentor), "Mentors can read all student profiles" (SELECT is_mentor), "Users can update own" (UPDATE own), "Mentors can update students they mentor" (UPDATE mentor_id=auth.uid()), "Mentors can update all student profiles" (UPDATE is_mentor), "Users can insert own" (INSERT own), "Mentors full access" (ALL is_admin) | 🟡 **MEDIUM** — "Mentors can read all student profiles" and "Mentors can update all student profiles" are duplicate broader policies that bypass the scoped ones. Drop the duplicate broad policies, keep the scoped ones. | Drop "Mentors can read all student profiles" and "Mentors can update all student profiles" |
| 2 | `programs` | "Anyone can read published" (SELECT public), "Mentors can read own" (SELECT mentor_id), "Mentors can insert/update/delete own" (mentor_id), "Mentors full access" (ALL) | ✅ | None |
| 3 | `program_enrollments` | "Students can read own" (SELECT student_id), "Mentors can read their programs" (SELECT via program), "Students can enroll" (INSERT student_id), "Mentors can update" (UPDATE via program) | ✅ | None |
| 4 | `sessions` | "Participants can read" (SELECT student OR mentor), "Mentors can insert" (INSERT mentor_id), "Mentors can update" (UPDATE mentor_id), "Students can update attendance" (UPDATE student_id), "Mentors can delete" (DELETE mentor_id), "Mentors full access" (ALL) | ✅ | None |
| 5 | `goals` | "Students read own" (SELECT student_id), "Mentors read students goals" (SELECT via profile.mentor_id), "Students insert own" (INSERT student_id), "Students update own" (UPDATE student_id), "Mentors update students goals" (UPDATE via profile.mentor_id), "Mentors full access" (ALL) | ✅ | None |
| 6 | `goal_milestones` | "Goal milestones inherit goal policies" (SELECT via goal), "Students manage own" (INSERT via goal.student_id), "Mentors manage" (INSERT via goal->program) | ✅ | None |
| 7 | `tasks` | "Task participants" (SELECT student OR mentor), "Mentors insert" (INSERT mentor_id), "Mentors update" (UPDATE mentor_id), "Students update task status" (UPDATE student_id), "Mentors full access" (ALL) | 🟡 | Missing DELETE policy for mentors |
| 8 | `journals` | "Students read own" (SELECT student_id), "Mentors read students journals" (SELECT via profile.mentor_id), "Students insert/update own" (INSERT/UPDATE student_id) | ✅ | None |

## MESSAGING TABLES

| # | Table | Current Policies | Risk | Required Fix |
|---|-------|-----------------|------|-------------|
| 9 | `conversations` | "Participants can read" (SELECT mentor/student/participant), "Mentors can create" (INSERT mentor_id), "Participants can update" (UPDATE participant), "Mentors can delete" (DELETE mentor_id) | ✅ | None |
| 10 | `conversation_participants` | "Users read own" (SELECT user_id), "Mentors add participants" (INSERT via conversation), "Mentors remove participants" (DELETE via conversation) | ✅ | None |
| 11 | `messages` | "Participants can read/insert" (SELECT/INSERT via participant), "Users update own messages" (UPDATE sender_id), "Participants update message status" (UPDATE via participant) | ✅ | None |

## BOOKINGS

| # | Table | Current Policies | Risk | Required Fix |
|---|-------|-----------------|------|-------------|
| 12 | `bookings` | "Users read own" (SELECT user_id), "Mentors can read all" (SELECT is_mentor), "Users insert own" (INSERT user_id), "Mentors update" (UPDATE is_mentor) | 🟡 | Mentors can read ALL bookings, not just their students'. Acceptable for mentor/CRM use case. |

## EVENTS

| # | Table | Current Policies | Risk | Required Fix |
|---|-------|-----------------|------|-------------|
| 13 | `events` | "Anyone can read published" (SELECT public), "Mentors can create" (INSERT is_mentor), "Mentors update own" (UPDATE created_by), "Mentors full access" (ALL) | ✅ | None |
| 14 | `event_attendees` | "Authenticated users can read" (SELECT authenticated), "Users can register" (INSERT user_id), "Event creators update/delete" (UPDATE/DELETE via event) | 🟠 **HIGH** | SELECT with `auth.role() = 'authenticated'` — acceptable for event attendance data |
| 15 | `event_files` | "Authenticated users can read" (SELECT authenticated), "Event creators insert/update/delete" (via event) | 🟠 **HIGH** | SELECT with `auth.role() = 'authenticated'` — acceptable for event files |
| 16 | `event_feedbacks` | "Authenticated users can read" (SELECT authenticated), "Attendees can submit" (INSERT via attendee) | 🟠 **HIGH** | SELECT with `auth.role() = 'authenticated'` — acceptable for event feedback |
| 17 | `event_recordings` | "Authenticated users can read" (SELECT authenticated), "Event creators insert/update/delete" (via event) | 🟠 **HIGH** | SELECT with `auth.role() = 'authenticated'` — acceptable for recordings |

## APPLICATIONS

| # | Table | Current Policies | Risk | Required Fix |
|---|-------|-----------------|------|-------------|
| 18 | `applications` | "Users read own" (SELECT user_id), "Mentors read all" (SELECT is_mentor), "Anyone can submit" (INSERT check true), "Mentors update" (UPDATE is_mentor), "Mentors full access" (ALL) | 🟢 **LOW** | "Anyone can submit" with `check (true)` is intentional for public applications |
| 19 | `application_notes` | "Users read own" (SELECT author_id), "Users create own" (INSERT author_id), "Users update own" (UPDATE author_id) | ✅ | None |
| 20 | `application_info_requests` | No RLS policy found — falls back to default-deny | 🟡 | Needs policies |

## NOTIFICATIONS

| # | Table | Current Policies | Risk | Required Fix |
|---|-------|-----------------|------|-------------|
| 21 | `notifications` | "Users read own" (SELECT user_id), "Users update own" (UPDATE user_id), "Mentors full access" (ALL) | ✅ | None |

## RESOURCES (🔴 CRITICAL SECTION)

| # | Table | Current Policies | Risk | Required Fix |
|---|-------|-----------------|------|-------------|
| 22 | `resources` | "Authenticated users can read" (SELECT authenticated), "Mentors can insert" (INSERT is_mentor), "Mentors can update" (UPDATE is_mentor), "Mentors can delete" (DELETE is_mentor) | 🟠 | Authenticated SELECT is acceptable for a resource library |
| 23 | `resource_categories` | **"Authenticated full access"** (FOR ALL authenticated) + previous granular policies | 🔴 **CRITICAL** | Drop blanket policy, keep granular ones |
| 24 | `resource_tags` | "Anyone can read" (SELECT authenticated), "Mentors manage" (INSERT is_mentor) | 🟢 | Acceptable |
| 25 | `resource_favorites` | **"Authenticated full access"** (FOR ALL authenticated) + previous granular policies | 🔴 **CRITICAL** | Drop blanket policy, keep granular ones |
| 26 | `resource_comments` | **"Authenticated full access"** (FOR ALL authenticated) + previous granular policies | 🔴 **CRITICAL** | Drop blanket policy, keep granular ones |
| 27 | `resource_versions` | **"Authenticated full access"** (FOR ALL authenticated) + previous granular policies | 🔴 **CRITICAL** | Drop blanket policy, keep granular ones |
| 28 | `resource_activity` | **"Authenticated full access"** (FOR ALL authenticated) + previous granular policies | 🔴 **CRITICAL** | Drop blanket policy, keep granular ones |
| 29 | `resource_completions` | **"Authenticated full access"** (FOR ALL authenticated) — NO granular policies exist | 🔴 **CRITICAL** | Replace with user-manages-own + mentor-reads-assigned |
| 30 | `resource_downloads` | **"Authenticated full access"** (FOR ALL authenticated) + previous granular policies | 🔴 **CRITICAL** | Drop blanket policy, keep granular ones |
| 31 | `resource_assignments` | **"Authenticated full access"** (FOR ALL authenticated) + previous granular policies | 🔴 **CRITICAL** | Drop blanket policy, keep granular ones |
| 32 | `resource_views` | "Users can insert views" (INSERT authenticated), "Users can read views" (SELECT authenticated) | 🟠 | Acceptable for analytics tracking |
| 33 | `recently_viewed` | **"Authenticated full access"** (FOR ALL authenticated) — NO granular policies exist | 🔴 **CRITICAL** | Replace with user-manages-own |
| 34 | `reviews` | **"Authenticated full access"** (FOR ALL authenticated) — NO granular policies exist | 🔴 **CRITICAL** | Replace with participant-only access |
| 35 | `review_history` | **"Authenticated full access"** (FOR ALL authenticated) — NO granular policies exist | 🔴 **CRITICAL** | Replace with participant-only access |

## MENTOR / CRM TABLES

| # | Table | Current Policies | Risk | Required Fix |
|---|-------|-----------------|------|-------------|
| 36 | `mentor_settings` | "Mentors read own" (SELECT mentor_id), "Mentors manage/update own" (INSERT/UPDATE mentor_id) | ✅ | None |
| 37 | `mentor_availability` | "Mentors read own" (SELECT mentor_id), "Mentors manage/update own" (INSERT/UPDATE mentor_id) | ✅ | None |
| 38 | `dashboard_layouts` | "Users read own" (SELECT user_id), "Users manage own" (INSERT user_id) | 🟡 | Missing UPDATE/DELETE policies |
| 39 | `custom_forms` | "Mentors can read" (SELECT is_mentor), "Mentors can create" (INSERT is_mentor), "Creators can update" (UPDATE created_by) | ✅ | None |
| 40 | `form_templates` | "Mentors can read" (SELECT is_mentor), "Mentors can create" (INSERT is_mentor), "Creators can update" (UPDATE created_by) | ✅ | None |
| 41 | `form_submissions` | "Users read own" (SELECT user_id), "Users can submit" (INSERT user_id) | ✅ | None |
| 42 | `shared_files` | "Users read own" (SELECT user_id), "Mentors read all" (SELECT is_mentor via inline profiles), "Mentors insert/update/delete" (via inline profiles) | 🟠 | Inline `EXISTS (SELECT 1 FROM profiles...)` patterns should use `is_mentor()` |
| 43 | `student_progress` | "Students read own" (SELECT user_id), "Mentors read their programs" (SELECT via program) | ✅ | None |
| 44 | `student_timeline_events` | "Students read own" (SELECT student_id), "Mentors can create" (INSERT is_mentor) | 🟡 | Missing mentor SELECT/UPDATE policies |
| 45 | `student_tags` | "Authenticated users can read" (SELECT authenticated), "Mentors can manage" (INSERT is_mentor) | 🟠 | Authenticated SELECT acceptable for student tags |
| 46 | `tags` | "Authenticated users can read" (SELECT authenticated), "Mentors can insert/update/delete" | 🟠 | Authenticated SELECT acceptable |

## STORE / COMMERCE

| # | Table | Current Policies | Risk | Required Fix |
|---|-------|-----------------|------|-------------|
| 47 | `products` | "Anyone can read" (SELECT true), "Mentors can insert" (INSERT is_mentor) | 🟢 | Public read is intentional for storefront |
| 48 | `transactions` | "Users read own" (SELECT user_id), "Users can create" (INSERT user_id) | ✅ | None |

## OTHER

| # | Table | Current Policies | Risk | Required Fix |
|---|-------|-----------------|------|-------------|
| 49 | `announcements` | "Authenticated users can read" (SELECT authenticated), "Mentors can create" (INSERT is_mentor) | 🟠 | Acceptable |
| 50 | `ai_chat_history` | "Users read own" (SELECT user_id), "Users insert own" (INSERT user_id) | ✅ | None |
| 51 | `surveys` | "Authenticated users can read" (SELECT authenticated) | 🟠 | Acceptable |
| 52 | `survey_responses` | "Users can submit" (INSERT user_id) | ✅ | None |
| 53 | `analytics_events` | "Authenticated users can insert" (INSERT authenticated) | 🟠 | Acceptable for event tracking |
| 54 | `social_links` | "Public read" (SELECT true), "Mentors manage" (FOR ALL is_mentor) | ✅ | Public is intentional |
| 55 | `website_settings` | "Public read" (SELECT true), "Mentors manage" (FOR ALL is_mentor) | ✅ | Public is intentional |

## STORAGE

| # | Bucket | Current Policies | Risk | Required Fix |
|---|--------|-----------------|------|-------------|
| 56 | `shared_files` | "shared_files_mentor_all" (FOR ALL authenticated, bucket_id check, profiles mentor role check) — any mentor can access ANY student's files | 🔴 **CRITICAL** | Scope mentor access to only their assigned students' folders |
| 57 | `shared_files` | "shared_files_student_read" (SELECT authenticated, folder name matches auth.uid()) | ✅ | Student isolation is correct |
| 58 | `profile-avatars` | Default bucket RLS — not reviewed | 🟢 | Acceptable |
| 59 | `mentor-resources` | Bucket exists with MIME restrictions | 🟢 | Acceptable |

## MENTOR POLICIES

Tables with `is_admin()` FOR ALL policies:
- `profiles`, `sessions`, `goals`, `tasks`, `applications`, `programs`, `events`, `notifications`

Tables **missing** mentor policies (Mentor would need service_role or per-table):
- `journals`, `bookings`, `conversations`, `messages`, `conversation_participants`, `mentor_settings`, `dashboard_layouts`, `custom_forms`, `form_templates`, `form_submissions`, `shared_files`, `student_progress`, `student_timeline_events`, `products`, `transactions`, `announcements`, `mentor_availability`, `tags`, `student_tags`, `resource_*`, `reviews`, `review_history`, `recently_viewed`, `social_links`, `website_settings`, `survey_responses`, `ai_chat_history`, `analytics_events`

## SUMMARY

| Severity | Count | Description |
|----------|-------|-------------|
| 🔴 CRITICAL | 11 | Tables with "Authenticated full access" (FOR ALL authenticated) — all resource-* sub-tables, reviews, review_history, recently_viewed |
| 🔴 CRITICAL | 1 | Storage policy — any mentor can access any student's shared files |
| 🟠 HIGH | 6 | Tables with SELECT `auth.role() = 'authenticated'` — acceptable for public-facing data |
| 🟡 MEDIUM | 5 | Missing policies: application_info_requests, dashboard_layouts UPDATE/DELETE, student_timeline_events mentor SELECT, tasks DELETE |
| 🟢 LOW | 3 | Minor: duplicate broad mentor policies on profiles, public applications INSERT |
| ✅ SECURE | ~30 | Tables with proper owner/role-isolated policies |
