import { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  User,
  Application,
  Booking,
  TaskActivity,
  NetworkEvent,
  AIChatMessage,
  StudentTag,
  CustomForm,
  FormSubmission,
  StudentProfile,
  Program,
  Conversation
} from '../../../types';
import { useApplications } from '../../../hooks/useApplications';
import { useTasks } from '../../../hooks/useTasks';
import { useBookings } from '../../../hooks/useBookings';
import { useSessions } from '../../../hooks/useSessions';
import { useEvents } from '../../../hooks/useEvents';
import { usePrograms } from '../../../hooks/usePrograms';
import { useResources } from '../../../hooks/useResources';
import { useGoals } from '../../../hooks/useGoals';
import { useJournals } from '../../../hooks/useJournals';
import { messageService } from '../../../services/messageService';
import { notificationStorage } from '../../../services/notificationStorage';
import { customFormService } from '../../../services/customFormService';
import { notifySuccess, notifyError } from '../../../utils/toast';
import { useDatabaseSync } from '../../../hooks/useDatabaseSync';
import { useRealtime } from '../../../hooks/useRealtime';
import { useMentees } from './useMentees';
import { useFeedback } from './useFeedback';
import { useApplicationReview } from './useApplicationReview';
import { useEventManager } from './useEventManager';
import { useProgramManager } from './useProgramManager';
import { useReviews } from '../../../hooks/useReviews';
import { useAIAssistant } from './useAIAssistant';

export type MentorTab = 'overview' | 'applications' | 'mentees' | 'programs' | 'sessions' | 'feedback' | 'resources' | 'events' | 'messaging' | 'analytics' | 'ai' | 'gallery' | 'bookings' | 'growth-audit' | 'program-progress';

interface UseDashboardProps {
  currentUser: User | null;
}

