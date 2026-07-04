import React from 'react';
import type { MentorStatus } from '../../hooks/useOverviewStore';

interface Props {
  status: MentorStatus;
  nextSession: any;
  formatRelativeTime: (s: string) => string;
}

const STATUS_CONFIG: Record<MentorStatus, { label: string; color: string; pulse: boolean }> = {
  active: { label: 'Active', color: 'bg-emerald-400', pulse: true },
  busy: { label: 'Busy', color: 'bg-amber-400', pulse: true },
  in_session: { label: 'In Session', color: 'bg-indigo-400', pulse: true },
  offline: { label: 'Offline', color: 'bg-slate-400', pulse: false },
  away: { label: 'Away', color: 'bg-orange-400', pulse: true },
};

export const MentorWorkspaceStatus: React.FC<Props> = ({ status, nextSession, formatRelativeTime }) => {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.active;
  return (
    <div className="space-y-2">
      <h3 className="text-3xl md:text-4xl font-black uppercase tracking-tighter text-white">
        MENTOR COMMAND CENTER
      </h3>
      <div className="flex items-center gap-2">
        <span className={`w-2.5 h-2.5 rounded-full ${cfg.color} ${cfg.pulse ? 'animate-pulse' : ''}`} />
        <p className="text-white/60 text-[10px] font-black uppercase tracking-[0.2em]">
          Mentoring workspace — {cfg.label}
        </p>
      </div>
      {nextSession && (
        <p className="text-[10px] text-white/40 font-medium mt-1">
          Next session in {formatRelativeTime(nextSession.startTime)}
        </p>
      )}
    </div>
  );
};
