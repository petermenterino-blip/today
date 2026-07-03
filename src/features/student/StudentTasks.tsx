import React, { useState } from 'react';
import { motion } from 'motion/react';
import { useTasks } from '../../hooks/useTasks';
import { 
  Plus, 
  CheckCircle2, 
  LayoutList,
  FileText,
  BookOpen,
  ClipboardList,
  Code2,
  Palette,
  CalendarDays,
  Briefcase,
  PlayCircle,
  Brain,
  Search,
  Presentation,
  Upload,
  Award,
  FolderOpen
} from 'lucide-react';
import TaskActivityForm from './TaskActivityForm';
import { notifySuccess, notifyError } from '../../utils/toast';

interface StudentTasksProps {
  studentId: string;
  isApproved?: boolean;
}

const getTaskIconConfig = (title: string, description: string) => {
  const t = title.toLowerCase();
  const d = description.toLowerCase();

  // 1. Resume / PDF / CV / Document
  if (t.includes('resume') || t.includes('pdf') || t.includes('cv') || t.includes('document') || d.includes('resume') || d.includes('pdf')) {
    return {
      Icon: FileText,
      bgColor: 'bg-[#EEF2FF]',
      iconColor: 'text-[#4F46E5]'
    };
  }

  // 2. Reading / Guide / Chapter
  if (t.includes('read') || t.includes('reading') || t.includes('guide') || t.includes('chapter') || t.includes('book') || t.includes('article') ||
      d.includes('read') || d.includes('reading') || d.includes('guide') || d.includes('chapter')) {
    return {
      Icon: BookOpen,
      bgColor: 'bg-[#FEF3C7]',
      iconColor: 'text-[#D97706]'
    };
  }

  // 3. Coding
  if (t.includes('code') || t.includes('coding') || t.includes('javascript') || t.includes('typescript') || t.includes('react') || t.includes('github') || t.includes('programming') ||
      d.includes('code') || d.includes('coding')) {
    return {
      Icon: Code2,
      bgColor: 'bg-[#D1FAE5]',
      iconColor: 'text-[#059669]'
    };
  }

  // 4. Design
  if (t.includes('design') || t.includes('figma') || t.includes('ui') || t.includes('ux') || t.includes('wireframe') || t.includes('palette') || t.includes('prototype') ||
      d.includes('design') || d.includes('figma') || d.includes('ui')) {
    return {
      Icon: Palette,
      bgColor: 'bg-[#FCE7F3]',
      iconColor: 'text-[#DB2777]'
    };
  }

  // 5. Meeting
  if (t.includes('meeting') || t.includes('meet') || t.includes('1on1') || t.includes('session') || t.includes('sync') || t.includes('calendar') ||
      d.includes('meeting') || d.includes('meet') || d.includes('session')) {
    return {
      Icon: CalendarDays,
      bgColor: 'bg-[#E0F2FE]',
      iconColor: 'text-[#0284C7]'
    };
  }

  // 6. Interview
  if (t.includes('interview') || t.includes('mock') || t.includes('behavioral') || t.includes('case study') || t.includes('job') ||
      d.includes('interview') || d.includes('mock')) {
    return {
      Icon: Briefcase,
      bgColor: 'bg-[#FFE4E6]',
      iconColor: 'text-[#E11D48]'
    };
  }

  // 7. Video Lesson
  if (t.includes('video') || t.includes('lesson') || t.includes('lecture') || t.includes('watch') || t.includes('course') ||
      d.includes('video') || d.includes('lesson')) {
    return {
      Icon: PlayCircle,
      bgColor: 'bg-[#FEE2E2]',
      iconColor: 'text-[#DC2626]'
    };
  }

  // 8. Quiz
  if (t.includes('quiz') || t.includes('test') || t.includes('exam') || t.includes('assessment') || t.includes('brain') ||
      d.includes('quiz') || d.includes('test')) {
    return {
      Icon: Brain,
      bgColor: 'bg-[#F3E8FF]',
      iconColor: 'text-[#9333EA]'
    };
  }

  // 9. Research
  if (t.includes('research') || t.includes('search') || t.includes('find') || t.includes('explore') || t.includes('market') ||
      d.includes('research') || d.includes('explore')) {
    return {
      Icon: Search,
      bgColor: 'bg-[#CCFBF1]',
      iconColor: 'text-[#0D9488]'
    };
  }

  // 10. Presentation
  if (t.includes('presentation') || t.includes('slide') || t.includes('deck') || t.includes('ppt') ||
      d.includes('presentation') || d.includes('slide')) {
    return {
      Icon: Presentation,
      bgColor: 'bg-[#FFEDD5]',
      iconColor: 'text-[#EA580C]'
    };
  }

  // 11. Upload
  if (t.includes('upload') || t.includes('import') || t.includes('share') ||
      d.includes('upload')) {
    return {
      Icon: Upload,
      bgColor: 'bg-[#F1F5F9]',
      iconColor: 'text-[#475569]'
    };
  }

  // 12. Certificate
  if (t.includes('certificate') || t.includes('certification') || t.includes('award') || t.includes('badge') ||
      d.includes('certificate') || d.includes('certification')) {
    return {
      Icon: Award,
      bgColor: 'bg-[#FEF3C7]',
      iconColor: 'text-[#D97706]'
    };
  }

  // 13. Portfolio
  if (t.includes('portfolio') || t.includes('website') || t.includes('folder') || t.includes('projects') ||
      d.includes('portfolio')) {
    return {
      Icon: FolderOpen,
      bgColor: 'bg-[#DBEAFE]',
      iconColor: 'text-[#2563EB]'
    };
  }

  // 14. Assignment (Fallback/General task keywords like submit, assignment, task, homework)
  if (t.includes('assignment') || t.includes('homework') || t.includes('task') || t.includes('deliverable') || t.includes('submit') ||
      d.includes('assignment') || d.includes('homework') || d.includes('task')) {
    return {
      Icon: ClipboardList,
      bgColor: 'bg-[#F3E8FF]',
      iconColor: 'text-[#7C3AED]'
    };
  }

  // Default Fallback
  return {
    Icon: ClipboardList,
    bgColor: 'bg-[#F1F5F9]',
    iconColor: 'text-[#475569]'
  };
};

