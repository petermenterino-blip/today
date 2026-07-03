import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'motion/react';
import {
  BookOpen, Users, TrendingUp, CheckCircle2, Clock, AlertTriangle,
  Search, X, CalendarDays, Eye,
  ExternalLink, ChevronLeft, ChevronRight, ArrowUpDown,
  ClipboardList, History, Send, Loader2
} from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { studentProgressService, StudentProgress } from '../../../services/studentProgressService';
import { taskStorage } from '../../../services/taskStorage';
import { goalStorage } from '../../../services/goalStorage';
import { sessionService } from '../../../services/sessionService';
import { timelineService } from '../../../services/timelineService';
import { useRealtime } from '../../../hooks/useRealtime';
import { Program, StudentProfile } from '../../../types';
import type { ActionItem } from '../../../interfaces';
import type { Goal } from '../../../interfaces';

interface ProgramProgressTabProps {
  programs: Program[];
  studentProfiles: StudentProfile[];
  onNavigateToStudent?: (studentId: string) => void;
}

type SortField = 'name' | 'progress' | 'program' | 'lastActivity';
type SortDirection = 'asc' | 'desc';
type StatusFilter = 'all' | 'on-track' | 'at-risk' | 'not-started' | 'active' | 'completed';
type SummaryFilter = 'all' | 'on-track' | 'at-risk' | 'not-started';

const PAGE_SIZE = 25;

function computeProgress(record: StudentProgress | undefined): number {
  if (!record) return 0;
  const lessonIds = Object.keys(record.lessons);
  if (lessonIds.length === 0) return 0;
  const completed = lessonIds.filter(id =>
    record.lessons[id].quizCompleted || record.lessons[id].assignmentSubmitted
  ).length;
  return Math.round((completed / lessonIds.length) * 100);
}

function getStatusFromPct(pct: number): 'not-started' | 'at-risk' | 'in-progress' | 'on-track' {
  if (pct === 0) return 'not-started';
  if (pct < 30) return 'at-risk';
  if (pct < 70) return 'in-progress';
  return 'on-track';
}

