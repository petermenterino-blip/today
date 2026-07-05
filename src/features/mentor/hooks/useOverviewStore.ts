import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../../context/AuthContext';
import { useRealtimeData } from '../../../hooks/useRealtimeData';
import { useApplications } from '../../../hooks/useApplications';
import { useTasks } from '../../../hooks/useTasks';
import { useSessions } from '../../../hooks/useSessions';
import { useEvents } from '../../../hooks/useEvents';
import { usePrograms } from '../../../hooks/usePrograms';
import { useResources } from '../../../hooks/useResources';
import { useGoals } from '../../../hooks/useGoals';
import { useJournals } from '../../../hooks/useJournals';
import { useReviews } from '../../../hooks/useReviews';
import { useNotifications } from '../../../hooks/useNotifications';
import { useMentees } from './useMentees';
import { useMessaging } from '../../../hooks/useMessaging';
import { messageService } from '../../../services/messageService';
import { supabase } from '../../../lib/supabase';
import type { StudentProfile, Session, Application, Program, Conversation } from '../../../types';

export type MentorStatus = 'active' | 'busy' | 'in_session' | 'offline' | 'away';

export interface Priority {
  id: string;
  label: string;
  count: number;
  icon: string;
  color: string;
  action: string;
  tab: string;
}

export interface RiskStudent {
  studentId: string;
  name: string;
  avatar?: string;
  program?: string;
  currentWeek?: number;
  riskScore: number;
  riskLevel: 'high' | 'medium' | 'low';
  reason: string;
  suggestedAction: string;
  attendance: number;
  goalCompletion: number;
  lastActive?: string;
}

export interface ActivityEvent {
  id: string;
  studentId: string;
  studentName: string;
  studentAvatar?: string;
  activity: string;
  type: 'session' | 'goal' | 'assignment' | 'journal' | 'application' | 'program-start' | 'program-complete' | 'review' | 'message' | 'resource' | 'event' | 'gallery';
  timestamp: string;
  icon: string;
  color: string;
}

export interface HealthMetric {
  label: string;
  value: number;
  color: string;
  desc: string;
  tab?: string;
}

