import React from 'react';
import { FileText, Calendar, MessageSquare, ClipboardList, AlertTriangle, Star, UserX, XCircle, AlertCircle } from 'lucide-react';
import type { Priority } from '../../hooks/useOverviewStore';

interface Props {
  priorities: Priority[];
  onAction: (tab: string) => void;
}

const ICON_MAP: Record<string, React.FC<{ size?: number; className?: string }>> = {
  FileText, Calendar, MessageSquare, ClipboardList, AlertTriangle, Star, UserX, XCircle, AlertCircle,
};

export const TodayPrioritiesWidget: React.FC<Props> = ({ priorities, onAction }) => {
  if (priorities.length === 0) return (
    <div className="space-y-3 pt-2">
      <p className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Today's Priorities</p>
      <p className="text-xs text-white/50 font-medium italic">All caught up — no outstanding items.</p>
    </div>
  );

  return (
    <div className="space-y-3 pt-2">
      <p className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Today's Priorities</p>
      <ul className="space-y-2.5 text-xs sm:text-sm text-white/90 font-semibold">
        {priorities.map((p) => {
          const Icon = ICON_MAP[p.icon] || AlertCircle;
          return (
            <li key={p.id} className="flex items-center gap-3 group cursor-pointer" onClick={() => onAction(p.tab)}>
              <span className={`w-1.5 h-1.5 ${p.color} rounded-full shrink-0`} />
              <span className="flex items-center gap-2 hover:text-white transition-colors">
                <Icon size={12} className="text-white/50" />
                {p.label}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
};
