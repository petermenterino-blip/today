import React from 'react';
import { CheckCircle2, X } from 'lucide-react';
import type { TaskActivity } from '../../../types';

interface TasksTabProps {
  pendingTasks: TaskActivity[];
  selectedTask: TaskActivity | null;
  setSelectedTask: (v: TaskActivity | null) => void;
  feedbackResponse: string;
  setFeedbackResponse: (v: string) => void;
  handleReviewTask: (task: TaskActivity) => void;
  submitFeedback: () => void;
}

export const TasksTab: React.FC<TasksTabProps> = ({
  pendingTasks,
  selectedTask,
  setSelectedTask,
  feedbackResponse,
  setFeedbackResponse,
  handleReviewTask,
  submitFeedback,
}) => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-black uppercase tracking-tighter text-brand-charcoal">Pending Reviews</h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {pendingTasks.map((task, i) => (
          <div key={`${task.id || i}_${i}`} className="relative overflow-hidden bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm flex flex-col hover:shadow-xl transition-all duration-300 group">
            <div className="absolute left-0 top-0 w-2 h-full bg-amber-500"></div>
            <p className="text-sm font-bold text-brand-charcoal pl-2 truncate">New submission from {task.user_name}</p>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-2 pl-2">{new Date(task.created_at).toLocaleDateString()}</p>
            <button onClick={() => handleReviewTask(task)} className="mt-4 px-4 py-3 bg-brand-charcoal text-white rounded-full text-[9px] font-black uppercase tracking-widest hover:bg-amber-500 transition-colors w-full shadow-md z-10 relative">Review Now</button>
          </div>
        ))}
        {pendingTasks.length === 0 && (
          <div className="py-16 text-center border-2 border-dashed border-slate-200 rounded-[32px] bg-slate-50 w-full col-span-full">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300 shadow-sm">
              <CheckCircle2 size={24} />
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">All caught up. No pending reviews.</p>
          </div>
        )}
      </div>

      {selectedTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-[40px] max-w-2xl w-full p-8 max-h-[90vh] overflow-y-auto relative">
            <button onClick={() => setSelectedTask(null)} className="absolute top-6 right-6 w-8 h-8 flex items-center justify-center bg-slate-100 rounded-full hover:bg-slate-200">
              <X size={16} />
            </button>
            <h3 className="text-2xl font-black uppercase tracking-tighter mb-6">Review Submission</h3>
            <div className="space-y-4 mb-6 p-4 bg-slate-50 rounded-2xl text-sm">
              {Object.entries(selectedTask).filter(([k, v]) => k !== 'id' && k !== 'user_id' && k !== 'status' && v).map(([key, value]) => (
                <div key={key}>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{key.replace(/_/g, ' ')}</p>
                  <p className="font-medium mt-1">{value as React.ReactNode}</p>
                </div>
              ))}
            </div>
            <textarea
              value={feedbackResponse}
              onChange={e => setFeedbackResponse(e.target.value)}
              placeholder="Enter your feedback for the student..."
              className="w-full p-6 bg-slate-50 border border-slate-100 rounded-[32px] min-h-[150px] outline-none focus:border-black"
            ></textarea>
            <button onClick={submitFeedback} className="w-full mt-4 py-4 bg-black text-white rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-slate-900 transition-colors">Submit Feedback</button>
          </div>
        </div>
      )}
    </div>
  );
};
