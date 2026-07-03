import React from 'react';
import { Edit2, Trash2, Clock, Video, CalendarIcon, Sparkles, ExternalLink, Copy } from 'lucide-react';
import { Session, StudentProfile } from '../../../interfaces';
import { Program } from '../../../types';
import { getSessionStyle } from './calendarUtils';
import { notifySuccess } from '../../../utils/toast';
import type { SchedulerSettings, CalendarTag } from './calendarUtils';

const STATUS_STYLES: Record<string, string> = {
  scheduled: 'bg-emerald-100 text-emerald-800',
  cancelled: 'bg-rose-100 text-rose-700',
  completed: 'bg-indigo-100 text-indigo-700',
};

interface SessionSidebarProps {
  upcomingSessions: Session[];
  getStudentForSession: (id: string) => StudentProfile | undefined;
  getProgramForSession: (id?: string) => Program | undefined;
  onSessionClick: (session: Session) => void;
  onCreateClick: () => void;
  onEdit?: (session: Session) => void;
  onDelete?: (session: Session) => void;
  settings: SchedulerSettings;
  onSaveSettings: (settings: SchedulerSettings) => void;
  tags?: CalendarTag[];
}

export const SessionSidebar: React.FC<SessionSidebarProps> = ({
  upcomingSessions,
  getStudentForSession,
  getProgramForSession,
  onSessionClick,
  onCreateClick,
  onEdit,
  onDelete,
  settings,
  onSaveSettings,
  tags,
}) => {
  const activeTags = tags || [];

  return (
    <div className="w-full lg:w-80 space-y-6">
      <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm">
        <h4 className="text-lg font-black uppercase tracking-tighter mb-6 flex items-center justify-between">
          Live Upcoming
          <span className="px-2.5 py-1 bg-indigo-50 text-indigo-600 rounded-full text-[9px] font-black uppercase tracking-widest">
            {upcomingSessions.length} Scheduled
          </span>
        </h4>

        <div className="space-y-3 max-h-[500px] overflow-y-auto">
          {upcomingSessions.slice(0, 8).map(session => {
            const student = getStudentForSession(session.studentId);
            const program = getProgramForSession(session.programId);
            const sDate = new Date(session.startTime);
            const sessionStyle = getSessionStyle(session.sessionType, session.status, activeTags);

            return (
              <div
                key={session.id}
                className="p-4 bg-white hover:bg-slate-50 rounded-[24px] border border-slate-100 hover:shadow-md transition-all group cursor-pointer relative overflow-hidden"
              >
                <div
                  className="absolute top-0 left-0 w-1 h-full rounded-r"
                  style={{ backgroundColor: sessionStyle.indicator }}
                />
                <div className="pl-3">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <span
                      className="px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider border"
                      style={sessionStyle.style}
                    >
                      {session.sessionType || '1:1'}
                    </span>
                    {session.status && session.status !== 'scheduled' && (
                      <span className={`px-1.5 py-0.5 rounded-full text-[7px] font-black uppercase tracking-widest ${STATUS_STYLES[session.status] || ''}`}>
                        {session.status}
                      </span>
                    )}
                  </div>
                  <p className="text-xs font-black text-slate-900 truncate mb-1">{session.title}</p>
                  <div className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2">
                    <Clock size={10} />
                    {sDate.toLocaleDateString([], { month: 'short', day: 'numeric' })} at {sDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>

                  <div className="flex items-center justify-between mt-2">
                    <div className="text-[9px] font-bold text-slate-600">
                      <span className="block font-black text-slate-900 truncate max-w-[100px]">{student?.name || 'Alex Student'}</span>
                      <span className="text-[8px] text-slate-400 uppercase tracking-widest block truncate max-w-[100px]">{program?.title || 'Program'}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      {onEdit && (
                        <button
                          onClick={(e) => { e.stopPropagation(); onEdit(session); }}
                          className="p-1.5 bg-white border border-slate-200 text-slate-500 hover:text-indigo-600 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                          title="Edit"
                        >
                          <Edit2 size={10} />
                        </button>
                      )}
                      {session.meetingUrl && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigator.clipboard.writeText(session.meetingUrl!);
                            notifySuccess('Link copied');
                          }}
                          className="p-1.5 bg-white border border-slate-200 text-slate-500 hover:text-indigo-600 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                          title="Copy meeting link"
                        >
                          <Copy size={10} />
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (session.meetingUrl) window.open(session.meetingUrl, '_blank');
                        }}
                        disabled={!session.meetingUrl}
                        className={`p-1.5 rounded-lg transition-all ${
                          session.meetingUrl
                            ? 'bg-black text-white hover:bg-indigo-600 opacity-0 group-hover:opacity-100'
                            : 'bg-slate-100 text-slate-300 cursor-not-allowed'
                        }`}
                        title={session.meetingUrl ? "Join meeting" : "No meeting link"}
                      >
                        <ExternalLink size={10} />
                      </button>
                      {onDelete && (
                        <button
                          onClick={(e) => { e.stopPropagation(); onDelete(session); }}
                          className="p-1.5 bg-white border border-slate-200 text-slate-500 hover:text-rose-600 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                          title="Delete"
                        >
                          <Trash2 size={10} />
                        </button>
                      )}
                    </div>
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

      <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm relative overflow-hidden group">
        <div className="relative z-10">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-indigo-500/20">
            <Sparkles size={18} className="text-white" />
          </div>
          <h4 className="text-xl font-black uppercase tracking-tighter leading-tight mb-2 text-slate-900">Automate Bookings</h4>
          <p className="text-[10px] font-bold text-slate-500 leading-relaxed uppercase tracking-widest">
            Connect Google Calendar or Zoom to auto-generate secure meeting links and sync sessions.
          </p>
          <div className="mt-5 space-y-2.5">
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="w-8 h-8 bg-indigo-100 rounded-xl flex items-center justify-center shrink-0">
                <Video size={14} className="text-indigo-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-700">Google Calendar</p>
                <p className="text-[8px] text-slate-400 font-bold uppercase tracking-wider">
                  {settings.calendarSync ? 'Connected' : 'Not connected'}
                </p>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-[7px] font-black uppercase tracking-widest ${settings.calendarSync ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-500'}`}>
                {settings.calendarSync ? 'ON' : 'OFF'}
              </span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="w-8 h-8 bg-indigo-100 rounded-xl flex items-center justify-center shrink-0">
                <Sparkles size={14} className="text-indigo-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-700">Auto Meeting Links</p>
                <p className="text-[8px] text-slate-400 font-bold uppercase tracking-wider">
                  {settings.autoMeetLink ? 'Auto-generate enabled' : 'Manual links only'}
                </p>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-[7px] font-black uppercase tracking-widest ${settings.autoMeetLink ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-500'}`}>
                {settings.autoMeetLink ? 'ON' : 'OFF'}
              </span>
            </div>
          </div>
          <button
            onClick={() => {
              onSaveSettings({
                ...settings,
                calendarSync: true,
                autoMeetLink: true,
              });
            }}
            className="mt-5 w-full py-3.5 bg-black hover:bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-[1.02] transition-all shadow-md"
          >
            Enable Sync & Auto-Meet
          </button>
        </div>
      </div>
    </div>
  );
};
