import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { BookOpen, Users, TrendingUp, CheckCircle2, Clock, AlertTriangle, Search } from 'lucide-react';
import { studentProgressService, StudentProgress } from '../../../services/studentProgressService';
import { Program, StudentProfile } from '../../../types';

interface ProgramProgressTabProps {
  programs: Program[];
  studentProfiles: StudentProfile[];
  onNavigateToStudent?: (studentId: string) => void;
}

export const ProgramProgressTab: React.FC<ProgramProgressTabProps> = ({
  programs,
  studentProfiles,
  onNavigateToStudent,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProgram, setSelectedProgram] = useState<string | 'all'>('all');
  const [progressMap, setProgressMap] = useState<Map<string, StudentProgress>>(new Map());

  // Fetch progress for all students
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        const map = new Map<string, StudentProgress>();
        for (const student of studentProfiles) {
          for (const program of programs) {
            const progress = await studentProgressService.getProgress(student.id, program.id);
            if (progress) {
              map.set(`${student.id}-${program.id}`, progress);
            }
          }
        }
        setProgressMap(map);
      } catch (e) {
        console.error('Failed to fetch progress', e);
      } finally {
        setLoading(false);
      }
    };
    if (studentProfiles.length > 0 && programs.length > 0) {
      fetchAll();
    }
  }, [studentProfiles.length, programs.length]);

  const getProgress = (studentId: string, programId: string): number => {
    const key = `${studentId}-${programId}`;
    const record = progressMap.get(key);
    return record
      ? studentProgressService.calculateProgramProgress(studentId, programId)
      : 0;
  };

  const statusColor = (pct: number) => {
    if (pct === 0) return 'text-slate-300';
    if (pct < 30) return 'text-amber-500';
    if (pct < 70) return 'text-indigo-500';
    return 'text-emerald-500';
  };

  const statusBg = (pct: number) => {
    if (pct === 0) return 'bg-slate-100';
    if (pct < 30) return 'bg-amber-50';
    if (pct < 70) return 'bg-indigo-50';
    return 'bg-emerald-50';
  };

  const statusLabel = (pct: number) => {
    if (pct === 0) return 'Not Started';
    if (pct < 30) return 'At Risk';
    if (pct < 70) return 'In Progress';
    return 'On Track';
  };

  const statusIcon = (pct: number) => {
    if (pct === 0) return <Clock size={14} />;
    if (pct < 30) return <AlertTriangle size={14} />;
    if (pct < 70) return <TrendingUp size={14} />;
    return <CheckCircle2 size={14} />;
  };

  const filteredStudents = studentProfiles.filter(s =>
    !searchQuery || s.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredPrograms = selectedProgram === 'all'
    ? programs
    : programs.filter(p => p.id === selectedProgram);

  const summary = {
    total: filteredStudents.length * filteredPrograms.length,
    onTrack: 0,
    atRisk: 0,
    notStarted: 0,
  };

  for (const student of filteredStudents) {
    for (const program of filteredPrograms) {
      const pct = getProgress(student.id, program.id);
      if (pct >= 70) summary.onTrack++;
      else if (pct > 0) summary.atRisk++;
      else summary.notStarted++;
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black uppercase tracking-tighter">Program Progress</h2>
          <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">
            {summary.onTrack + summary.atRisk + summary.notStarted} enrollments tracked
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
            <input
              type="text"
              placeholder="Search students..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs font-medium outline-none focus:border-indigo-400 transition-all w-48"
            />
          </div>
          <select
            value={selectedProgram}
            onChange={e => setSelectedProgram(e.target.value)}
            className="px-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs font-medium outline-none focus:border-indigo-400 transition-all"
          >
            <option value="all">All Programs</option>
            {programs.map(p => (
              <option key={p.id} value={p.id}>{p.title}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      {filteredPrograms.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-emerald-50 rounded-[24px] p-5 border border-emerald-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600">
                <CheckCircle2 size={18} />
              </div>
              <div>
                <p className="text-2xl font-black">{summary.onTrack}</p>
                <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600">On Track</p>
              </div>
            </div>
          </div>
          <div className="bg-amber-50 rounded-[24px] p-5 border border-amber-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center text-amber-600">
                <AlertTriangle size={18} />
              </div>
              <div>
                <p className="text-2xl font-black">{summary.atRisk}</p>
                <p className="text-[10px] font-black uppercase tracking-widest text-amber-600">In Progress / At Risk</p>
              </div>
            </div>
          </div>
          <div className="bg-slate-50 rounded-[24px] p-5 border border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-600">
                <Clock size={18} />
              </div>
              <div>
                <p className="text-2xl font-black">{summary.notStarted}</p>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-600">Not Started</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Progress Grid */}
      {loading && (
        <div className="text-center py-12 text-sm text-slate-400 font-medium">Loading progress data...</div>
      )}

      {!loading && filteredPrograms.length > 0 && (
        <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden">
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
                {filteredStudents.map((student, i) => (
                  <motion.tr
                    key={student.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <button
                        onClick={() => onNavigateToStudent?.(student.id)}
                        className="flex items-center gap-3 text-left"
                      >
                        <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-black text-xs">
                          {student.name?.charAt(0) || '?'}
                        </div>
                        <span className="text-sm font-bold text-slate-700 hover:text-indigo-600 transition-colors">
                          {student.name || 'Unnamed'}
                        </span>
                      </button>
                    </td>
                    {filteredPrograms.map(program => {
                      const pct = getProgress(student.id, program.id);
                      return (
                        <td key={program.id} className="px-6 py-4">
                          <div className="flex items-center gap-3">
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
                            <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${statusColor(pct)} ${statusBg(pct)}`}>
                              {statusIcon(pct)}
                              {pct}%
                            </span>
                          </div>
                        </td>
                      );
                    })}
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredStudents.length === 0 && (
            <div className="p-12 text-center text-sm text-slate-400 font-medium">
              <Users size={32} className="mx-auto text-slate-200 mb-3" />
              No students match your search.
            </div>
          )}
        </div>
      )}

      {!loading && filteredPrograms.length === 0 && (
        <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm p-12 text-center">
          <BookOpen size={40} className="mx-auto text-slate-200 mb-4" />
          <p className="text-sm font-black uppercase tracking-wider text-slate-300">No programs available</p>
          <p className="text-[10px] text-slate-400 font-medium mt-1">Create a program first to track student progress.</p>
        </div>
      )}
    </div>
  );
};
