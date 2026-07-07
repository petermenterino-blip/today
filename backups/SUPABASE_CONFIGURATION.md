# Supabase Configuration

**Project Reference:** jnazlfhhzxrocvxvmkkc
**Project Name:** mentarino
**Organization:** butcyjsbyvybgbqonwff

## Project Settings

- **Region:** US East (default)
- **PostgreSQL Version:** 15+ (managed by Supabase)
- **API URL:** https://jnazlfhhzxrocvxvmkkc.supabase.co
- **GraphQL URL:** https://jnazlfhhzxrocvxvmkkc.supabase.co/graphql/v1
- **DB Connection:** postgresql://postgres:[password]@db.jnazlfhhzxrocvxvmkkc.supabase.co:5432/postgres

## Edge Functions

### 1. Gemini AI (`supabase/functions/gemini/index.ts`)
- **Purpose:** AI chat assistant using Google Gemini 2.0 Flash API
- **Endpoint:** `functions/v1/gemini`
- **Auth:** JWT verification via middleware (requires student/mentor/admin)
- **Models:** Gemini 2.0 Flash (streaming and non-streaming)
- **Supported Types:** chat, application_summary, session_brief, feedback, insights
- **System Prompts:** 5 predefined prompts for different use cases
- **Env Variables Required:** `GEMINI_API_KEY`

### 2. Resend Email (`supabase/functions/resend/index.ts`)
- **Purpose:** Send transactional emails via Resend API
- **Endpoint:** `functions/v1/resend`
- **Auth:** JWT verification (requires mentor/admin)
- **Templates:** welcome, session_reminder, application_update, notification
- **From Address:** Mentorino <notifications@mentorino.com>
- **Env Variables Required:** `RESEND_API_KEY`

### 3. Scheduled Tasks (`supabase/functions/scheduled/index.ts`)
- **Purpose:** Cron-triggered maintenance tasks
- **Endpoint:** `functions/v1/scheduled`
- **Auth:** x-cron-secret header
- **Tasks:**
  - `session_reminders` — Send 24h reminders for upcoming sessions
  - `inactivity_alerts` — Notify mentors of 7-day inactive students
  - `progress_summaries` — Weekly progress summaries for mentors
  - `cleanup` — Mark stale sessions as cancelled, archive old notifications
