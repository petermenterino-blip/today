import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X, Mail, Phone, Building2, GraduationCap, Calendar, Clock, Globe,
  MessageSquare, UserCheck, CheckCircle, XCircle, Archive, Copy,
  UserPlus, Tag, BookOpen, ChevronDown, Loader2, AlertTriangle, Plus,
  Ban, Edit3, ArrowRight, User as UserIcon,
  Bell, Star, ClipboardList
} from 'lucide-react';
import { useVisitorBookings } from '../../../hooks/useVisitorBookings';
import { useAuth } from '../../../context/AuthContext';
import { notifySuccess, notifyError } from '../../../utils/toast';
import type { VisitorBooking, BookingNote, BookingTimelineEntry } from '../../../services/visitorBookingService';

const STATUS_STYLES: Record<string, string> = {
  new: 'bg-blue-100 text-blue-700 border-blue-200',
  contacted: 'bg-purple-100 text-purple-700 border-purple-200',
  awaiting_confirmation: 'bg-amber-100 text-amber-700 border-amber-200',
  scheduled: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  completed: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  cancelled: 'bg-rose-100 text-rose-700 border-rose-200',
  rejected: 'bg-red-100 text-red-700 border-red-200',
  no_response: 'bg-slate-100 text-slate-600 border-slate-200',
};

const PRIORITY_STYLES: Record<string, string> = {
  low: 'bg-slate-100 text-slate-600',
  medium: 'bg-amber-100 text-amber-700',
  high: 'bg-rose-100 text-rose-700',
};

const CALL_TYPE_STYLES: Record<string, string> = {
  intro: 'bg-indigo-100 text-indigo-700',
  rapid: 'bg-slate-900 text-white',
};

const TIMELINE_CONFIG: Record<string, { icon: any; color: string }> = {
  booking_created: { icon: Calendar, color: 'bg-indigo-500' },
  email_sent: { icon: Mail, color: 'bg-blue-500' },
  session_scheduled: { icon: Clock, color: 'bg-emerald-500' },
  reminder_sent: { icon: Bell, color: 'bg-amber-500' },
  booking_updated: { icon: Edit3, color: 'bg-purple-500' },
  status_changed: { icon: ArrowRight, color: 'bg-amber-500' },
  converted_to_student: { icon: GraduationCap, color: 'bg-emerald-500' },
  session_completed: { icon: CheckCircle, color: 'bg-green-500' },
  note_added: { icon: MessageSquare, color: 'bg-slate-500' },
  mentor_assigned: { icon: UserCheck, color: 'bg-indigo-500' },
};

const HARDCODED_MENTORS = [
  { id: 'mentor-sarah', name: 'Dr. Sarah Chen' },
  { id: 'mentor-james', name: 'Prof. James Wilson' },
  { id: 'mentor-maria', name: 'Maria Rodriguez' },
  { id: 'mentor-david', name: 'David Kim' },
  { id: 'mentor-aisha', name: 'Aisha Patel' },
  { id: 'mentor-marcus', name: 'Marcus Johnson' },
  { id: 'mentor-elena', name: 'Elena Torres' },
  { id: 'mentor-kenji', name: 'Kenji Nakamura' },
];

interface BookingDetailDrawerProps {
  bookingId: string | null;
  onClose: () => void;
  onUpdate: () => void;
}

function formatRelativeTime(dateStr: string): string {
  const now = Date.now();
  const date = new Date(dateStr).getTime();
  const diff = now - date;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);

  if (seconds < 60) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  if (weeks < 4) return `${weeks}w ago`;
  return new Date(dateStr).toLocaleDateString();
}

