import React, { useState, useMemo } from 'react';
import {
  Plus, Search, X, SlidersHorizontal, Trash, Copy, Archive,
  ChevronDown, ChevronUp, MoreHorizontal, Edit3, Pencil
} from 'lucide-react';
import { Program, User } from '../../../types';
import { ProgramDetails } from './ProgramDetails';
import { usePrograms } from '../../../hooks/usePrograms';

interface ProgramsManagerProps {
  programs: Program[];
  currentUser: User | null;
  addProgram: (program: Omit<Program, 'id' | 'progress' | 'status'>) => Promise<any>;
  deleteProgram: (id: string) => Promise<any>;
  updateProgram: ({ id, program }: { id: string, program: Partial<Program> }) => Promise<any>;
  duplicateProgram: (id: string) => Promise<any>;
  archiveProgram: (id: string) => Promise<any>;
  useEnrollments: (programId: string) => { enrollments: any[]; enrollmentsLoading: boolean };
  enrollStudent: ({ programId, studentId }: { programId: string, studentId: string }) => Promise<any>;
  unenrollStudent: ({ programId, studentId }: { programId: string, studentId: string }) => Promise<any>;
  updateEnrollmentStatus: ({ enrollmentId, status }: { enrollmentId: string, status: 'active' | 'completed' | 'dropped' }) => Promise<any>;
}

type SortField = 'title' | 'status' | 'studentCount' | 'createdAt';
type SortOrder = 'asc' | 'desc';

