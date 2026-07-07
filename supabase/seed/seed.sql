-- ──────────────────────────────────────────────────────────────────────────────
-- Seed Data for Staging Environment
-- Deterministic UUIDs — safe to run multiple times (idempotent).
-- NOTE: Timestamps use NOW() relative to execution time.
-- For fully-reproducible runs, replace NOW() with a fixed date.
-- Run: psql $STAGING_DATABASE_URL -f supabase/seed/seed.sql
-- ──────────────────────────────────────────────────────────────────────────────

-- ═══════════════════════════════════════════════════════════════════════════════
-- QA ACCOUNTS
-- Auth users must be created separately via admin API (see auth_users.sql).
-- UUIDs are deterministic and must match the auth.users.id after updating.
-- ═══════════════════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════════════════════
-- PROGRAMS
-- ═══════════════════════════════════════════════════════════════════════════════

INSERT INTO public.programs (id, title, description, duration, status, category)
VALUES
  ('00000000-0000-0000-0000-000000000010', 'Product Management Foundations', 'Learn the fundamentals of product management including roadmap planning, stakeholder management, and agile methodologies.', '12 weeks', 'active', 'Career Development')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.programs (id, title, description, duration, status, category)
VALUES
  ('00000000-0000-0000-0000-000000000011', 'Cybersecurity Essentials', 'Master the core concepts of cybersecurity including network security, cryptography, and incident response.', '16 weeks', 'active', 'Technical Skills'),
  ('00000000-0000-0000-0000-000000000012', 'Data Science Bootcamp', 'Intensive program covering Python, statistics, machine learning, and data visualization.', '20 weeks', 'active', 'Technical Skills'),
  ('00000000-0000-0000-0000-000000000013', 'Leadership & Management', 'Develop leadership skills including team management, conflict resolution, and strategic thinking.', '8 weeks', 'active', 'Professional Development')
ON CONFLICT (id) DO NOTHING;

-- ═══════════════════════════════════════════════════════════════════════════════
-- PROFILES
-- ═══════════════════════════════════════════════════════════════════════════════

INSERT INTO public.profiles (id, email, name, role, status, health_status, growth_score, metrics, tags, application_status)
VALUES
  ('00000000-0000-0000-0000-000000000001', 'mentor.qa@mentorino.test', 'QA Mentor', 'mentor', 'active', 'active', 0, '{"attendanceRate": 0, "goalCompletionRate": 0, "activityLevel": 0}', '["qa", "mentor"]', 'approved'),
  ('00000000-0000-0000-0000-000000000002', 'student1.qa@mentorino.test', 'QA Student One', 'student', 'active', 'active', 75, '{"attendanceRate": 80, "goalCompletionRate": 60, "activityLevel": 70}', '["qa", "student"]', 'approved'),
  ('00000000-0000-0000-0000-000000000003', 'student2.qa@mentorino.test', 'QA Student Two', 'student', 'active', 'active', 45, '{"attendanceRate": 50, "goalCompletionRate": 30, "activityLevel": 40}', '["qa", "student"]', 'approved')
ON CONFLICT (id) DO NOTHING;

-- Assign mentor to students
UPDATE public.profiles SET mentor_id = '00000000-0000-0000-0000-000000000001' WHERE id = '00000000-0000-0000-0000-000000000002';
UPDATE public.profiles SET mentor_id = '00000000-0000-0000-0000-000000000001' WHERE id = '00000000-0000-0000-0000-000000000003';
UPDATE public.profiles SET program_id = '00000000-0000-0000-0000-000000000010' WHERE id = '00000000-0000-0000-0000-000000000002';
UPDATE public.profiles SET program_id = '00000000-0000-0000-0000-000000000011' WHERE id = '00000000-0000-0000-0000-000000000003';

-- ═══════════════════════════════════════════════════════════════════════════════
-- APPLICATIONS — intentionally empty; apps come from live submissions
-- ═══════════════════════════════════════════════════════════════════════════════
-- No seed data. Remove this comment block if you want to add seed applications.

-- ═══════════════════════════════════════════════════════════════════════════════
-- STUDENT PROGRESS
-- ═══════════════════════════════════════════════════════════════════════════════