const statusConfig = {
  'not-started': { color: 'text-slate-400', bg: 'bg-slate-50', border: 'border-slate-200', icon: Clock, label: 'Not Started' },
  'at-risk': { color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200', icon: AlertTriangle, label: 'At Risk' },
  'in-progress': { color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-200', icon: TrendingUp, label: 'In Progress' },
  'on-track': { color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200', icon: CheckCircle2, label: 'On Track' },
};

const SkeletonRow = ({ programCount }: { programCount: number; key?: React.Key }) => {
  return (
    <tr className="border-b border-slate-50">
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-slate-200 rounded-full animate-pulse" />
          <div className="h-4 bg-slate-200 rounded w-28 animate-pulse" />
        </div>
      </td>
      {Array.from({ length: programCount }).map((_, i) => (
        <td key={i} className="px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex-1 max-w-[140px]">
              <div className="h-2 bg-slate-200 rounded-full animate-pulse" />
            </div>
            <div className="w-14 h-6 bg-slate-200 rounded-full animate-pulse" />
          </div>
        </td>
      ))}
    </tr>
  );
}

function ProgressSidePanel({
  student,
  program,
  progressRecord,
  progressPct,
  onClose,
  onOpenProfile,
}: {
  student: StudentProfile;
  program: Program;
  progressRecord: StudentProgress | undefined;
  progressPct: number;
  onClose: () => void;
  onOpenProfile: (studentId: string) => void;
}) {
  const [tasks, setTasks] = useState<ActionItem[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [loadingDetails, setLoadingDetails] = useState(true);

  useEffect(() => {
    let mounted = true;
    setLoadingDetails(true);
    Promise.all([
      taskStorage.getByStudentId(student.user_id || student.id || ''),
      goalStorage.getByStudentId(student.user_id || student.id || ''),
      sessionService.fetchAll(),
      timelineService.getByStudentId(student.user_id || student.id || ''),
    ]).then(([t, g, s, tl]) => {
      if (!mounted) return;
      setTasks(t);
      setGoals(g);
      setSessions((s.data || []).filter((se: any) => se.studentId === student.user_id || se.student_id === student.id));
      setTimeline(tl);
    }).catch(() => {}).finally(() => {
      if (mounted) setLoadingDetails(false);
    });
    return () => { mounted = false; };
  }, [student.user_id, student.id]);

  const modulesTotal = (program.modules || []).length;
  const lessonIds = progressRecord ? Object.keys(progressRecord.lessons) : [];
  const modulesCompleted = modulesTotal > 0
    ? (program.modules || []).filter(m =>
        (m as any).lessons?.every?.((l: any) => lessonIds.includes(l.id) && progressRecord?.lessons[l.id]?.completedAt)
      ).length
    : 0;

  const completedTasks = tasks.filter(t => t.status === 'completed' || t.status === 'approved').length;
  const upcomingSessions = sessions.filter((s: any) =>
    s.attendanceStatus === 'pending' && new Date(s.startTime || s.start_time) > new Date()
  );
  const lastActivity = timeline.length > 0 ? timeline[0].timestamp : null;
  const status = getStatusFromPct(progressPct);
  const cfg = statusConfig[status];
  const StatusIcon = cfg.icon;

  return (
    <motion.div
      initial={{ opacity: 0, x: 320 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 320 }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl z-50 overflow-y-auto border-l border-slate-100"
    >
      <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between z-10">
        <h3 className="text-sm font-black uppercase tracking-tight">Progress Details</h3>
        <button onClick={onClose} className="w-8 h-8 flex items-center justify-center bg-slate-50 rounded-full hover:bg-slate-100 transition-colors">
          <X size={14} />
        </button>
      </div>

      <div className="p-6 space-y-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center text-indigo-600 font-black text-lg">
            {student.name?.charAt(0) || '?'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-slate-900 truncate">{student.name || 'Unnamed'}</p>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{program.title}</p>
          </div>
        </div>

        {loadingDetails ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 size={24} className="animate-spin text-slate-300" />
          </div>
        ) : (
          <>
            <div className={`${cfg.bg} ${cfg.border} rounded-2xl p-5 border`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <StatusIcon size={16} className={cfg.color} />
                  <span className={`text-[10px] font-black uppercase tracking-widest ${cfg.color}`}>{cfg.label}</span>
                </div>
                <span className="text-2xl font-black">{progressPct}%</span>
              </div>
              <div className="h-2 bg-white/60 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${
                    progressPct >= 70 ? 'bg-emerald-400' : progressPct > 0 ? 'bg-amber-400' : 'bg-slate-300'
                  }`}
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Modules Done</p>
                <p className="text-xl font-black">{modulesCompleted}<span className="text-sm text-slate-400 font-medium"> / {modulesTotal}</span></p>
              </div>
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Growth Score</p>
                <p className="text-xl font-black text-indigo-600">{student.growth_score || 0}</p>
              </div>
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Tasks</p>
                <p className="text-xl font-black">{completedTasks}<span className="text-sm text-slate-400 font-medium"> / {tasks.length}</span></p>
              </div>
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Goals</p>
                <p className="text-xl font-black">{goals.filter(g => g.status === 'completed').length}<span className="text-sm text-slate-400 font-medium"> / {goals.length}</span></p>
              </div>
            </div>

            {lastActivity && (
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Last Activity</p>
                <p className="text-sm font-bold">{new Date(lastActivity).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
              </div>
            )}

            {upcomingSessions.length > 0 && (
              <div className="bg-indigo-50 rounded-2xl p-4 border border-indigo-100">
                <div className="flex items-center gap-2 mb-2">
                  <CalendarDays size={14} className="text-indigo-600" />
                  <p className="text-[9px] font-black uppercase tracking-widest text-indigo-600">Upcoming Session</p>
                </div>
                <p className="text-sm font-bold">{upcomingSessions[0].title}</p>
                <p className="text-[10px] text-indigo-500 font-medium mt-0.5">
                  {new Date(upcomingSessions[0].startTime || upcomingSessions[0].start_time).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            )}

            <div>
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2">Mentor Notes</p>
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 min-h-[60px]">
                <p className="text-sm text-slate-600">{student.notes || 'No notes yet.'}</p>
              </div>
            </div>

            <button
              onClick={() => { onOpenProfile(student.user_id || student.id || ''); onClose(); }}
              className="w-full py-3.5 bg-black text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
            >
              <ExternalLink size={14} /> Open Full Student Profile
            </button>
          </>
        )}
      </div>
    </motion.div>
  );
}

export const ProgramProgressTab: React.FC<ProgramProgressTabProps> = ({
  programs,
  studentProfiles,
  onNavigateToStudent,
}) => {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProgramId, setSelectedProgramId] = useState<string | 'all'>('all');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [activeSummaryFilter, setActiveSummaryFilter] = useState<SummaryFilter>('all');
  const [page, setPage] = useState(0);
  const [hoveredStudentId, setHoveredStudentId] = useState<string | null>(null);
  const [selectedDetail, setSelectedDetail] = useState<{
    studentId: string;
    programId: string;
    progressPct: number;
    student: StudentProfile;
    program: Program;
    record: StudentProgress | undefined;
  } | null>(null);

  const { data: progressList = [], isLoading: progressLoading } = useQuery({
    queryKey: ['student-progress'],
    queryFn: () => studentProgressService.getProgressBatch(),
    staleTime: 30000,
  });

  const [enrolledPairs, setEnrolledPairs] = useState<Set<string>>(new Set());
  const [enrollmentsLoading, setEnrollmentsLoading] = useState(true);

  const loadEnrollments = useCallback(async () => {
    setEnrollmentsLoading(true);
    try {
      const { data } = await supabase.from('program_enrollments').select('student_id, program_id');
      if (data) {
        setEnrolledPairs(new Set(data.map(e => `${e.student_id}-${e.program_id}`)));
      }
    } catch { } finally {
      setEnrollmentsLoading(false);
    }
  }, []);

  useEffect(() => { loadEnrollments(); }, [loadEnrollments]);

  useRealtime([
    {
      table: 'student_progress',
      callback: () => {
        queryClient.invalidateQueries({ queryKey: ['student-progress'] });
      },
    },
    {
      table: 'program_enrollments',
      callback: loadEnrollments,
    },
  ]);

  const progressMap = useMemo(() => {
    const map = new Map<string, StudentProgress>();
    progressList.forEach(p => {
      map.set(`${p.userId}-${p.programId}`, p);
    });
    return map;
  }, [progressList]);

  const getProgressPercent = useCallback((studentId: string, programId: string): number => {
    return computeProgress(progressMap.get(`${studentId}-${programId}`));
  }, [progressMap]);

  const filteredPrograms = selectedProgramId === 'all'
    ? programs
    : programs.filter(p => p.id === selectedProgramId);

  const filteredStudents = useMemo(() => {
    let result = studentProfiles;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(s => s.name?.toLowerCase().includes(q) || s.email?.toLowerCase().includes(q));
    }

    if (activeSummaryFilter !== 'all' || statusFilter !== 'all') {
      const activeFilter = activeSummaryFilter !== 'all' ? activeSummaryFilter : null;
      const sf = statusFilter !== 'all' ? statusFilter : null;

      result = result.filter(s => {
        let maxPct = 0;
        for (const p of filteredPrograms) {
          const pct = getProgressPercent(s.user_id || s.id || '', p.id);
          if (pct > maxPct) maxPct = pct;
        }
        const status = getStatusFromPct(maxPct);

        if (activeFilter === 'on-track' && status !== 'on-track') return false;
        if (activeFilter === 'at-risk' && status !== 'at-risk' && status !== 'in-progress') return false;
        if (activeFilter === 'not-started' && status !== 'not-started') return false;

        if (sf === 'on-track' && status !== 'on-track') return false;
        if (sf === 'at-risk' && status !== 'at-risk') return false;
        if (sf === 'not-started' && status !== 'not-started') return false;
        if (sf === 'active') {
          if (s.status !== 'active' && s.current_status !== 'Active') return false;
        }
        if (sf === 'completed') {
          if (s.status !== 'completed') return false;
        }

        return true;
      });
    }

    result = [...result].sort((a, b) => {
      const dir = sortDirection === 'asc' ? 1 : -1;
      switch (sortField) {
        case 'name':
          return dir * ((a.name || '').localeCompare(b.name || ''));
        case 'progress': {
          const aMax = Math.max(...filteredPrograms.map(p => getProgressPercent(a.user_id || a.id || '', p.id)));
          const bMax = Math.max(...filteredPrograms.map(p => getProgressPercent(b.user_id || b.id || '', p.id)));
          return dir * (aMax - bMax);
        }
        case 'program': {
          const aProg = programs.find(p => enrolledPairs.has(`${a.user_id || a.id}-${p.id}`));
          const bProg = programs.find(p => enrolledPairs.has(`${b.user_id || b.id}-${p.id}`));
          return dir * ((aProg?.title || 'Z').localeCompare(bProg?.title || 'Z'));
        }
        case 'lastActivity': {
          const aDate = a.lastLogin || '';
          const bDate = b.lastLogin || '';
          return dir * (aDate < bDate ? -1 : aDate > bDate ? 1 : 0);
        }
        default:
          return 0;
      }
    });

    return result;
  }, [studentProfiles, searchQuery, activeSummaryFilter, statusFilter, filteredPrograms, getProgressPercent, sortField, sortDirection, programs, enrolledPairs]);

  const totalPages = Math.ceil(filteredStudents.length / PAGE_SIZE);
  const paginatedStudents = filteredStudents.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const isLoading = progressLoading || enrollmentsLoading;

  const summary = useMemo(() => {
    const counts = { onTrack: 0, atRisk: 0, notStarted: 0 };
    for (const student of studentProfiles) {
      let maxPct = 0;
      for (const p of filteredPrograms) {
        const pct = getProgressPercent(student.user_id || student.id || '', p.id);
        if (pct > maxPct) maxPct = pct;
      }
      const status = getStatusFromPct(maxPct);
      if (status === 'on-track') counts.onTrack++;
      else if (status === 'not-started') counts.notStarted++;
      else counts.atRisk++;
    }
    return {
      ...counts,
      total: studentProfiles.length,
    };
  }, [studentProfiles, filteredPrograms, getProgressPercent]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
    setPage(0);
  };

  const handleSummaryClick = (filter: SummaryFilter) => {
    setActiveSummaryFilter(prev => prev === filter ? 'all' : filter);
    setPage(0);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setPage(0);
  };

  const SortHeader = ({ field, label }: { field: SortField; label: string }) => (
    <button
      onClick={() => toggleSort(field)}
      className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-700 transition-colors"
    >
      {label}
      <ArrowUpDown size={10} className={`transition-opacity ${sortField === field ? 'opacity-100 text-indigo-500' : 'opacity-30'}`} />
    </button>
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black uppercase tracking-tighter">Program Progress</h2>
          <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">
            {summary.total} students tracked
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
            <input
              type="text"
              placeholder="Search students..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs font-medium outline-none focus:border-indigo-400 transition-all w-48"
            />
          </div>
          <select
            value={selectedProgramId}
            onChange={e => { setSelectedProgramId(e.target.value); setPage(0); }}
            className="px-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs font-medium outline-none focus:border-indigo-400 transition-all"
          >
            <option value="all">All Programs</option>
            {programs.map(p => (
              <option key={p.id} value={p.id}>{p.title}</option>
            ))}
          </select>
        </div>
      </div>

      {filteredPrograms.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          {([
            { key: 'on-track', label: 'On Track', count: summary.onTrack, bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-600', icon: CheckCircle2, activeBg: 'bg-emerald-100' },
            { key: 'at-risk', label: 'At Risk / In Progress', count: summary.atRisk, bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-600', icon: AlertTriangle, activeBg: 'bg-amber-100' },
            { key: 'not-started', label: 'Not Started', count: summary.notStarted, bg: 'bg-slate-50', border: 'border-slate-200', text: 'text-slate-600', icon: Clock, activeBg: 'bg-slate-200' },
          ] as const).map(({ key, label, count, bg, border, text, icon: Icon, activeBg }) => {
            const isActive = activeSummaryFilter === key;
            return (
              <button
                key={key}
                onClick={() => handleSummaryClick(key as SummaryFilter)}
                className={`${isActive ? `${bg} ${border} ring-2 ring-black/5` : 'bg-white border-slate-100 hover:border-slate-200'} rounded-[24px] p-5 border shadow-sm transition-all text-left`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 ${isActive ? activeBg : bg.replace('bg-', 'bg-').replace('50', '100')} rounded-full flex items-center justify-center ${text}`}>
                    <Icon size={18} />
                  </div>
                  <div>
                    <p className="text-2xl font-black">{count}</p>
                    <p className={`text-[10px] font-black uppercase tracking-widest ${text}`}>{label}</p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden">
        {isLoading && paginatedStudents.length === 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Student</th>
                  {filteredPrograms.map(p => (
                    <th key={p.id} className="text-left px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 min-w-[180px]">
                      <div className="flex items-center gap-2">
                        <BookOpen size={12} />
                        {p.title}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: 5 }).map((_, i) => (
                  <SkeletonRow key={i} programCount={filteredPrograms.length} />
                ))}
              </tbody>
            </table>
          </div>
        ) : filteredPrograms.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="text-left px-6 py-4">
                      <SortHeader field="name" label="Student" />
                    </th>
                    <th className="text-left px-6 py-4">
                      <SortHeader field="lastActivity" label="Last Activity" />
                    </th>
                    {filteredPrograms.map(p => (
                      <th key={p.id} className="text-left px-6 py-4 min-w-[200px]">
                        <div className="flex items-center gap-2">
                          <BookOpen size={12} className="text-slate-400" />
                          <SortHeader field="program" label={p.title} />
                        </div>
                      </th>
                    ))}
                    <th className="text-left px-6 py-4 w-24">
                      <SortHeader field="progress" label="Overall" />
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedStudents.map((student, i) => {
                    const studentId = student.user_id || student.id || '';
                    const enrolledPrograms = filteredPrograms.filter(p => enrolledPairs.has(`${studentId}-${p.id}`));
                    const overallPct = enrolledPrograms.length > 0
                      ? Math.round(enrolledPrograms.reduce((sum, p) => sum + getProgressPercent(studentId, p.id), 0) / enrolledPrograms.length)
                      : 0;
                    const status = getStatusFromPct(overallPct);
                    const cfg = statusConfig[status];
                    const StatusIcon = cfg.icon;
                    const isHovered = hoveredStudentId === studentId;

                    return (
                      <motion.tr
                        key={studentId}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: (i % PAGE_SIZE) * 0.02 }}
                        className="border-b border-slate-50 last:border-0 transition-colors relative group"
                        onMouseEnter={() => setHoveredStudentId(studentId)}
                        onMouseLeave={() => setHoveredStudentId(null)}
                      >
                        <td className="px-6 py-3">
                          <div className="relative">
                            <button
                              onClick={() => onNavigateToStudent?.(studentId)}
                              className="flex items-center gap-3 text-left"
                            >
                              <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-black text-xs shrink-0">
                                {student.name?.charAt(0) || '?'}
                              </div>
                              <span className="text-sm font-bold text-slate-700 hover:text-indigo-600 transition-colors truncate max-w-[140px]">
                                {student.name || 'Unnamed'}
                              </span>
                            </button>
                            {isHovered && (
                              <motion.div
                                initial={{ opacity: 0, y: 4 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="absolute -left-2 top-full mt-1 z-20 flex gap-1 bg-white rounded-2xl border border-slate-100 shadow-lg p-1.5 shadow-black/5"
                              >
                                <button
                                  onClick={(e) => { e.stopPropagation(); onNavigateToStudent?.(studentId); }}
                                  className="p-2 rounded-xl hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 transition-colors"
                                  title="View Profile"
                                >
                                  <Eye size={14} />
                                </button>
                                <button
                                  onClick={(e) => { e.stopPropagation(); onNavigateToStudent?.(studentId); }}
                                  className="p-2 rounded-xl hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 transition-colors"
                                  title="Send Message"
                                >
                                  <Send size={14} />
                                </button>
                                <button
                                  onClick={(e) => { e.stopPropagation(); onNavigateToStudent?.(studentId); }}
                                  className="p-2 rounded-xl hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 transition-colors"
                                  title="Assign Task"
                                >
                                  <ClipboardList size={14} />
                                </button>
                                <button
                                  onClick={(e) => { e.stopPropagation(); onNavigateToStudent?.(studentId); }}
                                  className="p-2 rounded-xl hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 transition-colors"
                                  title="Schedule Session"
                                >
                                  <CalendarDays size={14} />
                                </button>
                                <button
                                  onClick={(e) => { e.stopPropagation(); onNavigateToStudent?.(studentId); }}
                                  className="p-2 rounded-xl hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 transition-colors"
                                  title="View Progress Timeline"
                                >
                                  <History size={14} />
                                </button>
                              </motion.div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-3">
                          <span className="text-[10px] font-bold text-slate-400">
                            {student.lastLogin
                              ? new Date(student.lastLogin).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
                              : '—'}
                          </span>
                        </td>
                        {filteredPrograms.map(prog => {
                          const pct = getProgressPercent(studentId, prog.id);
                          const isEnrolled = enrolledPairs.has(`${studentId}-${prog.id}`);
                          const progStatus = getStatusFromPct(pct);
                          const pCfg = statusConfig[progStatus];
                          const PIcon = pCfg.icon;

                          return (
                            <td key={prog.id} className="px-6 py-3">
                              {isEnrolled ? (
                                <button
                                  onClick={() => setSelectedDetail({
                                    studentId,
                                    programId: prog.id,
                                    progressPct: pct,
                                    student,
                                    program: prog,
                                    record: progressMap.get(`${studentId}-${prog.id}`),
                                  })}
                                  className="flex items-center gap-3 w-full group/cell"
                                >
                                  <div className="flex-1 max-w-[140px]">
                                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                      <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${pct}%` }}
                                        transition={{ duration: 0.8, ease: 'easeOut' }}
                                        className={`h-full rounded-full ${
                                          pct >= 70 ? 'bg-emerald-400' : pct > 0 ? 'bg-amber-400' : 'bg-slate-200'
                                        }`}
                                      />
                                    </div>
                                  </div>
                                  <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest shrink-0 ${pCfg.color} ${pCfg.bg} group-hover/cell:ring-2 ring-indigo-200 transition-all cursor-pointer`}>
                                    <PIcon size={10} />
                                    {pct}%
                                  </span>
                                </button>
                              ) : (
                                <span className="text-[10px] text-slate-300 font-medium italic">Not enrolled</span>
                              )}
                            </td>
                          );
                        })}
                        <td className="px-6 py-3">
                          <div className="flex items-center gap-2">
                            <span className={`flex items-center gap-1 px-2 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${cfg.color} ${cfg.bg}`}>
                              <StatusIcon size={10} />
                              {overallPct}%
                            </span>
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {filteredStudents.length === 0 && (
              <div className="p-12 text-center text-sm text-slate-400 font-medium">
                <Users size={32} className="mx-auto text-slate-200 mb-3" />
                No students match your criteria.
              </div>
            )}

            {totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100">
                <span className="text-[10px] font-bold text-slate-400">
                  Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, filteredStudents.length)} of {filteredStudents.length}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage(p => Math.max(0, p - 1))}
                    disabled={page === 0}
                    className="p-2 rounded-xl border border-slate-200 text-slate-400 hover:text-black hover:border-slate-400 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                  >
                    <ChevronLeft size={14} />
                  </button>
                  {Array.from({ length: Math.min(totalPages, 7) }).map((_, i) => {
                    let pageNum: number;
                    if (totalPages <= 7) {
                      pageNum = i;
                    } else if (page < 3) {
                      pageNum = i;
                    } else if (page > totalPages - 4) {
                      pageNum = totalPages - 7 + i;
                    } else {
                      pageNum = page - 3 + i;
                    }
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setPage(pageNum)}
                        className={`w-8 h-8 rounded-xl text-[10px] font-black transition-all ${
                          page === pageNum
                            ? 'bg-black text-white'
                            : 'text-slate-400 hover:text-black hover:bg-slate-50'
                        }`}
                      >
                        {pageNum + 1}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                    disabled={page >= totalPages - 1}
                    className="p-2 rounded-xl border border-slate-200 text-slate-400 hover:text-black hover:border-slate-400 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="p-12 text-center">
            <BookOpen size={40} className="mx-auto text-slate-200 mb-4" />
            <p className="text-sm font-black uppercase tracking-wider text-slate-300">No programs available</p>
            <p className="text-[10px] text-slate-400 font-medium mt-1">Create a program first to track student progress.</p>
          </div>
        )}
      </div>

      <AnimatePresence>
        {selectedDetail && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
              onClick={() => setSelectedDetail(null)}
            />
            <ProgressSidePanel
              student={selectedDetail.student}
              program={selectedDetail.program}
              progressRecord={selectedDetail.record}
              progressPct={selectedDetail.progressPct}
              onClose={() => setSelectedDetail(null)}
              onOpenProfile={(id) => onNavigateToStudent?.(id)}
            />
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
