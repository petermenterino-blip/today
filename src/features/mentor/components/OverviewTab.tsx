import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'motion/react';
import { Plus, Users, Calendar, Activity, Bot, Loader2, Send, Sparkles } from 'lucide-react';
import { useOverviewStore } from '../hooks/useOverviewStore';
import { useAIAssistant } from '../hooks/useAIAssistant';
import { useAuth } from '../../../context/AuthContext';
import { notifySuccess, notifyError } from '../../../utils/toast';
import { messageService } from '../../../services/messageService';
import {
  MentorWorkspaceStatus, TodayPrioritiesWidget, SummaryStatsRow, HeroSidePanel,
  NewApplicationsCard, QuickActionsBar, OperationalMetricsWidget, ActivityTimelineWidget,
  AtRiskStudentsWidget, CalendarOverviewWidget, CommunicationHubWidget, EventsWidget,
  WorkspaceMetricsChart, HealthOverviewWidget, AIDailySummaryWidget, PerformanceCardsWidget,
  CalendarPreviewWidget, NotificationsPreviewWidget, RecentlyViewedWidget, CurrentProgramInfo,
  ReviewApplicationsModal, StartSessionModal, QuickMessageModal, MiniCalendarModal,
  GrowthAuditModal, BroadcastModal, addRecentlyViewed,
} from './overview';
import type { MentorTab } from '../hooks/useDashboard';

interface OverviewTabProps {
  handleTabChange: (tab: MentorTab) => void;
  setActiveTab: (tab: MentorTab) => void;
  setIsCreatingProgram: (v: boolean) => void;
  setProgramWizardStep: (v: number) => void;
  setIsSchedulingSession: (v: boolean) => void;
  handleOpenStudentProfile: (studentId: string) => void;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({
  handleTabChange, setActiveTab, setIsCreatingProgram, setProgramWizardStep,
  setIsSchedulingSession, handleOpenStudentProfile,
}) => {
  const { user: currentUser } = useAuth();
  const store = useOverviewStore();
  const {
    mentorStatus, nextSession, upcomingSessions, sortedUpcomingSessions,
    pendingApplications, conversationsUnread, activeStudentsCount,
    currentProgram, nextProgram, studentProfiles, activeEnrollments,
    studentCounts, priorities, healthMetrics, activityTimeline,
    atRiskStudents, stats, performanceCards, chartData,
    upcomingEvents, calendarPreview7, recentBroadcasts,
    overallMentoringHealth, aiDailySummary, conversations,
    communities, sessions, applications, notifications,
    unreadCount, loading, formatRelativeTime, userId,
    programs, sessionsToday, taskActivities,
  } = store;

  const aiDomain = useAIAssistant({
    studentProfiles, sessions, applications, programs, userId,
  });

  const {
    chatHistory, userInput, setUserInput, isAiLoading, streamingContent,
    suggestedPrompts, handleAiChat, handleQuickAction, chatEndRef,
  } = aiDomain;

  const [selectedChartTab, setSelectedChartTab] = useState('growth');
  const [showReviewApps, setShowReviewApps] = useState(false);
  const [showStartSession, setShowStartSession] = useState(false);
  const [showQuickMessage, setShowQuickMessage] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showGrowthAudit, setShowGrowthAudit] = useState(false);
  const [showBroadcast, setShowBroadcast] = useState(false);

  const handleQuickActionClick = useCallback(async (studentId: string, studentName: string) => {
    if (!userId) return;
    const conv = await messageService.createConversation(studentId, studentName, userId);
    if (conv) {
      handleTabChange('messaging');
    }
  }, [userId, handleTabChange]);

  const handleBroadcastSend = useCallback(async (title: string, content: string, _recipients: string) => {
    if (!userId) return;
    try {
      const students = _recipients === 'atrisk'
        ? atRiskStudents.map(r => r.studentId)
        : studentProfiles.map(p => p.user_id);
      const { supabase } = await import('../../../lib/supabase');
      const notifications = students.map((sid: string) => ({
        user_id: sid,
        title,
        message: content,
        type: 'announcement',
        read: false,
        created_at: new Date().toISOString(),
      }));
      const { error } = await supabase.from('notifications').insert(notifications);
      if (error) throw error;
      notifySuccess(`Broadcast sent to ${students.length} students`);
    } catch {
      notifyError('Failed to send broadcast');
    }
  }, [userId, studentProfiles, atRiskStudents]);

