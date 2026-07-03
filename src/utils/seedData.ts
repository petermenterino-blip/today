import { supabase } from '../lib/supabase';
import { goalStorage } from '../services/goalStorage';
import { studentService } from '../services/studentService';
import { tagService } from '../services/tagService';
import { notificationStorage } from '../services/notificationStorage';
import { settingsService } from '../services/settingsService';
import { studentProgressService } from '../services/studentProgressService';

const SEED_VERSION = 'v6';
const SEED_VERSION_KEY = 'mentorino_seed_version';

function uid(): string {
  return crypto.randomUUID();
}

export const seedDatabase = async () => {
  const currentVersion = localStorage.getItem(SEED_VERSION_KEY);
  if (currentVersion === SEED_VERSION) return;

  const { count: studentCount } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('role', 'student');
  if (studentCount && studentCount > 0) {
    localStorage.setItem(SEED_VERSION_KEY, SEED_VERSION);
    return;
  }

  console.log('Seeding initial mock data...');

  const student1Id = uid();
  const student2Id = uid();
  const student3Id = uid();
  const student4Id = uid();
  const student5Id = uid();
  const mentorId = uid();

  await studentService.seed([
    {
      id: student1Id,
      user_id: student1Id,
      name: 'Alex Rivera',
      email: 'alex@example.com',
      status: 'active',
      healthStatus: 'needs_attention',
      tags: ['High Potential', 'Placement Ready'],
      lastLogin: new Date().toISOString(),
      metrics: { attendanceRate: 90, goalCompletionRate: 65, activityLevel: 80 },
    },
    {
      id: student2Id,
      user_id: student2Id,
      name: 'Sarah Jenks',
      email: 'sarah@example.com',
      status: 'at_risk',
      healthStatus: 'at_risk',
      tags: ['Needs Support'],
      lastLogin: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      metrics: { attendanceRate: 60, goalCompletionRate: 20, activityLevel: 30 },
    },
    {
      id: student3Id,
      user_id: student3Id,
      name: 'Aisha Patel',
      email: 'aisha@example.com',
      status: 'active',
      healthStatus: 'active',
      tags: ['Placement Ready', 'Backend Expert'],
      lastLogin: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      metrics: { attendanceRate: 100, goalCompletionRate: 90, activityLevel: 95 },
    },
    {
      id: student4Id,
      user_id: student4Id,
      name: 'James Wilson',
      email: 'james@example.com',
      status: 'active',
      healthStatus: 'needs_attention',
      tags: ['Needs Support'],
      lastLogin: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
      metrics: { attendanceRate: 75, goalCompletionRate: 50, activityLevel: 60 },
    },
    {
      id: student5Id,
      user_id: student5Id,
      name: 'Michael Chen',
      email: 'michael@example.com',
      status: 'active',
      healthStatus: 'active',
      tags: ['High Potential'],
      lastLogin: new Date().toISOString(),
      metrics: { attendanceRate: 92, goalCompletionRate: 80, activityLevel: 85 },
    },
  ]);

  await goalStorage.seed([
    {
      id: uid(),
      studentId: student1Id,
      title: 'Complete Resume Revision',
      description: 'Update the resume with recent internship details and format perfectly.',
      progressPercentage: 100,
      milestones: [],
      status: 'completed',
      createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: uid(),
      studentId: student1Id,
      title: 'Conduct 5 Informational Interviews',
      description: 'Reach out to PMs on LinkedIn and conduct 30 min chats.',
      progressPercentage: 40,
      milestones: [
        { id: uid(), title: 'Draft outreach template', completed: true },
        { id: uid(), title: 'Create target list of 20 people', completed: true },
        { id: uid(), title: 'Conduct interviews', completed: false },
      ],
      status: 'in_progress',
      createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: uid(),
      studentId: student1Id,
      title: 'Finalize Portfolio Website',
      description: 'Ship version 1 of portfolio website on Vercel.',
      progressPercentage: 0,
      milestones: [],
      status: 'not_started',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ]);

  const now = new Date();
  const dayMs = 24 * 60 * 60 * 1000;

  const seedTasks = [
    {
      student_id: student1Id, mentor_id: mentorId,
      title: 'Submit updated resume PDF',
      description: 'Make sure it is 1 page and export as PDF.',
      due_date: new Date(now.getTime() + 3 * dayMs).toISOString(),
      status: 'pending',
      created_at: now.toISOString(),
    },
    {
      student_id: student1Id, mentor_id: mentorId,
      title: 'Read PM Interview guide chapter 1',
      description: 'Read the first chapter and write down 3 key takeaways.',
      due_date: new Date(now.getTime() + 5 * dayMs).toISOString(),
      status: 'in_progress',
      created_at: now.toISOString(),
    },
    {
      student_id: student1Id, mentor_id: mentorId,
      title: 'Draft cover letter for Startup X',
      description: 'Use the framework we discussed in the last session.',
      due_date: new Date(now.getTime() - 1 * dayMs).toISOString(),
      status: 'completed',
      created_at: new Date(now.getTime() - 7 * dayMs).toISOString(),
    },
    {
      student_id: student3Id, mentor_id: mentorId,
      title: 'Complete System Design exercise',
      description: 'Design a URL shortener service.',
      due_date: new Date(now.getTime() + 2 * dayMs).toISOString(),
      status: 'in_progress',
      created_at: now.toISOString(),
    },
  ];
  const { error: taskError } = await supabase.from('tasks').insert(seedTasks);
  if (taskError) console.warn('seed tasks:', taskError.message);

  await tagService.seed([
    { id: uid(), label: 'High Potential', color: '#10b981' },
    { id: uid(), label: 'Needs Support', color: '#f59e0b' },
    { id: uid(), label: 'Placement Ready', color: '#3b82f6' },
    { id: uid(), label: 'Backend Expert', color: '#8b5cf6' },
    { id: uid(), label: 'FinTech', color: '#06b6d4' },
  ]);

  await notificationStorage.seed([
    {
      id: uid(), userId: mentorId,
      title: 'New Application',
      message: 'Alex Rivera submitted an application for the mentorship program.',
      read: false, type: 'system',
      createdAt: new Date(now.getTime() - 1 * dayMs).toISOString(),
    },
    {
      id: uid(), userId: mentorId,
      title: 'Session Reminder',
      message: 'Introductory call with Alex Rivera is tomorrow at 10:00 AM.',
      read: false, type: 'session',
      createdAt: now.toISOString(),
    },
    {
      id: uid(), userId: student1Id,
      title: 'New Task Assigned',
      message: 'Sarah assigned you a new task: Submit updated resume PDF.',
      read: false, type: 'task',
      createdAt: now.toISOString(),
    },
    {
      id: uid(), userId: student1Id,
      title: 'Session Scheduled',
      message: 'Resume Review session scheduled for this Thursday at 2:00 PM.',
      read: true, type: 'session',
      createdAt: new Date(now.getTime() - 3 * dayMs).toISOString(),
    },
    {
      id: uid(), userId: mentorId,
      title: 'Task Completed',
      message: 'Alex Rivera completed "Draft cover letter for Startup X".',
      read: false, type: 'task',
      createdAt: new Date(now.getTime() - 1 * dayMs).toISOString(),
    },
  ]);

  await settingsService.seed(mentorId, {
    id: uid(),
    mentorId: mentorId,
    timezone: 'America/New_York',
    sessionDuration: 45,
    bufferTime: 15,
    notificationsEnabled: true,
    workingDays: [1, 2, 3, 4, 5],
    availableHoursStart: '09:00',
    availableHoursEnd: '17:00',
  });

  await studentProgressService.seed([{
    userId: student1Id,
    programId: uid(),
    startedAt: new Date(now.getTime() - 14 * dayMs).toISOString(),
    lessons: {
      [uid()]: {
        completedTopics: ['System Design Fundamentals', 'Scalability Principles', 'Load Balancing'],
        quizCompleted: true,
        completedAt: new Date(now.getTime() - 10 * dayMs).toISOString(),
      },
      [uid()]: {
        completedTopics: ['Microservices Architecture'],
        videoPosition: 0.45,
        quizCompleted: false,
      },
      [uid()]: { completedTopics: [] },
    },
  }]);

  localStorage.setItem(SEED_VERSION_KEY, SEED_VERSION);
  console.log('Mock data seeded successfully.');
};
