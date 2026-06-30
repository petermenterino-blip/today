import React, { useState } from 'react';
import { motion } from 'motion/react';
import { useJournals } from '../../hooks/useJournals';
import { JournalEntry } from '../../interfaces';
import { Plus, Book, Clock, Edit3, Trash2 } from 'lucide-react';

interface StudentJournalProps {
  studentId: string;
}

const StudentJournal: React.FC<StudentJournalProps> = ({ studentId }) => {
  const { journals, addJournal, loading } = useJournals(studentId);
  const [view, setView] = useState<'list' | 'new' | 'history'>('list');
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newMood, setNewMood] = useState('good');
  const [newTags, setNewTags] = useState('');

  const handleSave = async () => {
    if (!newTitle.trim() || !newContent.trim()) return;
    const tagsArray = newTags.split(',').map(t => t.trim()).filter(Boolean);
    try {
      await addJournal({
        studentId,
        type: 'daily',
        title: newTitle,
        content: newContent,
        mood: newMood as JournalEntry['mood'],
        wins: [],
        challenges: tagsArray,
        reviewedByMentor: false
      });
    } catch {
      return;
    }
    setNewTitle('');
    setNewContent('');
    setNewTags('');
    setView('list');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end mb-6">
        <div>
          <h3 className="text-2xl font-black uppercase tracking-tighter text-brand-charcoal">Your Journal</h3>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Reflect on your progress</p>
        </div>
        <div className="flex gap-2">
          {view !== 'list' && (
            <button onClick={() => setView('list')} className="btn-compact bg-slate-100 text-slate-600 hover:bg-slate-200 shadow-none">
              Back
            </button>
          )}
          {view === 'list' && (
            <button onClick={() => setView('new')} className="btn-compact bg-brand-charcoal text-white hover:bg-indigo-600 transition-colors shadow-md flex items-center gap-2">
              <Plus size={16} /> New Entry
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="py-12 flex justify-center"><div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div></div>
      ) : view === 'list' || view === 'history' ? (
        <div className="space-y-4">
          {journals.length === 0 ? (
            <div className="py-16 text-center border-2 border-dashed border-slate-200 rounded-[32px] bg-slate-50">
               <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300 shadow-sm">
                 <Book size={24} />
               </div>
               <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">No journal entries yet</p>
               <button onClick={() => setView('new')} className="mt-4 text-xs font-bold text-indigo-600 hover:underline">Write your first entry</button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {journals.map(entry => (
                <motion.div whileHover={{ y: -2 }} key={entry.id} className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm hover:shadow-lg transition-all">
                   <div className="flex justify-between items-start mb-4">
                     <h4 className="font-bold text-lg text-brand-charcoal">{entry.type} Reflection</h4>
                     <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 bg-slate-50 px-3 py-1 rounded-full">
                       {new Date(entry.createdAt).toLocaleDateString()}
                     </span>
                   </div>
                   <p className="text-sm text-slate-600 line-clamp-3 mb-4 leading-relaxed">{entry.content}</p>
                   {entry.challenges && entry.challenges.length > 0 && (
                     <div className="flex flex-wrap gap-2 mb-4">
                       {entry.challenges.map(tag => (
                         <span key={tag} className="text-[9px] font-black uppercase tracking-widest text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md">
                           {tag}
                         </span>
                       ))}
                     </div>
                   )}
                   <div className="pt-4 border-t border-slate-100 flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                     <span>Mood: {entry.mood}</span>
                     <span>{entry.reviewedByMentor ? 'Reviewed' : 'Pending Review'}</span>
                   </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm max-w-3xl">
          <div className="space-y-6">
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">Title</label>
              <input 
                type="text" 
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                placeholder="What's on your mind?"
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold text-brand-charcoal outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
              />
            </div>
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">Thoughts</label>
              <textarea 
                value={newContent}
                onChange={e => setNewContent(e.target.value)}
                placeholder="Write your entry here..."
                className="w-full bg-slate-50 border border-slate-200 rounded-3xl px-4 py-4 text-sm text-slate-700 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all min-h-[200px]"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">Mood</label>
                <select 
                  value={newMood} onChange={e => setNewMood(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-brand-charcoal outline-none focus:border-indigo-500"
                >
                  <option value="great">Great</option>
                  <option value="good">Good</option>
                  <option value="okay">Okay</option>
                  <option value="bad">Bad</option>
                  <option value="terrible">Terrible</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">Tags (comma separated)</label>
                <input 
                  type="text" 
                  value={newTags}
                  onChange={e => setNewTags(e.target.value)}
                  placeholder="e.g. career, reflection, interview"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-brand-charcoal outline-none focus:border-indigo-500"
                />
              </div>
            </div>
            <div className="pt-6">
              <button 
                onClick={handleSave}
                disabled={!newTitle.trim() || !newContent.trim()}
                className="btn-compact bg-brand-charcoal text-white hover:bg-black w-full"
              >
                Save Entry
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentJournal;
