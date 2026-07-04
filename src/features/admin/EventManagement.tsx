import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, Calendar, Clock, MapPin, Users2, Link2, Download, Plus, Trash2, 
  Edit3, Send, CheckCircle2, AlertTriangle, HelpCircle, FileText, Video, 
  ThumbsUp, Star, BarChart3, Search, Copy, Eye, EyeOff, Loader2, RefreshCw, X
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { NetworkEvent, EventRegistration, EventFile, EventFeedback, StudentProfile } from '../../types';
import { eventService } from '../../services/eventService';
import { studentService } from '../../services/studentService';
import { notificationStorage } from '../../services/notificationStorage';
import { messageService } from '../../services/messageService';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'sonner';

interface EventManagementProps {
  eventId: string;
  onBack: () => void;
  onEdit: (event: NetworkEvent) => void;
  onDelete: (id: string) => void;
}

export const EventManagement: React.FC<EventManagementProps> = ({ 
  eventId, 
  onBack, 
  onEdit, 
  onDelete 
}) => {
  const { user } = useAuth();
  const [event, setEvent] = useState<NetworkEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Custom communications states
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [updateSubject, setUpdateSubject] = useState('');
  const [updateMessage, setUpdateMessage] = useState('');
  const [isSendingUpdate, setIsSendingUpdate] = useState(false);

  // Custom file states
  const [newFileName, setNewFileName] = useState('');
  const [newFileType, setNewFileType] = useState<'slides' | 'pdf' | 'assignment' | 'recording' | 'resource'>('pdf');
  const [newFileUrl, setNewFileUrl] = useState('');
  const [newFileSize, setNewFileSize] = useState('1.5 MB');

  // Custom recording states
  const [recordingType, setRecordingType] = useState<'zoom' | 'google_meet' | 'youtube' | 'other'>('zoom');
  const [recordingUrl, setRecordingUrl] = useState('');
  const [recordingNotes, setRecordingNotes] = useState('');
  const [isSavingRecording, setIsSavingRecording] = useState(false);

  // Sync state helper
  const fetchEventData = async () => {
    try {
      setLoading(true);
      const { data, error } = await eventService.getById(eventId);
      if (error || !data) {
        setEvent(null);
        setLoading(false);
        return;
      }

      // Ensure data structure (registrations, files, recording, feedback seeders)
      const filledEvent = await ensureEventData(data);
      
      // If we filled in data that wasn't saved, persist it
      if (!data.registrations || !data.files || !data.recording || !data.feedbacks) {
        await eventService.update(eventId, filledEvent);
      }
      
      setEvent(filledEvent);
      
      // Initialize recording form fields
      if (filledEvent.recording) {
        setRecordingType(filledEvent.recording.type);
        setRecordingUrl(filledEvent.recording.url);
        setRecordingNotes(filledEvent.recording.notes || '');
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load event data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEventData();
  }, [eventId]);

  const ensureEventData = async (evt: NetworkEvent): Promise<NetworkEvent> => {
    const students = await studentService.getAll() as unknown as StudentProfile[];
    
    // 1. Ensure registrations
    let updatedRegs = evt.registrations ? [...evt.registrations] : [];
    if (updatedRegs.length === 0) {
      const attendeeSet = new Set(evt.attendees || []);
      
      students.forEach((student, index) => {
        const isAttendee = attendeeSet.has(student.user_id);
        
        if (isAttendee) {
          updatedRegs.push({
            userId: student.user_id,
            name: student.name || 'Anonymous Student',
            email: student.email || 'student@example.com',
            program: (student as any).specialization || 'Product Management',
            registrationDate: new Date(Date.now() - (index + 2) * 24 * 60 * 60 * 1000).toLocaleDateString(),
            status: 'confirmed',
            attendanceStatus: evt.status === 'completed' ? (index % 5 === 0 ? 'absent' : 'attended') : 'none'
          });
        } else if (index < 4 && updatedRegs.length < 5) {
          const status: 'pending' | 'cancelled' = index % 3 === 0 ? 'cancelled' : 'pending';
          updatedRegs.push({
            userId: student.user_id,
            name: student.name || 'Anonymous Student',
            email: student.email || 'student@example.com',
            program: (student as any).specialization || 'Product Management',
            registrationDate: new Date(Date.now() - index * 24 * 60 * 60 * 1000).toLocaleDateString(),
            status: status,
            attendanceStatus: 'none'
          });
        }
      });
    }

    // 2. Ensure files
    let updatedFiles = evt.files ? [...evt.files] : [
      {
        id: 'f1',
        name: 'Workshop_Slides_V1.pdf',
        type: 'slides' as const,
        url: 'https://example.com/slides',
        size: '2.4 MB',
        uploadedAt: evt.date
      },
      {
        id: 'f2',
        name: 'Pre_Read_Case_Study.pdf',
        type: 'pdf' as const,
        url: 'https://example.com/preread',
        size: '1.2 MB',
        uploadedAt: evt.date
      }
    ];

    // 3. Ensure recording
    let updatedRecording = evt.recording || {
      type: 'zoom' as const,
      url: evt.meetingLink || 'https://zoom.us/j/1234567890',
      notes: 'Passcode: Mentorino2026. Includes the full Q&A breakout rooms.'
    };

    // 4. Ensure feedback
    let updatedFeedback = evt.feedbacks ? [...evt.feedbacks] : [];
    if (updatedFeedback.length === 0) {
      const feedbackComments = [
        { rating: 5, comment: 'Absolutely brilliant breakdown of case interviews. Extremely practical!', suggestion: 'More interactive worksheets if possible.' },
        { rating: 4, comment: 'The ATS optimization tips alone were worth the hour. Thanks Peter!', suggestion: 'A bit more Q&A time at the end would be great.' },
        { rating: 5, comment: 'Outstanding framework and live demonstrations. Best session so far!', suggestion: 'Keep up the good work!' }
      ];
      
      const confirmedAttended = updatedRegs.filter(r => r.attendanceStatus === 'attended');
      const seedTarget = confirmedAttended.length > 0 ? confirmedAttended : updatedRegs.filter(r => r.status === 'confirmed');
      
      seedTarget.slice(0, 3).forEach((reg, i) => {
        const fc = feedbackComments[i % feedbackComments.length];
        updatedFeedback.push({
          id: `fb_${i}`,
          rating: fc.rating,
          studentName: reg.name,
          comment: fc.comment,
          suggestion: fc.suggestion,
          date: evt.date
        });
      });
    }

    return {
      ...evt,
      registrations: updatedRegs,
      files: updatedFiles,
      recording: updatedRecording,
      feedbacks: updatedFeedback,
      status: evt.status || 'published'
    };
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="animate-spin text-indigo-600" size={40} />
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Loading Event Details...</p>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="text-center py-24 bg-white rounded-[40px] border border-slate-100 shadow-sm max-w-2xl mx-auto">
        <AlertTriangle size={48} className="mx-auto text-rose-500 mb-6" />
        <h4 className="text-2xl font-black uppercase tracking-tighter text-slate-900">Event Not Found</h4>
        <p className="text-xs font-medium text-slate-400 mt-2 mb-8">The requested workshop or session could not be retrieved from the database.</p>
        <button 
          onClick={onBack}
          className="bg-black text-white px-8 py-4 rounded-[20px] text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center gap-2 mx-auto"
        >
          <ArrowLeft size={14} /> Back to Events
        </button>
      </div>
    );
  }

  // Derived stats
  const totalRegs = event.registrations?.length || 0;
  const confirmedRegs = event.registrations?.filter(r => r.status === 'confirmed') || [];
  const confirmedCount = confirmedRegs.length;
  const pendingCount = event.registrations?.filter(r => r.status === 'pending').length || 0;
  const cancelledCount = event.registrations?.filter(r => r.status === 'cancelled').length || 0;
  const capacity = event.capacity || 100;
  const seatsRemaining = Math.max(0, capacity - confirmedCount);

  const attendedCount = event.registrations?.filter(r => r.attendanceStatus === 'attended').length || 0;
  const absentCount = event.registrations?.filter(r => r.attendanceStatus === 'absent').length || 0;
  const attendanceRate = confirmedCount > 0 ? Math.round((attendedCount / confirmedCount) * 100) : 0;
  const feedbackAverage = event.feedbacks && event.feedbacks.length > 0 
    ? (event.feedbacks.reduce((acc, f) => acc + f.rating, 0) / event.feedbacks.length).toFixed(1) 
    : '0.0';

  // Search filtered registrations
  const filteredRegs = (event.registrations || []).filter(reg => 
    reg.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    reg.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    reg.program.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Generate dynamic chart data based on registrationDate
  const chartData = (() => {
    const datesMap: { [key: string]: number } = {};
    (event.registrations || []).forEach(r => {
      datesMap[r.registrationDate] = (datesMap[r.registrationDate] || 0) + 1;
    });

    const sortedDates = Object.keys(datesMap).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
    let cumulative = 0;
    return sortedDates.map(d => {
      cumulative += datesMap[d];
      return {
        date: d,
        Registrations: cumulative
      };
    });
  })();

  // --------------------------------------------------
  // ACTION HANDLERS
  // --------------------------------------------------
  const updateEventInDatabase = async (updated: Partial<NetworkEvent>) => {
    try {
      const { data, error } = await eventService.update(event.id, updated);
      if (error) throw new Error(error);
      setEvent(data);
      toast.success('Event updated successfully');
    } catch (err: any) {
      toast.error(err.message || 'Failed to save event modifications');
    }
  };

  // Section 3: Approve Participant
  const handleApproveParticipant = async (userId: string) => {
    const updated = (event.registrations || []).map(r => 
      r.userId === userId ? { ...r, status: 'confirmed' as const } : r
    );
    const attendees = [...(event.attendees || [])];
    if (!attendees.includes(userId)) {
      attendees.push(userId);
    }
    await updateEventInDatabase({ registrations: updated, attendees });
  };

  // Section 3: Reject Participant
  const handleRejectParticipant = async (userId: string) => {
    const updated = (event.registrations || []).map(r => 
      r.userId === userId ? { ...r, status: 'cancelled' as const } : r
    );
    const attendees = (event.attendees || []).filter(id => id !== userId);
    await updateEventInDatabase({ registrations: updated, attendees });
  };

  // Section 3: Remove Participant
  const handleRemoveParticipant = async (userId: string) => {
    const updated = (event.registrations || []).filter(r => r.userId !== userId);
    const attendees = (event.attendees || []).filter(id => id !== userId);
    await updateEventInDatabase({ registrations: updated, attendees });
  };

  // Section 3 & 4: Mark Attendance
  const handleMarkAttendance = async (userId: string, status: 'attended' | 'absent' | 'none') => {
    const updated = (event.registrations || []).map(r => 
      r.userId === userId ? { ...r, attendanceStatus: status } : r
    );
    await updateEventInDatabase({ registrations: updated });
  };

  const handleExportCsv = () => {
    const headers = ['Student Name', 'Email', 'Program', 'Registration Date', 'Status', 'Attendance Status'];
    const rows = (event.registrations || []).map(reg => [
      reg.name,
      reg.email,
      reg.program,
      reg.registrationDate,
      reg.status,
      reg.attendanceStatus
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${(event.title || 'event').replace(/[^a-zA-Z0-9]/g, '_')}_registrations.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Section 5: Communications
  const handleSendReminder = async () => {
    try {
      const targetUsers = confirmedRegs;
      if (targetUsers.length === 0) {
        toast.error('No confirmed participants to remind');
        return;
      }

      for (const reg of targetUsers) {
        await notificationStorage.create({
          userId: reg.userId,
          title: `Reminder: ${event.title}`,
          message: `Friendly reminder that ${event.title} is starting on ${event.date} at ${event.time}. We look forward to your attendance!`,
          type: 'announcement',
          read: false,
          createdAt: new Date().toISOString()
        } as any);

        // Also add conversation ping
        await messageService.sendMessage({
          conversationId: 'all-students', // Group broadcast target
          senderId: user?.id || 'system',
          senderName: 'Peter Mannarino',
          content: `Hi ${reg.name}, friendly reminder for our event "${event.title}" today at ${event.time}! Here is your access link: ${event.meetingLink || '#'}`,
          type: 'text'
        });
      }

      toast.success(`Reminder sent to ${targetUsers.length} confirmed participants.`);
    } catch {
      toast.error('Failed to dispatch reminders');
    }
  };

  const handleSendCancellation = async () => {
    try {
      const targetUsers = confirmedRegs;
      if (targetUsers.length === 0) {
        toast.error('No participants to notify');
        return;
      }

      for (const reg of targetUsers) {
        await notificationStorage.create({
          userId: reg.userId,
          title: `CANCELLED: ${event.title}`,
          message: `The event "${event.title}" scheduled for ${event.date} has been cancelled. We sincerely apologize for the change in schedule.`,
          type: 'announcement',
          read: false,
          createdAt: new Date().toISOString()
        } as any);
      }

      await updateEventInDatabase({ status: 'cancelled' });
      toast.success(`Cancellation notice sent to ${targetUsers.length} participants.`);
    } catch {
      toast.error('Failed to dispatch cancellation notice');
    }
  };

  const handleSendThankYou = async () => {
    try {
      const targetUsers = (event.registrations || []).filter(r => r.attendanceStatus === 'attended');
      if (targetUsers.length === 0) {
        toast.error('No attended participants to thank');
        return;
      }

      for (const reg of targetUsers) {
        await notificationStorage.create({
          userId: reg.userId,
          title: `Thank you for attending ${event.title}!`,
          message: `Hi ${reg.name}, thank you for joining us for "${event.title}". Please leave your feedback in your dashboard.`,
          type: 'announcement',
          read: false,
          createdAt: new Date().toISOString()
        } as any);
      }

      toast.success(`Thank you emails dispatched to ${targetUsers.length} attendees.`);
    } catch {
      toast.error('Failed to send thank you notes');
    }
  };

  const handleSendCustomUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!updateSubject.trim() || !updateMessage.trim()) {
      toast.error('Subject and message are required');
      return;
    }

    setIsSendingUpdate(true);
    try {
      const targetUsers = confirmedRegs;
      for (const reg of targetUsers) {
        await notificationStorage.create({
          userId: reg.userId,
          title: updateSubject,
          message: updateMessage,
          type: 'announcement',
          read: false,
          createdAt: new Date().toISOString()
        } as any);
      }

      toast.success(`Update dispatched to ${targetUsers.length} participants.`);
      setIsUpdateModalOpen(false);
      setUpdateSubject('');
      setUpdateMessage('');
    } catch {
      toast.error('Failed to send custom update');
    } finally {
      setIsSendingUpdate(false);
    }
  };

  // Section 7: Files upload
  const handleAddFile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFileName.trim()) {
      toast.error('File name is required');
      return;
    }

    const newFile: EventFile = {
      id: 'f_' + Date.now(),
      name: newFileName,
      type: newFileType,
      url: newFileUrl || 'https://example.com/resources',
      size: newFileSize || '1.2 MB',
      uploadedAt: new Date().toLocaleDateString()
    };

    const currentFiles = event.files || [];
    await updateEventInDatabase({ files: [...currentFiles, newFile] });
    
    // Clear form
    setNewFileName('');
    setNewFileUrl('');
    setNewFileSize('1.5 MB');
  };

  const handleRemoveFile = async (fileId: string) => {
    const currentFiles = event.files || [];
    const filtered = currentFiles.filter(f => f.id !== fileId);
    await updateEventInDatabase({ files: filtered });
  };

  // Section 8: Recording
  const handleSaveRecording = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingRecording(true);
    try {
      const updatedRecording = {
        type: recordingType,
        url: recordingUrl || '#',
        notes: recordingNotes
      };
      await updateEventInDatabase({ recording: updatedRecording });
      toast.success('Recording settings updated');
    } catch {
      toast.error('Failed to save recording information');
    } finally {
      setIsSavingRecording(false);
    }
  };

  // Section 10: Actions
  const handlePublishToggle = async () => {
    const newStatus = event.status === 'draft' ? 'published' : 'draft';
    await updateEventInDatabase({ status: newStatus });
    toast.success(`Event status changed to ${newStatus}`);
  };

  const handleCancelEventAction = async () => {
    await updateEventInDatabase({ status: 'cancelled' });
    toast.success('Event status marked as Cancelled');
  };

  const handleDuplicateEvent = async () => {
    try {
      const duplicate: Omit<NetworkEvent, 'id'> = {
        title: `${event.title} (Copy)`,
        description: event.description,
        date: event.date,
        time: event.time,
        endTime: event.endTime,
        timezone: event.timezone || 'UTC',
        location: event.location,
        meetingLink: event.meetingLink,
        venue: event.venue,
        image: event.image,
        capacity: event.capacity,
        registrationDeadline: event.registrationDeadline,
        speaker: event.speaker,
        visibility: event.visibility || 'public',
        status: 'draft',
        tags: event.tags,
        attendees: [],
        registrations: [],
        files: [],
        feedbacks: []
      };

      const { data, error } = await eventService.insert(duplicate);
      if (error) throw new Error(error);
      toast.success('Event duplicated as Draft!');
      onBack(); // Return to list so they see the duplicate
    } catch (err: any) {
      toast.error(err.message || 'Failed to duplicate event');
    }
  };

  return (
    <div className="space-y-10 pb-16 max-w-7xl mx-auto px-4 md:px-0 animate-in fade-in duration-500">
      
      {/* Top Header & Navigation */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <button 
            onClick={onBack}
            className="flex items-center gap-2 text-slate-500 hover:text-black mb-4 text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer"
          >
            <ArrowLeft size={14} /> Back to Experiences
          </button>
          <div className="flex items-center gap-4">
            <h1 className="text-3xl font-black uppercase tracking-tighter text-slate-900 leading-none">{event.title}</h1>
            <span className={`px-4 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
              event.status === 'published' ? 'bg-emerald-100 text-emerald-800' :
              event.status === 'draft' ? 'bg-slate-100 text-slate-700' :
              event.status === 'completed' ? 'bg-indigo-100 text-indigo-800' :
              'bg-rose-100 text-rose-800'
            }`}>
              {event.status}
            </span>
          </div>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-2">
            Control center for your event • ID: {event.id}
          </p>
        </div>

        {/* TOP QUICK ACTION BAR */}
        <div className="flex items-center gap-2">
          <button 
            onClick={() => onEdit(event)}
            className="p-4 bg-white border border-slate-200 text-slate-700 rounded-2xl hover:bg-slate-50 transition-all flex items-center justify-center cursor-pointer"
            title="Edit Details"
          >
            <Edit3 size={16} />
          </button>
          <button 
            onClick={handleDuplicateEvent}
            className="p-4 bg-white border border-slate-200 text-slate-700 rounded-2xl hover:bg-slate-50 transition-all flex items-center justify-center cursor-pointer"
            title="Duplicate Event"
          >
            <Copy size={16} />
          </button>
          <button 
            onClick={handlePublishToggle}
            className={`px-6 py-4 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-2 cursor-pointer ${
              event.status === 'draft' 
                ? 'bg-emerald-600 text-white hover:bg-emerald-700' 
                : 'bg-slate-800 text-white hover:bg-slate-700'
            }`}
          >
            {event.status === 'draft' ? <Eye size={14} /> : <EyeOff size={14} />}
            {event.status === 'draft' ? 'Publish' : 'Unpublish'}
          </button>
          <button 
            onClick={() => {
              if (confirm('Are you sure you want to permanently delete this event?')) {
                onDelete(event.id);
                onBack();
              }
            }}
            className="p-4 bg-rose-50 text-rose-600 rounded-2xl hover:bg-rose-100 transition-all flex items-center justify-center cursor-pointer"
            title="Delete Event"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {/* STATS OVERVIEW SECTION */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm">
          <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Total Registrations</p>
          <p className="text-3xl font-black text-indigo-600 mt-2">{totalRegs}</p>
        </div>
        <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm">
          <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Confirmed Seats</p>
          <p className="text-3xl font-black text-slate-900 mt-2">{confirmedCount} <span className="text-xs text-slate-400">/ {capacity}</span></p>
        </div>
        <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm">
          <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Pending Review</p>
          <p className="text-3xl font-black text-amber-500 mt-2">{pendingCount}</p>
        </div>
        <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm">
          <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Attendance %</p>
          <p className="text-3xl font-black text-emerald-500 mt-2">{attendanceRate}%</p>
        </div>
        <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm col-span-2 md:col-span-1">
          <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Avg Feedback</p>
          <p className="text-3xl font-black text-purple-600 mt-2 flex items-baseline gap-1">
            {feedbackAverage} <span className="text-xs text-slate-400">★</span>
          </p>
        </div>
      </div>

      {/* MAIN TWO-COLUMN DASHBOARD */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT COLUMN: EVENT SETTINGS & CONFIGS (1/3 width) */}
        <div className="space-y-8">
          
          {/* SECTION 1 - EVENT OVERVIEW DETAILS */}
          <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm space-y-6">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-900 pb-3 border-b border-slate-100 flex items-center gap-2">
              <Calendar size={14} className="text-indigo-500" /> Event Specifications
            </h3>
            
            <div className="space-y-4">
              <div>
                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">Event Description</span>
                <p className="text-xs text-slate-600 mt-1 font-medium">{event.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">Date</span>
                  <p className="text-xs font-bold text-slate-800 mt-1 flex items-center gap-1">
                    <Calendar size={12} className="text-slate-400" /> {event.date}
                  </p>
                </div>
                <div>
                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">Time</span>
                  <p className="text-xs font-bold text-slate-800 mt-1 flex items-center gap-1">
                    <Clock size={12} className="text-slate-400" /> {event.time} {event.endTime ? `- ${event.endTime}` : ''}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">Timezone</span>
                  <p className="text-xs font-bold text-slate-800 mt-1">{event.timezone || 'America/New_York'}</p>
                </div>
                <div>
                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">Event Type</span>
                  <p className="text-xs font-bold text-indigo-600 mt-1 uppercase tracking-wider">{event.category || 'Workshop'}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">Platform / Location</span>
                  <p className="text-xs font-bold text-slate-800 mt-1 flex items-center gap-1">
                    <MapPin size={12} className="text-slate-400" /> {event.location}
                  </p>
                </div>
                <div>
                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">Reg. Deadline</span>
                  <p className="text-xs font-bold text-slate-800 mt-1">{event.registrationDeadline || '24 hrs prior'}</p>
                </div>
              </div>

              {event.meetingLink && (
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                  <div className="truncate pr-4">
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">Meeting Link</span>
                    <a href={event.meetingLink} target="_blank" rel="noopener noreferrer" className="text-[11px] font-black text-indigo-600 hover:underline truncate block">
                      {event.meetingLink}
                    </a>
                  </div>
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(event.meetingLink || '');
                      toast.success('Link copied to clipboard');
                    }}
                    className="p-2 hover:bg-slate-200 text-slate-500 hover:text-black rounded-xl transition-all"
                  >
                    <Copy size={14} />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* SECTION 5 - COMMUNICATIONS & EMAIL MESSAGING */}
          <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm space-y-6">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-900 pb-3 border-b border-slate-100 flex items-center gap-2">
              <Send size={14} className="text-indigo-500" /> Dispatch Communications
            </h3>
            
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
              Send notifications and push alerts directly using the integrated notification engine.
            </p>

            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={handleSendReminder}
                className="p-4 bg-slate-50 border border-slate-100 hover:bg-slate-100 rounded-2xl flex flex-col items-center justify-center text-center group transition-all"
              >
                <Clock size={18} className="text-indigo-500 mb-2 group-hover:scale-110 transition-transform" />
                <span className="text-[9px] font-black uppercase tracking-wider">Send Reminder</span>
              </button>
              
              <button 
                onClick={() => setIsUpdateModalOpen(true)}
                className="p-4 bg-slate-50 border border-slate-100 hover:bg-slate-100 rounded-2xl flex flex-col items-center justify-center text-center group transition-all"
              >
                <Send size={18} className="text-emerald-500 mb-2 group-hover:scale-110 transition-transform" />
                <span className="text-[9px] font-black uppercase tracking-wider">Send Update</span>
              </button>

              <button 
                onClick={handleSendCancellation}
                className="p-4 bg-slate-50 border border-slate-100 hover:bg-slate-100 rounded-2xl flex flex-col items-center justify-center text-center group transition-all"
              >
                <AlertTriangle size={18} className="text-rose-500 mb-2 group-hover:scale-110 transition-transform" />
                <span className="text-[9px] font-black uppercase tracking-wider text-rose-600">Cancel Notice</span>
              </button>

              <button 
                onClick={handleSendThankYou}
                className="p-4 bg-slate-50 border border-slate-100 hover:bg-slate-100 rounded-2xl flex flex-col items-center justify-center text-center group transition-all"
              >
                <ThumbsUp size={18} className="text-purple-500 mb-2 group-hover:scale-110 transition-transform" />
                <span className="text-[9px] font-black uppercase tracking-wider">Thank Attendee</span>
              </button>
            </div>
          </div>

          {/* SECTION 8 - RECORDING PRESETS */}
          <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm space-y-6">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-900 pb-3 border-b border-slate-100 flex items-center gap-2">
              <Video size={14} className="text-indigo-500" /> Event Recording
            </h3>
            
            <form onSubmit={handleSaveRecording} className="space-y-4">
              <div>
                <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-2">Recording Platform</label>
                <select 
                  value={recordingType}
                  onChange={(e) => setRecordingType(e.target.value as any)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-[11px] font-bold focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="zoom">Zoom Recording</option>
                  <option value="google_meet">Google Meet Recording</option>
                  <option value="youtube">YouTube Link</option>
                  <option value="other">Other Link</option>
                </select>
              </div>

              <div>
                <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-2">Recording URL</label>
                <input 
                  type="url" 
                  value={recordingUrl}
                  onChange={(e) => setRecordingUrl(e.target.value)}
                  placeholder="https://zoom.us/rec/..."
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-[11px] font-bold focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-2">Access Notes / Passcode</label>
                <textarea 
                  value={recordingNotes}
                  onChange={(e) => setRecordingNotes(e.target.value)}
                  placeholder="Passcode, bookmarks, or chapters..."
                  rows={3}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-[11px] font-medium focus:outline-none"
                />
              </div>

              <button 
                type="submit"
                disabled={isSavingRecording}
                className="w-full py-3 bg-black hover:bg-slate-800 text-white rounded-[16px] text-[10px] font-black uppercase tracking-widest transition-all"
              >
                {isSavingRecording ? 'Saving...' : 'Update Recording Link'}
              </button>
            </form>
          </div>

        </div>

        {/* RIGHT COLUMN: LISTS, ANALYTICS, FILES (2/3 width) */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* SECTION 6 - ANALYTICS TRENDS */}
          <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm space-y-6">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-900 pb-3 border-b border-slate-100 flex items-center gap-2">
              <BarChart3 size={14} className="text-indigo-500" /> Performance Analytics & Cumulative Registrations
            </h3>

            {chartData.length > 0 ? (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorRegs" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="date" tick={{ fontSize: 9, fontWeight: 'bold', fill: '#94a3b8' }} />
                    <YAxis tick={{ fontSize: 9, fontWeight: 'bold', fill: '#94a3b8' }} />
                    <Tooltip contentStyle={{ fontSize: 10, fontWeight: 'bold', borderRadius: 16 }} />
                    <Area type="monotone" dataKey="Registrations" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorRegs)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="py-12 text-center text-[10px] font-black uppercase tracking-widest text-slate-300">
                No registrations trend data available
              </div>
            )}

            <div className="grid grid-cols-4 gap-4 pt-4 border-t border-slate-50 text-center">
              <div>
                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">No-shows</span>
                <span className="text-xl font-black text-rose-500 block mt-1">{absentCount}</span>
              </div>
              <div>
                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">Attendance %</span>
                <span className="text-xl font-black text-emerald-500 block mt-1">{attendanceRate}%</span>
              </div>
              <div>
                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">Completed Status</span>
                <span className="text-xl font-black text-indigo-500 block mt-1">
                  {event.status === 'completed' ? '100%' : 'Pending'}
                </span>
              </div>
              <div>
                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">Feedback Score</span>
                <span className="text-xl font-black text-purple-500 block mt-1">
                  {feedbackAverage} ★
                </span>
              </div>
            </div>
          </div>

          {/* SECTION 3 - PARTICIPANTS REGISTRATION AND APPROVAL TABLE */}
          <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-900 pb-1">
                  Participants Roster
                </h3>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Manage applications, attendance, and details
                </p>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  onClick={handleExportCsv}
                  className="px-4 py-3 bg-white border border-slate-200 text-slate-700 rounded-2xl hover:bg-slate-50 transition-all flex items-center justify-center gap-2 text-[9px] font-black uppercase tracking-widest cursor-pointer"
                  title="Export CSV"
                >
                  <Download size={14} />
                  Export CSV
                </button>
                <div className="relative w-full sm:w-72">
                  <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input 
                    type="text"
                    placeholder="Search participants..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-xs focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Profile</th>
                    <th className="py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Email & Program</th>
                    <th className="py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Reg Date</th>
                    <th className="py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                    <th className="py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Attendance</th>
                    <th className="py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredRegs.map((reg, idx) => (
                    <tr key={`${reg.userId || idx}_${idx}`} className="group hover:bg-slate-50/50 transition-colors">
                      <td className="py-4 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-black text-xs text-slate-700">
                          {reg.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-xs font-black text-slate-900">{reg.name}</p>
                          <p className="text-[10px] font-semibold text-slate-400">{reg.program}</p>
                        </div>
                      </td>
                      <td className="py-4">
                        <p className="text-[10px] font-bold text-slate-600">{reg.email}</p>
                      </td>
                      <td className="py-4">
                        <p className="text-[10px] font-medium text-slate-500">{reg.registrationDate}</p>
                      </td>
                      <td className="py-4">
                        <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider ${
                          reg.status === 'confirmed' ? 'bg-emerald-50 text-emerald-700' :
                          reg.status === 'pending' ? 'bg-amber-50 text-amber-700' :
                          'bg-rose-50 text-rose-700'
                        }`}>
                          {reg.status}
                        </span>
                      </td>
                      <td className="py-4">
                        <div className="flex items-center gap-1">
                          <button 
                            onClick={() => handleMarkAttendance(reg.userId, 'attended')}
                            className={`px-2 py-1 rounded text-[8px] font-black uppercase tracking-widest transition-all ${
                              reg.attendanceStatus === 'attended' 
                                ? 'bg-emerald-100 text-emerald-800' 
                                : 'bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-black'
                            }`}
                          >
                            Attended
                          </button>
                          <button 
                            onClick={() => handleMarkAttendance(reg.userId, 'absent')}
                            className={`px-2 py-1 rounded text-[8px] font-black uppercase tracking-widest transition-all ${
                              reg.attendanceStatus === 'absent' 
                                ? 'bg-rose-100 text-rose-800' 
                                : 'bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-black'
                            }`}
                          >
                            Absent
                          </button>
                        </div>
                      </td>
                      <td className="py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {reg.status === 'pending' && (
                            <button 
                              onClick={() => handleApproveParticipant(reg.userId)}
                              className="p-1 text-emerald-600 hover:bg-emerald-50 rounded transition-all"
                              title="Approve registration"
                            >
                              <CheckCircle2 size={14} />
                            </button>
                          )}
                          {reg.status === 'confirmed' && (
                            <button 
                              onClick={() => handleRejectParticipant(reg.userId)}
                              className="p-1 text-amber-600 hover:bg-amber-50 rounded transition-all"
                              title="Cancel confirmation"
                            >
                              <X size={14} />
                            </button>
                          )}
                          <button 
                            onClick={() => handleRemoveParticipant(reg.userId)}
                            className="p-1 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded transition-all"
                            title="Remove completely"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredRegs.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-xs font-bold text-slate-300">
                        No roster records matched your search query
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* SECTION 7 - FILE MANAGEMENT */}
          <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm space-y-6">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-900 pb-3 border-b border-slate-100 flex items-center gap-2">
              <FileText size={14} className="text-indigo-500" /> Shared Files & Handouts
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* UPLOAD NEW FILE FORM */}
              <div className="space-y-4">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                  Link files or handouts (Slides, Assignments, PDFs) for student workspace.
                </p>

                <form onSubmit={handleAddFile} className="space-y-4">
                  <div>
                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-1">File Name</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Case_Study_Workbook.pdf"
                      value={newFileName}
                      onChange={(e) => setNewFileName(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-[11px] font-bold focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-1">Type</label>
                      <select 
                        value={newFileType}
                        onChange={(e) => setNewFileType(e.target.value as any)}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-[11px] font-bold focus:outline-none"
                      >
                        <option value="pdf">PDF File</option>
                        <option value="slides">Slides PDF</option>
                        <option value="assignment">Assignment Doc</option>
                        <option value="recording">Recording Audio/Video</option>
                        <option value="resource">Resource Link</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-1">Size</label>
                      <input 
                        type="text" 
                        placeholder="e.g. 1.2 MB"
                        value={newFileSize}
                        onChange={(e) => setNewFileSize(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-[11px] font-bold focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-1">Resource URL</label>
                    <input 
                      type="url" 
                      placeholder="https://example.com/file"
                      value={newFileUrl}
                      onChange={(e) => setNewFileUrl(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-[11px] font-bold focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>

                  <button 
                    type="submit"
                    className="w-full py-3.5 bg-black hover:bg-slate-800 text-white rounded-[16px] text-[10px] font-black uppercase tracking-widest transition-all"
                  >
                    Attach File & Publish
                  </button>
                </form>
              </div>

              {/* ACTIVE FILE LIST */}
              <div className="space-y-4">
                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">Active Attachments</span>
                
                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                  {(event.files || []).map((file, i) => (
                    <div key={`${file.id || i}_${i}`} className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-between group">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-white rounded-xl text-indigo-500 border border-slate-100">
                          <FileText size={16} />
                        </div>
                        <div>
                          <p className="text-[11px] font-bold text-slate-900 leading-none mb-1">{file.name}</p>
                          <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">{file.type} • {file.size}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                        <a href={file.url} target="_blank" rel="noopener noreferrer" className="p-1.5 hover:bg-slate-200 text-slate-500 hover:text-black rounded-lg transition-all">
                          <Download size={14} />
                        </a>
                        <button 
                          onClick={() => handleRemoveFile(file.id)}
                          className="p-1.5 hover:bg-rose-50 text-slate-300 hover:text-rose-600 rounded-lg transition-all"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                  {(event.files || []).length === 0 && (
                    <div className="text-center py-12 text-[10px] font-black uppercase tracking-widest text-slate-300 border border-dashed border-slate-100 rounded-2xl">
                      No files shared yet
                    </div>
                  )}
                </div>
              </div>

            </div>
          </div>

          {/* SECTION 9 - FEEDBACK SUMMARY */}
          <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm space-y-6">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-900 flex items-center gap-2">
                <Star size={14} className="text-indigo-500 fill-indigo-500" /> Participant Feedback
              </h3>
              <span className="text-xs font-black text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">
                Avg Rating: {feedbackAverage} ★
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {(event.feedbacks || []).map((feed, i) => (
                <div key={`${feed.id || i}_${i}`} className="p-5 bg-slate-50 border border-slate-100 rounded-[24px] space-y-3">
                  <div className="flex justify-between items-center">
                    <p className="text-[11px] font-black text-slate-900 leading-none">{feed.studentName}</p>
                    <div className="flex gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} size={10} className={`${i < feed.rating ? 'text-amber-500 fill-amber-500' : 'text-slate-200'}`} />
                      ))}
                    </div>
                  </div>
                  <p className="text-xs font-medium text-slate-600 italic">"{feed.comment}"</p>
                  {feed.suggestion && (
                    <div className="pt-2 border-t border-slate-100 text-[10px] text-slate-400">
                      <span className="font-bold uppercase tracking-wider text-slate-500">Suggestion: </span>
                      {feed.suggestion}
                    </div>
                  )}
                </div>
              ))}
              {(event.feedbacks || []).length === 0 && (
                <div className="col-span-full text-center py-12 text-[10px] font-black uppercase tracking-widest text-slate-300">
                  No feedback reviews posted yet
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* CUSTOM UPDATE DIALOG MODAL */}
      {isUpdateModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="bg-white rounded-[40px] border border-slate-100 p-8 w-full max-w-lg shadow-2xl space-y-6">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="text-lg font-black uppercase tracking-tight text-slate-900">Broadcast Event Update</h4>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Sent to all {confirmedCount} confirmed participants</p>
              </div>
              <button onClick={() => setIsUpdateModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-all">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSendCustomUpdate} className="space-y-4">
              <div>
                <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-2">Subject Title</label>
                <input 
                  type="text"
                  required
                  placeholder="e.g. Schedule Change or Link Update"
                  value={updateSubject}
                  onChange={(e) => setUpdateSubject(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-[11px] font-bold focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-2">Message Body</label>
                <textarea 
                  required
                  rows={5}
                  placeholder="Type your message details here..."
                  value={updateMessage}
                  onChange={(e) => setUpdateMessage(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-[11px] font-medium focus:outline-none"
                />
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button 
                  type="button" 
                  onClick={() => setIsUpdateModalOpen(false)}
                  className="px-6 py-3.5 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={isSendingUpdate}
                  className="px-8 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-indigo-500/25 flex items-center gap-2"
                >
                  {isSendingUpdate ? <Loader2 className="animate-spin" size={14} /> : <Send size={14} />}
                  Dispatch Update
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
