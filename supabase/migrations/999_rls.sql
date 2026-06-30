-- Enable RLS on all tables
alter table public.profiles enable row level security;
alter table public.programs enable row level security;
alter table public.program_enrollments enable row level security;
alter table public.sessions enable row level security;
alter table public.goals enable row level security;
alter table public.goal_milestones enable row level security;
alter table public.tasks enable row level security;
alter table public.journals enable row level security;
alter table public.bookings enable row level security;
alter table public.conversations enable row level security;
alter table public.conversation_participants enable row level security;
alter table public.messages enable row level security;
alter table public.events enable row level security;
alter table public.event_attendees enable row level security;
alter table public.event_files enable row level security;
alter table public.event_feedbacks enable row level security;
alter table public.event_recordings enable row level security;
alter table public.applications enable row level security;
alter table public.application_notes enable row level security;
alter table public.application_info_requests enable row level security;
alter table public.notifications enable row level security;
alter table public.tags enable row level security;
alter table public.student_tags enable row level security;
alter table public.resources enable row level security;
alter table public.student_progress enable row level security;
alter table public.student_timeline_events enable row level security;
alter table public.mentor_settings enable row level security;
alter table public.dashboard_layouts enable row level security;
alter table public.custom_forms enable row level security;
alter table public.form_templates enable row level security;
alter table public.form_submissions enable row level security;
alter table public.shared_files enable row level security;
alter table public.mentor_availability enable row level security;
alter table public.products enable row level security;
alter table public.transactions enable row level security;
alter table public.announcements enable row level security;
alter table public.ai_chat_history enable row level security;
alter table public.surveys enable row level security;
alter table public.survey_responses enable row level security;
alter table public.analytics_events enable row level security;

-- ============================
-- PROFILES
-- ============================
drop policy if exists "Users can read own profile" on public.profiles;
create policy "Users can read own profile"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "Mentors can read assigned students" on public.profiles;
create policy "Mentors can read assigned students"
  on public.profiles for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'mentor'
    )
  );

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

drop policy if exists "Mentors can update students they mentor" on public.profiles;
create policy "Mentors can update students they mentor"
  on public.profiles for update
  using (
    exists (
      select 1 from public.program_enrollments pe
      join public.programs pr on pe.program_id = pr.id
      where pe.student_id = profiles.id and pr.mentor_id = auth.uid()
    )
  );

-- ============================
-- PROGRAMS
-- ============================
drop policy if exists "Anyone can read published programs" on public.programs;
create policy "Anyone can read published programs"
  on public.programs for select
  using (visibility = 'public' and status = 'published');

drop policy if exists "Mentors can read their own programs" on public.programs;
create policy "Mentors can read their own programs"
  on public.programs for select
  using (mentor_id = auth.uid());

drop policy if exists "Mentors can insert programs" on public.programs;
create policy "Mentors can insert programs"
  on public.programs for insert
  with check (mentor_id = auth.uid());

drop policy if exists "Mentors can update their own programs" on public.programs;
create policy "Mentors can update their own programs"
  on public.programs for update
  using (mentor_id = auth.uid());

drop policy if exists "Mentors can delete their own programs" on public.programs;
create policy "Mentors can delete their own programs"
  on public.programs for delete
  using (mentor_id = auth.uid());

-- ============================
-- PROGRAM ENROLLMENTS
-- ============================
drop policy if exists "Students can read own enrollments" on public.program_enrollments;
create policy "Students can read own enrollments"
  on public.program_enrollments for select
  using (student_id = auth.uid());

drop policy if exists "Mentors can read enrollments for their programs" on public.program_enrollments;
create policy "Mentors can read enrollments for their programs"
  on public.program_enrollments for select
  using (
    exists (
      select 1 from public.programs
      where programs.id = program_enrollments.program_id and programs.mentor_id = auth.uid()
    )
  );

drop policy if exists "Students can enroll themselves" on public.program_enrollments;
create policy "Students can enroll themselves"
  on public.program_enrollments for insert
  with check (student_id = auth.uid());

drop policy if exists "Mentors can update enrollments" on public.program_enrollments;
create policy "Mentors can update enrollments"
  on public.program_enrollments for update
  using (
    exists (
      select 1 from public.programs
      where programs.id = program_enrollments.program_id and programs.mentor_id = auth.uid()
    )
  );

