

# Mentorino — Database Architecture

Version: 1.0
Based on ARCHITECTURE.md v1.0, AUDIT.md, and APPLICATION_FLOW.md


## 1. Naming Conventions

| Element | Convention | Example |
|---------|-----------|---------|
| Tables | `snake_case` plural | `profiles`, `program_enrollments` |
| Columns | `snake_case` | `created_at`, `mentor_id` |
| Primary Keys | `id` (UUID) | `id UUID DEFAULT gen_random_uuid()` |
| Foreign Keys | `{table}_id` | `student_id`, `program_id` |
| Timestamps | `created_at`, `updated_at` | `TIMESTAMPTZ NOT NULL DEFAULT NOW()` |
| Soft Delete | `deleted_at` | `TIMESTAMPTZ DEFAULT NULL` |
| Audit Columns | `created_by`, `updated_by` | References `auth.users.id` |
| Indexes | `idx_{table}_{column}` | `idx_sessions_student_id` |
| Unique Constraints | `uq_{table}_{columns}` | `uq_conversation_participants` |
| Check Constraints | `ck_{table}_{rule}` | `ck_events_capacity_positive` |


## 2. UUID Strategy

- All primary keys use `gen_random_uuid()` (UUID v4)
- No sequential integers exposed to clients
- Supabase Auth uses built-in UUID for `auth.users.id`
- All `created_by` / `updated_by` foreign keys reference `auth.users.id`

Rationale: UUIDs prevent enumeration attacks, scale horizontally, and are the Supabase standard.


## 3. Soft Delete Strategy

- Tables that support soft delete have a `deleted_at TIMESTAMPTZ DEFAULT NULL` column
- All queries use a default `WHERE deleted_at IS NULL` filter (enforced via RLS or view)
- Hard delete is never exposed to users; reserved for admin/scheduled cleanup
- Soft-deleted rows retain referential integrity for historical data

Tables with soft delete:
`profiles`, `programs`, `sessions`, `goals`, `goal_milestones`, `tasks`, `journals`, `bookings`, `messages`, `conversations`, `events`, `applications`, `notifications`, `resources`, `surveys`, `products`

Tables WITHOUT soft delete (append-only / immutable):
`analytics_events`, `audit_logs`, `survey_responses`, `event_attendees`, `conversation_participants`


## 4. Audit Log Strategy

A single `audit_logs` table records all sensitive mutations:

```sql
CREATE TABLE audit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  table_name TEXT NOT NULL,
  record_id UUID NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
  old_data JSONB,
  new_data JSONB,
  changed_by UUID REFERENCES auth.users(id),
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

Triggers on sensitive tables (`applications`, `profiles`, `transactions`) push changes to `audit_logs`. The mentor views audit logs from the admin panel.


## 5. ER Diagram (Text)

```
auth.users (Supabase managed)
  │
  └── profiles (extends auth.users)
        │
        ├── programs (created by mentor)
        │     └── program_enrollments (student enrollment)
        │
        ├── sessions (1:1 meeting record)
        │
        ├── goals
        │     └── goal_milestones
        │
        ├── tasks
        │
        ├── journals
        │
        ├── bookings (scheduling)
        │
        ├── conversations
        │     ├── conversation_participants
        │     └── messages
        │
        ├── events (hosted by mentor)
        │     └── event_attendees
        │
        ├── applications (submitted by visitor)
        │
        ├── notifications
        │
        ├── resources
        │
        ├── student_progress (per-program progress)
        │
        ├── student_timeline_events
        │
        ├── student_tags (many-to-many with tags)
        │
        ├── mentor_availability
        │
        ├── mentor_settings
        │
        ├── custom_forms
        │     └── form_submissions
        │
        ├── shared_files
        │
        ├── products
        │
        ├── transactions
        │
        └── announcements
