import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  Plus, Trash2, GripVertical, Edit3, X, ChevronUp, ChevronDown,
  FileText, Link2, Video, Paperclip, BookOpen, Save, Loader2
} from 'lucide-react';
import { useProgramModules } from '../../../hooks/useProgramModules';
import { ProgramModule } from '../../../types';
import { notifySuccess, notifyError } from '../../../utils/toast';

interface ProgramModulesManagerProps {
  programId: string;
}

export const ProgramModulesManager: React.FC<ProgramModulesManagerProps> = ({ programId }) => {
  const { modules, loading, addModule, updateModule, deleteModule, reorderModules } = useProgramModules(programId);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingModuleId, setEditingModuleId] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [saving, setSaving] = useState(false);

  const handleCreate = async () => {
    if (!newTitle.trim()) { notifyError('Module title is required'); return; }
    setSaving(true);
    const maxOrder = modules.length;
    const res = await addModule({
      program_id: programId,
      title: newTitle.trim(),
      description: newDesc.trim(),
      module_order: maxOrder,
      learning_outcomes: [],
      resources: [],
      attachments: [],
      videos: [],
      external_links: [],
    });
    setSaving(false);
    if (res?.error) { notifyError(res.error); return; }
    notifySuccess('Module created');
    setNewTitle('');
    setNewDesc('');
    setShowCreateForm(false);
  };

  const handleDelete = async (id: string) => {
    const res = await deleteModule(id);
    if (res?.error) { notifyError(res.error); return; }
    notifySuccess('Module deleted');
  };

  const handleMove = async (index: number, direction: 'up' | 'down') => {
    const newModules = [...modules];
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= newModules.length) return;
    [newModules[index], newModules[swapIndex]] = [newModules[swapIndex], newModules[index]];
    const res = await reorderModules(newModules.map(m => m.id));
    if (res?.error) { notifyError(res.error); }
  };

  if (loading) {
    return <div className="text-center py-8 text-xs text-slate-400 font-medium">Loading modules...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Modules ({modules.length})</p>
        </div>
        <button onClick={() => setShowCreateForm(!showCreateForm)}
          className="px-4 py-2 bg-black text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center gap-1.5">
          <Plus size={12} /> Add Module
        </button>
      </div>

      {/* Create Form */}
      {showCreateForm && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          className="bg-slate-50 border border-slate-100 rounded-[24px] p-5 space-y-4"
        >
          <div>
            <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1.5 block">Module Title *</label>
            <input type="text" value={newTitle} onChange={e => setNewTitle(e.target.value)}
              className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-black transition-all"
              placeholder="e.g. Introduction to Core Concepts" />
          </div>
          <div>
            <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1.5 block">Description</label>
            <textarea value={newDesc} onChange={e => setNewDesc(e.target.value)} rows={2}
              className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium outline-none focus:border-black transition-all resize-none"
              placeholder="Module overview..." />
          </div>
          <div className="flex gap-3">
            <button onClick={() => setShowCreateForm(false)}
              className="px-5 py-2.5 border border-slate-200 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all text-slate-600">
              Cancel
            </button>
            <button onClick={handleCreate} disabled={saving || !newTitle.trim()}
              className="px-5 py-2.5 bg-black text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all disabled:opacity-50 flex items-center gap-1.5">
              {saving && <Loader2 size={12} className="animate-spin" />}
              Create Module
            </button>
          </div>
        </motion.div>
      )}

      {/* Module List */}
      {modules.length === 0 && !showCreateForm ? (
        <div className="text-center py-12 text-xs text-slate-400 font-medium">
          <BookOpen size={32} className="mx-auto text-slate-200 mb-3" />
          No modules yet. Add your first module.
        </div>
      ) : (
        <div className="space-y-3">
          {modules.map((mod, index) => (
            <motion.div
              key={mod.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white border border-slate-100 rounded-[20px] overflow-hidden"
            >
              {editingModuleId === mod.id ? (
                <ModuleEditForm
                  module={mod}
                  onSave={async (updates) => {
                    const res = await updateModule({ id: mod.id, updates });
                    if (!res?.error) { setEditingModuleId(null); notifySuccess('Module updated'); }
                    else notifyError(res.error);
                  }}
                  onCancel={() => setEditingModuleId(null)}
                />
              ) : (
                <div className="p-4 flex items-center gap-4">
                  <div className="flex flex-col gap-0.5 text-slate-300">
                    <button onClick={() => handleMove(index, 'up')} disabled={index === 0}
                      className="hover:text-slate-600 disabled:opacity-30"><ChevronUp size={12} /></button>
                    <button onClick={() => handleMove(index, 'down')} disabled={index === modules.length - 1}
                      className="hover:text-slate-600 disabled:opacity-30"><ChevronDown size={12} /></button>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black text-indigo-500">M{index + 1}</span>
                      <h4 className="text-sm font-bold text-slate-900">{mod.title}</h4>
                    </div>
                    {mod.description && <p className="text-[11px] text-slate-500 font-medium mt-0.5">{mod.description}</p>}
                    <div className="flex items-center gap-3 mt-1.5 text-[9px] font-bold text-slate-400">
                      {(mod.resources || []).length > 0 && <span>{(mod.resources || []).length} resources</span>}
                      {(mod.videos || []).length > 0 && <span>{(mod.videos || []).length} videos</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => setEditingModuleId(mod.id)}
                      className="p-2 hover:bg-slate-50 rounded-xl transition-colors" title="Edit module">
                      <Edit3 size={14} className="text-slate-400" />
                    </button>
                    <button onClick={() => handleDelete(mod.id)}
                      className="p-2 hover:bg-rose-50 rounded-xl transition-colors" title="Delete module">
                      <Trash2 size={14} className="text-rose-400" />
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

interface ModuleEditFormProps {
  module: ProgramModule;
  onSave: (updates: Partial<ProgramModule>) => Promise<void>;
  onCancel: () => void;
}

const ModuleEditForm: React.FC<ModuleEditFormProps> = ({ module, onSave, onCancel }) => {
  const [title, setTitle] = useState(module.title);
  const [description, setDescription] = useState(module.description || '');
  const [learningOutcomes, setLearningOutcomes] = useState<string[]>(module.learning_outcomes || []);
  const [outcomeInput, setOutcomeInput] = useState('');
  const [resources, setResources] = useState<{ title: string; url?: string; type?: string }[]>(module.resources || []);
  const [resTitle, setResTitle] = useState('');
  const [resUrl, setResUrl] = useState('');
  const [videos, setVideos] = useState<{ title: string; url: string; duration?: string }[]>(module.videos || []);
  const [vidTitle, setVidTitle] = useState('');
  const [vidUrl, setVidUrl] = useState('');
  const [vidDur, setVidDur] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!title.trim()) return;
    setSaving(true);
    await onSave({
      title: title.trim(),
      description: description.trim(),
      learning_outcomes: learningOutcomes,
      resources,
      videos,
    });
    setSaving(false);
  };

  return (
    <div className="p-5 bg-slate-50 space-y-4">
      <div className="grid grid-cols-1 gap-4">
        <div>
          <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1.5 block">Title</label>
          <input type="text" value={title} onChange={e => setTitle(e.target.value)}
            className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-black transition-all" />
        </div>
        <div>
          <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1.5 block">Description</label>
          <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2}
            className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium outline-none focus:border-black transition-all resize-none" />
        </div>
      </div>

      {/* Learning Outcomes */}
      <div>
        <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1.5 block">Learning Outcomes</label>
        <div className="flex gap-2 mb-2">
          <input type="text" value={outcomeInput} onChange={e => setOutcomeInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), setLearningOutcomes(prev => [...prev, outcomeInput.trim()]), setOutcomeInput(''))}
            className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium outline-none focus:border-black transition-all"
            placeholder="Add outcome and press Enter" />
          <button onClick={() => { if (outcomeInput.trim()) { setLearningOutcomes(prev => [...prev, outcomeInput.trim()]); setOutcomeInput(''); } }}
            className="px-3 py-2 bg-black text-white rounded-xl text-[9px] font-black hover:bg-slate-800 transition-all"><Plus size={14} /></button>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {learningOutcomes.map((o, i) => (
            <span key={i} className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-50 text-indigo-600 rounded-full text-[9px] font-bold">
              {o}
              <button onClick={() => setLearningOutcomes(prev => prev.filter((_, j) => j !== i))}><X size={10} /></button>
            </span>
          ))}
        </div>
      </div>

      {/* Resources */}
      <div>
        <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1.5 block flex items-center gap-1.5">
          <FileText size={12} /> Resources
        </label>
        <div className="flex gap-2 mb-2">
          <input type="text" value={resTitle} onChange={e => setResTitle(e.target.value)}
            className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium outline-none focus:border-black transition-all"
            placeholder="Title" />
          <input type="text" value={resUrl} onChange={e => setResUrl(e.target.value)}
            className="flex-[2] px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium outline-none focus:border-black transition-all"
            placeholder="URL (optional)" />
          <button onClick={() => { if (resTitle.trim()) { setResources(prev => [...prev, { title: resTitle.trim(), url: resUrl.trim() || undefined }]); setResTitle(''); setResUrl(''); } }}
            className="px-3 py-2 bg-black text-white rounded-xl text-[9px] font-black hover:bg-slate-800 transition-all"><Plus size={14} /></button>
        </div>
        {resources.map((r, i) => (
          <div key={i} className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-100 rounded-lg mb-1 text-xs">
            <FileText size={12} className="text-slate-400 shrink-0" />
            <span className="font-bold text-slate-700 flex-1">{r.title}</span>
            {r.url && <span className="text-[9px] text-indigo-500 truncate max-w-[120px]">{r.url}</span>}
            <button onClick={() => setResources(prev => prev.filter((_, j) => j !== i))} className="text-rose-400 hover:text-rose-600"><X size={12} /></button>
          </div>
        ))}
      </div>

      {/* Videos */}
      <div>
        <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1.5 block flex items-center gap-1.5">
          <Video size={12} /> Videos
        </label>
        <div className="flex gap-2 mb-2">
          <input type="text" value={vidTitle} onChange={e => setVidTitle(e.target.value)}
            className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium outline-none focus:border-black transition-all"
            placeholder="Title" />
          <input type="text" value={vidUrl} onChange={e => setVidUrl(e.target.value)}
            className="flex-[2] px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium outline-none focus:border-black transition-all"
            placeholder="Video URL" />
          <input type="text" value={vidDur} onChange={e => setVidDur(e.target.value)}
            className="w-20 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium outline-none focus:border-black transition-all"
            placeholder="Dur." />
          <button onClick={() => { if (vidTitle.trim() && vidUrl.trim()) { setVideos(prev => [...prev, { title: vidTitle.trim(), url: vidUrl.trim(), duration: vidDur.trim() || undefined }]); setVidTitle(''); setVidUrl(''); setVidDur(''); } }}
            className="px-3 py-2 bg-black text-white rounded-xl text-[9px] font-black hover:bg-slate-800 transition-all"><Plus size={14} /></button>
        </div>
        {videos.map((v, i) => (
          <div key={i} className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-100 rounded-lg mb-1 text-xs">
            <Video size={12} className="text-slate-400 shrink-0" />
            <span className="font-bold text-slate-700 flex-1">{v.title}</span>
            {v.duration && <span className="text-[9px] text-slate-400">{v.duration}</span>}
            <button onClick={() => setVideos(prev => prev.filter((_, j) => j !== i))} className="text-rose-400 hover:text-rose-600"><X size={12} /></button>
          </div>
        ))}
      </div>

      <div className="flex gap-3 pt-2">
        <button onClick={onCancel} className="px-5 py-2.5 border border-slate-200 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-white transition-all text-slate-600">Cancel</button>
        <button onClick={handleSave} disabled={saving || !title.trim()}
          className="px-5 py-2.5 bg-black text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all disabled:opacity-50 flex items-center gap-1.5">
          {saving && <Loader2 size={12} className="animate-spin" />}
          Save Module
        </button>
      </div>
    </div>
  );
};
