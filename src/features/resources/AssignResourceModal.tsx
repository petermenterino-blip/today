import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X, Search, Loader2, Check, UserPlus, BookOpen, Users,
  ChevronDown, AlertCircle, GraduationCap
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { usePrograms } from '../../hooks/usePrograms';
import { resourceService } from '../../services/resourceService';
import { notifySuccess, notifyError } from '../../utils/toast';

interface AssignResourceModalProps {
  open: boolean;
  onClose: () => void;
  resourceIds: string[];
  resourceTitle: string;
  onAssigned?: () => void;
}

interface Student {
  id: string;
  name: string;
  email: string;
}

const AssignResourceModal: React.FC<AssignResourceModalProps> = ({ open, onClose, resourceIds, resourceTitle, onAssigned }) => {
  const { user } = useAuth();
  const { programs } = usePrograms();
  const [tab, setTab] = useState<'students' | 'programs'>('students');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [students, setStudents] = useState<Student[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState<string>('');

  // Load students on mount / when tab changes
  React.useEffect(() => {
    if (open && tab === 'students' && students.length === 0) {
      loadStudents();
    }
  }, [open, tab]);

  const loadStudents = async () => {
    setLoadingStudents(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, name, email')
        .eq('role', 'student')
        .order('full_name');
      if (data) setStudents(data as Student[]);
    } finally {
      setLoadingStudents(false);
    }
  };

  const filteredStudents = useMemo(() => {
    if (!search.trim()) return students;
    const q = search.toLowerCase();
    return students.filter(s =>
      s.name?.toLowerCase().includes(q) || s.email?.toLowerCase().includes(q)
    );
  }, [students, search]);

  const toggleStudent = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleProgram = (programId: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(programId) ? next.delete(programId) : next.add(programId);
      return next;
    });
  };

  const handleAssign = async () => {
    if (selected.size === 0 || !user) return;
    setSubmitting(true);
    try {
      let totalAssignments = 0;
      for (const rid of resourceIds) {
        if (tab === 'students') {
          for (const studentId of selected) {
            await resourceService.assignToStudent(rid, studentId, user.id);
            totalAssignments++;
          }
        } else {
          for (const programId of selected) {
            await resourceService.assignToProgram(rid, programId, user.id);
            totalAssignments++;
          }
        }
      }
      notifySuccess(`${totalAssignments} assignment${totalAssignments !== 1 ? 's' : ''} created`);
      onAssigned?.();
      onClose();
    } catch (e: any) {
      notifyError(e?.message || 'Failed to assign resource');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="bg-white rounded-3xl shadow-2xl max-w-lg w-full max-h-[90vh] flex flex-col"
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Assign Resource</h2>
                <p className="text-xs text-slate-500 mt-0.5 truncate max-w-[300px]">{resourceTitle}</p>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-slate-50 rounded-xl transition-colors">
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 p-4 pb-0">
              <button
                onClick={() => { setTab('students'); setSelected(new Set()); setSearch(''); }}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-colors ${
                  tab === 'students'
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
                }`}
              >
                <Users className="w-3.5 h-3.5" /> Students
              </button>
              <button
                onClick={() => { setTab('programs'); setSelected(new Set()); setSearch(''); }}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-colors ${
                  tab === 'programs'
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" /> Programs
              </button>
            </div>

            {/* Search */}
            <div className="p-4 pb-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                <input
                  type="text"
                  placeholder={tab === 'students' ? 'Search students...' : 'Search programs...'}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-sm text-slate-900 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition-all"
                />
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-4 pt-2 space-y-1">
              {tab === 'students' ? (
                loadingStudents ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-5 h-5 text-indigo-400 animate-spin" />
                  </div>
                ) : filteredStudents.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                    <p className="text-sm text-slate-400">
                      {search ? 'No students match your search' : 'No students found'}
                    </p>
                  </div>
                ) : (
                  filteredStudents.map((student) => (
                    <button
                      key={student.id}
                      onClick={() => toggleStudent(student.id)}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl transition-colors text-left ${
                        selected.has(student.id)
                          ? 'bg-indigo-50 border border-indigo-100'
                          : 'hover:bg-slate-50 border border-transparent'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors ${
                        selected.has(student.id)
                          ? 'bg-indigo-600 border-indigo-600'
                          : 'border-slate-200'
                      }`}>
                        {selected.has(student.id) && <Check className="w-3 h-3 text-white" />}
                      </div>
                      <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-bold text-indigo-600">
                          {(student.name || '?')[0].toUpperCase()}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-800 truncate">{student.name}</p>
                        <p className="text-[10px] text-slate-400 truncate">{student.email}</p>
                      </div>
                    </button>
                  ))
                )
              ) : (
                !programs || programs.length === 0 ? (
                  <div className="text-center py-8">
                    <BookOpen className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                    <p className="text-sm text-slate-400">No programs available</p>
                  </div>
                ) : (
                  (programs || []).map((program: any) => (
                    <button
                      key={program.id}
                      onClick={() => toggleProgram(program.id)}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl transition-colors text-left ${
                        selected.has(program.id)
                          ? 'bg-indigo-50 border border-indigo-100'
                          : 'hover:bg-slate-50 border border-transparent'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors ${
                        selected.has(program.id)
                          ? 'bg-indigo-600 border-indigo-600'
                          : 'border-slate-200'
                      }`}>
                        {selected.has(program.id) && <Check className="w-3 h-3 text-white" />}
                      </div>
                      <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
                        <GraduationCap className="w-4 h-4 text-emerald-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-800 truncate">{program.title}</p>
                        <p className="text-[10px] text-slate-400">
                          {(program as any).students_count || 0} students
                        </p>
                      </div>
                    </button>
                  ))
                )
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between p-4 border-t border-slate-100">
              <p className="text-xs text-slate-400">
                {selected.size} selected
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={onClose}
                  className="px-4 py-2 bg-slate-50 text-slate-600 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAssign}
                  disabled={selected.size === 0 || submitting}
                  className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-slate-800 disabled:opacity-50 transition-colors"
                >
                  {submitting ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <UserPlus className="w-3 h-3" />
                  )}
                  Assign to {selected.size}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AssignResourceModal;
