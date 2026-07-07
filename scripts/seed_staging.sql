DO $$
DECLARE
  v_mentor_id uuid := 'dec15a7d-a085-49ca-b4a5-d00200d496a5';
  v_s1_id uuid := 'da44529b-2dcd-4701-a9fd-4bf732485c89';
  v_s2_id uuid := 'af8b4002-6d82-40d3-a7e3-0d0743da2ca2';
  v_prog1_id uuid := '00000000-0000-0000-0000-000000000010';
  v_prog2_id uuid := '00000000-0000-0000-0000-000000000011';
  v_conv1_id uuid := '00000000-0000-0000-0000-000000000100';
  v_conv2_id uuid := '00000000-0000-0000-0000-000000000101';
  v_goal1_id uuid := '00000000-0000-0000-0000-000000000200';
  v_goal2_id uuid := '00000000-0000-0000-0000-000000000201';
  v_task1_id uuid := '00000000-0000-0000-0000-000000000300';
  v_task2_id uuid := '00000000-0000-0000-0000-000000000301';
  v_journal1_id uuid := '00000000-0000-0000-0000-000000000400';
  v_session1_id uuid := '00000000-0000-0000-0000-000000000500';
  v_session2_id uuid := '00000000-0000-0000-0000-000000000501';
  v_event1_id uuid := '00000000-0000-0000-0000-000000000600';
  v_res1_id uuid := '00000000-0000-0000-0000-000000000700';
  v_res2_id uuid := '00000000-0000-0000-0000-000000000701';
  v_notif1_id uuid := '00000000-0000-0000-0000-000000000800';
  v_notif2_id uuid := '00000000-0000-0000-0000-000000000801';
  v_notif3_id uuid := '00000000-0000-0000-0000-000000000802';
BEGIN

ALTER TABLE public.profiles DISABLE TRIGGER on_student_crm_created;
ALTER TABLE public.profiles DISABLE TRIGGER on_student_login_track;
ALTER TABLE public.programs DISABLE TRIGGER IF EXISTS set_updated_at;
ALTER TABLE public.goals DISABLE TRIGGER IF EXISTS set_updated_at;
ALTER TABLE public.tasks DISABLE TRIGGER IF EXISTS set_updated_at;
ALTER TABLE public.sessions DISABLE TRIGGER IF EXISTS set_updated_at;
ALTER TABLE public.events DISABLE TRIGGER IF EXISTS set_updated_at;
ALTER TABLE public.conversations DISABLE TRIGGER IF EXISTS set_updated_at;

-- Programs
INSERT INTO public.programs (id, title, description, duration, status, category)
VALUES (v_prog1_id, 'Product Management Foundations', 'Learn the fundamentals of product management.', '12 weeks', 'active', 'Career Development'),
       (v_prog2_id, 'Cybersecurity Essentials', 'Master core concepts of cybersecurity.', '16 weeks', 'active', 'Technical Skills')
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title;

-- Profiles
INSERT INTO public.profiles (id, email, name, role, status, health_status, growth_score, metrics, tags, application_status)
VALUES (v_mentor_id, 'mentor.qa@mentorino.test', 'QA Mentor', 'mentor', 'active', 'active', 0, '{}', ARRAY['qa','mentor'], 'approved'),
       (v_s1_id, 'student1.qa@mentorino.test', 'QA Student One', 'student', 'active', 'active', 75, '{}', ARRAY['qa','student'], 'approved'),
       (v_s2_id, 'student2.qa@mentorino.test', 'QA Student Two', 'student', 'active', 'active', 45, '{}', ARRAY['qa','student'], 'approved')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, role = EXCLUDED.role;

-- Link mentor & programs
UPDATE public.profiles SET mentor_id = v_mentor_id, program_id = v_prog1_id WHERE id = v_s1_id;
UPDATE public.profiles SET mentor_id = v_mentor_id, program_id = v_prog2_id WHERE id = v_s2_id;

-- Enrollments
INSERT INTO public.program_enrollments (student_id, program_id, status) VALUES (v_s1_id, v_prog1_id, 'active'), (v_s2_id, v_prog2_id, 'active') ON CONFLICT DO NOTHING;

-- Applications
INSERT INTO public.applications (user_id, email, full_name, user_email, status, program_id, mentor_type, goal, meeting_preference, frequency, seriousness)
VALUES (v_s1_id, 'student1.qa@mentorino.test', 'QA Student One', 'student1.qa@mentorino.test', 'approved', v_prog1_id, 'Career Strategist', 'I want to transition into product management and develop strategic thinking skills.', 'Virtual', 'Weekly', 8),
       (v_s2_id, 'student2.qa@mentorino.test', 'QA Student Two', 'student2.qa@mentorino.test', 'approved', v_prog2_id, 'Industry Expert', 'I want to build expertise in cybersecurity and earn industry certifications.', 'Virtual', 'Bi-weekly', 9)
ON CONFLICT DO NOTHING;

-- Conversations
INSERT INTO public.conversations (id, student_id, mentor_id, participants, last_message, last_message_time)
VALUES (v_conv1_id, v_s1_id, v_mentor_id, ARRAY[v_mentor_id, v_s1_id], 'Welcome to the program!', now()),
       (v_conv2_id, v_s2_id, v_mentor_id, ARRAY[v_mentor_id, v_s2_id], 'Looking forward to working together.', now())
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.conversation_participants (conversation_id, user_id)
VALUES (v_conv1_id, v_mentor_id), (v_conv1_id, v_s1_id),
       (v_conv2_id, v_mentor_id), (v_conv2_id, v_s2_id)
ON CONFLICT DO NOTHING;