export const ProgramsManager: React.FC<ProgramsManagerProps> = ({
  programs, currentUser,
  addProgram, deleteProgram, updateProgram,
  duplicateProgram, archiveProgram,
  useEnrollments, enrollStudent, unenrollStudent, updateEnrollmentStatus,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('title');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedProgramId, setSelectedProgramId] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Program>>({});
  const [newProgram, setNewProgram] = useState({
    title: '',
    description: '',
    duration: '',
    category: '',
    difficulty: 'Beginner' as Program['difficulty'],
    status: 'draft' as Program['status'],
    maxStudents: 100,
  });
  const [showArchived, setShowArchived] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{ programId: string; action: 'delete' | 'archive' | 'duplicate' } | null>(null);

  const sortArrow = (field: SortField) => {
    if (sortField !== field) return null;
    return sortOrder === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />;
  };

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(o => o === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const filteredPrograms = useMemo(() => {
    let list = [...programs];
    if (statusFilter !== 'all') {
      list = list.filter(p => p.status === statusFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(p =>
        p.title.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q) ||
        p.category?.toLowerCase().includes(q)
      );
    }
    list.sort((a, b) => {
      let cmp = 0;
      if (sortField === 'title') cmp = a.title.localeCompare(b.title);
      else if (sortField === 'status') cmp = (a.status || '').localeCompare(b.status || '');
      else if (sortField === 'studentCount') cmp = (a.studentCount || 0) - (b.studentCount || 0);
      return sortOrder === 'asc' ? cmp : -cmp;
    });
    return list;
  }, [programs, searchQuery, sortField, sortOrder, statusFilter]);

  const handleAddProgram = async () => {
    if (!newProgram.title.trim()) return;
    await addProgram({
      ...newProgram,
      mentor: currentUser?.name || '',
      outcomes: [],
      skillsCovered: [],
      prerequisites: [],
      modules: [],
      resources: [],
      assignments: [],
    } as any);
    setNewProgram({ title: '', description: '', duration: '', category: '', difficulty: 'Beginner', status: 'draft', maxStudents: 100 });
    setShowAddModal(false);
  };

  const handleEditProgram = async () => {
    if (!showEditModal || !editForm.title?.trim()) return;
    await updateProgram({ id: showEditModal, program: editForm });
    setShowEditModal(null);
    setEditForm({});
  };

  if (selectedProgramId) {
    return (
      <ProgramDetails
        programId={selectedProgramId}
        programs={programs}
        currentUser={currentUser}
        updateProgram={updateProgram}
        deleteProgram={deleteProgram}
        useEnrollments={useEnrollments}
        enrollStudent={enrollStudent}
        unenrollStudent={unenrollStudent}
        updateEnrollmentStatus={updateEnrollmentStatus}
        onBack={() => setSelectedProgramId(null)}
      />
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-slate-900">Programs</h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">Mentorship program templates and curricula</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white text-xs font-black uppercase tracking-widest rounded-full hover:bg-indigo-700 transition-all"
        >
          <Plus size={14} />
          New Program
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search programs..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs font-medium bg-white border border-slate-200 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              <X size={14} />
            </button>
          )}
        </div>

        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="px-3 py-2 text-xs font-bold bg-white border border-slate-200 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-200 uppercase tracking-wider"
        >
          <option value="all">All Status</option>
          <option value="draft">Draft</option>
          <option value="published">Published</option>
          <option value="active">Active</option>
          <option value="completed">Completed</option>
        </select>

        <button
          onClick={() => toggleSort('title')}
          className="flex items-center gap-1 px-3 py-2 text-[10px] font-black uppercase tracking-widest bg-white border border-slate-200 rounded-full hover:bg-slate-50 transition-colors"
        >
          <SlidersHorizontal size={12} />
          Name {sortArrow('title')}
        </button>
        <button
          onClick={() => toggleSort('status')}
          className="flex items-center gap-1 px-3 py-2 text-[10px] font-black uppercase tracking-widest bg-white border border-slate-200 rounded-full hover:bg-slate-50 transition-colors"
        >
          Status {sortArrow('status')}
        </button>
        <button
          onClick={() => toggleSort('studentCount')}
          className="flex items-center gap-1 px-3 py-2 text-[10px] font-black uppercase tracking-widest bg-white border border-slate-200 rounded-full hover:bg-slate-50 transition-colors"
        >
          Students {sortArrow('studentCount')}
        </button>

        <button
          onClick={() => setShowArchived(!showArchived)}
          className={`flex items-center gap-1 px-3 py-2 text-[10px] font-black uppercase tracking-widest rounded-full transition-colors ${
            showArchived ? 'bg-amber-100 text-amber-700 border border-amber-300' : 'bg-white border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Archive size={12} />
          Archived
        </button>
      </div>

      {filteredPrograms.length === 0 ? (
        <div className="bg-white p-12 rounded-[32px] border border-slate-100 shadow-sm text-center">
          <p className="text-sm text-slate-400 font-medium">No programs found.</p>
          <p className="text-[10px] text-slate-300 mt-2 font-bold uppercase tracking-widest">
            {searchQuery ? 'Try a different search term.' : 'Click "New Program" to create your first one.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPrograms.map(program => (
            <ProgramCard
              key={program.id}
              program={program}
              onOpen={() => setSelectedProgramId(program.id)}
              onEdit={() => { setShowEditModal(program.id); setEditForm(program); }}
              onDelete={() => setConfirmAction({ programId: program.id, action: 'delete' })}
              onDuplicate={() => setConfirmAction({ programId: program.id, action: 'duplicate' })}
              onArchive={() => setConfirmAction({ programId: program.id, action: 'archive' })}
            />
          ))}
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={() => setShowAddModal(false)}>
          <div className="bg-white rounded-[32px] p-8 max-w-lg w-full mx-4 shadow-xl border border-slate-100" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-black uppercase tracking-tight text-slate-900">New Program</h2>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1 block">Title</label>
                <input value={newProgram.title} onChange={e => setNewProgram(p => ({ ...p, title: e.target.value }))}
                  className="w-full px-4 py-2.5 text-sm font-medium bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-200" placeholder="Program title" />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1 block">Description</label>
                <textarea value={newProgram.description} onChange={e => setNewProgram(p => ({ ...p, description: e.target.value }))}
                  className="w-full px-4 py-2.5 text-sm font-medium bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-200 resize-none h-20" placeholder="Brief description" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1 block">Duration</label>
                  <input value={newProgram.duration} onChange={e => setNewProgram(p => ({ ...p, duration: e.target.value }))}
                    className="w-full px-4 py-2.5 text-sm font-medium bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-200" placeholder="e.g. 8 weeks" />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1 block">Category</label>
                  <input value={newProgram.category} onChange={e => setNewProgram(p => ({ ...p, category: e.target.value }))}
                    className="w-full px-4 py-2.5 text-sm font-medium bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-200" placeholder="e.g. Design" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1 block">Difficulty</label>
                  <select value={newProgram.difficulty} onChange={e => setNewProgram(p => ({ ...p, difficulty: e.target.value as any }))}
                    className="w-full px-4 py-2.5 text-sm font-bold bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-200">
                    <option>Beginner</option>
                    <option>Intermediate</option>
                    <option>Advanced</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1 block">Max Students</label>
                  <input type="number" value={newProgram.maxStudents} onChange={e => setNewProgram(p => ({ ...p, maxStudents: Number(e.target.value) }))}
                    className="w-full px-4 py-2.5 text-sm font-medium bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-200" />
                </div>
              </div>
              <button onClick={handleAddProgram} disabled={!newProgram.title.trim()}
                className="w-full py-3 bg-indigo-600 text-white text-xs font-black uppercase tracking-widest rounded-full hover:bg-indigo-700 transition-all disabled:opacity-50">
                Create Program
              </button>
            </div>
          </div>
        </div>
      )}

      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={() => { setShowEditModal(null); setEditForm({}); }}>
          <div className="bg-white rounded-[32px] p-8 max-w-lg w-full mx-4 shadow-xl border border-slate-100" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-black uppercase tracking-tight text-slate-900">Edit Program</h2>
              <button onClick={() => { setShowEditModal(null); setEditForm({}); }} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1 block">Title</label>
                <input value={editForm.title || ''} onChange={e => setEditForm(p => ({ ...p, title: e.target.value }))}
                  className="w-full px-4 py-2.5 text-sm font-medium bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-200" />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1 block">Description</label>
                <textarea value={editForm.description || ''} onChange={e => setEditForm(p => ({ ...p, description: e.target.value }))}
                  className="w-full px-4 py-2.5 text-sm font-medium bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-200 resize-none h-20" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1 block">Duration</label>
                  <input value={editForm.duration || ''} onChange={e => setEditForm(p => ({ ...p, duration: e.target.value }))}
                    className="w-full px-4 py-2.5 text-sm font-medium bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-200" />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1 block">Category</label>
                  <input value={editForm.category || ''} onChange={e => setEditForm(p => ({ ...p, category: e.target.value }))}
                    className="w-full px-4 py-2.5 text-sm font-medium bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-200" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1 block">Status</label>
                  <select value={editForm.status || 'draft'} onChange={e => setEditForm(p => ({ ...p, status: e.target.value as any }))}
                    className="w-full px-4 py-2.5 text-sm font-bold bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-200">
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                    <option value="active">Active</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1 block">Difficulty</label>
                  <select value={editForm.difficulty || 'Beginner'} onChange={e => setEditForm(p => ({ ...p, difficulty: e.target.value as any }))}
                    className="w-full px-4 py-2.5 text-sm font-bold bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-200">
                    <option>Beginner</option>
                    <option>Intermediate</option>
                    <option>Advanced</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1 block">Max Students</label>
                <input type="number" value={editForm.maxStudents || 100} onChange={e => setEditForm(p => ({ ...p, maxStudents: Number(e.target.value) }))}
                  className="w-full px-4 py-2.5 text-sm font-medium bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-200" />
              </div>
              <button onClick={handleEditProgram} disabled={!editForm.title?.trim()}
                className="w-full py-3 bg-indigo-600 text-white text-xs font-black uppercase tracking-widest rounded-full hover:bg-indigo-700 transition-all disabled:opacity-50">
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={() => setConfirmAction(null)}>
          <div className="bg-white rounded-[32px] p-8 max-w-sm w-full mx-4 shadow-xl border border-slate-100 text-center" onClick={e => e.stopPropagation()}>
            {confirmAction.action === 'delete' && (
              <>
                <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
                  <Trash size={20} className="text-red-500" />
                </div>
                <h2 className="text-lg font-black uppercase tracking-tight text-slate-900 mb-2">Delete Program?</h2>
                <p className="text-xs text-slate-500 mb-6">This action cannot be undone.</p>
                <div className="flex gap-3">
                  <button onClick={() => setConfirmAction(null)}
                    className="flex-1 py-2.5 text-xs font-black uppercase tracking-widest bg-slate-100 text-slate-600 rounded-full hover:bg-slate-200 transition-all">
                    Cancel
                  </button>
                  <button onClick={async () => {
                    await deleteProgram(confirmAction.programId);
                    setConfirmAction(null);
                  }}
                    className="flex-1 py-2.5 text-xs font-black uppercase tracking-widest bg-red-500 text-white rounded-full hover:bg-red-600 transition-all">
                    Delete
                  </button>
                </div>
              </>
            )}
            {confirmAction.action === 'archive' && (
              <>
                <div className="mx-auto w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mb-4">
                  <Archive size={20} className="text-amber-500" />
                </div>
                <h2 className="text-lg font-black uppercase tracking-tight text-slate-900 mb-2">Archive Program?</h2>
                <p className="text-xs text-slate-500 mb-6">It will be hidden from the main list but can be restored later.</p>
                <div className="flex gap-3">
                  <button onClick={() => setConfirmAction(null)}
                    className="flex-1 py-2.5 text-xs font-black uppercase tracking-widest bg-slate-100 text-slate-600 rounded-full hover:bg-slate-200 transition-all">
                    Cancel
                  </button>
                  <button onClick={async () => {
                    await archiveProgram(confirmAction.programId);
                    setConfirmAction(null);
                  }}
                    className="flex-1 py-2.5 text-xs font-black uppercase tracking-widest bg-amber-500 text-white rounded-full hover:bg-amber-600 transition-all">
                    Archive
                  </button>
                </div>
              </>
            )}
            {confirmAction.action === 'duplicate' && (
              <>
                <div className="mx-auto w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mb-4">
                  <Copy size={20} className="text-indigo-500" />
                </div>
                <h2 className="text-lg font-black uppercase tracking-tight text-slate-900 mb-2">Duplicate Program?</h2>
                <p className="text-xs text-slate-500 mb-6">Creates a copy with "(Copy)" suffix in title.</p>
                <div className="flex gap-3">
                  <button onClick={() => setConfirmAction(null)}
                    className="flex-1 py-2.5 text-xs font-black uppercase tracking-widest bg-slate-100 text-slate-600 rounded-full hover:bg-slate-200 transition-all">
                    Cancel
                  </button>
                  <button onClick={async () => {
                    await duplicateProgram(confirmAction.programId);
                    setConfirmAction(null);
                  }}
                    className="flex-1 py-2.5 text-xs font-black uppercase tracking-widest bg-indigo-600 text-white rounded-full hover:bg-indigo-700 transition-all">
                    Duplicate
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const statusColor: Record<string, string> = {
  draft: 'bg-slate-100 text-slate-600',
  published: 'bg-blue-100 text-blue-700',
  active: 'bg-emerald-100 text-emerald-700',
  completed: 'bg-purple-100 text-purple-700',
};

const difficultyColor: Record<string, string> = {
  Beginner: 'bg-green-100 text-green-700',
  Intermediate: 'bg-amber-100 text-amber-700',
  Advanced: 'bg-red-100 text-red-700',
};

interface ProgramCardProps {
  program: Program;
  onOpen: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onArchive: () => void;
}

const ProgramCard: React.FC<ProgramCardProps> = ({ program, onOpen, onEdit, onDelete, onDuplicate, onArchive }) => {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div
      className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm hover:shadow-md transition-all group cursor-pointer relative"
      onClick={onOpen}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-black uppercase tracking-tight text-slate-900 truncate">{program.title}</h3>
          {program.category && (
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{program.category}</span>
          )}
        </div>
        <div className="relative" onClick={e => e.stopPropagation()}>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-1.5 rounded-full hover:bg-slate-100 opacity-0 group-hover:opacity-100 transition-all"
          >
            <MoreHorizontal size={14} className="text-slate-400" />
          </button>
          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 top-8 z-20 bg-white rounded-2xl shadow-lg border border-slate-100 py-1.5 w-40">
                <button onClick={() => { onEdit(); setMenuOpen(false); }}
                  className="flex items-center gap-2 w-full px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50">
                  <Pencil size={12} /> Edit
                </button>
                <button onClick={() => { onDuplicate(); setMenuOpen(false); }}
                  className="flex items-center gap-2 w-full px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50">
                  <Copy size={12} /> Duplicate
                </button>
                <button onClick={() => { onArchive(); setMenuOpen(false); }}
                  className="flex items-center gap-2 w-full px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50">
                  <Archive size={12} /> Archive
                </button>
                <div className="border-t border-slate-100 my-1" />
                <button onClick={() => { onDelete(); setMenuOpen(false); }}
                  className="flex items-center gap-2 w-full px-4 py-2 text-xs font-bold text-red-500 hover:bg-red-50">
                  <Trash size={12} /> Delete
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <p className="text-xs text-slate-600 mt-2 line-clamp-2 mb-4">{program.description}</p>

      <div className="flex flex-wrap items-center gap-2">
        <span className={`px-2.5 py-1 text-[9px] font-black uppercase tracking-widest rounded-full ${statusColor[program.status || 'draft'] || 'bg-slate-100 text-slate-600'}`}>
          {program.status}
        </span>
        {program.difficulty && (
          <span className={`px-2.5 py-1 text-[9px] font-black uppercase tracking-widest rounded-full ${difficultyColor[program.difficulty]}`}>
            {program.difficulty}
          </span>
        )}
        {program.duration && (
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{program.duration}</span>
        )}
      </div>

      <div className="flex items-center gap-4 mt-4 pt-3 border-t border-slate-50">
        <div className="text-[10px] font-bold text-slate-500">
          {program.modules?.length || 0} modules
        </div>
        <div className="text-[10px] font-bold text-slate-500">
          {program.studentCount || 0} students
        </div>
      </div>
    </div>
  );
};
