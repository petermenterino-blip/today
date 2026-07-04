import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  Calendar, Clock3, MapPin, Users, User, Video, Plus, Minus, CalendarPlus,
} from 'lucide-react';
import { NetworkEvent } from '../../types';
import { eventService } from '../../services/eventService';
import { eventRsvpService } from '../../services/eventRsvpService';
import { notificationStorage } from '../../services/notificationStorage';
import { notifySuccess, notifyError } from '../../utils/toast';

const EVENT_TYPE_COLORS: Record<string, string> = {
  Workshop: 'bg-indigo-100 text-indigo-700',
  Webinar: 'bg-blue-100 text-blue-700',
  Bootcamp: 'bg-emerald-100 text-emerald-700',
  'AMA Session': 'bg-amber-100 text-amber-700',
  'Group Mentoring': 'bg-purple-100 text-purple-700',
  'Networking Event': 'bg-cyan-100 text-cyan-700',
  'Office Hours': 'bg-slate-100 text-slate-700',
  'Interview Session': 'bg-rose-100 text-rose-700',
  'Career Talk': 'bg-teal-100 text-teal-700',
  'Alumni Talk': 'bg-violet-100 text-violet-700',
  'Live Coding': 'bg-orange-100 text-orange-700',
  'Mock Interview': 'bg-pink-100 text-pink-700',
  Hackathon: 'bg-lime-100 text-lime-700',
  Assessment: 'bg-yellow-100 text-yellow-700',
  'Guest Lecture': 'bg-sky-100 text-sky-700',
  'Community Meetup': 'bg-gray-100 text-gray-700',
};

interface StudentEventsProps {
  events: NetworkEvent[];
  loading: boolean;
  currentUserId: string;
  onAttend: (eventId: string, userId: string) => Promise<void>;
}

function isLive(event: NetworkEvent): boolean {
  if (event.status !== 'published') return false;
  const today = new Date().toISOString().split('T')[0];
  const now = new Date().toTimeString().slice(0, 5);
  return event.date === today && event.time <= now && (!event.endTime || now <= event.endTime);
}

function isRegistered(event: NetworkEvent, userId: string): boolean {
  if (event.attendees?.includes(userId)) return true;
  if (event.registrations?.some(r => r.userId === userId && r.status === 'confirmed')) return true;
  return false;
}

function getConfirmedCount(event: NetworkEvent): number {
  if (event.registrations) return event.registrations.filter(r => r.status === 'confirmed').length;
  return event.attendees?.length || 0;
}

function isFull(event: NetworkEvent): boolean {
  if (!event.capacity) return false;
  return getConfirmedCount(event) >= event.capacity;
}

function isOnWaitlist(event: NetworkEvent, userId: string): boolean {
  return event.waitlist?.some(w => w.userId === userId && w.status === 'waiting') || false;
}

function getWaitlistCount(event: NetworkEvent): number {
  return event.waitlist?.filter(w => w.status === 'waiting').length || 0;
}

function generateIcs(event: NetworkEvent): string {
  const fmt = (d: Date) =>
    d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  const start = new Date(`${event.date}T${event.time}`);
  const end = event.endTime
    ? new Date(`${event.date}T${event.endTime}`)
    : new Date(start.getTime() + 60 * 60 * 1000);
  const escaped = (s: string) => s.replace(/[;,\\n]/g, '\\$&');
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//StudentEvents//EN',
    'BEGIN:VEVENT',
    `DTSTART:${fmt(start)}`,
    `DTEND:${fmt(end)}`,
    `SUMMARY:${escaped(event.title)}`,
    `DESCRIPTION:${escaped(event.description || '')}`,
    `LOCATION:${escaped(event.location || event.venue || '')}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
}

function downloadIcs(event: NetworkEvent) {
  const blob = new Blob([generateIcs(event)], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${event.title.replace(/[^a-z0-9]/gi, '_')}.ics`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  notifySuccess('Calendar event added!');
}

