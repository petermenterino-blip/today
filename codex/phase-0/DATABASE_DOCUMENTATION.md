# Database Documentation

**Generated:** 2026-07-06
**Source:** Supabase project `jnazlfhhzxrocvxvmkkc` + migration files
**Migration Count:** 43 files

---

## Tables Summary (42+ tables in `public` schema)

### Core Tables

| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `profiles` | User profiles (extends auth.users) | id, email, name, role, avatar_url, status, health_status, mentor_id, growth_score |
| `programs` | Mentorship programs | id, mentor_id, title, description, status, visibility, difficulty |
| `program_enrollments` | Student-program enrollment | program_id, student_id, status, enrolled_at |
| `sessions` | Mentor-student sessions | id, mentor_id, student_id, title, start_time, end_time, meeting_url, status |
| `goals` | Student goals | id, student_id, title, description, progress_percentage, status |
| `tasks` | Student tasks | id, student_id, mentor_id, title, description, due_date, status |
| `journals` | Student journal entries | id, student_id, type, content, mood, wins, challenges |
| `bookings` | Consultation bookings | id, user_id, mentor_id, date, time, status |
| `messages` | Chat messages | id, conversation_id, sender_id, content, type, status, file_url |
| `conversations` | Chat conversations | id, mentor_id, student_id, last_message, unread_count |
| `conversation_participants` | Conversation membership | conversation_id, user_id |
| `events` | Platform events | id, title, description, date, time, location, status, visibility |
| `event_attendees` | Event registration | event_id, user_id, status, attendance_status |
| `event_waitlist` | Event waitlist | event_id, user_id, position, status |
| `event_activity` | Event activity log | event_id, user_id, action, description |
| `event_comments` | Event comments | event_id, user_id, content, parent_id |
| `event_speakers` | Event speakers | event_id, name, title, bio |
| `event_feedbacks` | Event feedback | event_id, user_id, rating, comment |
| `event_files` | Event files | event_id, name, type, url |
| `applications` | Mentorship applications | id, email, first_name, last_name, status, discipline |
| `application_notes` | Application review notes | application_id, author_id, content |
| `application_info_requests` | Additional info requests | application_id, requested_info, response |
| `notifications` | In-app notifications | id, user_id, title, message, read, type |
| `resources` | Learning resources | id, title, url, category, is_pinned |
| `resource_completions` | Resource completion tracking | resource_id, user_id, completed_at |
| `reviews` | Student reviews | id, student_id, mentor_id, rating, comment |
| `tags` | Student tags | id, label, color |
| `student_tags` | Tag-student mapping | student_id, tag_id |
| `custom_forms` | Custom forms for mentors | id, title, description, fields (JSONB) |
| `form_submissions` | Form responses | form_id, user_id, responses (JSONB) |
| `products` | Store products | id, name, description, price, category, status |
| `transactions` | Purchase transactions | id, user_name, amount, date, product, status |
| `announcements` | Platform announcements | id, title, content, priority |
| `gallery` | Image gallery | id, url, title, description, category |
| `social_links` | Social media links | id, platform, url, label |
| `website_settings` | Public website config | key, value |
| `mentor_settings` | Mentor availability/config | mentor_id, timezone, session_duration, working_days |
| `student_progress` | Student program progress | user_id, program_id, lessons (JSONB) |
| `dashboard_layouts` | Custom dashboard layouts | user_id, layout (JSONB) |
| `analytics_events` | Analytics event log | user_id, event_type, properties (JSONB) |
| `student_timeline_events` | Timeline of student activity | student_id, type, title, description |
| `shared_files` | Shared student files | user_id, name, url, type, category |
| `credentials` | Student credentials | student_id, title, issuer, issue_date |

## Storage Buckets (7)

| Bucket | Purpose | Access |
|--------|---------|--------|
| `profile-avatars` | User avatar images | Public read, authenticated write |
| `student-documents` | Application documents | Mentor/admin read, student write |
| `resource-files` | Resource attachments | Mentor/admin CRUD |
| `event-files` | Event materials | Mentor/admin CRUD |
| `gallery-images` | Gallery uploads | Public read, mentor write |
| `shared-files` | Student shared files | Mentor + student access |
| `message-attachments` | Chat file attachments | Conversation participants |

## SQL Functions

| Function | Purpose |
|----------|---------|
| `is_mentor()` | RLS helper — checks if user has mentor role |
| `is_admin()` | RLS helper — checks if user has admin role |
| `insert_notification()` | RPC to insert notifications |
| `handle_new_user()` | Trigger function on auth.users insert |
| `handle_updated_at()` | Auto-update timestamps |
| `sync_profile_role_to_auth()` | Sync profile role to auth user_metadata |
| `increment_resource_field()` | Resource analytics |
| `upsert_recently_viewed()` | Recently viewed tracking |
| `increment_gallery_view_count()` | Gallery view counter |
| `get_booking_stats()` | Booking statistics |

## Triggers

| Trigger | Table | Event | Function |
|---------|-------|-------|----------|
| `on_auth_user_created` | auth.users | AFTER INSERT | `handle_new_user()` |
| `trg_sync_profile_role_to_auth` | profiles | AFTER UPDATE | `sync_profile_role_to_auth()` |
| `set_*_updated_at` | Multiple tables | BEFORE UPDATE | `handle_updated_at()` |

## Realtime Publication

40+ tables published to `supabase_realtime` including messages, notifications, sessions, goals, tasks, events, profiles, resources, reviews, and more.

## RLS Policies

Policies exist across all tables restricting access by role and ownership. Key patterns:
- **Mentors**: Access own students' data
- **Students**: Access own data only
- **Visitors**: Public/limited access
- **Admin**: Full access (via `is_admin()` function)
