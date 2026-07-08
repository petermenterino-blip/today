import React, { useState } from 'react';
import { motion } from 'motion/react';
import { X, Plus, Image, Save, Loader2, BookOpen, Settings, List } from 'lucide-react';
import { usePrograms } from '../../../hooks/usePrograms';
import { Program } from '../../../types';
import { ProgramModulesManager } from './ProgramModulesManager';
import { notifyError } from '../../../utils/toast';

interface EditProgramModalProps {
  program: Program;
  onClose: () => void;
  onUpdated: () => void;
}

type EditTab = 'basics' | 'content' | 'modules';

export const EditProgramModal: React.FC<EditProgramModalProps> = ({ program, onClose, onUpdated }) => {
  const { updateProgram } = usePrograms();

  const [activeTab, setActiveTab] = useState<EditTab>('basics');
  const [title, setTitle] = useState(program.title);
  const [description, setDescription] = useState(program.description || '');
  const [shortDescription, setShortDescription] = useState(program.short_description || '');
  const [category, setCategory] = useState(program.category || '');
  const [difficulty, setDifficulty] = useState(program.difficulty || 'Beginner');
  const [duration, setDuration] = useState(program.duration || '');
  const [image, setImage] = useState(program.image || program.thumbnail || '');
  const [coverBanner, setCoverBanner] = useState(program.cover_banner || '');
  const [visibility, setVisibility] = useState(program.visibility || 'public');
  const [status, setStatus] = useState(program.status);
  const [maxStudents, setMaxStudents] = useState(program.maxStudents || 100);
  const [programOrder, setProgramOrder] = useState(program.program_order || 0);

  const [outcomes, setOutcomes] = useState<string[]>(program.outcomes || program.learning_objectives || []);
  const [outcomeInput, setOutcomeInput] = useState('');
  const [skills, setSkills] = useState<string[]>(program.skillsCovered || []);
  const [skillInput, setSkillInput] = useState('');
  const [prerequisites, setPrerequisites] = useState<string[]>(program.prerequisites || []);
  const [prereqInput, setPrereqInput] = useState('');
  const [tags, setTags] = useState<string[]>(program.tags || []);
  const [tagInput, setTagInput] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSave = async () => {
    const errs: Record<string, string> = {};
    if (!title.trim()) errs.title = 'Title is required';
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    setSubmitting(true);
    const res = await updateProgram({
      id: program.id,
      program: {
        title: title.trim(),
        description: description.trim(),
        short_description: shortDescription.trim() || undefined,
        duration: duration || undefined,
        category: category || undefined,
        difficulty: difficulty as any,
        image: image || undefined,
        cover_banner: coverBanner || undefined,
        visibility,
        status,
        outcomes,
        skillsCovered: skills,
        prerequisites,
        tags,
        maxStudents,
        program_order: programOrder,
        learning_objectives: outcomes,
      } as any,
    });

    setSubmitting(false);
    if (res?.error) { notifyError(res.error); return; }
    onUpdated();
  };

  const tabClass = (tab: EditTab) =>
    `flex items-center gap-2 px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
      activeTab === tab ? 'bg-black text-white shadow-sm' : 'text-slate-400 hover:text-slate-700 hover:bg-slate-50'
    }`;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-300">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white rounded-[40px] max-w-4xl w-full max-h-[90vh] overflow-y-auto p-8 shadow-2xl relative"
      >
        <button onClick={onClose} className="absolute top-6 right-6 w-10 h-10 flex items-center justify-center bg-slate-50 rounded-full hover:bg-slate-100 transition-colors">
          <X size={18} />
        </button>

        <div className="mb-8">
          <h3 className="text-3xl font-black uppercase tracking-tighter">Edit Program</h3>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{program.title}</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-3 mb-8 border-b border-slate-100 pb-4">
          <button onClick={() => setActiveTab('basics')} className={tabClass('basics')}>
            <Settings size={12} /> Basics
          </button>
          <button onClick={() => setActiveTab('content')} className={tabClass('content')}>
            <BookOpen size={12} /> Content
          </button>
          <button onClick={() => setActiveTab('modules')} className={tabClass('modules')}>
            <List size={12} /> Modules
          </button>
        </div>

        {activeTab === 'basics' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="md:col-span-2">
                <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Program Title *</label>
                <input type="text" value={title} onChange={e => setTitle(e.target.value)}
                  className={`w-full px-5 py-3.5 bg-slate-50 border ${errors.title ? 'border-red-500' : 'border-slate-100'} rounded-2xl text-sm font-bold outline-none focus:bg-white focus:border-black transition-all`} />
                {errors.title && <p className="text-[10px] text-red-500 font-bold mt-1">{errors.title}</p>}
              </div>
              <div className="md:col-span-2">
                <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Short Description</label>
                <input type="text" value={shortDescription} onChange={e => setShortDescription(e.target.value)}
                  className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none focus:bg-white focus:border-black transition-all" />
              </div>
              <div className="md:col-span-2">
                <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Full Description</label>
                <textarea value={description} onChange={e => setDescription(e.target.value)} rows={4}
                  className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none focus:bg-white focus:border-black transition-all resize-none" />
              </div>
              <div>
                <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Category</label>
                <input type="text" value={category} onChange={e => setCategory(e.target.value)}
                  className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none focus:bg-white focus:border-black transition-all" />
              </div>
              <div>
                <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Skill Level</label>
                <select value={difficulty} onChange={e => setDifficulty(e.target.value)}
                  className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none focus:bg-white focus:border-black transition-all">
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                </select>
              </div>
              <div>
                <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Duration</label>
                <input type="text" value={duration} onChange={e => setDuration(e.target.value)}
                  className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none focus:bg-white focus:border-black transition-all" />
              </div>
              <div>
                <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Max Students</label>
                <input type="number" value={maxStudents} onChange={e => setMaxStudents(Number(e.target.value))}
                  className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none focus:bg-white focus:border-black transition-all" />
              </div>
              <div>
                <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Program Order</label>
                <input type="number" value={programOrder} onChange={e => setProgramOrder(Number(e.target.value))}
                  className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none focus:bg-white focus:border-black transition-all" />
              </div>
            </div>

            {/* Images */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Thumbnail URL</label>
                <input type="text" value={image} onChange={e => setImage(e.target.value)}
                  className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none focus:bg-white focus:border-black transition-all" />
                {image && <img src={image} alt="" className="mt-2 h-16 rounded-xl object-cover bg-slate-100" onError={e => (e.target as HTMLImageElement).style.display = 'none'} />}
              </div>
              <div>
                <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Cover Banner URL</label>
                <input type="text" value={coverBanner} onChange={e => setCoverBanner(e.target.value)}
                  className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none focus:bg-white focus:border-black transition-all" />
                {coverBanner && <img src={coverBanner} alt="" className="mt-2 h-16 rounded-xl object-cover bg-slate-100 w-full" onError={e => (e.target as HTMLImageElement).style.display = 'none'} />}
              </div>
            </div>

            {/* Status & Visibility */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Status</label>
                <select value={status} onChange={e => setStatus(e.target.value as any)}
                  className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none focus:bg-white focus:border-black transition-all">
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
              <div>
                <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Visibility</label>
                <select value={visibility} onChange={e => setVisibility(e.target.value as any)}
                  className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none focus:bg-white focus:border-black transition-all">
                  <option value="public">Public</option>
                  <option value="private">Private</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'content' && (
          <div className="space-y-6">
            <div>
              <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Learning Objectives</label>
              <div className="flex gap-2 mb-2">
                <input type="text" value={outcomeInput} onChange={e => setOutcomeInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), setOutcomes(prev => [...prev, outcomeInput.trim()]), setOutcomeInput(''))}
                  className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold outline-none focus:bg-white focus:border-black transition-all"
                  placeholder="Type and press Enter" />
                <button onClick={() => { if (outcomeInput.trim()) { setOutcomes(prev => [...prev, outcomeInput.trim()]); setOutcomeInput(''); } }}
                  className="px-4 py-2.5 bg-black text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all"><Plus size={14} /></button>
              </div>
              <div className="flex flex-wrap gap-2">
                {outcomes.map((o, i) => (
                  <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-bold">
                    {o}
                    <button onClick={() => setOutcomes(prev => prev.filter((_, j) => j !== i))} className="hover:text-red-500"><X size={12} /></button>
                  </span>
                ))}
              </div>
            </div>

            <div>
              <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Skills Covered</label>
              <div className="flex gap-2 mb-2">
                <input type="text" value={skillInput} onChange={e => setSkillInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), setSkills(prev => [...prev, skillInput.trim()]), setSkillInput(''))}
                  className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold outline-none focus:bg-white focus:border-black transition-all"
                  placeholder="Type and press Enter" />
                <button onClick={() => { if (skillInput.trim()) { setSkills(prev => [...prev, skillInput.trim()]); setSkillInput(''); } }}
                  className="px-4 py-2.5 bg-black text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all"><Plus size={14} /></button>
              </div>
              <div className="flex flex-wrap gap-2">
                {skills.map((s, i) => (
                  <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-bold">
                    {s}
                    <button onClick={() => setSkills(prev => prev.filter((_, j) => j !== i))} className="hover:text-red-500"><X size={12} /></button>
                  </span>
                ))}
              </div>
            </div>

            <div>
              <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Prerequisites</label>
              <div className="flex gap-2 mb-2">
                <input type="text" value={prereqInput} onChange={e => setPrereqInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), setPrerequisites(prev => [...prev, prereqInput.trim()]), setPrereqInput(''))}
                  className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold outline-none focus:bg-white focus:border-black transition-all"
                  placeholder="Type and press Enter" />
                <button onClick={() => { if (prereqInput.trim()) { setPrerequisites(prev => [...prev, prereqInput.trim()]); setPrereqInput(''); } }}
                  className="px-4 py-2.5 bg-black text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all"><Plus size={14} /></button>
              </div>
              <div className="flex flex-wrap gap-2">
                {prerequisites.map((p, i) => (
                  <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-600 rounded-full text-[10px] font-bold">
                    {p}
                    <button onClick={() => setPrerequisites(prev => prev.filter((_, j) => j !== i))} className="hover:text-red-500"><X size={12} /></button>
                  </span>
                ))}
              </div>
            </div>

            <div>
              <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Tags</label>
              <div className="flex gap-2 mb-2">
                <input type="text" value={tagInput} onChange={e => setTagInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), setTags(prev => [...prev, tagInput.trim()]), setTagInput(''))}
                  className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold outline-none focus:bg-white focus:border-black transition-all"
                  placeholder="Type and press Enter" />
                <button onClick={() => { if (tagInput.trim()) { setTags(prev => [...prev, tagInput.trim()]); setTagInput(''); } }}
                  className="px-4 py-2.5 bg-black text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all"><Plus size={14} /></button>
              </div>
              <div className="flex flex-wrap gap-2">
                {tags.map((t, i) => (
                  <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 text-purple-600 rounded-full text-[10px] font-bold">
                    {t}
                    <button onClick={() => setTags(prev => prev.filter((_, j) => j !== i))} className="hover:text-red-500"><X size={12} /></button>
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'modules' && (
          <ProgramModulesManager programId={program.id} />
        )}

        <div className="mt-8 flex gap-4 border-t border-slate-100 pt-6">
          <button onClick={onClose} className="flex-1 py-4 bg-slate-100 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all">Cancel</button>
          <button onClick={handleSave} disabled={submitting}
            className="flex-1 py-4 bg-black text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-black/10 disabled:opacity-50 flex items-center justify-center gap-2">
            {submitting && <Loader2 size={14} className="animate-spin" />}
            <Save size={14} /> Save Changes
          </button>
        </div>
      </motion.div>
    </div>
  );
};