export function useOverviewStore() {
  const { user: currentUser } = useAuth();
  const userId = currentUser?.id;
  const queryClient = useQueryClient();

  const [studentProfiles, setStudentProfiles] = useState<StudentProfile[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [communities, setCommunities] = useState<Conversation[]>([]);
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [studentCounts, setStudentCounts] = useState({ accepted: 0, active: 0, notArchived: 0, assigned: 0 });
  const [mentorStatus, setMentorStatus] = useState<MentorStatus>('active');

  const { applications, loading: appsLoading, refresh: refreshApps } = useApplications();
  const { taskActivities, loading: tasksLoading } = useTasks();
  const { sessions, loading: sessionsLoading } = useSessions(userId, 'mentor');
  const { events: rawEvents, loading: eventsLoading } = useEvents();
  const { programs: rawPrograms, loading: programsLoading } = usePrograms();
  const { goals, loading: goalsLoading } = useGoals();
  const { journals, refresh: refreshJournals } = useJournals();
  const reviewDomain = useReviews();
  const { notifications, unreadCount, loading: notifLoading } = useNotifications();

  const { data: resources = [] } = (useResources() as any).useResourceList?.({}) ?? { data: [] };
  const resourcesLoading = false;

  const messaging = useMessaging(userId || '', 'mentor');
  const { refetchConversations } = messaging;

  const activeTabRef = useRef('overview');

  useRealtimeData([
    { table: 'program_enrollments', queryKey: ['enrollments'] },
    { table: 'event_attendees', queryKey: ['events'] },
    { table: 'gallery_items', queryKey: ['gallery'] },
  ]);

  useEffect(() => {
    if (!userId) return;

    const loadInitialData = async () => {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, user_id, name, email, mentor_id, status, current_status, health_status, last_login, goal_progress, specialization, avatar_url, role')
        .eq('role', 'student')
        .limit(200);
      if (profiles) {
        const studentProfilesData = profiles as any;
        const mentorProfiles = studentProfilesData.filter((p: any) => p.mentor_id === userId);
        setStudentProfiles(studentProfilesData);
        setStudentCounts({
          accepted: mentorProfiles.filter((p: any) => p.status === 'active' || p.status === 'accepted').length,
          active: mentorProfiles.filter((p: any) => p.status === 'active').length,
          notArchived: mentorProfiles.filter((p: any) => p.status !== 'archived' && p.status !== 'completed').length,
          assigned: mentorProfiles.length,
        });
      }

      const [convos, allConvos] = await Promise.all([
        messageService.getConversations(userId, 'mentor'),
        messageService.getAllConversations(),
      ]);
      setConversations(convos);
      setCommunities(allConvos.filter(c => c.isGroup && c.mentorId === userId));

      const { data: enrolls } = await supabase.from('program_enrollments').select('*, programs!inner(*)');
      if (enrolls) setEnrollments(enrolls);
    };

    loadInitialData();
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel('overview-mentor-status')
      .on('postgres_changes' as any, { event: '*', schema: 'public', table: 'profiles', filter: `id=eq.${userId}` }, () => { refreshMentorStatus(); })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [userId]);

  const refreshMentorStatus = useCallback(async () => {
    if (!userId) return;
    const now = new Date();
    const currentSession = sessions.find(s => s.studentId === userId && new Date(s.startTime) <= now && new Date(s.endTime) >= now);
    if (currentSession) { setMentorStatus('in_session'); return; }
    setMentorStatus('active');
  }, [userId, sessions]);

  const sessionsToday = useMemo(() =>
    sessions.filter(s => s.startTime && new Date(s.startTime).toDateString() === new Date().toDateString()),
    [sessions]
  );

  const upcomingSessions = useMemo(() =>
    sessions.filter(s => s.attendanceStatus === 'pending' || s.status === 'scheduled'),
    [sessions]
  );

  const nextSession = useMemo(() => {
    const now = new Date();
    const upcoming = sessions.filter(s => s.startTime && new Date(s.startTime) > now).sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
    return upcoming[0] || null;
  }, [sessions]);

  const pendingApplications = useMemo(() =>
    applications.filter(a => a.status === 'pending'),
    [applications]
  );

  const pendingTasks = useMemo(() =>
    taskActivities.filter(t => t.status === 'pending' || t.status === 'submitted'),
    [taskActivities]
  );

  const conversationsUnread = useMemo(() =>
    conversations.reduce((sum, c) => sum + (c.unreadCount || 0), 0),
    [conversations]
  );

  const activeStudentsCount = useMemo(() =>
    studentProfiles.filter(p => p.status === 'active' || p.current_status === 'Active').length,
    [studentProfiles]
  );

  const programs = useMemo(() => rawPrograms, [rawPrograms]);
  const currentProgram = useMemo(() => programs[0] || null, [programs]);
  const nextProgram = useMemo(() => programs[1] || null, [programs]);

  const activeEnrollments = useMemo(() => {
    if (!currentProgram) return [];
    return enrollments.filter((e: any) => e.program_id === currentProgram.id);
  }, [enrollments, currentProgram]);

  const priorities = useMemo((): Priority[] => {
    const list: Priority[] = [];

    if (pendingApplications.length > 0) {
      list.push({ id: 'apps', label: `Review ${pendingApplications.length} Application${pendingApplications.length > 1 ? 's' : ''}`, count: pendingApplications.length, icon: 'FileText', color: 'bg-indigo-500', action: 'Open Applications', tab: 'applications' });
    }

    if (upcomingSessions.length > 0) {
      const nearest = upcomingSessions[0];
      const sessionTime = nearest.startTime ? new Date(nearest.startTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }) : '';
      list.push({ id: 'session', label: `Today's session at ${sessionTime}`, count: upcomingSessions.length, icon: 'Calendar', color: 'bg-emerald-500', action: 'Open Session', tab: 'sessions' });
    }

    if (conversationsUnread > 0) {
      list.push({ id: 'messages', label: `Respond to ${conversationsUnread} unread message${conversationsUnread > 1 ? 's' : ''}`, count: conversationsUnread, icon: 'MessageSquare', color: 'bg-amber-500', action: 'Open Messaging', tab: 'messaging' });
    }

    if (pendingTasks.length > 0) {
      list.push({ id: 'tasks', label: `Review ${pendingTasks.length} pending assignment${pendingTasks.length > 1 ? 's' : ''}`, count: pendingTasks.length, icon: 'ClipboardList', color: 'bg-purple-500', action: 'Open Reviews', tab: 'feedback' });
    }

    const overdueTasks = taskActivities.filter(t => t.status === 'pending' && t.due_date && new Date(t.due_date) < new Date());
    if (overdueTasks.length > 0) {
      list.push({ id: 'overdue', label: `${overdueTasks.length} overdue task${overdueTasks.length > 1 ? 's' : ''}`, count: overdueTasks.length, icon: 'AlertTriangle', color: 'bg-red-500', action: 'Open Tasks', tab: 'feedback' });
    }

    const reviewStats = {
      pending: reviewDomain.reviews.filter(r => ['assigned', 'pending', 'submitted', 'in_review'].includes(r.status)).length,
    };
    if (reviewStats.pending > 0) {
      list.push({ id: 'reviews', label: `${reviewStats.pending} pending review${reviewStats.pending > 1 ? 's' : ''}`, count: reviewStats.pending, icon: 'Star', color: 'bg-pink-500', action: 'Open Reviews', tab: 'feedback' });
    }

    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const inactiveStudents = studentProfiles.filter(p => p.status === 'active' && (!p.lastLogin || new Date(p.lastLogin) < sevenDaysAgo));
    if (inactiveStudents.length > 0) {
      list.push({ id: 'inactive', label: `${inactiveStudents.length} inactive student${inactiveStudents.length > 1 ? 's' : ''}`, count: inactiveStudents.length, icon: 'UserX', color: 'bg-orange-500', action: 'View Students', tab: 'mentees' });
    }

    const missedSessions = sessions.filter(s => s.attendanceStatus === 'missed');
    if (missedSessions.length > 0) {
      list.push({ id: 'missed', label: `${missedSessions.length} missed session${missedSessions.length > 1 ? 's' : ''}`, count: missedSessions.length, icon: 'XCircle', color: 'bg-rose-500', action: 'View Sessions', tab: 'sessions' });
    }

    const atRiskStudents = studentProfiles.filter(p => p.status === 'at_risk' || p.healthStatus === 'at_risk');
    if (atRiskStudents.length > 0) {
      list.push({ id: 'atrisk', label: `${atRiskStudents.length} student${atRiskStudents.length > 1 ? 's' : ''} need${atRiskStudents.length === 1 ? 's' : ''} attention`, count: atRiskStudents.length, icon: 'AlertCircle', color: 'bg-red-600', action: 'View At-Risk', tab: 'mentees' });
    }

    return list.slice(0, 5);
  }, [pendingApplications, upcomingSessions, conversationsUnread, pendingTasks, taskActivities, reviewDomain.reviews, studentProfiles, sessions]);

  const engagementRate = useMemo(() => {
    if (activeStudentsCount === 0) return 0;
    const active7d = studentProfiles.filter(p => {
      if (p.status !== 'active') return false;
      if (!p.lastLogin) return false;
      const last = new Date(p.lastLogin);
      return (Date.now() - last.getTime()) < 7 * 24 * 60 * 60 * 1000;
    }).length;
    return Math.round((active7d / activeStudentsCount) * 100);
  }, [studentProfiles, activeStudentsCount]);

  const sessionCompletionRate = useMemo(() => {
    const total = sessions.length;
    if (total === 0) return 0;
    const completed = sessions.filter(s => s.attendanceStatus === 'attended' || s.status === 'completed').length;
    return Math.round((completed / total) * 100);
  }, [sessions]);

  const appReviewRate = useMemo(() => {
    const total = applications.length;
    if (total === 0) return 0;
    const reviewed = applications.filter(a => a.status !== 'pending').length;
    return Math.round((reviewed / total) * 100);
  }, [applications]);

  const goalCompletionRate = useMemo(() => {
    const total = goals.length;
    if (total === 0) return 0;
    const completed = goals.filter(g => g.status === 'completed').length;
    return Math.round((completed / total) * 100);
  }, [goals]);

  const healthMetrics: HealthMetric[] = useMemo(() => [
    { label: 'Student Engagement', value: engagementRate, color: 'from-emerald-500 to-teal-600', desc: 'Students active in last 7 days', tab: 'analytics' },
    { label: 'Session Completion', value: sessionCompletionRate, color: 'from-indigo-500 to-blue-600', desc: 'Sessions completed / scheduled', tab: 'sessions' },
    { label: 'Application Reviews', value: appReviewRate, color: 'from-purple-500 to-indigo-600', desc: 'Reviewed / total applications', tab: 'applications' },
    { label: 'Goal Completion', value: goalCompletionRate, color: 'from-amber-500 to-orange-600', desc: 'Goals achieved / total goals', tab: 'mentees' },
  ], [engagementRate, sessionCompletionRate, appReviewRate, goalCompletionRate]);

  const activityTimeline = useMemo((): ActivityEvent[] => {
    const timeline: ActivityEvent[] = [];

    sessions.forEach(s => {
      if (s.attendanceStatus === 'attended' || s.status === 'completed') {
        const student = studentProfiles.find(p => p.user_id === s.studentId);
        timeline.push({
          id: `session-${s.id}`, studentId: s.studentId, studentName: student?.name || 'Student', studentAvatar: (student as any)?.avatar_url,
          activity: `Completed session: "${s.title}"`, type: 'session', timestamp: s.startTime || s.createdAt,
          icon: 'Calendar', color: 'text-amber-600',
        });
      }
    });

    goals.forEach(g => {
      if (g.status === 'completed') {
        const student = studentProfiles.find(p => p.user_id === g.studentId);
        timeline.push({
          id: `goal-${g.id}`, studentId: g.studentId, studentName: student?.name || 'Student', studentAvatar: (student as any)?.avatar_url,
          activity: `Achieved goal: "${g.title}"`, type: 'goal', timestamp: g.targetDate || new Date().toISOString(),
          icon: 'CheckCircle', color: 'text-emerald-600',
        });
      }
    });

    taskActivities.forEach(t => {
      if (t.status === 'submitted' || t.status === 'completed' || t.status === 'approved') {
        timeline.push({
          id: `task-${t.id}`, studentId: t.user_id, studentName: t.user_name || 'Student',
          activity: `Submitted assignment: "${(t as any).title || t.task_title}"`, type: 'assignment',
          timestamp: (t as any).dueDate || t.due_date || t.created_at, icon: 'ClipboardList', color: 'text-indigo-600',
        });
      }
    });

    journals.forEach(j => {
      const student = studentProfiles.find(p => p.user_id === j.studentId);
      timeline.push({
        id: `journal-${j.id}`, studentId: j.studentId, studentName: student?.name || 'Student', studentAvatar: (student as any)?.avatar_url,
        activity: `Created journal entry`, type: 'journal',
        timestamp: j.createdAt || new Date().toISOString(), icon: 'FileText', color: 'text-pink-600',
      });
    });

    applications.forEach(a => {
      if (a.status === 'approved') {
        timeline.push({
          id: `app-approved-${a.id}`, studentId: a.user_id || '', studentName: a.full_name || 'Applicant',
          activity: `Application approved`, type: 'application',
          timestamp: a.updated_at || a.created_at || new Date().toISOString(), icon: 'Users', color: 'text-emerald-600',
        });
      } else if (a.status === 'pending') {
        timeline.push({
          id: `app-${a.id}`, studentId: a.user_id || '', studentName: a.full_name || 'Applicant',
          activity: `Submitted application`, type: 'application',
          timestamp: a.created_at || new Date().toISOString(), icon: 'FileText', color: 'text-purple-600',
        });
      }
    });

    studentProfiles.forEach(p => {
      if (p.status === 'active') {
        timeline.push({
          id: `joined-${p.user_id}`, studentId: p.user_id, studentName: p.name || 'Student', studentAvatar: (p as any)?.avatar_url,
          activity: `Joined program`, type: 'program-start',
          timestamp: p.lastLogin || new Date().toISOString(), icon: 'UserPlus', color: 'text-blue-600',
        });
      }
    });

    resources.forEach((r: any) => {
      timeline.push({
        id: `resource-${r.id}`, studentId: r.uploaded_by || '', studentName: 'Mentor',
        activity: `Uploaded resource: "${r.title}"`, type: 'resource',
        timestamp: r.created_at || new Date().toISOString(), icon: 'BookOpen', color: 'text-cyan-600',
      });
    });

    reviewDomain.reviews.forEach(r => {
      if (r.status === 'completed') {
        timeline.push({
          id: `review-${r.id}`, studentId: r.student_id || '', studentName: r.student_name || 'Student',
          activity: `Review completed`, type: 'review',
          timestamp: r.completed_at || r.created_at || new Date().toISOString(), icon: 'Star', color: 'text-yellow-600',
        });
      }
    });

    return timeline.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 20);
  }, [sessions, goals, taskActivities, journals, applications, studentProfiles, resources, reviewDomain.reviews]);

  const atRiskStudents = useMemo((): RiskStudent[] => {
    const list: RiskStudent[] = [];
    const now = new Date();

    studentProfiles.forEach(p => {
      const pId = p.user_id || p.id;
      if (!pId) return;
      let reason = '';
      let riskScore = 0;
      let riskLevel: 'high' | 'medium' | 'low' = 'low';
      let suggestedAction = '';

      if (p.status === 'at_risk' || p.healthStatus === 'at_risk') {
        reason = 'No active communication for 14+ days';
        riskScore = 85;
        riskLevel = 'high';
        suggestedAction = 'Reach out immediately';
      } else if (p.healthStatus === 'needs_attention') {
        reason = 'Missed recent coaching session';
        riskScore = 65;
        riskLevel = 'medium';
        suggestedAction = 'Schedule catch-up session';
      }

      const studentSessions = sessions.filter(s => s.studentId === pId);
      const attended = studentSessions.filter(s => s.attendanceStatus === 'attended').length;
      const missed = studentSessions.filter(s => s.attendanceStatus === 'missed').length;
      const attendanceRate = studentSessions.length > 0 ? Math.round((attended / studentSessions.length) * 100) : 0;

      if (!reason && attendanceRate < 70) {
        reason = `Attendance rate: ${attendanceRate}%`;
        riskScore = Math.max(riskScore, 55);
        riskLevel = riskLevel === 'low' ? 'medium' : riskLevel;
        suggestedAction = 'Investigate attendance issues';
      }

      const studentGoals = goals.filter(g => g.studentId === pId);
      const completedGoals = studentGoals.filter(g => g.status === 'completed').length;
      const goalCompletion = studentGoals.length > 0 ? Math.round((completedGoals / studentGoals.length) * 100) : 0;

      if (!reason && goalCompletion < 30 && studentGoals.length > 0) {
        reason = `Goal completion: ${goalCompletion}%`;
        riskScore = Math.max(riskScore, 50);
        riskLevel = riskLevel === 'low' ? 'low' : riskLevel;
        suggestedAction = 'Review and reset goals';
      }

      const studentTasks = taskActivities.filter(t => t.user_id === pId);
      const overdueTasks = studentTasks.filter(t => t.status === 'pending' && t.due_date && new Date(t.due_date) < now);
      if (overdueTasks.length > 0 && !reason) {
        reason = `Overdue: "${overdueTasks[0].task_title}"`;
        riskScore = Math.max(riskScore, 70);
        riskLevel = 'high';
        suggestedAction = 'Follow up on overdue tasks';
      }

      if (p.lastLogin) {
        const daysSinceLogin = (now.getTime() - new Date(p.lastLogin).getTime()) / (24 * 60 * 60 * 1000);
        if (daysSinceLogin > 14 && !reason) {
          reason = `Inactive for ${Math.floor(daysSinceLogin)} days`;
          riskScore = Math.max(riskScore, 80);
          riskLevel = 'high';
          suggestedAction = 'Send re-engagement message';
        } else if (daysSinceLogin > 7 && !reason) {
          reason = `Inactive for ${Math.floor(daysSinceLogin)} days`;
          riskScore = Math.max(riskScore, 40);
          riskLevel = 'low';
          suggestedAction = 'Send check-in message';
        }
      }

      if (reason) {
        list.push({
          studentId: pId, name: p.name || p.email || 'Student', program: p.specialization || 'N/A',
          riskScore, riskLevel, reason, suggestedAction,
          attendance: attendanceRate, goalCompletion,
          lastActive: p.lastLogin,
        });
      }
    });

    return list.sort((a, b) => b.riskScore - a.riskScore).slice(0, 10);
  }, [studentProfiles, sessions, goals, taskActivities]);

  const stats = useMemo(() => ({
    todaySessions: sessionsToday.length,
    pendingReviews: pendingTasks.length + reviewDomain.reviews.filter(r => ['assigned', 'pending', 'submitted', 'in_review'].includes(r.status)).length,
    unreadMessages: conversationsUnread,
    applications: pendingApplications.length,
    pendingForms: 0,
    upcomingEvents: rawEvents.filter((e: any) => e.status === 'published' || !e.status).length,
    resourcesShared: resources.length,
    avgStudentProgress: studentProfiles.length > 0 ? Math.round(studentProfiles.reduce((acc, s) => acc + (s.goal_progress || 0), 0) / studentProfiles.length) : 0,
    attendanceRate: sessions.length > 0 ? Math.round((sessions.filter(s => s.attendanceStatus === 'attended').length / sessions.length) * 100) : 0,
    completionRate: goals.length > 0 ? Math.round((goals.filter(g => g.status === 'completed').length / goals.length) * 100) : 0,
  }), [sessionsToday, pendingTasks, reviewDomain.reviews, conversationsUnread, pendingApplications, rawEvents, resources, studentProfiles, sessions, goals]);

  const avgResponseTimeStr = useMemo(() => {
    const repliedConvos = conversations.filter(c => c.lastMessage && c.createdAt);
    if (repliedConvos.length === 0) return '—';
    let totalDiff = 0;
    let count = 0;
    repliedConvos.forEach(c => {
      const created = new Date(c.createdAt).getTime();
      const last = new Date(c.lastMessage).getTime();
      if (last > created) { totalDiff += last - created; count++; }
    });
    if (count === 0) return '—';
    const avgMs = totalDiff / count;
    const avgHours = avgMs / (1000 * 60 * 60);
    if (avgHours < 1) return `${Math.round(avgHours * 60)}m`;
    return `${avgHours.toFixed(1)}h`;
  }, [conversations]);

  const studentSatisfactionScore = useMemo(() => {
    const completedReviews = reviewDomain.reviews.filter(r => r.status === 'completed' && (r as any).rating);
    if (completedReviews.length === 0) {
      if (stats.attendanceRate > 0) return stats.attendanceRate;
      if (goalCompletionRate > 0) return goalCompletionRate;
      return null;
    }
    const avgRating = completedReviews.reduce((acc, r) => acc + ((r as any).rating || 0), 0) / completedReviews.length;
    return Math.round(avgRating * 20);
  }, [reviewDomain.reviews, stats.attendanceRate, goalCompletionRate]);

  const performanceCards = useMemo(() => ({
    studentSatisfaction: studentSatisfactionScore,
    attendance: stats.attendanceRate,
    sessionsThisWeek: sessions.filter(s => { const d = new Date(s.startTime); const now = new Date(); const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay())); startOfWeek.setHours(0,0,0,0); return d >= startOfWeek; }).length,
    completionRate: stats.completionRate,
    assignmentsReviewed: taskActivities.filter(t => t.status === 'approved' || t.status === 'reviewed').length,
    messagesReplied: conversations.filter(c => c.lastMessage).length,
    applicationsProcessed: applications.filter(a => a.status !== 'pending').length,
    avgResponseTime: avgResponseTimeStr,
  }), [studentSatisfactionScore, stats, sessions, taskActivities, conversations, applications, avgResponseTimeStr]);

  const chartData = useMemo(() => {
    const now = new Date();
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const m = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({ name: m.toLocaleString('default', { month: 'short' }), label: m.toLocaleString('default', { month: 'long', year: 'numeric' }) });
    }

    const totalEnrollments = studentCounts.assigned || activeStudentsCount;
    const growthData = months.map((m, idx) => {
      const fraction = (idx + 1) / months.length;
      return { name: m.name, active: Math.round(totalEnrollments * fraction) };
    });
    if (growthData.length > 0) growthData[growthData.length - 1].active = totalEnrollments;

    const weeklySessions = sessions.filter(s => s.startTime && new Date(s.startTime) >= new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000));
    const weeks = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
    const sessionData = weeks.map((name, idx) => {
      const weekStart = new Date(now.getTime() - (4 - idx) * 7 * 24 * 60 * 60 * 1000);
      const weekEnd = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000);
      const weekSessions = weeklySessions.filter(s => { const d = new Date(s.startTime); return d >= weekStart && d < weekEnd; });
      return { name, completed: weekSessions.filter(s => s.attendanceStatus === 'attended').length, scheduled: weekSessions.length };
    });

    const programData = programs.slice(0, 6).map(p => ({
      name: p.title?.slice(0, 15) || 'Program',
      rate: p.progress || (activeEnrollments.length > 0 ? Math.round(activeEnrollments.filter((e: any) => e.program_id === p.id && (e as any).status === 'active').length / Math.max(activeEnrollments.length, 1) * 100) : 0),
    }));

    return { growth: growthData, sessions: sessionData, completions: programData.length > 0 ? programData : [{ name: 'No Data', rate: 0 }] };
  }, [activeStudentsCount, sessions, programs, studentCounts, activeEnrollments]);

  const upcomingEvents = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return rawEvents
      .filter((e: any) => e.date >= today && (e.status === 'published' || !e.status))
      .sort((a: any, b: any) => a.date.localeCompare(b.date) || (a.time || '00:00').localeCompare(b.time || '00:00'))
      .slice(0, 5);
  }, [rawEvents]);

  const calendarPreview7 = useMemo(() => {
    const days = [];
    const today = new Date();
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() + i);
      const dStr = date.toISOString().split('T')[0];
      const daySessions = sessions.filter(s => s.startTime?.startsWith(dStr));
      const dayEvents = rawEvents.filter((e: any) => e.date === dStr);
      days.push({ date, sessions: daySessions, events: dayEvents });
    }
    return days;
  }, [sessions, rawEvents]);

  const recentBroadcasts = useMemo(() => {
    return notifications.slice(0, 5);
  }, [notifications]);

  const overallMentoringHealth = useMemo(() => {
    const healthy = studentProfiles.filter(p => p.status === 'active' && p.healthStatus !== 'at_risk' && p.healthStatus !== 'needs_attention').length;
    const atRisk = studentProfiles.filter(p => p.status === 'at_risk' || p.healthStatus === 'at_risk').length;
    const inactive = studentProfiles.filter(p => p.status === 'active' && p.lastLogin && (Date.now() - new Date(p.lastLogin).getTime()) > 14 * 24 * 60 * 60 * 1000).length;
    const needsReview = pendingApplications.length + pendingTasks.length;
    return { healthy, atRisk, inactive, needsReview };
  }, [studentProfiles, pendingApplications, pendingTasks]);

  const aiDailySummary = useMemo(() => {
    const parts: string[] = [];
    if (sessionsToday.length > 0) parts.push(`${sessionsToday.length} session${sessionsToday.length > 1 ? 's' : ''} today`);
    const behind = atRiskStudents.filter(r => r.riskLevel === 'high').length;
    if (behind > 0) parts.push(`${behind} student${behind > 1 ? 's' : ''} behind schedule`);
    if (pendingApplications.length > 0) parts.push(`${pendingApplications.length} application${pendingApplications.length > 1 ? 's' : ''} pending`);
    if (engagementRate > 0 && engagementRate !== 100) parts.push(`Average engagement ${engagementRate}%`);
    if (stats.attendanceRate > 0) parts.push(`Attendance ${stats.attendanceRate}%`);
    return parts.length > 0 ? `You have: ${parts.join(' • ')}` : 'All clear — no outstanding items.';
  }, [sessionsToday, atRiskStudents, pendingApplications, engagementRate, stats.attendanceRate]);

  const sortedUpcomingSessions = useMemo(() =>
    [...upcomingSessions].sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()),
    [upcomingSessions]
  );

  const formatRelativeTime = useCallback((isoString: string) => {
    try {
      const date = new Date(isoString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);
      if (diffMs < 0) return 'Just now';
      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays === 1) return 'Yesterday';
      if (diffDays < 7) return `${diffDays}d ago`;
      return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    } catch { return 'Recently'; }
  }, []);

  const loading = {
    apps: appsLoading,
    sessions: sessionsLoading,
    programs: programsLoading,
    goals: goalsLoading,
    tasks: tasksLoading,
    events: eventsLoading,
    resources: resourcesLoading,
    notifications: notifLoading,
  };

  return {
    currentUser,
    userId,

    mentorStatus,
    studentProfiles,
    conversations,
    communities,
    studentCounts,

    applications,
    sessions,
    sessionsToday,
    upcomingSessions,
    sortedUpcomingSessions,
    nextSession,
    pendingApplications,
    pendingTasks,
    conversationsUnread,
    activeStudentsCount,
    programs,
    currentProgram,
    nextProgram,
    activeEnrollments,
    enrollments,
    goals,
    journals,
    resources,
    rawEvents: rawEvents as any[],
    taskActivities,
    reviewDomain,

    notifications,
    unreadCount,

    priorities,
    engagementRate,
    sessionCompletionRate,
    appReviewRate,
    goalCompletionRate,
    healthMetrics,
    activityTimeline,
    atRiskStudents,
    stats,
    performanceCards,
    chartData,
    upcomingEvents,
    calendarPreview7,
    recentBroadcasts,
    overallMentoringHealth,
    aiDailySummary,

    loading,
    formatRelativeTime,
    setStudentProfiles,
    setConversations,
    setCommunities,
    refreshApps,
  };
}