  const handleApplicationAction = useCallback(async (appId: string, action: 'approved' | 'rejected') => {
    const { supabase } = await import('../../../lib/supabase');
    const { error } = await supabase.from('applications').update({ status: action }).eq('id', appId);
    if (error) { notifyError('Failed to update application'); return; }
    store.refreshApps();
    notifySuccess(`Application ${action}`);
  }, [store]);

  const [hasImminentSession, setHasImminentSession] = useState(false);

  const handleOpenSession = useCallback((session: any) => {
    addRecentlyViewed({ id: session.id, type: 'session', title: session.title, label: 'Session' });
    handleTabChange('sessions');
  }, [handleTabChange]);
  useEffect(() => {
    setHasImminentSession(sortedUpcomingSessions.some(s => {
      const diff = new Date(s.startTime).getTime() - Date.now();
      return diff > 0 && diff < 30 * 60 * 1000;
    }));
  }, [sortedUpcomingSessions]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {(!loading.programs && programs.length === 0) ? (
        <div className="bg-brand-charcoal rounded-[32px] sm:rounded-[40px] p-8 md:p-12 text-white relative overflow-hidden shadow-2xl shadow-brand-charcoal/20 text-center max-w-3xl mx-auto my-8">
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-indigo-500/20 rounded-full blur-[80px] pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-emerald-500/10 rounded-full blur-[60px] pointer-events-none" />
          <div className="relative z-10 space-y-6">
            <h3 className="text-4xl font-black uppercase tracking-tighter">Welcome to Mentorino</h3>
            <p className="text-white/60 text-sm max-w-md mx-auto leading-relaxed">
              Your executive command center is ready. Initialize your workspace by setting up your program and inviting your first cohort of students.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 max-w-2xl mx-auto">
              <button onClick={() => { setIsCreatingProgram(true); setProgramWizardStep(1); }}
                className="p-5 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/10 text-center transition-all group active:scale-95 text-left animate-in fade-in">
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform"><Plus className="text-white" size={20} /></div>
                <p className="font-bold text-xs text-white uppercase tracking-wider mb-1">Step 1</p>
                <p className="text-xs text-white/70 font-medium leading-snug">Create your first program</p>
              </button>
              <button onClick={() => handleTabChange('applications')}
                className="p-5 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/10 text-center transition-all group active:scale-95 text-left animate-in fade-in">
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform"><Users className="text-white" size={20} /></div>
                <p className="font-bold text-xs text-white uppercase tracking-wider mb-1">Step 2</p>
                <p className="text-xs text-white/70 font-medium leading-snug">Invite your first students</p>
              </button>
              <button onClick={() => { setIsSchedulingSession(true); handleTabChange('sessions'); }}
                className="p-5 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/10 text-center transition-all group active:scale-95 text-left animate-in fade-in">
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform"><Calendar className="text-white" size={20} /></div>
                <p className="font-bold text-xs text-white uppercase tracking-wider mb-1">Step 3</p>
                <p className="text-xs text-white/70 font-medium leading-snug">Schedule your first session</p>
              </button>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* HERO CARD */}
          <div className="bg-brand-charcoal rounded-[32px] sm:rounded-[40px] p-8 md:p-12 text-white relative overflow-hidden shadow-2xl shadow-brand-charcoal/20 animate-in fade-in duration-500">
            <div className="absolute -top-24 -right-24 w-96 h-96 bg-indigo-500/20 rounded-full blur-[80px] pointer-events-none" />
            <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-emerald-500/10 rounded-full blur-[60px] pointer-events-none" />
            <div className="relative z-10 grid grid-cols-1 md:grid-cols-10 gap-8 items-start">
              <div className="md:col-span-6 space-y-6">
                <MentorWorkspaceStatus status={mentorStatus} nextSession={nextSession} formatRelativeTime={formatRelativeTime} />
                <TodayPrioritiesWidget priorities={priorities} onAction={(tab) => handleTabChange(tab as MentorTab)} />
                <AIDailySummaryWidget summary={aiDailySummary} />
                <SummaryStatsRow
                  todaySessions={stats.todaySessions}
                  pendingReviews={stats.pendingReviews}
                  unreadMessages={stats.unreadMessages}
                  applications={stats.applications}
                  onStatClick={(type) => handleTabChange(type as MentorTab)}
                />
              </div>
              <HeroSidePanel
                currentProgram={currentProgram}
                nextProgram={nextProgram}
                activeStudents={activeStudentsCount}
                studentCounts={studentCounts}
                nextSession={nextSession}
                upcomingSessions={upcomingSessions}
                onTabChange={(tab) => handleTabChange(tab as MentorTab)}
              />
            </div>

            <NewApplicationsCard
              count={pendingApplications.length}
              newestApplicant={pendingApplications[0] ? { name: pendingApplications[0].full_name, created_at: pendingApplications[0].created_at } : undefined}
              onReview={() => setShowReviewApps(true)}
            />

            <QuickActionsBar
              onReviewApplications={() => setShowReviewApps(true)}
              onStartSession={() => setShowStartSession(true)}
              onMessageStudents={() => setShowQuickMessage(true)}
              onViewCalendar={() => setShowCalendar(true)}
              onGrowthAudit={() => setShowGrowthAudit(true)}
              onCreateProgram={() => { setIsCreatingProgram(true); setProgramWizardStep(1); }}
              onAddResource={() => handleTabChange('resources')}
              onCreateEvent={() => handleTabChange('events')}
              onBroadcast={() => setShowBroadcast(true)}
              onUploadGallery={() => handleTabChange('gallery')}
              onAISummary={() => {
                const el = document.getElementById('ai-assistant-section');
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
              hasSession={hasImminentSession}
            />
          </div>

          {/* OVERALL MENTORING HEALTH */}
          <HealthOverviewWidget
            healthy={overallMentoringHealth.healthy}
            atRisk={overallMentoringHealth.atRisk}
            inactive={overallMentoringHealth.inactive}
            needsReview={overallMentoringHealth.needsReview}
            attendanceRate={stats.attendanceRate}
            avgProgress={stats.avgStudentProgress}
            upcomingDeadlines={getOverdueCount(taskActivities)}
            onFilter={(filter) => handleTabChange('mentees')}
          />

          {/* OPERATIONAL METRICS */}
          <OperationalMetricsWidget
            metrics={healthMetrics}
            onMetricClick={(tab) => tab && handleTabChange(tab as MentorTab)}
          />

          {/* SECOND ROW: Activity Timeline & At-Risk */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <ActivityTimelineWidget
              activities={activityTimeline}
              onStudentClick={handleOpenStudentProfile}
              onViewAll={() => handleTabChange('mentees')}
              formatRelativeTime={formatRelativeTime}
            />
            <AtRiskStudentsWidget
              students={atRiskStudents}
              onStudentClick={handleOpenStudentProfile}
              onQuickMessage={handleQuickActionClick}
              onScheduleSession={(sid) => {
                handleOpenStudentProfile(sid);
              }}
            />
          </div>

          {/* THIRD ROW: Calendar & Communication */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <CalendarOverviewWidget
              sessions={sessions}
              events={store.rawEvents}
              studentProfiles={studentProfiles}
              applications={applications}
              onSessionClick={() => handleTabChange('sessions')}
              onEventClick={() => handleTabChange('events')}
            />
            <CommunicationHubWidget
              communities={communities}
              conversations={conversations}
              onMessagingClick={() => handleTabChange('messaging')}
              onBroadcastClick={() => setShowBroadcast(true)}
            />
          </div>

          {/* FOURTH ROW: Events, Notifications, Calendar Preview */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <EventsWidget
              events={upcomingEvents}
              loading={loading.events}
              onViewAll={() => handleTabChange('events')}
            />
            <div className="space-y-6">
              <NotificationsPreviewWidget
                notifications={notifications}
                loading={loading.notifications}
                unreadCount={unreadCount}
                onViewAll={() => handleTabChange('messaging')}
              />
              <CalendarPreviewWidget
                days={calendarPreview7}
                onDayClick={() => handleTabChange('events')}
              />
            </div>
            <RecentlyViewedWidget />
          </div>

          {/* PERFORMANCE CARDS */}
          <PerformanceCardsWidget data={performanceCards} />

          {/* WORKSPACE METRICS CHART */}
          <WorkspaceMetricsChart
            chartData={chartData}
            selectedTab={selectedChartTab}
            onTabChange={setSelectedChartTab}
          />

          {/* AI MENTOR ASSISTANT */}
          <div id="ai-assistant-section" className="bg-slate-950 p-8 rounded-[40px] text-white shadow-2xl relative overflow-hidden flex flex-col md:flex-row gap-8">
            <div className="flex-1 relative z-10">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-600/30">
                  <Bot size={20} className="text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-black uppercase tracking-tighter">AI Mentor Assistant</h3>
                  <p className="text-[9px] font-black uppercase tracking-widest text-indigo-400">Powered by Gemini Pro</p>
                </div>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed max-w-xl mb-6">
                Query your students' portfolios, check on session completions, draft recommendations, or get quick diagnostic reports on at-risk alerts directly using natural language.
              </p>

              <div className="space-y-4 max-h-[180px] overflow-y-auto pr-2 custom-scrollbar mb-6">
                {chatHistory.length === 0 && !streamingContent ? (
                  <div className="p-6 bg-white/5 rounded-2xl border border-white/10 text-center">
                    <p className="text-xs text-slate-400 leading-relaxed">Ask anything about your students, programs, sessions, or performance insights.</p>
                  </div>
                ) : (
                  <>
                    {chatHistory.map((msg: any, idx: number) => (
                      <div key={idx} className={`p-4 rounded-2xl ${msg.role === 'user' ? 'bg-white/10 ml-8' : 'bg-indigo-500/20 mr-8 border border-indigo-500/30'}`}>
                        <p className="text-xs leading-relaxed">{msg.content}</p>
                      </div>
                    ))}
                    {streamingContent && (
                      <div className="p-4 rounded-2xl bg-indigo-500/20 mr-8 border border-indigo-500/30">
                        <p className="text-xs leading-relaxed">{streamingContent}</p>
                      </div>
                    )}
                  </>
                )}
                <div ref={chatEndRef} />
              </div>

              <div className="flex gap-3">
                <input
                  type="text"
                  placeholder="Ask anything about your workspace..."
                  className="flex-1 min-w-0 bg-white/10 border border-white/10 rounded-2xl px-5 py-3 text-xs font-semibold outline-none focus:border-indigo-500 transition-all text-white placeholder:text-slate-400"
                  value={userInput}
                  onChange={e => setUserInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAiChat()}
                />
                <button
                  onClick={handleAiChat}
                  disabled={isAiLoading}
                  className="px-5 bg-indigo-600 rounded-2xl hover:bg-indigo-700 transition-all disabled:opacity-50 flex-shrink-0 flex items-center justify-center"
                >
                  {isAiLoading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                </button>
              </div>
            </div>

            <div className="md:w-80 relative z-10 flex flex-col justify-center gap-3">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Quick Commands</p>
              {suggestedPrompts.slice(0, 4).map((cmd, i) => (
                <button
                  key={i}
                  onClick={() => { setUserInput(cmd.prompt); }}
                  className="w-full text-left p-3 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-xs font-medium text-slate-300"
                >
                  {cmd.label}
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {/* MODALS */}
      <ReviewApplicationsModal
        open={showReviewApps}
        onClose={() => setShowReviewApps(false)}
        pendingApplications={pendingApplications}
        onAccept={(id) => handleApplicationAction(id, 'approved')}
        onReject={(id) => handleApplicationAction(id, 'rejected')}
        onViewProfile={(uid) => { handleOpenStudentProfile(uid); setShowReviewApps(false); }}
      />

      <StartSessionModal
        open={showStartSession}
        onClose={() => setShowStartSession(false)}
        nextSession={nextSession}
        studentProfiles={studentProfiles}
        onOpenSession={handleOpenSession}
        onScheduleNew={() => { setIsSchedulingSession(true); handleTabChange('sessions'); }}
      />

      <QuickMessageModal
        open={showQuickMessage}
        onClose={() => setShowQuickMessage(false)}
        studentProfiles={studentProfiles}
        currentUserId={userId}
        onSendMessage={handleQuickActionClick}
      />

      <MiniCalendarModal
        open={showCalendar}
        onClose={() => setShowCalendar(false)}
        sessions={sessions}
        onOpenSession={handleOpenSession}
        onViewCalendar={() => handleTabChange('events')}
      />

      <GrowthAuditModal
        open={showGrowthAudit}
        onClose={() => setShowGrowthAudit(false)}
        atRiskStudents={atRiskStudents}
        engagementRate={healthMetrics[0]?.value || 0}
        sessionCompletionRate={healthMetrics[1]?.value || 0}
        studentCounts={studentCounts}
        onViewAnalytics={() => handleTabChange('analytics')}
      />

      <BroadcastModal
        open={showBroadcast}
        onClose={() => setShowBroadcast(false)}
        onSend={handleBroadcastSend}
      />
    </div>
  );
};

function getOverdueCount(taskActivities: any[]): number {
  return taskActivities.filter(t => t.status === 'pending' && t.due_date && new Date(t.due_date) < new Date()).length;
}
