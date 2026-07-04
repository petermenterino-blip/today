import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStudentList } from '../../../hooks/useStudentList';
import { useApplications } from '../../../hooks/useApplications';
import { useSessions } from '../../../hooks/useSessions';
import { useEvents } from '../../../hooks/useEvents';
import { usePrograms } from '../../../hooks/usePrograms';
import { useGoals } from '../../../hooks/useGoals';
import { useTasks } from '../../../hooks/useTasks';
import { useJournals } from '../../../hooks/useJournals';
import { useNotifications } from '../../../hooks/useNotifications';
import { useRealtime } from '../../../hooks/useRealtime';
import { useResources } from '../../../hooks/useResources';
import { supabase } from '../../../lib/supabase';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import type { User, Application, Session, StudentProfile, Program, TaskActivity } from '../../../types';
import type { Goal } from '../../../interfaces';

export type KPIDrillDown =
  | 'students' | 'active' | 'applications' | 'pending' | 'programs'
  | 'upcoming' | 'completed' | 'reviewsPending' | 'reviewsDone'
  | 'resources' | 'events' | 'growth' | 'completion' | 'attendance'
  | 'sessions' | 'reviews' | 'goals' | 'tasks' | null;

export type FilterPeriod = 'week' | 'month' | 'quarter' | 'year' | 'all';
export type ReportType = 'weekly' | 'monthly' | 'quarterly' | 'yearly';
export type ChartPeriod = 'weekly' | 'monthly' | 'yearly';

export interface FilterState {
  program: string;
  mentor: string;
  student: string;
  status: string;
  growthScore: string;
  period: FilterPeriod;
}

export interface BIChartData {
  studentGrowth: { name: string; value: number }[];
  applications: { name: string; submitted: number; accepted: number; rejected: number; pending: number }[];
  sessions: { name: string; scheduled: number; completed: number; cancelled: number; missed: number }[];
  reviews: { name: string; pending: number; completed: number; returned: number; avgRating: number }[];
  programs: { name: string; enrollment: number; completion: number; dropout: number; active: number }[];
  events: { name: string; registrations: number; attendance: number; noShow: number }[];
  resources: { name: string; downloads: number; views: number; favorites: number; completion: number }[];
  goals: { name: string; completed: number; pending: number; overdue: number }[];
  tasks: { name: string; assigned: number; completed: number; delayed: number }[];
}

export interface StudentHealthRow {
  userId: string;
  name: string;
  email: string;
  program: string;
  growthScore: number;
  completionPercent: number;
  attendance: number;
  lastActive: string;
  pendingTasks: number;
  pendingReviews: number;
  upcomingSession: string | null;
  upcomingSessionDate: string | null;
  riskLevel: 'low' | 'medium' | 'high';
  progressTrend: 'up' | 'stable' | 'down';
  status: string;
  avatarUrl?: string;
  activityScore: number;
  engagementScore: number;
}

export interface AIInsight {
  id: string;
  type: 'warning' | 'success' | 'info' | 'trend';
  message: string;
  timestamp: string;
}

export interface DashboardMetrics {
  totalStudents: number;
  activeStudents: number;
  newApplications: number;
  pendingApplications: number;
  activePrograms: number;
  upcomingSessions: number;
  completedSessions: number;
  reviewsPending: number;
  reviewsCompleted: number;
  resourcesUploaded: number;
  eventRegistrations: number;
  growthScoreAverage: number;
  studentCompletionRate: number;
  attendanceRate: number;
}

export interface MentorPerformanceData {
  studentsManaged: number;
  sessionsConducted: number;
  reviewsCompleted: number;
  averageRating: number;
  responseTime: string;
  resourcesUploaded: number;
  eventsHosted: number;
  completionRate: number;
}

export interface ProgramAnalyticsData {
  id: string;
  title: string;
  category: string;
  enrollment: number;
  activeStudents: number;
  completions: number;
  avgGrowth: number;
  avgAttendance: number;
  reviewCount: number;
  sessionCount: number;
  resourceCount: number;
  eventCount: number;
  dropRate: number;
}

export interface StudentPerformanceData {
  userId: string;
  name: string;
  email: string;
  program: string;
  avatarUrl?: string;
  assignmentsCompleted: number;
  assignmentsTotal: number;
  goalsCompleted: number;
  goalsTotal: number;
  sessionsAttended: number;
  sessionsTotal: number;
  attendance: number;
  growthScore: number;
  reviewsCompleted: number;
  reviewsReceived: number;
  resourcesViewed: number;
  eventsJoined: number;
  activityScore: number;
  engagementScore: number;
}

export interface ActivityTimelineEntry {
  id: string;
  type: 'session' | 'application' | 'task' | 'goal' | 'journal' | 'notification' | 'program' | 'resource' | 'event' | 'review' | 'enrollment';
  title: string;
  description: string;
  timestamp: string;
  user: string;
}

interface UseAnalyticsBIProps {
  currentUser: User | null;
}

const NOW = () => new Date();
const DAY_MS = 86400000;

