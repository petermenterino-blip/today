import React from 'react';
import { Sparkles } from 'lucide-react';

interface Props {
  summary: string;
}

export const AIDailySummaryWidget: React.FC<Props> = ({ summary }) => {
  if (!summary) return null;
  return (
    <div className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 rounded-2xl p-4 border border-indigo-200/30 flex items-start gap-3">
      <div className="w-8 h-8 bg-indigo-100 rounded-xl flex items-center justify-center shrink-0">
        <Sparkles size={14} className="text-indigo-600" />
      </div>
      <div>
        <p className="text-[9px] font-black uppercase tracking-widest text-indigo-600 mb-1">AI Daily Summary</p>
        <p className="text-xs text-slate-600 font-medium leading-relaxed">{summary}</p>
      </div>
    </div>
  );
};
