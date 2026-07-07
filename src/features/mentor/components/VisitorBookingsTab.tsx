import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search, Calendar, List, Grid3X3, Loader2, X, ChevronDown,
  Phone, Mail, Clock, CheckCircle2, XCircle, AlertCircle,
  ArrowUpDown, Send, UserPlus, CalendarDays, MessageSquare,
  Ban, Eye, BadgeCheck, TrendingUp, Users, Archive, RefreshCw,
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { useVisitorBookings } from '../../../hooks/useVisitorBookings';
import { useContactSubmissions } from '../../../hooks/useContactSubmissions';
import { VisitorBooking } from '../../../services/visitorBookingService';
import { ContactSubmission } from '../../../services/contactSubmissionService';
import { notifySuccess, notifyError } from '../../../utils/toast';

const PAGE_SIZE = 12;

const STATUS_FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'new', label: 'New' },
  { id: 'contacted', label: 'Contacted' },
  { id: 'awaiting_confirmation', label: 'Awaiting Confirmation' },
  { id: 'scheduled', label: 'Scheduled' },
  { id: 'completed', label: 'Completed' },
  { id: 'cancelled', label: 'Cancelled' },
  { id: 'rejected', label: 'Rejected' },
  { id: 'no_response', label: 'No Response' },
];

const SORT_OPTIONS = [
  { id: 'newest', label: 'Newest First' },
  { id: 'oldest', label: 'Oldest First' },
  { id: 'upcoming', label: 'Upcoming' },
  { id: 'priority_desc', label: 'Priority (High to Low)' },
  { id: 'updated', label: 'Last Updated' },
];

const STAT_DEFS = [
  { key: 'new', icon: AlertCircle, label: 'New', color: 'text-indigo-600', bg: 'bg-indigo-50' },
  { key: 'today', icon: Clock, label: 'Today', color: 'text-amber-600', bg: 'bg-amber-50' },
  { key: 'week', icon: CalendarDays, label: 'This Week', color: 'text-emerald-600', bg: 'bg-emerald-50' },
  { key: 'scheduled', icon: BadgeCheck, label: 'Scheduled', color: 'text-blue-600', bg: 'bg-blue-50' },
  { key: 'completed', icon: CheckCircle2, label: 'Completed', color: 'text-purple-600', bg: 'bg-purple-50' },
  { key: 'total', icon: Users, label: 'Total', color: 'text-slate-600', bg: 'bg-slate-50' },
];

const STATUS_BADGE: Record<string, string> = {
  new: 'bg-indigo-100 text-indigo-700',
  contacted: 'bg-blue-100 text-blue-700',
  awaiting_confirmation: 'bg-amber-100 text-amber-700',
  scheduled: 'bg-emerald-100 text-emerald-700',
  completed: 'bg-slate-100 text-slate-700',
  cancelled: 'bg-rose-100 text-rose-700',
  rejected: 'bg-red-100 text-red-700',
  no_response: 'bg-gray-100 text-gray-700',
};

const PRIORITY_BADGE: Record<string, string> = {
  low: 'bg-green-100 text-green-700',
  medium: 'bg-amber-100 text-amber-700',
  high: 'bg-rose-100 text-rose-700',
};

const MEETING_TYPE_LABEL: Record<string, string> = {
  phone: 'Phone Call',
  video: 'Video Call',
  in_person: 'In Person',
};

const AVATAR_COLORS = [
  'bg-indigo-500', 'bg-emerald-500', 'bg-amber-500', 'bg-blue-500',
  'bg-purple-500', 'bg-rose-500', 'bg-cyan-500', 'bg-orange-500',
];

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash);
}

