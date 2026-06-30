-- Mentorino seed data
-- This seeds the database with demo data for local development

-- ============================
-- TAGS
-- ============================
insert into public.tags (label, color) values
  ('High Potential', '#10b981'),
  ('Needs Support', '#f59e0b'),
  ('Placement Ready', '#3b82f6'),
  ('Backend Expert', '#8b5cf6'),
  ('FinTech', '#06b6d4')
on conflict (label) do nothing;

-- ============================
-- PROGRAMS
-- ============================
do $$
declare
  v_mentor_id uuid;
  p1_id uuid := gen_random_uuid();
  p2_id uuid := gen_random_uuid();
begin
  select id into v_mentor_id from public.profiles where email = 'mentor@mentorino.com' limit 1;
  if v_mentor_id is null then
    raise notice 'Mentor profile not found, skipping program seed';
    return;
  end if;

  insert into public.programs (id, title, description, duration, mentor_id, category, difficulty, status, visibility, student_count, outcomes, skills_covered) values
    (p1_id, 'Software Architecture Elite Mentorship', 'Master system design, architecture patterns, and engineering leadership.', '12 weeks', v_mentor_id, 'Engineering', 'Advanced', 'published', 'public', 5,
      '["Design scalable systems", "Lead technical discussions", "Master architecture patterns"]'::jsonb,
      '["System Design", "Microservices", "Cloud Architecture"]'::jsonb),
    (p2_id, 'Product Leadership Accelerator', 'From PM to product leader. Strategy, execution, and stakeholder management.', '10 weeks', v_mentor_id, 'Product', 'Intermediate', 'published', 'public', 3,
      '["Define product strategy", "Run effective sprints", "Lead cross-functional teams"]'::jsonb,
      '["Product Strategy", "Agile", "Stakeholder Management"]'::jsonb)
  on conflict (id) do nothing;
end;
$$;

-- ============================
-- RESOURCES
-- ============================
insert into public.resources (title, url, category, is_pinned) values
  ('System Design Interview Guide', '#', 'Engineering', true),
  ('Product Strategy Framework', '#', 'Product', true),
  ('Resume Template & Checklist', '#', 'Career', false),
  ('Mock Interview Questions Bank', '#', 'Interview Prep', false);

-- ============================
-- EVENTS
-- ============================
insert into public.events (title, location, date, time, description, status, visibility) values
  ('Summer Networking Mixer', 'Zoom', 'Jul 15, 2026', '6:00 PM', 'Connect with mentors and students in a relaxed setting.', 'published', 'public'),
  ('Resume Review Workshop', 'Google Meet', 'Aug 02, 2026', '4:00 PM', 'Learn how to beat the ATS and land more interviews.', 'published', 'public'),
  ('Tech Interview Panel', 'Zoom', 'Sep 10, 2026', '5:30 PM', 'Panel discussion with senior engineers from top tech companies.', 'published', 'public'),
  ('PM Case Workshop', 'WebEx', 'Oct 05, 2026', '6:00 PM', 'Interactive workshop on solving product cases.', 'published', 'public'),
  ('Alumni Q&A Session', 'Zoom', 'Nov 12, 2026', '7:00 PM', 'Ask questions to successful alumni working in your target industry.', 'published', 'public'),
  ('Salary Negotiation Masterclass', 'Google Meet', 'Dec 01, 2026', '5:00 PM', 'Learn actionable strategies for negotiating job offers.', 'published', 'public');

-- ============================
-- PRODUCTS
-- ============================
insert into public.products (name, description, price, category, status) values
  ('1-on-1 Career Coaching Session', 'Personalized career coaching session', 150.00, 'Coaching', 'active'),
  ('Resume Review Package', 'Detailed resume review with feedback', 75.00, 'Career', 'active'),
  ('Mock Interview Bundle', '3 mock interview sessions', 200.00, 'Interview Prep', 'active');

-- ============================
-- ANNOUNCEMENTS
-- ============================
insert into public.announcements (title, content, priority) values
  ('Welcome to the Program!', 'We are excited to have you onboard. Your first session is scheduled for next week.', 'high'),
  ('New Workshop Added', 'Check out the new System Design workshop added to the curriculum.', 'medium');

-- ============================
-- GOALS + JOURNALS + TASKS + SESSIONS + NOTIFICATIONS (for Alex Rivera)
-- ============================
do $$
declare
  v_mentor_id uuid;
  alex_id uuid;
  aisha_id uuid;