```


## 6. Complete Table Definitions

### 6.1 `profiles`

Extends `auth.users`. One row per user, created automatically via trigger.

```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  first_name TEXT NOT NULL DEFAULT '',
  last_name TEXT NOT NULL DEFAULT '',
  role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('visitor', 'student', 'mentor', 'admin')),
  avatar_url TEXT,
  phone TEXT,
  application_status TEXT DEFAULT 'none' CHECK (application_status IN ('none', 'pending_review', 'approved', 'rejected')),
  health_status TEXT DEFAULT 'active' CHECK (health_status IN ('active', 'needs_attention', 'at_risk')),
  health_attendance_rate DECIMAL(5,2) DEFAULT 0,
  health_goal_completion_rate DECIMAL(5,2) DEFAULT 0,
  health_activity_level INTEGER DEFAULT 0,
  timezone TEXT DEFAULT 'America/New_York',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_health_status ON profiles(health_status);
CREATE INDEX idx_profiles_application_status ON profiles(application_status);
```

### 6.2 `programs`

Mentorship programs created by the mentor.

```sql
CREATE TABLE programs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  mentor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  duration TEXT,
  category TEXT,
  difficulty TEXT CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  visibility TEXT DEFAULT 'public' CHECK (visibility IN ('public', 'private')),
  outcomes TEXT[],
  skills_covered TEXT[],
  prerequisites TEXT,
  image TEXT,
  max_students INTEGER DEFAULT 0,
  student_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_programs_mentor_id ON programs(mentor_id);
CREATE INDEX idx_programs_status ON programs(status);
```

### 6.3 `program_enrollments`

Links students to programs.

```sql
CREATE TABLE program_enrollments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  program_id UUID NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'dropped')),
  enrolled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  UNIQUE(program_id, student_id)
);

CREATE INDEX idx_program_enrollments_student ON program_enrollments(student_id);
CREATE INDEX idx_program_enrollments_program ON program_enrollments(program_id);
```

### 6.4 `sessions`

1:1 session records between mentor and student.

```sql
CREATE TABLE sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  mentor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  program_id UUID REFERENCES programs(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  meeting_url TEXT,
  recording_url TEXT,
  attendance_status TEXT DEFAULT 'pending' CHECK (attendance_status IN ('pending', 'present', 'absent', 'excused')),
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled', 'no_show')),
  meeting_type TEXT DEFAULT 'video' CHECK (meeting_type IN ('video', 'phone', 'in_person')),
  session_type TEXT DEFAULT 'standard' CHECK (session_type IN ('standard', 'follow_up', 'check_in', 'emergency')),
  recurring_session_id UUID,
  reminder_sent BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_sessions_mentor_id ON sessions(mentor_id);
CREATE INDEX idx_sessions_student_id ON sessions(student_id);
CREATE INDEX idx_sessions_start_time ON sessions(start_time);
CREATE INDEX idx_sessions_attendance_status ON sessions(attendance_status);
```

### 6.5 `goals`

Student goals with progress tracking.

```sql
CREATE TABLE goals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  progress_percentage DECIMAL(5,2) DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed', 'cancelled')),
  blockers TEXT,
  notes TEXT,
  target_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_goals_student_id ON goals(student_id);
CREATE INDEX idx_goals_status ON goals(status);
```

### 6.6 `goal_milestones`

Individual milestones within a goal.

```sql
CREATE TABLE goal_milestones (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  goal_id UUID NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_goal_milestones_goal_id ON goal_milestones(goal_id);
```

### 6.7 `tasks`

Task activities assigned by mentor to students.

```sql
CREATE TABLE tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  mentor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  due_date TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'submitted', 'approved', 'rejected')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  file_url TEXT,
  feedback TEXT,
  submission_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_tasks_student_id ON tasks(student_id);
CREATE INDEX idx_tasks_mentor_id ON tasks(mentor_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);
```

### 6.8 `journals`

Student journal entries, visible to mentor.

```sql
CREATE TABLE journals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'daily' CHECK (type IN ('daily', 'weekly', 'milestone', 'reflection')),
  mood TEXT CHECK (mood IN ('great', 'good', 'neutral', 'bad', 'struggling')),
  content TEXT NOT NULL,
  wins TEXT,
  challenges TEXT,
  mentor_comments TEXT,
  reviewed_by_mentor BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_journals_student_id ON journals(student_id);
CREATE INDEX idx_journals_created_at ON journals(created_at);
```

### 6.9 `bookings`

Session scheduling records.

```sql
CREATE TABLE bookings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  mentor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  program_id UUID REFERENCES programs(id) ON DELETE SET NULL,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  status TEXT NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'completed', 'cancelled', 'rescheduled')),
  type TEXT DEFAULT 'standard' CHECK (type IN ('standard', 'consultation', 'follow_up')),
  meeting_link TEXT,
  notes TEXT,
  attendance TEXT DEFAULT 'pending' CHECK (attendance IN ('pending', 'present', 'absent', 'excused')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_bookings_student_id ON bookings(student_id);
CREATE INDEX idx_bookings_mentor_id ON bookings(mentor_id);
CREATE INDEX idx_bookings_date ON bookings(date);
CREATE INDEX idx_bookings_status ON bookings(status);
```

### 6.10 `conversations`

Messaging conversations (1:1 and group).

```sql
CREATE TABLE conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  is_group BOOLEAN DEFAULT FALSE,
  name TEXT,
  description TEXT,
  admin_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  last_message TEXT,
  last_message_time TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_conversations_last_message_time ON conversations(last_message_time DESC);
```

### 6.11 `conversation_participants`

Many-to-many between users and conversations.

```sql
CREATE TABLE conversation_participants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  last_read_at TIMESTAMPTZ,
  is_muted BOOLEAN DEFAULT FALSE,
  is_pinned BOOLEAN DEFAULT FALSE,
  UNIQUE(conversation_id, user_id)
);

