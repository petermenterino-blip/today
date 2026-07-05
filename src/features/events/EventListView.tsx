import React, { useState, useMemo, memo, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search, Calendar, List, Grid3X3, SlidersHorizontal, Plus, Loader2,
  TrendingUp, Users, Clock, CheckCircle2, Download,
} from 'lucide-react';
import { NetworkEvent, EventType } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useEvents } from '../../hooks/useEvents';
import EventCard from './EventCard';
import EventCreateModal from './EventCreateModal';
import EventDetailView from './EventDetailView';
import { notifySuccess, notifyError } from '../../utils/toast';

const PAGE_SIZE = 12;

const EVENT_TYPES: EventType[] = [
  'Workshop', 'Webinar', 'Bootcamp', 'AMA Session', 'Group Mentoring',
  'Networking Event', 'Office Hours', 'Interview Session', 'Career Talk',
  'Alumni Talk', 'Live Coding', 'Mock Interview', 'Hackathon', 'Assessment',
  'Guest Lecture', 'Community Meetup',
];

const FILTER_OPTIONS = [
  { id: 'all', label: 'All Events' },
  { id: 'upcoming', label: 'Upcoming' },
  { id: 'live', label: 'Live Now' },
  { id: 'completed', label: 'Completed' },
  { id: 'cancelled', label: 'Cancelled' },
  { id: 'thisWeek', label: 'This Week' },
  { id: 'thisMonth', label: 'This Month' },
  { id: 'myEvents', label: 'My Events' },
  { id: 'archived', label: 'Archived' },
];

const STAT_CARDS = [
  { icon: Calendar, label: 'Total', color: 'text-indigo-600', bg: 'bg-indigo-50' },
  { icon: TrendingUp, label: 'Upcoming', color: 'text-emerald-600', bg: 'bg-emerald-50' },
  { icon: Clock, label: 'Live Now', color: 'text-amber-600', bg: 'bg-amber-50' },
  { icon: CheckCircle2, label: 'Completed', color: 'text-blue-600', bg: 'bg-blue-50' },
  { icon: Users, label: 'Registrations', color: 'text-purple-600', bg: 'bg-purple-50' },
];

interface StatsCardProps {
  icon: React.FC<{ size?: number; className?: string }>;
  label: string;
  value: number;
  color: string;
  bg: string;
}

const StatsCard = memo<StatsCardProps>(({ icon: Icon, label, value, color, bg }) => (
  <div className="bg-white p-4 rounded-[24px] border border-slate-100 shadow-sm">
    <div className={`w-8 h-8 ${bg} rounded-xl flex items-center justify-center mb-2`}>
      <Icon size={14} className={color} />
    </div>
    <p className="text-xl font-black text-slate-900">{value}</p>
    <p className="text-[8px] font-black uppercase tracking-widest text-slate-400 mt-0.5">{label}</p>
  </div>
));

const SkeletonCard = memo(() => (
  <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden animate-pulse">
    <div className="h-44 sm:h-52 bg-slate-200" />
    <div className="p-5 space-y-3.5">
      <div className="flex items-center gap-2">
        <div className="h-3 w-16 bg-slate-200 rounded-full" />
        <div className="h-3 w-12 bg-slate-200 rounded-full" />
      </div>
      <div className="h-4 w-3/4 bg-slate-200 rounded-lg" />
      <div className="h-3 w-full bg-slate-200 rounded-lg" />
      <div className="h-3 w-2/3 bg-slate-200 rounded-lg" />
      <div className="space-y-1.5">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 bg-slate-200 rounded" />
          <div className="h-3 w-32 bg-slate-200 rounded-lg" />
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 bg-slate-200 rounded" />
          <div className="h-3 w-24 bg-slate-200 rounded-lg" />
        </div>
      </div>
      <div className="flex gap-2 pt-1">
        <div className="flex-1 h-9 bg-slate-200 rounded-2xl" />
        <div className="h-9 w-14 bg-slate-200 rounded-2xl" />
        <div className="h-9 w-14 bg-slate-200 rounded-2xl" />
      </div>
    </div>
  </div>
));

