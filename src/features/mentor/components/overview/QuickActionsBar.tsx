import React from 'react';
import { FileText, Video, MessageSquare, CalendarDays, TrendingUp, Plus, BookOpen, CalendarPlus, Megaphone, Image, Bot } from 'lucide-react';

interface QuickAction {
  label: string;
  icon: React.ReactNode;
  primary?: boolean;
  color?: string;
  action: () => void;
}

interface Props {
  onReviewApplications: () => void;
  onStartSession: () => void;
  onMessageStudents: () => void;
  onViewCalendar: () => void;
  onGrowthAudit: () => void;
  onCreateProgram: () => void;
  onAddResource: () => void;
  onCreateEvent: () => void;
  onBroadcast: () => void;
  onUploadGallery: () => void;
  onAISummary: () => void;
  hasSession: boolean;
}

export const QuickActionsBar: React.FC<Props> = ({
  onReviewApplications, onStartSession, onMessageStudents, onViewCalendar, onGrowthAudit,
  onCreateProgram, onAddResource, onCreateEvent, onBroadcast, onUploadGallery, onAISummary,
  hasSession,
}) => {
  const primaryActions: QuickAction[] = [
    { label: 'Review Applications', icon: <FileText size={13} />, primary: true, color: 'bg-white text-brand-charcoal hover:bg-slate-100', action: onReviewApplications },
    { label: hasSession ? 'Start Session' : 'Schedule Session', icon: <Video size={13} />, primary: true, color: 'bg-indigo-600 hover:bg-indigo-700 text-white', action: onStartSession },
    { label: 'Message Students', icon: <MessageSquare size={13} />, color: 'bg-white/10 hover:bg-white/15 text-white border border-white/5', action: onMessageStudents },
    { label: 'View Calendar', icon: <CalendarDays size={13} />, color: 'bg-white/10 hover:bg-white/15 text-white border border-white/5', action: onViewCalendar },
    { label: 'Growth Audit', icon: <TrendingUp size={13} />, primary: true, color: 'bg-emerald-500 hover:bg-emerald-600 text-white', action: onGrowthAudit },
  ];

  const secondaryActions: QuickAction[] = [
    { label: 'Create Program', icon: <Plus size={12} />, color: 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200', action: onCreateProgram },
    { label: 'Add Resource', icon: <BookOpen size={12} />, color: 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200', action: onAddResource },
    { label: 'Create Event', icon: <CalendarPlus size={12} />, color: 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200', action: onCreateEvent },
    { label: 'Broadcast', icon: <Megaphone size={12} />, color: 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200', action: onBroadcast },
    { label: 'Upload Gallery', icon: <Image size={12} />, color: 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200', action: onUploadGallery },
    { label: 'AI Summary', icon: <Bot size={12} />, color: 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200', action: onAISummary },
  ];

  return (
    <div className="mt-6 pt-6 border-t border-white/10 space-y-3 relative z-10">
      <div className="flex flex-wrap gap-3 items-center">
        {primaryActions.map((btn, i) => (
          <button
            key={i}
            onClick={btn.action}
            className={`px-4 py-2.5 font-bold rounded-2xl text-[11px] transition-all shadow-md active:scale-95 flex items-center gap-1.5 text-left ${btn.color || 'bg-white/10 hover:bg-white/15 text-white'}`}
          >
            {btn.icon}
            {btn.label}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap gap-2 items-center">
        <span className="text-[8px] font-black text-white/30 uppercase tracking-widest mr-1">More:</span>
        {secondaryActions.map((btn, i) => (
          <button
            key={i}
            onClick={btn.action}
            className={`px-3 py-1.5 font-bold rounded-xl text-[10px] transition-all active:scale-95 flex items-center gap-1 text-left ${btn.color}`}
          >
            {btn.icon}
            {btn.label}
          </button>
        ))}
      </div>
    </div>
  );
};
