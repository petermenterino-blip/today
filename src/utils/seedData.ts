import { supabase } from '../lib/supabase';
import { goalStorage } from '../services/goalStorage';
import { taskStorage } from '../services/taskStorage';
import { studentService } from '../services/studentService';
import { tagService } from '../services/tagService';
import { notificationStorage } from '../services/notificationStorage';
import { settingsService } from '../services/settingsService';
import { studentProgressService } from '../services/studentProgressService';

const SEED_VERSION = 'v5';
const SEED_VERSION_KEY = 'mentorino_seed_version';

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

  await studentService.seed([
    {
      id: 'u1',
      user_id: 'u1',
      name: 'Alex Rivera',
      email: 'alex@example.com',
      status: 'active',
      healthStatus: 'needs_attention',
      tags: ['High Potential', 'Placement Ready'],
      lastLogin: new Date().toISOString(),
      metrics: { attendanceRate: 90, goalCompletionRate: 65, activityLevel: 80 },
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
      metrics: { attendanceRate: 60, goalCompletionRate: 20, activityLevel: 30 },
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
      metrics: { attendanceRate: 100, goalCompletionRate: 90, activityLevel: 95 },
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
      metrics: { attendanceRate: 75, goalCompletionRate: 50, activityLevel: 60 },
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
      metrics: { attendanceRate: 92, goalCompletionRate: 80, activityLevel: 85 },
    },
  ]);

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
      updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
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
        { id: 'm3', title: 'Conduct interviews', completed: false },
      ],
      status: 'in_progress',
      createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date().toISOString(),
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
      updatedAt: new Date().toISOString(),
    },
  ]);

  const now = new Date();
  const dayMs = 24 * 60 * 60 * 1000;

  await taskStorage.seed([
    {
      id: 'task-1', studentId: 'u1', mentorId: 'mentor-1',
      title: 'Submit updated resume PDF',
      description: 'Make sure it is 1 page and export as PDF.',
      dueDate: new Date(now.getTime() + 3 * dayMs).toISOString(),
      status: 'pending',
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    },
    {
      id: 'task-2', studentId: 'u1', mentorId: 'mentor-1',
      title: 'Read PM Interview guide chapter 1',
      description: 'Read the first chapter and write down 3 key takeaways.',
      dueDate: new Date(now.getTime() + 5 * dayMs).toISOString(),
      status: 'in_progress',
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    },
    {
      id: 'task-3', studentId: 'u1', mentorId: 'mentor-1',
      title: 'Draft cover letter for Startup X',
      description: 'Use the framework we discussed in the last session.',
      dueDate: new Date(now.getTime() - 1 * dayMs).toISOString(),
      status: 'completed',
      createdAt: new Date(now.getTime() - 7 * dayMs).toISOString(),
      updatedAt: now.toISOString(),
    },
    {
      id: 'task-4', studentId: 'u4', mentorId: 'mentor-1',
      title: 'Complete System Design exercise',
      description: 'Design a URL shortener service.',
      dueDate: new Date(now.getTime() + 2 * dayMs).toISOString(),
      status: 'in_progress',
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    },
  ]);

  await tagService.seed([
    { id: 'tag-1', label: 'High Potential', color: '#10b981' },
    { id: 'tag-2', label: 'Needs Support', color: '#f59e0b' },
    { id: 'tag-3', label: 'Placement Ready', color: '#3b82f6' },
    { id: 'tag-4', label: 'Backend Expert', color: '#8b5cf6' },
    { id: 'tag-5', label: 'FinTech', color: '#06b6d4' },
  ]);

  await notificationStorage.seed([
    {
      id: 'notif-1', userId: 'mentor-1',
      title: 'New Application',
      message: 'Alex Rivera submitted an application for the mentorship program.',
      read: false, type: 'system',
      createdAt: new Date(now.getTime() - 1 * dayMs).toISOString(),
    },
    {
      id: 'notif-2', userId: 'mentor-1',
      title: 'Session Reminder',
      message: 'Introductory call with Alex Rivera is tomorrow at 10:00 AM.',
      read: false, type: 'session',
      createdAt: now.toISOString(),
    },
    {
      id: 'notif-3', userId: 'u1',
      title: 'New Task Assigned',
      message: 'Sarah assigned you a new task: Submit updated resume PDF.',
      read: false, type: 'task',
      createdAt: now.toISOString(),
    },
    {
      id: 'notif-4', userId: 'u1',
      title: 'Session Scheduled',
      message: 'Resume Review session scheduled for this Thursday at 2:00 PM.',
      read: true, type: 'session',
      createdAt: new Date(now.getTime() - 3 * dayMs).toISOString(),
    },
    {
      id: 'notif-5', userId: 'mentor-1',
      title: 'Task Completed',
      message: 'Alex Rivera completed "Draft cover letter for Startup X".',
      read: false, type: 'task',
      createdAt: new Date(now.getTime() - 1 * dayMs).toISOString(),
    },
  ]);

  await settingsService.seed('mentor-1', {
    id: 'settings-1',
    mentorId: 'mentor-1',
    timezone: 'America/New_York',
    sessionDuration: 45,
    bufferTime: 15,
    notificationsEnabled: true,
    workingDays: [1, 2, 3, 4, 5],
    availableHoursStart: '09:00',
    availableHoursEnd: '17:00',
  });

  await studentProgressService.seed([{
    userId: 'u1',
    programId: '1',
    startedAt: new Date(now.getTime() - 14 * dayMs).toISOString(),
    lessons: {
      'lesson-1': {
        completedTopics: ['System Design Fundamentals', 'Scalability Principles', 'Load Balancing'],
        quizCompleted: true,
        completedAt: new Date(now.getTime() - 10 * dayMs).toISOString(),
      },
      'lesson-2': {
        completedTopics: ['Microservices Architecture'],
        videoPosition: 0.45,
        quizCompleted: false,
      },
      'lesson-3': { completedTopics: [] },
    },
  }]);

  localStorage.setItem(SEED_VERSION_KEY, SEED_VERSION);
  console.log('Mock data seeded successfully.');
};