interface FilterPanelProps {
  showFilters: boolean;
  statusFilter: string;
  typeFilter: string;
  search: string;
  onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onToggle: () => void;
  onStatusChange: (id: string) => void;
  onTypeChange: (type: string) => void;
}

const FilterPanel = memo<FilterPanelProps>(({
  showFilters, statusFilter, typeFilter, search, onSearchChange,
  onToggle, onStatusChange, onTypeChange,
}) => (
  <div className="bg-white p-5 rounded-[32px] border border-slate-100 shadow-sm space-y-4">
    <div className="flex items-center gap-3">
      <div className="relative flex-1">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        <input
          type="text"
          placeholder="Search by title, mentor, program, type, tags..."
          value={search}
          onChange={onSearchChange}
          className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-medium outline-none focus:border-black transition-all"
        />
      </div>
      <button
        onClick={onToggle}
        className={`p-3 rounded-2xl border transition-all ${
          showFilters ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : 'bg-slate-50 border-slate-100 text-slate-500 hover:text-slate-700'
        }`}
      >
        <SlidersHorizontal size={16} />
      </button>
    </div>
    <AnimatePresence initial={false}>
      {showFilters && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="overflow-hidden"
        >
          <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-slate-100">
            {FILTER_OPTIONS.map(opt => (
              <button
                key={opt.id}
                onClick={() => onStatusChange(opt.id)}
                className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
                  statusFilter === opt.id ? 'bg-brand-charcoal text-white shadow-sm' : 'bg-slate-50 text-slate-500 hover:text-slate-700'
                }`}
              >
                {opt.label}
              </button>
            ))}
            <div className="w-px h-6 bg-slate-200 mx-1" />
            {EVENT_TYPES.map(type => (
              <button
                key={type}
                onClick={() => onTypeChange(type)}
                className={`px-3 py-1.5 rounded-xl text-[8px] font-bold uppercase tracking-widest transition-all ${
                  typeFilter === type ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-50 text-slate-400 hover:text-slate-600'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  </div>
));

interface EventListItemProps {
  event: NetworkEvent;
  onClick: () => void;
}

const EventListItem = memo<EventListItemProps>(({ event, onClick }) => (
  <motion.div
    layout
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, scale: 0.95 }}
  >
    <div
      onClick={onClick}
      className="bg-white p-5 rounded-[24px] border border-slate-100 shadow-sm hover:shadow-md transition-all cursor-pointer flex items-center gap-5"
    >
      {event.image && <img src={event.image} alt="" loading="lazy" className="w-20 h-20 rounded-2xl object-cover shrink-0" />}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded text-[7px] font-black uppercase tracking-widest">
            {event.eventType || event.category || 'Workshop'}
          </span>
          <span className="text-[10px] text-slate-400 font-bold">{event.date}</span>
        </div>
        <h3 className="text-sm font-black text-slate-900 truncate">{event.title}</h3>
        <p className="text-[11px] text-slate-500 mt-0.5 truncate">{event.description}</p>
      </div>
      <div className="text-right shrink-0">
        <p className="text-xs font-bold text-slate-800">{event.time}</p>
        <p className="text-[10px] text-slate-400">{event.location}</p>
      </div>
    </div>
  </motion.div>
));

interface EmptyStateProps {
  hasActiveFilters: boolean;
  isMentor: boolean;
  onCreateClick: () => void;
}

const EmptyState = memo<EmptyStateProps>(({ hasActiveFilters, isMentor, onCreateClick }) => (
  <div className="bg-white p-16 rounded-[40px] border border-slate-100 shadow-sm text-center">
    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
      <Calendar size={28} />
    </div>
    <p className="text-sm font-bold text-slate-400">No events found</p>
    <p className="text-[10px] text-slate-300 mt-1 font-bold uppercase tracking-widest">
      {hasActiveFilters ? 'Try adjusting your search or filters' : isMentor ? 'Create your first event to get started' : 'No events available right now'}
    </p>
    {isMentor && !hasActiveFilters && (
      <button
        onClick={onCreateClick}
        className="mt-6 px-6 py-3 bg-brand-charcoal text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 transition-all"
      >
        Create Event
      </button>
    )}
  </div>
));

const EventListView: React.FC = () => {
  const { user } = useAuth();
  const {
    events, loading, addEvent, deleteEvent, updateEvent, duplicateEvent,
    registerForEvent, unregisterFromEvent, joinWaitlist, isPending, refresh,
    archiveEvent, restoreEvent,
  } = useEvents();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<NetworkEvent | null>(null);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [saving, setSaving] = useState(false);
  const [page, setPage] = useState(1);
  const [exporting, setExporting] = useState(false);
  const isMentor = user?.role === 'mentor';

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, typeFilter]);

  const today = useMemo(() => new Date().toISOString().split('T')[0], []);
  const currentWeekEnd = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + (7 - d.getDay()));
    return d.toISOString().split('T')[0];
  }, []);
  const currentMonthEnd = useMemo(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().split('T')[0];
  }, []);

  const isLiveNow = useCallback((event: NetworkEvent): boolean => {
    if (event.status !== 'published') return false;
    const now = new Date().toTimeString().slice(0, 5);
    return event.date === today && event.time <= now && (!event.endTime || now <= event.endTime);
  }, [today]);

  const filteredEvents = useMemo(() => {
    let result = [...events];

    if (statusFilter === 'archived') {
      result = result.filter(e => e.archived);
    } else {
      result = result.filter(e => !e.archived);
    }

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(e =>
        e.title.toLowerCase().includes(q) ||
        e.description?.toLowerCase().includes(q) ||
        e.speaker?.toLowerCase().includes(q) ||
        e.eventType?.toLowerCase().includes(q) ||
        e.tags?.toLowerCase().includes(q)
      );
    }

    if (typeFilter) {
      result = result.filter(e => (e.eventType || e.category) === typeFilter);
    }

    switch (statusFilter) {
      case 'archived':
        break;
      case 'upcoming':
        result = result.filter(e => e.date >= today && e.status === 'published');
        break;
      case 'live':
        result = result.filter(isLiveNow);
        break;
      case 'completed':
        result = result.filter(e => e.status === 'completed');
        break;
      case 'cancelled':
        result = result.filter(e => e.status === 'cancelled');
        break;
      case 'thisWeek':
        result = result.filter(e => e.date >= today && e.date <= currentWeekEnd);
        break;
      case 'thisMonth':
        result = result.filter(e => e.date >= today && e.date <= currentMonthEnd);
        break;
      case 'myEvents':
        if (user) result = result.filter(e => e.attendees?.includes(user.id) || e.createdBy === user.id);
        break;
    }

    result.sort((a, b) => {
      if (a.featured && !b.featured) return -1;
      if (!a.featured && b.featured) return 1;
      return new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime();
    });

    return result;
  }, [events, search, statusFilter, typeFilter, user, isLiveNow, today, currentWeekEnd, currentMonthEnd]);

  const visibleEvents = useMemo(() => {
    return filteredEvents.slice(0, page * PAGE_SIZE);
  }, [filteredEvents, page]);

  const hasMore = filteredEvents.length > page * PAGE_SIZE;

  const stats = useMemo(() => {
    const activeEvents = events.filter(e => !e.archived);
    const upcoming = activeEvents.filter(e => e.date >= today && e.status === 'published').length;
    const live = activeEvents.filter(isLiveNow).length;
    const completed = activeEvents.filter(e => e.status === 'completed').length;
    const cancelled = activeEvents.filter(e => e.status === 'cancelled').length;
    const totalReg = activeEvents.reduce(
      (a, e) => a + (e.registrations?.filter(r => r.status === 'confirmed').length || 0), 0,
    );
    return { total: activeEvents.length, upcoming, live, completed, cancelled, totalReg };
  }, [events, isLiveNow, today]);

  const handleCreateEvent = useCallback(async (data: Partial<NetworkEvent>) => {
    setSaving(true);
    try {
      await addEvent({
        ...data,
        attendees: [],
        eventType: data.eventType || 'Workshop',
      } as any);
      notifySuccess('Event created successfully!');
      setShowCreateModal(false);
      refresh();
    } catch (err: any) {
      notifyError(err.message || 'Failed to create event');
    }
    setSaving(false);
  }, [addEvent, refresh]);

  const handleUpdateEvent = useCallback(async (data: Partial<NetworkEvent>) => {
    if (!editingEvent) return;
    setSaving(true);
    try {
      await updateEvent(editingEvent.id, data);
      notifySuccess('Event updated!');
      setShowCreateModal(false);
      setEditingEvent(null);
      refresh();
    } catch (err: any) {
      notifyError(err.message || 'Failed to update');
    }
    setSaving(false);
  }, [editingEvent, updateEvent, refresh]);

  const handleDelete = useCallback(async (id: string) => {
    if (!confirm('Delete this event permanently?')) return;
    await deleteEvent(id);
    notifySuccess('Event deleted');
    refresh();
  }, [deleteEvent, refresh]);

  const handleDuplicate = useCallback(async (id: string) => {
    await duplicateEvent(id);
    notifySuccess('Event duplicated as draft');
    refresh();
  }, [duplicateEvent, refresh]);

  const handleArchive = useCallback(async (id: string) => {
    await archiveEvent(id);
    notifySuccess('Event archived');
    refresh();
  }, [archiveEvent, refresh]);

  const handleRestore = useCallback(async (id: string) => {
    await restoreEvent(id);
    notifySuccess('Event restored');
    refresh();
  }, [restoreEvent, refresh]);

  const handleRegister = useCallback(async (event: NetworkEvent) => {
    if (!user) { notifyError('Please sign in'); return; }
    const capacity = event.capacity || Infinity;
    const confirmed = event.registrations?.filter(r => r.status === 'confirmed').length || 0;
    if (confirmed >= capacity) {
      if (event.waitlistLimit && event.waitlistLimit > 0) {
        await joinWaitlist({ eventId: event.id, userId: user.id, name: user.name, email: user.email });
        notifySuccess('Added to waitlist!');
      } else {
        notifyError('Event is full');
      }
      return;
    }
    await registerForEvent({ eventId: event.id, userId: user.id, name: user.name, email: user.email });
    notifySuccess('Registered!');
    refresh();
  }, [user, joinWaitlist, registerForEvent, refresh]);

  const handleUnregister = useCallback(async (event: NetworkEvent) => {
    if (!user) return;
    await unregisterFromEvent({ eventId: event.id, userId: user.id });
    notifySuccess('Registration cancelled');
    refresh();
  }, [user, unregisterFromEvent, refresh]);

  const isRegistered = useCallback((event: NetworkEvent): boolean => (
    user ? !!event.registrations?.find(r => r.userId === user.id && r.status === 'confirmed') : false
  ), [user]);

  const handleExportCsv = useCallback(async () => {
    setExporting(true);
    try {
      const rows: string[][] = [['Event Title', 'Student Name', 'Email', 'Status', 'Attendance Status']];
      for (const event of events) {
        const regs = event.registrations || [];
        for (const reg of regs) {
          rows.push([
            event.title,
            reg.name || '',
            reg.email || '',
            reg.status || '',
            reg.attendanceStatus || '',
          ]);
        }
      }
      const csv = rows.map(r => r.map(c => `"${c.replace(/"/g, '""')}"`).join(',')).join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'events_registrations.csv';
      a.click();
      URL.revokeObjectURL(url);
      notifySuccess('Registrations exported!');
    } catch (err: any) {
      notifyError(err.message || 'Export failed');
    }
    setExporting(false);
  }, [events]);

  const handleStatusFilter = useCallback((id: string) => {
    setStatusFilter(prev => prev === id ? 'all' : id);
  }, []);

  const handleTypeFilter = useCallback((type: string) => {
    setTypeFilter(prev => prev === type ? '' : type);
  }, []);

  const handleOpenCreate = useCallback(() => {
    setEditingEvent(null);
    setShowCreateModal(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setShowCreateModal(false);
    setEditingEvent(null);
  }, []);

  const handleSelectEvent = useCallback((id: string) => {
    setSelectedEventId(id);
  }, []);

  const handleEditEvent = useCallback((evt: NetworkEvent) => {
    setEditingEvent(evt);
    setShowCreateModal(true);
  }, []);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
  }, []);

  if (selectedEventId) {
    return (
      <EventDetailView
        eventId={selectedEventId}
        onBack={() => setSelectedEventId(null)}
        onEdit={handleEditEvent}
      />
    );
  }

  const hasActiveFilters = search !== '' || statusFilter !== 'all';

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-slate-900">Events</h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">Manage workshops, webinars, and events</p>
        </div>
        <div className="flex items-center gap-2">
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
          {isMentor && (
            <>
              <button
                onClick={handleExportCsv}
                disabled={exporting}
                className="px-4 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-2 disabled:opacity-50"
              >
                <Download size={14} /> {exporting ? '...' : 'Export'}
              </button>
              <button
                onClick={handleOpenCreate}
                className="px-5 py-2.5 bg-brand-charcoal hover:bg-indigo-600 text-white rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all shadow-lg shadow-black/10 flex items-center gap-2"
              >
                <Plus size={14} /> Create Event
              </button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {STAT_CARDS.map((stat, i) => (
          <StatsCard
            key={stat.label}
            icon={stat.icon}
            label={stat.label}
            value={[stats.total, stats.upcoming, stats.live, stats.completed, stats.totalReg][i]}
            color={stat.color}
            bg={stat.bg}
          />
        ))}
      </div>

      <FilterPanel
        showFilters={showFilters}
        statusFilter={statusFilter}
        typeFilter={typeFilter}
        search={search}
        onSearchChange={handleSearchChange}
        onToggle={() => setShowFilters(prev => !prev)}
        onStatusChange={handleStatusFilter}
        onTypeChange={handleTypeFilter}
      />

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : filteredEvents.length === 0 ? (
        <EmptyState
          hasActiveFilters={hasActiveFilters}
          isMentor={isMentor}
          onCreateClick={handleOpenCreate}
        />
      ) : viewMode === 'grid' ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence>
              {visibleEvents.map(event => (
                <EventCard
                  key={event.id}
                  event={event}
                  currentUserId={user?.id}
                  isMentor={isMentor}
                  onClick={() => handleSelectEvent(event.id)}
                  onRegister={() => handleRegister(event)}
                  onUnregister={() => handleUnregister(event)}
                  onEdit={() => handleEditEvent(event)}
                  onDelete={() => handleDelete(event.id)}
                  onDuplicate={() => handleDuplicate(event.id)}
                  onArchive={() => handleArchive(event.id)}
                  onRestore={() => handleRestore(event.id)}
                  isPending={isPending}
                  isRegistered={isRegistered(event)}
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
                Load More ({filteredEvents.length - page * PAGE_SIZE} remaining)
              </button>
            </div>
          )}
        </>
      ) : (
        <>
          <div className="space-y-2">
            <AnimatePresence>
              {visibleEvents.map(event => (
                <EventListItem
                  key={event.id}
                  event={event}
                  onClick={() => handleSelectEvent(event.id)}
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
                Load More ({filteredEvents.length - page * PAGE_SIZE} remaining)
              </button>
            </div>
          )}
        </>
      )}

      <EventCreateModal
        isOpen={showCreateModal}
        onClose={handleCloseModal}
        onSave={editingEvent ? handleUpdateEvent : handleCreateEvent}
        editingEvent={editingEvent}
        isSaving={saving}
        currentUserName={user?.name}
      />
    </div>
  );
};

export default EventListView;
