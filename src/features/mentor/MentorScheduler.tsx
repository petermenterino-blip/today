import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Calendar as CalendarIcon, Clock, Video, Settings, Plus, Edit2, Trash2,
  X, AlertTriangle, Check, Copy, User, BookOpen, FileText, ExternalLink, Info,
} from 'lucide-react';
import { Session, StudentProfile } from '../../interfaces';
import { Program } from '../../types';
import { notificationStorage } from '../../services/notificationStorage';
import { notifySuccess, notifyError } from '../../utils/toast';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { useCalendar } from './hooks/useCalendar';
import { CalendarToolbar } from './components/CalendarToolbar';
import { CalendarTags } from './components/CalendarTags';
import { CalendarGrid } from './components/CalendarGrid';
import { SessionSidebar } from './components/SessionSidebar';
import { SessionDetailsModal } from './components/SessionDetailsModal';
import { SettingsModal } from './components/SettingsModal';
import {
  getSessionStyle, getTagForSession,
  DEFAULT_TAGS, DEFAULT_SETTINGS, TIMEZONES,
} from './components/calendarUtils';
import type { SchedulerSettings } from './components/calendarUtils';

interface MentorSchedulerProps {
  currentUser: any;
  studentProfiles: StudentProfile[];
  programs: Program[];
  sessions: Session[];
  addSession: (session: Omit<Session, 'id' | 'createdAt' | 'updatedAt'>) => Session;
  updateSession: (id: string, updates: Partial<Session>) => Session | undefined;
  deleteSession: (id: string) => boolean;
  refreshSessions: () => void;
}