CREATE INDEX idx_cp_conversation ON conversation_participants(conversation_id);
CREATE INDEX idx_cp_user ON conversation_participants(user_id);
```

### 6.12 `messages`

Individual messages within conversations.

```sql
CREATE TABLE messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'text' CHECK (type IN ('text', 'image', 'file', 'voice', 'system')),
  file_url TEXT,
  audio_url TEXT,
  duration INTEGER, -- seconds for voice messages
  reply_to_id UUID REFERENCES messages(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_messages_sender_id ON messages(sender_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);
```

### 6.13 `events`

Network events hosted by the mentor.

```sql
CREATE TABLE events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  mentor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  date DATE NOT NULL,
  time TIME,
  end_time TIME,
  timezone TEXT DEFAULT 'America/New_York',
  location TEXT,
  meeting_link TEXT,
  venue TEXT,
  image TEXT,
  capacity INTEGER NOT NULL DEFAULT 0 CHECK (capacity >= 0),
  registration_deadline TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'cancelled', 'completed')),
  visibility TEXT DEFAULT 'public' CHECK (visibility IN ('public', 'private')),
  tags TEXT[],
  speaker TEXT,
  waitlist_limit INTEGER DEFAULT 0,
  requirements TEXT,
  event_color TEXT,
  duration INTEGER, -- minutes
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_events_mentor_id ON events(mentor_id);
CREATE INDEX idx_events_date ON events(date);
CREATE INDEX idx_events_status ON events(status);
```

### 6.14 `event_attendees`

Event registration records.

```sql
CREATE TABLE event_attendees (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  registration_status TEXT NOT NULL DEFAULT 'registered' CHECK (registration_status IN ('registered', 'waitlisted', 'cancelled', 'attended')),
  attendance_status TEXT DEFAULT 'pending' CHECK (attendance_status IN ('pending', 'present', 'absent')),
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  feedback TEXT,
  registered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(event_id, user_id)
);