-- ============================
-- SESSIONS
-- ============================
drop policy if exists "Participants can read sessions" on public.sessions;
create policy "Participants can read sessions"
  on public.sessions for select
  using (student_id = auth.uid() or mentor_id = auth.uid());

drop policy if exists "Mentors can insert sessions" on public.sessions;
create policy "Mentors can insert sessions"
  on public.sessions for insert
  with check (mentor_id = auth.uid());

drop policy if exists "Mentors can update sessions" on public.sessions;
create policy "Mentors can update sessions"
  on public.sessions for update
  using (mentor_id = auth.uid());

drop policy if exists "Students can update attendance" on public.sessions;
create policy "Students can update attendance"
  on public.sessions for update
  using (student_id = auth.uid());

-- ============================
-- GOALS
-- ============================
drop policy if exists "Students can read own goals" on public.goals;
create policy "Students can read own goals"
  on public.goals for select
  using (student_id = auth.uid());

drop policy if exists "Mentors can read students goals" on public.goals;
create policy "Mentors can read students goals"
  on public.goals for select
  using (
    exists (
      select 1 from public.program_enrollments pe
      join public.programs pr on pe.program_id = pr.id
      where pe.student_id = goals.student_id and pr.mentor_id = auth.uid()
    )
  );

drop policy if exists "Students can insert goals" on public.goals;
create policy "Students can insert goals"
  on public.goals for insert
  with check (student_id = auth.uid());

drop policy if exists "Students can update own goals" on public.goals;
create policy "Students can update own goals"
  on public.goals for update
  using (student_id = auth.uid());

drop policy if exists "Mentors can update students goals" on public.goals;
create policy "Mentors can update students goals"
  on public.goals for update
  using (
    exists (
      select 1 from public.program_enrollments pe
      join public.programs pr on pe.program_id = pr.id
      where pe.student_id = goals.student_id and pr.mentor_id = auth.uid()
    )
  );

-- ============================
-- GOAL MILESTONES
-- ============================
drop policy if exists "Goal milestones inherit goal policies" on public.goal_milestones;
create policy "Goal milestones inherit goal policies"
  on public.goal_milestones for select
  using (
    exists (select 1 from public.goals where goals.id = goal_milestones.goal_id)
  );

drop policy if exists "Students can manage own milestones" on public.goal_milestones;
create policy "Students can manage own milestones"
  on public.goal_milestones for insert
  with check (
    exists (select 1 from public.goals where goals.id = goal_id and goals.student_id = auth.uid())
  );

drop policy if exists "Mentors can manage milestones" on public.goal_milestones;
create policy "Mentors can manage milestones"
  on public.goal_milestones for insert
  with check (
    exists (
      select 1 from public.goals g
      join public.program_enrollments pe on g.student_id = pe.student_id
      join public.programs pr on pe.program_id = pr.id
      where g.id = goal_id and pr.mentor_id = auth.uid()
    )
  );

-- ============================
-- TASKS
-- ============================
drop policy if exists "Task participants can read" on public.tasks;
create policy "Task participants can read"
  on public.tasks for select
  using (student_id = auth.uid() or mentor_id = auth.uid());

drop policy if exists "Mentors can insert tasks" on public.tasks;
create policy "Mentors can insert tasks"
  on public.tasks for insert
  with check (mentor_id = auth.uid());

drop policy if exists "Mentors can update tasks" on public.tasks;
create policy "Mentors can update tasks"
  on public.tasks for update
  using (mentor_id = auth.uid());

drop policy if exists "Students can update task status" on public.tasks;
create policy "Students can update task status"
  on public.tasks for update
  using (student_id = auth.uid());

-- ============================
-- JOURNALS
-- ============================
drop policy if exists "Students can read own journals" on public.journals;
create policy "Students can read own journals"
  on public.journals for select
  using (student_id = auth.uid());

drop policy if exists "Mentors can read students journals" on public.journals;
create policy "Mentors can read students journals"
  on public.journals for select
  using (
    exists (
      select 1 from public.program_enrollments pe
      join public.programs pr on pe.program_id = pr.id
      where pe.student_id = journals.student_id and pr.mentor_id = auth.uid()
    )
  );

drop policy if exists "Students can insert journals" on public.journals;
create policy "Students can insert journals"
  on public.journals for insert
  with check (student_id = auth.uid());

