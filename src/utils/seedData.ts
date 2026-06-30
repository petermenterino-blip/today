import { journalStorage } from '../services/journalStorage';
import { goalStorage } from '../services/goalStorage';
import { taskStorage } from '../services/taskStorage';
import { studentService } from '../services/studentService';
import { tagService } from '../services/tagService';
import { notificationStorage } from '../services/notificationStorage';
import { settingsService } from '../services/settingsService';
import { studentProgressService } from '../services/studentProgressService';

const SEED_VERSION = 'v4';
const SEED_VERSION_KEY = 'mentorino_seed_version';

const RELEVANT_PREFIXES = ['mentorino_', 'mock_', 'whatsapp_'];

const clearRelevantKeys = () => {
  const keysToRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key) {
      for (const prefix of RELEVANT_PREFIXES) {
        if (key.startsWith(prefix)) {
          keysToRemove.push(key);
          break;
        }
      }
    }
  }
  keysToRemove.forEach(k => {
    try { localStorage.removeItem(k); } catch {}
  });
};

const safeSetItem = (key: string, value: string) => {
  try {
    localStorage.setItem(key, value);
  } catch (e) {
    console.warn(`Failed to set ${key} in localStorage`);
  }
};

export const seedDatabase = async () => {
  const currentVersion = localStorage.getItem(SEED_VERSION_KEY);
  if (currentVersion === SEED_VERSION) return;

  clearRelevantKeys();
  localStorage.setItem(SEED_VERSION_KEY, SEED_VERSION);

  console.log('Seeding initial mock data...');

  // 1. Students (for mentor dashboard)
  const students: any[] = [
    {
      id: 'u1',
      user_id: 'u1',
      name: 'Alex Rivera',
      email: 'alex@example.com',
      status: 'active',
      healthStatus: 'needs_attention',
      tags: ['High Potential', 'Placement Ready'],
      lastLogin: new Date().toISOString(),
      metrics: {
        attendanceRate: 90,
        goalCompletionRate: 65,
        activityLevel: 80
      }
    },
    {
      id: 'student-2',
      user_id: 'student-2',
      name: 'Sarah Jenks',
      email: 'sarah@example.com',
      status: 'at_risk',
      healthStatus: 'at_risk',
      tags: ['Needs Support'],
      lastLogin: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      metrics: {
        attendanceRate: 60,
        goalCompletionRate: 20,
        activityLevel: 30
      }
    },
    {
      id: 'u4',
      user_id: 'u4',
      name: 'Aisha Patel',
      email: 'aisha@example.com',
      status: 'active',
      healthStatus: 'active',
      tags: ['Placement Ready', 'Backend Expert'],
      lastLogin: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      metrics: {
        attendanceRate: 100,
        goalCompletionRate: 90,
        activityLevel: 95
      }
    },
    {
      id: 'u7',
      user_id: 'u7',
      name: 'James Wilson',
      email: 'james@example.com',
      status: 'active',
      healthStatus: 'needs_attention',
      tags: ['Needs Support'],
      lastLogin: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
      metrics: {
        attendanceRate: 75,
        goalCompletionRate: 50,
        activityLevel: 60
      }
    },
    {
      id: 'u8',
      user_id: 'u8',
      name: 'Michael Chen',
      email: 'michael@example.com',
      status: 'active',
      healthStatus: 'active',
      tags: ['High Potential'],
      lastLogin: new Date().toISOString(),
      metrics: {
        attendanceRate: 92,
        goalCompletionRate: 80,
        activityLevel: 85
      }
    }
  ];
  await studentService.seed(students as any);

  // 2. Goals (linked to mock user 'u1' = alex@example.com)
  await goalStorage.seed([
    {
      id: 'goal-1',
      studentId: 'u1',
      title: 'Complete Resume Revision',
      description: 'Update the resume with recent internship details and format perfectly.',
      progressPercentage: 100,
      milestones: [],
      status: 'completed',
      createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'goal-2',
      studentId: 'u1',
      title: 'Conduct 5 Informational Interviews',
      description: 'Reach out to PMs on LinkedIn and conduct 30 min chats.',
      progressPercentage: 40,
      milestones: [
        { id: 'm1', title: 'Draft outreach template', completed: true },
        { id: 'm2', title: 'Create target list of 20 people', completed: true },
        { id: 'm3', title: 'Conduct interviews', completed: false }
      ],
      status: 'in_progress',
      createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'goal-3',
      studentId: 'u1',
      title: 'Finalize Portfolio Website',
      description: 'Ship version 1 of portfolio website on Vercel.',
      progressPercentage: 0,
      milestones: [],
      status: 'not_started',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ]);

  // 3. Journals (linked to mock user 'u1')
  await journalStorage.seed([
    {
      id: 'journal-1',
      studentId: 'u1',
      type: 'daily',
      content: 'Today was productive. I reached out to 5 PMs on LinkedIn, 2 replied already!',
      mood: 'good',
      wins: ['Sent LinkedIn messages', 'Got replies'],
      challenges: ['Felt nervous sending cold messages'],
      reviewedByMentor: true,
      mentorComments: ['Great job pushing past the nervousness!'],
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'journal-2',
      studentId: 'u1',
      type: 'weekly',
      content: 'This week I focused mostly on my resume and getting it reviewed. The feedback was tough but necessary.',
      mood: 'okay',
      wins: ['Finished V2 of resume'],
      challenges: ['Time management was poor this week'],
      reviewedByMentor: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ]);

  // 4. Tasks (ActionItem format, linked to 'u1' student and 'mentor-1' mentor)
  await taskStorage.seed([
    {
      id: 'task-1',
      studentId: 'u1',
      mentorId: 'mentor-1',
      title: 'Submit updated resume PDF',
      description: 'Make sure it is 1 page and export as PDF.',
      dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'task-2',
      studentId: 'u1',
      mentorId: 'mentor-1',
      title: 'Read PM Interview guide chapter 1',
      description: 'Read the first chapter and write down 3 key takeaways.',
      dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'in_progress',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'task-3',
      studentId: 'u1',
      mentorId: 'mentor-1',
      title: 'Draft cover letter for Startup X',
      description: 'Use the framework we discussed in the last session.',
      dueDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'completed',
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'task-4',
      studentId: 'u4',
      mentorId: 'mentor-1',
      title: 'Complete System Design exercise',
      description: 'Design a URL shortener service.',
      dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'in_progress',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ]);

  // 5. Tags
  const tags = [
    { id: 'tag-1', label: 'High Potential', color: '#10b981' },
    { id: 'tag-2', label: 'Needs Support', color: '#f59e0b' },
    { id: 'tag-3', label: 'Placement Ready', color: '#3b82f6' },
    { id: 'tag-4', label: 'Backend Expert', color: '#8b5cf6' },
    { id: 'tag-5', label: 'FinTech', color: '#06b6d4' }
  ];
  await tagService.seed(tags);

  // 6. Notifications
  await notificationStorage.seed([
    {
      id: 'notif-1',
      userId: 'mentor-1',
      title: 'New Application',
      message: 'Alex Rivera submitted an application for the mentorship program.',
      read: false,
      type: 'system',
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'notif-2',
      userId: 'mentor-1',
      title: 'Session Reminder',
      message: 'Introductory call with Alex Rivera is tomorrow at 10:00 AM.',
      read: false,
      type: 'session',
      createdAt: new Date().toISOString()
    },
    {
      id: 'notif-3',
      userId: 'u1',
      title: 'New Task Assigned',
      message: 'Sarah assigned you a new task: Submit updated resume PDF.',
      read: false,
      type: 'task',
      createdAt: new Date().toISOString()
    },
    {
      id: 'notif-4',
      userId: 'u1',
      title: 'Session Scheduled',
      message: 'Resume Review session scheduled for this Thursday at 2:00 PM.',
      read: true,
      type: 'session',
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'notif-5',
      userId: 'mentor-1',
      title: 'Task Completed',
      message: 'Alex Rivera completed "Draft cover letter for Startup X".',
      read: false,
      type: 'task',
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
    }
  ]);

  // 7. Sessions (mentorino_sessions)
  const sessions = [
    {
      id: 's1',
      mentorId: 'mentor-1',
      studentId: 'u1',
      title: 'Introductory Call',
      description: 'First meeting to discuss goals and roadmap.',
      startTime: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
      endTime: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000).toISOString(),
      meetingUrl: 'https://meet.google.com/abc-defg-hij',
      attendanceStatus: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'scheduled'
    },
    {
      id: 's2',
      mentorId: 'mentor-1',
      studentId: 'u1',
      title: 'Resume Review',
      description: 'Deep dive into resume bullet points and formatting.',
      startTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      endTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000 + 45 * 60 * 1000).toISOString(),
      meetingUrl: 'https://meet.google.com/jkl-mnop-qrs',
      attendanceStatus: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'scheduled'
    },
    {
      id: 's3',
      mentorId: 'mentor-1',
      studentId: 'u1',
      title: 'Career Strategy Session',
      description: 'Discuss career transition strategy and milestones.',
      startTime: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      endTime: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000).toISOString(),
      meetingUrl: '',
      attendanceStatus: 'attended',
      createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      notes: 'Discussed career goals. Next steps: update resume and start networking.',
      status: 'completed'
    },
    {
      id: 's4',
      mentorId: 'mentor-1',
      studentId: 'u4',
      title: 'System Design Review',
      description: 'Review system design exercise for URL shortener.',
      startTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
      endTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000).toISOString(),
      meetingUrl: 'https://meet.google.com/xyz-uvwx-yz',
      attendanceStatus: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'scheduled'
    }
  ];
  localStorage.setItem('mentorino_sessions', JSON.stringify(sessions));

  // 8. Applications (mentorino_applications)
  const applications = [
    {
      id: 'app-1',
      user_id: 'u1',
      email: 'alex@example.com',
      first_name: 'Alex',
      last_name: 'Rivera',
      phone_number: '555-0101',
      discipline: 'Software Engineering',
      reason_for_applying: JSON.stringify({
        goals: 'Become a senior engineer and transition to Staff role',
        linkedin_url: 'https://linkedin.com/in/alexrivera',
        resume_link: '',
        meeting_preference: 'Virtual',
        frequency: 'Weekly',
        seriousness: 10,
        program_id: '1',
        location: 'Remote',
        focus_area: 'Software Engineering',
        top_strength: 'Rapid Learning',
        needs_focus: 'Networking'
      }),
      status: 'approved',
      created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'app-2',
      user_id: null,
      email: 'brianna@example.com',
      first_name: 'Brianna',
      last_name: 'Chen',
      phone_number: '555-0102',
      discipline: 'Product Management',
      reason_for_applying: JSON.stringify({
        goals: 'Transition to PM role from engineering',
        linkedin_url: '',
        resume_link: '',
        meeting_preference: 'Virtual',
        frequency: 'Weekly',
        seriousness: 9,
        program_id: '2',
        location: 'Remote',
        focus_area: 'Product Management',
        top_strength: 'Analytical Thinking',
        needs_focus: 'Stakeholder Communication'
      }),
      status: 'pending_review',
      created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
    }
  ];
  localStorage.setItem('mentorino_applications', JSON.stringify(applications));

  // 9. Programs (mentorino_programs)
  const programs = [
    {
      id: '1',
      title: 'Software Architecture Elite Mentorship',
      description: 'Master system design, architecture patterns, and engineering leadership.',
      duration: '12 weeks',
      mentor: 'Sarah Jenkins',
      category: 'Engineering',
      difficulty: 'Advanced',
      progress: 0,
      status: 'published',
      studentCount: 5,
      visibility: 'public',
      outcomes: ['Design scalable systems', 'Lead technical discussions', 'Master architecture patterns'],
      skillsCovered: ['System Design', 'Microservices', 'Cloud Architecture']
    },
    {
      id: '2',
      title: 'Product Leadership Accelerator',
      description: 'From PM to product leader. Strategy, execution, and stakeholder management.',
      duration: '10 weeks',
      mentor: 'Sarah Jenkins',
      category: 'Product',
      difficulty: 'Intermediate',
      progress: 0,
      status: 'published',
      studentCount: 3,
      visibility: 'public',
      outcomes: ['Define product strategy', 'Run effective sprints', 'Lead cross-functional teams'],
      skillsCovered: ['Product Strategy', 'Agile', 'Stakeholder Management']
    }
  ];
  localStorage.setItem('mentorino_programs', JSON.stringify(programs));

  // 10. Bookings (mock_bookings_v2)
  const bookings = [
    { id: 'bk-1', user_id: 'u1', user_name: 'Alex Rivera', program_id: '1', date: 'Tomorrow', time: '10:00 AM', status: 'upcoming', created_at: new Date().toISOString() },
    { id: 'bk-2', user_id: 'u4', user_name: 'Aisha Patel', program_id: '2', date: 'Thursday', time: '2:00 PM', status: 'upcoming', created_at: new Date().toISOString() },
    { id: 'bk-3', user_id: 'u8', user_name: 'Michael Chen', program_id: '1', date: 'Tomorrow', time: '4:00 PM', status: 'completed', created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() },
    { id: 'bk-4', user_id: 'student-2', user_name: 'Sarah Jenks', program_id: '2', date: 'Mon, 27 Jun', time: '11:00 AM', status: 'upcoming', created_at: new Date().toISOString() },
    { id: 'bk-5', user_id: 'u7', user_name: 'James Wilson', program_id: '2', date: 'Wed, 29 Jun', time: '1:00 PM', status: 'upcoming', created_at: new Date().toISOString() },
    { id: 'bk-6', user_id: 'u1', user_name: 'Alex Rivera', program_id: '1', date: 'Last Tuesday', time: '9:00 AM', status: 'completed', created_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString() }
  ];
  localStorage.setItem('mock_bookings_v2', JSON.stringify(bookings));

  // 11. Events (mock_events_v2)
  const events = [
    { id: 'ev-1', title: 'Summer Networking Mixer', location: 'Zoom', date: 'Jul 15, 2026', time: '6:00 PM', description: 'Connect with mentors and students in a relaxed setting.', attendees: [] },
    { id: 'ev-2', title: 'Resume Review Workshop', location: 'Google Meet', date: 'Aug 02, 2026', time: '4:00 PM', description: 'Learn how to beat the ATS and land more interviews.', attendees: [] },
    { id: 'ev-3', title: 'Tech Interview Panel', location: 'Zoom', date: 'Sep 10, 2026', time: '5:30 PM', description: 'Panel discussion with senior engineers from top tech companies.', attendees: [] },
    { id: 'ev-4', title: 'PM Case Workshop', location: 'WebEx', date: 'Oct 05, 2026', time: '6:00 PM', description: 'Interactive workshop on solving product cases.', attendees: [] },
    { id: 'ev-5', title: 'Alumni Q&A Session', location: 'Zoom', date: 'Nov 12, 2026', time: '7:00 PM', description: 'Ask questions to successful alumni working in your target industry.', attendees: [] },
    { id: 'ev-6', title: 'Salary Negotiation Masterclass', location: 'Google Meet', date: 'Dec 01, 2026', time: '5:00 PM', description: 'Learn actionable strategies for negotiating job offers.', attendees: [] }
  ];
  localStorage.setItem('mock_events_v2', JSON.stringify(events));

  // 12. Resources (mentorino_resources)
  const resources = [
    { id: 'res-1', title: 'System Design Interview Guide', url: '#', category: 'Engineering', is_pinned: true },
    { id: 'res-2', title: 'Product Strategy Framework', url: '#', category: 'Product', is_pinned: true },
    { id: 'res-3', title: 'Resume Template & Checklist', url: '#', category: 'Career', is_pinned: false },
    { id: 'res-4', title: 'Mock Interview Questions Bank', url: '#', category: 'Interview Prep', is_pinned: false }
  ];
  localStorage.setItem('mentorino_resources', JSON.stringify(resources));

  // 13. WhatsApp Conversations (whatsapp_conversations_v4)
  const conversations = [
    {
      id: 'conv-1',
      studentId: 'u1',
      studentName: 'Alex Rivera',
      mentorId: 'mentor-1',
      lastMessage: 'Thanks for the resume feedback!',
      lastMessageTime: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      unreadCount: 2,
      pinned: true
    },
    {
      id: 'conv-2',
      studentId: 'u4',
      studentName: 'Aisha Patel',
      mentorId: 'mentor-1',
      lastMessage: 'See you at the session tomorrow.',
      lastMessageTime: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      unreadCount: 0,
      pinned: false
    },
    {
      id: 'conv-3',
      mentorId: 'mentor-1',
      name: 'Software Engineering Group',
      description: 'Group chat for all SE mentees',
      isGroup: true,
      participants: ['mentor-1', 'u1', 'u4', 'u8'],
      adminId: 'mentor-1',
      lastMessage: 'Great question! Let me share some resources.',
      lastMessageTime: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
      unreadCount: 5,
      pinned: false
    }
  ];
  localStorage.setItem('whatsapp_conversations_v4', JSON.stringify(conversations));

  // 14. WhatsApp Messages (whatsapp_messages_v4)
  const messages = [
    {
      id: 'msg-1',
      senderId: 'u1',
      senderName: 'Alex Rivera',
      conversationId: 'conv-1',
      content: 'Hi Sarah! I just submitted my resume for review on the portal.',
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      status: 'read',
      type: 'text'
    },
    {
      id: 'msg-2',
      senderId: 'mentor-1',
      senderName: 'Sarah Jenkins',
      conversationId: 'conv-1',
      content: "Great, let me take a look! I'll have feedback for you by tomorrow.",
      timestamp: new Date(Date.now() - 23 * 60 * 60 * 1000).toISOString(),
      status: 'read',
      type: 'text'
    },
    {
      id: 'msg-3',
      senderId: 'u1',
      senderName: 'Alex Rivera',
      conversationId: 'conv-1',
      content: 'Thanks for the resume feedback! I made all the changes you suggested.',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      status: 'delivered',
      type: 'text'
    },
    {
      id: 'msg-4',
      senderId: 'u4',
      senderName: 'Aisha Patel',
      conversationId: 'conv-2',
      content: 'Can we reschedule our session this week? Something came up.',
      timestamp: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
      status: 'read',
      type: 'text'
    },
    {
      id: 'msg-5',
      senderId: 'mentor-1',
      senderName: 'Sarah Jenkins',
      conversationId: 'conv-2',
      content: 'Sure, how does Thursday at the same time work for you?',
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      status: 'read',
      type: 'text'
    },
    {
      id: 'msg-6',
      senderId: 'mentor-1',
      senderName: 'Sarah Jenkins',
      conversationId: 'conv-3',
      content: "Great question! Let me share some resources on system design patterns.",
      timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
      status: 'read',
      type: 'text'
    },
    {
      id: 'msg-7',
      senderId: 'u1',
      senderName: 'Alex Rivera',
      conversationId: 'conv-3',
      content: 'Has anyone gone through the Architecture module yet?',
      timestamp: new Date(Date.now() - 14 * 60 * 60 * 1000).toISOString(),
      status: 'read',
      type: 'text'
    }
  ];
  localStorage.setItem('whatsapp_messages_v4', JSON.stringify(messages));

  // 16. Mentor Settings (mentorino_mentor_settings + supabase mentor_settings)
  const mentorSettings = [
    {
      id: 'settings-1',
      mentorId: 'mentor-1',
      timezone: 'America/New_York',
      sessionDuration: 45,
      bufferTime: 15,
      notificationsEnabled: true,
      workingDays: [1, 2, 3, 4, 5],
      availableHoursStart: '09:00',
      availableHoursEnd: '17:00'
    }
  ];
  for (const s of mentorSettings) {
    await settingsService.seed(s.mentorId, s);
  }

  // 17. Student Progress (mentorino_progress + supabase student_progress)
  const progress = [
    {
      userId: 'u1',
      programId: '1',
      startedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
      lessons: {
        'lesson-1': {
          completedTopics: ['System Design Fundamentals', 'Scalability Principles', 'Load Balancing'],
          quizCompleted: true,
          completedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
        },
        'lesson-2': {
          completedTopics: ['Microservices Architecture'],
          videoPosition: 0.45,
          quizCompleted: false
        },
        'lesson-3': {
          completedTopics: []
        }
      }
    }
  ];
  localStorage.setItem('mentorino_progress', JSON.stringify(progress));
  await studentProgressService.seed(progress);

  console.log('Mock data seeded successfully (v4).');
};
