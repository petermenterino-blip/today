import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search, Users, Settings, MessageSquare, ChevronRight, ArrowLeft,
  Activity, TrendingUp, Video, Globe, CalendarDays, ClipboardList,
  Plus, CheckCircle2, XCircle, Clock, X, FileSearch, MoreVertical,
  Trash, FileText, Zap, ExternalLink, Layout, Tag, History, File,
  CheckCircle, Sparkles as SparkleIcon, Eye, Award, Target, Edit2,
  Send, AlertTriangle, Edit3, Archive
} from 'lucide-react';
import { tagService } from '../../../services/tagService';
import { customFormService } from '../../../services/customFormService';
import { sharedFilesService } from '../../../services/sharedFilesService';
import { timelineService } from '../../../services/timelineService';
import { taskService } from '../../../services/taskService';
import { notify } from '../../../services/notificationService';
import { notifySuccess, notifyError } from '../../../utils/toast';
import type { StudentTag, TaskActivity, StudentProfile, CustomForm, FormSubmission } from '../../../types';
import type { Goal } from '../../../interfaces';
import type { TimelineEvent } from '../../../services/timelineService';
import type { SharedFileRecord } from '../../../services/sharedFilesService';
import FormBuilderModal from './FormBuilderModal';
import IssueCredentialModal from './IssueCredentialModal';

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
  formSubmissions: FormSubmission[];
  isCreatingForm: boolean;
  setIsCreatingForm: (v: boolean) => void;
  menteeGoals: Goal[];
  handleAddGoal: (title: string, description?: string) => Promise<void>;
  handleUpdateGoal: (id: string, updates: Partial<Goal>) => Promise<void>;
  handleDeleteGoal: (id: string) => Promise<void>;
  currentUser: any;
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
  formSubmissions,
  isCreatingForm,
  setIsCreatingForm,
  menteeGoals,
  handleAddGoal,
  handleUpdateGoal,
  handleDeleteGoal,
  currentUser,
}) => {
  const [formsList, setFormsList] = useState<CustomForm[]>([]);
  const [formsLoading, setFormsLoading] = useState(false);
  const [selectedFormSubmissions, setSelectedFormSubmissions] = useState<FormSubmission[] | null>(null);
  const [showCredentialModal, setShowCredentialModal] = useState(false);
  const [sharedFiles, setSharedFiles] = useState<SharedFileRecord[]>([]);
  const [filesLoading, setFilesLoading] = useState(false);
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>([]);
  const [timelineLoading, setTimelineLoading] = useState(false);
  const [timelineFilter, setTimelineFilter] = useState<string>('all');
  const [uploadingFile, setUploadingFile] = useState(false);
  const [renamingFileId, setRenamingFileId] = useState<string | null>(null);
  const [renamingFileName, setRenamingFileName] = useState('');
  const [fileSearchQuery, setFileSearchQuery] = useState('');
  const [taskSearchQuery, setTaskSearchQuery] = useState('');
  const [goalSearchQuery, setGoalSearchQuery] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: string; id: string; label: string } | null>(null);
  const [sendingFormId, setSendingFormId] = useState<string | null>(null);
  const [editingTagId, setEditingTagId] = useState<string | null>(null);
  const [editingTagLabel, setEditingTagLabel] = useState('');
  const [editingTagColor, setEditingTagColor] = useState('');

  useEffect(() => {
    setFormsLoading(true);
    customFormService.getAllForms()
      .then(f => setFormsList(f as any))
      .catch(() => {})
      .finally(() => setFormsLoading(false));
  }, [isCreatingForm]);

  useEffect(() => {
    if (!selectedMenteeId || menteeSubTab !== 'files') return;
    setFilesLoading(true);
    sharedFilesService.getByUserId(selectedMenteeId)
      .then(setSharedFiles)
      .catch(() => {})
      .finally(() => setFilesLoading(false));
  }, [selectedMenteeId, menteeSubTab]);

  useEffect(() => {
    if (!selectedMenteeId || menteeSubTab !== 'history') return;
    setTimelineLoading(true);
    timelineService.getByStudentId(selectedMenteeId)
      .then(setTimelineEvents)
      .catch(() => {})
      .finally(() => setTimelineLoading(false));
  }, [selectedMenteeId, menteeSubTab]);

  const refreshForms = () => {
    customFormService.getAllForms()
      .then(f => setFormsList(f as any))
      .catch(() => {});
  };

  const handleViewSubmissions = (formId: string) => {
    customFormService.getSubmissionsByFormId(formId)
      .then(s => setSelectedFormSubmissions(s as any))
      .catch(() => notifyError('Failed to load submissions'));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0] || !selectedMenteeId) return;
    setUploadingFile(true);
    try {
      await sharedFilesService.upload(selectedMenteeId, e.target.files[0]);
      notifySuccess('File uploaded successfully');
      const files = await sharedFilesService.getByUserId(selectedMenteeId);
      setSharedFiles(files);
    } catch (err: any) {
      notifyError(err?.message || 'Failed to upload file');
    } finally {
      setUploadingFile(false);
      e.target.value = '';
    }
  };

  const handleFileDownload = async (file: SharedFileRecord) => {
    try {
      const url = await sharedFilesService.getDownloadUrl(file.storage_path, file.name);
      window.open(url, '_blank');
    } catch {
      notifyError('Failed to download file');
    }
  };

  const handleFileRename = async (id: string) => {
    if (!renamingFileName.trim()) return;
    try {
      await sharedFilesService.rename(id, renamingFileName.trim());
      notifySuccess('File renamed');
      setSharedFiles(prev => prev.map(f => f.id === id ? { ...f, name: renamingFileName.trim() } : f));
      setRenamingFileId(null);
      setRenamingFileName('');
    } catch (err: any) {
      notifyError(err?.message || 'Failed to rename file');
    }
  };

  const handleFileDelete = async (file: SharedFileRecord) => {
    try {
      await sharedFilesService.delete(file.id, file.storage_path);
      notifySuccess('File deleted');
      setSharedFiles(prev => prev.filter(f => f.id !== file.id));
    } catch {
      notifyError('Failed to delete file');
    }
    setDeleteConfirm(null);
  };

  const handleEditTagSave = async (tagId: string) => {
    if (!editingTagLabel.trim()) return;
    try {
      await tagService.update(tagId, { label: editingTagLabel.trim(), color: editingTagColor });
      setAllTags(prev => prev.map(t => t.id === tagId ? { ...t, label: editingTagLabel.trim(), color: editingTagColor } : t));
      notifySuccess('Tag updated');
      setEditingTagId(null);
    } catch {
      notifyError('Failed to update tag');
    }
  };

  const handleDeleteTag = async (tagId: string) => {
    try {
      await tagService.delete(tagId);
      setAllTags(prev => prev.filter(t => t.id !== tagId));
      notifySuccess('Tag deleted');
    } catch {
      notifyError('Failed to delete tag');
    }
    setDeleteConfirm(null);
  };

  const handleSendFormToStudent = async (formId: string) => {
    if (!selectedMenteeId) return;
    setSendingFormId(formId);
    try {
      const form = formsList.find(f => f.id === formId);
      if (!form) return;
      await customFormService.assignFormToStudent(formId, selectedMenteeId, currentUser?.id || '');
      notify.formAssigned(selectedMenteeId, form.title).catch(() => {});
      timelineService.autoLogFormSent(selectedMenteeId, form.title, currentUser?.id || '').catch(() => {});
      notifySuccess('Form sent to student');
      refreshForms();
    } catch {
      notifyError('Failed to send form');
    } finally {
      setSendingFormId(null);
    }
  };

  const filteredSharedFiles = sharedFiles.filter(f =>
    !fileSearchQuery || f.name.toLowerCase().includes(fileSearchQuery.toLowerCase())
  );

  const filteredTimelineEvents = timelineEvents.filter(e =>
    timelineFilter === 'all' || e.type === timelineFilter
  );

  const getTimelineIcon = (type: string) => {
    switch (type) {
      case 'application_submitted': return CheckCircle2;
      case 'application_approved': return CheckCircle;
      case 'program_assigned': return Layout;
      case 'goal_created': return Target;
      case 'goal_completed': return Award;
      case 'task_assigned': return ClipboardList;
      case 'task_completed': return CheckCircle2;
      case 'form_submitted': return FileText;
      case 'session_completed': return Video;
      case 'file_shared': return File;
      case 'milestone_achieved': return SparkleIcon;
      case 'mentor_note': return Edit2;
      default: return Activity;
    }
  };

  const getTimelineColor = (type: string) => {
    switch (type) {
      case 'application_submitted': return 'bg-indigo-500';
      case 'application_approved': return 'bg-emerald-500';
      case 'program_assigned': return 'bg-blue-500';
      case 'goal_created': return 'bg-amber-500';
      case 'goal_completed': return 'bg-emerald-500';
      case 'task_assigned': return 'bg-amber-500';
      case 'task_completed': return 'bg-emerald-500';
      case 'form_submitted': return 'bg-purple-500';
      case 'session_completed': return 'bg-indigo-500';
      case 'file_shared': return 'bg-cyan-500';
      case 'milestone_achieved': return 'bg-amber-500';
      case 'mentor_note': return 'bg-slate-500';
      default: return 'bg-slate-400';
    }
  };

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
            const result = await addTask({
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
            if (result?.id || result) {
              const mentorId = currentUser?.id || '';
              notify.taskAssigned(mentee.user_id, mentorId, newTaskTitle).catch(() => {});
              timelineService.autoLogTaskAssigned(mentee.user_id, newTaskTitle, mentorId).catch(() => {});
            }
            notifySuccess('Task assigned successfully');
          };

          const handleDeleteTask = async (taskId: string, taskTitle: string) => {
            try {
              await taskService.delete(taskId);
              notifySuccess(`Deleted "${taskTitle}"`);
              const mentorId = currentUser?.id || '';
              timelineService.autoLogTaskCompleted(mentee.user_id, taskTitle, mentorId).catch(() => {});
              setMenteeSubTab('dashboard'); setMenteeSubTab('tasks');
            } catch {
              notifyError('Failed to delete task');
            }
          };

          const handleArchiveTask = async (taskId: string, taskTitle: string) => {
            try {
              await taskService.updateStatus(taskId, 'archived');
              notifySuccess(`Archived "${taskTitle}"`);
              setMenteeSubTab('dashboard'); setMenteeSubTab('tasks');
            } catch {
              notifyError('Failed to archive task');
            }
          };

          const handleEditTask = async (task: any) => {
            const newTitle = prompt('Edit task title:', task.task_title);
            if (!newTitle || newTitle === task.task_title) return;
            try {
              await taskService.update(task.id, { task_title: newTitle });
              notifySuccess('Task updated');
              const mentorId = currentUser?.id || '';
              timelineService.autoLogTaskUpdated(mentee.user_id, newTitle, mentorId).catch(() => {});
              setMenteeSubTab('dashboard'); setMenteeSubTab('tasks');
            } catch {
              notifyError('Failed to update task');
            }
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
                  <button
                    onClick={() => setShowCredentialModal(true)}
                    className="p-2 bg-white border border-slate-100 rounded-full text-slate-400 hover:text-amber-600 transition-colors shadow-sm"
                    title="Issue Credential"
                  >
                    <Award size={16} />
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
                              <p className="text-sm font-bold text-indigo-900">{mentee.top_strength || 'Not specified'}</p>
                            </div>
                            <div className="p-4 bg-amber-50/50 rounded-2xl border border-amber-100/50">
                              <p className="text-[9px] font-black uppercase tracking-widest text-amber-400 mb-1">Needs Focus</p>
                              <p className="text-sm font-bold text-amber-900">{mentee.needs_focus || 'Not specified'}</p>
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
                          <div className="flex items-center justify-between">
                            <h3 className="text-lg font-black uppercase tracking-tighter">Goals</h3>
                          </div>
                          {menteeGoals.length === 0 ? (
                            <div className="p-6 bg-slate-50 rounded-[24px] text-center">
                              <Target size={24} className="mx-auto text-slate-300 mb-2" />
                              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">No goals set yet.</p>
                            </div>
                          ) : (
                            <div className="space-y-3">
                              {menteeGoals.map(g => (
                                <div key={g.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-[20px] border border-slate-100 group hover:border-indigo-100 transition-all">
                                  <div className="flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                                      g.status === 'completed' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'
                                    }`}>
                                      <Target size={14} />
                                    </div>
                                    <div>
                                      <p className="text-sm font-bold">{g.title}</p>
                                      {g.description && <p className="text-[9px] text-slate-400 font-medium">{g.description}</p>}
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    {g.status !== 'completed' && (
                                      <button
                                        onClick={() => handleUpdateGoal(g.id, { status: 'completed' })}
                                        className="p-1.5 bg-emerald-100 text-emerald-600 rounded-lg hover:bg-emerald-200"
                                        title="Mark completed"
                                      >
                                        <CheckCircle2 size={12} />
                                      </button>
                                    )}
                                    <button
                                      onClick={() => handleDeleteGoal(g.id)}
                                      className="p-1.5 bg-rose-50 text-rose-500 rounded-lg hover:bg-rose-100"
                                      title="Delete goal"
                                    >
                                      <X size={12} />
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                          <AddGoalForm onAdd={handleAddGoal} />
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
                              <div className="flex items-center gap-2">
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
                                <button
                                  onClick={() => handleEditTask(task)}
                                  className="p-2 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-indigo-600 hover:border-indigo-200 transition-all"
                                  title="Edit task"
                                >
                                  <Edit3 size={12} />
                                </button>
                                {task.status !== 'archived' && (
                                  <button
                                    onClick={() => handleArchiveTask(task.id, task.task_title)}
                                    className="p-2 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-amber-600 hover:border-amber-200 transition-all"
                                    title="Archive task"
                                  >
                                    <Archive size={12} />
                                  </button>
                                )}
                                <button
                                  onClick={() => handleDeleteTask(task.id, task.task_title)}
                                  className="p-2 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-rose-600 hover:border-rose-200 transition-all"
                                  title="Delete task"
                                >
                                  <Trash size={12} />
                                </button>
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
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div>
                            <h3 className="text-xl font-black uppercase tracking-tighter">Shared Assets</h3>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Direct file sharing vault</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="relative flex-1 md:w-56">
                              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                              <input
                                type="text"
                                placeholder="Search files..."
                                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs font-medium outline-none focus:border-indigo-500 transition-all"
                                value={fileSearchQuery}
                                onChange={e => setFileSearchQuery(e.target.value)}
                              />
                            </div>
                            <label className={`flex items-center gap-2 px-5 py-2.5 ${uploadingFile ? 'bg-slate-400' : 'bg-indigo-600 hover:bg-indigo-700'} text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-indigo-500/20 cursor-pointer`}>
                              {uploadingFile ? (
                                <><div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /> Uploading...</>
                              ) : (
                                <><Plus size={14} /> Upload to Vault</>
                              )}
                              <input type="file" className="hidden" onChange={handleFileUpload} disabled={uploadingFile} accept=".pdf,.docx,.pptx,.png,.jpg,.jpeg,.gif,.zip" />
                            </label>
                          </div>
                        </div>

                        {filesLoading ? (
                          <div className="flex items-center justify-center py-12">
                            <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                          </div>
                        ) : filteredSharedFiles.length === 0 ? (
                          <div className="py-16 text-center bg-slate-50 border border-dashed border-slate-200 rounded-[32px]">
                            <FileSearch size={40} className="mx-auto text-slate-200 mb-4" />
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                              {fileSearchQuery ? 'No files match your search.' : 'No files shared yet. Upload your first file.'}
                            </p>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filteredSharedFiles.map(file => (
                              <div key={file.id} className="p-5 bg-slate-50 border border-slate-100 rounded-[24px] group hover:bg-indigo-50/30 hover:border-indigo-100 transition-all">
                                <div className="flex items-start justify-between mb-4">
                                  <div className="p-3 bg-white rounded-xl shadow-sm">
                                    <FileSearch size={24} className="text-indigo-600" />
                                  </div>
                                  <div className="relative">
                                    <button
                                      onClick={() => {
                                        setRenamingFileId(renamingFileId === file.id ? null : file.id);
                                        setRenamingFileName(file.name);
                                      }}
                                      className="text-slate-300 hover:text-black p-1"
                                    >
                                      <MoreVertical size={16} />
                                    </button>
                                  </div>
                                </div>
                                {renamingFileId === file.id ? (
                                  <div className="space-y-2">
                                    <input
                                      type="text"
                                      value={renamingFileName}
                                      onChange={e => setRenamingFileName(e.target.value)}
                                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm font-medium outline-none focus:border-indigo-500"
                                      autoFocus
                                      onKeyDown={e => { if (e.key === 'Enter') handleFileRename(file.id); if (e.key === 'Escape') setRenamingFileId(null); }}
                                    />
                                    <div className="flex gap-1">
                                      <button onClick={() => handleFileRename(file.id)} className="px-3 py-1 bg-black text-white rounded-lg text-[8px] font-black uppercase tracking-widest">Save</button>
                                      <button onClick={() => setRenamingFileId(null)} className="px-3 py-1 bg-slate-200 text-slate-600 rounded-lg text-[8px] font-black uppercase tracking-widest">Cancel</button>
                                    </div>
                                  </div>
                                ) : (
                                  <>
                                    <p className="font-bold text-sm truncate mb-1">{file.name}</p>
                                    <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-widest text-slate-400">
                                      <span>{file.type}</span>
                                      <span>{new Date(file.shared_at).toLocaleDateString()}</span>
                                    </div>
                                    <div className="mt-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                      <button onClick={() => handleFileDownload(file)} className="flex-1 py-2 bg-indigo-600 text-white rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all">Download</button>
                                      <button
                                        onClick={() => setDeleteConfirm({ type: 'file', id: file.id, label: file.name })}
                                        className="p-2 bg-white border border-slate-200 rounded-lg text-slate-400 hover:text-red-500 hover:border-red-200 transition-all"
                                      >
                                        <Trash size={12} />
                                      </button>
                                    </div>
                                  </>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
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
                          <button onClick={() => setIsCreatingForm(true)} className="flex items-center gap-2 px-6 py-3 bg-black text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-md">
                            <Plus size={14} /> Create Form
                          </button>
                        </div>

                        {selectedFormSubmissions !== null ? (
                          <div className="space-y-4">
                            <button
                              onClick={() => setSelectedFormSubmissions(null)}
                              className="text-[10px] font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                            >
                              <ArrowLeft size={14} /> Back to all forms
                            </button>
                            {selectedFormSubmissions.length === 0 ? (
                              <div className="p-8 bg-slate-50 rounded-[24px] text-center">
                                <p className="text-xs text-slate-400 font-medium">No submissions for this form yet.</p>
                              </div>
                            ) : (
                              selectedFormSubmissions.map((sub, i) => (
                                <div key={sub.id || i} className="p-6 bg-slate-50 border border-slate-100 rounded-[24px] space-y-3">
                                  <div className="flex items-center justify-between">
                                    <p className="font-bold text-sm">{sub.user_name}</p>
                                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                                      {new Date(sub.submitted_at).toLocaleDateString()}
                                    </span>
                                  </div>
                                  {Object.entries(sub.responses || {}).map(([key, val]) => (
                                    <div key={key} className="text-xs">
                                      <span className="font-bold text-slate-500">{key}: </span>
                                      <span className="text-slate-700">{String(val)}</span>
                                    </div>
                                  ))}
                                </div>
                              ))
                            )}
                          </div>
                        ) : formsLoading ? (
                          <div className="flex items-center justify-center py-12">
                            <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                          </div>
                        ) : formsList.length === 0 ? (
                          <div className="p-12 bg-slate-50 rounded-[24px] text-center">
                            <p className="text-sm text-slate-400 font-medium">No custom forms created yet.</p>
                            <p className="text-[10px] text-slate-300 mt-1 font-bold uppercase tracking-widest">Click "Create Form" to build your first assessment form.</p>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {formsList.map((form) => {
                              const submissions = formSubmissions.filter(s => s.form_id === form.id);
                              const studentSubmissions = submissions.filter(s => s.user_id === (selectedMenteeId || ''));
                              return (
                                <div key={form.id} className="flex items-center justify-between p-6 bg-slate-50 border border-slate-100 rounded-[24px] hover:border-indigo-100 transition-all">
                                  <div className="flex items-center gap-4">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${studentSubmissions.length > 0 ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-200 text-slate-400'}`}>
                                      <FileText size={18} />
                                    </div>
                                    <div>
                                      <p className="font-bold text-sm">{form.title}</p>
                                      <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                                        {form.description || new Date(form.created_at).toLocaleDateString()}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-4">
                                    <div className="text-right mr-4">
                                      <p className="text-xs font-black">{submissions.length}</p>
                                      <p className="text-[8px] font-bold uppercase tracking-widest text-slate-400">Responses</p>
                                    </div>
                                    {submissions.length > 0 ? (
                                      <button
                                        onClick={() => handleViewSubmissions(form.id)}
                                        className="px-5 py-2 bg-indigo-600 text-white rounded-full text-[9px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all flex items-center gap-1"
                                      >
                                        <Eye size={12} /> View
                                      </button>
                                    ) : (
                                      <div className="flex items-center gap-2">
                                        <span className="px-5 py-2 bg-slate-200 text-slate-500 rounded-full text-[9px] font-black uppercase tracking-widest">
                                          Awaiting
                                        </span>
                                        <button
                                          onClick={() => handleSendFormToStudent(form.id)}
                                          disabled={sendingFormId === form.id}
                                          className="px-4 py-2 bg-indigo-600 text-white rounded-full text-[9px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all disabled:opacity-50 flex items-center gap-1"
                                        >
                                          {sendingFormId === form.id ? (
                                            <><div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /> Sending...</>
                                          ) : (
                                            <><Send size={11} /> Send to Student</>
                                          )}
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}

                    <FormBuilderModal
                      isOpen={isCreatingForm}
                      onClose={() => setIsCreatingForm(false)}
                      onCreated={refreshForms}
                    />

                    <IssueCredentialModal
                      isOpen={showCredentialModal}
                      onClose={() => setShowCredentialModal(false)}
                      studentId={mentee.user_id}
                      studentName={mentee.full_name}
                      mentorName="Mentor"
                      onIssued={() => {}}
                    />

                    {/* HISTORY/GROWTH LOG SUBTAB */}
                    {menteeSubTab === 'history' && (
                      <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                          <div>
                            <h3 className="text-xl font-black uppercase tracking-tighter">Growth Log</h3>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Timeline of progress & milestones</p>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {['all', 'goal_created', 'goal_completed', 'session_completed', 'form_submitted', 'file_shared', 'mentor_note'].map(f => (
                              <button
                                key={f}
                                onClick={() => setTimelineFilter(f)}
                                className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
                                  timelineFilter === f
                                    ? 'bg-indigo-600 text-white shadow-sm'
                                    : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
                                }`}
                              >
                                {f === 'all' ? 'All' : f.replace(/_/g, ' ')}
                              </button>
                            ))}
                          </div>
                        </div>

                        {timelineLoading ? (
                          <div className="flex items-center justify-center py-12">
                            <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                          </div>
                        ) : filteredTimelineEvents.length === 0 ? (
                          <div className="py-16 text-center bg-slate-50 border border-dashed border-slate-200 rounded-[32px]">
                            <Clock size={40} className="mx-auto text-slate-200 mb-4" />
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                              {timelineFilter !== 'all' ? 'No events of this type yet.' : 'No timeline events yet.'}
                            </p>
                          </div>
                        ) : (
                          <div className="relative pl-8 border-l-2 border-slate-200 space-y-10">
                            {filteredTimelineEvents.map((event) => {
                              const Icon = getTimelineIcon(event.type);
                              return (
                                <div key={event.id} className="relative">
                                  <div className={`absolute -left-[calc(1rem+5px)] top-0 w-4 h-4 rounded-full ${getTimelineColor(event.type)} border-4 border-white shadow-sm flex items-center justify-center`} />
                                  <div className="flex items-start gap-4">
                                    <div className="flex-1">
                                      <p className="text-[9px] font-black uppercase tracking-widest text-indigo-600 mb-1">
                                        {new Date(event.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                      </p>
                                      <p className="font-bold mb-0.5">{event.title}</p>
                                      {event.description && (
                                        <p className="text-xs text-slate-500">{event.description}</p>
                                      )}
                                      {event.metadata && Object.keys(event.metadata).length > 0 && (
                                        <div className="mt-2 flex flex-wrap gap-1.5">
                                          {Object.entries(event.metadata).map(([k, v]) => (
                                            <span key={k} className="px-2 py-0.5 bg-slate-100 rounded-lg text-[8px] font-semibold uppercase tracking-widest text-slate-500">
                                              {k.replace(/_/g, ' ')}: {String(v)}
                                            </span>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
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
                  {allTags.map(tag => {
                    const editing = editingTagId === tag.id;
                    return (
                      <div key={tag.id} className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl group hover:border-slate-300 transition-all">
                        {editing ? (
                          <div className="flex-1 space-y-2">
                            <input
                              type="text"
                              value={editingTagLabel}
                              onChange={e => setEditingTagLabel(e.target.value)}
                              className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm font-medium outline-none focus:border-black"
                              autoFocus
                              onKeyDown={e => { if (e.key === 'Enter') handleEditTagSave(tag.id); if (e.key === 'Escape') setEditingTagId(null); }}
                            />
                            <div className="flex items-center gap-2">
                              {['bg-blue-100 text-blue-700', 'bg-emerald-100 text-emerald-700', 'bg-amber-100 text-amber-700', 'bg-indigo-100 text-indigo-700', 'bg-purple-100 text-purple-700', 'bg-rose-100 text-rose-700', 'bg-slate-100 text-slate-700'].map(color => (
                                <button key={color} onClick={() => setEditingTagColor(color)} className={`w-5 h-5 rounded-full transition-all border-2 ${color} ${editingTagColor === color ? 'border-black scale-110' : 'border-transparent opacity-50 hover:opacity-100'}`} />
                              ))}
                            </div>
                            <div className="flex gap-1">
                              <button onClick={() => handleEditTagSave(tag.id)} className="px-3 py-1 bg-black text-white rounded-lg text-[8px] font-black uppercase tracking-widest">Save</button>
                              <button onClick={() => setEditingTagId(null)} className="px-3 py-1 bg-slate-200 text-slate-600 rounded-lg text-[8px] font-black uppercase tracking-widest">Cancel</button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${tag.color}`}>{tag.label}</span>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                              <button onClick={() => { setEditingTagId(tag.id); setEditingTagLabel(tag.label); setEditingTagColor(tag.color); }} className="w-8 h-8 flex items-center justify-center text-slate-300 hover:text-indigo-500 hover:bg-indigo-50 rounded-full transition-all">
                                <Edit2 size={12} />
                              </button>
                              <button
                                onClick={() => setDeleteConfirm({ type: 'tag', id: tag.id, label: tag.label })}
                                className="w-8 h-8 flex items-center justify-center text-slate-300 hover:text-red-500 hover:bg-rose-50 rounded-full transition-all"
                              >
                                <Trash size={14} />
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })}
                  {allTags.length === 0 && (
                    <p className="text-center py-8 text-[10px] font-bold text-slate-300 uppercase tracking-widest">No tags in library.</p>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-300">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-white rounded-[32px] max-w-sm w-full p-8 shadow-2xl text-center"
          >
            <div className="w-14 h-14 mx-auto mb-4 bg-red-50 rounded-full flex items-center justify-center">
              <AlertTriangle size={28} className="text-red-500" />
            </div>
            <h3 className="text-xl font-black uppercase tracking-tighter mb-2">Confirm Delete</h3>
            <p className="text-sm text-slate-500 mb-6">
              {deleteConfirm.type === 'file'
                ? `Are you sure you want to delete "${deleteConfirm.label}"? This action cannot be undone.`
                : `Delete tag "${deleteConfirm.label}"? It will be removed from all students.`
              }
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 py-3 bg-white border border-slate-200 text-slate-600 text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-slate-50 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (deleteConfirm.type === 'file') {
                    const file = sharedFiles.find(f => f.id === deleteConfirm.id);
                    if (file) handleFileDelete(file);
                  } else if (deleteConfirm.type === 'tag') {
                    handleDeleteTag(deleteConfirm.id);
                  }
                }}
                className="flex-1 py-3 bg-red-600 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-red-700 transition-all shadow-lg shadow-red-500/20"
              >
                Delete
              </button>
            </div>
          </motion.div>
        </div>
      )}

    </div>
  );
};

function AddGoalForm({ onAdd }: { onAdd: (title: string, description?: string) => Promise<void> }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const handleSubmit = async () => {
    if (!title.trim()) return;
    await onAdd(title.trim(), description.trim() || undefined);
    setTitle('');
    setDescription('');
    setIsOpen(false);
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 p-3 w-full bg-slate-50 rounded-[20px] border border-dashed border-slate-200 text-slate-400 hover:border-indigo-200 hover:text-indigo-500 hover:bg-indigo-50/30 transition-all group"
      >
        <Plus size={14} />
        <span className="text-[10px] font-black uppercase tracking-widest">Add Goal</span>
      </button>
    );
  }

  return (
    <div className="p-5 bg-slate-50 rounded-[24px] border border-slate-100 space-y-3">
      <input
        type="text"
        placeholder="Goal title..."
        value={title}
        onChange={e => setTitle(e.target.value)}
        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-medium outline-none focus:border-indigo-400 transition-all"
        autoFocus
      />
      <textarea
        placeholder="Description (optional)"
        value={description}
        onChange={e => setDescription(e.target.value)}
        rows={2}
        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-medium outline-none focus:border-indigo-400 transition-all resize-none"
      />
      <div className="flex gap-2">
        <button
          onClick={handleSubmit}
          disabled={!title.trim()}
          className="flex-1 py-3 bg-black text-white text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-slate-800 transition-all disabled:opacity-50"
        >
          Save
        </button>
        <button
          onClick={() => setIsOpen(false)}
          className="py-3 px-5 bg-white border border-slate-200 text-slate-400 text-[10px] font-black uppercase tracking-widest rounded-2xl hover:border-slate-300 transition-all"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