- **Env Variables Required:** `CRON_SECRET`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`

### 4. Auth Middleware (`supabase/functions/middleware/auth.ts`)
- **Purpose:** Shared JWT verification for edge functions
- **Functions:** `verifyAuth()`, `requireRole()`, `CORS_HEADERS`
- **Used by:** gemini, resend

## Realtime Configuration

### Publication: `supabase_realtime`

Tables added to publication:

| Table | Added In |
|-------|----------|
| messages | 015 |
| notifications | 015 |
| sessions | 015 |
| bookings | 015 |
| goals | 021 |
| tasks | 021 |
| student_progress | 021 |
| program_enrollments | 021 |
| shared_files | 020 |
| student_timeline_events | 020 |
| profiles | 021 |
| tags | 021 |
| student_tags | 021 |
| custom_forms | 021 |
| form_submissions | 021 |
| events | 023_events |
| event_attendees | 023_events |
| event_waitlist | 023_events |
| event_activity | 023_events |
| event_comments | 023_events |
| event_speakers | 023_events |
| event_feedbacks | 023_events |
| event_files | 023_events |
| event_notifications | 023_events |
| event_recordings | 023_events |
| resources | 023_resources |
| resource_categories | 023_resources |
| resource_tags | 023_resources |
| resource_assignments | 023_resources |
| resource_favorites | 023_resources |
| resource_comments | 023_resources |
| resource_activity | 023_resources |
| resource_completions | 026 |
| recently_viewed | 026 |
| reviews | 023_reviews |
| review_history | 023_reviews |
| visitor_bookings | 028_visitor_bookings |
| booking_notes | 028_visitor_bookings |
| booking_timeline | 028_visitor_bookings |
| gallery_items | 028_gallery |
| social_links | 029 |
| website_settings | 029 |
| form_assignments | 030_crm_module5 |
| notifications | (already added) |
| student_timeline_events | (already added) |

## Realtime Manager (`src/lib/realtimeManager.ts`)

The frontend uses a centralized realtime manager with two hooks:
- `useSharedRealtimeData(table, queryKey)` — Subscribes to table changes, auto-invalidates React Query cache
- `useSharedSubscription(table, callback)` — Same but with custom callback

Connection management via `ConnectionContext.tsx` monitors online/offline, debounces reconnections (60s check interval).

## Auth Settings

- **Providers:** Email/Password only
- **Session Duration:** Default Supabase (7 days)
- **Auto-Refresh:** Enabled
- **Detect Session in URL:** Disabled
- **Persist Session:** Enabled
- **Redirect URLs:** (configured in Supabase Dashboard)
  - Production URL
  - Local http://localhost:3000
- **Password Requirements:** Default Supabase
- **User Signups:** Enabled (anyone can sign up)

## Storage Buckets

| Bucket | Public | Size Limit | MIME Types |
|--------|--------|------------|------------|
| profile-avatars | ✅ Yes | 5MB | image/png, image/jpeg, image/gif, image/webp |
| student-documents | ❌ No | 10MB | pdf, doc, docx, png, jpeg |
| mentor-resources | ❌ No | 100MB | pdf, doc, ppt, xls, zip, images, video, audio, text, json, csv, markdown |
| gallery-images | ✅ Yes | 5MB | image/png, image/jpeg, image/gif, image/webp |
| message-attachments | ❌ No | 25MB | pdf, doc, txt, images, zip, ppt, xls, audio, video |
| shared_files | ❌ No | 50MB | Documents, images, zip |
| public-website | ✅ Yes | 10MB | image/png, image/jpeg, image/webp, application/pdf |

## Bucket Policies (Storage RLS)

See STORAGE_CONFIGURATION.md for complete policy listing.

## SQL Functions

| Function | Purpose |
|----------|---------|
| `public.is_mentor()` | JWT-claim-based mentor check |
| `public.is_admin()` | JWT-claim-based admin check |
| `public.insert_notification()` | Security-definer notification insert |
| `public.increment_resource_field()` | Increment resource counter fields |
| `public.upsert_recently_viewed()` | Track recently viewed resources |
| `public.increment_gallery_view_count()` | Increment gallery view counter |
| `public.get_booking_stats()` | Aggregate booking statistics |
| `public.handle_new_user()` | Auto-create profile on signup |
| `public.handle_updated_at()` | Update timestamps on all tables |
| `public.sync_profile_role_to_auth()` | Sync profile role to auth.users metadata |
| `public.update_resource_timestamp()` | Resource timestamp updater |
| `public.log_resource_activity()` | Auto-log resource creation |
| `public.increment_resource_downloads()` | Auto-increment download count |
| `public.increment_resource_views()` | Auto-increment view count |
| `public.handle_review_status_change()` | Auto-create review history entry |
| `public.handle_review_updated_at()` | Review timestamp updater |
| `public.handle_review_growth_score()` | Update growth score on review |
| `public.update_social_links_updated_at()` | Social links timestamp updater |
| `public.update_website_settings_updated_at()` | Website settings timestamp updater |

## Triggers

| Trigger | Table | Event | Function |
|---------|-------|-------|----------|
| on_auth_user_created | auth.users | AFTER INSERT | handle_new_user() |
| trg_sync_profile_role_to_auth | profiles | AFTER INSERT/UPDATE role | sync_profile_role_to_auth() |
| set_profiles_updated_at | profiles | BEFORE UPDATE | handle_updated_at() |
| set_programs_updated_at | programs | BEFORE UPDATE | handle_updated_at() |
| set_sessions_updated_at | sessions | BEFORE UPDATE | handle_updated_at() |
| set_goals_updated_at | goals | BEFORE UPDATE | handle_updated_at() |
| set_tasks_updated_at | tasks | BEFORE UPDATE | handle_updated_at() |
| set_journals_updated_at | journals | BEFORE UPDATE | handle_updated_at() |
| set_bookings_updated_at | bookings | BEFORE UPDATE | handle_updated_at() |
| set_conversations_updated_at | conversations | BEFORE UPDATE | handle_updated_at() |
| set_events_updated_at | events | BEFORE UPDATE | handle_updated_at() |
| set_applications_updated_at | applications | BEFORE UPDATE | handle_updated_at() |
| set_mentor_settings_updated_at | mentor_settings | BEFORE UPDATE | handle_updated_at() |
| set_dashboard_layouts_updated_at | dashboard_layouts | BEFORE UPDATE | handle_updated_at() |
| set_form_templates_updated_at | form_templates | BEFORE UPDATE | handle_updated_at() |
| set_mentor_availability_updated_at | mentor_availability | BEFORE UPDATE | handle_updated_at() |
| trigger_update_resource_timestamp | resources | BEFORE UPDATE | update_resource_timestamp() |
| trigger_log_resource_activity | resources | AFTER INSERT | log_resource_activity() |
| trigger_increment_downloads | resource_downloads | AFTER INSERT | increment_resource_downloads() |
| trigger_increment_views | resource_views | AFTER INSERT | increment_resource_views() |
| trg_review_status_change | reviews | AFTER UPDATE of status | handle_review_status_change() |
| trg_review_updated_at | reviews | BEFORE UPDATE | handle_review_updated_at() |
| trigger_social_links_updated_at | social_links | BEFORE UPDATE | update_social_links_updated_at() |
| trigger_website_settings_updated_at | website_settings | BEFORE UPDATE | update_website_settings_updated_at() |