CREATE INDEX idx_event_attendees_event ON event_attendees(event_id);
CREATE INDEX idx_event_attendees_user ON event_attendees(user_id);
```

### 6.15 `applications`

Mentorship applications from visitors.

```sql
CREATE TABLE applications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  phone TEXT,
  discipline TEXT,
  reason_for_applying JSONB,
  status TEXT NOT NULL DEFAULT 'pending_review' CHECK (status IN ('pending_review', 'approved', 'rejected')),
  mentor_type TEXT,
  meeting_preference TEXT,
  frequency TEXT,
  seriousness TEXT,
  location TEXT,
  focus_area TEXT,
  program_id UUID REFERENCES programs(id) ON DELETE SET NULL,
  top_strength TEXT,
  needs_focus TEXT,
  linkedin_url TEXT,
  resume_url TEXT,
  reviewer_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  review_notes TEXT,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_applications_status ON applications(status);
CREATE INDEX idx_applications_email ON applications(email);
```

### 6.16 `notifications`

System notifications for users.

```sql
CREATE TABLE notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT,
  type TEXT DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error', 'message')),
  link TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);
```

### 6.17 `resources`

Curated resource links.

```sql
CREATE TABLE resources (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  mentor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  category TEXT,
  is_pinned BOOLEAN DEFAULT FALSE,
  lesson_id UUID, -- optional link to program lesson
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_resources_mentor_id ON resources(mentor_id);
CREATE INDEX idx_resources_category ON resources(category);
```

### 6.18 `student_progress`

Tracks program/lesson completion per student.

```sql
CREATE TABLE student_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  program_id UUID NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  lessons_completed TEXT[] DEFAULT '{}',
  quizzes_passed INTEGER DEFAULT 0,
  total_quizzes INTEGER DEFAULT 0,
  overall_progress DECIMAL(5,2) DEFAULT 0,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  UNIQUE(student_id, program_id)
);