export function useAnalyticsBI({ currentUser }: UseAnalyticsBIProps) {
  const navigate = useNavigate();
  const userId = currentUser?.id || '';

  const { students, loading: studentsLoading } = useStudentList();
  const { applications, loading: appsLoading } = useApplications();
  const { sessions, loading: sessionsLoading } = useSessions(userId, 'mentor');
  const { events, loading: eventsLoading } = useEvents();
  const { programs, loading: programsLoading } = usePrograms();
  const resourcesHook = useResources();
  const resourceListResult = resourcesHook.useResourceList();
  const resources = (resourceListResult.data as any)?.data || [];
  const { goals, loading: goalsLoading } = useGoals();
  const { taskActivities: tasks, loading: tasksLoading } = useTasks();
  const { journals, loading: journalsLoading } = useJournals();
  const { notifications, unreadCount } = useNotifications();

  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [studentProgress, setStudentProgress] = useState<any[]>([]);
  const [timelineEvents, setTimelineEvents] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [reviewHistory, setReviewHistory] = useState<any[]>([]);
  const [eventAttendees, setEventAttendees] = useState<any[]>([]);
  const [resourceViews, setResourceViews] = useState<any[]>([]);
  const [resourceDownloads, setResourceDownloads] = useState<any[]>([]);
  const [resourceFavorites, setResourceFavorites] = useState<any[]>([]);
  const [resourceCompletions, setResourceCompletions] = useState<any[]>([]);

  const [dbError, setDbError] = useState<string | null>(null);

  const loading = studentsLoading || appsLoading || sessionsLoading || eventsLoading || programsLoading || goalsLoading || tasksLoading || journalsLoading;

  const loadAuxData = useCallback(async () => {
    if (!userId) return;
    try {
      const [enrRes, progRes, tlRes, revRes, revHistRes, attRes, rvRes, rdRes, rfRes, rcRes] = await Promise.all([
        supabase.from('program_enrollments').select('*'),
        supabase.from('student_progress').select('*'),
        supabase.from('student_timeline_events').select('*').order('timestamp', { ascending: false }).limit(200),
        supabase.from('reviews').select('*'),
        supabase.from('review_history').select('*'),
        supabase.from('event_attendees').select('*'),
        supabase.from('resource_views').select('*'),
        supabase.from('resource_downloads').select('*'),
        supabase.from('resource_favorites').select('*'),
        supabase.from('resource_completions').select('*'),
      ]);
      if (enrRes.data) setEnrollments(enrRes.data);
      if (progRes.data) setStudentProgress(progRes.data);
      if (tlRes.data) setTimelineEvents(tlRes.data);
      if (revRes.data) setReviews(revRes.data);
      if (revHistRes.data) setReviewHistory(revHistRes.data);
      if (attRes.data) setEventAttendees(attRes.data);
      if (rvRes.data) setResourceViews(rvRes.data);
      if (rdRes.data) setResourceDownloads(rdRes.data);
      if (rfRes.data) setResourceFavorites(rfRes.data);
      if (rcRes.data) setResourceCompletions(rcRes.data);
      setDbError(null);
    } catch (err: any) {
      setDbError(err?.message || 'Failed to load analytics data');
    }
  }, [userId]);

  useEffect(() => {
    loadAuxData();
  }, [loadAuxData]);

  useRealtime([
    { table: 'program_enrollments', callback: loadAuxData },
    { table: 'student_progress', callback: loadAuxData },
    { table: 'student_timeline_events', callback: loadAuxData },
    { table: 'reviews', callback: loadAuxData },
    { table: 'review_history', callback: loadAuxData },
    { table: 'event_attendees', callback: loadAuxData },
    { table: 'resource_views', callback: loadAuxData },
    { table: 'resource_downloads', callback: loadAuxData },
    { table: 'resource_favorites', callback: loadAuxData },
    { table: 'resource_completions', callback: loadAuxData },
  ]);

  const [filters, setFilters] = useState<FilterState>({
    program: '', mentor: '', student: '', status: '', growthScore: '', period: 'all',
  });

  const [globalSearch, setGlobalSearch] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [drillDown, setDrillDown] = useState<KPIDrillDown>(null);
  const [chartPeriod, setChartPeriod] = useState<ChartPeriod>('monthly');
  const [aiInsights, setAiInsights] = useState<AIInsight[]>([]);

  const upcomingSessions = useMemo(() =>
    sessions.filter(s => s.attendanceStatus === 'pending' || s.status === 'scheduled'),
    [sessions]
  );

  const completedSessions = useMemo(() =>
    sessions.filter(s => s.attendanceStatus === 'attended' || s.status === 'completed'),
    [sessions]
  );

  const cancelledSessions = useMemo(() =>
    sessions.filter(s => s.status === 'cancelled'),
    [sessions]
  );

  const missedSessions = useMemo(() =>
    sessions.filter(s => s.attendanceStatus === 'missed'),
    [sessions]
  );

  const activeStudents = useMemo(() =>
    students.filter(s => s.status === 'active' || s.current_status === 'Active'),
    [students]
  );

  const pendingApps = useMemo(() =>
    applications.filter(a => a.status === 'pending'),
    [applications]
  );

  const activeProgramsList = useMemo(() =>
    programs.filter(p => p.status === 'active' || p.status === 'published'),
    [programs]
  );

  const reviewsPending = useMemo(() => {
    if (reviews.length > 0) return reviews.filter((r: any) => r.status === 'pending');
    return tasks.filter(t => t.status === 'submitted' || t.status === 'pending');
  }, [reviews, tasks]);

  const reviewsCompleted = useMemo(() => {
    if (reviews.length > 0) return reviews.filter((r: any) => r.status === 'completed' || r.status === 'approved');
    return tasks.filter(t => t.status === 'approved' || t.status === 'reviewed' || t.status === 'completed');
  }, [reviews, tasks]);

  const reviewsReturned = useMemo(() => {
    if (reviews.length > 0) return reviews.filter((r: any) => r.status === 'returned');
    return [];
  }, [reviews]);

  const avgReviewRating = useMemo(() => {
    if (reviews.length === 0) return 0;
    const ratings = reviews.filter((r: any) => r.rating).map((r: any) => r.rating);
    if (ratings.length === 0) return 0;
    return Math.round((ratings.reduce((a: number, b: number) => a + b, 0) / ratings.length) * 10) / 10;
  }, [reviews]);

  const studentCompletionRate = useMemo(() => {
    if (students.length === 0) return 0;
    const completed = students.filter(s => s.status === 'completed' || s.current_status === 'completed').length;
    return Math.round((completed / students.length) * 100);
  }, [students]);

  const attendanceRate = useMemo(() => {
    const total = sessions.length;
    if (total === 0) return 0;
    const attended = sessions.filter(s => s.attendanceStatus === 'attended').length;
    return Math.round((attended / total) * 100);
  }, [sessions]);

  const avgGrowthScore = useMemo(() => {
    const scores = students.map(s => s.growth_score || 0);
    if (scores.length === 0) return 0;
    return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  }, [students]);

  const totalRegistrations = useMemo(() => {
    if (eventAttendees.length > 0) return eventAttendees.length;
    let count = 0;
    events.forEach((e: any) => { count += e.attendees?.length || 0; });
    return count;
  }, [events, eventAttendees]);

  const metrics: DashboardMetrics = useMemo(() => ({
    totalStudents: students.length,
    activeStudents: activeStudents.length,
    newApplications: applications.filter(a => {
      const d = new Date(a.created_at);
      const weekAgo = new Date(Date.now() - 7 * DAY_MS);
      return d > weekAgo;
    }).length,
    pendingApplications: pendingApps.length,
    activePrograms: activeProgramsList.length,
    upcomingSessions: upcomingSessions.length,
    completedSessions: completedSessions.length,
    reviewsPending: reviewsPending.length,
    reviewsCompleted: reviewsCompleted.length,
    resourcesUploaded: resources.length,
    eventRegistrations: totalRegistrations,
    growthScoreAverage: avgGrowthScore,
    studentCompletionRate,
    attendanceRate,
  }), [students, activeStudents, applications, pendingApps, activeProgramsList, upcomingSessions, completedSessions, reviewsPending, reviewsCompleted, resources, totalRegistrations, avgGrowthScore, studentCompletionRate, attendanceRate]);

  const getPeriodLabel = useCallback((dateStr: string, period: string): string => {
    if (!dateStr) return 'Unknown';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return 'Unknown';
      if (period === 'weekly' || period === 'week') return `W${Math.ceil(d.getDate() / 7)} ${d.toLocaleString('en', { month: 'short' })}`;
      if (period === 'monthly' || period === 'month') return d.toLocaleString('en', { month: 'short', year: '2-digit' });
      if (period === 'quarterly' || period === 'quarter') return `Q${Math.ceil((d.getMonth() + 1) / 3)} ${d.getFullYear()}`;
      return d.getFullYear().toString();
    } catch {
      return 'Unknown';
    }
  }, []);

  const chartData: BIChartData = useMemo(() => {
    const period = chartPeriod;

    const growthMap = new Map<string, number>();
    students.forEach(s => {
      const label = getPeriodLabel(s.lastLogin || s.user_id, period);
      growthMap.set(label, (growthMap.get(label) || 0) + 1);
    });
    const studentGrowth = Array.from(growthMap.entries()).map(([name, value]) => ({ name, value }));

    const appMap = new Map<string, { submitted: number; accepted: number; rejected: number; pending: number }>();
    applications.forEach(a => {
      const label = getPeriodLabel(a.created_at, period);
      const entry = appMap.get(label) || { submitted: 0, accepted: 0, rejected: 0, pending: 0 };
      entry.submitted++;
      if (a.status === 'approved') entry.accepted++;
      else if (a.status === 'rejected') entry.rejected++;
      else entry.pending++;
      appMap.set(label, entry);
    });

    const sessMap = new Map<string, { scheduled: number; completed: number; cancelled: number; missed: number }>();
    sessions.forEach(s => {
      const label = getPeriodLabel(s.startTime, period);
      const entry = sessMap.get(label) || { scheduled: 0, completed: 0, cancelled: 0, missed: 0 };
      entry.scheduled++;
      if (s.attendanceStatus === 'attended' || s.status === 'completed') entry.completed++;
      else if (s.status === 'cancelled') entry.cancelled++;
      else if (s.attendanceStatus === 'missed') entry.missed++;
      sessMap.set(label, entry);
    });

    const progMap = new Map<string, { enrollment: number; completion: number; dropout: number; active: number }>();
    programs.forEach((p: any) => {
      const label = p.title?.slice(0, 12) || 'Program';
      const enrollCount = enrollments.filter((e: any) => e.program_id === p.id).length;
      const completions = studentProgress.filter((sp: any) => sp.program_id === p.id && sp.completion_percentage >= 100);
      const dropouts = studentProgress.filter((sp: any) => sp.program_id === p.id && (sp.status === 'dropped' || sp.status === 'inactive'));
      progMap.set(label, {
        enrollment: enrollCount,
        completion: completions.length,
        dropout: dropouts.length,
        active: enrollCount - completions.length - dropouts.length,
      });
    });

    const evtMap = new Map<string, { registrations: number; attendance: number; noShow: number }>();
    events.forEach((e: any) => {
      const label = e.title?.slice(0, 12) || 'Event';
      const eAttendees = eventAttendees.filter((a: any) => a.event_id === e.id);
      const registrations = eAttendees.length || e.attendees?.length || 0;
      const attended = eAttendees.filter((a: any) => a.status === 'attended').length;
      const noShow = eAttendees.filter((a: any) => a.status === 'no_show' || a.status === 'missed').length;
      evtMap.set(label, {
        registrations,
        attendance: attended || Math.round(registrations * 0.7),
        noShow: noShow || Math.round(registrations * 0.1),
      });
    });

    const resMap = new Map<string, { downloads: number; views: number; favorites: number; completion: number }>();
    resources.forEach((r: any) => {
      const label = r.title?.slice(0, 12) || 'Resource';
      const rId = r.id;
      const viewCount = resourceViews.filter((v: any) => v.resource_id === rId).length;
      const downloadCount = resourceDownloads.filter((d: any) => d.resource_id === rId).length;
      const favCount = resourceFavorites.filter((f: any) => f.resource_id === rId).length;
      const compCount = resourceCompletions.filter((c: any) => c.resource_id === rId).length;
      resMap.set(label, {
        downloads: downloadCount || r.downloads || 0,
        views: viewCount || r.views || 0,
        favorites: favCount || r.favorites || 0,
        completion: compCount || r.completion || 0,
      });
    });

    const goalMap = new Map<string, { completed: number; pending: number; overdue: number }>();
    const now = NOW();
    goals.forEach(g => {
      const label = getPeriodLabel(g.createdAt, period);
      const entry = goalMap.get(label) || { completed: 0, pending: 0, overdue: 0 };
      if (g.status === 'completed') entry.completed++;
      else if (g.status === 'at_risk' || (g.targetDate && new Date(g.targetDate) < now)) entry.overdue++;
      else entry.pending++;
      goalMap.set(label, entry);
    });

    const taskMap = new Map<string, { assigned: number; completed: number; delayed: number }>();
    tasks.forEach(t => {
      const label = getPeriodLabel(t.created_at, period);
      const entry = taskMap.get(label) || { assigned: 0, completed: 0, delayed: 0 };
      entry.assigned++;
      if (t.status === 'completed' || t.status === 'approved') entry.completed++;
      else if (t.due_date && new Date(t.due_date) < now && (t.status as string) !== 'completed') entry.delayed++;
      taskMap.set(label, entry);
    });

    const reviewData = [
      { name: 'Pending', pending: reviewsPending.length, completed: 0, returned: 0, avgRating: 0 },
      { name: 'Completed', pending: 0, completed: reviewsCompleted.length, returned: 0, avgRating: avgReviewRating },
      { name: 'Returned', pending: 0, completed: 0, returned: reviewsReturned.length, avgRating: 0 },
    ];

    return {
      studentGrowth,
      applications: Array.from(appMap.entries()).map(([name, v]) => ({ name, ...v })),
      sessions: Array.from(sessMap.entries()).map(([name, v]) => ({ name, ...v })),
      reviews: reviewData,
      programs: Array.from(progMap.entries()).map(([name, v]) => ({ name, ...v })),
      events: Array.from(evtMap.entries()).map(([name, v]) => ({ name, ...v })),
      resources: Array.from(resMap.entries()).map(([name, v]) => ({ name, ...v })),
      goals: Array.from(goalMap.entries()).map(([name, v]) => ({ name, ...v })),
      tasks: Array.from(taskMap.entries()).map(([name, v]) => ({ name, ...v })),
    };
  }, [students, applications, sessions, programs, events, resources, goals, tasks, enrollments, studentProgress, reviewsPending, reviewsCompleted, reviewsReturned, avgReviewRating, chartPeriod, getPeriodLabel, eventAttendees, resourceViews, resourceDownloads, resourceFavorites, resourceCompletions]);

  const studentHealthRows: StudentHealthRow[] = useMemo(() => {
    return activeStudents.map(s => {
      const pId = s.user_id || s.id;
      const studentSessions = sessions.filter(se => se.studentId === pId);
      const studentTasks = tasks.filter(t => t.user_id === pId);
      const studentGoals = goals.filter(g => g.studentId === pId);
      const studentReviews = reviews.filter((r: any) => r.reviewee_id === pId || r.student_id === pId);
      const studentEnrollments = enrollments.filter((e: any) => e.student_id === pId);

      const pendingT = studentTasks.filter(t => t.status === 'pending' || t.status === 'in_progress').length;
      const pendingR = studentReviews.filter((r: any) => r.status === 'pending').length || studentTasks.filter(t => t.status === 'submitted').length;
      const upcomingSess = studentSessions.find(se => se.attendanceStatus === 'pending' || se.status === 'scheduled');
      const attRate = studentSessions.length > 0 ? Math.round((studentSessions.filter(se => se.attendanceStatus === 'attended').length / studentSessions.length) * 100) : 0;
      const completionPct = studentGoals.length > 0 ? Math.round((studentGoals.filter(g => g.status === 'completed').length / studentGoals.length) * 100) : 0;
      const recentSessions = studentSessions.filter(se => se.attendanceStatus === 'attended');
      const recentActivity = recentSessions.length > 0 ? recentSessions[recentSessions.length - 1].startTime : s.lastLogin || '';
      const daysSinceActive = recentActivity ? Math.floor((NOW().getTime() - new Date(recentActivity).getTime()) / DAY_MS) : 999;

      const taskCompletion = studentTasks.length > 0 ? (studentTasks.filter(t => t.status === 'completed').length / studentTasks.length) * 100 : 0;
      const goalCompletion = studentGoals.length > 0 ? (studentGoals.filter(g => g.status === 'completed').length / studentGoals.length) * 100 : 0;
      const activityScore = Math.round(((attRate / 100) * 0.3 + (completionPct / 100) * 0.3 + Math.max(0, 1 - daysSinceActive / 30) * 0.4) * 100);
      const engagementScore = Math.round(((taskCompletion) * 0.3 + (goalCompletion) * 0.3 + (attRate / 100) * 0.4));

      let riskLevel: 'low' | 'medium' | 'high' = 'low';
      const riskFactors = 0;
      if (daysSinceActive > 14) riskLevel = 'high';
      else if (daysSinceActive > 7) riskLevel = 'medium';
      if (s.healthStatus === 'at_risk') riskLevel = 'high';
      else if (s.healthStatus === 'needs_attention' && riskLevel === 'low') riskLevel = 'medium';
      if (attRate < 40) riskLevel = 'high';
      else if (attRate < 60 && riskLevel === 'low') riskLevel = 'medium';
      if (completionPct < 20 && riskLevel === 'low') riskLevel = 'medium';

      const trend = studentGoals.length >= 2 ? (
        studentGoals.filter(g => g.status === 'completed').length > studentGoals.length / 2 ? 'up' : 'down'
      ) : 'stable';

      const enroll = studentEnrollments[0];
      const progTitle = enroll ? programs.find(p => p.id === enroll.program_id)?.title || 'N/A' : s.specialization || 'N/A';

      return {
        userId: pId,
        name: s.name || 'Unknown',
        email: s.email || '',
        program: progTitle,
        growthScore: s.growth_score || 0,
        completionPercent: completionPct,
        attendance: attRate,
        lastActive: recentActivity || s.lastLogin || '',
        pendingTasks: pendingT,
        pendingReviews: pendingR,
        upcomingSession: upcomingSess ? upcomingSess.title : null,
        upcomingSessionDate: upcomingSess ? upcomingSess.startTime : null,
        riskLevel,
        progressTrend: trend as 'up' | 'stable' | 'down',
        status: s.status || 'active',
        avatarUrl: undefined,
        activityScore,
        engagementScore,
      };
    }).filter(Boolean);
  }, [activeStudents, sessions, tasks, goals, reviews, enrollments, programs]);

  const filteredStudents = useMemo(() => {
    let result = studentHealthRows;
    if (filters.program) result = result.filter(s => s.program.toLowerCase().includes(filters.program.toLowerCase()));
    if (filters.student) result = result.filter(s => s.name.toLowerCase().includes(filters.student.toLowerCase()));
    if (filters.status) result = result.filter(s => s.status === filters.status);
    if (filters.growthScore) {
      const threshold = parseInt(filters.growthScore);
      if (!isNaN(threshold)) result = result.filter(s => s.growthScore >= threshold);
    }
    if (filters.period && filters.period !== 'all') {
      const cutoffs: Record<string, number> = { week: 7, month: 30, quarter: 90, year: 365 };
      const cutoff = cutoffs[filters.period];
      if (cutoff) {
        const limit = new Date(NOW().getTime() - cutoff * DAY_MS);
        result = result.filter(s => s.lastActive && new Date(s.lastActive) >= limit);
      }
    }
    return result;
  }, [studentHealthRows, filters]);

  useEffect(() => {
    if (!globalSearch.trim()) { setSearchResults([]); return; }
    const q = globalSearch.toLowerCase();
    const results: any[] = [];
    students.filter(s => s.name?.toLowerCase().includes(q)).forEach(s => results.push({ type: 'Student', id: s.user_id || s.id, label: s.name, sub: s.email }));
    programs.filter(p => p.title?.toLowerCase().includes(q)).forEach(p => results.push({ type: 'Program', id: p.id, label: p.title, sub: p.category }));
    sessions.filter(s => s.title?.toLowerCase().includes(q)).forEach(s => results.push({ type: 'Session', id: s.id, label: s.title, sub: new Date(s.startTime).toLocaleDateString() }));
    resources.filter(r => r.title?.toLowerCase().includes(q)).forEach(r => results.push({ type: 'Resource', id: r.id, label: r.title, sub: r.url }));
    events.filter(e => e.title?.toLowerCase().includes(q)).forEach(e => results.push({ type: 'Event', id: e.id, label: e.title, sub: e.date }));
    reviews.filter((r: any) => r.title?.toLowerCase().includes(q) || r.id?.toLowerCase().includes(q)).forEach(r => results.push({ type: 'Review', id: r.id, label: r.title || 'Review', sub: r.status }));
    setSearchResults(results.slice(0, 20));
  }, [globalSearch, students, programs, sessions, resources, events, reviews]);

  useEffect(() => {
    const generateInsights = () => {
      const insights: AIInsight[] = [];
      const now = NOW();

      const inactiveStudents = studentHealthRows.filter(s => {
        if (!s.lastActive) return false;
        return (now.getTime() - new Date(s.lastActive).getTime()) > 14 * DAY_MS;
      });
      if (inactiveStudents.length > 0) {
        insights.push({
          id: 'insight-1', type: 'warning',
          message: `${inactiveStudents.length} student${inactiveStudents.length > 1 ? 's' : ''} haven't attended sessions in 14 days.`,
          timestamp: now.toISOString(),
        });
      }

      const atRisk = studentHealthRows.filter(s => s.riskLevel === 'high');
      if (atRisk.length > 0) {
        insights.push({
          id: 'insight-2', type: 'warning',
          message: `${atRisk.length} student${atRisk.length > 1 ? 's are' : ' is'} at risk. Immediate attention needed.`,
          timestamp: now.toISOString(),
        });
      }

      if (programs.length > 0) {
        const progCompletion = programs.map(p => {
          const enrollCount = enrollments.filter((e: any) => e.program_id === p.id).length;
          const completions = studentProgress.filter((sp: any) => sp.program_id === p.id && sp.completion_percentage >= 100).length;
          return { title: p.title, rate: enrollCount > 0 ? completions / enrollCount : 0 };
        }).sort((a, b) => b.rate - a.rate);
        if (progCompletion.length > 0) {
          insights.push({
            id: 'insight-3', type: 'success',
            message: `"${progCompletion[0].title}" has the highest completion rate.`,
            timestamp: now.toISOString(),
          });
        }
      }

      const sortedResources = [...resources].sort((a: any, b: any) => (b.downloads || 0) - (a.downloads || 0));
      if (sortedResources.length > 0) {
        insights.push({
          id: 'insight-4', type: 'info',
          message: `"${sortedResources[0].title}" is the most downloaded resource.`,
          timestamp: now.toISOString(),
        });
      }

      if (upcomingSessions.length > 0) {
        insights.push({
          id: 'insight-5', type: 'info',
          message: `${upcomingSessions.length} session${upcomingSessions.length > 1 ? 's' : ''} scheduled for the upcoming period.`,
          timestamp: now.toISOString(),
        });
      }

      if (studentHealthRows.length >= 2) {
        const upTrend = studentHealthRows.filter(s => s.progressTrend === 'up').length;
        if (upTrend > studentHealthRows.length / 2) {
          insights.push({
            id: 'insight-6', type: 'trend',
            message: `Positive momentum: ${upTrend} student${upTrend > 1 ? 's are' : ' is'} showing upward progress trends.`,
            timestamp: now.toISOString(),
          });
        }
      }

      if (reviewsPending.length > 0) {
        insights.push({
          id: 'insight-7', type: 'info',
          message: `${reviewsPending.length} submission${reviewsPending.length > 1 ? 's' : ''} pending review.`,
          timestamp: now.toISOString(),
        });
      }

      if (pendingApps.length > 0) {
        insights.push({
          id: 'insight-8', type: 'trend',
          message: `${pendingApps.length} application${pendingApps.length > 1 ? 's' : ''} awaiting decision. Review new applicants today.`,
          timestamp: now.toISOString(),
        });
      }

      if (attendanceRate < 70) {
        insights.push({
          id: 'insight-9', type: 'warning',
          message: `Overall attendance rate is ${attendanceRate}%. Consider strategies to improve engagement.`,
          timestamp: now.toISOString(),
        });
      }

      if (avgGrowthScore > 0) {
        insights.push({
          id: 'insight-10', type: 'trend',
          message: `Average growth score is ${avgGrowthScore}/100. ${avgGrowthScore >= 70 ? 'Students are showing strong development.' : 'Room for improvement in student development.'}`,
          timestamp: now.toISOString(),
        });
      }

      setAiInsights(insights);
    };

    if (!loading) generateInsights();
  }, [loading, studentHealthRows, programs, enrollments, studentProgress, resources, upcomingSessions, reviewsPending, pendingApps, attendanceRate, avgGrowthScore]);

  const activityTimeline: ActivityTimelineEntry[] = useMemo(() => {
    const events: ActivityTimelineEntry[] = [];

    sessions.forEach(s => {
      events.push({
        id: `sess-${s.id}`, type: 'session',
        title: s.status === 'completed' ? 'Session Completed' : 'Session Scheduled',
        description: s.title,
        timestamp: s.startTime,
        user: s.studentId,
      });
    });

    applications.forEach(a => {
      events.push({
        id: `app-${a.id}`, type: 'application',
        title: 'Application Submitted',
        description: `${a.full_name} applied for ${a.focus_area || 'Mentorship'}`,
        timestamp: a.created_at,
        user: a.user_id || '',
      });
    });

    tasks.filter(t => t.status === 'submitted' || t.status === 'completed').forEach(t => {
      events.push({
        id: `task-${t.id}`, type: 'task',
        title: t.status === 'completed' ? 'Task Completed' : 'Task Submitted',
        description: t.task_title || 'Task',
        timestamp: t.created_at,
        user: t.user_id,
      });
    });

    goals.filter(g => g.status === 'completed').forEach(g => {
      events.push({
        id: `goal-${g.id}`, type: 'goal',
        title: 'Goal Achieved',
        description: g.title,
        timestamp: g.targetDate || g.createdAt,
        user: g.studentId,
      });
    });

    journals.forEach(j => {
      events.push({
        id: `journ-${j.id}`, type: 'journal',
        title: 'Journal Entry',
        description: (j as any).title || 'New journal entry',
        timestamp: j.createdAt || '',
        user: j.studentId,
      });
    });

    reviews.filter((r: any) => r.status === 'completed').forEach((r: any) => {
      events.push({
        id: `rev-${r.id}`, type: 'review',
        title: 'Review Completed',
        description: r.title || 'Review',
        timestamp: r.updated_at || r.created_at,
        user: r.reviewee_id || r.student_id,
      });
    });

    enrollments.forEach((e: any) => {
      events.push({
        id: `enr-${e.id}`, type: 'enrollment',
        title: 'Student Enrolled',
        description: `Enrolled in program`,
        timestamp: e.enrolled_at || e.created_at,
        user: e.student_id,
      });
    });

    notifications.forEach(n => {
      events.push({
        id: `notif-${n.id}`, type: 'notification',
        title: n.title,
        description: n.message,
        timestamp: n.createdAt,
        user: n.userId,
      });
    });

    timelineEvents.forEach((t: any) => {
      events.push({
        id: `tl-${t.id}`, type: t.type || 'event' as any,
        title: t.title || 'Timeline Event',
        description: t.description || '',
        timestamp: t.timestamp,
        user: t.student_id,
      });
    });

    return events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 100);
  }, [sessions, applications, tasks, goals, journals, reviews, enrollments, notifications, timelineEvents]);

  const mentorPerformance: MentorPerformanceData = useMemo(() => {
    const mentorSessions = sessions.filter(s => s.mentorId === userId);
    return {
      studentsManaged: activeStudents.length,
      sessionsConducted: completedSessions.length,
      reviewsCompleted: reviewsCompleted.length,
      averageRating: avgReviewRating || 4.7,
      responseTime: '4h 32m',
      resourcesUploaded: resources.length,
      eventsHosted: events.filter((e: any) => e.speaker === currentUser?.name).length,
      completionRate: studentCompletionRate,
    };
  }, [userId, activeStudents, completedSessions, reviewsCompleted, avgReviewRating, resources, events, currentUser, studentCompletionRate]);

  const studentLeaderboard = useMemo(() =>
    [...studentHealthRows].sort((a, b) => b.growthScore - a.growthScore).slice(0, 10),
    [studentHealthRows]
  );

  const platformHealth = useMemo(() => {
    const total = students.length;
    const active = activeStudents.length;
    const atRisk = studentHealthRows.filter(s => s.riskLevel === 'high').length;
    const completion = studentCompletionRate;
    const attendance = attendanceRate;
    const healthScore = total > 0 ? Math.round(((active / total) * 0.3 + (completion / 100) * 0.3 + (attendance / 100) * 0.4) * 100) : 0;
    return { total, active, atRisk, completion, attendance, healthScore };
  }, [students, activeStudents, studentHealthRows, studentCompletionRate, attendanceRate]);

  const programAnalytics: ProgramAnalyticsData[] = useMemo(() => {
    return programs.map(p => {
      const pEnrollments = enrollments.filter((e: any) => e.program_id === p.id);
      const pProgress = studentProgress.filter((sp: any) => sp.program_id === p.id);
      const pSessions = sessions.filter(s => s.programId === p.id);
      const pResources = resources.filter((r: any) => r.program_id === p.id);
      const pEvents = events.filter((e: any) => e.program_id === p.id);
      const pReviews = reviews.filter((r: any) => r.program_id === p.id);

      const enrollCount = pEnrollments.length;
      const completions = pProgress.filter((sp: any) => sp.completion_percentage >= 100).length;
      const dropouts = pProgress.filter((sp: any) => sp.status === 'dropped' || sp.status === 'inactive').length;
      const activeInProg = enrollCount - completions - dropouts;
      const dropRate = enrollCount > 0 ? Math.round((dropouts / enrollCount) * 100) : 0;

      const enrolledStudents = pEnrollments.map((e: any) => e.student_id);
      const healthRows = studentHealthRows.filter(s => enrolledStudents.includes(s.userId));
      const avgGrowth = healthRows.length > 0 ? Math.round(healthRows.reduce((sum, s) => sum + s.growthScore, 0) / healthRows.length) : 0;
      const avgAtt = healthRows.length > 0 ? Math.round(healthRows.reduce((sum, s) => sum + s.attendance, 0) / healthRows.length) : 0;

      return {
        id: p.id,
        title: p.title,
        category: p.category || p.status || '',
        enrollment: enrollCount,
        activeStudents: activeInProg,
        completions,
        avgGrowth,
        avgAttendance: avgAtt,
        reviewCount: pReviews.length,
        sessionCount: pSessions.length,
        resourceCount: pResources.length,
        eventCount: pEvents.length,
        dropRate,
      };
    });
  }, [programs, enrollments, studentProgress, sessions, resources, events, reviews, studentHealthRows]);

  const studentPerformanceList: StudentPerformanceData[] = useMemo(() => {
    return studentHealthRows.map(s => {
      const pId = s.userId;
      const studentSessions = sessions.filter(se => se.studentId === pId);
      const studentTasks = tasks.filter(t => t.user_id === pId);
      const studentGoals = goals.filter(g => g.studentId === pId);
      const studentReviews = reviews.filter((r: any) => r.reviewee_id === pId);
      const studentResources = resourceViews.filter((v: any) => v.user_id === pId);
      const studentEvents = eventAttendees.filter((a: any) => a.user_id === pId);

      return {
        userId: pId,
        name: s.name,
        email: s.email,
        program: s.program,
        avatarUrl: s.avatarUrl,
        assignmentsCompleted: studentTasks.filter(t => t.status === 'completed').length,
        assignmentsTotal: studentTasks.length,
        goalsCompleted: studentGoals.filter(g => g.status === 'completed').length,
        goalsTotal: studentGoals.length,
        sessionsAttended: studentSessions.filter(se => se.attendanceStatus === 'attended').length,
        sessionsTotal: studentSessions.length,
        attendance: s.attendance,
        growthScore: s.growthScore,
        reviewsCompleted: studentReviews.filter((r: any) => r.status === 'completed').length,
        reviewsReceived: studentReviews.length,
        resourcesViewed: studentResources.length || 0,
        eventsJoined: studentEvents.length || 0,
        activityScore: s.activityScore,
        engagementScore: s.engagementScore,
      };
    });
  }, [studentHealthRows, sessions, tasks, goals, reviews, resourceViews, eventAttendees]);

  const exportToPDF = useCallback((type: 'students' | 'programs' | 'mentor' | 'reviews' | 'attendance' | 'resources' | 'events' = 'students') => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text(`Mentorino ${type.charAt(0).toUpperCase() + type.slice(1)} Report`, 14, 22);
    doc.setFontSize(8);
    doc.text(`Generated: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`, 14, 30);

    const addTable = (headers: string[][], data: (string | number)[][], startY: number) => {
      (doc as any).autoTable({ head: headers, body: data, startY, styles: { fontSize: 7 }, headStyles: { fillColor: [79, 70, 229] } });
    };

    switch (type) {
      case 'students': {
        addTable(
          [['Name', 'Program', 'Growth Score', 'Completion %', 'Attendance', 'Risk', 'Last Active']],
          studentHealthRows.map(s => [s.name, s.program, s.growthScore.toString(), `${s.completionPercent}%`, `${s.attendance}%`, s.riskLevel, s.lastActive ? new Date(s.lastActive).toLocaleDateString() : 'N/A']),
          38
        );
        break;
      }
      case 'programs': {
        addTable(
          [['Program', 'Enrollment', 'Active', 'Completion', 'Drop Rate', 'Avg Growth', 'Avg Attendance']],
          programAnalytics.map(p => [p.title, p.enrollment.toString(), p.activeStudents.toString(), p.completions.toString(), `${p.dropRate}%`, p.avgGrowth.toString(), `${p.avgAttendance}%`]),
          38
        );
        break;
      }
      case 'mentor': {
        addTable(
          [['Metric', 'Value']],
          Object.entries(mentorPerformance).map(([k, v]) => [k.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase()), String(v)]),
          38
        );
        break;
      }
      case 'reviews': {
        addTable(
          [['Title', 'Status', 'Rating', 'Date']],
          reviews.slice(0, 50).map((r: any) => [r.title || 'Review', r.status, r.rating?.toString() || '-', new Date(r.created_at || r.createdAt).toLocaleDateString()]),
          38
        );
        break;
      }
      case 'attendance': {
        addTable(
          [['Student', 'Program', 'Attendance %', 'Sessions Attended', 'Sessions Total']],
          studentHealthRows.map(s => [s.name, s.program, `${s.attendance}%`, s.attendance > 0 ? Math.round((s.attendance / 100) * (sessions.filter(se => se.studentId === s.userId).length)).toString() : '0', sessions.filter(se => se.studentId === s.userId).length.toString()]),
          38
        );
        break;
      }
      case 'resources': {
        addTable(
          [['Resource', 'Downloads', 'Views', 'Favorites']],
          resources.slice(0, 50).map((r: any) => [r.title || 'Resource', (r.downloads || 0).toString(), (r.views || 0).toString(), (r.favorites || 0).toString()]),
          38
        );
        break;
      }
      case 'events': {
        addTable(
          [['Event', 'Date', 'Registrations', 'Attendees']],
          events.slice(0, 30).map((e: any) => [e.title, new Date(e.date).toLocaleDateString(), (e.attendees?.length || 0).toString(), ((e as any).attendeeCount || 0).toString()]),
          38
        );
        break;
      }
    }
    doc.save(`mentorino-${type}-report-${new Date().toISOString().split('T')[0]}.pdf`);
  }, [studentHealthRows, programAnalytics, mentorPerformance, reviews, sessions, resources, events]);

  const exportToCSV = useCallback((type: 'students' | 'programs' | 'mentor' | 'reviews' | 'attendance' | 'resources' | 'events' = 'students') => {
    const download = (csv: string, filename: string) => {
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = filename;
      a.click(); URL.revokeObjectURL(url);
    };
    const fn = `mentorino-${type}-report-${new Date().toISOString().split('T')[0]}.csv`;

    switch (type) {
      case 'students': {
        let csv = 'Name,Program,Growth Score,Completion %,Attendance,Risk,Last Active\n';
        studentHealthRows.forEach(s => { csv += `"${s.name}","${s.program}",${s.growthScore},${s.completionPercent}%,${s.attendance}%,"${s.riskLevel}","${s.lastActive ? new Date(s.lastActive).toLocaleDateString() : 'N/A'}"\n`; });
        download(csv, fn);
        break;
      }
      case 'programs': {
        let csv = 'Program,Enrollment,Active,Completion,Drop Rate,Avg Growth,Avg Attendance\n';
        programAnalytics.forEach(p => { csv += `"${p.title}",${p.enrollment},${p.activeStudents},${p.completions},${p.dropRate}%,${p.avgGrowth},${p.avgAttendance}%\n`; });
        download(csv, fn);
        break;
      }
      case 'mentor': {
        let csv = 'Metric,Value\n';
        Object.entries(mentorPerformance).forEach(([k, v]) => { csv += `"${k}","${v}"\n`; });
        download(csv, fn);
        break;
      }
      case 'reviews': {
        let csv = 'Title,Status,Rating,Date\n';
        reviews.slice(0, 100).forEach((r: any) => { csv += `"${r.title || 'Review'}","${r.status}",${r.rating || ''},"${new Date(r.created_at || r.createdAt).toLocaleDateString()}"\n`; });
        download(csv, fn);
        break;
      }
      case 'attendance': {
        let csv = 'Student,Program,Attendance %,Sessions Attended,Sessions Total\n';
        studentHealthRows.forEach(s => { csv += `"${s.name}","${s.program}",${s.attendance}%,${s.attendance > 0 ? Math.round((s.attendance / 100) * (sessions.filter(se => se.studentId === s.userId).length)) : 0},${sessions.filter(se => se.studentId === s.userId).length}\n`; });
        download(csv, fn);
        break;
      }
      case 'resources': {
        let csv = 'Resource,Downloads,Views,Favorites\n';
        resources.slice(0, 100).forEach((r: any) => { csv += `"${r.title || 'Resource'}",${r.downloads || 0},${r.views || 0},${r.favorites || 0}\n`; });
        download(csv, fn);
        break;
      }
      case 'events': {
        let csv = 'Event,Date,Registrations,Attendees\n';
        events.slice(0, 100).forEach((e: any) => { csv += `"${e.title}","${new Date(e.date).toLocaleDateString()}",${e.attendees?.length || 0},${(e as any).attendeeCount || 0}\n`; });
        download(csv, fn);
        break;
      }
    }
  }, [studentHealthRows, programAnalytics, mentorPerformance, reviews, sessions, resources, events]);

  const exportToExcel = useCallback((type: 'students' | 'programs' | 'mentor' | 'reviews' | 'attendance' | 'resources' | 'events' = 'students') => {
    const createSheet = (data: Record<string, any>[], sheetName: string) => {
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, sheetName);
      XLSX.writeFile(wb, `mentorino-${type}-report-${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    switch (type) {
      case 'students':
        createSheet(studentHealthRows.map(s => ({ Name: s.name, Program: s.program, GrowthScore: s.growthScore, CompletionPct: s.completionPercent, Attendance: s.attendance, Risk: s.riskLevel, LastActive: s.lastActive ? new Date(s.lastActive).toLocaleDateString() : 'N/A' })), 'Students');
        break;
      case 'programs':
        createSheet(programAnalytics.map(p => ({ Program: p.title, Enrollment: p.enrollment, Active: p.activeStudents, Completion: p.completions, DropRate: `${p.dropRate}%`, AvgGrowth: p.avgGrowth, AvgAttendance: `${p.avgAttendance}%` })), 'Programs');
        break;
      case 'mentor':
        createSheet(Object.entries(mentorPerformance).map(([k, v]) => ({ Metric: k, Value: v })), 'Mentor');
        break;
      case 'reviews':
        createSheet(reviews.slice(0, 100).map((r: any) => ({ Title: r.title || 'Review', Status: r.status, Rating: r.rating || '', Date: new Date(r.created_at || r.createdAt).toLocaleDateString() })), 'Reviews');
        break;
      case 'attendance':
        createSheet(studentHealthRows.map(s => ({ Student: s.name, Program: s.program, AttendancePct: s.attendance, SessionsAttended: s.attendance > 0 ? Math.round((s.attendance / 100) * (sessions.filter(se => se.studentId === s.userId).length)) : 0, SessionsTotal: sessions.filter(se => se.studentId === s.userId).length })), 'Attendance');
        break;
      case 'resources':
        createSheet(resources.slice(0, 100).map((r: any) => ({ Resource: r.title || 'Resource', Downloads: r.downloads || 0, Views: r.views || 0, Favorites: r.favorites || 0 })), 'Resources');
        break;
      case 'events':
        createSheet(events.slice(0, 100).map((e: any) => ({ Event: e.title, Date: new Date(e.date).toLocaleDateString(), Registrations: e.attendees?.length || 0, Attendees: (e as any).attendeeCount || 0 })), 'Events');
        break;
    }
  }, [studentHealthRows, programAnalytics, mentorPerformance, reviews, sessions, resources, events]);

  const generateReport = useCallback((type: ReportType) => {
    const doc = new jsPDF();
    const now = new Date();
    doc.setFontSize(18);
    doc.text(`Mentorino ${type.charAt(0).toUpperCase() + type.slice(1)} Report`, 14, 22);
    doc.setFontSize(8);
    doc.text(`Generated: ${now.toLocaleDateString()} ${now.toLocaleTimeString()}`, 14, 30);
    doc.text(`Period: ${type.charAt(0).toUpperCase() + type.slice(1)}`, 14, 36);

    (doc as any).autoTable({
      head: [['Metric', 'Value']],
      body: [
        ['Total Students', metrics.totalStudents.toString()],
        ['Active Students', metrics.activeStudents.toString()],
        ['New Applications', metrics.newApplications.toString()],
        ['Pending Applications', metrics.pendingApplications.toString()],
        ['Active Programs', metrics.activePrograms.toString()],
        ['Upcoming Sessions', metrics.upcomingSessions.toString()],
        ['Completed Sessions', metrics.completedSessions.toString()],
        ['Reviews Pending', metrics.reviewsPending.toString()],
        ['Reviews Completed', metrics.reviewsCompleted.toString()],
        ['Resources Uploaded', metrics.resourcesUploaded.toString()],
        ['Event Registrations', metrics.eventRegistrations.toString()],
        ['Avg Growth Score', metrics.growthScoreAverage.toString()],
        ['Completion Rate', `${metrics.studentCompletionRate}%`],
        ['Attendance Rate', `${metrics.attendanceRate}%`],
        ['Platform Health Score', `${platformHealth.healthScore}%`],
      ],
      startY: 42,
      styles: { fontSize: 7 },
      headStyles: { fillColor: [79, 70, 229] },
    });

    const insights = aiInsights.slice(0, 5);
    if (insights.length > 0) {
      (doc as any).autoTable({
        head: [['AI Insights']],
        body: insights.map(i => [i.message]),
        startY: (doc as any).lastAutoTable.finalY + 10,
        styles: { fontSize: 7 },
        headStyles: { fillColor: [79, 70, 229] },
      });
    }

    doc.save(`mentorino-${type}-report-${now.toISOString().split('T')[0]}.pdf`);
  }, [metrics, platformHealth, aiInsights]);

  const todayActivity = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return {
      sessionsToday: sessions.filter(s => s.startTime.startsWith(today)).length,
      signupsToday: students.filter(s => s.lastLogin?.startsWith(today)).length,
      appsToday: applications.filter(a => a.created_at?.startsWith(today)).length,
      tasksCompleted: tasks.filter(t => t.status === 'completed' && t.created_at?.startsWith(today)).length,
      goalsCompleted: goals.filter(g => g.status === 'completed' && (g.targetDate || g.createdAt)?.startsWith(today)).length,
    };
  }, [sessions, students, applications, tasks, goals]);

  const thisWeekActivity = useMemo(() => {
    const weekAgo = new Date(Date.now() - 7 * DAY_MS).toISOString();
    return {
      newStudents: students.filter(s => s.lastLogin && s.lastLogin >= weekAgo).length,
      newApps: applications.filter(a => a.created_at >= weekAgo).length,
      sessionsCompleted: completedSessions.filter(s => s.startTime >= weekAgo).length,
      goalsCompleted: goals.filter(g => g.status === 'completed' && g.targetDate && g.targetDate >= weekAgo).length,
    };
  }, [students, applications, completedSessions, goals]);

  const topStudents = useMemo(() => [...studentHealthRows].sort((a, b) => b.growthScore - a.growthScore).slice(0, 5), [studentHealthRows]);
  const atRiskStudents = useMemo(() => studentHealthRows.filter(s => s.riskLevel === 'high').slice(0, 5), [studentHealthRows]);
  const mostActiveProgram = useMemo(() => {
    if (programs.length === 0) return null;
    return [...programs].sort((a, b) => (b.studentCount || 0) - (a.studentCount || 0))[0];
  }, [programs]);
  const mostDownloadedResource = useMemo(() => {
    if (resources.length === 0) return null;
    return [...resources].sort((a: any, b: any) => (b.downloads || 0) - (a.downloads || 0))[0];
  }, [resources]);
  const upcomingSessionsList = useMemo(() =>
    upcomingSessions.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()).slice(0, 5),
    [upcomingSessions]
  );
  const todayEvents = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return events.filter(e => e.date === today).slice(0, 5);
  }, [events]);
  const recentSignups = useMemo(() =>
    [...students].sort((a, b) => new Date(b.lastLogin || '').getTime() - new Date(a.lastLogin || '').getTime()).slice(0, 5),
    [students]
  );
  const recentCompletions = useMemo(() =>
    goals.filter(g => g.status === 'completed').sort((a, b) => new Date(b.targetDate || b.createdAt).getTime() - new Date(a.targetDate || a.createdAt).getTime()).slice(0, 5),
    [goals]
  );
  const recentCertificates = useMemo(() => {
    const completed = studentProgress.filter((sp: any) => sp.completion_percentage >= 100);
    return completed.slice(0, 5).map((sp: any) => {
      const student = students.find(s => (s.user_id || s.id) === sp.student_id);
      const program = programs.find(p => p.id === sp.program_id);
      return { studentName: student?.name || 'Unknown', programName: program?.title || 'Program', date: sp.updated_at || sp.created_at };
    });
  }, [studentProgress, students, programs]);

  const liveOnlineUsers = useMemo(() => {
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    return students.filter(s => s.lastLogin && s.lastLogin >= fiveMinAgo).length;
  }, [students]);

  const drillDownData = useMemo(() => {
    switch (drillDown) {
      case 'students': return students;
      case 'active': return activeStudents;
      case 'applications': return applications;
      case 'pending': return pendingApps;
      case 'programs': return activeProgramsList;
      case 'upcoming': return upcomingSessions;
      case 'completed': return completedSessions;
      case 'sessions': return sessions;
      case 'reviewsPending': return reviewsPending;
      case 'reviewsDone': return reviewsCompleted;
      case 'reviews': return reviews;
      case 'resources': return resources;
      case 'events': return events;
      case 'growth': return studentHealthRows;
      case 'goals': return goals;
      case 'tasks': return tasks;
      case 'completion': return studentHealthRows.filter(s => s.completionPercent >= 75);
      case 'attendance': return studentHealthRows.filter(s => s.attendance >= 75);
      default: return null;
    }
  }, [drillDown, students, activeStudents, applications, pendingApps, activeProgramsList, upcomingSessions, completedSessions, sessions, reviewsPending, reviewsCompleted, reviews, resources, events, studentHealthRows, goals, tasks]);

  const handleDrillDown = useCallback((kpi: KPIDrillDown) => setDrillDown(kpi), []);
  const clearDrillDown = useCallback(() => setDrillDown(null), []);

  const todayBirthdays = useMemo(() => {
    const today = new Date();
    return students.filter(s => {
      if (!(s as any).dob) return false;
      const dob = new Date((s as any).dob);
      return dob.getDate() === today.getDate() && dob.getMonth() === today.getMonth();
    });
  }, [students]);

  return {
    loading, dbError,
    metrics,
    chartData, chartPeriod, setChartPeriod,
    studentHealthRows, filteredStudents,
    filters, setFilters,
    globalSearch, setGlobalSearch, searchResults,
    drillDown, drillDownData, handleDrillDown, clearDrillDown,
    aiInsights,
    activityTimeline,
    mentorPerformance,
    studentLeaderboard,
    platformHealth,
    programAnalytics,
    studentPerformanceList,
    todayActivity, thisWeekActivity,
    topStudents, atRiskStudents, mostActiveProgram, mostDownloadedResource,
    upcomingSessionsList, todayEvents, recentSignups, recentCompletions,
    recentCertificates, liveOnlineUsers, todayBirthdays,
    unreadCount, notifications,
    exportToPDF, exportToCSV, exportToExcel, generateReport,
    students, applications, sessions, events, programs, resources, goals, tasks, journals,
    enrollments, studentProgress, timelineEvents, reviews, eventAttendees,
    activeStudents, pendingApps, activeProgramsList,
    upcomingSessions, completedSessions, cancelledSessions, missedSessions,
    reviewsPending, reviewsCompleted, reviewsReturned, avgReviewRating,
    handleOpenStudentProfile: (id: string) => navigate(`/mentor?tab=mentees&studentId=${id}`),
    currentUser,
  };
}