drop policy if exists "Students can update own journals" on public.journals;
create policy "Students can update own journals"
  on public.journals for update
  using (student_id = auth.uid());

-- ============================
-- BOOKINGS
-- ============================
drop policy if exists "Users can read own bookings" on public.bookings;
create policy "Users can read own bookings"
  on public.bookings for select
  using (user_id = auth.uid());

drop policy if exists "Mentors can read all bookings" on public.bookings;
create policy "Mentors can read all bookings"
  on public.bookings for select
  using (
    exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.role = 'mentor')
  );

drop policy if exists "Users can insert own bookings" on public.bookings;
create policy "Users can insert own bookings"
  on public.bookings for insert
  with check (user_id = auth.uid());

drop policy if exists "Mentors can update bookings" on public.bookings;
create policy "Mentors can update bookings"
  on public.bookings for update
  using (
    exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.role = 'mentor')
  );

-- ============================
-- MESSAGES & CONVERSATIONS
-- ============================
-- Conversations: SELECT
drop policy if exists "Participants can read conversations" on public.conversations;
create policy "Participants can read conversations"
  on public.conversations for select
  using (
    auth.uid() = mentor_id or auth.uid() = student_id or
    auth.uid() in (
      select user_id from public.conversation_participants
      where conversation_id = conversations.id
    )
  );

-- Conversations: INSERT (mentors create conversations)
drop policy if exists "Mentors can create conversations" on public.conversations;
create policy "Mentors can create conversations"
  on public.conversations for insert
  with check (mentor_id = auth.uid());

-- Conversations: UPDATE (participants can update)
drop policy if exists "Participants can update conversations" on public.conversations;
create policy "Participants can update conversations"
  on public.conversations for update
  using (
    auth.uid() = mentor_id or auth.uid() = student_id or
    auth.uid() in (
      select user_id from public.conversation_participants
      where conversation_id = conversations.id
    )
  );

-- Conversations: DELETE (mentors can delete own)
drop policy if exists "Mentors can delete conversations" on public.conversations;
create policy "Mentors can delete conversations"
  on public.conversations for delete
  using (mentor_id = auth.uid());

-- Conversation participants: SELECT
drop policy if exists "Users can read own participant records" on public.conversation_participants;
create policy "Users can read own participant records"
  on public.conversation_participants for select
  using (user_id = auth.uid());

-- Conversation participants: INSERT (mentors add participants to their conversations)
drop policy if exists "Mentors can add participants" on public.conversation_participants;
create policy "Mentors can add participants"
  on public.conversation_participants for insert
  with check (
    exists (
      select 1 from public.conversations
      where id = conversation_id and mentor_id = auth.uid()
    )
  );

-- Conversation participants: DELETE (mentors can remove participants)
drop policy if exists "Mentors can remove participants" on public.conversation_participants;
create policy "Mentors can remove participants"
  on public.conversation_participants for delete
  using (
    exists (
      select 1 from public.conversations
      where id = conversation_id and mentor_id = auth.uid()
    )
  );

-- Messages: INSERT
drop policy if exists "Participants can insert messages" on public.messages;
create policy "Participants can insert messages"
  on public.messages for insert
  with check (
    exists (
      select 1 from public.conversation_participants
      where conversation_id = messages.conversation_id and user_id = auth.uid()
    )
  );

-- Messages: SELECT
drop policy if exists "Participants can read messages" on public.messages;
create policy "Participants can read messages"
  on public.messages for select
  using (
    exists (
      select 1 from public.conversation_participants
      where conversation_id = messages.conversation_id and user_id = auth.uid()
    )
  );

-- Messages: UPDATE (own messages)
drop policy if exists "Users can update own messages" on public.messages;
create policy "Users can update own messages"
  on public.messages for update
  using (sender_id = auth.uid());

-- Messages: UPDATE (mark as read — any participant can update status)
drop policy if exists "Participants can update message status" on public.messages;
create policy "Participants can update message status"
  on public.messages for update
  using (
    exists (
      select 1 from public.conversation_participants
      where conversation_id = messages.conversation_id and user_id = auth.uid()
    )
  );

-- ============================
-- EVENTS
-- ============================
drop policy if exists "Anyone can read published events" on public.events;
create policy "Anyone can read published events"
  on public.events for select
  using (visibility = 'public');

