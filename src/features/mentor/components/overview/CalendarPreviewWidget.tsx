import React from 'react';
import { CalendarDays, Clock } from 'lucide-react';

interface DayPreview {
  date: Date;
  sessions: any[];
  events: any[];
}

interface Props {
  days: DayPreview[];
  onDayClick?: (date: Date) => void;
  onSessionClick?: (session: any) => void;
}

export const CalendarPreviewWidget: React.FC<Props> = ({ days, onDayClick, onSessionClick }) => {
  if (days.length === 0) return null;
  return (
    <div className="bg-white rounded-[32px] p-6 border border-slate-100 shadow-sm">
      <div className="mb-4">
        <h4 className="text-xs font-black uppercase tracking-widest text-slate-400">CALENDAR</h4>
        <p className="text-sm font-black text-brand-charcoal uppercase tracking-tighter">Next 7 Days</p>
      </div>
      <div className="space-y-2">
        {days.map((day, idx) => {
          const isToday = day.date.toDateString() === new Date().toDateString();
          const totalItems = day.sessions.length + day.events.length;
          return (
            <div
              key={idx}
              className={`flex items-center gap-3 p-2.5 rounded-xl cursor-pointer transition-all ${isToday ? 'bg-indigo-50 border border-indigo-100' : 'hover:bg-slate-50 border border-transparent'}`}
              onClick={() => onDayClick?.(day.date)}
            >
              <div className={`w-10 h-10 rounded-xl flex flex-col items-center justify-center shrink-0 ${isToday ? 'bg-indigo-600 text-white' : 'bg-slate-50 text-slate-700'}`}>
                <span className="text-xs font-black leading-none">{day.date.getDate()}</span>
                <span className="text-[6px] font-black uppercase tracking-wider mt-0.5">{day.date.toLocaleString('default', { month: 'short' })}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-[11px] font-bold ${isToday ? 'text-indigo-600' : 'text-slate-600'}`}>
                  {isToday ? 'Today' : day.date.toLocaleDateString(undefined, { weekday: 'short' })}
                </p>
                {totalItems > 0 ? (
                  <p className="text-[9px] text-slate-400 mt-0.5">{totalItems} item{totalItems > 1 ? 's' : ''}</p>
                ) : (
                  <p className="text-[9px] text-slate-300 mt-0.5">No events</p>
                )}
              </div>
              {day.sessions.slice(0, 1).map(s => (
                <span key={s.id} className="text-[8px] font-bold text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-full">
                  {s.startTime ? new Date(s.startTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : ''}
                </span>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
};
