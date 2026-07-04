import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Calendar, Clock, MapPin, Users, User, Tag, ExternalLink, Copy, Download, MessageSquare, Star, Shield, Clock3, CheckCircle2, XCircle, AlertTriangle, Loader2, Share2, Bookmark, BookmarkCheck, Video, FileText, Linkedin, Reply } from 'lucide-react';
import { NetworkEvent, EventComment } from '../../types';
import { eventService } from '../../services/eventService';
import { useAuth } from '../../context/AuthContext';
import { notifySuccess, notifyError } from '../../utils/toast';
import { notificationStorage } from '../../services/notificationStorage';
import { trackRecentlyViewed } from '../../utils/recentlyViewed';

const EVENT_TYPE_COLORS: Record<string, string> = {
  Workshop: 'bg-indigo-100 text-indigo-700', Webinar: 'bg-blue-100 text-blue-700',
  Bootcamp: 'bg-emerald-100 text-emerald-700', 'AMA Session': 'bg-amber-100 text-amber-700',
  'Group Mentoring': 'bg-purple-100 text-purple-700', 'Networking Event': 'bg-cyan-100 text-cyan-700',
  'Office Hours': 'bg-slate-100 text-slate-700', 'Interview Session': 'bg-rose-100 text-rose-700',
  'Career Talk': 'bg-teal-100 text-teal-700', 'Alumni Talk': 'bg-violet-100 text-violet-700',
  'Live Coding': 'bg-orange-100 text-orange-700', 'Mock Interview': 'bg-pink-100 text-pink-700',
  Hackathon: 'bg-lime-100 text-lime-700', Assessment: 'bg-yellow-100 text-yellow-700',
  'Guest Lecture': 'bg-sky-100 text-sky-700', 'Community Meetup': 'bg-gray-100 text-gray-700',
};

interface EventDetailViewProps {
  eventId: string;
  onBack: () => void;
  onEdit?: (event: NetworkEvent) => void;
}

