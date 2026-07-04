import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'motion/react';
import {
  Calendar, Clock, MapPin, Users, User, Tag, AlertTriangle, Bookmark,
  Share2, Copy, ExternalLink, QrCode, Video, Hourglass, Star,
} from 'lucide-react';
import { NetworkEvent } from '../../types';
import { notifySuccess } from '../../utils/toast';

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

const STATUS_BADGES: Record<string, { class: string; label: string }> = {
  published: { class: 'bg-emerald-100 text-emerald-700', label: 'Upcoming' },
  draft: { class: 'bg-slate-100 text-slate-600', label: 'Draft' },
  cancelled: { class: 'bg-rose-100 text-rose-700', label: 'Cancelled' },
  completed: { class: 'bg-indigo-100 text-indigo-700', label: 'Completed' },
};

function isLive(event: NetworkEvent): boolean {
  if (event.status !== 'published') return false;
  const today = new Date().toISOString().split('T')[0];
  const now = new Date().toTimeString().slice(0, 5);
  return event.date === today && event.time <= now && (!event.endTime || now <= event.endTime);
}

function getSeatsLeft(event: NetworkEvent): number {
  const cap = event.capacity || Infinity;
  const registered = event.registrations?.filter(r => r.status === 'confirmed').length || 0;
  return cap - registered;
}

function getCountdown(event: NetworkEvent): { text: string; isLive: boolean; isEnded: boolean } {
  const now = new Date();
  const eventStart = new Date(`${event.date}T${event.time}`);
  const diff = eventStart.getTime() - now.getTime();
  if (isLive(event)) return { text: 'Live', isLive: true, isEnded: false };
  if (diff <= 0) return { text: 'Ended', isLive: false, isEnded: true };
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  if (days > 0) return { text: `Starts in ${days}d ${hours}h`, isLive: false, isEnded: false };
  return { text: `Starts in ${hours}h`, isLive: false, isEnded: false };
}

function getCapacityPercent(event: NetworkEvent): number {
  const cap = event.capacity || 1;
  const registered = event.registrations?.filter(r => r.status === 'confirmed').length || 0;
  return Math.min((registered / cap) * 100, 100);
}

function getCapacityColor(pct: number): string {
  if (pct >= 100) return 'bg-rose-500';
  if (pct >= 80) return 'bg-amber-500';
  if (pct >= 50) return 'bg-yellow-400';
  return 'bg-emerald-400';
}

interface EventCardProps {
  event: NetworkEvent;
  currentUserId?: string;
  isMentor?: boolean;
  onClick?: () => void;
  onRegister?: () => void;
  onUnregister?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onDuplicate?: () => void;
  onArchive?: () => void;
  onRestore?: () => void;
  onToggleBookmark?: () => void;
  isPending?: boolean;
  isRegistered?: boolean;
  isBookmarked?: boolean;
}