const BookingDetailDrawer: React.FC<BookingDetailDrawerProps> = ({ bookingId, onClose, onUpdate }) => {
  const { user } = useAuth();
  const {
    getBooking, updateBooking, assignMentor, addNote,
    getNotes, getTimeline, convertToStudent,
  } = useVisitorBookings();

  const [booking, setBooking] = useState<VisitorBooking | null>(null);
  const [notes, setNotes] = useState<BookingNote[]>([]);
  const [timeline, setTimeline] = useState<BookingTimelineEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [noteText, setNoteText] = useState('');
  const [addingNote, setAddingNote] = useState(false);
  const [selectedMentorId, setSelectedMentorId] = useState('');
  const [assigningMentor, setAssigningMentor] = useState(false);
  const [converting, setConverting] = useState(false);

  const hasBeenConverted = timeline.some(e => e.action === 'converted_to_student');

  useEffect(() => {
    if (!bookingId) {
      setBooking(null);
      setNotes([]);
      setTimeline([]);
      setError(null);
      return;
    }
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [bookingRes, notesRes, timelineRes] = await Promise.all([
          getBooking(bookingId),
          getNotes(bookingId),
          getTimeline(bookingId),
        ]);
        if (bookingRes.data) {
          setBooking(bookingRes.data);
          setSelectedMentorId(bookingRes.data.assignedMentorId || '');
        }
        if (bookingRes.error) setError(bookingRes.error);
        if (notesRes.data) setNotes(notesRes.data);
        if (timelineRes.data) setTimeline(timelineRes.data);
      } catch (err: any) {
        setError(err?.message || 'Failed to load booking details');
      }
      setLoading(false);
    };
    fetchData();
  }, [bookingId, getBooking, getNotes, getTimeline]);

  const handleStatusUpdate = async (status: VisitorBooking['status']) => {
    if (!bookingId || !booking) return;
    const res = await updateBooking(bookingId, { status });
    if (res.data) {
      setBooking(res.data);
      notifySuccess(`Status updated to ${status.replace(/_/g, ' ')}`);
      onUpdate();
    } else if (res.error) {
      notifyError(res.error);
    }
  };

  const handleAssignMentor = async () => {
    if (!bookingId || !selectedMentorId) return;
    setAssigningMentor(true);
    const mentor = HARDCODED_MENTORS.find(m => m.id === selectedMentorId);
    const res = await assignMentor({ bookingId, mentorId: selectedMentorId, mentorName: mentor?.name || selectedMentorId });
    if (res.data) {
      const nameUpdate = await updateBooking(bookingId, { assignedMentorName: mentor?.name || selectedMentorId });
      if (nameUpdate.data) setBooking(nameUpdate.data);
      setBooking(prev => prev ? { ...prev, assignedMentorId: selectedMentorId, assignedMentorName: mentor?.name } : prev);
      notifySuccess(`Mentor ${mentor?.name || ''} assigned`);
      onUpdate();
    } else if (res.error) {
      notifyError(res.error);
    }
    setAssigningMentor(false);
  };

  const handleAddNote = async () => {
    if (!bookingId || !noteText.trim()) return;
    setAddingNote(true);
    const res = await addNote({ bookingId, note: user?.id || '', createdBy: noteText.trim() });
    if (res.data) {
      setNotes(prev => [res.data!, ...prev]);
      setNoteText('');
      notifySuccess('Note added');
    } else if (res.error) {
      notifyError(res.error);
    }
    setAddingNote(false);
  };

  const handleConvertToStudent = async () => {
    if (!bookingId) return;
    setConverting(true);
    const res = await convertToStudent(bookingId);
    if (res.data) {
      setBooking(res.data);
      setNotes(prev => [...prev]);
      notifySuccess('Visitor converted to student');
      onUpdate();
    } else if (res.error) {
      notifyError(res.error);
    }
    setConverting(false);
  };

  const handleCopyContact = () => {
    if (!booking) return;
    const text = [booking.visitorEmail, booking.visitorPhone, booking.company].filter(Boolean).join(', ');
    navigator.clipboard.writeText(text);
    notifySuccess('Contact info copied');
  };

  const handleSendEmail = () => {
    if (!booking) return;
    window.location.href = `mailto:${booking.visitorEmail}?subject=Regarding%20your%20booking%20inquiry`;
  };

  const handleScheduleSession = () => {
    notifySuccess('Opening session scheduler...');
    window.open('/mentor/scheduler', '_blank');
  };

  const getTimelineEntry = (entry: BookingTimelineEntry) => {
    const config = TIMELINE_CONFIG[entry.action] || { icon: Bell, color: 'bg-slate-400' };
    const Icon = config.icon;
    return (
      <div key={entry.id} className="flex items-start gap-3">
        <div className={`w-7 h-7 rounded-full ${config.color} bg-opacity-20 flex items-center justify-center shrink-0 mt-0.5`}>
          <Icon size={12} className="text-white" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold text-slate-700 capitalize">{entry.description || entry.action.replace(/_/g, ' ')}</p>
          <p className="text-[10px] font-medium text-slate-400 mt-0.5">
            {entry.createdBy && <span className="text-slate-500">{entry.createdBy} &middot; </span>}
            {formatRelativeTime(entry.createdAt)}
          </p>
        </div>
      </div>
    );
  };

  if (!bookingId) return null;

  return (
    <AnimatePresence>
      <motion.div
        key="drawer-wrapper"
        className="fixed inset-0 z-[100]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
      >
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
        <motion.div
          className="absolute top-0 right-0 h-full w-full max-w-2xl bg-white shadow-2xl overflow-y-auto"
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          onClick={e => e.stopPropagation()}
        >
          {/* CLOSE BUTTON */}
          <button
            onClick={onClose}
            className="absolute top-5 right-5 z-10 p-2.5 bg-white hover:bg-slate-50 rounded-full transition-all border border-slate-200 shadow-sm"
          >
            <X size={16} />
          </button>

          {loading && (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
              <Loader2 className="animate-spin text-indigo-600" size={36} />
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Loading Booking...</p>
            </div>
          )}

          {error && !loading && (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 px-8">
              <AlertTriangle size={40} className="text-rose-500" />
              <p className="text-sm font-bold text-slate-700">{error}</p>
              <button onClick={onClose} className="px-6 py-3 bg-black text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all">
                Close
              </button>
            </div>
          )}

          {!loading && !error && booking && (
            <div className="pb-12">
              {/* HEADER SECTION */}
              <div className="p-8 pb-6 border-b border-slate-100">
                <div className="flex items-start gap-5">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-black text-xl shrink-0 shadow-lg shadow-indigo-500/20">
                    {booking.visitorName?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-xl font-black uppercase tracking-tighter text-slate-900 truncate">
                      {booking.visitorName}
                    </h2>
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${STATUS_STYLES[booking.status] || 'bg-slate-100 text-slate-600'}`}>
                        {booking.status?.replace(/_/g, ' ')}
                      </span>
                      {booking.priority && (
                        <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border border-transparent ${PRIORITY_STYLES[booking.priority]}`}>
                          <Star size={10} className="inline mr-1" />
                          {booking.priority} priority
                        </span>
                      )}
                      <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border border-transparent ${CALL_TYPE_STYLES[booking.callType] || 'bg-slate-100 text-slate-600'}`}>
                        {booking.callType === 'rapid' ? 'Rapid Response' : 'Intro Call'}
                      </span>
                      {booking.sourcePage && (
                        <span className="px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest bg-slate-100 text-slate-600 border border-slate-200">
                          {booking.sourcePage}
                        </span>
                      )}
                    </div>
                    {booking.createdAt && (
                      <p className="text-[11px] font-medium text-slate-400 mt-2">
                        Created {formatRelativeTime(booking.createdAt)}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-8 space-y-8">
                {/* CONTACT INFORMATION CARD */}
                <div className="bg-white rounded-[32px] border border-slate-100 p-6 shadow-sm">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-900 mb-4 flex items-center gap-2">
                    <UserIcon size={14} className="text-indigo-500" /> Contact Information
                  </h3>
                  <div className="space-y-3">
                    <a href={`mailto:${booking.visitorEmail}`} className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl hover:bg-indigo-50 transition-all group">
                      <Mail size={14} className="text-slate-400 group-hover:text-indigo-500 transition-all" />
                      <span className="text-sm font-bold text-slate-700 group-hover:text-indigo-600 transition-all">{booking.visitorEmail}</span>
                    </a>
                    {booking.visitorPhone && (
                      <a href={`tel:${booking.visitorPhone}`} className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl hover:bg-indigo-50 transition-all group">
                        <Phone size={14} className="text-slate-400 group-hover:text-indigo-500 transition-all" />
                        <span className="text-sm font-bold text-slate-700 group-hover:text-indigo-600 transition-all">{booking.visitorPhone}</span>
                      </a>
                    )}
                    {booking.company && (
                      <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl">
                        <Building2 size={14} className="text-slate-400" />
                        <span className="text-sm font-bold text-slate-700">{booking.company}</span>
                      </div>
                    )}
                    {booking.studentProfessional && (
                      <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl">
                        <GraduationCap size={14} className="text-slate-400" />
                        <span className="text-sm font-bold text-slate-700">{booking.studentProfessional}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* REQUEST DETAILS CARD */}
                <div className="bg-white rounded-[32px] border border-slate-100 p-6 shadow-sm">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-900 mb-4 flex items-center gap-2">
                    <ClipboardList size={14} className="text-indigo-500" /> Request Details
                  </h3>
                  <div className="space-y-4">
                    {booking.programOfInterest && (
                      <div className="flex items-start gap-3">
                        <BookOpen size={14} className="text-indigo-500 mt-0.5 shrink-0" />
                        <div>
                          <p className="text-[8px] font-black uppercase tracking-widest text-slate-400">Program of Interest</p>
                          <span className="inline-block mt-1 px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-[10px] font-bold">{booking.programOfInterest}</span>
                        </div>
                      </div>
                    )}
                    {booking.preferredMentor && (
                      <div className="flex items-start gap-3">
                        <UserCheck size={14} className="text-indigo-500 mt-0.5 shrink-0" />
                        <div>
                          <p className="text-[8px] font-black uppercase tracking-widest text-slate-400">Preferred Mentor</p>
                          <p className="text-xs font-bold text-slate-700 mt-1">{booking.preferredMentor}</p>
                        </div>
                      </div>
                    )}
                    <div className="flex items-start gap-3">
                      <Tag size={14} className="text-indigo-500 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-[8px] font-black uppercase tracking-widest text-slate-400">Meeting Type</p>
                        <p className="text-xs font-bold text-slate-700 mt-1 capitalize">{booking.meetingType?.replace(/_/g, ' ') || 'Not specified'}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-start gap-3">
                        <Calendar size={14} className="text-indigo-500 mt-0.5 shrink-0" />
                        <div>
                          <p className="text-[8px] font-black uppercase tracking-widest text-slate-400">Preferred Date</p>
                          <p className="text-xs font-bold text-slate-700 mt-1">{booking.date || 'Not specified'}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <Clock size={14} className="text-indigo-500 mt-0.5 shrink-0" />
                        <div>
                          <p className="text-[8px] font-black uppercase tracking-widest text-slate-400">Preferred Time</p>
                          <p className="text-xs font-bold text-slate-700 mt-1">{booking.time || 'Not specified'}</p>
                        </div>
                      </div>
                    </div>
                    {booking.timezone && (
                      <div className="flex items-start gap-3">
                        <Globe size={14} className="text-indigo-500 mt-0.5 shrink-0" />
                        <div>
                          <p className="text-[8px] font-black uppercase tracking-widest text-slate-400">Time Zone</p>
                          <p className="text-xs font-bold text-slate-700 mt-1">{booking.timezone}</p>
                        </div>
                      </div>
                    )}
                    {(booking.message || booking.notes) && (
                      <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100">
                        <p className="text-[8px] font-black uppercase tracking-widest text-amber-700 mb-2">Message from Visitor</p>
                        <p className="text-sm text-amber-900 font-medium">{booking.message || booking.notes}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* ASSIGN MENTOR SECTION */}
                <div className="bg-white rounded-[32px] border border-slate-100 p-6 shadow-sm">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-900 mb-4 flex items-center gap-2">
                    <UserPlus size={14} className="text-indigo-500" /> Assign Mentor
                  </h3>
                  {booking.assignedMentorName && (
                    <div className="mb-4 p-3 bg-indigo-50 rounded-2xl border border-indigo-100 flex items-center gap-3">
                      <UserCheck size={16} className="text-indigo-600 shrink-0" />
                      <div>
                        <p className="text-[9px] font-black uppercase tracking-widest text-indigo-400">Currently Assigned</p>
                        <p className="text-sm font-bold text-indigo-700">{booking.assignedMentorName}</p>
                      </div>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <select
                        value={selectedMentorId}
                        onChange={e => setSelectedMentorId(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 outline-none focus:border-black transition-all appearance-none cursor-pointer"
                      >
                        <option value="">Select a mentor...</option>
                        {HARDCODED_MENTORS.map(m => (
                          <option key={m.id} value={m.id}>{m.name}</option>
                        ))}
                      </select>
                      <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    </div>
                    <button
                      onClick={handleAssignMentor}
                      disabled={!selectedMentorId || assigningMentor}
                      className="px-5 py-3 bg-black text-white rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all disabled:opacity-50 flex items-center gap-1.5 shrink-0"
                    >
                      {assigningMentor ? <Loader2 size={12} className="animate-spin" /> : <UserCheck size={12} />}
                      Save
                    </button>
                  </div>
                </div>

                {/* QUICK ACTIONS BAR */}
                <div className="bg-white rounded-[32px] border border-slate-100 p-6 shadow-sm">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-900 mb-4">Quick Actions</h3>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => handleStatusUpdate('awaiting_confirmation')}
                      className="px-4 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-1.5"
                    >
                      <CheckCircle size={12} /> Approve
                    </button>
                    <button
                      onClick={() => handleStatusUpdate('rejected')}
                      className="px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-1.5"
                    >
                      <XCircle size={12} /> Reject
                    </button>
                    <button
                      onClick={handleScheduleSession}
                      className="px-4 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-1.5"
                    >
                      <Calendar size={12} /> Schedule Session
                    </button>
                    <button
                      onClick={() => document.getElementById('assign-mentor-section')?.scrollIntoView({ behavior: 'smooth' })}
                      className="px-4 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-1.5"
                    >
                      <UserPlus size={12} /> Assign Mentor
                    </button>
                    <button
                      onClick={handleSendEmail}
                      className="px-4 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-1.5"
                    >
                      <Mail size={12} /> Send Email
                    </button>
                    <button
                      onClick={handleCopyContact}
                      className="px-4 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-1.5"
                    >
                      <Copy size={12} /> Copy Contact
                    </button>
                    <button
                      onClick={() => handleStatusUpdate('cancelled')}
                      className="px-4 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-1.5"
                    >
                      <Archive size={12} /> Archive
                    </button>
                    {!hasBeenConverted && (
                      <button
                        onClick={handleConvertToStudent}
                        disabled={converting}
                        className="px-4 py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-1.5 disabled:opacity-50"
                      >
                        {converting ? <Loader2 size={12} className="animate-spin" /> : <GraduationCap size={12} />}
                        Convert to Student
                      </button>
                    )}
                  </div>
                </div>

                {/* STATUS WORKFLOW BUTTONS */}
                <div className="bg-white rounded-[32px] border border-slate-100 p-6 shadow-sm">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-900 mb-4">Update Status</h3>
                  <div className="flex flex-wrap gap-2">
                    {(['contacted', 'awaiting_confirmation', 'scheduled', 'completed', 'cancelled', 'no_response'] as const).map(status => {
                      const isActive = booking.status === status;
                      const colorMap: Record<string, string> = {
                        contacted: 'bg-purple-50 hover:bg-purple-100 text-purple-700',
                        awaiting_confirmation: 'bg-amber-50 hover:bg-amber-100 text-amber-700',
                        scheduled: 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700',
                        completed: 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700',
                        cancelled: 'bg-rose-50 hover:bg-rose-100 text-rose-700',
                        no_response: 'bg-slate-50 hover:bg-slate-100 text-slate-600',
                      };
                      return (
                        <button
                          key={status}
                          onClick={() => handleStatusUpdate(status)}
                          className={`px-4 py-2 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-1.5 ${
                            isActive ? 'ring-2 ring-offset-1 ring-black' : ''
                          } ${colorMap[status]}`}
                        >
                          {status === 'contacted' && <Bell size={12} />}
                          {status === 'awaiting_confirmation' && <Clock size={12} />}
                          {status === 'scheduled' && <Calendar size={12} />}
                          {status === 'completed' && <CheckCircle size={12} />}
                          {status === 'cancelled' && <Ban size={12} />}
                          {status === 'no_response' && <XCircle size={12} />}
                          {status === 'awaiting_confirmation' ? 'Awaiting Confirmation' : status === 'no_response' ? 'No Response' : status.charAt(0).toUpperCase() + status.slice(1)}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* INTERNAL NOTES SECTION */}
                <div className="bg-white rounded-[32px] border border-slate-100 p-6 shadow-sm" id="internal-notes">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-900 mb-4 flex items-center gap-2">
                    <MessageSquare size={14} className="text-indigo-500" /> Internal Notes
                  </h3>
                  <div className="flex gap-2 mb-5">
                    <input
                      type="text"
                      placeholder="Add a note..."
                      value={noteText}
                      onChange={e => setNoteText(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter' && noteText.trim()) handleAddNote(); }}
                      className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium outline-none focus:border-black transition-all"
                    />
                    <button
                      onClick={handleAddNote}
                      disabled={!noteText.trim() || addingNote}
                      className="px-5 py-3 bg-black text-white rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all disabled:opacity-50 flex items-center gap-1.5"
                    >
                      {addingNote ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
                      Add Note
                    </button>
                  </div>
                  <div className="space-y-3 max-h-[300px] overflow-y-auto">
                    {notes.length === 0 && (
                      <p className="text-center py-6 text-[10px] font-bold text-slate-300 uppercase tracking-widest">No notes yet</p>
                    )}
                    {notes.map(note => (
                      <div key={note.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">
                            {note.mentorId || 'System'}
                          </span>
                          <span className="text-[9px] font-medium text-slate-400">{formatRelativeTime(note.createdAt)}</span>
                        </div>
                        <p className="text-sm font-medium text-slate-700">{note.content}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* COMMUNICATION TIMELINE */}
                <div className="bg-white rounded-[32px] border border-slate-100 p-6 shadow-sm">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-900 mb-4 flex items-center gap-2">
                    <Clock size={14} className="text-indigo-500" /> Communication Timeline
                  </h3>
                  <div className="space-y-4 max-h-[400px] overflow-y-auto">
                    {timeline.length === 0 && (
                      <p className="text-center py-6 text-[10px] font-bold text-slate-300 uppercase tracking-widest">No timeline events</p>
                    )}
                    {timeline.map(getTimelineEntry)}
                  </div>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default BookingDetailDrawer;
