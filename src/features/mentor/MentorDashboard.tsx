import React, { Suspense, lazy } from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import {
  X, Trash
} from 'lucide-react';
import ErrorBoundary from '../../components/shared/ErrorBoundary';

const EventManagement = lazy(() => import('../admin/EventManagement').then(m => ({ default: m.EventManagement })));
const EventListView = lazy(() => import('../events/EventListView'));
const WhatsAppMessaging = lazy(() => import('../messaging/WhatsAppMessaging'));
const MentorScheduler = lazy(() => import('./MentorScheduler').then(m => ({ default: m.MentorScheduler })));
const GalleryManagement = lazy(() => import('../admin/GalleryManagement'));
const EmailsTab = lazy(() => import('./components/EmailsTab').then(m => ({ default: m.EmailsTab })));
const OverviewTab = lazy(() => import('./components/OverviewTab').then(m => ({ default: m.OverviewTab })));
const MenteesTab = lazy(() => import('./components/MenteesTab').then(m => ({ default: m.MenteesTab })));
const TasksTab = lazy(() => import('./components/TasksTab').then(m => ({ default: m.TasksTab })));
const ApplicationsTab = lazy(() => import('./components/ApplicationsTab').then(m => ({ default: m.ApplicationsTab })));
const VisitorBookingsTab = lazy(() => import('./components/VisitorBookingsTab').then(m => ({ default: m.VisitorBookingsTab })));
const GrowthAuditTab = lazy(() => import('./components/GrowthAuditTab'));
const ProgramProgressTab = lazy(() => import('./components/ProgramProgressTab').then(m => ({ default: m.ProgramProgressTab })));
const ReviewsTab = lazy(() => import('./components/ReviewsTab').then(m => ({ default: m.ReviewsTab })));
const AnalyticsBI = lazy(() => import('./components/AnalyticsBI'));
const AIDashboard = lazy(() => import('./components/AIDashboard'));
const ResourceDashboard = lazy(() => import('../resources/ResourceDashboard'));
import { useDashboard, MentorTab } from './hooks/useDashboard';
import { tagService } from '../../services/tagService';
import { notifySuccess } from '../../utils/toast';
import { User } from '../../types';

interface MentorDashboardProps {
  currentUser: User | null;
}

