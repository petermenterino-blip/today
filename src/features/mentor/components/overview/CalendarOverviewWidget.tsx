import React, { useState } from 'react';
import { ArrowLeft, ChevronRight, CalendarDays, Calendar } from 'lucide-react';
import type { StudentProfile, Application } from '../../../../types';

interface Props {
  sessions: any[];
  events: any[];
  studentProfiles: StudentProfile[];
  applications: Application[];
  onSessionClick: () => void;
  onEventClick: () => void;
}

export const CalendarOverviewWidget: React.FC<Props> = ({ sessions, events, studentProfiles, applications, onSessionClick, onEventClick }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const lastDay = new Date(year, month + 1, 0).getDate();

  const days: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let i = 1; i <= lastDay; i++) days.push(i);

  const getEventsOnDay = (day: number) => {
    const dStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const daySessions = sessions.filter(s => s.startTime?.startsWith(dStr));
    const dayWorkshops = events.filter((e: any) => e.date === dStr);
    return [
      ...daySessions.map(s => ({ ...s, eventType: 'session' as const, title: s.title })),
      ...dayWorkshops.map(e => ({ ...e, eventType: 'workshop' as const })),
    ];
  };

  const selectedDayEvents = selectedDate ? getEventsOnDay(selectedDate.getDate()) : [];
  const weekSessionCount = sessions.filter((s: any) => s.attendanceStatus === 'pending').length;

  return (
    <div className="lg:col-span-2 bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm flex flex-col md:flex-row gap-6 min-h-[420px]">
      <div className="flex-1 flex flex-col border-r border-slate-100 pr-0 md:pr-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-900">Academic Calendar</h4>
            <p className="text-[9px] font-bold text-indigo-600 uppercase tracking-widest mt-0.5">
              {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
            </p>
          </div>
          <div className="flex gap-1">
            <button onClick={() => setCurrentDate(new Date(year, month - 1, 1))} className="p-1 hover:bg-slate-100 rounded-lg transition-colors">
              <ArrowLeft size={14} />
            </button>
            <button onClick={() => setCurrentDate(new Date(year, month + 1, 1))} className="p-1 hover:bg-slate-100 rounded-lg transition-colors">
              <ChevronRight size={14} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center text-[9px] font-bold text-slate-400 mb-2">
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, idx) => (<div key={idx} className="py-1">{d}</div>))}
        </div>

        <div className="grid grid-cols-7 gap-1 text-center flex-1">
          {days.map((day, idx) => {
            if (!day) return <div key={idx} className="py-2"></div>;
            const events = getEventsOnDay(day);
            const hasEvents = events.length > 0;
            const isSelected = selectedDate && day === selectedDate.getDate() && month === selectedDate.getMonth() && year === selectedDate.getFullYear();
            const isToday = day === new Date().getDate() && month === new Date().getMonth() && year === new Date().getFullYear();
            return (
              <button
                key={idx}
                onClick={() => setSelectedDate(new Date(year, month, day))}
                className={`py-2 text-[10px] rounded-xl flex flex-col items-center justify-between relative transition-all duration-200 hover:bg-indigo-50/40 ${isSelected ? 'bg-indigo-600 text-white font-black' : isToday ? 'bg-indigo-100 text-indigo-700 font-bold' : 'text-slate-700'}`}
              >
                <span>{day}</span>
                {hasEvents && (<span className={`w-1 h-1 rounded-full absolute bottom-1.5 ${isSelected ? 'bg-white' : 'bg-indigo-600'}`}></span>)}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex-1 flex flex-col justify-between pl-0 md:pl-2">
        <div>
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-900">
              {selectedDate ? selectedDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric', weekday: 'short' }) : 'Schedule'}
            </h4>
            <button onClick={onSessionClick} className="px-3 py-1 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-full text-[9px] font-black uppercase tracking-wider hover:bg-indigo-100 transition-colors">Add Session</button>
          </div>

          <div className="space-y-3 overflow-y-auto max-h-[260px] pr-1 custom-scrollbar">
            {selectedDate && selectedDayEvents.length > 0 ? (
              selectedDayEvents.map((evt: any, i) => {
                const isSession = evt.eventType === 'session';
                const student = isSession ? (studentProfiles.find((p: any) => p.user_id === evt.studentId) || applications.find((a: any) => a.user_id === evt.studentId)) : null;
                return (
                  <div
                    key={`cal-${i}`}
                    onClick={isSession ? onSessionClick : onEventClick}
                    className="p-3 rounded-2xl bg-slate-50/80 hover:bg-indigo-50/30 border border-slate-100/60 hover:border-indigo-100 transition-all cursor-pointer flex justify-between items-center gap-3 group"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 transition-colors truncate">{evt.title}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5 truncate">{isSession ? `1:1 • ${student?.name || 'Student'}` : `Workshop • ${evt.location}`}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-[10px] font-black text-slate-700">{isSession ? (evt.startTime?.slice(-5) || evt.time) : evt.time}</p>
                      <span className={`inline-block px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wider rounded-md mt-1 ${isSession ? 'bg-amber-50 text-amber-600' : 'bg-purple-50 text-purple-600'}`}>
                        {isSession ? 'Coaching' : 'Event'}
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-10">
                <CalendarDays className="mx-auto text-slate-300 mb-2" size={24} />
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">No activities scheduled</p>
              </div>
            )}
          </div>
        </div>

        <div className="pt-4 border-t border-slate-50 flex items-center justify-between text-[10px] font-bold text-slate-400">
          <span className="uppercase tracking-wider">Upcoming this week:</span>
          <span className="text-indigo-600 font-black">{weekSessionCount} sessions</span>
        </div>
      </div>
    </div>
  );
};
