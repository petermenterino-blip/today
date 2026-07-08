import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import {
  Search, ChevronDown, ChevronUp, UserRound, Calendar, Clock,
  CheckCircle2, Circle, PauseCircle, Loader2, TrendingUp
} from 'lucide-react';
import { useProgramEnrollments } from '../../../hooks/useProgramEnrollments';
import { ProgramEnrollment } from '../../../types';
import { notifySuccess, notifyError } from '../../../utils/toast';

interface StudentProgressTrackerProps {
  programId: string;
}

export const StudentProgressTracker: React.FC<StudentProgressTrackerProps> = ({ programId }) => {
  const { enrollments, loading, updateEnrollment: update } = useProgramEnrollments(programId);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'progress' | 'status'>('progress');

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return (enrollments || []).filter(e =>
      (e.student_name || '').toLowerCase().includes(q) ||
      (e.student_email || '').toLowerCase().includes(q)
    ).sort((a, b) => {
      if (sortBy === 'name') return (a.student_name || '').localeCompare(b.student_name || '');
      if (sortBy === 'progress') return (b.percentage_complete || 0) - (a.percentage_complete || 0);
      if (sortBy === 'status') return (a.enrollment_status || '').localeCompare(b.enrollment_status || '');
      return 0;
    });
  }, [enrollments, search, sortBy]);

  const stats = useMemo(() => ({
    total: (enrollments || []).length,
    active: (enrollments || []).filter(e => e.enrollment_status === 'Active' || e.enrollment_status === 'Assigned').length,
    completed: (enrollments || []).filter(e => e.enrollment_status === 'Completed').length,
    paused: (enrollments || []).filter(e => e.enrollment_status === 'Paused').length,
    avgProgress: (enrollments || []).length > 0
      ? Math.round((enrollments || []).reduce((sum, e) => sum + (e.percentage_complete || 0), 0) / (enrollments || []).length)
      : 0,
  }), [enrollments]);

  if (loading) {
    return <div className="text-center py-12 text-xs text-slate-400 font-medium"><Loader2 size={20} className="animate-spin mx-auto mb-3" />Loading progress...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Total Enrolled', value: stats.total, color: 'bg-slate-50', text: 'text-slate-700' },
          { label: 'Active', value: stats.active, color: 'bg-emerald-50', text: 'text-emerald-600' },
          { label: 'Completed', value: stats.completed, color: 'bg-indigo-50', text: 'text-indigo-600' },
          { label: 'Avg Progress', value: `${stats.avgProgress}%`, color: 'bg-amber-50', text: 'text-amber-600' },
        ].map((s, i) => (
          <div key={i} className={`${s.color} rounded-2xl p-4`}>
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">{s.label}</p>
            <p className={`text-2xl font-black ${s.text}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Search & Sort */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-medium outline-none focus:border-black transition-all"
            placeholder="Search students..." />
        </div>
        <div className="flex gap-1">
          {(['progress', 'name', 'status'] as const).map(s => (
            <button key={s} onClick={() => setSortBy(s)}
              className={`px-3 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
                sortBy === s ? 'bg-black text-white' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
              }`}>{s}</button>
          ))}
        </div>
      </div>

      {/* Student List */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 text-xs text-slate-400 font-medium">No enrollments yet</div>
      ) : (
        <div className="space-y-2">
          {filtered.map((enrollment) => (
            <StudentProgressRow key={enrollment.id} enrollment={enrollment} onUpdate={(updates) => update({ id: enrollment.id, updates })} />
          ))}
        </div>
      )}
    </div>
  );
};

interface StudentProgressRowProps {
  enrollment: ProgramEnrollment;
  onUpdate: (updates: Partial<ProgramEnrollment>) => Promise<{ error?: string } | undefined>;
}

const StudentProgressRow: React.FC<StudentProgressRowProps> = ({ enrollment, onUpdate }) => {
  const [expanded, setExpanded] = useState(false);
  const [updating, setUpdating] = useState(false);

  const statusIcon = (s: string) => {
    if (s === 'Completed') return <CheckCircle2 size={14} className="text-indigo-500" />;
    if (s === 'Active' || s === 'Assigned') return <Circle size={14} className="text-emerald-500" />;
    if (s === 'Paused') return <PauseCircle size={14} className="text-amber-500" />;
    return <Circle size={14} className="text-slate-300" />;
  };

  const updateStatus = async (status: string) => {
    setUpdating(true);
    const res = await onUpdate({ enrollment_status: status });
    if (!res?.error) notifySuccess(`Status updated to ${status}`);
    else notifyError(res.error);
    setUpdating(false);
  };

  const pct = enrollment.percentage_complete || 0;

  return (
    <motion.div className="bg-white border border-slate-100 rounded-2xl overflow-hidden">
      <button onClick={() => setExpanded(!expanded)} className="w-full flex items-center gap-4 p-4 hover:bg-slate-50 transition-colors">
        <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center">
          <UserRound size={16} className="text-slate-500" />
        </div>
        <div className="flex-1 text-left">
          <div className="flex items-center gap-2">
            <p className="text-sm font-bold text-slate-800">{enrollment.student_name || enrollment.student_email || 'Unknown Student'}</p>
            {statusIcon(enrollment.enrollment_status || 'assigned')}
          </div>
          <div className="flex items-center gap-3 mt-1 text-[9px] text-slate-400 font-medium">
            {enrollment.target_completion_date && (
              <span className="flex items-center gap-1"><Calendar size={10} /> Due {enrollment.target_completion_date}</span>
            )}
            {enrollment.last_activity && (
              <span className="flex items-center gap-1"><Clock size={10} /> Last activity {new Date(enrollment.last_activity).toLocaleDateString()}</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Progress ring */}
          <div className="relative w-10 h-10 flex items-center justify-center">
            <svg className="absolute inset-0" viewBox="0 0 40 40">
              <circle cx="20" cy="20" r="16" fill="none" stroke="#f1f5f9" strokeWidth="3" />
              <circle cx="20" cy="20" r="16" fill="none" stroke={pct >= 80 ? '#6366f1' : pct > 0 ? '#f59e0b' : '#e2e8f0'} strokeWidth="3"
                strokeDasharray={`${2 * Math.PI * 16}`} strokeDashoffset={`${2 * Math.PI * 16 * (1 - pct / 100)}`}
                transform="rotate(-90 20 20)" strokeLinecap="round" />
            </svg>
            <span className="text-[9px] font-black">{pct}%</span>
          </div>
          {expanded ? <ChevronUp size={14} className="text-slate-300" /> : <ChevronDown size={14} className="text-slate-300" />}
        </div>
      </button>

      {expanded && (
        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="border-t border-slate-100">
          <div className="p-4 space-y-4">
            {/* Progress Bar */}
            <div>
              <div className="flex justify-between text-[9px] font-bold text-slate-400 mb-1.5">
                <span>Progress</span>
                <span>{pct}%</span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  className="h-full bg-indigo-500 rounded-full"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-50 rounded-xl p-3">
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Status</p>
                <p className="text-sm font-bold text-slate-700 mt-0.5">{enrollment.enrollment_status || 'Assigned'}</p>
              </div>
              {enrollment.current_module_id && (
                <div className="bg-slate-50 rounded-xl p-3">
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Current Module</p>
                  <p className="text-sm font-bold text-slate-700 mt-0.5 truncate">{enrollment.current_module_id}</p>
                </div>
              )}
              <div className="bg-slate-50 rounded-xl p-3">
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Completed</p>
                <p className="text-sm font-bold text-slate-700 mt-0.5">{(enrollment.completed_modules || []).length} / {((enrollment.completed_modules || []).length + (enrollment.remaining_modules || []).length) || '?'}</p>
              </div>
              {enrollment.start_date && (
                <div className="bg-slate-50 rounded-xl p-3">
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Started</p>
                  <p className="text-sm font-bold text-slate-700 mt-0.5">{enrollment.start_date}</p>
                </div>
              )}
            </div>

            {/* Status actions */}
            <div>
              <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Update Status</label>
              <div className="flex gap-2">
                {['Active', 'Paused', 'Completed'].map(status => (
                  <button key={status} disabled={updating || enrollment.enrollment_status === status}
                    onClick={() => updateStatus(status)}
                    className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
                      enrollment.enrollment_status === status
                        ? 'bg-black text-white'
                        : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                    } disabled:opacity-50`}>
                    {updating ? <Loader2 size={10} className="animate-spin" /> : status}
                  </button>
                ))}
              </div>
            </div>

            {/* Mentor Notes */}
            {enrollment.mentor_notes && (
              <div className="bg-amber-50 rounded-xl p-3">
                <p className="text-[9px] font-black uppercase tracking-widest text-amber-500 mb-1">Mentor Notes</p>
                <p className="text-xs font-medium text-amber-700">{enrollment.mentor_notes}</p>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};