drop policy if exists "Mentors can create events" on public.events;
create policy "Mentors can create events"
  on public.events for insert
  with check (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'mentor')
  );

drop policy if exists "Mentors can update own events" on public.events;
create policy "Mentors can update own events"
  on public.events for update
  using (created_by = auth.uid());

-- ============================
-- APPLICATIONS
-- ============================
drop policy if exists "Users can read own applications" on public.applications;
create policy "Users can read own applications"
  on public.applications for select
  using (user_id = auth.uid());

drop policy if exists "Mentors can read all applications" on public.applications;
create policy "Mentors can read all applications"
  on public.applications for select
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'mentor')
  );

drop policy if exists "Anyone can submit application" on public.applications;
create policy "Anyone can submit application"
  on public.applications for insert
  with check (true);

drop policy if exists "Mentors can update applications" on public.applications;
create policy "Mentors can update applications"
  on public.applications for update
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'mentor')
  );

-- ============================
-- NOTIFICATIONS
-- ============================
drop policy if exists "Users can read own notifications" on public.notifications;
create policy "Users can read own notifications"
  on public.notifications for select
  using (user_id = auth.uid());

drop policy if exists "Users can update own notifications" on public.notifications;
create policy "Users can update own notifications"
  on public.notifications for update
  using (user_id = auth.uid());

-- ============================
-- SUPPLEMENTARY TABLES
-- ============================
-- Tags: anyone authenticated can read
drop policy if exists "Authenticated users can read tags" on public.tags;
create policy "Authenticated users can read tags"
  on public.tags for select
  using (auth.role() = 'authenticated');

-- Resources: anyone authenticated can read
drop policy if exists "Authenticated users can read resources" on public.resources;
create policy "Authenticated users can read resources"
  on public.resources for select
  using (auth.role() = 'authenticated');

drop policy if exists "Mentors can manage resources" on public.resources;
create policy "Mentors can manage resources"
  on public.resources for insert
  with check (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'mentor')
  );

-- Mentor settings: own only
drop policy if exists "Mentors can read own settings" on public.mentor_settings;
create policy "Mentors can read own settings"
  on public.mentor_settings for select
  using (mentor_id = auth.uid());

drop policy if exists "Mentors can manage own settings" on public.mentor_settings;
create policy "Mentors can manage own settings"
  on public.mentor_settings for insert
  with check (mentor_id = auth.uid());

drop policy if exists "Mentors can update own settings" on public.mentor_settings;
create policy "Mentors can update own settings"
  on public.mentor_settings for update
  using (mentor_id = auth.uid());

-- Dashboard layouts: own only
drop policy if exists "Users can read own layout" on public.dashboard_layouts;
create policy "Users can read own layout"
  on public.dashboard_layouts for select
  using (user_id = auth.uid());

drop policy if exists "Users can manage own layout" on public.dashboard_layouts;
create policy "Users can manage own layout"
  on public.dashboard_layouts for insert
  with check (user_id = auth.uid());

-- Custom forms: mentors and assigned users
drop policy if exists "Mentors can read custom forms" on public.custom_forms;
create policy "Mentors can read custom forms"
  on public.custom_forms for select
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'mentor')
  );

drop policy if exists "Mentors can create custom forms" on public.custom_forms;
create policy "Mentors can create custom forms"
  on public.custom_forms for insert
  with check (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'mentor')
  );

drop policy if exists "Creators can update custom forms" on public.custom_forms;
create policy "Creators can update custom forms"
  on public.custom_forms for update
  using (created_by = auth.uid());

-- Form templates: mentors and creators
drop policy if exists "Mentors can read form templates" on public.form_templates;
create policy "Mentors can read form templates"
  on public.form_templates for select
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'mentor')
  );

drop policy if exists "Mentors can create form templates" on public.form_templates;
create policy "Mentors can create form templates"
  on public.form_templates for insert
  with check (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'mentor')
  );

drop policy if exists "Creators can update form templates" on public.form_templates;
create policy "Creators can update form templates"
  on public.form_templates for update
  using (created_by = auth.uid());

-- Form submissions: own or mentor
drop policy if exists "Users can read own submissions" on public.form_submissions;
create policy "Users can read own submissions"
  on public.form_submissions for select
  using (user_id = auth.uid());