CREATE INDEX idx_student_progress_student ON student_progress(student_id);
CREATE INDEX idx_student_progress_program ON student_progress(program_id);
```

### 6.19 `tags` and `student_tags`

Student categorization.

```sql
CREATE TABLE tags (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  mentor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  color TEXT DEFAULT '#6366f1',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE student_tags (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  UNIQUE(student_id, tag_id)
);

CREATE INDEX idx_student_tags_student ON student_tags(student_id);
CREATE INDEX idx_student_tags_tag ON student_tags(tag_id);
```

### 6.20 `mentor_availability`

Mentor's weekly schedule.

```sql
CREATE TABLE mentor_availability (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  mentor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_available BOOLEAN DEFAULT TRUE,
  UNIQUE(mentor_id, day_of_week, start_time, end_time)
);

CREATE INDEX idx_mentor_availability_mentor ON mentor_availability(mentor_id);
```

### 6.21 `mentor_settings`

Mentor preferences.

```sql
CREATE TABLE mentor_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  mentor_id UUID UNIQUE NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  timezone TEXT DEFAULT 'America/New_York',
  session_duration INTEGER DEFAULT 60, -- minutes
  buffer_time INTEGER DEFAULT 15, -- minutes between sessions
  working_days INTEGER[] DEFAULT '{1,2,3,4,5}', -- Mon-Fri
  available_hours_start TIME DEFAULT '09:00',
  available_hours_end TIME DEFAULT '17:00',
  notifications_enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### 6.22 `custom_forms`

Mentor-created form templates.

```sql
CREATE TABLE custom_forms (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  mentor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  fields JSONB NOT NULL DEFAULT '[]',
  assigned_to UUID REFERENCES profiles(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_custom_forms_mentor ON custom_forms(mentor_id);
```

### 6.23 `form_submissions`

Responses to custom forms.

```sql
CREATE TABLE form_submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  form_id UUID NOT NULL REFERENCES custom_forms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  responses JSONB NOT NULL DEFAULT '{}',
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_form_submissions_form ON form_submissions(form_id);
CREATE INDEX idx_form_submissions_user ON form_submissions(user_id);
```

### 6.24 `shared_files`

File metadata (actual files stored in Supabase Storage).

```sql
CREATE TABLE shared_files (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  type TEXT, -- MIME type
  category TEXT,
  size INTEGER, -- bytes
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_shared_files_user ON shared_files(user_id);
CREATE INDEX idx_shared_files_category ON shared_files(category);
```

### 6.25 `products`

Store products (mock/purchase tracking).

```sql
CREATE TABLE products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL DEFAULT 0,
  image TEXT,
  category TEXT,
  sales_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);
```

### 6.26 `transactions`

Revenue/financial records.

```sql
CREATE TABLE transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_name TEXT,
  amount DECIMAL(10,2) NOT NULL,
  date DATE NOT NULL,
  product TEXT,
  status TEXT DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'refunded', 'failed')),
  payment_method TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_transactions_date ON transactions(date);
CREATE INDEX idx_transactions_status ON transactions(status);
```

### 6.27 `announcements`

Platform announcements.

```sql
CREATE TABLE announcements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  program_type TEXT,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### 6.28 `surveys` and `survey_responses`

Feedback surveys.

```sql
CREATE TABLE surveys (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  mentor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'closed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE survey_responses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  survey_id UUID NOT NULL REFERENCES surveys(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  feedback TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(survey_id, user_id)
);

CREATE INDEX idx_survey_responses_survey ON survey_responses(survey_id);
```

### 6.29 `analytics_events`

Product analytics events (append-only).

```sql
CREATE TABLE analytics_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  properties JSONB DEFAULT '{}',
  page_url TEXT,
  session_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_analytics_events_type ON analytics_events(event_type);
CREATE INDEX idx_analytics_events_created_at ON analytics_events(created_at);
CREATE INDEX idx_analytics_events_user ON analytics_events(user_id);
```

### 6.30 `audit_logs`

Immutable audit trail for sensitive operations.

Refer to Section 4 above for schema.


## 7. Storage Buckets

| Bucket | Purpose | Public Read | Write Access | RLS |
|--------|---------|-------------|--------------|-----|
| `student-documents` | Student file submissions (resume, assignments) | No | Own student only | `(storage.foldername())[1] = auth.uid()::text` |
| `mentor-resources` | Mentor-shared resources, course materials | No | Mentor only | Mentor role check |
| `profile-avatars` | User profile pictures | Yes | Own user only | `auth.uid() = owner` |
| `event-files` | Event slides, recordings, banners | Yes (published events) | Mentor only | Mentor role check |

Maximum file size per upload: 10MB (Supabase Free limit: 5GB total storage)


## 8. Index Strategy Summary

| Category | Indexes |
|----------|---------|
| Foreign Keys | All FK columns indexed |
| Lookup Columns | `status`, `role`, `type`, `category` columns indexed |
| Time-based | `created_at`, `date`, `start_time`, `due_date` indexes for range queries |
| Composite | `(student_id, status)` for student dashboards |
| Full-Text | Optional: `to_tsvector('english', content)` on `journals.content` and `messages.content` |
| Unique | All UNIQUE constraints enforce business rules |


## 9. PostgreSQL Configuration Notes (for portability)

- Uses only standard PostgreSQL features
- No Supabase-specific SQL extensions (except `auth.users` reference and RLS policy helpers)
- `gen_random_uuid()` from `pgcrypto` (standard PostgreSQL, enabled by default in Supabase)
- `TIMESTAMPTZ` for all timezone-aware timestamps
- `JSONB` for flexible metadata fields
- Migrations use sequential numbering for clarity


## 10. Migration Order

```
001_profiles.sql
002_programs.sql
003_sessions.sql
004_goals.sql
005_tasks.sql
006_journals.sql
007_bookings.sql
008_messages.sql
009_events.sql
010_applications.sql
011_notifications.sql
012_resources.sql
013_surveys.sql
014_analytics.sql
015_supporting.sql (tags, availability, settings, forms, files, products, transactions, announcements, progress, timeline)
016_audit_logs.sql
900_auth_triggers.sql
999_rls.sql
```
