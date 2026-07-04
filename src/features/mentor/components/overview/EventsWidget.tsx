import React from 'react';
import { CalendarDays, Clock3, Loader2, ChevronRight } from 'lucide-react';

interface Props {
  events: any[];
  loading: boolean;
  onViewAll: () => void;
  onEventClick?: (event: any) => void;
}

const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const EVENT_TYPE_COLORS: Record<string, string> = {
  Workshop: 'bg-indigo-100 text-indigo-700',
  Webinar: 'bg-blue-100 text-blue-700',
  Masterclass: 'bg-emerald-100 text-emerald-700',
  Networking: 'bg-amber-100 text-amber-700',
  'Q&A Session': 'bg-purple-100 text-purple-700',
  Panel: 'bg-cyan-100 text-cyan-700',
  Bootcamp: 'bg-emerald-100 text-emerald-700',
  Other: 'bg-slate-100 text-slate-700',
};

export const EventsWidget: React.FC<Props> = ({ events, loading, onViewAll, onEventClick }) => {
  return (
    <div className="lg:col-span-2 bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm min-h-[320px]">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-lg font-black uppercase tracking-tighter text-slate-900">Upcoming Events</h3>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Workshops, masterclasses & networking sessions</p>
        </div>
        <button onClick={onViewAll} className="text-xs font-black uppercase tracking-wider text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
          View All <ChevronRight size={14} />
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="animate-spin text-slate-300" size={24} />
        </div>
      ) : (
        <div className="space-y-3">
          {events.length > 0 ? (
            events.map((event: any, i: number) => {
              const parts = event.date ? event.date.split('-') : [];
              const day = parts[2] || '';
              const monthName = parts[1] ? monthNames[parseInt(parts[1]) - 1] || parts[1] : '';
              return (
                <div
                  key={event.id || i}
                  onClick={() => onEventClick?.(event)}
                  className="flex items-center gap-4 p-3 rounded-2xl hover:bg-slate-50/80 transition-all border border-transparent hover:border-slate-100 cursor-pointer group"
                >
                  <div className="flex flex-col items-center justify-center shrink-0 w-12 h-12 bg-slate-50 rounded-2xl border border-slate-100">
                    <span className="text-sm font-black text-slate-800 leading-none">{day}</span>
                    <span className="text-[7px] font-black uppercase tracking-widest text-slate-400 mt-0.5">{monthName}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 transition-colors truncate">{event.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="flex items-center gap-1 text-[10px] text-slate-500 font-medium">
                        <Clock3 size={10} className="text-slate-400" />
                        {event.time || 'All day'}
                      </span>
                    </div>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest shrink-0 ${EVENT_TYPE_COLORS[event.eventType || event.category || 'Workshop'] || 'bg-indigo-100 text-indigo-700'}`}>
                    {event.eventType || event.category || 'Workshop'}
                  </span>
                </div>
              );
            })
          ) : (
            <div className="text-center py-12">
              <CalendarDays className="mx-auto text-slate-300 mb-2" size={24} />
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">No upcoming events scheduled.</p>
              <button onClick={onViewAll} className="mt-3 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-[9px] font-black uppercase tracking-wider hover:bg-indigo-100 transition-colors">Create Event</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