const EventCard: React.FC<EventCardProps> = ({
  event, currentUserId, isMentor, onClick, onRegister, onUnregister,
  onEdit, onDelete, onDuplicate, onArchive, onRestore, onToggleBookmark, isPending, isRegistered, isBookmarked,
}) => {
  const [showQr, setShowQr] = useState(false);
  const [countdown, setCountdown] = useState(() => getCountdown(event));

  useEffect(() => {
    const timer = setInterval(() => setCountdown(getCountdown(event)), 60000);
    return () => clearInterval(timer);
  }, [event]);

  const live = isLive(event);
  const seatsLeft = getSeatsLeft(event);
  const isAlmostFull = event.capacity && seatsLeft <= Math.ceil(event.capacity * 0.2) && seatsLeft > 0;
  const isFull = event.capacity && seatsLeft <= 0;
  const waitlistCount = event.waitlist?.filter(w => w.status === 'waiting').length || 0;
  const confirmedCount = event.registrations?.filter(r => r.status === 'confirmed').length || 0;
  const capacityPct = getCapacityPercent(event);

  const handleCopyInvite = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    const url = `${window.location.origin}/#/events/${event.id}`;
    navigator.clipboard.writeText(url);
    notifySuccess('Invite link copied!');
  }, [event.id]);

  const handleShare = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (navigator.share) {
      navigator.share({ title: event.title, text: event.description, url: `${window.location.origin}/#/events/${event.id}` });
    } else {
      handleCopyInvite(e);
    }
  }, [event, handleCopyInvite]);

  const handleBookmark = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleBookmark?.();
  }, [onToggleBookmark]);

  const handleQr = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setShowQr(true);
  }, []);

  const handleJoinMeeting = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (event.meetingLink) window.open(event.meetingLink, '_blank');
  }, [event.meetingLink]);

  const typeColor = EVENT_TYPE_COLORS[event.eventType || event.category || 'Workshop'] || 'bg-indigo-100 text-indigo-700';

  const statusBadge = event.archived ? { class: 'bg-slate-200 text-slate-600', label: 'Archived' } :
    isFull ? { class: 'bg-rose-100 text-rose-700', label: 'Full' } :
    live ? { class: 'bg-emerald-500 text-white', label: '\u25CF Live' } :
    event.status === 'completed' ? { class: 'bg-indigo-100 text-indigo-700', label: 'Completed' } :
    STATUS_BADGES[event.status || 'draft'];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-[32px] border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden group cursor-pointer"
      onClick={onClick}
    >
      {event.image ? (
        <div className="relative h-44 sm:h-52 overflow-hidden">
          <img src={event.image} alt={event.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />
          {event.featured && (
            <div className="absolute top-3 left-3 px-3 py-1 bg-amber-400 text-amber-900 text-[8px] font-black uppercase tracking-widest rounded-full shadow-lg flex items-center gap-1">
              <Star size={10} /> Featured
            </div>
          )}
          <div className="absolute top-3 right-3 flex gap-1.5 flex-wrap justify-end">
            <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest shadow-lg ${statusBadge.class}`}>
              {live && <span className="inline-block w-1.5 h-1.5 bg-white rounded-full animate-pulse mr-1 align-middle" />}
              {statusBadge.label}
            </span>
          </div>
          {countdown.isLive && event.meetingLink && (
            <div className="absolute bottom-3 right-3">
              <button
                onClick={handleJoinMeeting}
                className="px-3 py-1.5 bg-white/90 hover:bg-white text-emerald-700 rounded-full text-[8px] font-black uppercase tracking-widest shadow-lg flex items-center gap-1.5 transition-all"
              >
                <Video size={12} /> Join Meeting
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="relative h-2 w-full" style={{ background: event.eventColor || 'linear-gradient(135deg, #6366f1, #8b5cf6)' }} />
      )}

      <div className="p-5 space-y-3.5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-1.5 mb-2">
              <span className={`px-2.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest ${typeColor}`}>
                {event.eventType || event.category || 'Workshop'}
              </span>
              {isAlmostFull && !isFull && (
                <span className="px-2.5 py-0.5 bg-rose-50 text-rose-600 rounded-full text-[8px] font-black uppercase tracking-widest flex items-center gap-1">
                  <AlertTriangle size={10} /> Almost Full
                </span>
              )}
              {waitlistCount > 0 && (
                <span className="px-2.5 py-0.5 bg-amber-50 text-amber-600 rounded-full text-[8px] font-black uppercase tracking-widest">
                  Waitlist {waitlistCount}
                </span>
              )}
            </div>
            {!event.image && (
              <div className="flex flex-wrap items-center gap-1.5 mb-2">
                <span className={`px-2.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest ${statusBadge.class}`}>
                  {live && <span className="inline-block w-1.5 h-1.5 bg-white rounded-full animate-pulse mr-1 align-middle" />}
                  {statusBadge.label}
                </span>
                {event.featured && (
                  <span className="px-2.5 py-0.5 bg-amber-100 text-amber-700 rounded-full text-[8px] font-black uppercase tracking-widest flex items-center gap-1">
                    <Star size={10} /> Featured
                  </span>
                )}
              </div>
            )}
            <h3 className="text-sm font-black uppercase tracking-tight text-slate-900 leading-tight line-clamp-2">{event.title}</h3>
          </div>
          {onToggleBookmark && (
            <button
              onClick={handleBookmark}
              className={`p-1.5 rounded-lg transition-all shrink-0 ${isBookmarked ? 'text-indigo-500 bg-indigo-50' : 'text-slate-300 hover:text-indigo-500 hover:bg-indigo-50'}`}
              title={isBookmarked ? 'Remove bookmark' : 'Bookmark'}
            >
              <Bookmark size={15} fill={isBookmarked ? 'currentColor' : 'none'} />
            </button>
          )}
        </div>

        {event.description && (
          <p className="text-[11px] text-slate-500 font-medium leading-relaxed line-clamp-2">{event.description}</p>
        )}

        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500">
            <Calendar size={12} className="text-slate-400 shrink-0" />
            <span>{event.date}</span>
            <span className="text-slate-300">{'\u2022'}</span>
            <Clock size={12} className="text-slate-400 shrink-0" />
            <span>{event.time}{event.endTime ? ` - ${event.endTime}` : ''}</span>
            {event.duration && (
              <>
                <span className="text-slate-300">{'\u2022'}</span>
                <Hourglass size={12} className="text-slate-400 shrink-0" />
                <span>{event.duration}</span>
              </>
            )}
          </div>

          <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500">
            <MapPin size={12} className="text-slate-400 shrink-0" />
            <span className="truncate">{event.venue || event.location || 'Online'}</span>
            {event.timezone && (
              <>
                <span className="text-slate-300">{'\u2022'}</span>
                <span className="text-[8px] uppercase tracking-wider shrink-0">{event.timezone}</span>
              </>
            )}
          </div>

          {event.meetingLink && !live && (
            <div className="flex items-center gap-2 text-[10px] font-bold text-indigo-500">
              <Video size={12} className="shrink-0" />
              <span className="truncate">{event.meetingPlatform || 'Meeting'}: {event.meetingLink}</span>
            </div>
          )}

          {event.speaker && (
            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500">
              <User size={12} className="text-slate-400 shrink-0" />
              <span>{event.speaker}</span>
            </div>
          )}

          {event.programId && (
            <div className="flex items-center gap-2 text-[10px] font-bold text-indigo-500">
              <Tag size={12} className="shrink-0" />
              <span>Program: {event.programId}</span>
            </div>
          )}
        </div>

        <div className="space-y-2">
          {event.capacity && (
            <div>
              <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 mb-1.5">
                <span className="flex items-center gap-1"><Users size={12} /> {confirmedCount}/{event.capacity}</span>
                <span className={`${capacityPct >= 80 ? 'text-amber-600' : capacityPct >= 100 ? 'text-rose-600' : 'text-slate-400'}`}>
                  {Math.round(capacityPct)}% full
                </span>
              </div>
              <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${getCapacityColor(capacityPct)}`}
                  style={{ width: `${Math.max(capacityPct, 2)}%` }}
                />
              </div>
            </div>
          )}

          {!countdown.isEnded && !countdown.isLive && (
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-indigo-600 bg-indigo-50 rounded-lg px-2.5 py-1.5">
              <Clock size={12} />
              <span>{countdown.text}</span>
            </div>
          )}
          {countdown.isLive && (
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-600 bg-emerald-50 rounded-lg px-2.5 py-1.5">
              <span className="inline-block w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              <span>Live now</span>
            </div>
          )}
          {countdown.isEnded && (
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 bg-slate-50 rounded-lg px-2.5 py-1.5">
              <span>Event ended</span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-slate-50">
          <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400">
            <span className="flex items-center gap-1"><Users size={12} /> {confirmedCount}{event.capacity ? `/${event.capacity}` : ''}</span>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={handleQr} className="p-1.5 text-slate-300 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-all" title="QR Check-in">
              <QrCode size={13} />
            </button>
            <button onClick={handleCopyInvite} className="p-1.5 text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all" title="Copy invite link">
              <Copy size={13} />
            </button>
            <button onClick={handleShare} className="p-1.5 text-slate-300 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all" title="Share event">
              <Share2 size={13} />
            </button>
          </div>
        </div>

        {event.tags && (
          <div className="flex flex-wrap gap-1.5">
            {event.tags.split(',').map((tag, i) => (
              <span key={i} className="px-2 py-0.5 bg-slate-50 text-slate-500 rounded-full text-[7px] font-bold uppercase tracking-widest">{tag.trim()}</span>
            ))}
          </div>
        )}

        <div className="flex gap-2 pt-1 flex-wrap">
          {live && event.meetingLink && (
            <button
              onClick={handleJoinMeeting}
              className="flex-1 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-1.5"
            >
              <Video size={12} /> Join Meeting
            </button>
          )}
          {!isMentor && currentUserId && (
            isRegistered ? (
              <button
                onClick={(e) => { e.stopPropagation(); onUnregister?.(); }}
                disabled={isPending}
                className="flex-1 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all disabled:opacity-50"
              >
                {isPending ? '...' : 'Cancel Registration'}
              </button>
            ) : (
              !isFull ? (
                <button
                  onClick={(e) => { e.stopPropagation(); onRegister?.(); }}
                  disabled={isPending}
                  className="flex-1 py-2.5 bg-brand-charcoal hover:bg-indigo-600 text-white rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all disabled:opacity-50 shadow-lg shadow-black/5"
                >
                  {isPending ? '...' : 'Register'}
                </button>
              ) : (
                <button
                  onClick={(e) => { e.stopPropagation(); onRegister?.(); }}
                  disabled={isPending}
                  className="flex-1 py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-600 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all disabled:opacity-50"
                >
                  {isPending ? '...' : 'Join Waitlist'}
                </button>
              )
            )
          )}
          {isMentor && (
            <>
              <button onClick={(e) => { e.stopPropagation(); onEdit?.(); }} className="flex-1 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all">Edit</button>
              <button onClick={(e) => { e.stopPropagation(); onDuplicate?.(); }} className="py-2.5 px-4 bg-slate-50 hover:bg-slate-100 text-slate-500 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all">Copy</button>
              <button onClick={(e) => { e.stopPropagation(); onDelete?.(); }} className="py-2.5 px-4 bg-rose-50 hover:bg-rose-100 text-rose-500 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all">Del</button>
              {event.archived ? (
                <button onClick={(e) => { e.stopPropagation(); onRestore?.(); }} className="py-2.5 px-4 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all">Restore</button>
              ) : (
                <button onClick={(e) => { e.stopPropagation(); onArchive?.(); }} className="py-2.5 px-4 bg-slate-50 hover:bg-slate-100 text-slate-500 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all">Arch</button>
              )}
            </>
          )}
        </div>
      </div>

      {showQr && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={() => setShowQr(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-[32px] p-8 max-w-sm w-full mx-4 shadow-2xl text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <QrCode size={120} className="mx-auto mb-4 text-slate-800" />
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Scan to check in</p>
            <p className="text-xs text-slate-400 mb-6">{event.title}</p>
            <button
              onClick={() => setShowQr(false)}
              className="px-6 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all"
            >
              Close
            </button>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
};

export default EventCard;