const StudentTasks: React.FC<StudentTasksProps> = ({ studentId, isApproved }) => {
  const { taskActivities, addTask, updateTask, loading } = useTasks();
  const [view, setView] = useState<'list' | 'new'>(isApproved ? 'list' : 'list');
  const [showSecondApp, setShowSecondApp] = useState(isApproved);

  const userTasks = taskActivities.filter(t => t.user_id === studentId);
  const pendingTasks = userTasks.filter(t => t.status !== 'completed');
  const completedTasks = userTasks.filter(t => t.status === 'completed');

  const handleTaskSubmit = async (activity: any) => {
    try {
      await addTask({
        user_id: studentId,
        mentor_id: 'mentor-1',
        user_name: 'Student',
        task_title: activity.task_name || 'New Task',
        description: activity.activity_type,
        status: 'pending',
        due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      });
      notifySuccess('Task submitted successfully!');
      setView('list');
    } catch (err: any) {
      notifyError('Failed to submit task');
    }
  };

  const handleSecondAppSubmit = async (data: any) => {
    try {
      await addTask({
        user_id: studentId,
        mentor_id: 'mentor-1',
        user_name: 'Student',
        task_title: '2nd Application Submission',
        description: JSON.stringify(data),
        status: 'submitted',
        due_date: new Date().toISOString()
      });
      notifySuccess('2nd application submitted for audit!');
      setShowSecondApp(false);
    } catch (err: any) {
      notifyError('Failed to submit 2nd application');
    }
  };

  const markCompleted = (id: string) => {
    updateTask(id, { status: 'completed' });
  };

  return (
    <div className="space-y-8">
      {isApproved && showSecondApp && (
        <div className="bg-amber-50 border border-amber-200 rounded-[32px] p-6 md:p-8 mb-2">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-amber-500 text-white rounded-xl flex items-center justify-center font-black text-sm shadow-sm">
              2
            </div>
            <div>
              <h3 className="text-lg font-black uppercase tracking-tighter text-amber-900">Second Application</h3>
              <p className="text-[9px] text-amber-600 font-bold uppercase tracking-widest">Complete your profile for audit</p>
            </div>
          </div>
          <TaskActivityForm onSubmit={handleSecondAppSubmit} userName="Student" />
        </div>
      )}

      <div className="space-y-6">
        <div className="flex justify-between items-end mb-6">
          <h3 className="text-2xl font-black uppercase tracking-tighter text-brand-charcoal">Active Tasks</h3>
          {view === 'list' ? (
            <button onClick={() => setView('new')} className="btn-compact bg-brand-charcoal text-white hover:bg-black transition-colors shadow-md flex items-center gap-2">
              <Plus size={16} /> New Activity
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
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               {pendingTasks.map((task, i) => {
                   const { Icon, bgColor, iconColor } = getTaskIconConfig(task.task_title || task.description || '', task.description || '');
                   return (
                     <motion.div 
                        key={task.id} 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="bg-white p-6 rounded-[32px] border border-slate-100 space-y-4 hover:shadow-lg transition-all group relative overflow-hidden"
                     >
                        <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50 rounded-bl-[40px] -mr-4 -mt-4 transition-transform duration-500 group-hover:scale-110 pointer-events-none"></div>
                        <div className="relative z-10 flex justify-between items-start">
                          <div className={`w-14 h-14 ${bgColor} rounded-full flex items-center justify-center shadow-sm shrink-0`}>
                            <Icon size={24} className={iconColor} />
                          </div>
                        </div>
                        <div className="relative z-10">
                          <h4 className="font-bold text-lg text-brand-charcoal mb-1">{task.task_title}</h4>
                          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-relaxed line-clamp-2">{task.description}</p>
                        </div>
                        <div className="relative z-10 pt-4 flex justify-between items-center border-t border-slate-100 text-[10px] uppercase font-bold tracking-widest text-slate-400">
                          <span>Due: {task.due_date ? new Date(task.due_date).toLocaleDateString() : 'No due date'}</span>
                          <button onClick={() => markCompleted(task.id)} className="text-emerald-600 hover:brightness-75 transition-all flex items-center gap-1">
                             <CheckCircle2 size={14} /> Finish
                          </button>
                        </div>
                     </motion.div>
                  );
               })}
               {pendingTasks.length === 0 && (
                 <div className="py-16 text-center border-2 border-dashed border-slate-200 rounded-[32px] bg-slate-50 mt-4 md:col-span-2">
                   <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300 shadow-sm">
                     <LayoutList size={24} />
                   </div>
                   <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">No active tasks. You're all caught up!</p>
                 </div>
               )}
             </div>
          </div>
        ) : (
          <div className="max-w-3xl">
            <TaskActivityForm onSubmit={handleTaskSubmit} userName="Student" />
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentTasks;