INSERT INTO public.student_progress (user_id, program_id, started_at, lessons)
VALUES
  ('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000010', NOW() - INTERVAL '30 days', '{}'),
  ('00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000011', NOW() - INTERVAL '14 days', '{}')
ON CONFLICT (user_id, program_id) DO NOTHING;

-- ═══════════════════════════════════════════════════════════════════════════════
-- DASHBOARD LAYOUTS
-- ═══════════════════════════════════════════════════════════════════════════════

INSERT INTO public.dashboard_layouts (user_id, layout)
VALUES
  ('00000000-0000-0000-0000-000000000002', '[]'),
  ('00000000-0000-0000-0000-000000000003', '[]')
ON CONFLICT (user_id) DO NOTHING;

-- ═══════════════════════════════════════════════════════════════════════════════
-- GOALS
-- ═══════════════════════════════════════════════════════════════════════════════

INSERT INTO public.goals (id, student_id, title, description, progress_percentage, status)
VALUES
  ('00000000-0000-0000-0000-000000000030', '00000000-0000-0000-0000-000000000002', 'Complete Product Roadmap Project', 'Create a comprehensive product roadmap for a fictional product including market analysis, feature prioritization, and launch timeline.', 60, 'in_progress'),
  ('00000000-0000-0000-0000-000000000031', '00000000-0000-0000-0000-000000000002', 'Master Stakeholder Communication', 'Develop and practice stakeholder communication strategies including status reports, executive summaries, and conflict resolution.', 30, 'in_progress'),
  ('00000000-0000-0000-0000-000000000032', '00000000-0000-0000-0000-000000000002', 'Build PM Portfolio', 'Create a portfolio of product management artifacts including PRDs, roadmaps, and competitive analyses.', 10, 'not_started'),
  ('00000000-0000-0000-0000-000000000033', '00000000-0000-0000-0000-000000000003', 'Complete Security+ Certification', 'Study and pass the CompTIA Security+ certification exam.', 40, 'in_progress'),
  ('00000000-0000-0000-0000-000000000034', '00000000-0000-0000-0000-000000000003', 'Build Home Lab Environment', 'Set up a cybersecurity home lab with virtual machines for hands-on practice.', 80, 'in_progress'),
  ('00000000-0000-0000-0000-000000000035', '00000000-0000-0000-0000-000000000003', 'Network in Cybersecurity Community', 'Attend 3 cybersecurity meetups and connect with 10 professionals on LinkedIn.', 20, 'not_started')
ON CONFLICT (id) DO NOTHING;

-- Goal milestones
INSERT INTO public.goal_milestones (id, goal_id, title, completed)
VALUES
  ('00000000-0000-0000-0000-000000000040', '00000000-0000-0000-0000-000000000030', 'Research market trends', true),
  ('00000000-0000-0000-0000-000000000041', '00000000-0000-0000-0000-000000000030', 'Define product vision', true),
  ('00000000-0000-0000-0000-000000000042', '00000000-0000-0000-0000-000000000030', 'Create feature backlog', true),
  ('00000000-0000-0000-0000-000000000043', '00000000-0000-0000-0000-000000000030', 'Present roadmap draft', false),
  ('00000000-0000-0000-0000-000000000044', '00000000-0000-0000-0000-000000000034', 'Install virtualization software', true),
  ('00000000-0000-0000-0000-000000000045', '00000000-0000-0000-0000-000000000034', 'Configure Windows domain controller', true),
  ('00000000-0000-0000-0000-000000000046', '00000000-0000-0000-0000-000000000034', 'Set up vulnerable machines for testing', false)
ON CONFLICT (id) DO NOTHING;

-- ═══════════════════════════════════════════════════════════════════════════════
-- TASKS
-- ═══════════════════════════════════════════════════════════════════════════════

