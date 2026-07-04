import React from 'react';
import { Users, AlertTriangle, UserX, ClipboardList } from 'lucide-react';

interface Props {
  healthy: number;
  atRisk: number;
  inactive: number;
  needsReview: number;
  attendanceRate: number;
  avgProgress: number;
  upcomingDeadlines: number;
  onFilter?: (filter: string) => void;
}

export const HealthOverviewWidget: React.FC<Props> = ({ healthy, atRisk, inactive, needsReview, attendanceRate, avgProgress, upcomingDeadlines, onFilter }) => {
  const cards = [
    { label: 'Healthy', value: healthy, icon: Users, color: 'bg-emerald-50 text-emerald-600 border-emerald-100', filter: 'healthy' },
    { label: 'At Risk', value: atRisk, icon: AlertTriangle, color: 'bg-red-50 text-red-600 border-red-100', filter: 'at-risk' },
    { label: 'Inactive', value: inactive, icon: UserX, color: 'bg-amber-50 text-amber-600 border-amber-100', filter: 'inactive' },
    { label: 'Needs Review', value: needsReview, icon: ClipboardList, color: 'bg-purple-50 text-purple-600 border-purple-100', filter: 'needs-review' },
  ];

  return (
    <div className="bg-white rounded-[32px] p-6 border border-slate-100 shadow-sm space-y-4">
      <div>
        <h4 className="text-xs font-black uppercase tracking-widest text-slate-400">MENTORING HEALTH</h4>
        <p className="text-sm font-black text-brand-charcoal uppercase tracking-tighter">Cohort Wellness Overview</p>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {cards.map(card => (
          <button
            key={card.label}
            onClick={() => onFilter?.(card.filter)}
            className={`p-3 rounded-2xl ${card.color} border transition-all hover:shadow-md text-left`}
          >
            <card.icon size={16} />
            <p className="text-lg font-black mt-1">{card.value}</p>
            <p className="text-[8px] font-black uppercase tracking-widest mt-0.5">{card.label}</p>
          </button>
        ))}
      </div>
      <div className="flex items-center gap-4 text-[10px] text-slate-500 font-medium pt-2 border-t border-slate-50">
        <span>Attendance: <strong className="text-slate-800">{attendanceRate}%</strong></span>
        <span>Avg Progress: <strong className="text-slate-800">{avgProgress}%</strong></span>
        {upcomingDeadlines > 0 && <span className="text-amber-600 font-bold">{upcomingDeadlines} upcoming deadlines</span>}
      </div>
    </div>
  );
};
