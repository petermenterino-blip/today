import React, { useState } from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import {
  X, Loader2, Trash
} from 'lucide-react';
import { EventManagement } from '../admin/EventManagement';
import WhatsAppMessaging from '../messaging/WhatsAppMessaging';
import { MentorScheduler } from './MentorScheduler';
import GalleryManagement from '../admin/GalleryManagement';
import { OverviewTab } from './components/OverviewTab';
import { MenteesTab } from './components/MenteesTab';
import { TasksTab } from './components/TasksTab';
import { ApplicationsTab } from './components/ApplicationsTab';
import { VisitorBookingsTab } from './components/VisitorBookingsTab';
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

  if (d.appsLoading || d.tasksLoading || d.bookingsLoading || d.eventsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin text-slate-300" size={40} />
      </div>
    );
  }

  if (d.selectedEventId) {
    return (
      <div className="animate-in fade-in duration-700">
        <EventManagement
          eventId={d.selectedEventId}
          onBack={() => navigate('/mentor?tab=events')}
          onEdit={(evt) => d.handleEditEventClick(evt)}
          onDelete={(id) => { d.deleteEvent(id); navigate('/mentor?tab=events'); }}
        />
      </div>
    );
  }

  return (
    <div className={`animate-in fade-in duration-700 ${d.activeTab === 'messaging' ? 'h-full flex flex-col' : 'space-y-8'}`}>
      {d.activeTab === 'overview' && (
        <OverviewTab
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
        />
      )}

      {d.activeTab === 'feedback' && (
        <TasksTab
          pendingTasks={d.pendingTasks}
          selectedTask={d.selectedTask}
          setSelectedTask={d.setSelectedTask}
          feedbackResponse={d.feedbackResponse}
          setFeedbackResponse={d.setFeedbackResponse}
          handleReviewTask={d.handleReviewTask}
          submitFeedback={d.submitFeedback}
        />
      )}

      {d.activeTab === 'mentees' && (
        <MenteesTab
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
        />
      )}
      {d.activeTab === 'applications' && (
        <ApplicationsTab
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
        />
      )}

      {d.activeTab === 'bookings' && (
        <VisitorBookingsTab />
      )}

      {d.activeTab === 'messaging' && (
        <WhatsAppMessaging currentUserId={d.currentUser?.id || ''} currentUserName={d.currentUser?.name || 'Mentor'} role="mentor" />
      )}

      {d.activeTab === 'events' && (
        <div>{/* TODO: Implement EventsTab in future feature sprint */}</div>
      )}

      {d.activeTab === 'programs' && (
        <div>{/* TODO: Implement ProgramsTab in future feature sprint */}</div>
      )}

      {d.activeTab === 'sessions' && (
        <MentorScheduler
          sessions={d.sessions}
          events={d.events}
          studentProfiles={d.studentProfiles}
          applications={d.applications}
          allTags={d.allTags}
          currentUser={d.currentUser}
          onOpenStudentProfile={d.handleOpenStudentProfile}
          onMessageStudent={d.handleMessageStudent}
          weeklyAvailability={d.weeklyAvailability}
          setWeeklyAvailability={d.setWeeklyAvailability}
          isConfiguringAvailability={d.isConfiguringAvailability}
          setIsConfiguringAvailability={d.setIsConfiguringAvailability}
          isSchedulingSession={d.isSchedulingSession}
          setIsSchedulingSession={d.setIsSchedulingSession}
          sessionTitle={d.sessionTitle}
          setSessionTitle={d.setSessionTitle}
          sessionDesc={d.sessionDesc}
          setSessionDesc={d.setSessionDesc}
          sessionDate={d.sessionDate}
          setSessionDate={d.setSessionDate}
          sessionTime={d.sessionTime}
          setSessionTime={d.setSessionTime}
          sessionDuration={d.sessionDuration}
          setSessionDuration={d.setSessionDuration}
          sessionMeetingUrl={d.sessionMeetingUrl}
          setSessionMeetingUrl={d.setSessionMeetingUrl}
          handleScheduleSession={d.handleScheduleSession}
        />
      )}

      {d.activeTab === 'resources' && (
        <div>{/* TODO: Implement ResourcesTab in future feature sprint */}</div>
      )}

      {d.activeTab === 'analytics' && (
        <div className="space-y-6 animate-in fade-in duration-500">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-slate-900">Analytics</h1>
            <p className="text-xs text-slate-500 mt-1 font-medium">Student progress and engagement metrics</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm">
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2">Active Students</p>
              <p className="text-4xl font-black text-slate-900">{d.activeStudentsCount}</p>
            </div>
            <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm">
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2">Pending Applications</p>
              <p className="text-4xl font-black text-slate-900">{d.pendingApplications.length}</p>
            </div>
            <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm">
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2">Upcoming Sessions</p>
              <p className="text-4xl font-black text-slate-900">{d.upcomingSessions.length}</p>
            </div>
          </div>
          <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm">
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-4">Student Health Overview</p>
            <div className="space-y-3">
              {d.studentProfiles.filter((s: any) => s.healthStatus).map((s: any) => (
                <div key={s.user_id || s.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl">
                  <div className={`w-2.5 h-2.5 rounded-full ${s.healthStatus === 'active' ? 'bg-emerald-500' : s.healthStatus === 'needs_attention' ? 'bg-amber-500' : 'bg-red-500'}`} />
                  <span className="text-sm font-bold text-slate-800 flex-1">{s.name}</span>
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">{s.healthStatus}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {d.activeTab === 'ai' && (
        <div>{/* TODO: Implement AiInsightsTab in future feature sprint */}</div>
      )}

      {d.activeTab === 'gallery' && (
        <GalleryManagement />
      )}

      {/* Tag Management Modal */}
      {d.isAddingTag && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-300">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-white rounded-[40px] max-w-lg w-full p-10 shadow-2xl relative"
          >
            <button onClick={() => d.setIsAddingTag(false)} className="absolute top-8 right-8 w-10 h-10 flex items-center justify-center bg-slate-50 rounded-full hover:bg-slate-100 transition-colors">
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
              <button onClick={() => d.setIsSchedulingSession(false)} className="absolute top-8 right-8 w-10 h-10 flex items-center justify-center bg-slate-50 rounded-full hover:bg-slate-100 transition-colors">
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
            <button onClick={d.handleCancelEventEdit} className="absolute top-8 right-8 w-10 h-10 flex items-center justify-center bg-slate-50 rounded-full hover:bg-slate-100 transition-colors">
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
                </div>
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2 px-1">Cover Image URL</p>
                  <input type="text" placeholder="https://images.unsplash.com/..." className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none focus:bg-white focus:border-black transition-all" value={d.newEventData.coverImage || ''} onChange={e => d.setNewEventData(prev => ({ ...prev, coverImage: e.target.value }))} />
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
  );
};

export default MentorDashboard;
