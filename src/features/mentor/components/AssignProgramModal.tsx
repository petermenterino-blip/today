import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { X, Search, Check, Users, Calendar, Clock, Loader2 } from 'lucide-react';
import { Program, StudentProfile } from '../../../types';
import { usePrograms } from '../../../hooks/usePrograms';
import { useProgramEnrollments } from '../../../hooks/useProgramEnrollments';
import { notifySuccess, notifyError } from '../../../utils/toast';

interface AssignProgramModalProps {
  program: Program;
  onClose: () => void;
  onAssigned: () => void;
}

export const AssignProgramModal: React.FC<AssignProgramModalProps> = ({ program, onClose, onAssigned }) => {
  const { assignMultiple } = useProgramEnrollments(program.id);
  const { programs } = usePrograms();

  const [selectedProgramIds, setSelectedProgramIds] = useState<string[]>([program.id]);
  const [studentSearch, setStudentSearch] = useState('');
  const [selectedStudents, setSelectedStudents] = useState<StudentProfile[]>([]);
  const [startDate, setStartDate] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [enrollmentStatus, setEnrollmentStatus] = useState('Assigned');
  const [mentorNotes, setMentorNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(true);

  // Load students
  React.useEffect(() => {
    const loadStudents = async () => {
      try {
        const { studentService } = await import('../../../services/studentService');
        const data = await studentService.getAll();
        setStudents(data);
      } catch { }
      setLoadingStudents(false);
    };
    loadStudents();
  }, []);

  const filteredStudents = useMemo(() => {
    if (!studentSearch) return students;
    const q = studentSearch.toLowerCase();
    return students.filter(s =>
      (s.full_name || s.name || '').toLowerCase().includes(q) ||
      (s.email || '').toLowerCase().includes(q)
    );
  }, [students, studentSearch]);

  const toggleStudent = (student: StudentProfile) => {
    setSelectedStudents(prev =>
      prev.find(s => s.user_id === student.user_id)
        ? prev.filter(s => s.user_id !== student.user_id)
        : [...prev, student]
    );
  };

  const toggleProgram = (id: string) => {
    setSelectedProgramIds(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  const handleAssign = async () => {
    if (selectedStudents.length === 0) { notifyError('Select at least one student'); return; }
    if (selectedProgramIds.length === 0) { notifyError('Select at least one program'); return; }

    setSubmitting(true);
    let hasError = false;
    for (const student of selectedStudents) {
      const res = await assignMultiple({
        programIds: selectedProgramIds,
        studentId: student.user_id,
        options: {
          startDate: startDate || undefined,
          targetCompletionDate: targetDate || undefined,
          enrollmentStatus,
          mentorNotes: mentorNotes.trim() || undefined,
        },
      });
      if (res?.error) { hasError = true; notifyError(res.error); }
    }
    setSubmitting(false);
    if (!hasError) onAssigned();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-300">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white rounded-[40px] max-w-2xl w-full max-h-[90vh] overflow-y-auto p-8 shadow-2xl relative"
      >
        <button onClick={onClose} className="absolute top-6 right-6 w-10 h-10 flex items-center justify-center bg-slate-50 rounded-full hover:bg-slate-100 transition-colors">
          <X size={18} />
        </button>

        <div className="mb-8">
          <h3 className="text-3xl font-black uppercase tracking-tighter">Assign Program</h3>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
            {program.title}
          </p>
        </div>

        <div className="space-y-6">
          {/* Select Programs */}
          <div>
            <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-3 block">Select Programs</label>
            <div className="flex flex-wrap gap-2">
              {programs.filter(p => p.status === 'published').map(p => (
                <button key={p.id} onClick={() => toggleProgram(p.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-[10px] font-bold uppercase tracking-wider transition-all ${
                    selectedProgramIds.includes(p.id)
                      ? 'bg-black text-white border-black'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'
                  }`}>
                  {selectedProgramIds.includes(p.id) && <Check size={12} />}
                  {p.title}
                </button>
              ))}
            </div>
          </div>

          {/* Select Students */}
          <div>
            <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-3 block">
              Select Students ({selectedStudents.length} selected)
            </label>
            <div className="relative mb-3">
              <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
              <input type="text" value={studentSearch} onChange={e => setStudentSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-medium outline-none focus:border-black transition-all"
                placeholder="Search students..." />
            </div>
            <div className="max-h-[200px] overflow-y-auto space-y-1 custom-scrollbar">
              {loadingStudents ? (
                <div className="text-center py-8 text-xs text-slate-400"><Loader2 size={16} className="animate-spin mx-auto mb-2" />Loading students...</div>
              ) : filteredStudents.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-400">No students found</div>
              ) : (
                filteredStudents.map(s => (
                  <button key={s.user_id || s.id} onClick={() => toggleStudent(s)}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl border text-left transition-all ${
                      selectedStudents.find(sel => sel.user_id === s.user_id)
                        ? 'bg-indigo-50 border-indigo-200'
                        : 'bg-white border-slate-100 hover:bg-slate-50'
                    }`}>
                    <div className={`w-5 h-5 rounded-md border flex items-center justify-center ${
                      selectedStudents.find(sel => sel.user_id === s.user_id)
                        ? 'bg-indigo-500 border-indigo-500 text-white'
                        : 'border-slate-300'
                    }`}>
                      {selectedStudents.find(sel => sel.user_id === s.user_id) && <Check size={12} />}
                    </div>
                    <div className="w-7 h-7 bg-slate-200 rounded-full flex items-center justify-center text-[10px] font-bold text-slate-600">
                      {(s.full_name || s.name || '?').charAt(0)}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-700">{s.full_name || s.name || 'Unnamed'}</p>
                      <p className="text-[9px] text-slate-400">{s.email || s.user_email}</p>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Assignment Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2 block flex items-center gap-1">
                <Calendar size={11} /> Start Date
              </label>
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-medium outline-none focus:border-black transition-all" />
            </div>
            <div>
              <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2 block flex items-center gap-1">
                <Calendar size={11} /> Target Completion
              </label>
              <input type="date" value={targetDate} onChange={e => setTargetDate(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-medium outline-none focus:border-black transition-all" />
            </div>
            <div>
              <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2 block flex items-center gap-1">
                <Clock size={11} /> Enrollment Status
              </label>
              <select value={enrollmentStatus} onChange={e => setEnrollmentStatus(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-medium outline-none focus:border-black transition-all">
                <option value="Assigned">Assigned</option>
                <option value="Active">Active</option>
                <option value="Paused">Paused</option>
              </select>
            </div>
            <div>
              <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2 block flex items-center gap-1">
                <Users size={11} /> Students Count
              </label>
              <div className="px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold flex items-center gap-2">
                <Users size={14} className="text-indigo-500" />
                {selectedStudents.length} student{selectedStudents.length !== 1 ? 's' : ''} selected
              </div>
            </div>
          </div>

          {/* Mentor Notes */}
          <div>
            <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Mentor Notes</label>
            <textarea value={mentorNotes} onChange={e => setMentorNotes(e.target.value)} rows={2}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-medium outline-none focus:border-black transition-all resize-none"
              placeholder="Optional notes about this assignment..." />
          </div>
        </div>

        <div className="mt-8 flex gap-4">
          <button onClick={onClose}
            className="flex-1 py-4 bg-slate-100 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all">
            Cancel
          </button>
          <button onClick={handleAssign} disabled={submitting || selectedStudents.length === 0 || selectedProgramIds.length === 0}
            className="flex-1 py-4 bg-black text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-black/10 disabled:opacity-50 flex items-center justify-center gap-2">
            {submitting && <Loader2 size={14} className="animate-spin" />}
            Assign to {selectedStudents.length} Student{selectedStudents.length !== 1 ? 's' : ''}
          </button>
        </div>
      </motion.div>
    </div>
  );
};
