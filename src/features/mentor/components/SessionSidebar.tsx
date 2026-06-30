import React from 'react';
import { Clock, Video, CalendarIcon, Sparkles } from 'lucide-react';
import { Session, StudentProfile } from '../../../interfaces';
import { Program } from '../../../types';
import type { SchedulerSettings } from './calendarUtils';

interface SessionSidebarProps {
  upcomingSessions: Session[];
  getStudentForSession: (id: string) => StudentProfile | undefined;
  getProgramForSession: (id?: string) => Program | undefined;
  onSessionClick: (session: Session) => void;
  onCreateClick: () => void;
  settings: SchedulerSettings;
  onSaveSettings: (settings: SchedulerSettings) => void;
}

export const SessionSidebar: React.FC<SessionSidebarProps> = ({
  upcomingSessions,
  getStudentForSession,
  getProgramForSession,
  onSessionClick,
  onCreateClick,
  settings,
  onSaveSettings,
}) => {
  return (
    <div className="w-full lg:w-80 space-y-6">
      <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm">
        <h4 className="text-lg font-black uppercase tracking-tighter mb-6 flex items-center justify-between">
          Live Upcoming
          <span className="px-2.5 py-1 bg-indigo-50 text-indigo-600 rounded-full text-[9px] font-black uppercase tracking-widest">
            {upcomingSessions.length} Scheduled
          </span>
        </h4>

        <div className="space-y-4 max-h-[450px] overflow-y-auto">
          {upcomingSessions.slice(0, 5).map(session => {
            const student = getStudentForSession(session.studentId);
            const program = getProgramForSession(session.programId);
            const sDate = new Date(session.startTime);

            return (
              <div
                key={session.id}
                onClick={() => onSessionClick(session)}
                className="p-4 bg-slate-50/50 hover:bg-white rounded-[24px] border border-slate-100 hover:shadow-md transition-all group cursor-pointer relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500/20"></div>
                <div className="pl-2">
                  <p className="text-xs font-black text-slate-900 truncate mb-1">{session.title}</p>
                  <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2">
                    <Clock size={10} />
                    {sDate.toLocaleDateString([], { month: 'short', day: 'numeric' })} at {sDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>

                  <div className="flex items-center justify-between mt-3">
                    <div className="text-[9px] font-bold text-slate-600">
                      <span className="block font-black text-slate-900 truncate max-w-[120px]">{student?.name || 'Alex Student'}</span>
                      <span className="text-[8px] text-slate-400 uppercase tracking-widest block truncate max-w-[120px]">{program?.title || 'Program'}</span>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (session.meetingUrl) window.open(session.meetingUrl, '_blank');
                      }}
                      disabled={!session.meetingUrl}
                      className={`p-2 rounded-xl transition-all ${
                        session.meetingUrl
                          ? 'bg-black text-white hover:bg-indigo-600'
                          : 'bg-slate-100 text-slate-300 cursor-not-allowed'
                      }`}
                      title={session.meetingUrl ? "Join meeting link" : "No meeting link"}
                    >
                      <Video size={12} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          {upcomingSessions.length === 0 && (
            <div className="py-12 text-center">
              <CalendarIcon size={24} className="mx-auto text-slate-200 mb-3 animate-pulse" />
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">No upcoming meetings</p>
              <button
                onClick={onCreateClick}
                className="mt-4 px-4 py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all"
              >
                Schedule Session
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="bg-indigo-600 p-8 rounded-[40px] shadow-xl shadow-indigo-500/10 text-white relative overflow-hidden group">
        <div className="relative z-10">
          <Sparkles size={24} className="mb-4 text-indigo-200 animate-pulse" />
          <h4 className="text-xl font-black uppercase tracking-tighter leading-tight mb-2">Automate Bookings</h4>
          <p className="text-[10px] font-bold text-indigo-100 leading-relaxed uppercase tracking-widest">Connect Google Calendar or Zoom to auto-generate secure meeting links.</p>
          <button
            onClick={() => {
              onSaveSettings({
                ...settings,
                calendarSync: true,
                autoMeetLink: true,
              });
            }}
            className="mt-6 w-full py-3.5 bg-white text-indigo-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-transform shadow-md"
          >
            Enable Sync & Auto-Meet
          </button>
        </div>
        <div className="absolute -bottom-4 -right-4 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-1000"></div>
      </div>
    </div>
  );
};
