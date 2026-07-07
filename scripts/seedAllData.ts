import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'http://localhost:54321';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

const sql = readFileSync(new URL('../scripts/seed_staging.sql', import.meta.url), 'utf-8');

// Split by semicolons, filter out empty/whitespace
const statements = sql
  .split(';')
  .map(s => s.trim())
  .filter(s => s.length > 0 && !s.startsWith('--') && s !== '$$' && !s.startsWith('/'));

async function runSeed() {
  console.log('Executing seed SQL via raw queries...');

  // We'll use supabase.rpc with the raw sql approach if available
  // Otherwise we execute statement by statement
  for (const stmt of statements) {
    try {
      // Try to execute via raw query if using the supabase-js v2
      // The REST API can't execute arbitrary SQL, so this approach won't work directly
      console.log(`Would execute: ${stmt.substring(0, 80)}...`);
    } catch (err) {
      console.error(`Error: ${err}`);
    }
  }

  // Alternative: use individual table inserts
  console.log('\n=== Inserting seed data via REST API ===\n');

  const mentor_id = 'dec15a7d-a085-49ca-b4a5-d00200d496a5';
  const s1_id = 'da44529b-2dcd-4701-a9fd-4bf732485c89';
  const s2_id = 'af8b4002-6d82-40d3-a7e3-0d0743da2ca2';
  const prog1_id = '00000000-0000-0000-0000-000000000010';
  const prog2_id = '00000000-0000-0000-0000-000000000011';

  // Get existing data counts
  const { count: profileCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
  console.log(`Existing profiles: ${profileCount}`);

  // Upsert profiles
  const { error: pErr } = await supabase.from('profiles').upsert([
    { id: mentor_id, email: 'mentor.qa@mentorino.test', name: 'QA Mentor', role: 'mentor', status: 'active', application_status: 'approved', tags: ['qa', 'mentor'] },
    { id: s1_id, email: 'student1.qa@mentorino.test', name: 'QA Student One', role: 'student', status: 'active', application_status: 'approved', growth_score: 75, tags: ['qa', 'student'] },
    { id: s2_id, email: 'student2.qa@mentorino.test', name: 'QA Student Two', role: 'student', status: 'active', application_status: 'approved', growth_score: 45, tags: ['qa', 'student'] },
  ], { onConflict: 'id', ignoreDuplicates: false });
  if (pErr) { console.error('profiles error:', pErr.message); } else { console.log('✓ profiles'); }

  // Programs
  const { error: progErr } = await supabase.from('programs').upsert([
    { id: prog1_id, title: 'Product Management Foundations', description: 'Learn the fundamentals of product management.', duration: '12 weeks', status: 'active', category: 'Career Development' },
    { id: prog2_id, title: 'Cybersecurity Essentials', description: 'Master core concepts of cybersecurity.', duration: '16 weeks', status: 'active', category: 'Technical Skills' },
  ], { onConflict: 'id' });
  if (progErr) { console.error('programs error:', progErr.message); } else { console.log('✓ programs'); }

  // Link mentor & programs via profiles update
  await supabase.from('profiles').update({ mentor_id, program_id: prog1_id }).eq('id', s1_id);
  await supabase.from('profiles').update({ mentor_id, program_id: prog2_id }).eq('id', s2_id);
  console.log('✓ mentor links');

  // Enrollments
  const { error: enrErr } = await supabase.from('program_enrollments').upsert([
    { student_id: s1_id, program_id: prog1_id, status: 'active' },
    { student_id: s2_id, program_id: prog2_id, status: 'active' },
  ], { onConflict: 'student_id, program_id' });
  if (enrErr) { console.error('enrollments error:', enrErr.message); } else { console.log('✓ enrollments'); }

  // Applications — intentionally empty; apps come from live submissions
  console.log('✓ applications (skipped — no seed data)');

  // Conversations
  const conv1_id = '00000000-0000-0000-0000-000000000100';
  const conv2_id = '00000000-0000-0000-0000-000000000101';
  const { error: convErr } = await supabase.from('conversations').upsert([
    { id: conv1_id, student_id: s1_id, mentor_id, participants: [mentor_id, s1_id], last_message: 'Welcome to the program!' },
    { id: conv2_id, student_id: s2_id, mentor_id, participants: [mentor_id, s2_id], last_message: 'Looking forward to working together.' },
  ], { onConflict: 'id' });
  if (convErr) { console.error('conversations error:', convErr.message); } else { console.log('✓ conversations'); }

  // Conversation participants
  await supabase.from('conversation_participants').upsert([
    { conversation_id: conv1_id, user_id: mentor_id },
    { conversation_id: conv1_id, user_id: s1_id },
    { conversation_id: conv2_id, user_id: mentor_id },
    { conversation_id: conv2_id, user_id: s2_id },
  ], { onConflict: 'conversation_id, user_id' });
  console.log('✓ conversation participants');

  // Messages
  const { error: msgErr } = await supabase.from('messages').insert([
    { sender_id: mentor_id, conversation_id: conv1_id, content: 'Welcome to the program!', sender_name: 'QA Mentor' },
    { sender_id: mentor_id, conversation_id: conv2_id, content: 'Looking forward to working together.', sender_name: 'QA Mentor' },
  ]);
  if (msgErr) { console.error('messages error:', msgErr.message); } else { console.log('✓ messages'); }

  // Goals
  const goal1_id = '00000000-0000-0000-0000-000000000200';
  const goal2_id = '00000000-0000-0000-0000-000000000201';
  const { error: goalErr } = await supabase.from('goals').upsert([
    { id: goal1_id, student_id: s1_id, title: 'Complete Product Roadmap', description: 'Develop a comprehensive product roadmap for the next quarter.', progress_percentage: 40, status: 'in_progress', target_date: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0] },
    { id: goal2_id, student_id: s2_id, title: 'Security+ Certification', description: 'Earn CompTIA Security+ certification by completing practice exams.', progress_percentage: 25, status: 'in_progress', target_date: new Date(Date.now() + 60 * 86400000).toISOString().split('T')[0] },
  ], { onConflict: 'id' });
  if (goalErr) { console.error('goals error:', goalErr.message); } else { console.log('✓ goals'); }

  // Goal milestones
  const { error: gmErr } = await supabase.from('goal_milestones').insert([
    { goal_id: goal1_id, title: 'Define user stories', completed: true },
    { goal_id: goal1_id, title: 'Design wireframes', completed: false },
    { goal_id: goal1_id, title: 'Get stakeholder approval', completed: false },
    { goal_id: goal2_id, title: 'Complete practice exams', completed: true },
    { goal_id: goal2_id, title: 'Schedule exam date', completed: false },
    { goal_id: goal2_id, title: 'Pass certification exam', completed: false },
  ]);
  if (gmErr) { console.error('goal_milestones error:', gmErr.message); } else { console.log('✓ goal_milestones'); }

  // Tasks
  const task1_id = '00000000-0000-0000-0000-000000000300';
  const task2_id = '00000000-0000-0000-0000-000000000301';
  const { error: taskErr } = await supabase.from('tasks').upsert([
    { id: task1_id, student_id: s1_id, mentor_id, title: 'Submit updated resume PDF', description: 'Export your updated resume as PDF and upload it for mentor review.', due_date: new Date(Date.now() + 7 * 86400000).toISOString(), priority: 'high', status: 'pending' },
    { id: task2_id, student_id: s2_id, mentor_id, title: 'Security+ Practice Exam Review', description: 'Complete a full-length practice exam and review all incorrect answers.', due_date: new Date(Date.now() + 3 * 86400000).toISOString(), priority: 'medium', status: 'in_progress' },
  ], { onConflict: 'id' });
  if (taskErr) { console.error('tasks error:', taskErr.message); } else { console.log('✓ tasks'); }

  // Journal entries
  const journal1_id = '00000000-0000-0000-0000-000000000400';
  const { error: jErr } = await supabase.from('journals').upsert([
    { id: journal1_id, student_id: s1_id, type: 'daily', content: 'Today I completed the user stories for the product roadmap. Feeling confident about the direction we are heading.', mood: 'good', wins: ['Completed user stories draft', 'Got mentor feedback on prioritization'], challenges: ['Need to finalize wireframes by Friday'] },
  ], { onConflict: 'id' });
  if (jErr) { console.error('journals error:', jErr.message); } else { console.log('✓ journals'); }

  // Sessions
  const sess1_id = '00000000-0000-0000-0000-000000000500';
  const sess2_id = '00000000-0000-0000-0000-000000000501';
  const tomorrow = new Date(Date.now() + 86400000);
  const threeDays = new Date(Date.now() + 3 * 86400000);
  const { error: sErr } = await supabase.from('sessions').upsert([
    { id: sess1_id, mentor_id, student_id: s1_id, title: 'Introductory Call', description: 'First meeting to discuss goals and set expectations.', start_time: tomorrow.toISOString(), end_time: new Date(tomorrow.getTime() + 3600000).toISOString(), meeting_url: 'https://meet.google.com/abc-defg-hij', meeting_type: 'Google Meet', status: 'scheduled', attendance_status: 'pending' },
    { id: sess2_id, mentor_id, student_id: s2_id, title: 'Career Strategy Session', description: 'Discuss career goals and create a personalized development plan.', start_time: threeDays.toISOString(), end_time: new Date(threeDays.getTime() + 3600000).toISOString(), meeting_url: 'https://meet.google.com/xyz-uvwx-yz', meeting_type: 'Google Meet', status: 'scheduled', attendance_status: 'pending' },
  ], { onConflict: 'id' });
  if (sErr) { console.error('sessions error:', sErr.message); } else { console.log('✓ sessions'); }

  // Notifications
  const notif1_id = '00000000-0000-0000-0000-000000000800';
  const notif2_id = '00000000-0000-0000-0000-000000000801';
  const notif3_id = '00000000-0000-0000-0000-000000000802';
  const { error: nErr } = await supabase.from('notifications').upsert([
    { id: notif1_id, user_id: mentor_id, title: 'New Applications', message: 'There are new mentorship applications awaiting your review.', type: 'system', read: false },
    { id: notif2_id, user_id: s1_id, title: 'Session Scheduled', message: 'Your Introductory Call has been scheduled for tomorrow.', type: 'session', read: false },
    { id: notif3_id, user_id: s2_id, title: 'New Task Assigned', message: 'Your mentor has assigned a new task: Security+ Practice Exam Review.', type: 'task', read: false },
  ], { onConflict: 'id' });
  if (nErr) { console.error('notifications error:', nErr.message); } else { console.log('✓ notifications'); }

  // Resources
  const res1_id = '00000000-0000-0000-0000-000000000700';
  const res2_id = '00000000-0000-0000-0000-000000000701';
  const { error: rErr } = await supabase.from('resources').upsert([
    { id: res1_id, title: 'PM Interview Guide', url: 'https://example.com/pm-guide', category: 'Career Resources', is_pinned: true, created_by: mentor_id },
    { id: res2_id, title: 'Resume Template', url: 'https://example.com/resume', category: 'Templates', is_pinned: false, created_by: mentor_id },
  ], { onConflict: 'id' });
  if (rErr) { console.error('resources error:', rErr.message); } else { console.log('✓ resources'); }

  // Events
  const event1_id = '00000000-0000-0000-0000-000000000600';
  const eventDate = new Date(Date.now() + 14 * 86400000);
  const dateStr = `${eventDate.getFullYear()}-${String(eventDate.getMonth() + 1).padStart(2, '0')}-${String(eventDate.getDate()).padStart(2, '0')}`;
  const { error: eErr } = await supabase.from('events').upsert([
    { id: event1_id, title: 'Networking Mixer', description: 'Connect with industry professionals and fellow mentees in a virtual networking event.', date: dateStr, time: '18:00', location: 'Virtual', meeting_link: 'https://zoom.us/j/123456789', capacity: 50, category: 'Networking', status: 'published', created_by: mentor_id },
  ], { onConflict: 'id' });
  if (eErr) { console.error('events error:', eErr.message); } else { console.log('✓ events'); }

  console.log('\n=== Seed complete! ===');
}

runSeed().catch(console.error);
