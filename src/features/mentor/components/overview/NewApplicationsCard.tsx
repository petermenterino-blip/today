import React from 'react';
import { Users, ChevronRight, Clock } from 'lucide-react';

interface Props {
  count: number;
  newestApplicant?: { name: string; created_at: string };
  onReview: () => void;
}

export const NewApplicationsCard: React.FC<Props> = ({ count, newestApplicant, onReview }) => {
  if (count === 0) return null;
  const waitingTime = newestApplicant?.created_at
    ? Math.floor((Date.now() - new Date(newestApplicant.created_at).getTime()) / (1000 * 60 * 60))
    : 0;

  return (
    <button
      onClick={onReview}
      className="w-full mt-6 group relative overflow-hidden bg-white rounded-2xl p-5 text-left transition-all hover:bg-slate-50 active:scale-[0.99] shadow-lg"
    >
      <div className="relative z-10 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center">
            <Users className="text-indigo-600" size={24} />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">New Applications</p>
            <p className="text-3xl font-black text-slate-900 mt-0.5">{count}</p>
            {newestApplicant && (
              <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                <Clock size={10} /> Newest: {newestApplicant.name} • {waitingTime}h ago
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 text-slate-400 group-hover:text-slate-600 transition-colors">
          <span className="text-[10px] font-black uppercase tracking-widest">Review</span>
          <ChevronRight size={16} />
        </div>
      </div>
    </button>
  );
};