const EventDetailView: React.FC<EventDetailViewProps> = ({ eventId, onBack, onEdit }) => {
  const { user } = useAuth();
  const [event, setEvent] = useState<NetworkEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState('');
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [isRegistered, setIsRegistered] = useState(false);
  const [isOnWaitlist, setIsOnWaitlist] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [activeSection, setActiveSection] = useState('overview');
  const [feedbackRating, setFeedbackRating] = useState(0);
  const [feedbackComment, setFeedbackComment] = useState('');
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);

  useEffect(() => {
    loadEvent();
  }, [eventId]);

  useEffect(() => {
    if (event) {
      trackRecentlyViewed({ id: event.id, title: event.title, date: event.date, eventType: event.eventType, image: event.image });
    }
  }, [event]);

  const loadEvent = async () => {
    setLoading(true);
    const { data, error } = await eventService.getById(eventId);
    if (data) {
      setEvent(data);
      if (user) {
        setIsRegistered(!!data.registrations?.find(r => r.userId === user.id && r.status === 'confirmed'));
        setIsOnWaitlist(!!data.waitlist?.find(w => w.userId === user.id && w.status === 'waiting'));
        setBookmarked(!!data.registrations?.find(r => r.userId === user.id && r.bookmarked));
      }
    }
    setLoading(false);
  };

  const handleRegister = async () => {
    if (!user || !event) return;
    const { error } = await eventService.register(eventId, user.id, user.name, user.email);
    if (!error) {
      notifySuccess('Registered successfully!');
      notificationStorage.create({ userId: user.id, title: 'Registration Confirmed', message: `You are registered for "${event.title}"`, type: 'event', read: false } as any);
      await eventService.logActivity(eventId, user.id, 'registration', `User registered for event`);
      loadEvent();
    } else notifyError('Failed to register');
  };

  const handleUnregister = async () => {
    if (!user || !event) return;
    const { error } = await eventService.unregister(eventId, user.id);
    if (!error) {
      notifySuccess('Registration cancelled');
      loadEvent();
    } else notifyError('Failed to cancel');
  };

  const handleJoinWaitlist = async () => {
    if (!user || !event) return;
    const { error } = await eventService.joinWaitlist(eventId, user.id, user.name, user.email);
    if (!error) {
      notifySuccess('Added to waitlist!');
      loadEvent();
    } else notifyError('Failed to join waitlist');
  };

  const handleAddComment = async () => {
    if (!user || !comment.trim()) return;
    const { error } = await eventService.addComment(eventId, user.id, comment);
    if (!error) {
      setComment('');
      notifySuccess('Comment added');
      loadEvent();
    } else notifyError('Failed to add comment');
  };

  const handleReplyComment = async (parentId: string) => {
    if (!user || !replyContent.trim()) return;
    const { error } = await eventService.addComment(eventId, user.id, replyContent, parentId);
    if (!error) {
      setReplyContent('');
      setReplyTo(null);
      notifySuccess('Reply added');
      loadEvent();
    } else notifyError('Failed to add reply');
  };

  const handleSubmitFeedback = async () => {
    if (!user || !event || feedbackRating === 0) return;
    setSubmittingFeedback(true);
    const { error } = await eventService.submitFeedback(eventId, user.id, feedbackRating, feedbackComment);
    if (!error) {
      notifySuccess('Feedback submitted!');
      setFeedbackRating(0);
      setFeedbackComment('');
      loadEvent();
    } else notifyError('Failed to submit feedback');
    setSubmittingFeedback(false);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/#/events/${eventId}`);
    notifySuccess('Link copied!');
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: event?.title, url: `${window.location.origin}/#/events/${eventId}` });
      } catch {}
    } else {
      handleCopyLink();
    }
    setShowShareMenu(false);
  };

  const handleAddToCalendar = () => {
    if (!event) return;
    const start = `${event.date}T${event.time}`;
    const end = event.endTime ? `${event.date}T${event.endTime}` : start;
    const ics = [
      'BEGIN:VCALENDAR', 'VERSION:2.0', 'BEGIN:VEVENT',
      `DTSTART:${start.replace(/[-:]/g, '')}`,
      `DTEND:${end.replace(/[-:]/g, '')}`,
      `SUMMARY:${event.title}`,
      `DESCRIPTION:${event.description?.replace(/\n/g, '\\n')}`,
      `LOCATION:${event.venue || event.location}`,
      'END:VEVENT', 'END:VCALENDAR',
    ].join('\n');
    const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${event.title.replace(/\s+/g, '_')}.ics`;
    link.click();
    notifySuccess('Calendar file downloaded');
  };

  const handleBookmarkToggle = async () => {
    if (!user) return notifyError('Sign in to bookmark');
    setBookmarked(!bookmarked);
    notifySuccess(bookmarked ? 'Removed bookmark' : 'Bookmarked!');
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="animate-spin text-indigo-600" size={40} />
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Loading Event...</p>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="text-center py-24 bg-white rounded-[40px] border border-slate-100 shadow-sm max-w-2xl mx-auto">
        <AlertTriangle size={48} className="mx-auto text-rose-500 mb-6" />
        <h4 className="text-2xl font-black uppercase tracking-tighter text-slate-900">Event Not Found</h4>
        <button onClick={onBack} className="mt-6 bg-black text-white px-8 py-4 rounded-[20px] text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all">
          Back to Events
        </button>
      </div>
    );
  }

  const confirmedCount = event.registrations?.filter(r => r.status === 'confirmed').length || 0;
  const attendedCount = event.registrations?.filter(r => r.attendanceStatus === 'attended').length || 0;
  const waitlistCount = event.waitlist?.filter(w => w.status === 'waiting').length || 0;
  const seatsLeft = (event.capacity || Infinity) - confirmedCount;
  const isFull = event.capacity && seatsLeft <= 0;
  const hasFeedback = event.registrations?.find(r => r.userId === user?.id && r.feedbackSubmitted);
  const userWaitlistEntry = event.waitlist?.find(w => w.userId === user?.id && w.status === 'waiting');
  const fileTypeIcons: Record<string, typeof FileText> = {
    slides: FileText, pdf: FileText, assignment: FileText, recording: Download, resource: FileText,
    video: FileText, template: FileText, github: ExternalLink, figma: ExternalLink, googledrive: ExternalLink,
  };

  const renderComment = (c: EventComment, depth: number = 0) => (
    <div key={c.id} className={`p-5 bg-slate-50 rounded-2xl border border-slate-100 ${depth > 0 ? 'ml-8' : ''}`}>
      <div className="flex items-center gap-2 mb-2">
        <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-[10px]">{(c as any).user?.name?.charAt(0) || '?'}</div>
        <span className="text-xs font-bold text-slate-700">{(c as any).user?.name || 'User'}</span>
        {c.isAnnouncement && <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-[7px] font-black uppercase tracking-widest">Announcement</span>}
        <span className="text-[10px] text-slate-400 ml-auto">{new Date(c.createdAt).toLocaleDateString()}</span>
      </div>
      <p className="text-sm text-slate-700 font-medium">{c.content}</p>
      {user && depth === 0 && (
        <button onClick={() => setReplyTo(replyTo === c.id ? null : c.id)} className="mt-2 flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-indigo-600 transition-all">
          <Reply size={12} /> Reply
        </button>
      )}
      {replyTo === c.id && (
        <div className="flex gap-2 mt-3">
          <input type="text" placeholder="Write a reply..." value={replyContent} onChange={e => setReplyContent(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && replyContent.trim()) handleReplyComment(c.id); }}
            className="flex-1 px-4 py-2.5 bg-white border border-slate-100 rounded-xl text-sm font-medium outline-none focus:border-black transition-all" />
          <button onClick={() => handleReplyComment(c.id)} disabled={!replyContent.trim()}
            className="px-4 py-2.5 bg-black text-white rounded-xl text-[8px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all disabled:opacity-50">
            Reply
          </button>
        </div>
      )}
      {c.replies?.map(r => renderComment(r, depth + 1))}
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-16 animate-in fade-in duration-500">
      <button onClick={onBack} className="flex items-center gap-2 text-slate-500 hover:text-black text-[10px] font-black uppercase tracking-widest transition-all">
        <ArrowLeft size={14} /> Back to Events
      </button>

      {/* HERO SECTION */}
      <div className="relative bg-white rounded-[40px] overflow-hidden border border-slate-100 shadow-sm">
        {event.image && (
          <div className="relative h-56 md:h-72">
            <img src={event.image} alt={event.title} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
          </div>
        )}
        <div className={`${event.image ? 'absolute bottom-0 left-0 right-0' : ''} p-8 md:p-10`}>
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${EVENT_TYPE_COLORS[event.eventType || event.category || 'Workshop']}`}>
              {event.eventType || event.category || 'Workshop'}
            </span>
            {event.featured && <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-[8px] font-black uppercase tracking-widest">★ Featured</span>}
            {isFull && <span className="px-3 py-1 bg-rose-100 text-rose-700 rounded-full text-[8px] font-black uppercase tracking-widest">Full</span>}
            <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${
              event.status === 'published' ? 'bg-emerald-100 text-emerald-700' :
              event.status === 'draft' ? 'bg-slate-100 text-slate-600' :
              event.status === 'cancelled' ? 'bg-rose-100 text-rose-700' : 'bg-indigo-100 text-indigo-700'
            }`}>{event.status}</span>
          </div>
          <h1 className={`text-3xl md:text-4xl font-black uppercase tracking-tighter ${event.image ? 'text-white' : 'text-slate-900'} leading-tight`}>{event.title}</h1>
        </div>

        {/* QUICK STATS BAR */}
        <div className="grid grid-cols-2 md:grid-cols-5 divide-x divide-slate-100 border-t border-slate-100 bg-slate-50/50">
          {[
            { icon: Calendar, label: 'Date', value: event.date },
            { icon: Clock, label: 'Time', value: `${event.time}${event.endTime ? `-${event.endTime}` : ''}` },
            { icon: MapPin, label: event.venue ? 'Venue' : 'Platform', value: event.venue || event.location },
            { icon: Users, label: 'Registered', value: `${confirmedCount}${event.capacity ? `/${event.capacity}` : ''}` },
            { icon: Clock3, label: 'Duration', value: event.duration || 'TBD' },
          ].map((stat, i) => (
            <div key={i} className="p-4 md:p-5 text-center">
              <stat.icon size={14} className={`mx-auto mb-1.5 ${event.image ? 'text-white/60' : 'text-slate-400'}`} />
              <p className={`text-[8px] font-black uppercase tracking-widest ${event.image ? 'text-white/50' : 'text-slate-400'}`}>{stat.label}</p>
              <p className={`text-xs font-bold mt-0.5 ${event.image ? 'text-white' : 'text-slate-800'}`}>{stat.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ACTION BUTTONS ROW */}
      <div className="flex flex-wrap items-center gap-2">
        {!user?.role || user.role === 'student' ? (
          isRegistered ? (
            <button onClick={handleUnregister} className="px-6 py-3 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-2">
              <XCircle size={14} /> Cancel Registration
            </button>
          ) : isOnWaitlist ? (
            <span className="px-6 py-3 bg-amber-50 text-amber-600 rounded-2xl text-[9px] font-black uppercase tracking-widest flex items-center gap-2">
              <Clock3 size={14} /> On Waitlist #{userWaitlistEntry?.position}
            </span>
          ) : !isFull ? (
            <button onClick={handleRegister} className="px-8 py-3 bg-brand-charcoal hover:bg-indigo-600 text-white rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all shadow-lg shadow-black/10 flex items-center gap-2">
              <CheckCircle2 size={14} /> Register Now
            </button>
          ) : event.waitlistLimit && event.waitlistLimit > 0 ? (
            <button onClick={handleJoinWaitlist} className="px-8 py-3 bg-amber-50 hover:bg-amber-100 text-amber-600 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-2">
              <Users size={14} /> Join Waitlist
            </button>
          ) : null
        ) : null}
        {event.meetingLink && event.meetingLink !== '#' && (
          <a href={event.meetingLink} target="_blank" rel="noopener noreferrer" className="px-6 py-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-2">
            <Video size={14} /> Join Meeting
          </a>
        )}
        <button onClick={handleAddToCalendar} className="px-5 py-3 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-2">
          <Calendar size={14} /> Add to Calendar
        </button>
        <button onClick={handleCopyLink} className="px-5 py-3 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-2">
          <Copy size={14} /> Copy Link
        </button>
        <button onClick={handleBookmarkToggle} className={`px-5 py-3 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${bookmarked ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-50 hover:bg-slate-100 text-slate-600'}`}>
          {bookmarked ? <BookmarkCheck size={14} /> : <Bookmark size={14} />} {bookmarked ? 'Bookmarked' : 'Bookmark'}
        </button>
        <div className="relative">
          <button onClick={() => setShowShareMenu(!showShareMenu)} onBlur={() => setTimeout(() => setShowShareMenu(false), 200)} className="px-5 py-3 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-2">
            <Share2 size={14} /> Share
          </button>
          {showShareMenu && (
            <div className="absolute bottom-full mb-2 left-0 bg-white rounded-2xl border border-slate-100 shadow-lg p-2 min-w-[180px] z-10">
              <button onClick={handleShare} className="w-full flex items-center gap-2 px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 transition-all">
                <Share2 size={14} /> Share via...
              </button>
              <button onClick={() => { handleCopyLink(); setShowShareMenu(false); }} className="w-full flex items-center gap-2 px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 transition-all">
                <Copy size={14} /> Copy Link
              </button>
            </div>
          )}
        </div>
        {onEdit && (
          <button onClick={() => onEdit(event)} className="px-5 py-3 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all">
            Edit Event
          </button>
        )}
      </div>

      {/* CONTENT TABS */}
      <div className="flex gap-1 bg-slate-50 rounded-2xl p-1 overflow-x-auto">
        {[
          { id: 'overview', label: 'Overview' },
          { id: 'agenda', label: 'Agenda' },
          { id: 'speakers', label: 'Speakers' },
          { id: 'resources', label: 'Resources' },
          { id: 'faqs', label: 'FAQs' },
          { id: 'discussion', label: 'Discussion' },
          { id: 'feedback', label: 'Feedback' },
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveSection(tab.id)}
            className={`px-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${
              activeSection === tab.id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-700'
            }`}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* OVERVIEW TAB */}
      {activeSection === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-900 mb-4">About This Event</h3>
              <p className="text-sm text-slate-600 font-medium leading-relaxed whitespace-pre-wrap">{event.description}</p>
              {event.requirements && (
                <div className="mt-6 p-4 bg-amber-50 rounded-2xl border border-amber-100">
                  <p className="text-[9px] font-black uppercase tracking-widest text-amber-700 mb-2">Requirements / Prerequisites</p>
                  <p className="text-xs text-amber-800 font-medium">{event.requirements}</p>
                </div>
              )}
            </div>
            {event.tags && (
              <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm">
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-900 mb-4">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {event.tags.split(',').map((tag, i) => (
                    <span key={i} className="px-4 py-1.5 bg-slate-50 text-slate-600 rounded-full text-[10px] font-bold uppercase tracking-wider">{tag.trim()}</span>
                  ))}
                </div>
              </div>
            )}
            <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-900 mb-4">Registration Summary</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-indigo-50 rounded-2xl text-center">
                  <p className="text-2xl font-black text-indigo-600">{confirmedCount}</p>
                  <p className="text-[8px] font-black uppercase tracking-widest text-indigo-400 mt-1">Confirmed</p>
                </div>
                <div className="p-4 bg-emerald-50 rounded-2xl text-center">
                  <p className="text-2xl font-black text-emerald-600">{attendedCount}</p>
                  <p className="text-[8px] font-black uppercase tracking-widest text-emerald-400 mt-1">Attended</p>
                </div>
                <div className="p-4 bg-amber-50 rounded-2xl text-center">
                  <p className="text-2xl font-black text-amber-600">{waitlistCount}</p>
                  <p className="text-[8px] font-black uppercase tracking-widest text-amber-400 mt-1">Waitlist</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl text-center">
                  <p className="text-2xl font-black text-slate-600">{seatsLeft < 0 ? 0 : seatsLeft}</p>
                  <p className="text-[8px] font-black uppercase tracking-widest text-slate-400 mt-1">Seats Left</p>
                </div>
              </div>
            </div>
            {(event.registrations?.filter(r => r.status === 'confirmed').length || 0) > 0 && (
              <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm">
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-900 mb-4">Registered Students ({confirmedCount})</h3>
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {(event.registrations || []).filter(r => r.status === 'confirmed').slice(0, 50).map((reg) => (
                    <div key={reg.userId} className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-50">
                      <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-black text-xs shrink-0">
                        {reg.name?.charAt(0) || '?'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-slate-800 truncate">{reg.name}</p>
                        <p className="text-[9px] font-medium text-slate-400 truncate">{reg.email}</p>
                      </div>
                      <span className={`px-2.5 py-1 rounded-lg text-[7px] font-black uppercase tracking-widest ${
                        reg.attendanceStatus === 'attended' ? 'bg-emerald-100 text-emerald-700' :
                        reg.attendanceStatus === 'absent' ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-400'
                      }`}>
                        {reg.attendanceStatus || 'pending'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {(event.waitlist?.filter(w => w.status === 'waiting').length || 0) > 0 && (
              <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm">
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-900 mb-4">Waitlist ({waitlistCount})</h3>
                <div className="space-y-2 max-h-[200px] overflow-y-auto">
                  {(event.waitlist || []).filter(w => w.status === 'waiting').slice(0, 20).map((entry) => (
                    <div key={entry.id} className="flex items-center gap-3 p-3 bg-amber-50 rounded-2xl border border-amber-50">
                      <div className="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 font-black text-xs shrink-0">
                        #{entry.position}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-slate-800 truncate">{entry.name || 'Student'}</p>
                        <p className="text-[9px] font-medium text-slate-400">{entry.email}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="space-y-6">
            <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm space-y-5">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-900">Event Details</h3>
              <div className="space-y-4">
                {[
                  { icon: Calendar, label: 'Date', value: event.date },
                  { icon: Clock, label: 'Time', value: `${event.time} ${event.timezone ? `(${event.timezone})` : ''}` },
                  { icon: Clock3, label: 'Duration', value: event.duration || '—' },
                  { icon: MapPin, label: 'Platform', value: `${event.location}${event.venue ? ` • ${event.venue}` : ''}` },
                  { icon: User, label: 'Host', value: event.speaker || '—' },
                  { icon: Shield, label: 'Visibility', value: event.visibility || 'public' },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <item.icon size={14} className="text-indigo-500 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-[8px] font-black uppercase tracking-widest text-slate-400">{item.label}</p>
                      <p className="text-xs font-bold text-slate-800">{item.value}</p>
                    </div>
                  </div>
                ))}
                {event.meetingLink && (
                  <a href={event.meetingLink} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-3 bg-indigo-50 rounded-2xl text-indigo-600 text-xs font-bold hover:bg-indigo-100 transition-all">
                    <ExternalLink size={14} /> Join Meeting
                  </a>
                )}
              </div>
            </div>
            <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-900">Activity Log</h3>
              </div>
              <div className="space-y-3 max-h-[300px] overflow-y-auto">
                {(event.activityLog || []).slice(0, 10).map((act) => (
                  <div key={act.id} className="flex items-start gap-3 text-xs">
                    <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center shrink-0 mt-0.5">
                      <div className={`w-2 h-2 rounded-full ${act.action === 'registration' ? 'bg-emerald-500' : act.action === 'cancellation' ? 'bg-rose-500' : act.action === 'attendance' ? 'bg-indigo-500' : 'bg-slate-400'}`} />
                    </div>
                    <div>
                      <p className="font-bold text-slate-700">{act.description || act.action}</p>
                      <p className="text-[10px] text-slate-400 font-medium">{new Date(act.createdAt).toLocaleString()}</p>
                    </div>
                  </div>
                ))}
                {(!event.activityLog || event.activityLog.length === 0) && (
                  <p className="text-center text-[10px] font-bold text-slate-300 py-4">No activity yet</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AGENDA TAB */}
      {activeSection === 'agenda' && (
        <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm">
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-900 mb-6">Event Agenda</h3>
          {(event.agenda || []).length === 0 ? (
            <p className="text-center py-16 text-[10px] font-bold text-slate-300 uppercase tracking-widest">No agenda items defined</p>
          ) : (
            <div className="space-y-0">
              {event.agenda!.map((item, i) => (
                <div key={i} className="flex gap-4 pb-6 last:pb-0">
                  <div className="flex flex-col items-center">
                    <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-black text-xs">{i + 1}</div>
                    {i < (event.agenda?.length || 0) - 1 && <div className="w-0.5 flex-1 bg-indigo-100 mt-2" />}
                  </div>
                  <div className="flex-1 pt-1.5">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{item.time || 'TBD'}</span>
                      <span className="text-sm font-black text-slate-900">{item.title}</span>
                    </div>
                    {item.description && <p className="text-xs text-slate-500 mt-1">{item.description}</p>}
                    {item.speaker && <p className="text-[10px] text-indigo-600 font-bold mt-1">{item.speaker}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SPEAKERS TAB */}
      {activeSection === 'speakers' && (
        <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm">
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-900 mb-6">Speakers</h3>
          {(event.speakers || []).length === 0 && !event.speaker ? (
            <p className="text-center py-16 text-[10px] font-bold text-slate-300 uppercase tracking-widest">No speakers listed</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(event.speakers || []).map((s) => (
                <div key={s.id} className="flex items-start gap-4 p-5 bg-slate-50 rounded-2xl border border-slate-100">
                  {s.avatarUrl ? <img src={s.avatarUrl} alt={s.name} className="w-14 h-14 rounded-full object-cover shrink-0" /> :
                    <div className="w-14 h-14 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-black text-lg shrink-0">{s.name.charAt(0)}</div>}
                  <div>
                    <h4 className="text-sm font-black text-slate-900">{s.name}</h4>
                    {s.title && <p className="text-[10px] font-bold text-slate-500">{s.title}{s.company ? ` at ${s.company}` : ''}</p>}
                    {s.bio && <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">{s.bio}</p>}
                    {s.linkedinUrl && <a href={s.linkedinUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 mt-2 text-[10px] font-bold text-indigo-600 hover:underline"><Linkedin size={12} /> LinkedIn</a>}
                  </div>
                </div>
              ))}
              {event.speaker && (event.speakers || []).length === 0 && (
                <div className="flex items-center gap-4 p-5 bg-slate-50 rounded-2xl border border-slate-100 md:col-span-2">
                  <div className="w-14 h-14 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-black text-lg shrink-0">{event.speaker.charAt(0)}</div>
                  <div>
                    <h4 className="text-sm font-black text-slate-900">{event.speaker}</h4>
                    <p className="text-[10px] font-bold text-slate-500">Host / Speaker</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* RESOURCES TAB */}
      {activeSection === 'resources' && (
        <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm">
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-900 mb-6">Resources & Attachments</h3>
          {(event.files || []).length === 0 ? (
            <p className="text-center py-16 text-[10px] font-bold text-slate-300 uppercase tracking-widest">No resources available</p>
          ) : (
            <div className="space-y-3">
              {event.files!.map((f) => {
                const FileIcon = fileTypeIcons[f.type] || FileText;
                return (
                  <div key={f.id} className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:bg-slate-100 transition-all">
                    <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0">
                      <FileIcon size={18} className="text-indigo-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-800 truncate">{f.name}</p>
                      {f.size && <p className="text-[10px] font-medium text-slate-400">{f.size}</p>}
                    </div>
                    <a href={f.url} target="_blank" rel="noopener noreferrer" className="px-4 py-2 bg-white border border-slate-200 hover:border-black rounded-xl text-[8px] font-black uppercase tracking-widest text-slate-600 hover:text-black transition-all flex items-center gap-1.5 shrink-0">
                      <Download size={12} /> Download
                    </a>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* FAQS TAB */}
      {activeSection === 'faqs' && (
        <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm">
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-900 mb-6">Frequently Asked Questions</h3>
          {[0, 1, 2, 3].every(i => false) ? null : (
            <div className="space-y-3">
              {[
                { q: 'Will this session be recorded?', a: 'Yes, all sessions are recorded and shared with registered attendees within 48 hours.' },
                { q: 'Is there a certificate of participation?', a: 'Certificates are provided for attendees who complete the full session and submit feedback.' },
                { q: 'Can I join late if I have a conflict?', a: 'Yes, you can join at any time. The recording will be available afterward.' },
              ].map((faq, i) => (
                <div key={i} className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-black text-[10px] shrink-0 mt-0.5">?</span>
                    <div>
                      <p className="text-sm font-bold text-slate-900">{faq.q}</p>
                      <p className="text-xs text-slate-600 mt-1 font-medium leading-relaxed">{faq.a}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* DISCUSSION TAB */}
      {activeSection === 'discussion' && (
        <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm space-y-6">
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-900">Discussion</h3>
          {user && (
            <div className="flex gap-3">
              <input type="text" placeholder="Ask a question or share a comment..." value={comment} onChange={e => setComment(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && comment.trim()) handleAddComment(); }}
                className="flex-1 px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-medium outline-none focus:border-black transition-all" />
              <button onClick={handleAddComment} disabled={!comment.trim()}
                className="px-6 py-3.5 bg-black text-white rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all disabled:opacity-50">
                Send
              </button>
            </div>
          )}
          <div className="space-y-4 max-h-[600px] overflow-y-auto">
            {(event.comments || []).filter(c => !c.parentId).map((c) => renderComment(c))}
            {(!event.comments || event.comments.length === 0) && (
              <p className="text-center py-12 text-[10px] font-bold text-slate-300 uppercase tracking-widest">No discussion yet. Be the first to comment!</p>
            )}
          </div>
        </div>
      )}

      {/* FEEDBACK TAB */}
      {activeSection === 'feedback' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-900 mb-4">Submit Feedback</h3>
            {hasFeedback ? (
              <div className="p-6 bg-emerald-50 rounded-2xl border border-emerald-100 text-center">
                <CheckCircle2 size={32} className="mx-auto text-emerald-500 mb-3" />
                <p className="text-sm font-bold text-emerald-700">Feedback Submitted</p>
                <p className="text-[10px] text-emerald-600 mt-1">Thank you for your feedback!</p>
              </div>
            ) : user ? (
              <div className="space-y-5">
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-3">Rating</p>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map(r => (
                      <button key={r} onClick={() => setFeedbackRating(r)}
                        className={`w-12 h-12 rounded-2xl text-lg font-black transition-all ${
                          r <= feedbackRating ? 'bg-amber-400 text-white scale-110' : 'bg-slate-100 text-slate-300 hover:bg-slate-200'
                        }`}>
                        ★
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2">Comments</p>
                  <textarea rows={4} placeholder="What did you think of this event?" value={feedbackComment} onChange={e => setFeedbackComment(e.target.value)}
                    className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-medium outline-none focus:border-black transition-all resize-none" />
                </div>
                <button onClick={handleSubmitFeedback} disabled={feedbackRating === 0 || submittingFeedback}
                  className="w-full py-3.5 bg-brand-charcoal text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 transition-all disabled:opacity-50">
                  {submittingFeedback ? 'Submitting...' : 'Submit Feedback'}
                </button>
              </div>
            ) : (
              <p className="text-center py-8 text-[10px] font-bold text-slate-400">Sign in to submit feedback</p>
            )}
          </div>
          <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-900 mb-4">Feedback Summary</h3>
            {(event.feedbacks || []).length === 0 ? (
              <p className="text-center py-12 text-[10px] font-bold text-slate-300 uppercase tracking-widest">No feedback yet</p>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-4 bg-indigo-50 rounded-2xl">
                  <span className="text-3xl font-black text-indigo-600">
                    {(event.feedbacks || []).reduce((a, f) => a + f.rating, 0) / (event.feedbacks?.length || 1) || 0}
                  </span>
                  <div>
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map(r => (
                        <span key={r} className={`text-sm ${r <= Math.round((event.feedbacks || []).reduce((a, f) => a + f.rating, 0) / (event.feedbacks?.length || 1)) ? 'text-amber-400' : 'text-slate-200'}`}>★</span>
                      ))}
                    </div>
                    <p className="text-[10px] font-bold text-indigo-400 mt-0.5">{event.feedbacks?.length} reviews</p>
                  </div>
                </div>
                {(event.feedbacks || []).map((f) => (
                  <div key={f.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-slate-700">{f.studentName}</span>
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map(r => <span key={r} className={`text-[10px] ${r <= f.rating ? 'text-amber-400' : 'text-slate-200'}`}>★</span>)}
                      </div>
                    </div>
                    <p className="text-xs text-slate-600">{f.comment}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default EventDetailView;