-- Messages
INSERT INTO public.messages (sender_id, conversation_id, content, sender_name)
VALUES (v_mentor_id, v_conv1_id, 'Welcome to the program!', 'QA Mentor'),
       (v_mentor_id, v_conv2_id, 'Looking forward to working together.', 'QA Mentor')
ON CONFLICT DO NOTHING;

-- Goals
INSERT INTO public.goals (id, student_id, title, description, progress_percentage, status, target_date)
VALUES (v_goal1_id, v_s1_id, 'Complete Product Roadmap', 'Develop a comprehensive product roadmap for the next quarter including feature prioritization and stakeholder buy-in.', 40, 'in_progress', CURRENT_DATE + 30),
       (v_goal2_id, v_s2_id, 'Security+ Certification', 'Earn CompTIA Security+ certification by completing practice exams and mastering core security concepts.', 25, 'in_progress', CURRENT_DATE + 60)
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title;

-- Goal Milestones
INSERT INTO public.goal_milestones (goal_id, title, completed)
VALUES (v_goal1_id, 'Define user stories', true),
       (v_goal1_id, 'Design wireframes', false),
       (v_goal1_id, 'Get stakeholder approval', false),
       (v_goal2_id, 'Complete practice exams', true),
       (v_goal2_id, 'Schedule exam date', false),
       (v_goal2_id, 'Pass certification exam', false)
ON CONFLICT DO NOTHING;

-- Tasks
INSERT INTO public.tasks (id, student_id, mentor_id, title, description, due_date, priority, status)
VALUES (v_task1_id, v_s1_id, v_mentor_id, 'Submit updated resume PDF', 'Export your updated resume as PDF and upload it for mentor review.', CURRENT_DATE + 7, 'high', 'pending'),
       (v_task2_id, v_s2_id, v_mentor_id, 'Security+ Practice Exam Review', 'Complete a full-length practice exam and review all incorrect answers.', CURRENT_DATE + 3, 'medium', 'in_progress')
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title;

-- Journal Entries
INSERT INTO public.journals (id, student_id, type, content, mood, wins, challenges)
VALUES (v_journal1_id, v_s1_id, 'daily', 'Today I completed the user stories for the product roadmap. Feeling confident about the direction we are heading. My mentor provided great feedback on the prioritization framework.', 'good', '["Completed user stories draft", "Got mentor feedback on prioritization"]', '["Need to finalize wireframes by Friday"]')
ON CONFLICT (id) DO UPDATE SET content = EXCLUDED.content;

-- Sessions
INSERT INTO public.sessions (id, mentor_id, student_id, title, description, start_time, end_time, meeting_url, meeting_type, status, attendance_status)
VALUES (v_session1_id, v_mentor_id, v_s1_id, 'Introductory Call', 'First meeting to discuss goals and set expectations for the mentorship.', now() + interval '1 day', now() + interval '1 day' + interval '1 hour', 'https://meet.google.com/abc-defg-hij', 'Google Meet', 'scheduled', 'pending'),
       (v_session2_id, v_mentor_id, v_s2_id, 'Career Strategy Session', 'Discuss career goals and create a personalized development plan.', now() + interval '3 days', now() + interval '3 days' + interval '1 hour', 'https://meet.google.com/xyz-uvwx-yz', 'Google Meet', 'scheduled', 'pending')
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title;

-- Notifications
INSERT INTO public.notifications (id, user_id, title, message, type, read)
VALUES (v_notif1_id, v_mentor_id, 'New Applications', 'There are new mentorship applications awaiting your review.', 'system', false),
       (v_notif2_id, v_s1_id, 'Session Scheduled', 'Your Introductory Call has been scheduled for tomorrow.', 'session', false),
       (v_notif3_id, v_s2_id, 'New Task Assigned', 'Your mentor has assigned a new task: Security+ Practice Exam Review.', 'task', false)
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title;

-- Resources
INSERT INTO public.resources (id, title, url, category, is_pinned, created_by)
VALUES (v_res1_id, 'PM Interview Guide', 'https://example.com/pm-guide', 'Career Resources', true, v_mentor_id),
       (v_res2_id, 'Resume Template', 'https://example.com/resume', 'Templates', false, v_mentor_id)
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title;

-- Events
INSERT INTO public.events (id, title, description, date, time, location, meeting_link, capacity, category, status, created_by)
VALUES (v_event1_id, 'Networking Mixer', 'Connect with industry professionals and fellow mentees in a virtual networking event.', to_char(CURRENT_DATE + 14, 'YYYY-MM-DD'), '18:00', 'Virtual', 'https://zoom.us/j/123456789', 50, 'Networking', 'published', v_mentor_id)
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title;

ALTER TABLE public.profiles ENABLE TRIGGER on_student_crm_created;
ALTER TABLE public.profiles ENABLE TRIGGER on_student_login_track;
ALTER TABLE public.programs ENABLE TRIGGER IF EXISTS set_updated_at;
ALTER TABLE public.goals ENABLE TRIGGER IF EXISTS set_updated_at;
ALTER TABLE public.tasks ENABLE TRIGGER IF EXISTS set_updated_at;
ALTER TABLE public.sessions ENABLE TRIGGER IF EXISTS set_updated_at;
ALTER TABLE public.events ENABLE TRIGGER IF EXISTS set_updated_at;
ALTER TABLE public.conversations ENABLE TRIGGER IF EXISTS set_updated_at;

RAISE NOTICE 'Seed completed: programs, profiles, enrollments, apps, conversations, messages, goals, milestones, tasks, journals, sessions, notifications, resources, events';
END $$;
