import React from 'react';
import { BookOpen, Users, Layers, CheckCircle } from 'lucide-react';
import type { Program } from '../../../../types';

interface Props {
  currentProgram: Program | null;
  activeEnrollments: any[];
  onTabChange: (tab: string) => void;
}

export const CurrentProgramInfo: React.FC<Props> = ({ currentProgram, activeEnrollments, onTabChange }) => {
  if (!currentProgram) {
    return (
      <div className="p-4 rounded-2xl bg-slate-50 border border-dashed border-slate-200 text-center cursor-pointer" onClick={() => onTabChange('programs')}>
        <BookOpen size={16} className="mx-auto text-slate-300 mb-1" />
        <p className="text-[10px] font-bold text-slate-400">No active program</p>
      </div>
    );
  }

  const moduleCount = currentProgram.modules?.length || 0;
  const completionRate = currentProgram.progress || 0;

  return (
    <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-100 cursor-pointer group" onClick={() => onTabChange('programs')}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <BookOpen size={14} className="text-indigo-600" />
          <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Current Program</p>
        </div>
        <span className="text-[8px] font-black text-indigo-600 uppercase tracking-wider group-hover:underline">View</span>
      </div>
      <p className="text-sm font-bold text-slate-900 mb-2">{currentProgram.title}</p>
      <div className="grid grid-cols-3 gap-2 text-[10px]">
        <div className="flex items-center gap-1">
          <Users size={10} className="text-slate-400" />
          <span className="text-slate-600 font-medium">{activeEnrollments.length} enrolled</span>
        </div>
        <div className="flex items-center gap-1">
          <Layers size={10} className="text-slate-400" />
          <span className="text-slate-600 font-medium">{moduleCount} modules</span>
        </div>
        <div className="flex items-center gap-1">
          <CheckCircle size={10} className="text-slate-400" />
          <span className="text-slate-600 font-medium">{completionRate}%</span>
        </div>
      </div>
    </div>
  );
};
