import React from 'react';
import type { Program, StudentProfile, Session } from '../../../../types';

interface Props {
  currentProgram: Program | null;
  nextProgram: Program | null;
  activeStudents: number;
  studentCounts: { accepted: number; active: number; notArchived: number; assigned: number };
  nextSession: Session | null;
  upcomingSessions: Session[];
  onTabChange: (tab: string) => void;
}

export const HeroSidePanel: React.FC<Props> = ({ currentProgram, nextProgram, activeStudents, studentCounts, nextSession, upcomingSessions, onTabChange }) => {
  const items = [
    {
      label: 'Current Program',
      value: currentProgram?.title || 'No active program',
      sub: currentProgram ? `${currentProgram.studentCount || 0} students` : undefined,
      tab: 'programs',
    },
    {
      label: 'Active Students',
      value: String(activeStudents),
      sub: `${studentCounts.assigned} total assigned • ${studentCounts.accepted} accepted`,
      tab: 'mentees',
    },
    {
      label: 'Next Session',
      value: nextSession ? `Today • ${(() => { try { return new Date(nextSession.startTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }); } catch { return 'Scheduled'; }})()}` : 'None Scheduled',
      sub: nextSession ? nextSession.title : undefined,
      tab: 'sessions',
    },
  ];

  if (nextProgram) {
    items.splice(1, 0, {
      label: 'Next Program',
      value: nextProgram.title,
      sub: 'Upcoming',
      tab: 'programs',
    });
  }

  return (
    <div className="md:col-span-4 grid grid-cols-2 gap-x-6 gap-y-6 border-t md:border-t-0 md:border-l border-white/10 pt-6 md:pt-0 md:pl-10 h-full">
      {items.map(item => (
        <div key={item.label} className="space-y-1 cursor-pointer group" onClick={() => onTabChange(item.tab)}>
          <p className="text-[9px] font-black uppercase tracking-wider text-white/40">{item.label}</p>
          <p className="text-xs sm:text-sm font-bold text-white group-hover:text-indigo-300 transition-colors leading-tight">{item.value}</p>
          {item.sub && <p className="text-[9px] text-white/30 font-medium">{item.sub}</p>}
        </div>
      ))}
    </div>
  );
};
