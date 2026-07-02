import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search, Users, Settings, MessageSquare, ChevronRight, ArrowLeft,
  Activity, TrendingUp, Video, Globe, CalendarDays, ClipboardList,
  Plus, CheckCircle2, XCircle, Clock, X, FileSearch, MoreVertical,
  Trash, FileText, Zap, ExternalLink, Layout, Tag, History, File,
  CheckCircle, Sparkles as SparkleIcon
} from 'lucide-react';
import { tagService } from '../../../services/tagService';
import { notifySuccess } from '../../../utils/toast';
import type { StudentTag, TaskActivity, StudentProfile } from '../../../types';

interface MenteesTabProps {
  selectedMenteeId: string | null;
  setSelectedMenteeId: (id: string | null) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  isAddingTag: boolean;
  setIsAddingTag: (v: boolean) => void;
  allTags: StudentTag[];
  setAllTags: React.Dispatch<React.SetStateAction<StudentTag[]>>;
  mentees: any[];
  filteredMentees: any[];
  studentProfiles: StudentProfile[];
  taskActivities: TaskActivity[];
  sessions: any[];
  newTaskTitle: string;
  setNewTaskTitle: (v: string) => void;
  newTaskPriority: string;
  setNewTaskPriority: (v: 'low' | 'medium' | 'high') => void;
  newTaskDueDate: string;
  setNewTaskDueDate: (v: string) => void;
  menteeNotes: string;
  setMenteeNotes: (v: string) => void;
  isSavingNotes: boolean;
  menteeSubTab: string;
  setMenteeSubTab: (v: 'dashboard' | 'tasks' | 'tags' | 'forms' | 'history' | 'files' | 'sessions') => void;
  selectedTask: TaskActivity | null;
  setSelectedTask: (v: TaskActivity | null) => void;
  newTagLabel: string;
  setNewTagLabel: (v: string) => void;
  newTagColor: string;
  setNewTagColor: (v: string) => void;
  handleMessageStudent: (userId: string, name: string) => void;
  handleUpdateNotes: () => void;
  toggleMenteeTag: (userId: string, tagId: string) => void;
  handleAddTag: () => void;
  addTask: (task: any) => Promise<any>;
  handleScheduleSession: (userId: string) => void;
  setActiveTab: (tab: string) => void;
  setIsSchedulingSession: (v: boolean) => void;
}

const menteeSubTabs = [
  { id: 'dashboard', label: 'Dashboard', icon: Layout },
  { id: 'tasks', label: 'Tasks', icon: ClipboardList },
  { id: 'tags', label: 'Organization', icon: Tag },
  { id: 'forms', label: 'Custom Forms', icon: FileText },
  { id: 'files', label: 'Shared Files', icon: File },
  { id: 'sessions', label: 'Sessions', icon: Video },
  { id: 'history', label: 'Growth Log', icon: History },
];