INSERT INTO public.tasks (id, student_id, mentor_id, title, description, status, priority, due_date)
VALUES
  ('00000000-0000-0000-0000-000000000050', '00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'Submit Roadmap Draft', 'Prepare and submit the first draft of your product roadmap for review.', 'pending', 'high', NOW() + INTERVAL '3 days'),
  ('00000000-0000-0000-0000-000000000051', '00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'Read "Inspired" Chapters 1-10', 'Read the first ten chapters of "Inspired" by Marty Cagan.', 'in_progress', 'medium', NOW() + INTERVAL '7 days'),
  ('00000000-0000-0000-0000-000000000052', '00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'Prepare Stakeholder Presentation', 'Create a 10-slide deck for the stakeholder communication exercise.', 'pending', 'medium', NOW() + INTERVAL '5 days'),
  ('00000000-0000-0000-0000-000000000053', '00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'Complete Security+ Practice Test', 'Take a full-length practice test and identify weak areas.', 'in_progress', 'high', NOW() + INTERVAL '2 days'),
  ('00000000-0000-0000-0000-000000000054', '00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'Research SANS Courses', 'Research and compare 3 SANS courses relevant to your career goals.', 'pending', 'low', NOW() + INTERVAL '10 days')
ON CONFLICT (id) DO NOTHING;

-- ═══════════════════════════════════════════════════════════════════════════════
-- SESSIONS
-- ═══════════════════════════════════════════════════════════════════════════════

INSERT INTO public.sessions (id, student_id, mentor_id, title, description, start_time, end_time, status, meeting_type, attendance_status)
VALUES
  ('00000000-0000-0000-0000-000000000060', '00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'Roadmap Review Session', 'Review the product roadmap draft together and provide feedback.', NOW() + INTERVAL '2 days', NOW() + INTERVAL '2 days' + INTERVAL '1 hour', 'scheduled', 'Google Meet', 'pending'),
  ('00000000-0000-0000-0000-000000000061', '00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'Career Planning Discussion', 'Discuss long-term career goals and create a development plan.', NOW() + INTERVAL '7 days', NOW() + INTERVAL '7 days' + INTERVAL '1 hour', 'scheduled', 'Google Meet', 'pending'),
  ('00000000-0000-0000-0000-000000000062', '00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'Security+ Study Session', 'Review practice test results and focus on weak areas.', NOW() + INTERVAL '1 day', NOW() + INTERVAL '1 day' + INTERVAL '1 hour', 'scheduled', 'Google Meet', 'pending'),
  ('00000000-0000-0000-0000-000000000063', '00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'Lab Setup Check-in', 'Verify home lab setup and troubleshoot any issues.', NOW() + INTERVAL '5 days', NOW() + INTERVAL '5 days' + INTERVAL '30 minutes', 'scheduled', 'Google Meet', 'pending')
ON CONFLICT (id) DO NOTHING;

-- ═══════════════════════════════════════════════════════════════════════════════
-- CONVERSATIONS & MESSAGES
-- ═══════════════════════════════════════════════════════════════════════════════

INSERT INTO public.conversations (id, mentor_id, student_id, last_message, last_message_time)
VALUES
  ('00000000-0000-0000-0000-000000000070', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'Great work on the roadmap draft!', NOW() - INTERVAL '1 day'),
  ('00000000-0000-0000-0000-000000000071', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000003', 'I finished the practice test', NOW() - INTERVAL '2 hours')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.conversation_participants (conversation_id, user_id)
VALUES
  ('00000000-0000-0000-0000-000000000070', '00000000-0000-0000-0000-000000000001'),
  ('00000000-0000-0000-0000-000000000070', '00000000-0000-0000-0000-000000000002'),
  ('00000000-0000-0000-0000-000000000071', '00000000-0000-0000-0000-000000000001'),
  ('00000000-0000-0000-0000-000000000071', '00000000-0000-0000-0000-000000000003')
ON CONFLICT (conversation_id, user_id) DO NOTHING;

INSERT INTO public.messages (id, sender_id, conversation_id, content, type, created_at)
VALUES
  ('00000000-0000-0000-0000-000000000080', '00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000070', 'Hi mentor! I have completed the first draft of my roadmap. Please review when you get a chance.', 'text', NOW() - INTERVAL '2 days'),
  ('00000000-0000-0000-0000-000000000081', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000070', 'Great, I will take a look. Let us schedule a session to discuss it.', 'text', NOW() - INTERVAL '1 day'),
  ('00000000-0000-0000-0000-000000000082', '00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000070', 'Perfect, thank you!', 'text', NOW() - INTERVAL '1 day'),
  ('00000000-0000-0000-0000-000000000083', '00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000071', 'I finished the practice test. I scored 72%. Need to work on cryptography and network security.', 'text', NOW() - INTERVAL '3 hours'),
  ('00000000-0000-0000-0000-000000000084', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000071', '72% is a good start! Focus on cryptography this week and we will review together.', 'text', NOW() - INTERVAL '2 hours')
ON CONFLICT (id) DO NOTHING;

-- ═══════════════════════════════════════════════════════════════════════════════
-- NOTIFICATIONS
-- ═══════════════════════════════════════════════════════════════════════════════

INSERT INTO public.notifications (id, user_id, title, message, type, read)
VALUES
  ('00000000-0000-0000-0000-000000000090', '00000000-0000-0000-0000-000000000002', 'Session Reminder', 'You have a Roadmap Review session in 2 days.', 'session', false),
  ('00000000-0000-0000-0000-000000000091', '00000000-0000-0000-0000-000000000002', 'Task Due Soon', 'Roadmap Draft is due in 3 days.', 'task', false),
  ('00000000-0000-0000-0000-000000000092', '00000000-0000-0000-0000-000000000002', 'New Message', 'Your mentor replied to your message.', 'system', true),
  ('00000000-0000-0000-0000-000000000093', '00000000-0000-0000-0000-000000000003', 'Task Due Soon', 'Security+ Practice Test is due in 2 days.', 'task', false),
  ('00000000-0000-0000-0000-000000000094', '00000000-0000-0000-0000-000000000003', 'Session Scheduled', 'Your Lab Setup Check-in has been scheduled.', 'session', true)
ON CONFLICT (id) DO NOTHING;

-- ═══════════════════════════════════════════════════════════════════════════════
-- STUDENT TIMELINE EVENTS
-- ═══════════════════════════════════════════════════════════════════════════════

INSERT INTO public.student_timeline_events (id, student_id, type, title, description, timestamp, mentor_id, category)
VALUES
  ('00000000-0000-0000-0000-000000000100', '00000000-0000-0000-0000-000000000002', 'application_approved', 'Application Approved', 'QA Student One was approved by QA Mentor.', NOW() - INTERVAL '30 days', '00000000-0000-0000-0000-000000000001', 'system'),
  ('00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000002', 'goal_created', 'Goal Created', 'Created goal: Complete Product Roadmap Project.', NOW() - INTERVAL '25 days', '00000000-0000-0000-0000-000000000001', 'goal'),
  ('00000000-0000-0000-0000-000000000102', '00000000-0000-0000-0000-000000000002', 'goal_completed', 'Milestone Reached', 'Completed: Research market trends milestone.', NOW() - INTERVAL '20 days', NULL, 'goal'),
  ('00000000-0000-0000-0000-000000000103', '00000000-0000-0000-0000-000000000002', 'session_completed', 'Session Completed', 'Completed: Introductory Call session.', NOW() - INTERVAL '15 days', '00000000-0000-0000-0000-000000000001', 'session'),
  ('00000000-0000-0000-0000-000000000104', '00000000-0000-0000-0000-000000000003', 'application_approved', 'Application Approved', 'QA Student Two was approved by QA Mentor.', NOW() - INTERVAL '14 days', '00000000-0000-0000-0000-000000000001', 'system'),
  ('00000000-0000-0000-0000-000000000105', '00000000-0000-0000-0000-000000000003', 'goal_created', 'Goal Created', 'Created goal: Build Home Lab Environment.', NOW() - INTERVAL '10 days', '00000000-0000-0000-0000-000000000001', 'goal'),
  ('00000000-0000-0000-0000-000000000106', '00000000-0000-0000-0000-000000000003', 'task_completed', 'Task Completed', 'Completed: Install virtualization software.', NOW() - INTERVAL '5 days', NULL, 'task')
ON CONFLICT (id) DO NOTHING;

-- ═══════════════════════════════════════════════════════════════════════════════
-- EVENTS (calendar events)
-- ═══════════════════════════════════════════════════════════════════════════════

INSERT INTO public.events (id, title, description, date, time, location, meeting_link, capacity, category, status)
VALUES
  ('00000000-0000-0000-0000-000000000110', 'Cybersecurity Networking Mixer', 'Connect with industry professionals in cybersecurity.', (NOW() + INTERVAL '14 days')::date, '18:00', 'Virtual', 'https://meet.google.com/cyber-mixer', 50, 'Networking', 'published'),
  ('00000000-0000-0000-0000-000000000111', 'Product Management Workshop', 'Hands-on workshop on product discovery techniques.', (NOW() + INTERVAL '21 days')::date, '14:00', 'Virtual', 'https://meet.google.com/pm-workshop', 30, 'Workshop', 'published'),
  ('00000000-0000-0000-0000-000000000112', 'Resume Review Webinar', 'Learn how to craft a standout resume for tech roles.', (NOW() + INTERVAL '5 days')::date, '11:00', 'Virtual', 'https://meet.google.com/resume-webinar', 100, 'Webinar', 'published')
ON CONFLICT (id) DO NOTHING;

-- ═══════════════════════════════════════════════════════════════════════════════
-- RESOURCES
-- ═══════════════════════════════════════════════════════════════════════════════

INSERT INTO public.resources (id, title, url, category, is_pinned)
VALUES
  ('00000000-0000-0000-0000-000000000120', 'PM Interview Guide', 'https://example.com/pm-guide', 'Career Resources', true),
  ('00000000-0000-0000-0000-000000000121', 'Resume Template', 'https://example.com/resume-template', 'Templates', true),
  ('00000000-0000-0000-0000-000000000122', 'Cybersecurity Study Plan', 'https://example.com/cyber-study-plan', 'Career Resources', false),
  ('00000000-0000-0000-0000-000000000123', 'Networking Tips Guide', 'https://example.com/networking-tips', 'Career Resources', false)
ON CONFLICT (id) DO NOTHING;

-- ═══════════════════════════════════════════════════════════════════════════════
-- JOURNALS
-- ═══════════════════════════════════════════════════════════════════════════════

INSERT INTO public.journals (id, student_id, title, content, type, mood, wins, challenges)
VALUES
  ('00000000-0000-0000-0000-000000000130', '00000000-0000-0000-0000-000000000002', 'Product Roadmap Progress', 'Made significant progress on the roadmap today. Defined the product vision and started working on the feature backlog. Feeling confident about the direction.', 'daily', 'good', ARRAY['Defined product vision', 'Created initial feature backlog'], ARRAY['Need more market research data']),
  ('00000000-0000-0000-0000-000000000131', '00000000-0000-0000-0000-000000000002', 'Weekly Reflection', 'Good week overall. Completed market research and started the roadmap draft. The session with my mentor was very helpful.', 'weekly', 'great', ARRAY['Completed market research', 'Had productive mentor session'], ARRAY['Time management needs improvement']),
  ('00000000-0000-0000-0000-000000000132', '00000000-0000-0000-0000-000000000003', 'Security+ Study Session', 'Studied cryptography today. Understood symmetric vs asymmetric encryption. Need more practice with PKI concepts.', 'daily', 'neutral', ARRAY['Reviewed encryption algorithms'], ARRAY['PKI concepts are confusing']),
  ('00000000-0000-0000-0000-000000000133', '00000000-0000-0000-0000-000000000003', 'Lab Setup Progress', 'Successfully configured the Windows domain controller in my home lab. Next step is to set up vulnerable machines.', 'daily', 'good', ARRAY['Domain controller configured', 'Network segmentation planned'], ARRAY['Lab documentation needs to be organized'])
ON CONFLICT (id) DO NOTHING;

-- ═══════════════════════════════════════════════════════════════════════════════
-- ANALYTICS EVENTS
-- ═══════════════════════════════════════════════════════════════════════════════

INSERT INTO public.analytics_events (user_id, event_type, properties)
VALUES
  ('00000000-0000-0000-0000-000000000002', 'student_approved', '{"application_id": "00000000-0000-0000-0000-000000000020", "name": "QA Student One", "approved_by": "00000000-0000-0000-0000-000000000001"}'),
  ('00000000-0000-0000-0000-000000000002', 'session_completed', '{"session_id": "00000000-0000-0000-0000-000000000103", "type": "introductory"}'),
  ('00000000-0000-0000-0000-000000000003', 'student_approved', '{"application_id": "00000000-0000-0000-0000-000000000021", "name": "QA Student Two", "approved_by": "00000000-0000-0000-0000-000000000001"}'),
  ('00000000-0000-0000-0000-000000000003', 'goal_created', '{"goal_title": "Build Home Lab Environment"}');
