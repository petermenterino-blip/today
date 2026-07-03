import React, { useState, useRef, useMemo } from 'react';
import {
  ArrowLeft, Plus, X, Trash, GripVertical, Search,
  BookOpen, Users, FileText, Settings, Save, Edit3,
  Check, ChevronDown, ChevronUp, UserPlus, UserMinus
} from 'lucide-react';
import { Program, User } from '../../../types';
import { programService, ProgramEnrollment } from '../../../services/programService';

interface ProgramDetailsProps {
  programId: string;
  programs: Program[];
  currentUser: User | null;
  updateProgram: ({ id, program }: { id: string, program: Partial<Program> }) => Promise<any>;
  deleteProgram: (id: string) => Promise<any>;
  useEnrollments: (programId: string) => { enrollments: ProgramEnrollment[]; enrollmentsLoading: boolean };
  enrollStudent: ({ programId, studentId }: { programId: string, studentId: string }) => Promise<any>;
  unenrollStudent: ({ programId, studentId }: { programId: string, studentId: string }) => Promise<any>;
  updateEnrollmentStatus: ({ enrollmentId, status }: { enrollmentId: string, status: 'active' | 'completed' | 'dropped' }) => Promise<any>;
  onBack: () => void;
}

type DetailsTab = 'overview' | 'modules' | 'students' | 'resources';

