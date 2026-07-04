import React from 'react';
import { CheckCircle, AlertTriangle, AlertCircle, Users } from 'lucide-react';
import type { RiskStudent } from '../../hooks/useOverviewStore';

interface Props {
  students: RiskStudent[];
  onStudentClick: (studentId: string) => void;
  onQuickMessage: (studentId: string, name: string) => void;
  onScheduleSession: (studentId: string) => void;
}

export const AtRiskStudentsWidget: React.FC<Props> = ({ students, onStudentClick, onQuickMessage, onScheduleSession }) => {
  return (
    <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm flex flex-col h-[520px]">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-black uppercase tracking-tighter text-slate-900">At-Risk Students</h3>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Students needing attention</p>
        </div>
        {students.length > 0 && (
          <span className="px-2 py-1 bg-red-50 text-red-600 text-[9px] font-black uppercase tracking-wider rounded-full">
            {students.length}
          </span>
        )}
      </div>

      <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
        {students.length > 0 ? (
          students.map((risk) => {
            const badgeColor =
              risk.riskLevel === 'high' ? 'bg-red-50 text-red-600 border-red-100' :
              risk.riskLevel === 'medium' ? 'bg-amber-50 text-amber-600 border-amber-100' :
              'bg-blue-50 text-blue-600 border-blue-100';

            const riskIcon = risk.riskLevel === 'high' ? AlertTriangle : risk.riskLevel === 'medium' ? AlertCircle : AlertCircle;

            return (
              <div
                key={risk.studentId}
                className="p-3 rounded-2xl hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-all group"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div
                    className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-xs text-slate-600 border border-slate-200 cursor-pointer"
                    onClick={() => onStudentClick(risk.studentId)}
                  >
                    {risk.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 transition-colors cursor-pointer"
                      onClick={() => onStudentClick(risk.studentId)}
                    >
                      {risk.name}
                    </p>
                    <p className="text-[9px] text-slate-400 font-medium">{risk.program} • Risk: {risk.riskScore}%</p>
                  </div>
                  <span className={`px-2 py-0.5 text-[8px] font-black uppercase tracking-wider border rounded-full flex items-center gap-1 ${badgeColor}`}>
                    <riskIcon size={8} />
                    {risk.riskLevel}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 pl-11">{risk.reason}</p>
                {risk.suggestedAction && (
                  <p className="text-[10px] text-indigo-600 font-bold pl-11 mt-1">
                    Suggested: {risk.suggestedAction}
                  </p>
                )}
                <div className="flex gap-2 mt-2 pl-11">
                  <button
                    onClick={() => onQuickMessage(risk.studentId, risk.name)}
                    className="px-2 py-1 text-[8px] font-black uppercase tracking-wider bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors"
                  >
                    Message
                  </button>
                  <button
                    onClick={() => onScheduleSession(risk.studentId)}
                    className="px-2 py-1 text-[8px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100 transition-colors"
                  >
                    Schedule
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center py-12">
            <CheckCircle className="text-emerald-400 mb-2" size={32} />
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Excellent! No students currently require intervention.</p>
          </div>
        )}
      </div>
    </div>
  );
};