export const MentorScheduler: React.FC<MentorSchedulerProps> = ({
  currentUser,
  studentProfiles,
  programs,
  sessions,
  addSession,
  updateSession,
  deleteSession,
  refreshSessions,
}) => {
  const calendar = useCalendar();

  const [settings, setSettings] = useState<SchedulerSettings>(() => {
    try {
      const saved = localStorage.getItem(`mentorino_scheduler_settings_${currentUser?.id || 'default'}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (!parsed.calendarTags || parsed.calendarTags.length === 0) {
          parsed.calendarTags = DEFAULT_TAGS;
        }
        return parsed;
      }
      return { ...DEFAULT_SETTINGS, calendarTags: DEFAULT_TAGS };
    } catch {
      return { ...DEFAULT_SETTINGS, calendarTags: DEFAULT_TAGS };
    }
  });

  const saveSettings = (newSettings: SchedulerSettings) => {
    setSettings(newSettings);
    localStorage.setItem(`mentorino_scheduler_settings_${currentUser?.id || 'default'}`, JSON.stringify(newSettings));
    notifySuccess('Scheduler settings updated successfully.');
  };

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<Session | null>(null);
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<string | null>(null);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [previewStudent, setPreviewStudent] = useState<StudentProfile | null>(null);
  const [previewProgram, setPreviewProgram] = useState<Program | null>(null);

  const [formTitle, setFormTitle] = useState('');
  const [formStudentId, setFormStudentId] = useState('');
  const [formProgramId, setFormProgramId] = useState('');
  const [formDate, setFormDate] = useState('');
  const [formStartTime, setFormStartTime] = useState('');
  const [formEndTime, setFormEndTime] = useState('');
  const [formDuration, setFormDuration] = useState(45);
  const [formTimezone, setFormTimezone] = useState('America/New_York');
  const [formMeetingType, setFormMeetingType] = useState<'Google Meet' | 'Zoom' | 'Offline'>('Google Meet');
  const [formMeetingLink, setFormMeetingLink] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [formSessionType, setFormSessionType] = useState<string>('1:1');
  const [formRecurring, setFormRecurring] = useState(false);
  const [formReminderTime, setFormReminderTime] = useState('15 minutes before');
  const [formAttachedFiles, setFormAttachedFiles] = useState('');
  const [formInternalNotes, setFormInternalNotes] = useState('');

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [conflictWarnings, setConflictWarnings] = useState<string[]>([]);

  const [confirmCancel, setConfirmCancel] = useState<Session | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Session | null>(null);
  const [confirmForceOverlap, setConfirmForceOverlap] = useState<{ session: Session; warnings: string[] } | null>(null);

  useEffect(() => {
    if (formStartTime && formEndTime) {
      const startParts = formStartTime.split(':').map(Number);
      const endParts = formEndTime.split(':').map(Number);
      if (startParts.length === 2 && endParts.length === 2) {
        const startMin = startParts[0] * 60 + startParts[1];
        const endMin = endParts[0] * 60 + endParts[1];
        if (endMin > startMin) {
          setFormDuration(endMin - startMin);
        }
      }
    }
  }, [formStartTime, formEndTime]);

  const adjustEndTimeFromDuration = (startTimeStr: string, durationMin: number) => {
    if (!startTimeStr) return;
    const parts = startTimeStr.split(':').map(Number);
    if (parts.length === 2) {
      const totalMinutes = parts[0] * 60 + parts[1] + durationMin;
      const hours = Math.floor(totalMinutes / 60) % 24;
      const minutes = totalMinutes % 60;
      setFormEndTime(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`);
    }
  };

  useEffect(() => {
    if (formStartTime && formDuration) {
      adjustEndTimeFromDuration(formStartTime, formDuration);
    }
  }, [formStartTime, formDuration]);

  const getTagForSessionFn = (session: Session) => getTagForSession(session, settings.calendarTags || DEFAULT_TAGS);

  const visibleSessions = useMemo(() => {
    return sessions.filter(session => {
      const tag = getTagForSessionFn(session);
      return tag.visible !== false;
    });
  }, [sessions, settings.calendarTags]);

  const getStudentForSession = (studentId: string) => {
    return studentProfiles.find(p => p.user_id === studentId || p.id === studentId);
  };

  const getProgramForSession = (programId?: string) => {
    return programs.find(p => p.id === programId);
  };

  const performConflictCheck = (
    idToIgnore: string | null,
    date: string,
    startTime: string,
    endTime: string,
    studentId: string,
    sessionType: string,
  ) => {
    const warnings: string[] = [];
    if (!date || !startTime || !endTime) return warnings;

    const startMin = startTime.split(':').map(Number).reduce((h, m) => h * 60 + m, 0);
    const endMin = endTime.split(':').map(Number).reduce((h, m) => h * 60 + m, 0);

    if (endMin <= startMin) {
      warnings.push("End time must be after the start time.");
      return warnings;
    }

    const dayOfWeek = new Date(date).toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    const isWorkingDay = settings.workingDays.includes(dayOfWeek);
    if (!isWorkingDay) {
      warnings.push(`Warning: Selected date falls on ${dayOfWeek.toUpperCase()}, which is outside your configured Working Days.`);
    }

    const workingStartMin = settings.workingHoursStart.split(':').map(Number).reduce((h, m) => h * 60 + m, 0);
    const workingEndMin = settings.workingHoursEnd.split(':').map(Number).reduce((h, m) => h * 60 + m, 0);
    if (startMin < workingStartMin || endMin > workingEndMin) {
      warnings.push(`Warning: Selected slot (${startTime} - ${endTime}) is outside your Working Hours (${settings.workingHoursStart} - ${settings.workingHoursEnd}).`);
    }

    const checkStart = new Date(`${date}T${startTime}`).getTime();
    const checkEnd = new Date(`${date}T${endTime}`).getTime();

    for (const session of sessions) {
      if (session.id === idToIgnore) continue;
      if (session.status === 'cancelled') continue;

      const sStart = new Date(session.startTime).getTime();
      const sEnd = new Date(session.endTime).getTime();

      if (checkStart < sEnd && checkEnd > sStart) {
        warnings.push(`Double Booking Alert: You already have another session scheduled during this time: "${session.title}" (${new Date(session.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${new Date(session.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}).`);

        if (studentId && session.studentId === studentId) {
          const studentName = studentProfiles.find(p => p.user_id === studentId || p.id === studentId)?.name || "the student";
          warnings.push(`Student Unavailable: ${studentName} is already booked in "${session.title}" during this time.`);
        }
      }
    }
    return warnings;
  };

  useEffect(() => {
    const warnings = performConflictCheck(
      editingSession ? editingSession.id : null,
      formDate,
      formStartTime,
      formEndTime,
      formStudentId,
      formSessionType,
    );
    setConflictWarnings(warnings);
  }, [formDate, formStartTime, formEndTime, formStudentId, formSessionType, editingSession, sessions, settings]);

  const openCreateModal = (initialDate?: Date) => {
    setEditingSession(null);
    const targetDate = initialDate || new Date();
    const dateStr = targetDate.toISOString().split('T')[0];

    setFormTitle('');
    setFormStudentId('');
    setFormProgramId('');
    setFormDate(dateStr);
    setFormStartTime('');
    setFormEndTime('');
    setFormDuration(0);
    let localTz = settings.timezone;
    try {
      localTz = Intl.DateTimeFormat().resolvedOptions().timeZone || settings.timezone;
    } catch (e) { /* ignore */ }
    setFormTimezone(localTz);
    setFormMeetingType('' as any);
    setFormMeetingLink('');
    setFormNotes('');
    setFormInternalNotes('');
    setFormSessionType('');
    setFormRecurring(false);
    setFormReminderTime('15 minutes before');
    setFormAttachedFiles('');
    setValidationErrors({});
    setIsModalOpen(true);
  };

  const openEditModal = (session: Session) => {
    setEditingSession(session);
    setFormTitle(session.title);
    setFormStudentId(session.studentId);
    setFormProgramId(session.programId || '');
    const sDate = new Date(session.startTime);
    const dateStr = sDate.toISOString().split('T')[0];
    const startTimeStr = sDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    const eDate = new Date(session.endTime);
    const endTimeStr = eDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    setFormDate(dateStr);
    setFormStartTime(startTimeStr);
    setFormEndTime(endTimeStr);
    setFormDuration(session.duration ? parseInt(session.duration) || 45 : 45);
    setFormTimezone(session.timezone || settings.timezone);
    setFormMeetingType(session.meetingType || 'Google Meet');
    setFormMeetingLink(session.meetingUrl || '');
    setFormNotes(session.notes || '');
    setFormInternalNotes(session.internalNotes || '');
    setFormSessionType(session.sessionType || '1:1');
    setFormRecurring(session.recurringSession || false);
    setFormReminderTime(session.reminderTime || '15 minutes before');
    setFormAttachedFiles(session.attachedFiles || '');
    setValidationErrors({});
    setIsModalOpen(true);
  };

  const handleSaveSession = async () => {
    const errors: Record<string, string> = {};
    if (!formStudentId) errors.studentId = "Student selection is required.";
    if (!formProgramId) errors.programId = "Program selection is required.";
    if (!formSessionType) errors.sessionType = "Session Type (Tag) is required.";
    if (!formDate) errors.date = "Date is required.";
    if (!formStartTime) errors.startTime = "Start Time is required.";
    if (!formEndTime) errors.endTime = "End Time is required.";

    if (formStartTime && formEndTime) {
      const startMin = formStartTime.split(':').map(Number).reduce((h, m) => h * 60 + m, 0);
      const endMin = formEndTime.split(':').map(Number).reduce((h, m) => h * 60 + m, 0);
      if (endMin <= startMin) {
        errors.endTime = "End Time must be strictly after the Start Time.";
      }
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      notifyError("Please select all required fields before scheduling.");
      return;
    }

    const startIso = `${formDate}T${formStartTime}:00`;
    const endIso = `${formDate}T${formEndTime}:00`;
    const checkStart = new Date(startIso).getTime();
    const checkEnd = new Date(endIso).getTime();

    const overlapSession = sessions.find(session => {
      if (editingSession && session.id === editingSession.id) return false;
      if (session.status === 'cancelled') return false;
      const sStart = new Date(session.startTime).getTime();
      const sEnd = new Date(session.endTime).getTime();
      return (checkStart < sEnd && checkEnd > sStart);
    });

    if (overlapSession) {
      errors.overlap = `Conflict: Overlapping session found: "${overlapSession.title}" (${new Date(overlapSession.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${new Date(overlapSession.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}).`;
      setValidationErrors(errors);
      notifyError("Cannot schedule: Overlapping sessions are not permitted.");
      return;
    }

    let finalTitle = formTitle.trim();
    if (!finalTitle) {
      const studentName = studentProfiles.find(p => p.user_id === formStudentId || p.id === formStudentId)?.name || 'Student';
      finalTitle = `${formSessionType} Session with ${studentName}`;
    }

    const sessionPayload: Omit<Session, 'id' | 'createdAt' | 'updatedAt'> & Partial<Session> = {
      mentorId: currentUser?.id || 'mentor-1',
      studentId: formStudentId,
      programId: formProgramId,
      title: finalTitle,
      description: formNotes,
      startTime: new Date(startIso).toISOString(),
      endTime: new Date(endIso).toISOString(),
      meetingUrl: formMeetingLink || undefined,
      attendanceStatus: 'pending',
      notes: formNotes,
      internalNotes: formInternalNotes,
      duration: `${formDuration} min`,
      timezone: formTimezone,
      meetingType: formMeetingType || 'Google Meet',
      sessionType: formSessionType,
      recurringSession: formRecurring,
      reminderTime: formReminderTime,
      attachedFiles: formAttachedFiles,
      status: 'scheduled',
    };

    try {
      if (editingSession) {
        updateSession(editingSession.id, sessionPayload);
        notifySuccess("Session updated successfully.");
        await notificationStorage.create({
          userId: formStudentId,
          title: `Session Rescheduled: ${finalTitle}`,
          message: `Your mentoring session "${finalTitle}" with ${currentUser?.full_name || currentUser?.name || 'Peter'} has been updated to ${new Date(startIso).toLocaleDateString()} at ${formStartTime}.`,
          read: false, type: 'system', link: '/sessions',
        });
      } else {
        addSession(sessionPayload);
        notifySuccess("Session scheduled successfully.");
        await notificationStorage.create({
          userId: formStudentId,
          title: `New Session Scheduled: ${finalTitle}`,
          message: `You have a new mentoring session "${finalTitle}" scheduled with ${currentUser?.full_name || currentUser?.name || 'Peter'} on ${new Date(startIso).toLocaleDateString()} at ${formStartTime}.`,
          read: false, type: 'system', link: '/sessions',
        });
        setTimeout(async () => {
          await notificationStorage.create({
            userId: formStudentId,
            title: `Reminder: ${finalTitle}`,
            message: `Reminder: Your session "${finalTitle}" starts in ${formReminderTime}.`,
            read: false, type: 'system', link: '/sessions',
          });
        }, 5000);
      }
      setIsModalOpen(false);
      setEditingSession(null);
      refreshSessions();
    } catch (e: any) {
      notifyError(`Failed to save session: ${e.message}`);
    }
  };

  const handleDragStart = (e: React.DragEvent, session: Session) => {
    e.dataTransfer.setData('text/plain', session.id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDropOnDate = async (e: React.DragEvent, targetDate: Date, targetTimeStr?: string) => {
    e.preventDefault();
    const sessionId = e.dataTransfer.getData('text/plain');
    if (!sessionId) return;
    const sessionToMove = sessions.find(s => s.id === sessionId);
    if (!sessionToMove) return;
    const currentStart = new Date(sessionToMove.startTime);
    const currentEnd = new Date(sessionToMove.endTime);
    const durationMs = currentEnd.getTime() - currentStart.getTime();
    const newStart = new Date(targetDate);
    if (targetTimeStr) {
      const [h, m] = targetTimeStr.split(':').map(Number);
      newStart.setHours(h, m, 0, 0);
    } else {
      newStart.setHours(currentStart.getHours(), currentStart.getMinutes(), 0, 0);
    }
    const newEnd = new Date(newStart.getTime() + durationMs);
    const dateStr = newStart.toISOString().split('T')[0];
    const startStr = newStart.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    const endStr = newEnd.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    const warnings = performConflictCheck(sessionToMove.id, dateStr, startStr, endStr, sessionToMove.studentId, sessionToMove.sessionType || '1:1');
    if (warnings.length > 0) {
      setConfirmForceOverlap({ session: sessionToMove, warnings });
      return;
    }
    try {
      updateSession(sessionToMove.id, { startTime: newStart.toISOString(), endTime: newEnd.toISOString() });
      notifySuccess(`Rescheduled "${sessionToMove.title}" to ${newStart.toLocaleString()}`);
      await notificationStorage.create({
        userId: sessionToMove.studentId,
        title: `Session Rescheduled: ${sessionToMove.title}`,
        message: `Your session "${sessionToMove.title}" has been rescheduled to ${newStart.toLocaleDateString()} at ${startStr}.`,
        read: false, type: 'system', link: '/sessions',
      });
      refreshSessions();
    } catch (e: any) {
      notifyError(`Reschedule failed: ${e.message}`);
    }
  };

  const handleAdjustDuration = (session: Session, adjustmentMin: number) => {
    const start = new Date(session.startTime);
    const currentEnd = new Date(session.endTime);
    const newEnd = new Date(currentEnd.getTime() + adjustmentMin * 60 * 1000);
    if (newEnd.getTime() <= start.getTime()) {
      notifyError("Cannot shorten duration below 15 minutes.");
      return;
    }
    const durationMin = Math.round((newEnd.getTime() - start.getTime()) / (60 * 1000));
    try {
      updateSession(session.id, { endTime: newEnd.toISOString(), duration: `${durationMin} min` });
      notifySuccess(`Updated "${session.title}" duration to ${durationMin} minutes.`);
      refreshSessions();
    } catch (e: any) {
      notifyError(`Resize failed: ${e.message}`);
    }
  };

  const handleCancelSession = async (session: Session) => {
    try {
      updateSession(session.id, { status: 'cancelled', attendanceStatus: 'missed' });
      notifySuccess(`Cancelled session "${session.title}".`);
      await notificationStorage.create({
        userId: session.studentId,
        title: `Session Cancelled: ${session.title}`,
        message: `Your mentoring session "${session.title}" scheduled for ${new Date(session.startTime).toLocaleDateString()} has been cancelled.`,
        read: false, type: 'system', link: '/sessions',
      });
      if (selectedSession?.id === session.id) setSelectedSession(null);
      refreshSessions();
    } catch (e: any) {
      notifyError(`Cancel failed: ${e.message}`);
    }
  };

  const handleDeleteSession = async (session: Session) => {
    try {
      deleteSession(session.id);
      notifySuccess(`Deleted session "${session.title}".`);
      await notificationStorage.create({
        userId: session.studentId,
        title: `Session Deleted: ${session.title}`,
        message: `Your mentoring session "${session.title}" has been deleted.`,
        read: false, type: 'system', link: '/sessions',
      });
      if (selectedSession?.id === session.id) setSelectedSession(null);
      refreshSessions();
    } catch (e: any) {
      notifyError(`Deletion failed: ${e.message}`);
    }
  };

  const handleDuplicateSession = (session: Session) => {
    const dateObj = new Date(session.startTime);
    dateObj.setDate(dateObj.getDate() + 7);
    setEditingSession(null);
    setFormTitle(`${session.title} (Copy)`);
    setFormStudentId(session.studentId);
    setFormProgramId(session.programId || '');
    setFormDate(dateObj.toISOString().split('T')[0]);
    const startTimeStr = new Date(session.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    const endTimeStr = new Date(session.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    setFormStartTime(startTimeStr);
    setFormEndTime(endTimeStr);
    setFormDuration(session.duration ? parseInt(session.duration) || 45 : 45);
    setFormTimezone(session.timezone || settings.timezone);
    setFormMeetingType(session.meetingType || 'Google Meet');
    setFormMeetingLink(session.meetingUrl || '');
    setFormNotes(session.notes || '');
    setFormSessionType(session.sessionType || '1:1');
    setFormRecurring(session.recurringSession || false);
    setFormReminderTime(session.reminderTime || '15 minutes before');
    setFormAttachedFiles(session.attachedFiles || '');
    setValidationErrors({});
    setSelectedSession(null);
    setIsModalOpen(true);
  };

  const upcomingSessions = useMemo(() => {
    return sessions
      .filter(s => new Date(s.startTime).getTime() >= Date.now())
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
  }, [sessions]);

  const activeTags = settings.calendarTags || DEFAULT_TAGS;

  return (
    <div className="space-y-8">
      {conflictWarnings.length > 0 && isModalOpen && (
        <div className="p-4 bg-amber-50 border border-amber-100 rounded-3xl flex items-start gap-3 text-amber-800 text-xs animate-pulse">
          <AlertTriangle className="text-amber-500 shrink-0 mt-0.5" size={16} />
          <div>
            <p className="font-bold uppercase tracking-wide text-[10px] text-amber-900">Scheduling Warnings Detected</p>
            <ul className="list-disc pl-4 mt-1 space-y-0.5 font-medium">
              {conflictWarnings.map((w, i) => <li key={i}>{w}</li>)}
            </ul>
          </div>
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-8">
        <div className="flex-1 bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm relative overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 border-b border-slate-100/60 pb-6">
            <div>
              <h3 className="text-2xl font-black uppercase tracking-tighter flex items-center gap-2">
                <CalendarIcon className="text-indigo-600" size={24} />
                Scheduler
              </h3>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Primary Scheduling Interface</p>
            </div>
            <button
              onClick={() => openCreateModal()}
              className="px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all hover:scale-105 shadow-md shadow-indigo-600/10"
            >
              <Plus size={14} />
              Schedule Session
            </button>
          </div>

          <CalendarToolbar
            title={calendar.calendarTitle}
            currentDate={calendar.currentDate}
            currentView={calendar.currentView}
            onPrev={calendar.navigatePrev}
            onNext={calendar.navigateNext}
            onToday={calendar.goToToday}
            onJumpToDate={calendar.jumpToDate}
            onViewChange={calendar.setCurrentView}
          />

          <CalendarTags tags={activeTags} />

          <div className="min-h-[500px]">
            <CalendarGrid
              currentView={calendar.currentView}
              monthCells={calendar.monthCells}
              weekDays={calendar.weekDays}
              hourSlots={calendar.hourSlots}
              currentDate={calendar.currentDate}
              visibleSessions={visibleSessions}
              selectedCalendarDate={selectedCalendarDate}
              getStudentForSession={getStudentForSession}
              getProgramForSession={getProgramForSession}
              onCreateDate={(date) => {
                setSelectedCalendarDate(date.toDateString());
                openCreateModal(date);
              }}
              onSessionClick={openEditModal}
              onDragStart={handleDragStart}
              onDropOnDate={handleDropOnDate}
              onAdjustDuration={handleAdjustDuration}
              onDelete={handleDeleteSession}
              tags={activeTags}
            />
          </div>

          <div className="mt-6 flex justify-end">
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="px-4 py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-1.5 shadow-sm"
            >
              <Settings size={12} />
              Scheduler Settings
            </button>
          </div>
        </div>

        <SessionSidebar
          upcomingSessions={upcomingSessions}
          getStudentForSession={getStudentForSession}
          getProgramForSession={getProgramForSession}
          onSessionClick={(session) => setSelectedSession(session)}
          onCreateClick={() => openCreateModal()}
          settings={settings}
          onSaveSettings={saveSettings}
        />
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 overflow-y-auto">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-[40px] border border-slate-100 shadow-2xl w-full max-w-3xl overflow-hidden my-8"
            >
              <div className="px-8 py-6 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-black uppercase tracking-tighter text-slate-900">
                    {editingSession ? 'Edit Mentoring Session' : 'Schedule Mentoring Session'}
                  </h3>
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Unified 5-Section Premium Scheduler</p>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="p-2.5 bg-white hover:bg-slate-100 rounded-full transition-all border border-slate-100 shadow-sm">
                  <X size={16} />
                </button>
              </div>

              <div className="p-8 max-h-[550px] overflow-y-auto space-y-8">
                <div className="space-y-4">
                  <div className="border-b border-slate-100 pb-2">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-indigo-600">Section 1: Session Details</h4>
                  </div>

                  <div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2 px-1">Session Title (Optional - Auto-generated if blank)</p>
                    <input
                      type="text"
                      placeholder="e.g. Resume Deep-dive or Career Strategy 1:1"
                      value={formTitle || ''}
                      onChange={(e) => setFormTitle(e.target.value)}
                      className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none focus:bg-white focus:border-black transition-all"
                    />
                    <div className="flex flex-wrap gap-1.5 mt-2 px-1">
                      {['Resume Deep-dive', 'Mock Interview', 'Career Strategy', 'Technical Review', 'Goal Alignment'].map(tpl => (
                        <button
                          key={tpl}
                          type="button"
                          onClick={() => setFormTitle(tpl)}
                          className="px-2.5 py-1 text-[8px] font-black uppercase tracking-wider bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg transition-colors border border-slate-200/40"
                        >
                          {tpl}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2 px-1">Student / Mentee *</p>
                      <select
                        value={formStudentId || ''}
                        onChange={(e) => { setFormStudentId(e.target.value); setPreviewStudent(null); }}
                        className={`w-full px-5 py-3.5 bg-slate-50 border ${validationErrors.studentId ? 'border-rose-500' : 'border-slate-100'} rounded-2xl text-xs font-bold outline-none focus:bg-white focus:border-black transition-all`}
                      >
                        <option value="">Select Student</option>
                        {studentProfiles.map(p => (
                          <option key={p.user_id || p.id} value={p.user_id || p.id}>{p.name} ({p.email})</option>
                        ))}
                      </select>
                      {validationErrors.studentId && <p className="text-[10px] text-rose-500 font-bold mt-1 px-1">{validationErrors.studentId}</p>}

                      {formStudentId && (
                        <div className="mt-2 text-[10px] text-slate-500 bg-slate-50 p-3 rounded-2xl border border-slate-100 flex justify-between items-center">
                          <span>Mentee: <strong className="text-slate-800">{studentProfiles.find(p => p.user_id === formStudentId || p.id === formStudentId)?.name}</strong></span>
                          <button
                            type="button"
                            onClick={() => {
                              const s = studentProfiles.find(p => p.user_id === formStudentId || p.id === formStudentId);
                              if (s) setPreviewStudent(previewStudent?.id === s.id ? null : s);
                            }}
                            className="text-indigo-600 font-bold hover:underline uppercase tracking-widest text-[8px]"
                          >
                            {previewStudent ? 'Hide Profile' : 'View Profile'}
                          </button>
                        </div>
                      )}
                    </div>

                    <div>
                      <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2 px-1">Associated Program *</p>
                      <select
                        value={formProgramId || ''}
                        onChange={(e) => { setFormProgramId(e.target.value); setPreviewProgram(null); }}
                        className={`w-full px-5 py-3.5 bg-slate-50 border ${validationErrors.programId ? 'border-rose-500' : 'border-slate-100'} rounded-2xl text-xs font-bold outline-none focus:bg-white focus:border-black transition-all`}
                      >
                        <option value="">Select Program</option>
                        {programs.map(prg => (
                          <option key={prg.id} value={prg.id}>{prg.title}</option>
                        ))}
                      </select>
                      {validationErrors.programId && <p className="text-[10px] text-rose-500 font-bold mt-1 px-1">{validationErrors.programId}</p>}

                      {formProgramId && (
                        <div className="mt-2 text-[10px] text-slate-500 bg-slate-50 p-3 rounded-2xl border border-slate-100 flex justify-between items-center">
                          <span className="truncate max-w-[140px]">Program: <strong className="text-slate-800">{programs.find(p => p.id === formProgramId)?.title}</strong></span>
                          <button
                            type="button"
                            onClick={() => {
                              const p = programs.find(p => p.id === formProgramId);
                              if (p) setPreviewProgram(previewProgram?.id === p.id ? null : p);
                            }}
                            className="text-indigo-600 font-bold hover:underline uppercase tracking-widest text-[8px]"
                          >
                            {previewProgram ? 'Hide details' : 'View Details'}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {previewStudent && (
                    <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="p-4 bg-indigo-50/30 border border-indigo-100 rounded-2xl text-xs space-y-2 col-span-2">
                      <h5 className="font-black text-[9px] text-indigo-900 uppercase tracking-widest mb-1 flex items-center gap-1"><User size={10} /> Student Stats Profile Summary</h5>
                      <p className="font-bold text-slate-800">Email: <span className="font-medium text-slate-600">{previewStudent.email}</span></p>
                      <p className="font-bold text-slate-800">Status: <span className="text-indigo-700 font-mono capitalize">{previewStudent.healthStatus}</span></p>
                      <div className="grid grid-cols-3 gap-2 pt-2 border-t border-indigo-100/40 font-semibold text-slate-600 text-[10px]">
                        <div><span className="block text-slate-400 font-bold text-[8px] uppercase">Attendance</span><span className="text-slate-800 font-mono text-xs">{previewStudent.metrics.attendanceRate}%</span></div>
                        <div><span className="block text-slate-400 font-bold text-[8px] uppercase">Goal Progress</span><span className="text-slate-800 font-mono text-xs">{previewStudent.metrics.goalCompletionRate}%</span></div>
                        <div><span className="block text-slate-400 font-bold text-[8px] uppercase">Activity</span><span className="text-slate-800 font-mono text-xs">{previewStudent.metrics.activityLevel}%</span></div>
                      </div>
                    </motion.div>
                  )}

                  {previewProgram && (
                    <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="p-4 bg-indigo-50/30 border border-indigo-100 rounded-2xl text-xs space-y-1 col-span-2">
                      <h5 className="font-black text-[9px] text-indigo-900 uppercase tracking-widest mb-1 flex items-center gap-1"><BookOpen size={10} /> Program Info Card</h5>
                      <p className="font-bold text-indigo-950 text-xs">{previewProgram.title}</p>
                      <p className="text-slate-600 text-[10px] leading-relaxed">{previewProgram.description}</p>
                    </motion.div>
                  )}

                  <div className="col-span-1 md:col-span-2">
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2 px-1">Session Type Category (Tag) *</p>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { name: '1:1', color: '#10b981' },
                        { name: 'Group', color: '#3b82f6' },
                        { name: 'Workshop', color: '#f59e0b' },
                        { name: 'Review', color: '#ef4444' },
                        { name: 'Cancelled', color: '#64748b' },
                      ].map(tag => {
                        const isSelected = formSessionType === tag.name;
                        const style = getSessionStyle(tag.name, undefined, activeTags);
                        return (
                          <button
                            key={tag.name}
                            type="button"
                            onClick={() => setFormSessionType(tag.name)}
                            className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border flex items-center gap-2 transition-all shadow-sm ${isSelected ? 'ring-2 ring-indigo-500 ring-offset-1 scale-105 opacity-100' : 'opacity-60 hover:opacity-100'}`}
                            style={style.style}
                          >
                            <span className="w-2 h-2 rounded-full shrink-0 shadow-sm" style={{ backgroundColor: style.indicator }}></span>
                            <span>{tag.name}</span>
                            {isSelected && <Check size={10} className="ml-0.5 text-slate-900" />}
                          </button>
                        );
                      })}
                    </div>
                    {validationErrors.sessionType && <p className="text-[10px] text-rose-500 font-bold mt-1 px-1">{validationErrors.sessionType}</p>}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="border-b border-slate-100 pb-2">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-indigo-600">Section 2: Date & Time</h4>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2 px-1">Date *</p>
                      <input type="date" value={formDate || ''} onChange={(e) => setFormDate(e.target.value)}
                        className={`w-full px-5 py-3.5 bg-slate-50 border ${validationErrors.date ? 'border-rose-500' : 'border-slate-100'} rounded-2xl text-xs font-bold outline-none focus:bg-white focus:border-black transition-all`} />
                      {validationErrors.date && <p className="text-[10px] text-rose-500 font-bold mt-1 px-1">{validationErrors.date}</p>}
                    </div>
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2 px-1">Duration Selector</p>
                      <select value={formDuration || 45} onChange={(e) => { const d = Number(e.target.value); setFormDuration(d); if (formStartTime) adjustEndTimeFromDuration(formStartTime, d); }}
                        className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold outline-none focus:bg-white focus:border-black transition-all">
                        <option value="15">15 minutes</option>
                        <option value="30">30 minutes</option>
                        <option value="45">45 minutes</option>
                        <option value="60">1 hour</option>
                        <option value="90">1.5 hours</option>
                        <option value="120">2 hours</option>
                      </select>
                    </div>
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2 px-1">Start Time *</p>
                      <input type="time" value={formStartTime || ''} onChange={(e) => { const v = e.target.value; setFormStartTime(v); if (v) adjustEndTimeFromDuration(v, formDuration || 45); }}
                        className={`w-full px-5 py-3.5 bg-slate-50 border ${validationErrors.startTime ? 'border-rose-500' : 'border-slate-100'} rounded-2xl text-xs font-bold outline-none focus:bg-white focus:border-black transition-all`} />
                      {validationErrors.startTime && <p className="text-[10px] text-rose-500 font-bold mt-1 px-1">{validationErrors.startTime}</p>}
                    </div>
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2 px-1">End Time * (Auto-recalculates duration)</p>
                      <input type="time" value={formEndTime || ''} onChange={(e) => { const v = e.target.value; setFormEndTime(v); if (formStartTime && v) { const sp = formStartTime.split(':').map(Number); const ep = v.split(':').map(Number); if (sp.length === 2 && ep.length === 2) { const sm = sp[0] * 60 + sp[1]; const em = ep[0] * 60 + ep[1]; if (em > sm) setFormDuration(em - sm); } } }}
                        className={`w-full px-5 py-3.5 bg-slate-50 border ${validationErrors.endTime ? 'border-rose-500' : 'border-slate-100'} rounded-2xl text-xs font-bold outline-none focus:bg-white focus:border-black transition-all`} />
                      {validationErrors.endTime && <p className="text-[10px] text-rose-500 font-bold mt-1 px-1">{validationErrors.endTime}</p>}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center bg-slate-50 p-4 rounded-3xl border border-slate-100">
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1 px-1">Timezone Context</p>
                      <select value={formTimezone || ''} onChange={(e) => setFormTimezone(e.target.value)} className="w-full bg-transparent text-xs font-bold outline-none text-slate-700 font-mono">
                        {TIMEZONES.map(tz => <option key={tz} value={tz}>{tz}</option>)}
                      </select>
                    </div>
                    <div className="text-right text-[10px] font-bold text-slate-400">
                      Calculated Duration: <span className="font-mono text-indigo-600 font-black text-xs">{formDuration || 0} minutes</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="border-b border-slate-100 pb-2">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-indigo-600">Section 3: Location / Platform</h4>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2 px-1">Meeting Platform *</p>
                      <select value={formMeetingType || 'Google Meet'} onChange={(e) => { setFormMeetingType(e.target.value as any); }}
                        className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold outline-none focus:bg-white focus:border-black transition-all">
                        <option value="Google Meet">Google Meet</option>
                        <option value="Zoom">Zoom Video</option>
                        <option value="Offline">Offline / In-Person</option>
                      </select>
                    </div>
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2 px-1">Meeting Link / Address</p>
                      <input type="text" placeholder="https://... or physical location" value={formMeetingLink || ''} onChange={(e) => setFormMeetingLink(e.target.value)} className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold outline-none focus:bg-white focus:border-black transition-all" />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="border-b border-slate-100 pb-2">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-indigo-600">Section 4: Reminders & Options</h4>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2 px-1">Reminder Trigger Time</p>
                      <select value={formReminderTime} onChange={(e) => setFormReminderTime(e.target.value)} className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold outline-none focus:bg-white focus:border-black transition-all">
                        <option value="15 minutes before">15 minutes before</option>
                        <option value="1 hour before">1 hour before</option>
                        <option value="24 hours before">24 hours before</option>
                      </select>
                    </div>
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2 px-1">Attached Resources (Filenames/URLs)</p>
                      <input type="text" placeholder="e.g. brief.pdf, instructions.docx" value={formAttachedFiles || ''} onChange={(e) => setFormAttachedFiles(e.target.value)} className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold outline-none focus:bg-white focus:border-black transition-all" />
                    </div>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-2xl flex items-center justify-between border border-slate-100">
                    <div className="flex items-center gap-2">
                      <CalendarIcon className="text-slate-400" size={15} />
                      <span className="text-[9px] font-black uppercase tracking-widest text-slate-700">Recurring Series</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" checked={formRecurring} onChange={(e) => setFormRecurring(e.target.checked)} className="sr-only peer" />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                    </label>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="border-b border-slate-100 pb-2">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-indigo-600">Section 5: Agenda & Notes</h4>
                  </div>
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2 px-1">Session Agenda & Description (Public to Student)</p>
                    <textarea placeholder="Specify session agenda, preparations or links student needs to check beforehand..." value={formNotes || ''} onChange={(e) => setFormNotes(e.target.value)} className="w-full h-24 px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold outline-none focus:bg-white focus:border-black transition-all resize-none font-sans" />
                  </div>
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2 px-1 text-amber-600">Internal Notes (Private - strictly for mentor eyes only)</p>
                    <textarea placeholder="Add private mentor notes, preparation metrics, internal student assessment history..." value={formInternalNotes || ''} onChange={(e) => setFormInternalNotes(e.target.value)} className="w-full h-24 px-5 py-3.5 bg-amber-50/20 border border-amber-100/50 rounded-2xl text-xs font-bold outline-none focus:bg-white focus:border-amber-400 transition-all resize-none text-slate-700 font-sans" />
                  </div>
                </div>

                {validationErrors.overlap && (
                  <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-3xl text-xs font-bold">
                    {validationErrors.overlap}
                  </div>
                )}
              </div>

              <div className="px-8 py-6 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between">
                {editingSession ? (
                  <div className="flex items-center gap-1.5 self-start">
                    <button type="button" onClick={() => handleDuplicateSession(editingSession)} className="p-2.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 rounded-xl transition-all flex items-center gap-1 text-[9px] font-black uppercase tracking-widest shadow-sm" title="Duplicate Session"><Copy size={11} /> Clone</button>
                    {editingSession.status !== 'cancelled' && (
                        <button type="button" onClick={() => { setConfirmCancel(editingSession); }} className="px-3 py-2.5 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-700 rounded-xl transition-all text-[9px] font-black uppercase tracking-widest">Cancel</button>
                      )}
                      <button type="button" onClick={() => { setConfirmDelete(editingSession); }} className="p-2.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 rounded-xl transition-all" title="Delete Forever"><Trash2 size={12} /></button>
                  </div>
                ) : <div />}

                <div className="flex items-center gap-3 justify-end">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-3.5 bg-white border border-slate-200 hover:bg-slate-100 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all">Cancel</button>
                  <button type="button" onClick={handleSaveSession} className="px-6 py-3.5 bg-black hover:bg-indigo-600 text-white rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-2 shadow-md shadow-black/10">
                    <Check size={14} />
                    {editingSession ? 'Update Session' : 'Schedule Session'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <SessionDetailsModal
        session={selectedSession}
        onClose={() => { setSelectedSession(null); setPreviewStudent(null); setPreviewProgram(null); }}
        onEdit={(session) => { openEditModal(session); setSelectedSession(null); }}
        onDuplicate={handleDuplicateSession}
        onCancel={(session) => setConfirmCancel(session)}
        onDelete={(session) => setConfirmDelete(session)}
        getStudentForSession={getStudentForSession}
        getProgramForSession={getProgramForSession}
        tags={activeTags}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSave={saveSettings}
        timezones={TIMEZONES}
      />

      <ConfirmDialog
        open={!!confirmCancel}
        title="Cancel Session"
        message={`Are you sure you want to cancel the session "${confirmCancel?.title}"? The student will be notified.`}
        confirmLabel="Cancel Session"
        variant="danger"
        onConfirm={() => {
          if (confirmCancel) handleCancelSession(confirmCancel);
          setConfirmCancel(null);
        }}
        onCancel={() => setConfirmCancel(null)}
      />

      <ConfirmDialog
        open={!!confirmDelete}
        title="Delete Session Forever"
        message={`Are you sure you want to delete "${confirmDelete?.title}"? This cannot be undone.`}
        confirmLabel="Delete Forever"
        variant="danger"
        onConfirm={() => {
          if (confirmDelete) handleDeleteSession(confirmDelete);
          setConfirmDelete(null);
        }}
        onCancel={() => setConfirmDelete(null)}
      />

      <ConfirmDialog
        open={!!confirmForceOverlap}
        title="Scheduling Conflict Detected"
        message={
          confirmForceOverlap
            ? `Warnings:\n\n${confirmForceOverlap.warnings.join('\n')}\n\nDo you still want to reschedule this session?`
            : ''
        }
        confirmLabel="Force Reschedule"
        variant="default"
        onConfirm={() => {
          if (!confirmForceOverlap) return;
          const sessionToMove = confirmForceOverlap.session;
          const currentStart = new Date(sessionToMove.startTime);
          const currentEnd = new Date(sessionToMove.endTime);
          const durationMs = currentEnd.getTime() - currentStart.getTime();
          const newStart = new Date(currentStart);
          const newEnd = new Date(newStart.getTime() + durationMs);
          updateSession(sessionToMove.id, { startTime: newStart.toISOString(), endTime: newEnd.toISOString() });
          notifySuccess(`Rescheduled "${sessionToMove.title}"`);
          notificationStorage.create({
            userId: sessionToMove.studentId,
            title: `Session Rescheduled: ${sessionToMove.title}`,
            message: `Your session "${sessionToMove.title}" has been rescheduled.`,
            read: false, type: 'system', link: '/sessions',
          });
          refreshSessions();
          setConfirmForceOverlap(null);
        }}
        onCancel={() => setConfirmForceOverlap(null)}
      />
    </div>
  );
};