export const ProgramDetails: React.FC<ProgramDetailsProps> = ({
  programId, programs, currentUser,
  updateProgram, deleteProgram,
  useEnrollments, enrollStudent, unenrollStudent, updateEnrollmentStatus,
  onBack,
}) => {
  const program = programs.find(p => p.id === programId);
  const [activeTab, setActiveTab] = useState<DetailsTab>('overview');
  const { enrollments, enrollmentsLoading } = useEnrollments(programId);

  const [newModuleTitle, setNewModuleTitle] = useState('');
  const [newModuleDesc, setNewModuleDesc] = useState('');
  const [editingModuleId, setEditingModuleId] = useState<string | null>(null);
  const [editModuleTitle, setEditModuleTitle] = useState('');
  const [editModuleDesc, setEditModuleDesc] = useState('');

  const [newStudentSearch, setNewStudentSearch] = useState('');
  const [availableStudents, setAvailableStudents] = useState<any[]>([]);
  const [showStudentSearch, setShowStudentSearch] = useState(false);
  const [searchingStudents, setSearchingStudents] = useState(false);
  const [studentSubTab, setStudentSubTab] = useState<'active' | 'completed' | 'dropped'>('active');

  const [newResourceTitle, setNewResourceTitle] = useState('');
  const [newResourceUrl, setNewResourceUrl] = useState('');
  const [editingResourceId, setEditingResourceId] = useState<string | null>(null);
  const [editResourceTitle, setEditResourceTitle] = useState('');
  const [editResourceUrl, setEditResourceUrl] = useState('');

  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  if (!program) {
    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        <button onClick={onBack} className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors">
          <ArrowLeft size={14} /> Back to Programs
        </button>
        <div className="bg-white p-12 rounded-[32px] border border-slate-100 shadow-sm text-center">
          <p className="text-sm text-slate-400 font-medium">Program not found.</p>
        </div>
      </div>
    );
  }

  const modules = program.modules || [];
  const resources = program.resources || [];

  const handleSaveModuleOrder = async (reordered: typeof modules) => {
    await updateProgram({ id: programId, program: { modules: reordered } });
  };

  const handleDragStart = (index: number) => {
    dragItem.current = index;
  };

  const handleDragEnter = (index: number) => {
    dragOverItem.current = index;
    setDragOverIndex(index);
  };

  const handleDragEnd = async () => {
    setDragOverIndex(null);
    if (dragItem.current === null || dragOverItem.current === null) return;
    if (dragItem.current === dragOverItem.current) return;
    const reordered = [...modules];
    const [removed] = reordered.splice(dragItem.current, 1);
    reordered.splice(dragOverItem.current, 0, removed);
    dragItem.current = null;
    dragOverItem.current = null;
    await handleSaveModuleOrder(reordered);
  };

  const handleAddModule = async () => {
    if (!newModuleTitle.trim()) return;
    const newModule = {
      id: crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      title: newModuleTitle.trim(),
      description: newModuleDesc.trim(),
    };
    await updateProgram({ id: programId, program: { modules: [...modules, newModule] } });
    setNewModuleTitle('');
    setNewModuleDesc('');
  };

  const handleDeleteModule = async (moduleId: string) => {
    await updateProgram({ id: programId, program: { modules: modules.filter(m => m.id !== moduleId) } });
  };

  const handleEditModule = async (moduleId: string) => {
    await updateProgram({
      id: programId,
      program: {
        modules: modules.map(m => m.id === moduleId ? { ...m, title: editModuleTitle, description: editModuleDesc } : m),
      },
    });
    setEditingModuleId(null);
  };

  const handleAddResource = async () => {
    if (!newResourceTitle.trim()) return;
    const newResource = {
      id: crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      title: newResourceTitle.trim(),
      url: newResourceUrl.trim(),
    };
    await updateProgram({ id: programId, program: { resources: [...resources, newResource] } });
    setNewResourceTitle('');
    setNewResourceUrl('');
  };

  const handleDeleteResource = async (resourceId: string) => {
    await updateProgram({ id: programId, program: { resources: resources.filter(r => r.id !== resourceId) } });
  };

  const handleEditResource = async (resourceId: string) => {
    await updateProgram({
      id: programId,
      program: {
        resources: resources.map(r => r.id === resourceId ? { ...r, title: editResourceTitle, url: editResourceUrl } : r),
      },
    });
    setEditingResourceId(null);
  };

  const handleSearchStudents = async () => {
    if (!newStudentSearch.trim()) return;
    setSearchingStudents(true);
    try {
      const res = await programService.fetchStudentsNotEnrolled(programId, currentUser?.id || '');
      if (res.data) {
        const q = newStudentSearch.toLowerCase();
        setAvailableStudents(res.data.filter((s: any) =>
          s.name?.toLowerCase().includes(q) || s.email?.toLowerCase().includes(q)
        ));
      }
      setShowStudentSearch(true);
    } finally {
      setSearchingStudents(false);
    }
  };

  const handleEnrollStudent = async (studentId: string) => {
    await enrollStudent({ programId, studentId });
    setAvailableStudents(prev => prev.filter(s => s.id !== studentId));
  };

  const handleUnenrollStudent = async (studentId: string) => {
    await unenrollStudent({ programId, studentId });
  };

  const handleUpdateStatus = async (enrollmentId: string, status: 'active' | 'completed' | 'dropped') => {
    await updateEnrollmentStatus({ enrollmentId, status });
  };

  const filteredEnrollments = useMemo(() => {
    return enrollments.filter(e => e.status === studentSubTab);
  }, [enrollments, studentSubTab]);

  const tabs: { key: DetailsTab; label: string; icon: React.ReactNode }[] = [
    { key: 'overview', label: 'Overview', icon: <BookOpen size={14} /> },
    { key: 'modules', label: `Modules (${modules.length})`, icon: <FileText size={14} /> },
    { key: 'students', label: `Students (${enrollments.length})`, icon: <Users size={14} /> },
    { key: 'resources', label: 'Resources', icon: <Settings size={14} /> },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <button onClick={onBack} className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors">
        <ArrowLeft size={14} /> Back to Programs
      </button>

      <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm p-6 sm:p-8">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-slate-900">{program.title}</h1>
            {program.category && (
              <p className="text-xs text-slate-500 mt-1 font-medium">{program.category} &middot; {program.duration || 'Self-paced'}</p>
            )}
          </div>
          <span className={`px-3 py-1.5 text-[9px] font-black uppercase tracking-widest rounded-full ${
            program.status === 'active' ? 'bg-emerald-100 text-emerald-700' :
            program.status === 'published' ? 'bg-blue-100 text-blue-700' :
            program.status === 'completed' ? 'bg-purple-100 text-purple-700' :
            'bg-slate-100 text-slate-600'
          }`}>
            {program.status}
          </span>
        </div>
        <p className="text-sm text-slate-600">{program.description}</p>

        <div className="flex items-center gap-4 mt-4 text-[10px] font-bold text-slate-500">
          <span>{program.difficulty || 'N/A'} difficulty</span>
          <span>&middot;</span>
          <span>{modules.length} modules</span>
          <span>&middot;</span>
          <span>{enrollments.length} / {program.maxStudents || '&infin;'} students</span>
        </div>
      </div>

      <div className="flex gap-1 bg-white rounded-[32px] border border-slate-100 shadow-sm p-1.5 overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-full transition-all whitespace-nowrap ${
              activeTab === tab.key
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm p-6 sm:p-8">
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {program.outcomes && program.outcomes.length > 0 && (
              <div>
                <h3 className="text-sm font-black uppercase tracking-tight text-slate-900 mb-3">Learning Outcomes</h3>
                <div className="flex flex-wrap gap-2">
                  {program.outcomes.map((o, i) => (
                    <span key={i} className="px-3 py-1.5 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded-full">
                      {o}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {program.skillsCovered && program.skillsCovered.length > 0 && (
              <div>
                <h3 className="text-sm font-black uppercase tracking-tight text-slate-900 mb-3">Skills Covered</h3>
                <div className="flex flex-wrap gap-2">
                  {program.skillsCovered.map((s, i) => (
                    <span key={i} className="px-3 py-1.5 bg-blue-50 text-blue-700 text-[10px] font-bold rounded-full">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {program.prerequisites && program.prerequisites.length > 0 && (
              <div>
                <h3 className="text-sm font-black uppercase tracking-tight text-slate-900 mb-3">Prerequisites</h3>
                <ul className="space-y-1.5">
                  {program.prerequisites.map((p, i) => (
                    <li key={i} className="flex items-center gap-2 text-xs text-slate-600">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {(!program.outcomes || program.outcomes.length === 0) &&
             (!program.skillsCovered || program.skillsCovered.length === 0) &&
             (!program.prerequisites || program.prerequisites.length === 0) && (
              <div className="text-center py-8">
                <p className="text-sm text-slate-400 font-medium">No additional details configured yet.</p>
                <p className="text-[10px] text-slate-300 mt-1 font-bold uppercase tracking-widest">Edit this program to add outcomes, skills, and prerequisites.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'modules' && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <input
                value={newModuleTitle}
                onChange={e => setNewModuleTitle(e.target.value)}
                placeholder="Module title"
                className="flex-1 px-4 py-2.5 text-sm font-medium bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-200"
              />
              <input
                value={newModuleDesc}
                onChange={e => setNewModuleDesc(e.target.value)}
                placeholder="Description (optional)"
                className="flex-1 px-4 py-2.5 text-sm font-medium bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-200"
              />
              <button onClick={handleAddModule} disabled={!newModuleTitle.trim()}
                className="flex items-center gap-1 px-4 py-2.5 bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest rounded-full hover:bg-indigo-700 transition-all disabled:opacity-50">
                <Plus size={12} /> Add
              </button>
            </div>

            {modules.length === 0 ? (
              <div className="text-center py-8 text-sm text-slate-400 font-medium">
                No modules yet. Add your first module above.
              </div>
            ) : (
              <div className="space-y-2">
                {modules.map((mod, idx) => (
                  <div
                    key={mod.id}
                    draggable
                    onDragStart={() => handleDragStart(idx)}
                    onDragEnter={() => handleDragEnter(idx)}
                    onDragEnd={handleDragEnd}
                    onDragOver={e => e.preventDefault()}
                    className={`flex items-start gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100 transition-all ${
                      dragOverIndex === idx ? 'border-indigo-300 bg-indigo-50' : ''
                    }`}
                  >
                    <div className="mt-1 cursor-grab text-slate-300 hover:text-slate-500">
                      <GripVertical size={16} />
                    </div>

                    {editingModuleId === mod.id ? (
                      <div className="flex-1 space-y-2">
                        <input value={editModuleTitle} onChange={e => setEditModuleTitle(e.target.value)}
                          className="w-full px-3 py-1.5 text-sm font-medium bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-200"
                          autoFocus />
                        <input value={editModuleDesc} onChange={e => setEditModuleDesc(e.target.value)}
                          className="w-full px-3 py-1.5 text-xs font-medium bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-200" />
                        <div className="flex gap-2">
                          <button onClick={() => handleEditModule(mod.id)}
                            className="flex items-center gap-1 px-3 py-1.5 bg-emerald-500 text-white text-[9px] font-black uppercase tracking-widest rounded-full hover:bg-emerald-600">
                            <Check size={10} /> Save
                          </button>
                          <button onClick={() => setEditingModuleId(null)}
                            className="px-3 py-1.5 text-[9px] font-black uppercase tracking-widest text-slate-500 hover:text-slate-800">
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-400 w-5">{idx + 1}.</span>
                            <h4 className="text-sm font-bold text-slate-800">{mod.title}</h4>
                          </div>
                          {mod.description && (
                            <p className="text-xs text-slate-500 mt-1 ml-7">{mod.description}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button onClick={() => { setEditingModuleId(mod.id); setEditModuleTitle(mod.title); setEditModuleDesc(mod.description || ''); }}
                            className="p-1.5 rounded-full hover:bg-white text-slate-400 hover:text-slate-600 transition-colors">
                            <Edit3 size={12} />
                          </button>
                          <button onClick={() => handleDeleteModule(mod.id)}
                            className="p-1.5 rounded-full hover:bg-white text-slate-400 hover:text-red-500 transition-colors">
                            <Trash size={12} />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'students' && (
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  value={newStudentSearch}
                  onChange={e => setNewStudentSearch(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSearchStudents()}
                  placeholder="Search students by name or email..."
                  className="w-full pl-9 pr-3 py-2.5 text-sm font-medium bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-200"
                />
              </div>
              <button onClick={handleSearchStudents} disabled={!newStudentSearch.trim() || searchingStudents}
                className="flex items-center gap-1 px-4 py-2.5 bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest rounded-full hover:bg-indigo-700 transition-all disabled:opacity-50">
                <UserPlus size={12} /> {searchingStudents ? 'Searching...' : 'Add Student'}
              </button>
            </div>

            {showStudentSearch && availableStudents.length > 0 && !enrollmentsLoading && (
              <div className="bg-slate-50 rounded-2xl border border-slate-200 p-3 space-y-1">
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 px-2 mb-2">Available Students</p>
                {availableStudents.map((student: any) => (
                  <div key={student.id} className="flex items-center justify-between px-3 py-2 rounded-xl hover:bg-white transition-colors">
                    <div>
                      <p className="text-sm font-bold text-slate-800">{student.name || 'Unnamed'}</p>
                      <p className="text-[10px] text-slate-500">{student.email}</p>
                    </div>
                    <button onClick={() => handleEnrollStudent(student.id)}
                      className="flex items-center gap-1 px-3 py-1.5 bg-emerald-500 text-white text-[9px] font-black uppercase tracking-widest rounded-full hover:bg-emerald-600 transition-colors">
                      <UserPlus size={10} /> Assign
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-1 bg-slate-50 rounded-full p-1 w-fit">
              {(['active', 'completed', 'dropped'] as const).map(st => (
                <button
                  key={st}
                  onClick={() => setStudentSubTab(st)}
                  className={`px-4 py-1.5 text-[9px] font-black uppercase tracking-widest rounded-full transition-all ${
                    studentSubTab === st ? 'bg-white shadow-sm text-slate-800' : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  {st} ({enrollments.filter(e => e.status === st).length})
                </button>
              ))}
            </div>

            {filteredEnrollments.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm text-slate-400 font-medium">No {studentSubTab} students.</p>
                {studentSubTab === 'active' && (
                  <p className="text-[10px] text-slate-300 mt-1 font-bold uppercase tracking-widest">Search and assign students above.</p>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                {filteredEnrollments.map(enr => (
                  <div key={enr.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <div>
                      <p className="text-sm font-bold text-slate-800">{enr.student_name || 'Unnamed Student'}</p>
                      <p className="text-[10px] text-slate-500">{enr.student_email}</p>
                      <p className="text-[9px] text-slate-400 mt-0.5">
                        Enrolled {new Date(enr.enrolled_at).toLocaleDateString()}
                        {enr.completed_at && ` · Completed ${new Date(enr.completed_at).toLocaleDateString()}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {enr.status === 'active' && (
                        <>
                          <button onClick={() => handleUpdateStatus(enr.id, 'completed')}
                            className="px-3 py-1.5 text-[9px] font-black uppercase tracking-widest bg-emerald-100 text-emerald-700 rounded-full hover:bg-emerald-200 transition-colors">
                            Mark Complete
                          </button>
                          <button onClick={() => handleUpdateStatus(enr.id, 'dropped')}
                            className="px-3 py-1.5 text-[9px] font-black uppercase tracking-widest bg-red-100 text-red-600 rounded-full hover:bg-red-200 transition-colors">
                            Drop
                          </button>
                        </>
                      )}
                      <button onClick={() => handleUnenrollStudent(enr.student_id)}
                        className="p-2 rounded-full hover:bg-white text-slate-400 hover:text-red-500 transition-colors">
                        <UserMinus size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'resources' && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <input
                value={newResourceTitle}
                onChange={e => setNewResourceTitle(e.target.value)}
                placeholder="Resource title"
                className="flex-1 px-4 py-2.5 text-sm font-medium bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-200"
              />
              <input
                value={newResourceUrl}
                onChange={e => setNewResourceUrl(e.target.value)}
                placeholder="URL (optional)"
                className="flex-1 px-4 py-2.5 text-sm font-medium bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-200"
              />
              <button onClick={handleAddResource} disabled={!newResourceTitle.trim()}
                className="flex items-center gap-1 px-4 py-2.5 bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest rounded-full hover:bg-indigo-700 transition-all disabled:opacity-50">
                <Plus size={12} /> Add
              </button>
            </div>

            {resources.length === 0 ? (
              <div className="text-center py-8 text-sm text-slate-400 font-medium">
                No resources yet. Add your first resource above.
              </div>
            ) : (
              <div className="space-y-2">
                {resources.map((res) => (
                  <div key={res.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    {editingResourceId === res.id ? (
                      <div className="flex-1 flex items-center gap-2">
                        <input value={editResourceTitle} onChange={e => setEditResourceTitle(e.target.value)}
                          className="flex-1 px-3 py-1.5 text-sm font-medium bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-200" />
                        <input value={editResourceUrl} onChange={e => setEditResourceUrl(e.target.value)}
                          className="flex-1 px-3 py-1.5 text-sm font-medium bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-200" />
                        <button onClick={() => handleEditResource(res.id)}
                          className="p-1.5 text-emerald-500 hover:text-emerald-600">
                          <Check size={14} />
                        </button>
                        <button onClick={() => setEditingResourceId(null)}
                          className="p-1.5 text-slate-400 hover:text-slate-600">
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-bold text-slate-800">{res.title}</h4>
                          {res.url && (
                            <a href={res.url} target="_blank" rel="noopener noreferrer"
                              className="text-[10px] text-indigo-600 font-bold hover:underline mt-0.5 block truncate">
                              {res.url}
                            </a>
                          )}
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button onClick={() => { setEditingResourceId(res.id); setEditResourceTitle(res.title); setEditResourceUrl(res.url || ''); }}
                            className="p-1.5 rounded-full hover:bg-white text-slate-400 hover:text-slate-600 transition-colors">
                            <Edit3 size={12} />
                          </button>
                          <button onClick={() => handleDeleteResource(res.id)}
                            className="p-1.5 rounded-full hover:bg-white text-slate-400 hover:text-red-500 transition-colors">
                            <Trash size={12} />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
