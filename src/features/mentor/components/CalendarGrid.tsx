import React from 'react';
import { Clock, Video, User, Plus, CalendarIcon, Edit2, Trash2 } from 'lucide-react';
import { Session, StudentProfile } from '../../../interfaces';
import { Program } from '../../../types';
import { getSessionStyle } from './calendarUtils';
import type { CalendarCell, CalendarView } from '../hooks/useCalendar';
import { notifyError } from '../../../utils/toast';

interface CalendarGridProps {
  currentView: CalendarView;
  monthCells: CalendarCell[];
  weekDays: Date[];
  hourSlots: string[];
  currentDate: Date;
  visibleSessions: Session[];
  selectedCalendarDate: string | null;
  getStudentForSession: (id: string) => StudentProfile | undefined;
  getProgramForSession: (id?: string) => Program | undefined;
  onCreateDate: (date: Date) => void;
  onSessionClick: (session: Session) => void;
  onDragStart: (e: React.DragEvent, session: Session) => void;
  onDropOnDate: (e: React.DragEvent, date: Date, time?: string) => void;
  onAdjustDuration: (session: Session, mins: number) => void;
  onDelete: (session: Session) => void;
  tags?: Array<{ id: string; name: string; color: string; visible: boolean }>;
}

const DAY_HEADERS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const CalendarGrid: React.FC<CalendarGridProps> = ({
  currentView,
  monthCells,
  weekDays,
  hourSlots,
  currentDate,
  visibleSessions,
  selectedCalendarDate,
  getStudentForSession,
  getProgramForSession,
  onCreateDate,
  onSessionClick,
  onDragStart,
  onDropOnDate,
  onAdjustDuration,
  onDelete,
  tags,
}) => {
  const activeTags = tags || [];

  if (currentView === 'month') {
    return (
      <div className="grid grid-cols-7 gap-2">
        {DAY_HEADERS.map(day => (
          <div key={day} className="text-center py-2 text-[10px] font-black uppercase tracking-widest text-slate-300">{day}</div>
        ))}
        {monthCells.map((cell, idx) => {
          const daySessions = visibleSessions.filter(s => new Date(s.startTime).toDateString() === cell.date.toDateString());
          const isSelected = selectedCalendarDate === cell.date.toDateString();
          const isPast = cell.date.getTime() < new Date().setHours(0, 0, 0, 0);
          return (
            <div
              key={idx}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => onDropOnDate(e, cell.date)}
              onClick={() => {
                if (isPast) {
                  notifyError("Cannot schedule sessions in the past");
                  return;
                }
                onCreateDate(cell.date);
              }}
              title={isPast ? "Cannot schedule in the past" : "+ Schedule Session"}
              className={`min-h-[120px] p-3 rounded-3xl border transition-all relative flex flex-col justify-between cursor-pointer group ${
                isSelected
                  ? 'bg-indigo-50/40 border-indigo-500 shadow-md ring-2 ring-indigo-500/10'
                  : cell.isToday
                    ? 'bg-indigo-50/20 border-indigo-200 ring-1 ring-indigo-100/50'
                    : cell.isCurrentMonth
                      ? isPast
                        ? 'bg-slate-100/40 border-slate-100/50 opacity-50 cursor-not-allowed hover:bg-slate-100/60'
                        : 'bg-slate-50/40 border-slate-100 hover:bg-white hover:shadow-md hover:shadow-black/5'
                      : 'bg-slate-100/30 border-slate-100/50 opacity-40'
              }`}
            >
              <div className="flex justify-between items-start mb-1 pointer-events-none">
                <span className={`text-[10px] font-black ${cell.isToday ? 'text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded-md' : 'text-slate-400'}`}>
                  {cell.dayNumber}
                </span>
                {daySessions.length > 0 && (
                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{daySessions.length} Sess</span>
                )}
              </div>
              <div className="space-y-1.5 z-10 flex-1 overflow-hidden mt-1 mb-6">
                {daySessions.slice(0, 3).map((s) => (
                  <div
                    key={s.id}
                    draggable
                    onDragStart={(e) => onDragStart(e, s)}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSessionClick(s);
                    }}
                    className="group/event relative px-2.5 py-1.5 rounded-xl text-[9px] font-bold border truncate transition-all flex items-center gap-1.5 shadow-sm"
                    style={getSessionStyle(s.sessionType, s.status, activeTags).style}
                  >
                    <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: getSessionStyle(s.sessionType, s.status, activeTags).indicator }} />
                    <span className="truncate flex-1">{s.title}</span>
                    <div className="absolute inset-0 bg-white/95 backdrop-blur-sm rounded-xl opacity-0 group-hover/event:opacity-100 transition-opacity flex items-center justify-center gap-1 px-1 z-20 border border-slate-100 shadow-sm">
                      <button
                        onClick={(e) => { e.stopPropagation(); onSessionClick(s); }}
                        className="p-1 bg-slate-50 hover:bg-indigo-50 text-indigo-600 rounded-md transition-colors"
                        title="Edit Session"
                      >
                        <Edit2 size={9} />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); onSessionClick(s); }}
                        className="p-1 bg-slate-50 hover:bg-amber-50 text-amber-600 rounded-md transition-colors"
                        title="Reschedule"
                      >
                        <Clock size={9} />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); onDelete(s); }}
                        className="p-1 bg-slate-50 hover:bg-rose-50 text-rose-600 rounded-md transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={9} />
                      </button>
                    </div>
                  </div>
                ))}
                {daySessions.length > 3 && (
                  <div className="text-[8px] font-black text-slate-400 text-center uppercase tracking-widest bg-slate-100/60 py-0.5 rounded-lg">
                    +{daySessions.length - 3} more
                  </div>
                )}
              </div>
              <div className="absolute bottom-2.5 left-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex justify-center pointer-events-none">
                <span className="text-[8px] font-black uppercase tracking-widest text-indigo-600 bg-indigo-50/80 px-2.5 py-1 rounded-xl border border-indigo-100 shadow-sm">
                  + Schedule Session
                </span>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  if (currentView === 'week') {
    return (
      <div className="border border-slate-100 rounded-3xl overflow-hidden bg-slate-50/20">
        <div className="grid grid-cols-8 border-b border-slate-100 bg-white">
          <div className="p-3 text-center text-[9px] font-black uppercase tracking-widest text-slate-400 border-r border-slate-100 flex items-center justify-center">
            Time
          </div>
          {weekDays.map((day, i) => {
            const isToday = day.toDateString() === new Date().toDateString();
            return (
              <div key={i} className={`p-3 text-center border-r border-slate-100 last:border-r-0 ${isToday ? 'bg-indigo-50/10' : ''}`}>
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                  {day.toLocaleDateString([], { weekday: 'short' })}
                </p>
                <p className={`text-sm font-black mt-0.5 ${isToday ? 'text-indigo-600' : 'text-slate-800'}`}>
                  {day.getDate()}
                </p>
              </div>
            );
          })}
        </div>
        <div className="max-h-[600px] overflow-y-auto">
          {hourSlots.map((timeStr) => (
            <div key={timeStr} className="grid grid-cols-8 border-b border-slate-100/60 last:border-b-0 hover:bg-slate-50/40 transition-colors">
              <div className="p-2 text-center text-[9px] font-mono font-bold text-slate-400 border-r border-slate-100 flex items-center justify-center bg-white">
                {timeStr}
              </div>
              {weekDays.map((day, dIdx) => {
                const cellDateTime = new Date(day);
                const [hours, minutes] = timeStr.split(':').map(Number);
                cellDateTime.setHours(hours, minutes, 0, 0);
                const matchingSessions = visibleSessions.filter(s => {
                  const sStart = new Date(s.startTime);
                  const sEnd = new Date(s.endTime);
                  const checkTime = cellDateTime.getTime();
                  return checkTime >= sStart.getTime() && checkTime < sEnd.getTime() && sStart.toDateString() === day.toDateString();
                });
                return (
                  <div
                    key={dIdx}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => onDropOnDate(e, day, timeStr)}
                    onDoubleClick={() => onCreateDate(day)}
                    className="min-h-[48px] p-1 border-r border-slate-100 last:border-r-0 relative group cursor-pointer hover:bg-white"
                  >
                    {matchingSessions.map(s => {
                      const sStart = new Date(s.startTime);
                      const isStartSlot = sStart.getHours() === hours && sStart.getMinutes() === minutes;
                      if (!isStartSlot) return null;
                      const sEnd = new Date(s.endTime);
                      const durMin = Math.round((sEnd.getTime() - sStart.getTime()) / (60 * 1000));
                      const rowSpanMultiplier = Math.max(1, Math.ceil(durMin / 30));
                      return (
                        <div
                          key={s.id}
                          draggable
                          onDragStart={(e) => onDragStart(e, s)}
                          onClick={(e) => { e.stopPropagation(); onSessionClick(s); }}
                          style={{ ...getSessionStyle(s.sessionType, s.status, activeTags).style, height: `${rowSpanMultiplier * 46}px`, zIndex: 20 }}
                          className="absolute left-1 right-1 top-1 p-2 rounded-2xl border text-[9px] font-bold shadow-md transition-all flex flex-col justify-between overflow-hidden cursor-pointer"
                        >
                          <div>
                            <p className="font-black truncate">{s.title}</p>
                            <p className="opacity-75 font-mono text-[8px] mt-0.5">
                              {sStart.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {sEnd.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                          <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-all justify-end mt-1 z-30">
                            <button
                              onClick={(e) => { e.stopPropagation(); onAdjustDuration(s, -15); }}
                              className="p-1 bg-white hover:bg-slate-100 text-slate-700 rounded-lg border border-slate-100 hover:scale-105"
                              title="Shorten session by 15m"
                            >
                              -15m
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); onAdjustDuration(s, 15); }}
                              className="p-1 bg-white hover:bg-slate-100 text-slate-700 rounded-lg border border-slate-100 hover:scale-105"
                              title="Extend session by 15m"
                            >
                              +15m
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (currentView === 'day') {
    return (
      <div className="border border-slate-100 rounded-3xl overflow-hidden bg-slate-50/20 max-w-3xl mx-auto">
        <div className="p-4 bg-white border-b border-slate-100 text-center font-black uppercase tracking-widest text-slate-500">
          Time Slots
        </div>
        <div className="max-h-[600px] overflow-y-auto bg-white">
          {hourSlots.map((timeStr) => {
            const [hours, minutes] = timeStr.split(':').map(Number);
            const cellDateTime = new Date(currentDate);
            cellDateTime.setHours(hours, minutes, 0, 0);
            const matchingSessions = visibleSessions.filter(s => {
              const sStart = new Date(s.startTime);
              const sEnd = new Date(s.endTime);
              const checkTime = cellDateTime.getTime();
              return checkTime >= sStart.getTime() && checkTime < sEnd.getTime() && sStart.toDateString() === currentDate.toDateString();
            });
            return (
              <div key={timeStr} className="grid grid-cols-6 border-b border-slate-100 last:border-b-0 hover:bg-slate-50/40 transition-colors min-h-[56px] relative">
                <div className="col-span-1 p-3 text-center text-[10px] font-mono font-bold text-slate-400 border-r border-slate-100 flex items-center justify-center bg-slate-50/30">
                  {timeStr}
                </div>
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => onDropOnDate(e, currentDate, timeStr)}
                  onDoubleClick={() => onCreateDate(currentDate)}
                  className="col-span-5 p-2 relative cursor-pointer flex items-center"
                >
                  {matchingSessions.map(s => {
                    const sStart = new Date(s.startTime);
                    const isStartSlot = sStart.getHours() === hours && sStart.getMinutes() === minutes;
                    if (!isStartSlot) return null;
                    const sEnd = new Date(s.endTime);
                    const durMin = Math.round((sEnd.getTime() - sStart.getTime()) / (60 * 1000));
                    const rowSpanMultiplier = Math.max(1, Math.ceil(durMin / 30));
                    return (
                      <div
                        key={s.id}
                        draggable
                        onDragStart={(e) => onDragStart(e, s)}
                        onClick={(e) => { e.stopPropagation(); onSessionClick(s); }}
                        style={{ ...getSessionStyle(s.sessionType, s.status, activeTags).style, height: `${rowSpanMultiplier * 52}px`, zIndex: 20 }}
                        className="absolute left-3 right-3 top-1 p-3 rounded-2xl border text-xs font-bold shadow-md transition-all flex items-center justify-between overflow-hidden cursor-pointer"
                      >
                        <div>
                          <p className="font-black text-sm">{s.title}</p>
                          <div className="flex items-center gap-3 text-[10px] font-mono opacity-80 mt-1">
                            <span className="flex items-center gap-1">
                              <Clock size={10} />
                              {sStart.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {sEnd.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ({durMin} mins)
                            </span>
                            <span>&bull;</span>
                            <span className="capitalize">{s.sessionType} Session</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => { e.stopPropagation(); onAdjustDuration(s, -15); }}
                            className="px-2.5 py-1 bg-white text-slate-700 hover:bg-slate-100 rounded-lg border border-slate-100 font-bold text-[10px]"
                            title="Shorten by 15 mins"
                          >
                            -15m
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); onAdjustDuration(s, 15); }}
                            className="px-2.5 py-1 bg-white text-slate-700 hover:bg-slate-100 rounded-lg border border-slate-100 font-bold text-[10px]"
                            title="Extend by 15 mins"
                          >
                            +15m
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  if (currentView === 'agenda') {
    const filteredAgendaSessions = visibleSessions
      .filter(s => {
        const sDate = new Date(s.startTime);
        return sDate.getFullYear() === currentDate.getFullYear() && sDate.getMonth() === currentDate.getMonth();
      })
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        {filteredAgendaSessions.length === 0 ? (
          <div className="py-20 text-center border border-slate-100 rounded-[32px] bg-slate-50/50">
            <CalendarIcon className="mx-auto text-slate-200 mb-4" size={48} />
            <h4 className="text-sm font-black uppercase tracking-wider text-slate-500">No sessions scheduled for this period</h4>
            <p className="text-xs text-slate-400 mt-1">Ready to book some slots? Schedule a session or navigate to other periods!</p>
            <button
              onClick={() => onCreateDate(new Date())}
              className="mt-6 px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-md transition-all inline-flex items-center gap-2"
            >
              <Plus size={14} /> Schedule Session
            </button>
          </div>
        ) : (
          <div className="relative border-l-2 border-slate-100 pl-8 ml-4 space-y-8 py-4">
            {filteredAgendaSessions.map((session) => {
              const student = getStudentForSession(session.studentId);
              const program = getProgramForSession(session.programId);
              const sDate = new Date(session.startTime);
              const eDate = new Date(session.endTime);
              return (
                <div
                  key={session.id}
                  onClick={() => onSessionClick(session)}
                  className="relative bg-slate-50/50 hover:bg-white p-5 rounded-[28px] border border-slate-100 hover:shadow-md transition-all cursor-pointer group"
                >
                  <div className="absolute -left-[41px] top-7 w-4 h-4 rounded-full border-4 border-white shadow-sm"
                    style={{ backgroundColor: getSessionStyle(session.sessionType, session.status, activeTags).indicator }}
                  />
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider border"
                          style={getSessionStyle(session.sessionType, session.status, activeTags).style}
                        >
                          {session.sessionType || '1:1'}
                        </span>
                        {session.status === 'cancelled' && (
                          <span className="px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider bg-rose-100 text-rose-700">
                            Cancelled
                          </span>
                        )}
                      </div>
                      <h4 className="font-bold text-base text-slate-800">{session.title}</h4>
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1 flex items-center gap-1.5">
                        <Clock size={11} className="text-slate-400" />
                        {sDate.toLocaleDateString([], { dateStyle: 'medium' })} | {sDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {eDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ({session.duration || '45 min'})
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-xs font-bold text-slate-700 flex items-center gap-1 justify-end">
                          <User size={12} className="text-slate-400" />
                          {student?.name || 'Alex Student'}
                        </p>
                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mt-0.5">
                          {program?.title || 'Main Program'}
                        </p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (session.meetingUrl) window.open(session.meetingUrl, '_blank');
                        }}
                        disabled={!session.meetingUrl}
                        className={`p-2 rounded-xl transition-all ${session.meetingUrl ? 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100' : 'bg-slate-100 text-slate-300 cursor-not-allowed'}`}
                        title="Join Meeting"
                      >
                        <Video size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  return null;
};


