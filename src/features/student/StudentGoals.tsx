import React, { useState } from 'react';
import { motion } from 'motion/react';
import { useGoals } from '../../hooks/useGoals';
import { Target, Plus, CheckCircle2, ChevronDown, ChevronUp, Trash2 } from 'lucide-react';
import { Goal } from '../../interfaces';
import { notifySuccess, notifyError } from '../../utils/toast';

interface StudentGoalsProps {
  studentId: string;
}

const StudentGoals: React.FC<StudentGoalsProps> = ({ studentId }) => {
  const { goals, addGoal, updateGoal, deleteGoal, loading } = useGoals(studentId);
  const [view, setView] = useState<'list' | 'new'>('list');
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newDeadline, setNewDeadline] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [goalToDelete, setGoalToDelete] = useState<Goal | null>(null);

  const handleSave = () => {
    if (!newTitle.trim()) return;
    addGoal({
      studentId,
      title: newTitle,
      description: newDesc,
      status: 'not_started',
      progressPercentage: 0,
      milestones: [],
      targetDate: newDeadline || undefined
    });
    setNewTitle('');
    setNewDesc('');
    setNewDeadline('');
    setView('list');
  };

  const handleDeleteConfirm = () => {
    if (!goalToDelete) return;
    if (goalToDelete.studentId !== studentId) {
      notifyError("You can delete only your own completed goals.");
      setShowConfirmModal(false);
      setGoalToDelete(null);
      return;
    }

    try {
      const success = deleteGoal(goalToDelete.id);
      if (success) {
        notifySuccess("Goal deleted successfully.");
      } else {
        notifyError("Failed to delete goal.");
      }
    } catch (error) {
      notifyError("An error occurred while deleting the goal.");
    }
    setShowConfirmModal(false);
    setGoalToDelete(null);
  };

  const activeGoals = goals.filter(g => g.status !== 'completed');
  const pastGoals = goals.filter(g => g.status === 'completed');

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end mb-6">
        <h3 className="text-2xl font-black uppercase tracking-tighter text-brand-charcoal">Your Goals</h3>
        {view === 'list' ? (
          <button onClick={() => setView('new')} className="btn-compact bg-brand-charcoal text-white hover:bg-black transition-colors shadow-md flex items-center gap-2">
            <Plus size={16} /> New Goal
          </button>
        ) : (
          <button onClick={() => setView('list')} className="btn-compact bg-slate-100 text-slate-600 hover:bg-slate-200">
            Back
          </button>
        )}
      </div>

      {loading ? (
        <div className="py-12 flex justify-center"><div className="w-8 h-8 border-2 border-slate-900 border-t-transparent rounded-full animate-spin"></div></div>
      ) : view === 'list' ? (
        <div className="space-y-8">
           <div className="bg-white rounded-[32px] border border-slate-100 divide-y divide-slate-100 shadow-sm overflow-hidden">
             {activeGoals.length > 0 ? activeGoals.map((goal, i) => (
               <motion.div 
                 key={goal.id} 
                 initial={{ opacity: 0, y: 10 }}
                 animate={{ opacity: 1, y: 0 }}
                 transition={{ delay: i * 0.05 }}
                 className="p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between hover:bg-slate-50/50 transition-colors group gap-4"
               >
                 <div className="flex items-center gap-4 w-full sm:w-auto">
                   <button 
                     onClick={() => updateGoal(goal.id, { status: 'completed' })}
                     className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all bg-transparent group-hover:border-emerald-500 border-slate-200`}
                   >
                     <div className="w-3 h-3 rounded-full bg-transparent group-hover:bg-emerald-500 transition-colors"></div>
                   </button>
                   <div>
                     <p className="font-bold text-sm text-brand-charcoal">{goal.title}</p>
                     {goal.targetDate && (
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Due: {new Date(goal.targetDate).toLocaleDateString()}</p>
                     )}
                   </div>
                 </div>
                 <div className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest shadow-sm ${
                   goal.status === 'in_progress' ? 'bg-amber-50 text-amber-600 border border-amber-100' : 'bg-slate-50 text-slate-500 border border-slate-100'
                 }`}>
                   {goal.status.replace('_', ' ')}
                 </div>
               </motion.div>
             )) : (
                <div className="py-12 text-center text-[10px] font-black uppercase tracking-widest text-slate-400">No active goals</div>
             )}
           </div>

           {pastGoals.length > 0 && (
             <div>
               <h4 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-4 px-4">Completed Goals</h4>
               <div className="bg-slate-50 rounded-[32px] border border-slate-100 divide-y divide-slate-100 shadow-sm overflow-hidden">
                 {pastGoals.map((goal) => (
                   <div key={goal.id} className="p-4 flex items-center justify-between group hover:bg-slate-100/40 transition-colors">
                     <div className="flex items-center gap-4 opacity-70">
                       <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-md">
                         <CheckCircle2 size={16} />
                       </div>
                       <p className="font-bold text-sm text-slate-500 line-through">{goal.title}</p>
                     </div>
                     <button
                       onClick={() => {
                         setGoalToDelete(goal);
                         setShowConfirmModal(true);
                       }}
                       className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all duration-200 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 focus:outline-none animate-in fade-in"
                       aria-label="Delete Goal"
                     >
                       <Trash2 size={16} />
                     </button>
                   </div>
                 ))}
               </div>
             </div>
           )}
        </div>
      ) : (
        <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm max-w-xl">
          <div className="space-y-6">
             <div>
               <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">Goal Title</label>
               <input type="text" value={newTitle} onChange={e => setNewTitle(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold outline-none focus:border-indigo-500" placeholder="e.g. Redo Portfolio" />
             </div>
             <div>
               <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">Description</label>
               <textarea value={newDesc} onChange={e => setNewDesc(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm outline-none focus:border-indigo-500 min-h-[100px]" placeholder="Briefly describe what success looks like." />
             </div>
             <div>
               <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">Target Date</label>
               <input type="date" value={newDeadline} onChange={e => setNewDeadline(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold text-slate-600 outline-none focus:border-indigo-500" />
             </div>
             <button onClick={handleSave} disabled={!newTitle.trim()} className="btn-compact bg-black text-white w-full hover:bg-slate-900">Save Goal</button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 flex flex-col shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-200">
            <h4 className="text-xl font-black text-brand-charcoal mb-2">Delete Goal?</h4>
            <p className="text-slate-500 text-sm mb-6">
              Are you sure you want to permanently remove this completed goal? This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button 
                onClick={() => {
                  setShowConfirmModal(false);
                  setGoalToDelete(null);
                }}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-sm transition-all focus:outline-none"
              >
                Cancel
              </button>
              <button 
                onClick={handleDeleteConfirm}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 active:scale-95 transition-all text-white font-bold rounded-xl text-sm flex items-center gap-1 focus:outline-none shadow-md shadow-rose-600/20"
              >
                Delete Goal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentGoals;