drop policy if exists "Users can submit forms" on public.form_submissions;
create policy "Users can submit forms"
  on public.form_submissions for insert
  with check (user_id = auth.uid());

-- Shared files: own or mentor of student
drop policy if exists "Users can read own files" on public.shared_files;
create policy "Users can read own files"
  on public.shared_files for select
  using (user_id = auth.uid());

-- Surveys
drop policy if exists "Authenticated users can read surveys" on public.surveys;
create policy "Authenticated users can read surveys"
  on public.surveys for select
  using (auth.role() = 'authenticated');

drop policy if exists "Users can submit survey responses" on public.survey_responses;
create policy "Users can submit survey responses"
  on public.survey_responses for insert
  with check (user_id = auth.uid());

-- Student progress: own or mentor
drop policy if exists "Students can read own progress" on public.student_progress;
create policy "Students can read own progress"
  on public.student_progress for select
  using (user_id = auth.uid());

drop policy if exists "Mentors can read students progress" on public.student_progress;
create policy "Mentors can read students progress"
  on public.student_progress for select
  using (
    exists (
      select 1 from public.programs
      where programs.id = student_progress.program_id and programs.mentor_id = auth.uid()
    )
  );

-- AI chat history: own only
drop policy if exists "Users can read own AI chats" on public.ai_chat_history;
create policy "Users can read own AI chats"
  on public.ai_chat_history for select
  using (user_id = auth.uid());

drop policy if exists "Users can insert own AI chats" on public.ai_chat_history;
create policy "Users can insert own AI chats"
  on public.ai_chat_history for insert
  with check (user_id = auth.uid());

-- Analytics: insert only (appending events)
drop policy if exists "Authenticated users can insert analytics" on public.analytics_events;
create policy "Authenticated users can insert analytics"
  on public.analytics_events for insert
  with check (auth.role() = 'authenticated');

-- ============================
-- EVENT CHILD TABLES
-- ============================
-- Event attendees
drop policy if exists "Authenticated users can read event attendees" on public.event_attendees;
create policy "Authenticated users can read event attendees"
  on public.event_attendees for select
  using (auth.role() = 'authenticated');

drop policy if exists "Users can register for events" on public.event_attendees;
create policy "Users can register for events"
  on public.event_attendees for insert
  with check (auth.uid() = user_id);

drop policy if exists "Event creators can update attendees" on public.event_attendees;
create policy "Event creators can update attendees"
  on public.event_attendees for update
  using (
    exists (select 1 from public.events where events.id = event_id and events.created_by = auth.uid())
  );

drop policy if exists "Event creators can delete attendees" on public.event_attendees;
create policy "Event creators can delete attendees"
  on public.event_attendees for delete
  using (
    exists (select 1 from public.events where events.id = event_id and events.created_by = auth.uid())
  );

-- Event files
drop policy if exists "Authenticated users can read event files" on public.event_files;
create policy "Authenticated users can read event files"
  on public.event_files for select
  using (auth.role() = 'authenticated');

drop policy if exists "Event creators can insert files" on public.event_files;
create policy "Event creators can insert files"
  on public.event_files for insert
  with check (
    exists (select 1 from public.events where events.id = event_id and events.created_by = auth.uid())
  );

drop policy if exists "Event creators can update files" on public.event_files;
create policy "Event creators can update files"
  on public.event_files for update
  using (
    exists (select 1 from public.events where events.id = event_id and events.created_by = auth.uid())
  );

drop policy if exists "Event creators can delete files" on public.event_files;
create policy "Event creators can delete files"
  on public.event_files for delete
  using (
    exists (select 1 from public.events where events.id = event_id and events.created_by = auth.uid())
  );

-- Event feedbacks
drop policy if exists "Authenticated users can read event feedbacks" on public.event_feedbacks;
create policy "Authenticated users can read event feedbacks"
  on public.event_feedbacks for select
  using (auth.role() = 'authenticated');

drop policy if exists "Attendees can submit feedback" on public.event_feedbacks;
create policy "Attendees can submit feedback"
  on public.event_feedbacks for insert
  with check (
    exists (select 1 from public.event_attendees where event_id = event_feedbacks.event_id and user_id = auth.uid())
  );

