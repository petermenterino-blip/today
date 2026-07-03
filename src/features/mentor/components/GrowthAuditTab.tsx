import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { Target, CheckCircle, Calendar, Search, Save, Loader2 } from 'lucide-react';
import { StudentProfile, TaskActivity } from '../../../types';
import { useGrowthAudits } from '../../../hooks/useGrowthAudits';
import { notifySuccess, notifyError } from '../../../utils/toast';

interface GrowthAuditTabProps {
  studentProfiles: StudentProfile[];
  taskActivities: TaskActivity[];
}

const GrowthAuditTab: React.FC<GrowthAuditTabProps> = ({ studentProfiles, taskActivities }) => {
  const [search, setSearch] = useState('');
  const [savingId, setSavingId] = useState<string | null>(null);
  const [editingScores, setEditingScores] = useState<Record<string, number>>({});

  const { getStudentMetrics, updateGrowthScore } = useGrowthAudits(taskActivities);

  const filtered = useMemo(() => {
    if (!search.trim()) return studentProfiles;
    const q = search.toLowerCase();
    return studentProfiles.filter(s => (s.name || '').toLowerCase().includes(q));
  }, [studentProfiles, search]);

  const handleSaveScore = async (userId: string) => {
    const score = editingScores[userId];
    if (score === undefined || score < 0 || score > 100) return;
    setSavingId(userId);
    try {
      await updateGrowthScore(userId, score);
      notifySuccess(`Growth score updated to ${score}`);
    } catch {
      notifyError('Failed to update growth score');
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-slate-900">Growth Audit</h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">Evaluate and update student growth scores</p>
        </div>
        <div className="relative max-w-xs w-full">
          <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
          <input
            type="text"
            placeholder="Search students..."
            className="w-full pl-10 pr-4 py-3 bg-white border border-slate-100 rounded-2xl text-sm font-medium outline-none focus:border-black transition-all"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {filtered.length === 0 && (
          <div className="bg-white p-12 rounded-[32px] border border-slate-100 shadow-sm text-center">
            <p className="text-sm text-slate-400 font-medium">No students found</p>
          </div>
        )}

        {filtered.map((student, i) => {
          const userId = student.user_id || student.id || '';
          const metrics = getStudentMetrics(userId);
          const currentScore = editingScores[userId] ?? student.growth_score ?? 0;
          const isSaving = savingId === userId;

          return (
            <motion.div
              key={userId}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm hover:shadow-md transition-all"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-black text-sm">
                    {(student.name || '?')[0]}
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-slate-900">{student.name || 'Unknown'}</h3>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{student.current_status || student.status || 'Active'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Growth Score</p>
                    <div className="flex items-center gap-2 mt-1">
                      <input
                        type="number"
                        min={0}
                        max={100}
                        className="w-16 px-2 py-1 bg-slate-50 border border-slate-200 rounded-xl text-lg font-black text-indigo-600 text-center outline-none focus:border-indigo-400 transition-all"
                        value={currentScore}
                        onChange={e => setEditingScores(prev => ({ ...prev, [userId]: Math.min(100, Math.max(0, parseInt(e.target.value) || 0)) }))}
                      />
                      <button
                        onClick={() => handleSaveScore(userId)}
                        disabled={isSaving || (editingScores[userId] === undefined)}
                        className="p-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all disabled:opacity-50"
                      >
                        {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-5 text-[10px] font-bold uppercase tracking-widest">
                    <div className="text-center">
                      <Target size={14} className="mx-auto mb-1 text-emerald-500" />
                      <p className="text-slate-900">{metrics.completionRate}%</p>
                      <p className="text-slate-400">Done</p>
                    </div>
                    <div className="text-center">
                      <CheckCircle size={14} className="mx-auto mb-1 text-indigo-500" />
                      <p className="text-slate-900">{metrics.completedTasks}</p>
                      <p className="text-slate-400">Tasks</p>
                    </div>
                    <div className="text-center">
                      <Calendar size={14} className="mx-auto mb-1 text-amber-500" />
                      <p className="text-slate-900">{metrics.totalTasks}</p>
                      <p className="text-slate-400">Total</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default GrowthAuditTab;
