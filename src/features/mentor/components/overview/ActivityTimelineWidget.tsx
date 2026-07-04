import React from 'react';
import { Activity, Calendar, CheckCircle, ClipboardList, FileText, Users, UserPlus, BookOpen, Star } from 'lucide-react';
import type { ActivityEvent } from '../../hooks/useOverviewStore';

interface Props {
  activities: ActivityEvent[];
  onStudentClick: (studentId: string) => void;
  onViewAll: () => void;
  formatRelativeTime: (s: string) => string;
}

const ICON_MAP: Record<string, React.FC<{ size?: number; className?: string }>> = {
  Calendar, CheckCircle, ClipboardList, FileText, Users, UserPlus, BookOpen, Star, Activity,
};

export const ActivityTimelineWidget: React.FC<Props> = ({ activities, onStudentClick, onViewAll, formatRelativeTime }) => {
  return (
    <div className="lg:col-span-2 bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm flex flex-col h-[520px]">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-lg font-black uppercase tracking-tighter text-slate-900">Student Activity Timeline</h3>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Real-time engagement tracking</p>
        </div>
        <button onClick={onViewAll} className="text-xs font-black uppercase tracking-wider text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
          View All
        </button>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
        {activities.length > 0 ? (
          activities.map((a) => {
            const Icon = ICON_MAP[a.icon] || Activity;
            return (
              <div
                key={a.id}
                onClick={() => onStudentClick(a.studentId)}
                className="flex items-center gap-4 p-3 rounded-2xl hover:bg-slate-50/80 transition-all border border-transparent hover:border-slate-100 cursor-pointer group"
              >
                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-sm text-slate-600 border border-slate-200 text-[10px]">
                  {a.studentAvatar ? (
                    <img src={a.studentAvatar} alt="" className="w-full h-full rounded-full object-cover" />
                  ) : (
                    a.studentName.slice(0, 2).toUpperCase()
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 transition-colors break-words">{a.studentName}</p>
                  <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{a.activity}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] text-slate-400 font-medium">{formatRelativeTime(a.timestamp)}</span>
                  <div className={`w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center`}>
                    <Icon size={14} className={a.color} />
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center py-12">
            <Activity className="text-slate-300 mb-2 animate-pulse" size={32} />
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">No activity yet. Activity will appear as students begin interacting.</p>
          </div>
        )}
      </div>
    </div>
  );
};