const MentorDashboard: React.FC<MentorDashboardProps> = ({ currentUser }) => {
  const navigate = useNavigate();
  const d = useDashboard({ currentUser });

  const [showSkeleton, setShowSkeleton] = React.useState(true);
  const loading = d.appsLoading || d.tasksLoading || d.bookingsLoading || d.eventsLoading;
  const loadingRef = React.useRef(false);

  if (loading) {
    loadingRef.current = true;
    if (!showSkeleton) setShowSkeleton(true);
  } else if (loadingRef.current) {
    loadingRef.current = false;
    setTimeout(() => setShowSkeleton(false), 300);
  }

  if (showSkeleton && d.activeTab === 'overview') {
    return (
      <div className="animate-in fade-in duration-700 space-y-8">
        <div className="space-y-4">
          <div className="h-8 w-48 bg-slate-100 rounded-xl animate-pulse" />
          <div className="h-4 w-96 bg-slate-100 rounded-xl animate-pulse" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-32 bg-slate-100 rounded-[32px] animate-pulse" />
          ))}
        </div>
        <div className="h-64 bg-slate-100 rounded-[32px] animate-pulse" />
      </div>
    );
  }

  if (d.selectedEventId) {
    return (
      <div className="animate-in fade-in duration-700">
        <Suspense fallback={<div className="h-64 bg-slate-50 rounded-[32px] animate-pulse" />}>
          <EventManagement
            eventId={d.selectedEventId}
            onBack={() => navigate('/mentor?tab=events')}
            onEdit={(evt) => d.handleEditEventClick(evt)}
            onDelete={(id) => { d.deleteEvent(id); navigate('/mentor?tab=events'); }}
          />
        </Suspense>
      </div>
    );
  }

  return (
    <ErrorBoundary>
    <div className={`animate-in fade-in duration-700 ${d.activeTab === 'messaging' ? 'h-full flex flex-col' : 'space-y-8'}`}>
      {d.activeTab === 'overview' && (
        <ErrorBoundary><Suspense fallback={<div className="h-64 bg-slate-50 rounded-[32px] animate-pulse" />}><OverviewTab
          handleTabChange={d.handleTabChange}
          getRecentActivityTimeline={d.getRecentActivityTimeline}
          handleOpenStudentProfile={d.handleOpenStudentProfile}
          formatRelativeTime={d.formatRelativeTime}
          getAtRiskStudents={d.getAtRiskStudents}
          currentCalendarDate={d.currentCalendarDate}
          setCurrentCalendarDate={d.setCurrentCalendarDate}
          selectedCalendarDate={d.selectedCalendarDate}
          setSelectedCalendarDate={d.setSelectedCalendarDate}
          getCalendarDays={d.getCalendarDays}
          getEventsOnDay={d.getEventsOnDay}
          sessions={d.sessions}
          studentProfiles={d.studentProfiles}
          applications={d.applications}
          conversations={d.conversations}
          communities={d.communities}
          broadcastTitle={d.broadcastTitle}
          setBroadcastTitle={d.setBroadcastTitle}
          broadcastContent={d.broadcastContent}
          setBroadcastContent={d.setBroadcastContent}
          handleBroadcast={d.handleBroadcast}
          selectedChartTab={d.selectedChartTab}
          setSelectedChartTab={d.setSelectedChartTab}
          getChartData={d.getChartData}
          chatHistory={d.chatHistory}
          userInput={d.userInput}
          setUserInput={d.setUserInput}
          isAiLoading={d.isAiLoading}
          handleAiChat={d.handleAiChat}
          programsLoading={d.programsLoading}
          programs={d.programs}
          setIsCreatingProgram={d.setIsCreatingProgram}
          setProgramWizardStep={d.setProgramWizardStep}
          setIsSchedulingSession={d.setIsSchedulingSession}
          sessionsFiltered={d.upcomingSessions}
          pendingApplications={d.pendingApplications}
          pendingTasks={d.pendingTasks}
          conversationsUnread={d.conversations.reduce((acc, c) => acc + (c.unreadCount || 0), 0)}
          activeStudentsCount={d.activeStudentsCount}
          upcomingSessions={d.upcomingSessions}
          allTags={d.allTags}
          setActiveTab={d.setActiveTab}
          events={d.events}
          eventsLoading={d.eventsLoading}
        /></Suspense></ErrorBoundary>
      )}

      {d.activeTab === 'feedback' && (
        <div className="space-y-8">
          <ErrorBoundary><Suspense fallback={<div className="h-64 bg-slate-50 rounded-[32px] animate-pulse" />}><ReviewsTab
            mentors={[]}
            students={d.studentProfiles}
          /></Suspense></ErrorBoundary>
          <div className="border-t border-slate-100 pt-8">
            <ErrorBoundary><Suspense fallback={<div className="h-64 bg-slate-50 rounded-[32px] animate-pulse" />}><TasksTab
              pendingTasks={d.pendingTasks}
              selectedTask={d.selectedTask}
              setSelectedTask={d.setSelectedTask}
              feedbackResponse={d.feedbackResponse}
              setFeedbackResponse={d.setFeedbackResponse}
              handleReviewTask={d.handleReviewTask}
            submitFeedback={d.submitFeedback}
          /></Suspense></ErrorBoundary>
          </div>
        </div>
      )}

      {d.activeTab === 'mentees' && (
        <ErrorBoundary><Suspense fallback={<div className="h-64 bg-slate-50 rounded-[32px] animate-pulse" />}><MenteesTab
          selectedMenteeId={d.selectedMenteeId}
          setSelectedMenteeId={d.setSelectedMenteeId}
          searchQuery={d.searchQuery}
          setSearchQuery={d.setSearchQuery}
          isAddingTag={d.isAddingTag}
          setIsAddingTag={d.setIsAddingTag}
          allTags={d.allTags}
          setAllTags={d.setAllTags}
          mentees={d.mentees}
          filteredMentees={d.filteredMentees}
          studentProfiles={d.studentProfiles}
          taskActivities={d.taskActivities}
          sessions={d.sessions}
          newTaskTitle={d.newTaskTitle}
          setNewTaskTitle={d.setNewTaskTitle}
          newTaskPriority={d.newTaskPriority}
          setNewTaskPriority={d.setNewTaskPriority}
          newTaskDueDate={d.newTaskDueDate}
          setNewTaskDueDate={d.setNewTaskDueDate}
          menteeNotes={d.menteeNotes}
          setMenteeNotes={d.setMenteeNotes}
          isSavingNotes={d.isSavingNotes}
          menteeSubTab={d.menteeSubTab}
          setMenteeSubTab={d.setMenteeSubTab}
          selectedTask={d.selectedTask}
          setSelectedTask={d.setSelectedTask}
          newTagLabel={d.newTagLabel}
          setNewTagLabel={d.setNewTagLabel}
          newTagColor={d.newTagColor}
          setNewTagColor={d.setNewTagColor}
          handleMessageStudent={d.handleMessageStudent}
          handleUpdateNotes={d.handleUpdateNotes}
          toggleMenteeTag={d.toggleMenteeTag}
          handleAddTag={d.handleAddTag}
          addTask={d.addTask}
          handleScheduleSession={d.handleScheduleSession}
          setActiveTab={d.setActiveTab}
          setIsSchedulingSession={d.setIsSchedulingSession}
          formSubmissions={d.formSubmissions}
          isCreatingForm={d.isCreatingForm}
          setIsCreatingForm={d.setIsCreatingForm}
          menteeGoals={d.menteeGoals}
          handleAddGoal={d.handleAddGoal}
          handleUpdateGoal={d.handleUpdateGoal}
          handleDeleteGoal={d.handleDeleteGoal}
            currentUser={d.currentUser}
        /></Suspense></ErrorBoundary>
      )}
      {d.activeTab === 'applications' && (
        <ErrorBoundary><Suspense fallback={<div className="h-64 bg-slate-50 rounded-[32px] animate-pulse" />}><ApplicationsTab
          applications={d.applications}
          pendingApplications={d.pendingApplications}
          appSearch={d.appSearch}
          setAppSearch={d.setAppSearch}
          appStatus={d.appStatus}
          setAppStatus={d.setAppStatus}
          appDiscipline={d.appDiscipline}
          setAppDiscipline={d.setAppDiscipline}
          appSortBy={d.appSortBy}
          setAppSortBy={d.setAppSortBy}
          appSortOrder={d.appSortOrder}
          setAppSortOrder={d.setAppSortOrder}
          appPage={d.appPage}
          setAppPage={d.setAppPage}
          appLimit={d.appLimit}
          setAppLimit={d.setAppLimit}
          modalTab={d.modalTab}
          setModalTab={d.setModalTab}
          applicationDetails={d.applicationDetails}
          detailsLoading={d.detailsLoading}
          newNoteText={d.newNoteText}
          setNewNoteText={d.setNewNoteText}
          editingNoteId={d.editingNoteId}
          setEditingNoteId={d.setEditingNoteId}
          editingNoteText={d.editingNoteText}
          setEditingNoteText={d.setEditingNoteText}
          requestInfoText={d.requestInfoText}
          setRequestInfoText={d.setRequestInfoText}
          isRequestingInfo={d.isRequestingInfo}
          setIsRequestingInfo={d.setIsRequestingInfo}
          isRejecting={d.isRejecting}
          setIsRejecting={d.setIsRejecting}
          rejectionReason={d.rejectionReason}
          setRejectionReason={d.setRejectionReason}
          rejectionFeedback={d.rejectionFeedback}
          setRejectionFeedback={d.setRejectionFeedback}
          selectedApplication={d.selectedApplication}
          setSelectedApplication={d.setSelectedApplication}
          handleApplicationAction={d.handleApplicationAction}
          refreshApps={d.refreshApps}
          updateAppStatus={d.updateAppStatus}
            filteredAppsForTab={d.filteredAppsForTab}
        /></Suspense></ErrorBoundary>
      )}

      {d.activeTab === 'bookings' && (
        <ErrorBoundary><Suspense fallback={<div className="h-64 bg-slate-50 rounded-[32px] animate-pulse" />}><VisitorBookingsTab /></Suspense></ErrorBoundary>
      )}

      {d.activeTab === 'messaging' && (
        <ErrorBoundary><Suspense fallback={<div className="h-64 bg-slate-50 rounded-[32px] animate-pulse" />}><WhatsAppMessaging currentUserId={d.currentUser?.id || ''} currentUserName={d.currentUser?.name || 'Mentor'} role="mentor" /></Suspense></ErrorBoundary>
      )}

      {d.activeTab === 'events' && <ErrorBoundary><Suspense fallback={<div className="h-64 bg-slate-50 rounded-[32px] animate-pulse" />}><EventListView /></Suspense></ErrorBoundary>}

      {d.activeTab === 'programs' && (
        <div className="space-y-6 animate-in fade-in duration-500">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-slate-900">Programs</h1>
            <p className="text-xs text-slate-500 mt-1 font-medium">Mentorship program templates and curricula</p>
          </div>
          {d.programs.length === 0 ? (
            <div className="bg-white p-12 rounded-[32px] border border-slate-100 shadow-sm text-center">
              <p className="text-sm text-slate-400 font-medium">No programs created yet.</p>
              <p className="text-[10px] text-slate-300 mt-2 font-bold uppercase tracking-widest">Use the Overview tab to design your first program.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {d.programs.map((prg: any) => (
                <div key={prg.id} className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm hover:shadow-md transition-all">
                  <h3 className="text-sm font-black uppercase tracking-tight text-slate-900">{prg.title}</h3>
                  <p className="text-[10px] text-slate-500 mt-1 font-medium">{prg.modules?.length || 0} modules</p>
                  <p className="text-xs text-slate-600 mt-2 line-clamp-2">{prg.description}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {d.activeTab === 'sessions' && (
        <ErrorBoundary><Suspense fallback={<div className="h-64 bg-slate-50 rounded-[32px] animate-pulse" />}><MentorScheduler
          currentUser={d.currentUser}
          studentProfiles={d.studentProfiles}
          programs={d.programs}
          sessions={d.sessions}
          addSession={d.addSession}
          updateSession={d.updateSession}
          deleteSession={d.deleteSession}
          refreshSessions={d.refreshSessions}
        /></Suspense></ErrorBoundary>
      )}

      {d.activeTab === 'resources' && (
        <ErrorBoundary><Suspense fallback={<div className="h-64 bg-slate-50 rounded-[32px] animate-pulse" />}><ResourceDashboard isMentor={true} /></Suspense></ErrorBoundary>
      )}

      {d.activeTab === 'analytics' && (
        <ErrorBoundary>
          <Suspense fallback={<div className="h-64 bg-slate-50 rounded-[32px] animate-pulse" />}><AnalyticsBI currentUser={d.currentUser} /></Suspense>
        </ErrorBoundary>
      )}

      {d.activeTab === 'ai' && (
        <ErrorBoundary><Suspense fallback={<div className="h-64 bg-slate-50 rounded-[32px] animate-pulse" />}><AIDashboard
          chatHistory={d.chatHistory}
          setChatHistory={d.setChatHistory}
          userInput={d.userInput}
          setUserInput={d.setUserInput}
          isAiLoading={d.isAiLoading}
          streamingContent={d.streamingContent}
          chatEndRef={d.chatEndRef}
          isGeneratingOverview={d.isGeneratingOverview}
          aiOverviewText={d.aiOverviewText}
          insights={d.insights}
          isGeneratingInsights={d.isGeneratingInsights}
          savedConversations={d.savedConversations}
          pinnedConversationIds={d.pinnedConversationIds}
          suggestedPrompts={d.suggestedPrompts}
          recommendationsResult={d.recommendationsResult}
          handleAiChat={d.handleAiChat}
          handleQuickAction={d.handleQuickAction}
          fetchAiInsights={d.fetchAiInsights}
          generateAiOverview={d.generateAiOverview}
          stopGeneration={d.stopGeneration}
          saveConversation={d.saveConversation}
          deleteConversation={d.deleteConversation}
          renameConversation={d.renameConversation}
          loadConversation={d.loadConversation}
          togglePinned={d.togglePinned}
          clearChat={d.clearChat}
          searchConversations={d.searchConversations}
          studentProfiles={d.studentProfiles}
          sessions={d.sessions}
          applications={d.applications}
          programs={d.programs}
          userId={d.currentUser?.id}
        /></Suspense></ErrorBoundary>
      )}

      {d.activeTab === 'gallery' && (
        <ErrorBoundary><Suspense fallback={<div className="h-64 bg-slate-50 rounded-[32px] animate-pulse" />}><GalleryManagement /></Suspense></ErrorBoundary>
      )}

      {d.activeTab === 'emails' && (
        <ErrorBoundary><Suspense fallback={<div className="h-64 bg-slate-50 rounded-[32px] animate-pulse" />}><EmailsTab
          studentProfiles={d.studentProfiles}
          currentUser={d.currentUser}
        /></Suspense></ErrorBoundary>
      )}

      {d.activeTab === 'growth-audit' && (
        <ErrorBoundary><Suspense fallback={<div className="h-64 bg-slate-50 rounded-[32px] animate-pulse" />}><GrowthAuditTab
          studentProfiles={d.studentProfiles}
          taskActivities={d.taskActivities}
        /></Suspense></ErrorBoundary>
      )}

      {d.activeTab === 'program-progress' && (
        <ErrorBoundary><Suspense fallback={<div className="h-64 bg-slate-50 rounded-[32px] animate-pulse" />}><ProgramProgressTab
          programs={d.programs}
          studentProfiles={d.studentProfiles}
          onNavigateToStudent={d.handleOpenStudentProfile}
        /></Suspense></ErrorBoundary>
      )}

      {/* Tag Management Modal */}
      {d.isAddingTag && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-300">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-white rounded-[40px] max-w-lg w-full p-10 shadow-2xl relative"
          >
            <button onClick={() => d.setIsAddingTag(false)} className="absolute top-8 right-8 w-10 h-10 flex items-center justify-center bg-slate-50 rounded-full hover:bg-slate-100 transition-colors" aria-label="Close add tag">
              <X size={18} />
            </button>
            <div className="mb-8">
              <h3 className="text-3xl font-black uppercase tracking-tighter">Tag Management</h3>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Organize your workflow categories</p>
            </div>
            <div className="space-y-6">
              <div className="space-y-3 p-6 bg-slate-50 rounded-[32px] border border-slate-100">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Create New Category</p>
                <div className="flex gap-2">
                  <input type="text" placeholder="Tag name..." className="flex-1 px-5 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-medium outline-none focus:border-black transition-all" value={d.newTagLabel} onChange={e => d.setNewTagLabel(e.target.value)} />
                  <button onClick={d.handleAddTag} disabled={!d.newTagLabel.trim()} className="px-6 py-3 bg-black text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-slate-800 transition-all disabled:opacity-50">Create</button>
                </div>
                <div className="flex flex-wrap gap-2 mt-4">
                  {['bg-blue-100 text-blue-700', 'bg-emerald-100 text-emerald-700', 'bg-amber-100 text-amber-700', 'bg-indigo-100 text-indigo-700', 'bg-purple-100 text-purple-700', 'bg-rose-100 text-rose-700', 'bg-slate-100 text-slate-700'].map(color => (
                    <button key={color} onClick={() => d.setNewTagColor(color)} className={`w-6 h-6 rounded-full transition-all border-2 ${color} ${d.newTagColor === color ? 'border-black scale-125' : 'border-transparent opacity-50 hover:opacity-100'}`} />
                  ))}
                </div>
              </div>
              <div className="space-y-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-2">Library Tags ({d.allTags.length})</p>
                <div className="grid grid-cols-1 gap-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                  {d.allTags.map(tag => (
                    <div key={tag.id} className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl group hover:border-slate-300 transition-all">
                      <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${tag.color}`}>{tag.label}</span>
                      <button
                        onClick={() => {
                          tagService.delete(tag.id);
                          d.setAllTags(prev => prev.filter(t => t.id !== tag.id));
                          notifySuccess('Tag removed from library');
                        }}
                        className="w-8 h-8 flex items-center justify-center text-slate-300 hover:text-red-500 hover:bg-rose-50 rounded-full transition-all opacity-0 group-hover:opacity-100"
                        aria-label="Delete tag"
                      >
                        <Trash size={14} />
                      </button>
                    </div>
                  ))}
                  {d.allTags.length === 0 && (
                    <p className="text-center py-8 text-[10px] font-bold text-slate-300 uppercase tracking-widest">No tags in library.</p>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Session Scheduling Modal */}
      {d.isSchedulingSession && (() => {
        const mentee = d.mentees.find(m => m.user_id === d.selectedMenteeId);
        if (!mentee) return null;
        return (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-300">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="bg-white rounded-[40px] max-w-lg w-full p-10 shadow-2xl relative"
            >
            <button onClick={() => d.setIsSchedulingSession(false)} className="absolute top-8 right-8 w-10 h-10 flex items-center justify-center bg-slate-50 rounded-full hover:bg-slate-100 transition-colors" aria-label="Close schedule session">
              <X size={18} />
            </button>
              <div className="mb-6">
                <h3 className="text-3xl font-black uppercase tracking-tighter">Schedule 1:1</h3>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Set up a session with {mentee.full_name}</p>
              </div>
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Session Title *</label>
                  <input type="text" placeholder="e.g. Portfolio Strategy & Alignment" className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-medium outline-none focus:border-black transition-all" value={d.sessionTitle} onChange={e => d.setSessionTitle(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Description / Agenda</label>
                  <textarea rows={2} placeholder="What will you cover in this session?" className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-medium outline-none focus:border-black transition-all resize-none" value={d.sessionDesc} onChange={e => d.setSessionDesc(e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Date *</label>
                    <input type="date" className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-medium outline-none focus:border-black transition-all" value={d.sessionDate} onChange={e => d.setSessionDate(e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Time *</label>
                    <input type="time" className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-medium outline-none focus:border-black transition-all" value={d.sessionTime} onChange={e => d.setSessionTime(e.target.value)} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Duration *</label>
                    <select className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-medium outline-none focus:border-black transition-all" value={d.sessionDuration} onChange={e => d.setSessionDuration(Number(e.target.value))}>
                      <option value={15}>15 Minutes</option>
                      <option value={30}>30 Minutes</option>
                      <option value={45}>45 Minutes</option>
                      <option value={60}>60 Minutes</option>
                      <option value={90}>90 Minutes</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Video Platform URL</label>
                    <input type="url" placeholder="e.g. Google Meet or Zoom" className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-medium outline-none focus:border-black transition-all" value={d.sessionMeetingUrl ?? ''} onChange={e => d.setSessionMeetingUrl(e.target.value)} />
                  </div>
                </div>
                <div className="pt-4 flex gap-3">
                  <button onClick={() => d.setIsSchedulingSession(false)} className="flex-1 px-6 py-4 border border-slate-200 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-slate-50 transition-all text-slate-600">Cancel</button>
                  <button onClick={() => d.handleScheduleSession(mentee.user_id)} disabled={!d.sessionTitle.trim() || !d.sessionDate || !d.sessionTime} className="flex-1 px-6 py-4 bg-emerald-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-500/10 disabled:opacity-50">Schedule Session</button>
                </div>
              </div>
            </motion.div>
          </div>
        );
      })()}

      {/* Event Creation/Edit Modal */}
      {d.isCreatingEvent && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-300">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-white rounded-[40px] max-w-4xl w-full max-h-[90vh] overflow-y-auto p-10 shadow-2xl relative"
          >
            <button onClick={d.handleCancelEventEdit} className="absolute top-8 right-8 w-10 h-10 flex items-center justify-center bg-slate-50 rounded-full hover:bg-slate-100 transition-colors" aria-label="Close edit event">
              <X size={18} />
            </button>

            <div className="mb-8">
              <h3 className="text-3xl font-black uppercase tracking-tighter">{d.editingEventId ? 'Edit Event' : 'Create Event'}</h3>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{d.editingEventId ? 'Modify workshop details' : 'Schedule a new workshop or event'}</p>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 space-y-6 custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2 px-1">Workshop Title *</p>
                  <input type="text" placeholder="e.g. UX Design Portfolio Review" className={`w-full px-5 py-3.5 bg-slate-50 border ${d.eventErrors.title ? 'border-red-500' : 'border-slate-100'} rounded-2xl text-sm font-bold outline-none focus:bg-white focus:border-black transition-all`} value={d.newEventData.title || ''} onChange={e => d.setNewEventData(prev => ({ ...prev, title: e.target.value }))} />
                  {d.eventErrors.title && <p className="text-[10px] text-red-500 font-bold mt-1 px-1">{d.eventErrors.title}</p>}
                </div>

                <div className="md:col-span-2">
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2 px-1">Description *</p>
                  <textarea placeholder="Provide details about the event, what students will learn, etc." className={`w-full h-24 px-5 py-3.5 bg-slate-50 border ${d.eventErrors.description ? 'border-red-500' : 'border-slate-100'} rounded-2xl text-sm font-bold outline-none focus:bg-white focus:border-black transition-all resize-none`} value={d.newEventData.description || ''} onChange={e => d.setNewEventData(prev => ({ ...prev, description: e.target.value }))} />
                  {d.eventErrors.description && <p className="text-[10px] text-red-500 font-bold mt-1 px-1">{d.eventErrors.description}</p>}
                </div>

                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2 px-1">Category / Workshop Type *</p>
                  <select className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none focus:bg-white focus:border-black transition-all" value={d.newEventData.category || 'Workshop'} onChange={e => d.setNewEventData(prev => ({ ...prev, category: e.target.value }))}>
                    <option value="Workshop">Workshop</option>
                    <option value="Networking">Networking</option>
                    <option value="Masterclass">Masterclass</option>
                    <option value="Q&A Session">Q&A Session</option>
                    <option value="Panel">Panel</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2 px-1">Speaker / Mentor</p>
                  <input type="text" placeholder="e.g. Sarah Connor" className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none focus:bg-white focus:border-black transition-all" value={d.newEventData.speaker || ''} onChange={e => d.setNewEventData(prev => ({ ...prev, speaker: e.target.value }))} />
                </div>
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2 px-1">Date *</p>
                  <input type="date" className={`w-full px-5 py-3.5 bg-slate-50 border ${d.eventErrors.date ? 'border-red-500' : 'border-slate-100'} rounded-2xl text-sm font-bold outline-none focus:bg-white focus:border-black transition-all`} value={d.newEventData.date || ''} onChange={e => d.setNewEventData(prev => ({ ...prev, date: e.target.value }))} />
                  {d.eventErrors.date && <p className="text-[10px] text-red-500 font-bold mt-1 px-1">{d.eventErrors.date}</p>}
                </div>
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2 px-1">Registration Deadline</p>
                  <input type="date" className={`w-full px-5 py-3.5 bg-slate-50 border ${d.eventErrors.registrationDeadline ? 'border-red-500' : 'border-slate-100'} rounded-2xl text-sm font-bold outline-none focus:bg-white focus:border-black transition-all`} value={d.newEventData.registrationDeadline || ''} onChange={e => d.setNewEventData(prev => ({ ...prev, registrationDeadline: e.target.value }))} />
                  {d.eventErrors.registrationDeadline && <p className="text-[10px] text-red-500 font-bold mt-1 px-1">{d.eventErrors.registrationDeadline}</p>}
                </div>
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2 px-1">Start Time *</p>
                  <input type="time" className={`w-full px-5 py-3.5 bg-slate-50 border ${d.eventErrors.time ? 'border-red-500' : 'border-slate-100'} rounded-2xl text-sm font-bold outline-none focus:bg-white focus:border-black transition-all`} value={d.newEventData.time || ''} onChange={e => d.setNewEventData(prev => ({ ...prev, time: e.target.value }))} />
                  {d.eventErrors.time && <p className="text-[10px] text-red-500 font-bold mt-1 px-1">{d.eventErrors.time}</p>}
                </div>
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2 px-1">End Time</p>
                  <input type="time" className={`w-full px-5 py-3.5 bg-slate-50 border ${d.eventErrors.endTime ? 'border-red-500' : 'border-slate-100'} rounded-2xl text-sm font-bold outline-none focus:bg-white focus:border-black transition-all`} value={d.newEventData.endTime || ''} onChange={e => d.setNewEventData(prev => ({ ...prev, endTime: e.target.value }))} />
                  {d.eventErrors.endTime && <p className="text-[10px] text-red-500 font-bold mt-1 px-1">{d.eventErrors.endTime}</p>}
                </div>
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2 px-1">Timezone</p>
                  <select className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none focus:bg-white focus:border-black transition-all" value={d.newEventData.timezone || 'UTC'} onChange={e => d.setNewEventData(prev => ({ ...prev, timezone: e.target.value }))}>
                    <option value="UTC">UTC</option>
                    <option value="EST">EST (Eastern Time)</option>
                    <option value="PST">PST (Pacific Time)</option>
                    <option value="GMT">GMT (Greenwich Mean Time)</option>
                    <option value="IST">IST (Indian Standard Time)</option>
                  </select>
                </div>
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2 px-1">Duration (e.g. 60 min, 2 hours)</p>
                  <input type="text" placeholder="e.g. 90 minutes" className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none focus:bg-white focus:border-black transition-all" value={d.newEventData.duration || ''} onChange={e => d.setNewEventData(prev => ({ ...prev, duration: e.target.value }))} />
                </div>
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2 px-1">Maximum Participants *</p>
                  <input type="number" className={`w-full px-5 py-3.5 bg-slate-50 border ${d.eventErrors.capacity ? 'border-red-500' : 'border-slate-100'} rounded-2xl text-sm font-bold outline-none focus:bg-white focus:border-black transition-all`} value={d.newEventData.capacity || 50} onChange={e => d.setNewEventData(prev => ({ ...prev, capacity: parseInt(e.target.value) || 0 }))} />
                  {d.eventErrors.capacity && <p className="text-[10px] text-red-500 font-bold mt-1 px-1">{d.eventErrors.capacity}</p>}
                </div>
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2 px-1">Waitlist Limit</p>
                  <input type="number" className={`w-full px-5 py-3.5 bg-slate-50 border ${d.eventErrors.waitlistLimit ? 'border-red-500' : 'border-slate-100'} rounded-2xl text-sm font-bold outline-none focus:bg-white focus:border-black transition-all`} value={d.newEventData.waitlistLimit || 0} onChange={e => d.setNewEventData(prev => ({ ...prev, waitlistLimit: parseInt(e.target.value) || 0 }))} />
                  {d.eventErrors.waitlistLimit && <p className="text-[10px] text-red-500 font-bold mt-1 px-1">{d.eventErrors.waitlistLimit}</p>}
                </div>
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2 px-1">Meeting Platform *</p>
                  <select className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none focus:bg-white focus:border-black transition-all" value={d.newEventData.location || 'Zoom'} onChange={e => d.setNewEventData(prev => ({ ...prev, location: e.target.value }))}>
                    <option value="Zoom">Zoom</option>
                    <option value="Google Meet">Google Meet</option>
                    <option value="WebEx">WebEx</option>
                    <option value="Offline">Offline</option>
                  </select>
                </div>
                <div>
                  {d.newEventData.location === 'Offline' ? (
                    <>
                      <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2 px-1">Venue *</p>
                      <input type="text" placeholder="e.g. NYC Innovation Hub Room 404" className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none focus:bg-white focus:border-black transition-all" value={d.newEventData.venue || ''} onChange={e => d.setNewEventData(prev => ({ ...prev, venue: e.target.value }))} />
                    </>
                  ) : (
                    <>
                      <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2 px-1">Meeting Link</p>
                      <input type="text" placeholder="https://zoom.us/j/..." className={`w-full px-5 py-3.5 bg-slate-50 border ${d.eventErrors.meetingLink ? 'border-red-500' : 'border-slate-100'} rounded-2xl text-sm font-bold outline-none focus:bg-white focus:border-black transition-all`} value={d.newEventData.meetingLink || ''} onChange={e => d.setNewEventData(prev => ({ ...prev, meetingLink: e.target.value }))} />
                      {d.eventErrors.meetingLink && <p className="text-[10px] text-red-500 font-bold mt-1 px-1">{d.eventErrors.meetingLink}</p>}
                    </>
                  )}
                </div>
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2 px-1">Banner Image URL</p>
                  <input type="text" placeholder="https://images.unsplash.com/..." className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none focus:bg-white focus:border-black transition-all" value={d.newEventData.image || ''} onChange={e => d.setNewEventData(prev => ({ ...prev, image: e.target.value }))} />
                  {d.newEventData.image && (
                    <div className="mt-2 w-full h-24 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200">
                      <img src={d.newEventData.image} alt="Banner preview" loading="lazy" className="w-full h-full object-cover" referrerPolicy="no-referrer" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2 px-1">Cover Image URL</p>
                  <input type="text" placeholder="https://images.unsplash.com/..." className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none focus:bg-white focus:border-black transition-all" value={d.newEventData.coverImage || ''} onChange={e => d.setNewEventData(prev => ({ ...prev, coverImage: e.target.value }))} />
                  {d.newEventData.coverImage && (
                    <div className="mt-2 w-full h-24 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200">
                      <img src={d.newEventData.coverImage} alt="Cover preview" loading="lazy" className="w-full h-full object-cover" referrerPolicy="no-referrer" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2 px-1">Visibility</p>
                  <select className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none focus:bg-white focus:border-black transition-all" value={d.newEventData.visibility || 'public'} onChange={e => d.setNewEventData(prev => ({ ...prev, visibility: e.target.value as 'public' | 'private' }))}>
                    <option value="public">Public</option>
                    <option value="private">Private</option>
                  </select>
                </div>
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2 px-1">Status</p>
                  <select className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none focus:bg-white focus:border-black transition-all" value={d.newEventData.status || 'published'} onChange={e => d.setNewEventData(prev => ({ ...prev, status: e.target.value as any }))}>
                    <option value="published">Published</option>
                    <option value="draft">Draft</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2 px-1">Event Accent Color</p>
                  <div className="flex items-center gap-3 w-full px-5 py-2.5 bg-slate-50 border border-slate-100 rounded-2xl">
                    <input type="color" className="w-10 h-10 border-0 rounded-lg cursor-pointer bg-transparent" value={d.newEventData.eventColor || '#000000'} onChange={e => d.setNewEventData(prev => ({ ...prev, eventColor: e.target.value }))} />
                    <span className="text-xs font-mono font-bold uppercase">{d.newEventData.eventColor || '#000000'}</span>
                  </div>
                </div>
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2 px-1">Resource Files (URLs/filenames)</p>
                  <input type="text" placeholder="e.g. handbook.pdf, template.fig" className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none focus:bg-white focus:border-black transition-all" value={d.newEventData.resourceFiles || ''} onChange={e => d.setNewEventData(prev => ({ ...prev, resourceFiles: e.target.value }))} />
                </div>
                <div className="md:col-span-2">
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2 px-1">Prerequisites / Requirements</p>
                  <input type="text" placeholder="e.g. Basic understanding of Figma, completed Module 1" className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none focus:bg-white focus:border-black transition-all" value={d.newEventData.requirements || ''} onChange={e => d.setNewEventData(prev => ({ ...prev, requirements: e.target.value }))} />
                </div>
                <div className="md:col-span-2">
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2 px-1">Tags (Comma separated)</p>
                  <input type="text" placeholder="e.g. Portfolio, Resume, Interview" className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none focus:bg-white focus:border-black transition-all" value={d.newEventData.tags || ''} onChange={e => d.setNewEventData(prev => ({ ...prev, tags: e.target.value }))} />
                </div>
              </div>
            </div>

            <div className="mt-8 flex gap-4 shrink-0">
              <button onClick={d.handleCancelEventEdit} className="flex-1 py-4 bg-slate-100 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all">Cancel</button>
              <button onClick={d.handleSaveEvent} className="flex-1 py-4 bg-black text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-black/10">
                {d.editingEventId ? 'Save Changes' : 'Schedule Event'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
    </ErrorBoundary>
  );
};

export default MentorDashboard;
