import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Calendar, MapPin, Clock3, Users } from 'lucide-react';
import { NetworkEvent } from '../../types';
import { eventRsvpService } from '../../services/eventRsvpService';
import { notifySuccess, notifyError } from '../../utils/toast';

interface StudentEventsProps {
  events: NetworkEvent[];
  loading: boolean;
  currentUserId: string;
  onAttend: (eventId: string, userId: string) => Promise<void>;
}

const StudentEvents: React.FC<StudentEventsProps> = ({ events, loading, currentUserId, onAttend }) => {
  const [pendingEvents, setPendingEvents] = useState<Set<string>>(new Set());

  const handleToggle = async (e: React.MouseEvent, event: NetworkEvent) => {
    e.stopPropagation();
    if (pendingEvents.has(event.id)) return;

    setPendingEvents(prev => new Set(prev).add(event.id));

    try {
      const isAttending = event.attendees?.includes(currentUserId);
      if (isAttending) {
        await eventRsvpService.unregister(event.id, currentUserId);
        notifySuccess('You have been unregistered from this event');
      } else {
        await onAttend(event.id, currentUserId);
        notifySuccess('You are now registered for this event!');
      }
    } catch {
      notifyError('Something went wrong. Please try again.');
    } finally {
      setPendingEvents(prev => {
        const next = new Set(prev);
        next.delete(event.id);
        return next;
      });
    }
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
        const isAttending = event.attendees?.includes(currentUserId);
        const isLoading = pendingEvents.has(event.id);
        return (
          <motion.div
            key={event.id}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.05 }}
            className="relative overflow-hidden bg-white p-6 rounded-[32px] border border-slate-100 hover:shadow-lg transition-all group"
          >
            <div className={`absolute left-0 top-0 w-2 h-full ${isAttending ? 'bg-emerald-500' : 'bg-indigo-500'}`}></div>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pl-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full uppercase tracking-widest">
                    {event.date}
                  </span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                    <Clock3 size={12} />
                    {event.time}
                  </span>
                </div>
                <h3 className="font-bold text-base text-brand-charcoal truncate">{event.title}</h3>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2">{event.description}</p>
                <div className="flex items-center gap-4 mt-3">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                    <MapPin size={12} />
                    {event.location}
                  </span>
                  {event.speaker && (
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      Speaker: {event.speaker}
                    </span>
                  )}
                  {isAttending && (
                    <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest flex items-center gap-1">
                      <Users size={12} />
                      Registered
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={(e) => handleToggle(e, event)}
                disabled={isLoading}
                className={`btn-compact text-[10px] shrink-0 ${
                  isAttending
                    ? 'bg-red-50 text-red-600 hover:bg-red-100'
                    : 'bg-brand-charcoal text-white hover:bg-indigo-600'
                } transition-colors shadow-md disabled:opacity-50`}
              >
                {isLoading ? '...' : isAttending ? 'Unregister' : 'Attend'}
              </button>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};

export default StudentEvents;