export const MenteesTab: React.FC<MenteesTabProps> = ({
  selectedMenteeId, setSelectedMenteeId,
  searchQuery, setSearchQuery,
  isAddingTag, setIsAddingTag,
  allTags, setAllTags,
  mentees, filteredMentees,
  studentProfiles, taskActivities, sessions,
  newTaskTitle, setNewTaskTitle,
  newTaskPriority, setNewTaskPriority,
  newTaskDueDate, setNewTaskDueDate,
  menteeNotes, setMenteeNotes,
  isSavingNotes,
  menteeSubTab, setMenteeSubTab,
  selectedTask, setSelectedTask,
  newTagLabel, setNewTagLabel,
  newTagColor, setNewTagColor,
  handleMessageStudent,
  handleUpdateNotes,
  toggleMenteeTag,
  handleAddTag,
  addTask,
  handleScheduleSession,
  setActiveTab,
  setIsSchedulingSession,
}) => {
  return (
    <div className="space-y-6">
      {!selectedMenteeId ? (
        <>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <h3 className="text-xl font-black uppercase tracking-tighter">Student CRM</h3>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Manage your active mentees</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative flex-1 md:w-64">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  type="text"
                  placeholder="Search students..."
                  className="w-full pl-10 pr-4 py-2 bg-white border border-slate-100 rounded-full text-xs font-medium outline-none focus:border-black transition-all shadow-sm"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
              </div>
              <button
                onClick={() => setIsAddingTag(true)}
                className="p-2.5 bg-white border border-slate-100 text-slate-400 rounded-full hover:text-black transition-colors shadow-sm"
                title="Manage Tags"
              >
                <Settings size={18} />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {filteredMentees.map((mentee, idx) => {
              const profile = studentProfiles.find(p => p.user_id === mentee.user_id);
              const menteeTags = allTags.filter(t => profile?.tags?.includes(t.id));

              return (
                <div
                  key={`${mentee.id || mentee.user_id || idx}_${idx}`}
                  onClick={() => setSelectedMenteeId(mentee.user_id)}
                  className="bg-white p-6 rounded-[32px] border border-slate-100 flex flex-col gap-4 cursor-pointer hover:shadow-xl hover:shadow-black/5 transition-all duration-300 relative overflow-hidden group"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black uppercase shadow-sm ${
                      profile?.healthStatus === 'at_risk' ? 'bg-rose-100 text-rose-700' :
                      profile?.healthStatus === 'needs_attention' ? 'bg-amber-100 text-amber-700' :
                      'bg-emerald-100 text-emerald-700'
                    }`}>
                      {mentee.full_name.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold group-hover:text-indigo-600 transition-colors">{mentee.full_name}</p>
                        {profile?.growth_score && (
                          <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-lg text-[8px] font-black uppercase tracking-widest">
                            Score: {profile.growth_score}
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{mentee.focus_area || 'Standard Program'}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMessageStudent(mentee.user_id, mentee.full_name);
                        }}
                        className="p-2 bg-white border border-slate-100 rounded-full text-slate-400 hover:text-indigo-600 transition-all duration-300 opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0 shadow-sm"
                        title="Quick Message"
                      >
                        <MessageSquare size={14} />
                      </button>
                      <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0">
                        <ChevronRight size={16} className="text-slate-400" />
                      </div>
                    </div>
                  </div>

                  {menteeTags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {menteeTags.map(tag => (
                        <span
                          key={tag.id}
                          className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest ${tag.color}`}
                        >
                          {tag.label}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="absolute bottom-0 right-0 w-16 h-16 bg-slate-50 rounded-tl-[40px] -mr-8 -mb-8 transition-transform duration-500 group-hover:scale-110 pointer-events-none"></div>
                </div>
              );
            })}
            {filteredMentees.length === 0 && (
              <div className="col-span-full py-16 text-center bg-slate-50 border-2 border-dashed border-slate-200 rounded-[32px]">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300 shadow-sm">
                  <Users size={24} />
                </div>
                <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">No students found matching your criteria.</p>
                <button onClick={() => setSearchQuery('')} className="mt-4 text-[10px] font-black uppercase tracking-widest text-indigo-600 hover:underline">Clear Search</button>
              </div>
            )}
          </div>
        </>
      ) : (
        (() => {
          const mentee = mentees.find(m => m.user_id === selectedMenteeId);
          if (!mentee) return null;

          const profile = studentProfiles.find(p => p.user_id === mentee.user_id);
          const menteeTasks = taskActivities.filter(t => t.user_id === mentee.user_id);
          const completedTasks = menteeTasks.filter(t => t.status === 'approved').length;
          const progress = menteeTasks.length > 0 ? Math.round((completedTasks / menteeTasks.length) * 100) : 0;
          const menteeTags = allTags.filter(t => profile?.tags?.includes(t.id));

          const handleAddTask = async () => {
            if (!newTaskTitle.trim()) return;
            await addTask({
              user_id: mentee.user_id,
              user_name: mentee.full_name,
              program_id: mentee.program_id,
              task_title: newTaskTitle,
              status: 'pending',
              priority: newTaskPriority,
              due_date: newTaskDueDate,
            });
            setNewTaskTitle('');
            setNewTaskDueDate('');
            notifySuccess('Task assigned successfully');
          };

          return (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setSelectedMenteeId(null)}
                  className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400 hover:text-black transition-colors group"
                >
                  <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" /> Back to Student CRM
                </button>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleMessageStudent(mentee.user_id, mentee.full_name)}
                    className="p-2 bg-white border border-slate-100 rounded-full text-slate-400 hover:text-indigo-600 transition-colors shadow-sm"
                    title="Message Student"
                  >
                    <MessageSquare size={16} />
                  </button>
                </div>
              </div>

              {/* Mentee Profile Header */}
              <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-slate-50 rounded-bl-[100px] -mr-10 -mt-10 opacity-50 pointer-events-none"></div>

                <div className="flex flex-col lg:flex-row gap-8 relative z-10">
                  <div className="flex-1 space-y-6">
                    <div className="flex flex-col md:flex-row md:items-center gap-6">
                      <div className="w-24 h-24 bg-emerald-100 text-emerald-700 rounded-[32px] flex items-center justify-center text-4xl font-black uppercase shadow-inner">
                        {mentee.full_name.charAt(0)}
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <h2 className="text-4xl font-black tracking-tight">{mentee.full_name}</h2>
                          <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1 border border-emerald-100/50">
                            <Activity size={10} className="animate-pulse" /> Active
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">{mentee.focus_area || 'Standard Mentorship'}</p>
                          <div className="w-1 h-1 bg-slate-200 rounded-full"></div>
                          <p className="text-xs font-bold text-slate-400">{mentee.user_email}</p>
                        </div>

                        <div className="flex flex-wrap gap-1.5 mt-4">
                          {menteeTags.map(tag => (
                            <span key={tag.id} className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${tag.color}`}>
                              {tag.label}
                            </span>
                          ))}
                          {menteeTags.length === 0 && (
                            <button
                              onClick={() => setMenteeSubTab('tags')}
                              className="px-2.5 py-1 border border-dashed border-slate-200 text-slate-400 rounded-full text-[9px] font-black uppercase tracking-widest hover:border-slate-400 hover:text-slate-600 transition-all"
                            >
                              + Add Category Tags
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Growth Stats */}
                  <div className="w-full lg:w-80 bg-slate-50 p-6 rounded-[32px] border border-slate-100 grid grid-cols-2 gap-6 items-center">
                    <div className="space-y-1">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Growth Score</p>
                      <p className="text-4xl font-black text-indigo-600">{profile?.growth_score || 75}</p>
                      <div className="flex items-center gap-1 text-emerald-500 font-bold text-[10px]">
                        <TrendingUp size={10} /> +5% this week
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between items-end mb-1">
                          <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Goal Completion</p>
                          <p className="text-xs font-black">{progress}%</p>
                        </div>
                        <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${progress}%` }}></div>
                        </div>
                      </div>
                      <div className="flex justify-between">
                        <div>
                          <p className="text-lg font-black">{menteeTasks.length}</p>
                          <p className="text-[8px] font-black uppercase tracking-widest text-slate-400">Total Tasks</p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-black text-indigo-600">{menteeTasks.filter(t => t.status === 'pending').length}</p>
                          <p className="text-[8px] font-black uppercase tracking-widest text-slate-400">Pending</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Mentee Dashboard Sub-Tabs */}
              <div className="flex items-center gap-1 bg-slate-100/50 p-1 rounded-2xl overflow-x-auto scrollbar-hide border border-slate-100">
                {menteeSubTabs.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setMenteeSubTab(tab.id as any)}
                    className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 whitespace-nowrap transition-all ${
                      menteeSubTab === tab.id
                      ? 'bg-white text-black shadow-sm border border-slate-100'
                      : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <tab.icon size={14} />
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Sub-Tab Content */}
              <div className="min-h-[400px]">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={menteeSubTab}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    {/* DASHBOARD SUBTAB */}
                    {menteeSubTab === 'dashboard' && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm space-y-6">
                          <div>
                            <h3 className="text-lg font-black uppercase tracking-tighter mb-4">Statement of Intent</h3>
                            <div className="p-6 bg-slate-50 rounded-[32px] border border-slate-100 italic text-slate-600 text-sm leading-relaxed">
                              &ldquo;{mentee.goal}&rdquo;
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100/50">
                              <p className="text-[9px] font-black uppercase tracking-widest text-indigo-400 mb-1">Top Strength</p>
                              <p className="text-sm font-bold text-indigo-900">Rapid Learning</p>
                            </div>
                            <div className="p-4 bg-amber-50/50 rounded-2xl border border-amber-100/50">
                              <p className="text-[9px] font-black uppercase tracking-widest text-amber-400 mb-1">Needs Focus</p>
                              <p className="text-sm font-bold text-amber-900">Networking</p>
                            </div>
                          </div>

                          <div className="pt-6 border-t border-slate-100">
                            <div className="flex items-center justify-between mb-4">
                              <h3 className="text-lg font-black uppercase tracking-tighter">Summary Notes</h3>
                              <button
                                onClick={handleUpdateNotes}
                                disabled={isSavingNotes}
                                className="px-4 py-1.5 bg-black text-white rounded-full text-[9px] font-black uppercase tracking-widest hover:bg-slate-800 disabled:opacity-50 transition-all shadow-sm"
                              >
                                {isSavingNotes ? 'Saving...' : 'Save Notes'}
                              </button>
                            </div>
                            <textarea
                              value={menteeNotes}
                              onChange={e => setMenteeNotes(e.target.value)}
                              placeholder="Write private notes about this student's progress, strengths, and areas for improvement..."
                              className="w-full h-40 p-5 bg-slate-50 border border-slate-100 rounded-3xl text-sm font-medium outline-none focus:bg-white focus:border-indigo-500 transition-all resize-none custom-scrollbar"
                            />
                          </div>
                        </div>

                        <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm space-y-6">
                          <h3 className="text-lg font-black uppercase tracking-tighter">Recent Growth Activity</h3>
                          <div className="space-y-4">
                            {[
                              { event: 'Session Completed', time: 'Yesterday', icon: Video, color: 'text-emerald-500' },
                              { event: 'Responded to Task', time: '2 days ago', icon: CheckCircle, color: 'text-indigo-500' },
                              { event: 'Portfolio Updated', time: '4 days ago', icon: Globe, color: 'text-blue-500' },
                            ].map((activity, i) => (
                              <div key={i} className="flex items-center justify-between p-4 hover:bg-slate-50 rounded-2xl transition-colors">
                                <div className="flex items-center gap-4">
                                  <div className={`w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center ${activity.color}`}>
                                    <activity.icon size={18} />
                                  </div>
                                  <div>
                                    <p className="text-sm font-bold">{activity.event}</p>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{activity.time}</p>
                                  </div>
                                </div>
                                <ChevronRight size={14} className="text-slate-200" />
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* TASKS SUBTAB */}
                    {menteeSubTab === 'tasks' && (
                      <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm space-y-6">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                          <div>
                            <h3 className="text-xl font-black uppercase tracking-tighter">Task Management</h3>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Assign structured objectives</p>
                          </div>
                          <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                            <input
                              type="text"
                              placeholder="Task title..."
                              className="px-5 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-medium outline-none focus:border-indigo-500 transition-all md:w-64"
                              value={newTaskTitle}
                              onChange={e => setNewTaskTitle(e.target.value)}
                            />
                            <select
                              className="px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-[10px] font-black uppercase tracking-widest outline-none focus:border-indigo-500"
                              value={newTaskPriority}
                              onChange={e => setNewTaskPriority(e.target.value as any)}
                            >
                              <option value="low">Low</option>
                              <option value="medium">Medium</option>
                              <option value="high">High</option>
                            </select>
                            <button
                              onClick={handleAddTask}
                              disabled={!newTaskTitle.trim()}
                              className="px-6 py-3 bg-black text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-slate-900 transition-all shadow-lg shadow-black/10 flex items-center justify-center gap-2"
                            >
                              <Plus size={14} /> Assign
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 gap-4">
                          {menteeTasks.map(task => (
                            <div key={task.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-5 bg-slate-50 border border-slate-100 rounded-[24px] gap-4 group hover:bg-white hover:shadow-xl hover:shadow-black/5 transition-all">
                              <div className="flex items-center gap-5">
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                                  task.status === 'approved' ? 'bg-emerald-100 text-emerald-600' :
                                  task.status === 'rejected' ? 'bg-rose-100 text-rose-600' :
                                  'bg-amber-100 text-amber-600'
                                }`}>
                                  {task.status === 'approved' ? <CheckCircle2 size={20} /> :
                                   task.status === 'rejected' ? <XCircle size={20} /> :
                                   <Clock size={20} />}
                                </div>
                                <div>
                                  <p className="font-bold text-slate-900">{task.task_title}</p>
                                  <div className="flex items-center gap-3 mt-1">
                                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1">
                                      <CalendarDays size={10} /> {new Date(task.created_at).toLocaleDateString()}
                                    </p>
                                    {task.priority && (
                                      <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${
                                        task.priority === 'high' ? 'bg-rose-50 text-rose-500' :
                                        task.priority === 'medium' ? 'bg-amber-50 text-amber-500' :
                                        'bg-slate-100 text-slate-500'
                                      }`}>
                                        {task.priority}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className={`px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-widest ${
                                  task.status === 'approved' ? 'bg-emerald-50 text-emerald-600' :
                                  task.status === 'rejected' ? 'bg-rose-50 text-rose-600' :
                                  'bg-amber-50 text-amber-600'
                                }`}>
                                  {task.status === 'pending' ? 'Review Submission' : task.status}
                                </span>
                                {task.status === 'pending' && (
                                  <button
                                    onClick={() => { setSelectedTask(task); setActiveTab('feedback'); }}
                                    className="px-6 py-2 bg-indigo-600 text-white rounded-full text-[9px] font-black uppercase tracking-widest hover:bg-indigo-700 shadow-lg shadow-indigo-500/20"
                                  >
                                    Evaluate
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                          {menteeTasks.length === 0 && (
                            <div className="py-20 text-center bg-slate-50 border border-dashed border-slate-200 rounded-[32px]">
                              <ClipboardList size={32} className="mx-auto text-slate-200 mb-4" />
                              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">No tasks have been assigned to this student yet.</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* TAGS/ORGANIZATION SUBTAB */}
                    {menteeSubTab === 'tags' && (
                      <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm space-y-8">
                        <div>
                          <h3 className="text-xl font-black uppercase tracking-tighter">Student Organization</h3>
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Categorize students with custom workflow tags</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          <div className="space-y-4">
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100 pb-2">Active Categories</p>
                            <div className="flex flex-wrap gap-2">
                              {menteeTags.map(tag => (
                                <button
                                  key={tag.id}
                                  onClick={() => toggleMenteeTag(mentee.user_id, tag.id)}
                                  className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all ${tag.color} shadow-sm border border-black/5 hover:scale-105`}
                                >
                                  {tag.label} <X size={10} />
                                </button>
                              ))}
                              {menteeTags.length === 0 && (
                                <p className="text-xs text-slate-400 italic">No tags assigned. Select from the library on the right.</p>
                              )}
                            </div>
                          </div>

                          <div className="space-y-4 p-6 bg-slate-50 rounded-[32px] border border-slate-100">
                            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Tag Library</p>
                              <button onClick={() => setIsAddingTag(true)} className="text-[9px] font-black uppercase tracking-widest text-indigo-600 hover:underline">Manage All</button>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {allTags.filter(t => !profile?.tags?.includes(t.id)).map(tag => (
                                <button
                                  key={tag.id}
                                  onClick={() => toggleMenteeTag(mentee.user_id, tag.id)}
                                  className="px-4 py-2 bg-white border border-slate-100 rounded-full text-[10px] font-black uppercase tracking-widest text-slate-500 hover:border-black hover:text-black transition-all shadow-sm"
                                >
                                  + {tag.label}
                                </button>
                              ))}
                              {allTags.length === 0 && (
                                <div className="w-full text-center py-4">
                                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">You haven't created any tags yet.</p>
                                  <button
                                    onClick={() => setIsAddingTag(true)}
                                    className="px-6 py-2 bg-indigo-600 text-white rounded-full text-[9px] font-black uppercase tracking-widest hover:bg-indigo-700"
                                  >
                                    Create First Tag
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* FILES SUBTAB */}
                    {menteeSubTab === 'files' && (
                      <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm space-y-8">
                        <div className="flex justify-between items-center">
                          <div>
                            <h3 className="text-xl font-black uppercase tracking-tighter">Shared Assets</h3>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Direct file sharing vault</p>
                          </div>
                          <button className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/20">
                            <Plus size={14} /> Upload to Vault
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                          {[
                            { name: 'Roadmap_Final.pdf', type: 'PDF', size: '2.4 MB', date: 'Oct 12' },
                            { name: 'Resume_Review.docx', type: 'DOC', size: '1.1 MB', date: 'Oct 05' },
                            { name: 'Portfolio_Inspiration.png', type: 'IMG', size: '4.8 MB', date: 'Sep 28' },
                          ].map((file, i) => (
                            <div key={i} className="p-5 bg-slate-50 border border-slate-100 rounded-[24px] group hover:bg-indigo-50/30 hover:border-indigo-100 transition-all">
                              <div className="flex items-start justify-between mb-4">
                                <div className="p-3 bg-white rounded-xl shadow-sm">
                                  <FileSearch size={24} className="text-indigo-600" />
                                </div>
                                <button className="text-slate-300 hover:text-black">
                                  <MoreVertical size={16} />
                                </button>
                              </div>
                              <p className="font-bold text-sm truncate mb-1">{file.name}</p>
                              <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-widest text-slate-400">
                                <span>{file.type} &bull; {file.size}</span>
                                <span>{file.date}</span>
                              </div>
                              <div className="mt-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button className="flex-1 py-2 bg-indigo-600 text-white rounded-lg text-[9px] font-black uppercase tracking-widest">Download</button>
                                <button className="p-2 bg-white border border-slate-200 rounded-lg text-slate-400 hover:text-red-500" aria-label="Delete file"><Trash size={12} /></button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* FORMS SUBTAB */}
                    {menteeSubTab === 'forms' && (
                      <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm space-y-8">
                        <div className="flex justify-between items-center">
                          <div>
                            <h3 className="text-xl font-black uppercase tracking-tighter">Custom Intake & Data</h3>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">View form responses and assessments</p>
                          </div>
                          <button className="flex items-center gap-2 px-6 py-3 border border-slate-200 text-slate-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all">
                            <Plus size={14} /> Send New Form
                          </button>
                        </div>

                        <div className="space-y-4">
                          {[
                            { title: 'Skills Self-Assessment', date: 'Oct 01, 2023', score: '8.5/10', status: 'completed' },
                            { title: 'Project Milestone Survey', date: 'Oct 15, 2023', score: 'N/A', status: 'pending' },
                          ].map((form, i) => (
                            <div key={i} className="flex items-center justify-between p-6 bg-slate-50 border border-slate-100 rounded-[24px] hover:border-indigo-100 transition-all">
                              <div className="flex items-center gap-4">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${form.status === 'completed' ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-200 text-slate-400'}`}>
                                  <FileText size={18} />
                                </div>
                                <div>
                                  <p className="font-bold text-sm">{form.title}</p>
                                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">{form.date}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-4">
                                {form.score !== 'N/A' && (
                                  <div className="text-right mr-4">
                                    <p className="text-xs font-black">{form.score}</p>
                                    <p className="text-[8px] font-bold uppercase tracking-widest text-slate-400">Score</p>
                                  </div>
                                )}
                                <button className={`px-5 py-2 rounded-full text-[9px] font-black uppercase tracking-widest transition-all ${
                                  form.status === 'completed'
                                  ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                                  : 'bg-slate-200 text-slate-500 cursor-not-allowed'
                                }`}>
                                  {form.status === 'completed' ? 'View Report' : 'Awaiting Response'}
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* HISTORY/GROWTH LOG SUBTAB */}
                    {menteeSubTab === 'history' && (
                      <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm space-y-8">
                        <h3 className="text-xl font-black uppercase tracking-tighter">Student Growth Journey</h3>
                        <div className="relative pl-8 space-y-8 before:content-[''] before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100">
                          {[
                            { title: 'Program Registration', desc: 'Officially accepted and registered for UX Career Jumpstart', date: 'Sep 15', icon: CheckCircle2, color: 'bg-emerald-500' },
                            { title: 'First Task Completed', desc: 'Finished Portfolio Information Architecture mapping', date: 'Sep 22', icon: Zap, color: 'bg-amber-500' },
                            { title: 'Intake Assessment', desc: 'Completed initial skills assessment with high visual design aptitude', date: 'Sep 28', icon: FileText, color: 'bg-indigo-500' },
                            { title: 'Major Milestone', desc: 'Responded to case study feedback with advanced iterations', date: 'Oct 05', icon: SparkleIcon, color: 'bg-purple-500' },
                          ].map((log, i) => (
                            <div key={i} className="relative">
                              <div className={`absolute -left-[30px] top-1 w-5 h-5 rounded-full border-4 border-white shadow-sm z-10 ${log.color}`}></div>
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <p className="font-black text-sm uppercase tracking-tight">{log.title}</p>
                                  <span className="text-[10px] font-bold text-slate-300">{log.date}</span>
                                </div>
                                <p className="text-sm text-slate-500 leading-relaxed max-w-xl">{log.desc}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* SESSIONS SUBTAB */}
                    {menteeSubTab === 'sessions' && (
                      <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm space-y-8">
                        <div className="flex justify-between items-center">
                          <div>
                            <h3 className="text-xl font-black uppercase tracking-tighter">Personal Sessions</h3>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">1:1 history and scheduled meetings</p>
                          </div>
                          <button
                            onClick={() => setIsSchedulingSession(true)}
                            className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-500/20"
                          >
                            <Plus size={14} /> Schedule 1:1
                          </button>
                        </div>

                        <div className="space-y-4">
                          {sessions.filter(s => s.studentId === mentee.user_id).map((session, i) => (
                            <div key={`${session.id || i}_${i}`} className="flex items-center justify-between p-6 bg-slate-50 border border-slate-100 rounded-[24px]">
                              <div className="flex items-center gap-5">
                                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm text-indigo-500">
                                  <Video size={20} />
                                </div>
                                <div>
                                  <p className="font-bold">{session.title}</p>
                                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{new Date(session.startTime).toLocaleString()}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className={`px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-widest ${session.attendanceStatus === 'attended' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-200 text-slate-500'}`}>
                                  {session.attendanceStatus}
                                </span>
                                {session.meetingUrl && (
                                  <a href={session.meetingUrl} target="_blank" rel="noreferrer" className="p-3 bg-black text-white rounded-2xl hover:bg-slate-900 transition-all">
                                    <ExternalLink size={14} />
                                  </a>
                                )}
                              </div>
                            </div>
                          ))}
                          {sessions.filter(s => s.studentId === mentee.user_id).length === 0 && (
                            <div className="py-20 text-center bg-slate-50 border border-dashed border-slate-200 rounded-[32px]">
                              <Video size={32} className="mx-auto text-slate-200 mb-4" />
                              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">No sessions recorded with this student.</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          );
        })()
      )}

      {/* Tag Management Modal */}
      {isAddingTag && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-300">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-white rounded-[40px] max-w-lg w-full p-10 shadow-2xl relative"
          >
            <button onClick={() => setIsAddingTag(false)} className="absolute top-8 right-8 w-10 h-10 flex items-center justify-center bg-slate-50 rounded-full hover:bg-slate-100 transition-colors">
              <X size={18} />
            </button>
            <div className="mb-8">
              <h3 className="text-3xl font-black uppercase tracking-tighter">Tag Management</h3>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Organize your workflow categories</p>
            </div>
            <div className="space-y-6">
              <div className="space-y-3 p-6 bg-slate-50 rounded-[32px] border border-slate-100">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Create New Category</p>
                <div className="flex gap-2">
                  <input type="text" placeholder="Tag name..." className="flex-1 px-5 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-medium outline-none focus:border-black transition-all" value={newTagLabel} onChange={e => setNewTagLabel(e.target.value)} />
                  <button onClick={handleAddTag} disabled={!newTagLabel.trim()} className="px-6 py-3 bg-black text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-slate-800 transition-all disabled:opacity-50">Create</button>
                </div>
                <div className="flex flex-wrap gap-2 mt-4">
                  {['bg-blue-100 text-blue-700', 'bg-emerald-100 text-emerald-700', 'bg-amber-100 text-amber-700', 'bg-indigo-100 text-indigo-700', 'bg-purple-100 text-purple-700', 'bg-rose-100 text-rose-700', 'bg-slate-100 text-slate-700'].map(color => (
                    <button key={color} onClick={() => setNewTagColor(color)} className={`w-6 h-6 rounded-full transition-all border-2 ${color} ${newTagColor === color ? 'border-black scale-125' : 'border-transparent opacity-50 hover:opacity-100'}`} />
                  ))}
                </div>
              </div>
              <div className="space-y-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-2">Library Tags ({allTags.length})</p>
                <div className="grid grid-cols-1 gap-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                  {allTags.map(tag => (
                    <div key={tag.id} className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl group hover:border-slate-300 transition-all">
                      <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${tag.color}`}>{tag.label}</span>
                      <button
                        onClick={() => {
                          tagService.delete(tag.id);
                          setAllTags(prev => prev.filter(t => t.id !== tag.id));
                          notifySuccess('Tag removed from library');
                        }}
                        className="w-8 h-8 flex items-center justify-center text-slate-300 hover:text-red-500 hover:bg-rose-50 rounded-full transition-all opacity-0 group-hover:opacity-100"
                      >
                        <Trash size={14} />
                      </button>
                    </div>
                  ))}
                  {allTags.length === 0 && (
                    <p className="text-center py-8 text-[10px] font-bold text-slate-300 uppercase tracking-widest">No tags in library.</p>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};
