import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import {
  Plus, Search, SlidersHorizontal, Archive, Trash2, Copy,
  Eye, EyeOff, FileEdit, MoreHorizontal, BookOpen, Briefcase,
  CheckCircle2, Clock, ArrowUpDown, Filter, X, Download,
  Loader2
} from 'lucide-react';
import { usePrograms } from '../../../hooks/usePrograms';
import { Program } from '../../../types';
import { CreateProgramModal } from './CreateProgramModal';
import { EditProgramModal } from './EditProgramModal';
import { AssignProgramModal } from './AssignProgramModal';
import { notifySuccess, notifyError } from '../../../utils/toast';

interface ProgramsTabProps {
  currentUser: { id: string; name?: string } | null;
}

type SortField = 'title' | 'created_at' | 'updated_at' | 'program_order';
type SortOrder = 'asc' | 'desc';
type FilterStatus = 'all' | 'draft' | 'published' | 'archived';
type FilterLevel = 'all' | 'Beginner' | 'Intermediate' | 'Advanced';

export const ProgramsTab: React.FC<ProgramsTabProps> = ({ currentUser }) => {
  const {
    programs, loading, addProgram, deleteProgram, updateProgram,
    archiveProgram, restoreProgram, publishProgram, duplicateProgram, permanentDeleteProgram
  } = usePrograms();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [filterLevel, setFilterLevel] = useState<FilterLevel>('all');
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [showFilters, setShowFilters] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingProgram, setEditingProgram] = useState<Program | null>(null);
  const [assigningProgram, setAssigningProgram] = useState<Program | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [contextMenuId, setContextMenuId] = useState<string | null>(null);

  const filteredPrograms = useMemo(() => {
    let result = [...programs];

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(p =>
        p.title.toLowerCase().includes(q) ||
        (p.description || '').toLowerCase().includes(q) ||
        (p.category || '').toLowerCase().includes(q)
      );
    }

    if (filterStatus !== 'all') {
      result = result.filter(p => p.status === filterStatus);
    }

    if (filterLevel !== 'all') {
      result = result.filter(p => p.difficulty === filterLevel);
    }

    result.sort((a, b) => {
      let cmp = 0;
      if (sortField === 'title') cmp = a.title.localeCompare(b.title);
      else if (sortField === 'created_at') cmp = (a.created_at || '').localeCompare(b.created_at || '');
      else if (sortField === 'updated_at') cmp = (a.updated_at || '').localeCompare(b.updated_at || '');
      else if (sortField === 'program_order') cmp = (a.program_order || 0) - (b.program_order || 0);
      return sortOrder === 'asc' ? cmp : -cmp;
    });

    return result;
  }, [programs, searchQuery, filterStatus, filterLevel, sortField, sortOrder]);

  const handleArchive = async (id: string) => {
    const res = await archiveProgram(id);
    if (!res?.error) { notifySuccess('Program archived'); setContextMenuId(null); }
    else notifyError(res.error);
  };

  const handleRestore = async (id: string) => {
    const res = await restoreProgram(id);
    if (!res?.error) { notifySuccess('Program restored'); setContextMenuId(null); }
    else notifyError(res.error);
  };

  const handlePublish = async (id: string) => {
    const res = await publishProgram(id);
    if (!res?.error) { notifySuccess('Program published'); setContextMenuId(null); }
    else notifyError(res.error);
  };

  const handleDuplicate = async (id: string) => {
    const res = await duplicateProgram(id);
    if (!res?.error) { notifySuccess('Program duplicated'); setContextMenuId(null); }
    else notifyError(res?.error || 'Failed to duplicate');
  };

  const handlePermanentDelete = async (id: string) => {
    const res = await permanentDeleteProgram(id);
    if (!res?.error) { notifySuccess('Program permanently deleted'); setConfirmDeleteId(null); }
    else notifyError(res.error);
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case 'published': return 'bg-emerald-50 text-emerald-600 border-emerald-200';
      case 'draft': return 'bg-amber-50 text-amber-600 border-amber-200';
      case 'archived': return 'bg-slate-50 text-slate-500 border-slate-200';
      default: return 'bg-slate-50 text-slate-500 border-slate-200';
    }
  };

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(o => o === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="animate-spin text-slate-300" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-slate-900">Program Management</h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">Create, manage, and assign learning programs</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-5 py-2.5 bg-black text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-sm flex items-center gap-2"
        >
          <Plus size={14} /> Create Program
        </button>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
          <input
            type="text"
            placeholder="Search programs..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs font-medium outline-none focus:border-black transition-all"
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`px-4 py-2.5 border rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${
            showFilters ? 'bg-black text-white border-black' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'
          }`}
        >
          <SlidersHorizontal size={12} /> Filters
        </button>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          className="bg-white border border-slate-100 rounded-[24px] p-5 space-y-4"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Filters</span>
            <button onClick={() => { setFilterStatus('all'); setFilterLevel('all'); }} className="text-[9px] font-bold text-indigo-500 uppercase tracking-widest">Reset</button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1.5 block">Status</label>
              <select value={filterStatus} onChange={e => setFilterStatus(e.target.value as FilterStatus)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs font-medium outline-none focus:border-black">
                <option value="all">All Statuses</option>
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
            </div>
            <div>
              <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1.5 block">Skill Level</label>
              <select value={filterLevel} onChange={e => setFilterLevel(e.target.value as FilterLevel)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs font-medium outline-none focus:border-black">
                <option value="all">All Levels</option>
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
              </select>
            </div>
            <div>
              <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1.5 block">Sort By</label>
              <select value={`${sortField}-${sortOrder}`} onChange={e => {
                const [field, order] = e.target.value.split('-') as [SortField, SortOrder];
                setSortField(field); setSortOrder(order);
              }}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs font-medium outline-none focus:border-black">
                <option value="created_at-desc">Newest First</option>
                <option value="created_at-asc">Oldest First</option>
                <option value="title-asc">Name A-Z</option>
                <option value="title-desc">Name Z-A</option>
                <option value="updated_at-desc">Recently Updated</option>
                <option value="program_order-asc">Program Order</option>
              </select>
            </div>
          </div>
        </motion.div>
      )}

      {/* Stats Summary */}
      <div className="grid grid-cols-4 gap-3">
        <div className="bg-white rounded-[20px] p-4 border border-slate-100">
          <p className="text-2xl font-black">{programs.length}</p>
          <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Total</p>
        </div>
        <div className="bg-emerald-50 rounded-[20px] p-4 border border-emerald-100">
          <p className="text-2xl font-black text-emerald-600">{programs.filter(p => p.status === 'published').length}</p>
          <p className="text-[9px] font-black uppercase tracking-widest text-emerald-600">Published</p>
        </div>
        <div className="bg-amber-50 rounded-[20px] p-4 border border-amber-100">
          <p className="text-2xl font-black text-amber-600">{programs.filter(p => p.status === 'draft').length}</p>
          <p className="text-[9px] font-black uppercase tracking-widest text-amber-600">Drafts</p>
        </div>
        <div className="bg-slate-50 rounded-[20px] p-4 border border-slate-100">
          <p className="text-2xl font-black text-slate-600">{programs.filter(p => p.status === 'archived').length}</p>
          <p className="text-[9px] font-black uppercase tracking-widest text-slate-600">Archived</p>
        </div>
      </div>

      {/* Programs List */}
      {filteredPrograms.length === 0 ? (
        <div className="text-center py-16 max-w-md mx-auto">
          <div className="w-14 h-14 bg-slate-100 rounded-3xl flex items-center justify-center mx-auto mb-5">
            <Briefcase size={26} className="text-slate-400" />
          </div>
          <h2 className="text-xl font-black uppercase tracking-tight text-slate-900 mb-2">
            {searchQuery || filterStatus !== 'all' || filterLevel !== 'all' ? 'No Matching Programs' : 'No Programs Yet'}
          </h2>
          <p className="text-xs text-slate-500 font-medium leading-relaxed mb-6">
            {searchQuery || filterStatus !== 'all' || filterLevel !== 'all'
              ? 'Try adjusting your search or filters.'
              : 'Create your first program to get started.'}
          </p>
          {!searchQuery && filterStatus === 'all' && filterLevel === 'all' && (
            <button onClick={() => setShowCreateModal(true)}
              className="px-6 py-3 bg-black text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-sm">
              Create Program
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredPrograms.map((program, idx) => (
            <motion.div
              key={program.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.03 }}
              className="bg-white rounded-[24px] border border-slate-100 shadow-sm hover:shadow-md hover:border-slate-200 transition-all duration-300"
            >
              <div className="p-5 flex items-start gap-5">
                {/* Icon */}
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-sm shrink-0 ${
                  program.status === 'published' ? 'bg-emerald-500' :
                  program.status === 'archived' ? 'bg-slate-400' : 'bg-amber-500'
                }`}>
                  {program.status === 'archived' ? <Archive size={20} /> : <BookOpen size={20} />}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-base font-black uppercase tracking-tight text-slate-900">{program.title}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${statusBadge(program.status)}`}>
                          {program.status}
                        </span>
                        {program.visibility === 'public' ? (
                          <span className="flex items-center gap-1 text-[9px] font-bold text-indigo-500">
                            <Eye size={10} /> Public
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-[9px] font-bold text-slate-400">
                            <EyeOff size={10} /> Private
                          </span>
                        )}
                        {program.difficulty && (
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{program.difficulty}</span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="relative flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => { setEditingProgram(program); }}
                        className="p-2 hover:bg-slate-50 rounded-xl transition-colors"
                        title="Edit"
                      >
                        <FileEdit size={14} className="text-slate-400" />
                      </button>
                      <button
                        onClick={() => { setAssigningProgram(program); }}
                        className="p-2 hover:bg-slate-50 rounded-xl transition-colors"
                        title="Assign to Students"
                      >
                        <Plus size={14} className="text-slate-400" />
                      </button>
                      <button
                        onClick={() => setContextMenuId(contextMenuId === program.id ? null : program.id)}
                        className="p-2 hover:bg-slate-50 rounded-xl transition-colors"
                      >
                        <MoreHorizontal size={14} className="text-slate-400" />
                      </button>

                      {contextMenuId === program.id && (
                        <>
                          <div className="fixed inset-0 z-40" onClick={() => setContextMenuId(null)} />
                          <div className="absolute right-0 top-10 z-50 bg-white border border-slate-100 rounded-2xl shadow-xl py-2 min-w-[160px]">
                            {program.status === 'draft' && (
                              <button onClick={() => handlePublish(program.id)}
                                className="w-full px-4 py-2.5 text-left text-[10px] font-black uppercase tracking-widest text-emerald-600 hover:bg-emerald-50 flex items-center gap-2">
                                <Eye size={12} /> Publish
                              </button>
                            )}
                            {program.status === 'published' && (
                              <button onClick={() => handleArchive(program.id)}
                                className="w-full px-4 py-2.5 text-left text-[10px] font-black uppercase tracking-widest text-amber-600 hover:bg-amber-50 flex items-center gap-2">
                                <Archive size={12} /> Archive
                              </button>
                            )}
                            {program.status === 'archived' && (
                              <button onClick={() => handleRestore(program.id)}
                                className="w-full px-4 py-2.5 text-left text-[10px] font-black uppercase tracking-widest text-indigo-600 hover:bg-indigo-50 flex items-center gap-2">
                                <Clock size={12} /> Restore
                              </button>
                            )}
                            <button onClick={() => handleDuplicate(program.id)}
                              className="w-full px-4 py-2.5 text-left text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 flex items-center gap-2">
                              <Copy size={12} /> Duplicate
                            </button>
                            <div className="h-px bg-slate-100 my-1" />
                            <button onClick={() => setConfirmDeleteId(program.id)}
                              className="w-full px-4 py-2.5 text-left text-[10px] font-black uppercase tracking-widest text-rose-600 hover:bg-rose-50 flex items-center gap-2">
                              <Trash2 size={12} /> Delete
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  <p className="text-xs text-slate-500 font-medium mt-2 line-clamp-2">{program.description}</p>

                  <div className="flex items-center gap-4 mt-3 text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                    {program.duration && <span className="flex items-center gap-1"><Clock size={10} /> {program.duration}</span>}
                    {program.category && <span>{program.category}</span>}
                    {program.studentCount !== undefined && program.studentCount > 0 && (
                      <span>{program.studentCount} enrolled</span>
                    )}
                    {(program.outcomes || []).length > 0 && (
                      <span>{(program.outcomes || []).length} objectives</span>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Create Program Modal */}
      {showCreateModal && (
        <CreateProgramModal
          currentUser={currentUser}
          onClose={() => setShowCreateModal(false)}
          onCreated={() => {
            setShowCreateModal(false);
            notifySuccess('Program created successfully');
          }}
        />
      )}

      {/* Edit Program Modal */}
      {editingProgram && (
        <EditProgramModal
          program={editingProgram}
          onClose={() => setEditingProgram(null)}
          onUpdated={() => {
            setEditingProgram(null);
            notifySuccess('Program updated successfully');
          }}
        />
      )}

      {/* Assign Program Modal */}
      {assigningProgram && (
        <AssignProgramModal
          program={assigningProgram}
          onClose={() => setAssigningProgram(null)}
          onAssigned={() => {
            setAssigningProgram(null);
            notifySuccess('Program assigned successfully');
          }}
        />
      )}

      {/* Confirm Delete */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-300">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-white rounded-[32px] max-w-md w-full p-8 shadow-2xl"
          >
            <div className="text-center">
              <div className="w-14 h-14 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-5">
                <Trash2 size={24} className="text-rose-500" />
              </div>
              <h3 className="text-xl font-black uppercase tracking-tight mb-2">Delete Program?</h3>
              <p className="text-xs text-slate-500 font-medium leading-relaxed mb-6">
                This action permanently deletes the program. Historical student enrollments remain intact.
              </p>
              <div className="flex gap-3">
                <button onClick={() => setConfirmDeleteId(null)}
                  className="flex-1 py-3 border border-slate-200 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all text-slate-600">
                  Cancel
                </button>
                <button onClick={() => handlePermanentDelete(confirmDeleteId)}
                  className="flex-1 py-3 bg-rose-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-700 transition-all shadow-lg shadow-rose-500/10">
                  Delete Forever
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};