begin
  select id into v_mentor_id from public.profiles where email = 'mentor@mentorino.com' limit 1;
  select id into alex_id from public.profiles where email = 'alex@example.com' limit 1;
  select id into aisha_id from public.profiles where email = 'aisha@example.com' limit 1;

  if alex_id is not null then
    insert into public.goals (student_id, title, description, progress_percentage, status) values
      (alex_id, 'Complete Resume Revision', 'Update the resume with recent internship details and format perfectly.', 100, 'completed'),
      (alex_id, 'Conduct 5 Informational Interviews', 'Reach out to PMs on LinkedIn and conduct 30 min chats.', 40, 'in_progress'),
      (alex_id, 'Finalize Portfolio Website', 'Ship version 1 of portfolio website on Vercel.', 0, 'not_started');

    insert into public.journals (student_id, type, content, mood, wins, challenges, reviewed_by_mentor, mentor_comments) values
      (alex_id, 'daily', 'Today was productive. I reached out to 5 PMs on LinkedIn, 2 replied already!', 'good',
        '["Sent LinkedIn messages", "Got replies"]'::jsonb, '["Felt nervous sending cold messages"]'::jsonb, true,
        '["Great job pushing past the nervousness!"]'::jsonb),
      (alex_id, 'weekly', 'This week I focused mostly on my resume and getting it reviewed.', 'okay',
        '["Finished V2 of resume"]'::jsonb, '["Time management was poor this week"]'::jsonb, false, '[]'::jsonb);
  end if;

  if v_mentor_id is not null and alex_id is not null then
    insert into public.sessions (mentor_id, student_id, title, description, start_time, end_time, meeting_url, attendance_status, status, notes) values
      (v_mentor_id, alex_id, 'Introductory Call', 'First meeting to discuss goals and roadmap.',
        now() + interval '1 day', now() + interval '1 day' + interval '1 hour',
        'https://meet.google.com/abc-defg-hij', 'pending', 'scheduled', null),
      (v_mentor_id, alex_id, 'Resume Review', 'Deep dive into resume bullet points and formatting.',
        now() + interval '3 days', now() + interval '3 days' + interval '45 minutes',
        'https://meet.google.com/jkl-mnop-qrs', 'pending', 'scheduled', null),
      (v_mentor_id, alex_id, 'Career Strategy Session', 'Discuss career transition strategy and milestones.',
        now() - interval '7 days', now() - interval '7 days' + interval '1 hour',
        null, 'attended', 'completed', 'Discussed career goals. Next steps: update resume and start networking.');

    insert into public.tasks (student_id, mentor_id, title, description, due_date, status) values
      (alex_id, v_mentor_id, 'Submit updated resume PDF', 'Make sure it is 1 page and export as PDF.', now() + interval '3 days', 'pending'),
      (alex_id, v_mentor_id, 'Read PM Interview guide chapter 1', 'Read the first chapter and write down 3 key takeaways.', now() + interval '5 days', 'in_progress'),
      (alex_id, v_mentor_id, 'Draft cover letter for Startup X', 'Use the framework we discussed in the last session.', now() - interval '1 day', 'completed');

    insert into public.notifications (user_id, title, message, read, type) values
      (alex_id, 'New Task Assigned', 'Sarah assigned you a new task: Submit updated resume PDF.', false, 'task'),
      (alex_id, 'Session Scheduled', 'Resume Review session scheduled for this Thursday at 2:00 PM.', true, 'session');
  end if;

  if v_mentor_id is not null and aisha_id is not null then
    insert into public.sessions (mentor_id, student_id, title, description, start_time, end_time, meeting_url, attendance_status, status) values
      (v_mentor_id, aisha_id, 'System Design Review', 'Review system design exercise for URL shortener.',
        now() + interval '2 days', now() + interval '2 days' + interval '1 hour',
        'https://meet.google.com/xyz-uvwx-yz', 'pending', 'scheduled');

    insert into public.tasks (student_id, mentor_id, title, description, due_date, status) values
      (aisha_id, v_mentor_id, 'Complete System Design exercise', 'Design a URL shortener service.', now() + interval '2 days', 'in_progress');
  end if;

  if v_mentor_id is not null then
    insert into public.notifications (user_id, title, message, read, type) values
      (v_mentor_id, 'New Application', 'Alex Rivera submitted an application for the mentorship program.', false, 'system'),
      (v_mentor_id, 'Session Reminder', 'Introductory call with Alex Rivera is tomorrow at 10:00 AM.', false, 'session'),
      (v_mentor_id, 'Task Completed', 'Alex Rivera completed "Draft cover letter for Startup X".', false, 'task');
  end if;
end;
$$;

-- ============================
-- MENTOR SETTINGS
-- ============================
do $$
declare
  v_mentor_id uuid;
begin
  select id into v_mentor_id from public.profiles where email = 'mentor@mentorino.com' limit 1;

  if v_mentor_id is not null then
    insert into public.mentor_settings (mentor_id, timezone, session_duration, buffer_time, working_days, available_hours_start, available_hours_end) values
      (v_mentor_id, 'America/New_York', 45, 15, '{1,2,3,4,5}'::integer[], '09:00', '17:00')
    on conflict (mentor_id) do nothing;
  end if;
end;
$$;