function getInitials(name: string): string {
  if (!name) return '?';
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

function getAvatarColor(name: string): string {
  return AVATAR_COLORS[hashString(name || '') % AVATAR_COLORS.length];
}

function getRelativeTime(dateStr?: string): string {
  if (!dateStr) return '';
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = now - then;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

function isToday(dateStr?: string): boolean {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  const t = new Date();
  return d.getFullYear() === t.getFullYear() &&
    d.getMonth() === t.getMonth() &&
    d.getDate() === t.getDate();
}

function isThisWeek(dateStr?: string): boolean {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  const t = new Date();
  const weekStart = new Date(t);
  weekStart.setDate(t.getDate() - t.getDay());
  weekStart.setHours(0, 0, 0, 0);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 7);
  return d >= weekStart && d < weekEnd;
}

function formatStatusLabel(status: string): string {
  return status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function getCallTypeStyle(callType: string): string {
  return callType === 'rapid'
    ? 'bg-slate-900 text-white'
    : 'bg-indigo-50 text-indigo-700';
}

function getCallTypeLabel(callType: string): string {
  return callType === 'rapid' ? 'Rapid Response' : 'Intro Call';
}

function getSourceLabel(source?: string): string {
  if (!source) return 'Direct';
  return source.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

interface StatsCardProps {
  icon: React.FC<{ size?: number; className?: string }>;
  label: string;
  value: number;
  color: string;
  bg: string;
}

const StatsCard: React.FC<StatsCardProps> = ({ icon: Icon, label, value, color, bg }) => (
  <div className="bg-white p-4 rounded-[24px] border border-slate-100 shadow-sm">
    <div className={`w-8 h-8 ${bg} rounded-xl flex items-center justify-center mb-2`}>
      <Icon size={14} className={color} />
    </div>
    <p className="text-xl font-black text-slate-900">{value}</p>
    <p className="text-[8px] font-black uppercase tracking-widest text-slate-400 mt-0.5">{label}</p>
  </div>
);

const SkeletonCard: React.FC = () => (
  <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden animate-pulse">
    <div className="p-5 space-y-3.5">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-slate-200 rounded-full shrink-0" />
        <div className="space-y-2 flex-1">
          <div className="h-4 w-32 bg-slate-200 rounded-lg" />
          <div className="h-3 w-48 bg-slate-200 rounded-lg" />
        </div>
      </div>
      <div className="h-3 w-full bg-slate-200 rounded-lg" />
      <div className="h-3 w-2/3 bg-slate-200 rounded-lg" />
      <div className="flex gap-2 pt-2">
        <div className="flex-1 h-8 bg-slate-200 rounded-2xl" />
        <div className="flex-1 h-8 bg-slate-200 rounded-2xl" />
        <div className="h-8 w-8 bg-slate-200 rounded-2xl" />
      </div>
    </div>
  </div>
);

interface EmptyStateProps {
  hasActiveFilters: boolean;
}

const EmptyState: React.FC<EmptyStateProps> = ({ hasActiveFilters }) => (
  <div className="bg-white p-16 rounded-[40px] border border-slate-100 shadow-sm text-center">
    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
      <Calendar size={28} />
    </div>
    <p className="text-sm font-bold text-slate-400">No bookings found</p>
    <p className="text-[10px] text-slate-300 mt-1 font-bold uppercase tracking-widest">
      {hasActiveFilters ? 'Try adjusting your search or filters' : 'No visitor bookings yet'}
    </p>
  </div>
);

interface BookingCardProps {
  booking: VisitorBooking;
  onClick: () => void;
  onStatusUpdate: (id: string, status: string) => void;
  onAssignMentor: (id: string) => void;
  onSendEmail: (email: string) => void;
  onArchive: (id: string) => void;
}

const BookingCard: React.FC<BookingCardProps> = ({
  booking, onClick, onStatusUpdate, onAssignMentor, onSendEmail, onArchive,
}) => {
  const initials = getInitials(booking.visitorName);
  const avatarColor = getAvatarColor(booking.visitorName);
  const statusStyle = STATUS_BADGE[booking.status] || STATUS_BADGE.new;
  const priorityStyle = PRIORITY_BADGE[booking.priority] || '';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
    >
      <div
        onClick={onClick}
        className="bg-white rounded-[32px] border border-slate-100 shadow-sm hover:shadow-md transition-all cursor-pointer overflow-hidden"
      >
        <div className="p-5 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className={`w-10 h-10 rounded-full ${avatarColor} flex items-center justify-center font-bold text-sm text-white shrink-0`}>
                {initials}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-black text-slate-900 truncate">{booking.visitorName}</p>
                <p className="text-[10px] text-slate-400 font-medium truncate">{booking.visitorEmail}</p>
              </div>
            </div>
            <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest shrink-0 ${statusStyle}`}>
              {formatStatusLabel(booking.status)}
            </span>
          </div>

          <div className="space-y-1">
            {booking.visitorPhone && (
              <p className="text-[11px] text-slate-500 font-medium flex items-center gap-1.5">
                <Phone size={11} className="text-slate-300 shrink-0" />
                <span className="truncate">{booking.visitorPhone}</span>
              </p>
            )}
            {booking.company && (
              <p className="text-[11px] text-slate-500 font-medium flex items-center gap-1.5">
                <Users size={11} className="text-slate-300 shrink-0" />
                <span className="truncate">{booking.company}</span>
              </p>
            )}
            <p className="text-[11px] text-slate-500 font-medium flex items-center gap-1.5">
              <Calendar size={11} className="text-slate-300 shrink-0" />
              <span>{booking.date} at {booking.time}</span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {booking.programOfInterest && (
              <span className="px-2 py-0.5 bg-slate-50 text-slate-600 rounded text-[8px] font-bold uppercase tracking-widest">
                {booking.programOfInterest}
              </span>
            )}
            {booking.preferredMentor && (
              <span className="px-2 py-0.5 bg-slate-50 text-slate-500 rounded text-[8px] font-bold flex items-center gap-1">
                <UserPlus size={9} />{booking.preferredMentor}
              </span>
            )}
            {booking.callType && (
              <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${getCallTypeStyle(booking.callType)}`}>
                {getCallTypeLabel(booking.callType)}
              </span>
            )}
            {booking.meetingType && (
              <span className="px-2 py-0.5 bg-cyan-50 text-cyan-600 rounded text-[8px] font-bold uppercase tracking-widest">
                {MEETING_TYPE_LABEL[booking.meetingType] || booking.meetingType}
              </span>
            )}
            {priorityStyle && (
              <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${priorityStyle}`}>
                {booking.priority}
              </span>
            )}
            <span className="px-2 py-0.5 bg-purple-50 text-purple-600 rounded text-[8px] font-bold uppercase tracking-widest">
              {getSourceLabel(booking.sourcePage)}
            </span>
            <span className="text-[8px] text-slate-300 font-bold ml-auto">
              {getRelativeTime(booking.createdAt)}
            </span>
          </div>

          <div className="flex items-center gap-1.5 pt-1 border-t border-slate-50">
            {booking.status === 'new' && (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); onStatusUpdate(booking.id, 'scheduled'); }}
                  className="flex-1 px-3 py-2 bg-emerald-600 text-white rounded-2xl text-[8px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all"
                >
                  Approve
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); onStatusUpdate(booking.id, 'rejected'); }}
                  className="flex-1 px-3 py-2 bg-rose-600 text-white rounded-2xl text-[8px] font-black uppercase tracking-widest hover:bg-rose-700 transition-all"
                >
                  Reject
                </button>
              </>
            )}
            {booking.status === 'contacted' && (
              <button
                onClick={(e) => { e.stopPropagation(); onStatusUpdate(booking.id, 'scheduled'); }}
                className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-2xl text-[8px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all"
              >
                Schedule
              </button>
            )}
            {booking.status === 'awaiting_confirmation' && (
              <button
                onClick={(e) => { e.stopPropagation(); onStatusUpdate(booking.id, 'scheduled'); }}
                className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-2xl text-[8px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all"
              >
                Confirm & Schedule
              </button>
            )}
            {booking.status === 'scheduled' && (
              <button
                onClick={(e) => { e.stopPropagation(); onStatusUpdate(booking.id, 'completed'); }}
                className="flex-1 px-3 py-2 bg-emerald-600 text-white rounded-2xl text-[8px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all"
              >
                Mark Complete
              </button>
            )}
            {(booking.status === 'completed' || booking.status === 'cancelled' || booking.status === 'rejected' || booking.status === 'no_response') && (
              <button
                onClick={(e) => { e.stopPropagation(); onArchive(booking.id); }}
                className="flex-1 px-3 py-2 bg-slate-600 text-white rounded-2xl text-[8px] font-black uppercase tracking-widest hover:bg-slate-700 transition-all"
              >
                Archive
              </button>
            )}
            {(booking.status === 'new' || booking.status === 'contacted' || booking.status === 'no_response') && (
              <button
                onClick={(e) => { e.stopPropagation(); onAssignMentor(booking.id); }}
                className="px-3 py-2 bg-indigo-50 text-indigo-600 rounded-2xl text-[8px] font-black uppercase tracking-widest hover:bg-indigo-100 transition-all"
                title="Assign Mentor"
              >
                <UserPlus size={12} />
              </button>
            )}
            <button
              onClick={(e) => { e.stopPropagation(); onSendEmail(booking.visitorEmail); }}
              className="px-3 py-2 bg-sky-50 text-sky-600 rounded-2xl text-[8px] font-black uppercase tracking-widest hover:bg-sky-100 transition-all"
              title="Send Email"
            >
              <Send size={12} />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

interface BookingListItemProps {
  booking: VisitorBooking;
  onClick: () => void;
  onStatusUpdate: (id: string, status: string) => void;
  onAssignMentor: (id: string) => void;
  onSendEmail: (email: string) => void;
  onArchive: (id: string) => void;
}

const BookingListItem: React.FC<BookingListItemProps> = ({
  booking, onClick, onStatusUpdate, onAssignMentor, onSendEmail, onArchive,
}) => {
  const initials = getInitials(booking.visitorName);
  const avatarColor = getAvatarColor(booking.visitorName);
  const statusStyle = STATUS_BADGE[booking.status] || STATUS_BADGE.new;
  const priorityStyle = PRIORITY_BADGE[booking.priority] || '';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
    >
      <div
        onClick={onClick}
        className="bg-white p-4 rounded-[24px] border border-slate-100 shadow-sm hover:shadow-md transition-all cursor-pointer flex items-center gap-4"
      >
        <div className={`w-9 h-9 rounded-full ${avatarColor} flex items-center justify-center font-bold text-xs text-white shrink-0`}>
          {initials}
        </div>
        <div className="flex-1 min-w-0 grid grid-cols-12 gap-3 items-center">
          <div className="col-span-3 min-w-0">
            <p className="text-sm font-black text-slate-900 truncate">{booking.visitorName}</p>
            <p className="text-[10px] text-slate-400 font-medium truncate">{booking.visitorEmail}</p>
          </div>
          <div className="col-span-2 text-[10px] text-slate-500 font-medium truncate flex items-center gap-1">
            <Calendar size={10} className="shrink-0 text-slate-300" />
            {booking.date}
          </div>
          <div className="col-span-2 text-[10px] text-slate-500 font-medium truncate flex items-center gap-1">
            <Mail size={10} className="shrink-0 text-slate-300" />
            {booking.visitorPhone || '-'}
          </div>
          <div className="col-span-2 flex flex-wrap gap-1">
            {booking.programOfInterest && (
              <span className="px-1.5 py-0.5 bg-slate-50 text-slate-600 rounded text-[7px] font-bold uppercase">
                {booking.programOfInterest}
              </span>
            )}
            {booking.callType && (
              <span className={`px-1.5 py-0.5 rounded text-[7px] font-bold uppercase ${getCallTypeStyle(booking.callType)}`}>
                {getCallTypeLabel(booking.callType)}
              </span>
            )}
          </div>
          <div className="col-span-1 flex items-center gap-1">
            {priorityStyle && (
              <span className={`px-1.5 py-0.5 rounded text-[7px] font-black uppercase tracking-widest ${priorityStyle}`}>
                {booking.priority}
              </span>
            )}
          </div>
          <div className="col-span-1 flex items-center justify-end gap-1">
            <span className={`px-2 py-0.5 rounded-full text-[7px] font-black uppercase tracking-widest ${statusStyle}`}>
              {formatStatusLabel(booking.status)}
            </span>
          </div>
          <div className="col-span-1 flex items-center justify-end gap-1">
            {(booking.status === 'new' || booking.status === 'contacted') && (
              <button
                onClick={(e) => { e.stopPropagation(); onStatusUpdate(booking.id, 'scheduled'); }}
                className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100 transition-all"
                title="Approve"
              >
                <BadgeCheck size={12} />
              </button>
            )}
            {booking.status === 'new' && (
              <button
                onClick={(e) => { e.stopPropagation(); onStatusUpdate(booking.id, 'rejected'); }}
                className="p-1.5 bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-100 transition-all"
                title="Reject"
              >
                <XCircle size={12} />
              </button>
            )}
            <button
              onClick={(e) => { e.stopPropagation(); onSendEmail(booking.visitorEmail); }}
              className="p-1.5 bg-sky-50 text-sky-600 rounded-lg hover:bg-sky-100 transition-all"
              title="Send Email"
            >
              <Send size={12} />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

interface DetailModalProps {
  booking: VisitorBooking | null;
  onClose: () => void;
  onStatusUpdate: (id: string, status: string) => void;
  onAssignMentor: (id: string) => void;
  onArchive: (id: string) => void;
}

const DetailModal: React.FC<DetailModalProps> = ({ booking, onClose, onStatusUpdate, onAssignMentor, onArchive }) => {
  if (!booking) return null;
  const initials = getInitials(booking.visitorName);
  const avatarColor = getAvatarColor(booking.visitorName);
  const statusStyle = STATUS_BADGE[booking.status] || STATUS_BADGE.new;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-300">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white rounded-[40px] max-w-lg w-full p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto"
      >
        <button onClick={onClose} className="absolute top-6 right-6 w-10 h-10 flex items-center justify-center bg-slate-50 rounded-full hover:bg-slate-100 transition-colors" aria-label="Close">
          <X size={18} />
        </button>

        <div className="flex items-center gap-4 mb-6">
          <div className={`w-14 h-14 rounded-full ${avatarColor} flex items-center justify-center font-bold text-lg text-white shrink-0`}>
            {initials}
          </div>
          <div className="min-w-0">
            <h3 className="text-xl font-black text-slate-900 truncate">{booking.visitorName}</h3>
            <p className="text-xs text-slate-400 font-medium">{booking.visitorEmail}</p>
          </div>
          <span className={`ml-auto px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest shrink-0 ${statusStyle}`}>
            {formatStatusLabel(booking.status)}
          </span>
        </div>

        <div className="space-y-3 mb-6">
          <div className="grid grid-cols-2 gap-3">
            {booking.visitorPhone && (
              <div className="bg-slate-50 p-3 rounded-2xl">
                <p className="text-[8px] font-black uppercase tracking-widest text-slate-400 mb-1">Phone</p>
                <p className="text-xs font-bold text-slate-800">{booking.visitorPhone}</p>
              </div>
            )}
            {booking.company && (
              <div className="bg-slate-50 p-3 rounded-2xl">
                <p className="text-[8px] font-black uppercase tracking-widest text-slate-400 mb-1">Company</p>
                <p className="text-xs font-bold text-slate-800">{booking.company}</p>
              </div>
            )}
            <div className="bg-slate-50 p-3 rounded-2xl">
              <p className="text-[8px] font-black uppercase tracking-widest text-slate-400 mb-1">Date & Time</p>
              <p className="text-xs font-bold text-slate-800">{booking.date} {booking.time}</p>
            </div>
            {booking.timezone && (
              <div className="bg-slate-50 p-3 rounded-2xl">
                <p className="text-[8px] font-black uppercase tracking-widest text-slate-400 mb-1">Timezone</p>
                <p className="text-xs font-bold text-slate-800">{booking.timezone}</p>
              </div>
            )}
            {booking.programOfInterest && (
              <div className="bg-slate-50 p-3 rounded-2xl">
                <p className="text-[8px] font-black uppercase tracking-widest text-slate-400 mb-1">Program</p>
                <p className="text-xs font-bold text-slate-800">{booking.programOfInterest}</p>
              </div>
            )}
            {booking.preferredMentor && (
              <div className="bg-slate-50 p-3 rounded-2xl">
                <p className="text-[8px] font-black uppercase tracking-widest text-slate-400 mb-1">Preferred Mentor</p>
                <p className="text-xs font-bold text-slate-800">{booking.preferredMentor}</p>
              </div>
            )}
            {booking.meetingType && (
              <div className="bg-slate-50 p-3 rounded-2xl">
                <p className="text-[8px] font-black uppercase tracking-widest text-slate-400 mb-1">Meeting Type</p>
                <p className="text-xs font-bold text-slate-800">{MEETING_TYPE_LABEL[booking.meetingType] || booking.meetingType}</p>
              </div>
            )}
            <div className="bg-slate-50 p-3 rounded-2xl">
              <p className="text-[8px] font-black uppercase tracking-widest text-slate-400 mb-1">Source</p>
              <p className="text-xs font-bold text-slate-800">{getSourceLabel(booking.sourcePage)}</p>
            </div>
            <div className="bg-slate-50 p-3 rounded-2xl">
              <p className="text-[8px] font-black uppercase tracking-widest text-slate-400 mb-1">Priority</p>
              <p className={`text-xs font-bold ${booking.priority === 'high' ? 'text-rose-600' : booking.priority === 'medium' ? 'text-amber-600' : 'text-green-600'}`}>
                {booking.priority || 'medium'}
              </p>
            </div>
            <div className="bg-slate-50 p-3 rounded-2xl">
              <p className="text-[8px] font-black uppercase tracking-widest text-slate-400 mb-1">Call Type</p>
              <p className="text-xs font-bold text-slate-800">{getCallTypeLabel(booking.callType)}</p>
            </div>
            <div className="bg-slate-50 p-3 rounded-2xl">
              <p className="text-[8px] font-black uppercase tracking-widest text-slate-400 mb-1">Created</p>
              <p className="text-xs font-bold text-slate-800">{getRelativeTime(booking.createdAt)}</p>
            </div>
          </div>
          {booking.assignedMentorName && (
            <div className="bg-slate-50 p-3 rounded-2xl">
              <p className="text-[8px] font-black uppercase tracking-widest text-slate-400 mb-1">Assigned Mentor</p>
              <p className="text-xs font-bold text-slate-800">{booking.assignedMentorName}</p>
            </div>
          )}
          {booking.notes && (
            <div className="bg-amber-50 p-3 rounded-2xl border border-amber-100">
              <p className="text-[8px] font-black uppercase tracking-widest text-amber-500 mb-1">Notes</p>
              <p className="text-xs text-amber-800">{booking.notes}</p>
            </div>
          )}
          {booking.message && (
            <div className="bg-slate-50 p-3 rounded-2xl">
              <p className="text-[8px] font-black uppercase tracking-widest text-slate-400 mb-1">Message</p>
              <p className="text-xs text-slate-700">{booking.message}</p>
            </div>
          )}
        </div>

        <div className="flex gap-2 pt-2 border-t border-slate-100">
          {booking.status === 'new' && (
            <>
              <button
                onClick={() => { onStatusUpdate(booking.id, 'scheduled'); onClose(); }}
                className="flex-1 py-3 bg-emerald-600 text-white rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all"
              >
                Approve & Schedule
              </button>
              <button
                onClick={() => { onStatusUpdate(booking.id, 'rejected'); onClose(); }}
                className="flex-1 py-3 bg-rose-600 text-white rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-rose-700 transition-all"
              >
                Reject
              </button>
            </>
          )}
          {booking.status === 'scheduled' && (
            <button
              onClick={() => { onStatusUpdate(booking.id, 'completed'); onClose(); }}
              className="flex-1 py-3 bg-emerald-600 text-white rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all"
            >
              Mark Completed
            </button>
          )}
          {(booking.status === 'completed' || booking.status === 'cancelled' || booking.status === 'rejected') && (
            <button
              onClick={() => { onArchive(booking.id); onClose(); }}
              className="flex-1 py-3 bg-slate-600 text-white rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-slate-700 transition-all"
            >
              Archive
            </button>
          )}
          <button
            onClick={() => { window.open(`mailto:${booking.visitorEmail}`, '_blank'); }}
            className="px-4 py-3 bg-sky-50 text-sky-600 rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-sky-100 transition-all"
          >
            <Send size={14} />
          </button>
        </div>
      </motion.div>
    </div>
  );
};

const InquiriesPanel: React.FC<{
  submissions: ContactSubmission[];
  loading: boolean;
  onUpdateStatus: (id: string, status: ContactSubmission['status']) => void;
}> = ({ submissions, loading, onUpdateStatus }) => {
  const [statusFilter, setStatusFilter] = useState<'all' | 'new' | 'read' | 'archived'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = useMemo(() => {
    let result = [...submissions];
    if (statusFilter !== 'all') {
      result = result.filter(s => s.status === statusFilter);
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(s =>
        s.name?.toLowerCase().includes(q) ||
        s.email?.toLowerCase().includes(q) ||
        s.subject?.toLowerCase().includes(q) ||
        s.message?.toLowerCase().includes(q)
      );
    }
    result.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    return result;
  }, [submissions, statusFilter, searchQuery]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-48 bg-slate-100 rounded-[32px] animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-white p-5 rounded-[32px] border border-slate-100 shadow-sm space-y-4">
        <div className="relative">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by name, email, subject, message..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-medium outline-none focus:border-black transition-all"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {(['all', 'new', 'read', 'archived'] as const).map(opt => (
            <button
              key={opt}
              onClick={() => setStatusFilter(prev => prev === opt ? 'all' : opt)}
              className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
                statusFilter === opt ? 'bg-brand-charcoal text-white shadow-sm' : 'bg-slate-50 text-slate-500 hover:text-slate-700'
              }`}
            >
              {opt === 'all' ? 'All' : opt.charAt(0).toUpperCase() + opt.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-slate-400 text-xs font-medium">No inquiries found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(sub => (
            <motion.div
              key={sub.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-[24px] border border-slate-100 shadow-sm overflow-hidden hover:shadow-md transition-all"
            >
              <div className="p-5 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-[10px] font-black shrink-0 ${
                      sub.status === 'new' ? 'bg-indigo-500' : sub.status === 'read' ? 'bg-slate-400' : 'bg-slate-300'
                    }`}>
                      {getInitials(sub.name)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-800 truncate">{sub.name}</p>
                      <p className="text-[10px] text-slate-400 truncate">{sub.email}</p>
                    </div>
                  </div>
                  <span className={`shrink-0 px-2.5 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${
                    sub.status === 'new' ? 'bg-indigo-100 text-indigo-700' :
                    sub.status === 'read' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'
                  }`}>
                    {sub.status}
                  </span>
                </div>

                {sub.subject && (
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Subject:</span>
                    <span className="text-xs font-medium text-slate-700">{sub.subject}</span>
                  </div>
                )}
                {sub.discipline && (
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Discipline:</span>
                    <span className="text-xs font-medium text-slate-700">{sub.discipline}</span>
                  </div>
                )}
                {sub.message && (
                  <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">{sub.message}</p>
                )}

                <div className="flex items-center justify-between pt-2 border-t border-slate-50">
                  <span className="text-[9px] text-slate-400 font-medium">{getRelativeTime(sub.createdAt)}</span>
                  <div className="flex items-center gap-1">
                    {sub.status === 'new' && (
                      <button
                        onClick={() => onUpdateStatus(sub.id, 'read')}
                        className="px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-blue-50 text-slate-500 hover:text-blue-600 text-[8px] font-black uppercase tracking-widest transition-all"
                      >
                        Mark Read
                      </button>
                    )}
                    {sub.status !== 'archived' && (
                      <button
                        onClick={() => onUpdateStatus(sub.id, 'archived')}
                        className="px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-rose-50 text-slate-500 hover:text-rose-600 text-[8px] font-black uppercase tracking-widest transition-all"
                      >
                        Archive
                      </button>
                    )}
                    <button
                      onClick={() => window.open(`mailto:${sub.email}`, '_blank')}
                      className="w-7 h-7 flex items-center justify-center rounded-lg bg-slate-50 hover:bg-emerald-50 text-slate-400 hover:text-emerald-600 transition-all"
                      title={`Email ${sub.email}`}
                    >
                      <Send size={12} />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export const VisitorBookingsTab: React.FC = () => {
  const { user } = useAuth();
  const {
    bookings, loading, updateBooking, deleteBooking, refresh,
  } = useVisitorBookings();
  const {
    submissions, loading: inquiriesLoading, updateStatus, refresh: refreshInquiries,
  } = useContactSubmissions();
  const [activeSubTab, setActiveSubTab] = useState<'bookings' | 'inquiries'>('bookings');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [page, setPage] = useState(1);
  const [showSort, setShowSort] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<VisitorBooking | null>(null);
  const sortRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput), 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, sortBy]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) {
        setShowSort(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const stats = useMemo(() => {
    const active = bookings.filter(b => !b.deletedAt);
    return {
      new: active.filter(b => b.status === 'new').length,
      today: active.filter(b => isToday(b.createdAt)).length,
      week: active.filter(b => isThisWeek(b.createdAt)).length,
      scheduled: active.filter(b => b.status === 'scheduled').length,
      completed: active.filter(b => b.status === 'completed').length,
      total: active.length,
    };
  }, [bookings]);

  const filteredBookings = useMemo(() => {
    let result = [...bookings].filter(b => !b.deletedAt);

    if (statusFilter !== 'all') {
      result = result.filter(b => b.status === statusFilter);
    }

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(b =>
        b.visitorName?.toLowerCase().includes(q) ||
        b.visitorEmail?.toLowerCase().includes(q) ||
        b.visitorPhone?.toLowerCase().includes(q) ||
        b.company?.toLowerCase().includes(q) ||
        b.notes?.toLowerCase().includes(q) ||
        b.message?.toLowerCase().includes(q)
      );
    }

    switch (sortBy) {
      case 'newest':
        result.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
        break;
      case 'oldest':
        result.sort((a, b) => new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime());
        break;
      case 'upcoming':
        result.sort((a, b) => new Date(a.date || 0).getTime() - new Date(b.date || 0).getTime());
        break;
      case 'priority_desc': {
        const priorityOrder: Record<string, number> = { high: 0, medium: 1, low: 2 };
        result.sort((a, b) => (priorityOrder[a.priority] ?? 1) - (priorityOrder[b.priority] ?? 1));
        break;
      }
      case 'updated':
        result.sort((a, b) => new Date(b.updatedAt || b.createdAt || 0).getTime() - new Date(a.updatedAt || a.createdAt || 0).getTime());
        break;
    }

    return result;
  }, [bookings, statusFilter, search, sortBy]);

  const visibleBookings = useMemo(() => {
    return filteredBookings.slice(0, page * PAGE_SIZE);
  }, [filteredBookings, page]);

  const hasMore = filteredBookings.length > page * PAGE_SIZE;
  const hasActiveFilters = search !== '' || statusFilter !== 'all';

  const handleStatusUpdate = useCallback(async (id: string, status: string) => {
    try {
      await updateBooking(id, { status } as any);
      notifySuccess(`Booking ${formatStatusLabel(status)}`);
    } catch (err: any) {
      notifyError(err.message || 'Failed to update');
    }
  }, [updateBooking]);

  const handleAssignMentor = useCallback((id: string) => {
    const mentorName = window.prompt('Enter mentor name to assign:');
    if (!mentorName || !mentorName.trim()) return;
    try {
      updateBooking(id, { assignedMentorName: mentorName.trim(), assignedMentorId: user?.id } as any);
      notifySuccess(`Mentor ${mentorName.trim()} assigned`);
    } catch (err: any) {
      notifyError(err.message || 'Failed to assign mentor');
    }
  }, [updateBooking, user]);

  const handleSendEmail = useCallback((email: string) => {
    window.open(`mailto:${email}`, '_blank');
  }, []);

  const handleArchive = useCallback(async (id: string) => {
    try {
      await deleteBooking(id);
      notifySuccess('Booking archived');
    } catch (err: any) {
      notifyError(err.message || 'Failed to archive');
    }
  }, [deleteBooking]);

  const handleStatusFilter = useCallback((id: string) => {
    setStatusFilter(prev => prev === id ? 'all' : id);
  }, []);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchInput(e.target.value);
  }, []);

  const handleClearSearch = useCallback(() => {
    setSearchInput('');
    setSearch('');
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-slate-900">
            {activeSubTab === 'bookings' ? 'Visitor Bookings' : 'Inquiries'}
          </h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            {activeSubTab === 'bookings'
              ? 'Incoming call requests from website visitors'
              : 'Contact form submissions from the website'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-slate-100 rounded-xl p-0.5">
            <button
              onClick={() => setActiveSubTab('bookings')}
              className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${
                activeSubTab === 'bookings' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              Bookings
            </button>
            <button
              onClick={() => setActiveSubTab('inquiries')}
              className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${
                activeSubTab === 'inquiries' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              Inquiries
            </button>
          </div>
          <button
            onClick={activeSubTab === 'bookings' ? refresh : refreshInquiries}
            className="p-2 rounded-xl bg-slate-100 text-slate-500 hover:text-slate-800 hover:bg-slate-200 transition-all"
            title="Refresh"
          >
            <RefreshCw size={16} />
          </button>
          {activeSubTab === 'bookings' && (
            <div className="flex bg-slate-100 rounded-xl p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-400 hover:text-slate-600'}`}
              >
                <Grid3X3 size={16} />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-400 hover:text-slate-600'}`}
              >
                <List size={16} />
              </button>
            </div>
          )}
        </div>
      </div>

      {activeSubTab === 'bookings' && (
        <>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
            {STAT_DEFS.map(stat => (
              <StatsCard
                key={stat.key}
                icon={stat.icon}
                label={stat.label}
                value={(stats as any)[stat.key]}
                color={stat.color}
                bg={stat.bg}
              />
            ))}
          </div>

          <div className="bg-white p-5 rounded-[32px] border border-slate-100 shadow-sm space-y-4">
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search by name, email, phone, company, notes..."
                  value={searchInput}
                  onChange={handleSearchChange}
                  className="w-full pl-10 pr-10 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-medium outline-none focus:border-black transition-all"
                />
                {searchInput && (
                  <button
                    onClick={handleClearSearch}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-300 hover:text-slate-500 transition-colors"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
              <div className="relative" ref={sortRef}>
                <button
                  onClick={() => setShowSort(prev => !prev)}
                  className="px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-[9px] font-black uppercase tracking-widest text-slate-500 hover:text-slate-700 transition-all flex items-center gap-2"
                >
                  <ArrowUpDown size={14} />
                  <span className="hidden sm:inline">{SORT_OPTIONS.find(o => o.id === sortBy)?.label}</span>
                </button>
                <AnimatePresence>
                  {showSort && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      className="absolute right-0 top-full mt-2 z-20 bg-white border border-slate-100 rounded-2xl shadow-lg overflow-hidden min-w-[180px]"
                    >
                      {SORT_OPTIONS.map(opt => (
                        <button
                          key={opt.id}
                          onClick={() => { setSortBy(opt.id); setShowSort(false); }}
                          className={`w-full text-left px-4 py-2.5 text-[11px] font-bold transition-all ${
                            sortBy === opt.id ? 'bg-brand-charcoal text-white' : 'text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {STATUS_FILTERS.map(opt => (
                <button
                  key={opt.id}
                  onClick={() => handleStatusFilter(opt.id)}
                  className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
                    statusFilter === opt.id ? 'bg-brand-charcoal text-white shadow-sm' : 'bg-slate-50 text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : filteredBookings.length === 0 ? (
            <EmptyState hasActiveFilters={hasActiveFilters} />
          ) : viewMode === 'grid' ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <AnimatePresence>
                  {visibleBookings.map(booking => (
                    <BookingCard
                      key={booking.id}
                      booking={booking}
                      onClick={() => setSelectedBooking(booking)}
                      onStatusUpdate={handleStatusUpdate}
                      onAssignMentor={handleAssignMentor}
                      onSendEmail={handleSendEmail}
                      onArchive={handleArchive}
                    />
                  ))}
                </AnimatePresence>
              </div>
              {hasMore && (
                <div className="flex justify-center pt-4">
                  <button
                    onClick={() => setPage(p => p + 1)}
                    className="px-8 py-3 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all"
                  >
                    Load More ({filteredBookings.length - page * PAGE_SIZE} remaining)
                  </button>
                </div>
              )}
            </>
          ) : (
            <>
              <div className="space-y-2">
                <AnimatePresence>
                  {visibleBookings.map(booking => (
                    <BookingListItem
                      key={booking.id}
                      booking={booking}
                      onClick={() => setSelectedBooking(booking)}
                      onStatusUpdate={handleStatusUpdate}
                      onAssignMentor={handleAssignMentor}
                      onSendEmail={handleSendEmail}
                      onArchive={handleArchive}
                    />
                  ))}
                </AnimatePresence>
              </div>
              {hasMore && (
                <div className="flex justify-center pt-4">
                  <button
                    onClick={() => setPage(p => p + 1)}
                    className="px-8 py-3 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all"
                  >
                    Load More ({filteredBookings.length - page * PAGE_SIZE} remaining)
                  </button>
                </div>
              )}
            </>
          )}

          <DetailModal
            booking={selectedBooking}
            onClose={() => setSelectedBooking(null)}
            onStatusUpdate={handleStatusUpdate}
            onAssignMentor={handleAssignMentor}
            onArchive={handleArchive}
          />
        </>
      )}

      {activeSubTab === 'inquiries' && (
        <InquiriesPanel
          submissions={submissions}
          loading={inquiriesLoading}
          onUpdateStatus={(id, status) => updateStatus({ id, status })}
        />
      )}
    </div>
  );
};
