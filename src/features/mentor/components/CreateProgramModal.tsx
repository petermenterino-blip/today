import React, { useState } from 'react';
import { motion } from 'motion/react';
import { X, Plus, Trash2, Image, Loader2 } from 'lucide-react';
import { usePrograms } from '../../../hooks/usePrograms';
import { notifyError } from '../../../utils/toast';

interface CreateProgramModalProps {
  currentUser: { id: string; name?: string } | null;
  onClose: () => void;
  onCreated: () => void;
}

export const CreateProgramModal: React.FC<CreateProgramModalProps> = ({ currentUser, onClose, onCreated }) => {
  const { addProgram } = usePrograms();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [category, setCategory] = useState('');
  const [difficulty, setDifficulty] = useState<'Beginner' | 'Intermediate' | 'Advanced'>('Beginner');
  const [duration, setDuration] = useState('');
  const [image, setImage] = useState('');
  const [coverBanner, setCoverBanner] = useState('');
  const [visibility, setVisibility] = useState<'public' | 'private'>('public');
  const [status, setStatus] = useState<'draft' | 'published'>('draft');
  const [outcomes, setOutcomes] = useState<string[]>([]);
  const [outcomeInput, setOutcomeInput] = useState('');
  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState('');
  const [prerequisites, setPrerequisites] = useState<string[]>([]);
  const [prereqInput, setPrereqInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [maxStudents, setMaxStudents] = useState(100);
  const [programOrder, setProgramOrder] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const addOutcome = () => {
    if (outcomeInput.trim()) {
      setOutcomes(prev => [...prev, outcomeInput.trim()]);
      setOutcomeInput('');
    }
  };

  const addSkill = () => {
    if (skillInput.trim()) {
      setSkills(prev => [...prev, skillInput.trim()]);
      setSkillInput('');
    }
  };

  const addPrereq = () => {
    if (prereqInput.trim()) {
      setPrerequisites(prev => [...prev, prereqInput.trim()]);
      setPrereqInput('');
    }
  };

  const addTag = () => {
    if (tagInput.trim()) {
      setTags(prev => [...prev, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleSubmit = async () => {
    const errs: Record<string, string> = {};
    if (!title.trim()) errs.title = 'Title is required';
    if (!description.trim()) errs.description = 'Description is required';

    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    setSubmitting(true);
    const res = await addProgram({
      title: title.trim(),
      description: description.trim(),
      short_description: shortDescription.trim() || undefined,
      duration: duration || undefined,
      category: category || undefined,
      difficulty,
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
      mentor: currentUser?.name || '',
      mentor_id: currentUser?.id,
      progress: 0,
    } as any);

    setSubmitting(false);
    if (res?.error) { notifyError(res.error); return; }
    onCreated();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-300">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white rounded-[40px] max-w-3xl w-full max-h-[90vh] overflow-y-auto p-8 shadow-2xl relative"
      >
        <button onClick={onClose} className="absolute top-6 right-6 w-10 h-10 flex items-center justify-center bg-slate-50 rounded-full hover:bg-slate-100 transition-colors">
          <X size={18} />
        </button>

        <div className="mb-8">
          <h3 className="text-3xl font-black uppercase tracking-tighter">Create Program</h3>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Define a new learning program</p>
        </div>

        <div className="space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="md:col-span-2">
              <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Program Title *</label>
              <input type="text" value={title} onChange={e => setTitle(e.target.value)}
                className={`w-full px-5 py-3.5 bg-slate-50 border ${errors.title ? 'border-red-500' : 'border-slate-100'} rounded-2xl text-sm font-bold outline-none focus:bg-white focus:border-black transition-all`}
                placeholder="e.g. UX Design Mastery" />
              {errors.title && <p className="text-[10px] text-red-500 font-bold mt-1">{errors.title}</p>}
            </div>

            <div className="md:col-span-2">
              <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Short Description</label>
              <input type="text" value={shortDescription} onChange={e => setShortDescription(e.target.value)}
                className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none focus:bg-white focus:border-black transition-all"
                placeholder="Brief tagline for cards" />
            </div>

            <div className="md:col-span-2">
              <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Full Description *</label>
              <textarea value={description} onChange={e => setDescription(e.target.value)} rows={4}
                className={`w-full px-5 py-3.5 bg-slate-50 border ${errors.description ? 'border-red-500' : 'border-slate-100'} rounded-2xl text-sm font-bold outline-none focus:bg-white focus:border-black transition-all resize-none`}
                placeholder="Detailed description of the program..." />
              {errors.description && <p className="text-[10px] text-red-500 font-bold mt-1">{errors.description}</p>}
            </div>

            <div>
              <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Category</label>
              <input type="text" value={category} onChange={e => setCategory(e.target.value)}
                className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none focus:bg-white focus:border-black transition-all"
                placeholder="e.g. Design, Development" />
            </div>

            <div>
              <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Skill Level</label>
              <select value={difficulty} onChange={e => setDifficulty(e.target.value as any)}
                className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none focus:bg-white focus:border-black transition-all">
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
              </select>
            </div>

            <div>
              <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Estimated Duration</label>
              <input type="text" value={duration} onChange={e => setDuration(e.target.value)}
                className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none focus:bg-white focus:border-black transition-all"
                placeholder="e.g. 12 weeks" />
            </div>

            <div>
              <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Max Students</label>
              <input type="number" value={maxStudents} onChange={e => setMaxStudents(Number(e.target.value))}
                className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none focus:bg-white focus:border-black transition-all" />
            </div>
          </div>

          {/* Images */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Thumbnail URL</label>
              <div className="relative">
                <Image size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                <input type="text" value={image} onChange={e => setImage(e.target.value)}
                  className="w-full pl-10 pr-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none focus:bg-white focus:border-black transition-all"
                  placeholder="https://..." />
              </div>
              {image && <img src={image} alt="" className="mt-2 h-16 rounded-xl object-cover bg-slate-100" onError={e => (e.target as HTMLImageElement).style.display = 'none'} />}
            </div>
            <div>
              <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Cover Banner URL</label>
              <input type="text" value={coverBanner} onChange={e => setCoverBanner(e.target.value)}
                className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none focus:bg-white focus:border-black transition-all"
                placeholder="https://..." />
              {coverBanner && <img src={coverBanner} alt="" className="mt-2 h-16 rounded-xl object-cover bg-slate-100 w-full" onError={e => (e.target as HTMLImageElement).style.display = 'none'} />}
            </div>
          </div>

          {/* Learning Objectives */}
          <div>
            <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Learning Objectives</label>
            <div className="flex gap-2 mb-2">
              <input type="text" value={outcomeInput} onChange={e => setOutcomeInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addOutcome())}
                className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold outline-none focus:bg-white focus:border-black transition-all"
                placeholder="Type and press Enter to add" />
              <button onClick={addOutcome} className="px-4 py-2.5 bg-black text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all"><Plus size={14} /></button>
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

          {/* Skills Covered */}
          <div>
            <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Skills Covered</label>
            <div className="flex gap-2 mb-2">
              <input type="text" value={skillInput} onChange={e => setSkillInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold outline-none focus:bg-white focus:border-black transition-all"
                placeholder="Type and press Enter" />
              <button onClick={addSkill} className="px-4 py-2.5 bg-black text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all"><Plus size={14} /></button>
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

          {/* Prerequisites */}
          <div>
            <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Prerequisites</label>
            <div className="flex gap-2 mb-2">
              <input type="text" value={prereqInput} onChange={e => setPrereqInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addPrereq())}
                className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold outline-none focus:bg-white focus:border-black transition-all"
                placeholder="Type and press Enter" />
              <button onClick={addPrereq} className="px-4 py-2.5 bg-black text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all"><Plus size={14} /></button>
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

          {/* Tags */}
          <div>
            <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Tags</label>
            <div className="flex gap-2 mb-2">
              <input type="text" value={tagInput} onChange={e => setTagInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTag())}
                className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold outline-none focus:bg-white focus:border-black transition-all"
                placeholder="Type and press Enter" />
              <button onClick={addTag} className="px-4 py-2.5 bg-black text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all"><Plus size={14} /></button>
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

          {/* Status & Visibility */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Program Status</label>
              <select value={status} onChange={e => setStatus(e.target.value as any)}
                className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none focus:bg-white focus:border-black transition-all">
                <option value="draft">Draft</option>
                <option value="published">Published</option>
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
            <div>
              <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Program Order</label>
              <input type="number" value={programOrder} onChange={e => setProgramOrder(Number(e.target.value))}
                className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none focus:bg-white focus:border-black transition-all" />
            </div>
          </div>
        </div>

        <div className="mt-8 flex gap-4">
          <button onClick={onClose} className="flex-1 py-4 bg-slate-100 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all">Cancel</button>
          <button onClick={handleSubmit} disabled={submitting}
            className="flex-1 py-4 bg-black text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-black/10 disabled:opacity-50 flex items-center justify-center gap-2">
            {submitting && <Loader2 size={14} className="animate-spin" />}
            Create Program
          </button>
        </div>
      </motion.div>
    </div>
  );
};