-- Event recordings
drop policy if exists "Authenticated users can read event recordings" on public.event_recordings;
create policy "Authenticated users can read event recordings"
  on public.event_recordings for select
  using (auth.role() = 'authenticated');

drop policy if exists "Event creators can insert recordings" on public.event_recordings;
create policy "Event creators can insert recordings"
  on public.event_recordings for insert
  with check (
    exists (select 1 from public.events where events.id = event_id and events.created_by = auth.uid())
  );

drop policy if exists "Event creators can update recordings" on public.event_recordings;
create policy "Event creators can update recordings"
  on public.event_recordings for update
  using (
    exists (select 1 from public.events where events.id = event_id and events.created_by = auth.uid())
  );

drop policy if exists "Event creators can delete recordings" on public.event_recordings;
create policy "Event creators can delete recordings"
  on public.event_recordings for delete
  using (
    exists (select 1 from public.events where events.id = event_id and events.created_by = auth.uid())
  );

-- ============================
-- APPLICATION NOTES
-- ============================
drop policy if exists "Users can read own application notes" on public.application_notes;
create policy "Users can read own application notes"
  on public.application_notes for select
  using (author_id = auth.uid());

drop policy if exists "Users can create application notes" on public.application_notes;
create policy "Users can create application notes"
  on public.application_notes for insert
  with check (author_id = auth.uid());

drop policy if exists "Users can update own application notes" on public.application_notes;
create policy "Users can update own application notes"
  on public.application_notes for update
  using (author_id = auth.uid());

-- ============================
-- PRODUCTS (STORE)
-- ============================
drop policy if exists "Anyone can read products" on public.products;
create policy "Anyone can read products"
  on public.products for select
  using (true);

drop policy if exists "Mentors can insert products" on public.products;
create policy "Mentors can insert products"
  on public.products for insert
  with check (exists (select 1 from public.profiles where id = auth.uid() and role = 'mentor'));

-- ============================
-- TRANSACTIONS
-- ============================
drop policy if exists "Users can read own transactions" on public.transactions;
create policy "Users can read own transactions"
  on public.transactions for select
  using (user_id = auth.uid());

drop policy if exists "Users can create transactions" on public.transactions;
create policy "Users can create transactions"
  on public.transactions for insert
  with check (user_id = auth.uid());

-- ============================
-- ANNOUNCEMENTS
-- ============================
drop policy if exists "Authenticated users can read announcements" on public.announcements;
create policy "Authenticated users can read announcements"
  on public.announcements for select
  using (auth.role() = 'authenticated');

drop policy if exists "Mentors can create announcements" on public.announcements;
create policy "Mentors can create announcements"
  on public.announcements for insert
  with check (exists (select 1 from public.profiles where id = auth.uid() and role = 'mentor'));

-- ============================
-- MENTOR AVAILABILITY
-- ============================
drop policy if exists "Mentors can read own availability" on public.mentor_availability;
create policy "Mentors can read own availability"
  on public.mentor_availability for select
  using (mentor_id = auth.uid());

drop policy if exists "Mentors can manage own availability" on public.mentor_availability;
create policy "Mentors can manage own availability"
  on public.mentor_availability for insert
  with check (mentor_id = auth.uid());

drop policy if exists "Mentors can update own availability" on public.mentor_availability;
create policy "Mentors can update own availability"
  on public.mentor_availability for update
  using (mentor_id = auth.uid());

-- ============================
-- STUDENT TAGS
-- ============================
drop policy if exists "Authenticated users can read student tags" on public.student_tags;
create policy "Authenticated users can read student tags"
  on public.student_tags for select
  using (auth.role() = 'authenticated');

drop policy if exists "Mentors can manage student tags" on public.student_tags;
create policy "Mentors can manage student tags"
  on public.student_tags for insert
  with check (exists (select 1 from public.profiles where id = auth.uid() and role = 'mentor'));

-- ============================
-- STUDENT TIMELINE EVENTS
-- ============================
drop policy if exists "Students can read own timeline" on public.student_timeline_events;
create policy "Students can read own timeline"
  on public.student_timeline_events for select
  using (student_id = auth.uid());

drop policy if exists "Mentors can create timeline events" on public.student_timeline_events;
create policy "Mentors can create timeline events"
  on public.student_timeline_events for insert
  with check (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'mentor')
  );