export function useDashboard({ currentUser }: UseDashboardProps) {
  const location = useLocation();
  const navigate = useNavigate();

  // ── Tab state ──
  const [activeTab, setActiveTab] = useState<MentorTab>(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    return (tab as MentorTab) || 'overview';
  });

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    if (tab && tab !== activeTab) {
      setActiveTab(tab as MentorTab);
    } else if (!tab && activeTab !== 'overview') {
      setActiveTab('overview');
    }
  }, [location.search]);

  const handleTabChange = (tab: MentorTab) => {
    setActiveTab(tab);
    setSelectedMenteeId(null);
    if (tab === 'overview') {
      navigate('/mentor');
    } else {
      navigate(`/mentor?tab=${tab}`);
    }
  };

  // ── Domain hooks ──
  const menteeDomain = useMentees(currentUser);
  const feedbackDomain = useFeedback();
  const appReviewDomain = useApplicationReview(currentUser);
  const eventDomain = useEventManager(currentUser);
  const programDomain = useProgramManager(currentUser);
  const reviewDomain = useReviews();

  const { applications: rawApplications, loading: appsLoading, refresh: rawRefreshApps } = useApplications();
  const { taskActivities: rawTasks, loading: tasksLoading } = useTasks();
  const { bookings, loading: bookingsLoading, addBooking } = useBookings();
  const { sessions, loading: sessionsLoading, addSession, updateSession, deleteSession, refresh: refreshSessions } = useSessions(currentUser?.id, 'mentor');
  const { events: rawEvents, loading: eventsLoading } = useEvents();
  const { programs: rawPrograms, loading: programsLoading } = usePrograms();
  const {
    useResourceList: useResList, createResource: createResourceMut, softDeleteResource: softDelResource,
  } = useResources();
  const { data: resources = [] } = useResList({}) as any;
  const resourcesLoading = false;
  const addResource = createResourceMut;
  const deleteResource = softDelResource;
  const { goals, loading: goalsLoading } = useGoals();
  const { journals, refresh: refreshJournals } = useJournals();

  const applications = appReviewDomain.applications;
  const events = eventDomain.events;
  const programs = programDomain.programs;

  // ── Cross-domain re-exports from domain hooks ──
  const {
    searchQuery, setSearchQuery,
    studentProfiles, setStudentProfiles,
    selectedMenteeId, setSelectedMenteeId,
    menteeSubTab, setMenteeSubTab,
    menteeNotes, setMenteeNotes,
    isSavingNotes, setIsSavingNotes,
    editingStrength, setEditingStrength,
    editingFocus, setEditingFocus,
    strengthInput, setStrengthInput,
    focusInput, setFocusInput,
    newTaskTitle, setNewTaskTitle,
    newTaskPriority, setNewTaskPriority,
    newTaskDueDate, setNewTaskDueDate,
    allTags, setAllTags,
    isAddingTag, setIsAddingTag,
    newTagLabel, setNewTagLabel,
    newTagColor, setNewTagColor,
    mentees, filteredMentees,
    taskActivities, addTask,
    handleAddTag, toggleMenteeTag, handleUpdateNotes, handleSaveStrengthFocus,
    menteeGoals,
    handleAddGoal, handleUpdateGoal, handleDeleteGoal,
  } = menteeDomain;

  const {
    selectedTask, setSelectedTask,
    feedbackResponse, setFeedbackResponse,
    pendingTasks,
    handleReviewTask, submitFeedback,
  } = feedbackDomain;

  const {
    selectedApplication, setSelectedApplication,
    appSearch, setAppSearch,
    appStatus, setAppStatus,
    appDiscipline, setAppDiscipline,
    appSortBy, setAppSortBy,
    appSortOrder, setAppSortOrder,
    appPage, setAppPage,
    appLimit, setAppLimit,
    modalTab, setModalTab,
    applicationDetails, setApplicationDetails,
    detailsLoading, setDetailsLoading,
    newNoteText, setNewNoteText,
    editingNoteId, setEditingNoteId,
    editingNoteText, setEditingNoteText,
    requestInfoText, setRequestInfoText,
    isRequestingInfo, setIsRequestingInfo,
    isRejecting, setIsRejecting,
    rejectionReason, setRejectionReason,
    rejectionFeedback, setRejectionFeedback,
    pendingApplications,
    filteredAppsForTab,
    handleApplicationAction,
    refreshApps,
    updateAppStatus,
  } = appReviewDomain;

  const {
    isCreatingEvent, setIsCreatingEvent,
    editingEventId, setEditingEventId,
    eventErrors, setEventErrors,
    newEventData, setNewEventData,
    handleEditEventClick,
    handleCancelEventEdit,
    handleSaveEvent,
    deleteEvent,
  } = eventDomain;

  const {
    isCreatingProgram, setIsCreatingProgram,
    programWizardStep, setProgramWizardStep,
    newProgramData, setNewProgramData,
    editingProgram, setEditingProgram,
    editFormTab, setEditFormTab,
    newModuleTitle, setNewModuleTitle,
    newModuleDesc, setNewModuleDesc,
    newResourceTitle, setNewResourceTitle,
    newResourceUrl, setNewResourceUrl,
    newAssignmentTitle, setNewAssignmentTitle,
    newAssignmentDesc, setNewAssignmentDesc,
    newOutcomeInput, setNewOutcomeInput,
    newSkillInput, setNewSkillInput,
    newPrereqInput, setNewPrereqInput,
    handleEditProgramClick,
    handleSaveProgramEdit,
    addProgram, deleteProgram,
  } = programDomain;

  // ── AI Assistant ──
  const aiDomain = useAIAssistant({
    studentProfiles,
    sessions,
    applications,
    programs,
    userId: currentUser?.id,
  });

  const {
    chatHistory, setChatHistory,
    userInput, setUserInput,
    isAiLoading,
    streamingContent,
    chatEndRef,
    isGeneratingOverview, setIsGeneratingOverview,
    aiOverviewText, setAiOverviewText,
    isAnalyzingApps, setIsAnalyzingApps,
    appsAnalysisResult, setAppsAnalysisResult,
    isGeneratingSessionIntel, setIsGeneratingSessionIntel,
    sessionIntelResult, setSessionIntelResult,
    isGeneratingRecommendations, setIsGeneratingRecommendations,
    recommendationsResult, setRecommendationsResult,
    isGeneratingReport, setIsGeneratingReport,
    reportNarrative, setReportNarrative,
    insights,
    isGeneratingInsights,
    savedConversations,
    pinnedConversationIds,
    suggestedPrompts,
    handleAiChat,
    handleQuickAction,
    fetchWorkspaceSummary,
    generateAiOverview,
    analyzeAllPendingApplications,
    generateSessionIntelligence,
    fetchAiRecommendations,
    fetchAiInsights,
    generateWeeklyReportNarrative,
    handleDownloadWeeklyReport,
    stopGeneration,
    saveConversation,
    deleteConversation,
    renameConversation,
    loadConversation,
    togglePinned,
    clearChat,
    searchConversations,
  } = aiDomain;

  // ── Local state (small domains that don't warrant extraction) ──
  const [formSubmissions, setFormSubmissions] = useState<FormSubmission[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [communities, setCommunities] = useState<Conversation[]>([]);
  const [currentCalendarDate, setCurrentCalendarDate] = useState<Date>(new Date());
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<Date | null>(new Date());
  const [selectedChartTab, setSelectedChartTab] = useState<'growth' | 'active' | 'apps' | 'sessions' | 'completions'>('growth');
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastContent, setBroadcastContent] = useState('');
  const [isBroadcasting, setIsBroadcasting] = useState(false);

  const [isSchedulingSession, setIsSchedulingSession] = useState(false);
  const [sessionTitle, setSessionTitle] = useState('');
  const [sessionDesc, setSessionDesc] = useState('');
  const [sessionDate, setSessionDate] = useState('');
  const [sessionTime, setSessionTime] = useState('');
  const [sessionDuration, setSessionDuration] = useState(30);
  const [sessionMeetingUrl, setSessionMeetingUrl] = useState('');
  const [isConfiguringAvailability, setIsConfiguringAvailability] = useState(false);
  const [weeklyAvailability, setWeeklyAvailability] = useState({
    monday: { enabled: true, start: '09:00', end: '17:00' },
    tuesday: { enabled: true, start: '09:00', end: '17:00' },
    wednesday: { enabled: true, start: '09:00', end: '17:00' },
    thursday: { enabled: true, start: '09:00', end: '17:00' },
    friday: { enabled: true, start: '09:00', end: '17:00' },
    saturday: { enabled: false, start: '09:00', end: '17:00' },
    sunday: { enabled: false, start: '09:00', end: '17:00' },
  });
  const [isCreatingForm, setIsCreatingForm] = useState(false);
  const [newFormData, setNewFormData] = useState<Partial<CustomForm>>({
    title: '',
    description: '',
    fields: [],
    assigned_to: [],
  });

  const match = location.pathname.match(/\/mentor\/events\/([^/]+)/);
  const selectedEventId = match ? match[1] : (new URLSearchParams(location.search).get('eventId') || null);

  // ── Realtime subscriptions for locally-managed state ──
  useRealtime([
    { table: 'form_submissions', callback: () => { customFormService.getAllSubmissions().then(setFormSubmissions); } },
    { table: 'conversations', callback: () => { messageService.getConversations(currentUser?.id || '', 'mentor').then(setConversations); } },
    { table: 'messages', callback: () => { messageService.getConversations(currentUser?.id || '', 'mentor').then(setConversations); } },
  ]);

  // ── Initial load & sync ──
  useEffect(() => {
    rawRefreshApps();
    customFormService.getAllSubmissions().then(setFormSubmissions);
    messageService.getConversations(currentUser?.id || '', 'mentor').then(setConversations);
  }, [rawRefreshApps, currentUser?.id]);

  useDatabaseSync(useCallback(() => {
    customFormService.getAllSubmissions().then(setFormSubmissions);
    messageService.getConversations(currentUser?.id || '', 'mentor').then(setConversations);
  }, [currentUser?.id]));

  // ── Communities ──
  useEffect(() => {
    if (activeTab === 'overview') {
      messageService.getAllConversations().then(allConvos => {
        setCommunities(allConvos.filter(c => c.isGroup && c.mentorId === currentUser?.id));
      });
    }
  }, [activeTab, currentUser?.id]);

  // ── Reviews derived ──
  const reviewStats = {
    pending: reviewDomain.reviews.filter(r => ['assigned', 'pending', 'submitted', 'in_review'].includes(r.status)).length,
    completed: reviewDomain.reviews.filter(r => r.status === 'completed').length,
    total: reviewDomain.reviews.length,
  };

  // ── Derived ──
  const upcomingSessions = sessions.filter(s => s.attendanceStatus === 'pending');
  const activeStudentsCount = studentProfiles.filter(p => p.status === 'active' || p.current_status === 'Active').length;

  // ── Cross-domain handlers ──
  const handleOpenStudentProfile = (studentId: string) => {
    setSelectedMenteeId(studentId);
    setActiveTab('mentees');
    navigate('/mentor?tab=mentees');
  };

  const handleMessageStudent = async (studentId: string, studentName: string) => {
    if (!currentUser) return;
    await messageService.createConversation(studentId, studentName, currentUser.id);
    setSelectedMenteeId(null);
    navigate(`/mentor?tab=messaging&studentId=${studentId}`);
    setActiveTab('messaging');
  };

  // ── Session scheduling ──
  const handleScheduleSession = (studentId: string) => {
    if (!sessionTitle.trim() || !sessionDate || !sessionTime) {
      notifyError('Please fill in all required fields (Title, Date, Time)');
      return;
    }
    try {
      const startTimeISO = new Date(`${sessionDate}T${sessionTime}`).toISOString();
      const endTimeISO = new Date(new Date(`${sessionDate}T${sessionTime}`).getTime() + sessionDuration * 60 * 1000).toISOString();
      addSession({
        mentorId: currentUser?.id || 'mentor-1',
        studentId,
        title: sessionTitle,
        description: sessionDesc,
        startTime: startTimeISO,
        endTime: endTimeISO,
        meetingUrl: sessionMeetingUrl || 'https://meet.google.com/abc-defg-hij',
        attendanceStatus: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      notifySuccess('1:1 Mentorship Session scheduled successfully!');
      setIsSchedulingSession(false);
      setSessionTitle('');
      setSessionDesc('');
      setSessionDate('');
      setSessionTime('');
      setSessionDuration(30);
      setSessionMeetingUrl('');
    } catch {
      notifyError('Failed to schedule session');
    }
  };

  // ── Broadcast ──
  const handleBroadcast = async () => {
    if (!broadcastTitle.trim() || !broadcastContent.trim()) return;
    try {
      for (const student of studentProfiles) {
        await notificationStorage.create({
          userId: student.user_id,
          title: broadcastTitle,
          message: broadcastContent,
          type: 'announcement',
          read: false,
          createdAt: new Date().toISOString(),
        } as any);
      }
      notifySuccess(`Broadcast sent to ${studentProfiles.length} students.`);
      setBroadcastTitle('');
      setBroadcastContent('');
      setIsBroadcasting(false);
    } catch {
      notifyError('Failed to send broadcast');
    }
  };

  // ── Utility functions ──
  const formatRelativeTime = (isoString: string) => {
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
    } catch {
      return 'Recently';
    }
  };

  const getRecentActivityTimeline = () => {
    const timeline: {
      id: string;
      studentId: string;
      name: string;
      activity: string;
      timestamp: string;
      type: string;
    }[] = [];
    sessions.forEach(s => {
      if (s.attendanceStatus === 'attended' || s.status === 'completed') {
        const student = studentProfiles.find(p => p.user_id === s.studentId) || applications.find(a => a.user_id === s.studentId);
        timeline.push({
          id: `session-${s.id}`, studentId: s.studentId,
          name: student?.name || student?.full_name || 'Student',
          activity: `Completed session: "${s.title}"`,
          timestamp: s.startTime || s.createdAt || new Date().toISOString(),
          type: 'session',
        });
      }
    });
    try {
      goals.forEach(g => {
        if (g.status === 'completed') {
          const student = studentProfiles.find(p => p.user_id === g.studentId) || applications.find(a => a.user_id === g.studentId);
          timeline.push({
            id: `goal-${g.id}`, studentId: g.studentId,
            name: student?.name || student?.full_name || 'Student',
            activity: `Achieved goal: "${g.title}"`,
            timestamp: g.targetDate || new Date().toISOString(),
            type: 'goal',
          });
        }
      });
    } catch {}
    taskActivities.forEach(t => {
      if (t.status === 'submitted' || t.status === 'completed' || t.status === 'approved') {
        timeline.push({
          id: `task-${t.id}`, studentId: t.user_id,
          name: t.user_name || 'Student',
          activity: `Submitted assignment: "${(t as any).title || t.task_title}"`,
          timestamp: (t as any).dueDate || t.due_date || new Date().toISOString(),
          type: 'assignment',
        });
      }
    });
    journals.forEach(j => {
      const student = studentProfiles.find(p => p.user_id === j.studentId) || applications.find(a => a.user_id === j.studentId);
      timeline.push({
        id: `journal-${j.id}`, studentId: j.studentId,
        name: student?.name || student?.full_name || (j as any).studentName || 'Student',
        activity: `Created journal entry: "${(j as any).title || j.content?.slice(0, 50)}"`,
        timestamp: j.createdAt || new Date().toISOString(),
        type: 'journal',
      });
    });
    applications.forEach(a => {
      timeline.push({
        id: `app-${a.id}`, studentId: a.user_id || '',
        name: a.full_name || 'Applicant',
        activity: `Submitted program application for "${a.focus_area || 'Mentorship'}"`,
        timestamp: a.created_at || new Date().toISOString(),
        type: 'application',
      });
    });
    studentProfiles.forEach((p, idx) => {
      const pId = p.user_id || p.id || `student-${idx}`;
      if (p.status === 'active') {
        timeline.push({
          id: `start-${pId}`, studentId: pId,
          name: p.name || 'Student',
          activity: `Started mentorship program in "${p.specialization || 'Strategic Growth'}"`,
          timestamp: p.lastLogin || new Date().toISOString(),
          type: 'program-start',
        });
      } else if (p.status === 'completed') {
        timeline.push({
          id: `complete-${pId}`, studentId: pId,
          name: p.name || 'Student',
          activity: 'Completed mentorship program successfully!',
          timestamp: new Date().toISOString(),
          type: 'program-complete',
        });
      }
    });
    return timeline.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 8);
  };

  const getAtRiskStudents = () => {
    const list: { studentId: string; name: string; reason: string; priority: 'high' | 'medium' | 'low' }[] = [];
    studentProfiles.forEach((p, idx) => {
      const pId = p.user_id || p.id || `student-${idx}`;
      let reason = '';
      let priority: 'high' | 'medium' | 'low' = 'low';
      if (p.status === 'at_risk' || p.healthStatus === 'at_risk') { reason = 'No active communication for 14 days'; priority = 'high'; }
      else if (p.healthStatus === 'needs_attention') { reason = 'Missed recent coaching session'; priority = 'medium'; }
      else if (p.metrics && p.metrics.attendanceRate < 90) { reason = 'Attendance rate below 90%'; priority = 'medium'; }
      else if (p.metrics && p.metrics.goalCompletionRate < 50) { reason = 'Goal completion progress plateaued'; priority = 'low'; }
      const studentTasks = taskActivities.filter(t => t.user_id === pId);
      const overdueTasks = studentTasks.filter(t => t.status === 'pending' && ((t as any).dueDate || t.due_date) && new Date((t as any).dueDate || t.due_date) < new Date());
      if (overdueTasks.length > 0 && !reason) { reason = `Overdue assignment: "${(overdueTasks[0] as any).title || overdueTasks[0].task_title}"`; priority = 'high'; }
      if (reason) list.push({ studentId: pId, name: p.name || p.email || 'Student', reason, priority });
    });
    const pw = { high: 3, medium: 2, low: 1 };
    return list.sort((a, b) => pw[b.priority] - pw[a.priority]);
  };

  const getChartData = () => {
    switch (selectedChartTab) {
      case 'growth':
        return [
          { name: 'Jan', active: 3 }, { name: 'Feb', active: 5 }, { name: 'Mar', active: 8 },
          { name: 'Apr', active: 12 }, { name: 'May', active: studentProfiles.length - 2 > 0 ? studentProfiles.length - 2 : 15 },
          { name: 'Jun', active: studentProfiles.length },
        ];
      case 'sessions':
        return [
          { name: 'Week 1', completed: 4, scheduled: 6 }, { name: 'Week 2', completed: 8, scheduled: 10 },
          { name: 'Week 3', completed: 12, scheduled: 15 },
          { name: 'Week 4', completed: sessions.filter(s => s.status === 'completed' || s.attendanceStatus === 'attended').length, scheduled: sessions.length },
        ];
      case 'completions':
        return [
          { name: 'Product Strategy', rate: 85 }, { name: 'Backend Eng', rate: 90 },
          { name: 'Systems Design', rate: 75 }, { name: 'Product Growth', rate: 95 },
        ];
      default:
        return [
          { name: 'Jan', active: 4 }, { name: 'Feb', active: 6 },
          { name: 'Mar', active: 10 }, { name: 'Apr', active: studentProfiles.length },
        ];
    }
  };

  const stats = [
    { label: 'Total Students', value: studentProfiles.length, icon: 'Users' as const, bgClass: 'bg-indigo-50', textClass: 'text-indigo-600', tab: 'mentees' as MentorTab, trend: '+2 this month' },
    { label: 'Active Students', value: activeStudentsCount, icon: 'Activity' as const, bgClass: 'bg-emerald-50', textClass: 'text-emerald-600', tab: 'mentees' as MentorTab, trend: '85% active' },
    { label: 'New Applications', value: pendingApplications.length, icon: 'FileSearch' as const, bgClass: 'bg-blue-50', textClass: 'text-blue-600', tab: 'applications' as MentorTab, trend: `${pendingApplications.length} pending` },
    { label: 'Upcoming Sessions', value: upcomingSessions.length, icon: 'CalendarDays' as const, bgClass: 'bg-amber-50', textClass: 'text-amber-600', tab: 'sessions' as MentorTab, trend: 'Next: Today' },
    { label: 'Pending Reviews', value: pendingTasks.length + reviewStats.pending, icon: 'CheckCircle2' as const, bgClass: 'bg-rose-50', textClass: 'text-rose-600', tab: 'feedback' as MentorTab, trend: `${reviewStats.pending} pending review tasks` },
    { label: 'New Journal Entries', value: journals.length, icon: 'FileText' as const, bgClass: 'bg-purple-50', textClass: 'text-purple-600', tab: 'mentees' as MentorTab, trend: 'Recent updates' },
    { label: 'Pending Forms', value: formSubmissions.length, icon: 'ClipboardList' as const, bgClass: 'bg-cyan-50', textClass: 'text-cyan-600', tab: 'mentees' as MentorTab, trend: 'Forms filled' },
  ];

  const getSessionsThisWeek = () => {
    const now = new Date();
    const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
    startOfWeek.setHours(0, 0, 0, 0);
    const endOfWeek = new Date(now.setDate(now.getDate() - now.getDay() + 6));
    endOfWeek.setHours(23, 59, 59, 999);
    return sessions.filter(s => {
      const sDate = new Date(s.startTime);
      return sDate >= startOfWeek && sDate <= endOfWeek;
    });
  };

  const getCalendarDays = () => {
    const year = currentCalendarDate.getFullYear();
    const month = currentCalendarDate.getMonth();
    const firstDayIndex = new Date(year, month, 1).getDay();
    const lastDay = new Date(year, month + 1, 0).getDate();
    const days: (Date | null)[] = [];
    for (let i = 0; i < firstDayIndex; i++) days.push(null);
    for (let i = 1; i <= lastDay; i++) days.push(new Date(year, month, i));
    return days;
  };

  const getEventsOnDay = (date: Date) => {
    const dStr = date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0') + '-' + String(date.getDate()).padStart(2, '0');
    const daySessions = sessions.filter(s => s.startTime.startsWith(dStr));
    const dayWorkshops = events.filter(e => e.date === dStr);
    return [
      ...daySessions.map(s => ({ ...s, eventType: 'session' as const })),
      ...dayWorkshops.map(e => ({ ...e, eventType: 'workshop' as const })),
    ];
  };

  return {
    currentUser,
    activeTab, setActiveTab,
    handleTabChange,

    // Mentees
    searchQuery, setSearchQuery,
    studentProfiles, setStudentProfiles,
    selectedMenteeId, setSelectedMenteeId,
    menteeSubTab, setMenteeSubTab,
    menteeNotes, setMenteeNotes,
    isSavingNotes, setIsSavingNotes,
    editingStrength, setEditingStrength,
    editingFocus, setEditingFocus,
    strengthInput, setStrengthInput,
    focusInput, setFocusInput,
    newTaskTitle, setNewTaskTitle,
    newTaskPriority, setNewTaskPriority,
    newTaskDueDate, setNewTaskDueDate,
    allTags, setAllTags,
    isAddingTag, setIsAddingTag,
    newTagLabel, setNewTagLabel,
    newTagColor, setNewTagColor,
    mentees, filteredMentees,
    taskActivities, addTask,
    handleAddTag, toggleMenteeTag, handleUpdateNotes, handleSaveStrengthFocus,
    menteeGoals,
    handleAddGoal, handleUpdateGoal, handleDeleteGoal,

    // Feedback
    selectedTask, setSelectedTask,
    feedbackResponse, setFeedbackResponse,
    pendingTasks,
    handleReviewTask, submitFeedback,

    // Applications
    selectedApplication, setSelectedApplication,
    appSearch, setAppSearch,
    appStatus, setAppStatus,
    appDiscipline, setAppDiscipline,
    appSortBy, setAppSortBy,
    appSortOrder, setAppSortOrder,
    appPage, setAppPage,
    appLimit, setAppLimit,
    modalTab, setModalTab,
    applicationDetails, setApplicationDetails,
    detailsLoading, setDetailsLoading,
    newNoteText, setNewNoteText,
    editingNoteId, setEditingNoteId,
    editingNoteText, setEditingNoteText,
    requestInfoText, setRequestInfoText,
    isRequestingInfo, setIsRequestingInfo,
    isRejecting, setIsRejecting,
    rejectionReason, setRejectionReason,
    rejectionFeedback, setRejectionFeedback,
    pendingApplications,
    filteredAppsForTab,
    handleApplicationAction,
    refreshApps, updateAppStatus,

    // Events
    isCreatingEvent, setIsCreatingEvent,
    editingEventId, setEditingEventId,
    eventErrors, setEventErrors,
    newEventData, setNewEventData,
    handleEditEventClick,
    handleCancelEventEdit,
    handleSaveEvent,
    deleteEvent,

    // Programs
    isCreatingProgram, setIsCreatingProgram,
    programWizardStep, setProgramWizardStep,
    newProgramData, setNewProgramData,
    editingProgram, setEditingProgram,
    editFormTab, setEditFormTab,
    newModuleTitle, setNewModuleTitle,
    newModuleDesc, setNewModuleDesc,
    newResourceTitle, setNewResourceTitle,
    newResourceUrl, setNewResourceUrl,
    newAssignmentTitle, setNewAssignmentTitle,
    newAssignmentDesc, setNewAssignmentDesc,
    newOutcomeInput, setNewOutcomeInput,
    newSkillInput, setNewSkillInput,
    newPrereqInput, setNewPrereqInput,
    handleEditProgramClick,
    handleSaveProgramEdit,
    addProgram, deleteProgram,

    // AI Assistant
    chatHistory, setChatHistory,
    userInput, setUserInput,
    isAiLoading,
    streamingContent,
    chatEndRef,
    isGeneratingOverview, setIsGeneratingOverview,
    aiOverviewText, setAiOverviewText,
    isAnalyzingApps, setIsAnalyzingApps,
    appsAnalysisResult, setAppsAnalysisResult,
    isGeneratingSessionIntel, setIsGeneratingSessionIntel,
    sessionIntelResult, setSessionIntelResult,
    isGeneratingRecommendations, setIsGeneratingRecommendations,
    recommendationsResult, setRecommendationsResult,
    isGeneratingReport, setIsGeneratingReport,
    reportNarrative, setReportNarrative,
    insights,
    isGeneratingInsights,
    savedConversations,
    pinnedConversationIds,
    suggestedPrompts,
    handleAiChat, handleQuickAction,
    fetchWorkspaceSummary,
    generateAiOverview,
    analyzeAllPendingApplications,
    generateSessionIntelligence,
    fetchAiRecommendations,
    fetchAiInsights,
    generateWeeklyReportNarrative,
    handleDownloadWeeklyReport,
    stopGeneration,
    saveConversation,
    deleteConversation,
    renameConversation,
    loadConversation,
    togglePinned,
    clearChat,
    searchConversations,

    // Data from TanStack hooks (re-exported)
    applications,
    bookings,
    sessions, addSession, updateSession, deleteSession, refreshSessions,
    events,
    programs,
    resources, addResource, deleteResource,
    goals,
    journals, refreshJournals,
    appsLoading, tasksLoading, bookingsLoading, sessionsLoading, eventsLoading, programsLoading, resourcesLoading, goalsLoading,

    // Session scheduling
    isSchedulingSession, setIsSchedulingSession,
    sessionTitle, setSessionTitle,
    sessionDesc, setSessionDesc,
    sessionDate, setSessionDate,
    sessionTime, setSessionTime,
    sessionDuration, setSessionDuration,
    sessionMeetingUrl, setSessionMeetingUrl,
    handleScheduleSession,
    isConfiguringAvailability, setIsConfiguringAvailability,
    weeklyAvailability, setWeeklyAvailability,

    // Forms
    isCreatingForm, setIsCreatingForm,
    newFormData, setNewFormData,
    formSubmissions, setFormSubmissions,

    // Messaging / Broadcast
    conversations, setConversations,
    communities, setCommunities,
    broadcastTitle, setBroadcastTitle,
    broadcastContent, setBroadcastContent,
    isBroadcasting, setIsBroadcasting,
    handleBroadcast,

    // Dashboard UI state
    currentCalendarDate, setCurrentCalendarDate,
    selectedCalendarDate, setSelectedCalendarDate,
    selectedChartTab, setSelectedChartTab,

    // Navigation / cross-domain
    handleOpenStudentProfile,
    handleMessageStudent,
    selectedEventId,
    addBooking,

    // Reviews
    reviewDomain,

    // Derived
    upcomingSessions,
    activeStudentsCount,
    reviewStats,

    // Utility functions
    getRecentActivityTimeline,
    getAtRiskStudents,
    getChartData,
    stats,
    formatRelativeTime,
    getSessionsThisWeek,
    getCalendarDays,
    getEventsOnDay,
  };
}