const StudentEvents: React.FC<StudentEventsProps> = ({ events, loading, currentUserId, onAttend }) => {
  const [pendingEvents, setPendingEvents] = useState<Set<string>>(new Set());

  const handleRegister = async (e: React.MouseEvent, event: NetworkEvent) => {
    e.stopPropagation();
    if (pendingEvents.has(event.id)) return;
    setPendingEvents(prev => new Set(prev).add(event.id));
    try {
      await (onAttend as any)(event.id, currentUserId);
      await notificationStorage.create({
        userId: currentUserId,
        title: 'Event Registration',
        message: `You have registered for "${event.title}"`,
        type: 'event',
      });
      notifySuccess('You are now registered for this event!');
    } catch {
      notifyError('Something went wrong. Please try again.');
    } finally {
      setPendingEvents(prev => { const n = new Set(prev); n.delete(event.id); return n; });
    }
  };

  const handleUnregister = async (e: React.MouseEvent, event: NetworkEvent) => {
    e.stopPropagation();
    if (pendingEvents.has(event.id)) return;
    setPendingEvents(prev => new Set(prev).add(event.id));
    try {
      await eventRsvpService.unregister(event.id, currentUserId);
      await notificationStorage.create({
        userId: currentUserId,
        title: 'Registration Cancelled',
        message: `You have unregistered from "${event.title}"`,
        type: 'event',
      });
      notifySuccess('You have been unregistered from this event');
    } catch {
      notifyError('Something went wrong. Please try again.');
    } finally {
      setPendingEvents(prev => { const n = new Set(prev); n.delete(event.id); return n; });
    }
  };

  const handleJoinWaitlist = async (e: React.MouseEvent, event: NetworkEvent) => {
    e.stopPropagation();
    if (pendingEvents.has(event.id)) return;
    setPendingEvents(prev => new Set(prev).add(event.id));
    try {
      await eventService.joinWaitlist(event.id, currentUserId);
      notifySuccess('You have joined the waitlist!');
    } catch {
      notifyError('Something went wrong. Please try again.');
    } finally {
      setPendingEvents(prev => { const n = new Set(prev); n.delete(event.id); return n; });
    }
  };

  const handleLeaveWaitlist = async (e: React.MouseEvent, event: NetworkEvent) => {
    e.stopPropagation();
    if (pendingEvents.has(event.id)) return;
    setPendingEvents(prev => new Set(prev).add(event.id));
    try {
      await eventService.leaveWaitlist(event.id, currentUserId);
      notifySuccess('You have left the waitlist');
    } catch {
      notifyError('Something went wrong. Please try again.');
    } finally {
      setPendingEvents(prev => { const n = new Set(prev); n.delete(event.id); return n; });
    }
  };

  const handleJoinMeeting = (e: React.MouseEvent, meetingLink: string) => {
    e.stopPropagation();
    window.open(meetingLink, '_blank');
  };

  const handleAddToCalendar = (e: React.MouseEvent, event: NetworkEvent) => {
    e.stopPropagation();
    downloadIcs(event);
  };

  if (loading) {
    return (
      <div className="py-16 text-center">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-4">Loading events...</p>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="py-16 text-center border-2 border-dashed border-slate-200 rounded-[32px] bg-slate-50 mt-4">
        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300 shadow-sm">
          <Calendar size={24} />
        </div>
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">No events available</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {events.map((event, i) => {
        const attending = isRegistered(event, currentUserId);
        const live = isLive(event);
        const full = isFull(event);
        const onWaitlist = isOnWaitlist(event, currentUserId);
        const waitlistCount = getWaitlistCount(event);
        const confirmedCount = getConfirmedCount(event);
        const isLoading = pendingEvents.has(event.id);

        const [day, month] = event.date ? event.date.split('-').slice(-2) : ['', ''];

        const statusBadge = live
          ? { class: 'bg-emerald-500 text-white', label: 'Live' }
          : event.status === 'cancelled'
            ? { class: 'bg-rose-100 text-rose-700', label: 'Cancelled' }
            : event.status === 'completed'
              ? { class: 'bg-indigo-100 text-indigo-700', label: 'Completed' }
              : { class: 'bg-indigo-100 text-indigo-700', label: 'Upcoming' };

        const typeColor = EVENT_TYPE_COLORS[event.eventType || 'Workshop'] || 'bg-indigo-100 text-indigo-700';

        return (
          <motion.div
            key={event.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="relative overflow-hidden bg-white p-4 sm:p-5 rounded-[32px] border border-slate-100 hover:shadow-xl transition-all duration-300 group"
          >
            <div
              className={`absolute left-0 top-0 bottom-0 w-[3px] rounded-r-sm transition-colors duration-300 ${attending ? 'bg-emerald-500' : 'bg-indigo-500'}`}
            />

            <div className="flex gap-4 pl-3">
              <div className="flex flex-col items-center justify-center shrink-0 w-14 h-14 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-[16px] font-black text-slate-800 leading-none">{day}</span>
                <span className="text-[8px] font-black uppercase tracking-widest text-slate-400 mt-0.5">{month}</span>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
                  <span className={`px-2.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest ${typeColor}`}>
                    {event.eventType || 'Workshop'}
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest ${statusBadge.class}`}>
                    {live && <span className="inline-block w-1.5 h-1.5 bg-white rounded-full animate-pulse mr-1 align-middle" />}
                    {statusBadge.label}
                  </span>
                  {attending && (
                    <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-600 rounded-full text-[8px] font-black uppercase tracking-widest">
                      Registered
                    </span>
                  )}
                  {onWaitlist && (
                    <span className="px-2.5 py-0.5 bg-amber-50 text-amber-600 rounded-full text-[8px] font-black uppercase tracking-widest">
                      Waitlisted
                    </span>
                  )}
                </div>

                <h3 className="text-sm font-black uppercase tracking-tight text-slate-900 leading-tight truncate">
                  {event.title}
                </h3>

                <p className="text-[11px] text-slate-500 font-medium leading-relaxed line-clamp-2 mt-0.5">
                  {event.description}
                </p>

                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-[10px] font-bold text-slate-500">
                  <span className="inline-flex items-center gap-1">
                    <Clock3 size={11} className="text-slate-400 shrink-0" />
                    {event.time}{event.endTime ? ` - ${event.endTime}` : ''}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <MapPin size={11} className="text-slate-400 shrink-0" />
                    <span className="truncate max-w-[160px]">{event.venue || event.location || event.meetingPlatform || 'Online'}</span>
                  </span>
                  {event.speaker && (
                    <span className="inline-flex items-center gap-1">
                      <User size={11} className="text-slate-400 shrink-0" />
                      {event.speaker}
                    </span>
                  )}
                </div>

                {event.capacity && (
                  <div className="flex items-center gap-2 mt-2 text-[10px] font-bold text-slate-500">
                    <Users size={11} className="text-slate-400 shrink-0" />
                    <span>{confirmedCount} / {event.capacity} registered</span>
                    <div className="flex-1 max-w-[80px] h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${full ? 'bg-rose-500' : confirmedCount / event.capacity >= 0.8 ? 'bg-amber-500' : 'bg-emerald-400'}`}
                        style={{ width: `${Math.max((confirmedCount / event.capacity) * 100, 2)}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 mt-3 pl-[72px] pt-3 border-t border-slate-50">
              {live && event.meetingLink && (
                <button
                  onClick={(e) => handleJoinMeeting(e, event.meetingLink!)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all"
                >
                  <Video size={11} /> Join Meeting
                </button>
              )}

              <button
                onClick={(e) => handleAddToCalendar(e, event)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all"
              >
                <CalendarPlus size={11} /> Calendar
              </button>

              {attending ? (
                <button
                  onClick={(e) => handleUnregister(e, event)}
                  disabled={isLoading}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all disabled:opacity-50 ml-auto"
                >
                  <Minus size={11} /> {isLoading ? '...' : 'Unregister'}
                </button>
              ) : onWaitlist ? (
                <button
                  onClick={(e) => handleLeaveWaitlist(e, event)}
                  disabled={isLoading}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-amber-50 hover:bg-amber-100 text-amber-600 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all disabled:opacity-50 ml-auto"
                >
                  <Minus size={11} /> {isLoading ? '...' : 'Leave Waitlist'}
                </button>
              ) : full && event.waitlistLimit ? (
                <button
                  onClick={(e) => handleJoinWaitlist(e, event)}
                  disabled={isLoading}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-amber-50 hover:bg-amber-100 text-amber-600 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all disabled:opacity-50 ml-auto"
                >
                  <Users size={11} /> {isLoading ? '...' : 'Join Waitlist'}
                </button>
              ) : (
                <button
                  onClick={(e) => handleRegister(e, event)}
                  disabled={isLoading}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-brand-charcoal hover:bg-indigo-600 text-white rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all disabled:opacity-50 shadow-lg shadow-black/5 ml-auto"
                >
                  <Plus size={11} /> {isLoading ? '...' : 'Register'}
                </button>
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};

export default StudentEvents;
