import { useState, useEffect } from 'react';
import { useApplications } from '../../../hooks/useApplications';
import { useTasks } from '../../../hooks/useTasks';
import { useGoals } from '../../../hooks/useGoals';
import { tagService } from '../../../services/tagService';
import { studentService } from '../../../services/studentService';
import { applicationService } from '../../../services/applicationService';
import { notifySuccess, notifyError } from '../../../utils/toast';
import type { User, StudentProfile, StudentTag } from '../../../types';
import type { Goal } from '../../../interfaces';

export function useMentees(currentUser: User | null) {
  const { applications, refresh: refreshApps } = useApplications();
  const { taskActivities, addTask } = useTasks();
  const { goals, addGoal, updateGoal, deleteGoal } = useGoals();

  const [searchQuery, setSearchQuery] = useState('');
  const [studentProfiles, setStudentProfiles] = useState<StudentProfile[]>([]);
  const [selectedMenteeId, setSelectedMenteeId] = useState<string | null>(null);
  const [menteeSubTab, setMenteeSubTab] = useState<'dashboard' | 'tasks' | 'tags' | 'forms' | 'history' | 'files' | 'sessions'>('dashboard');
  const [menteeNotes, setMenteeNotes] = useState('');
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [editingStrength, setEditingStrength] = useState(false);
  const [editingFocus, setEditingFocus] = useState(false);
  const [strengthInput, setStrengthInput] = useState('');
  const [focusInput, setFocusInput] = useState('');
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [newTaskDueDate, setNewTaskDueDate] = useState('');
  const [allTags, setAllTags] = useState<StudentTag[]>([]);
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [newTagLabel, setNewTagLabel] = useState('');
  const [newTagColor, setNewTagColor] = useState('bg-blue-100 text-blue-700');

  const mentees = applications.filter(app => app.status === 'approved' || app.status === 'invited');
  const filteredMentees = mentees.filter(app => {
    const matchesSearch = app.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.user_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (app.goal && app.goal.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesSearch;
  });
  const activeStudentsCount = studentProfiles.filter(p => p.status === 'active' || p.current_status === 'Active').length;

  useEffect(() => {
    tagService.getAll().then(setAllTags);
    studentService.getAll().then(setStudentProfiles);
  }, []);

  useEffect(() => {
    if (selectedMenteeId) {
      const profile = studentProfiles.find(p => p.user_id === selectedMenteeId);
      setMenteeNotes(profile?.notes || '');
    }
  }, [selectedMenteeId, studentProfiles]);

  const handleAddTag = async () => {
    if (!newTagLabel.trim()) return;
    const created = await tagService.create({ label: newTagLabel, color: newTagColor });
    if (created) {
      setAllTags(prev => [...prev, created]);
    }
    setNewTagLabel('');
    setIsAddingTag(false);
    notifySuccess('Tag created successfully');
  };

  const toggleMenteeTag = async (menteeId: string, tagId: string) => {
    const profile = studentProfiles.find(p => p.user_id === menteeId);
    if (!profile) return;
    const currentTags = profile.tags || [];
    const newTags = currentTags.includes(tagId)
      ? currentTags.filter(t => t !== tagId)
      : [...currentTags, tagId];
    await studentService.update(profile.user_id || profile.id, { tags: newTags } as any);
    setStudentProfiles(prev => prev.map(p => p.user_id === menteeId ? { ...p, tags: newTags } : p));
  };

  const handleUpdateNotes = async () => {
    if (!selectedMenteeId) return;
    setIsSavingNotes(true);
    try {
      await studentService.update(selectedMenteeId, { notes: menteeNotes } as any);
      setStudentProfiles(prev => prev.map(p => p.user_id === selectedMenteeId ? { ...p, notes: menteeNotes } : p));
      notifySuccess('Summary notes updated');
    } catch {
      notifyError('Failed to save notes');
    } finally {
      setIsSavingNotes(false);
    }
  };

  const handleSaveStrengthFocus = async (field: 'top_strength' | 'needs_focus', value: string) => {
    if (!selectedMenteeId) return;
    try {
      const mentee = mentees.find(m => m.user_id === selectedMenteeId);
      if (!mentee) return;
      await applicationService.updateExtras(mentee.id, { [field]: value });
      await refreshApps();
      notifySuccess(`${field === 'top_strength' ? 'Top Strength' : 'Needs Focus'} updated`);
    } catch {
      notifyError('Failed to save');
    }
  };

  const menteeGoals = goals.filter(g => g.studentId === selectedMenteeId);

  const handleAddGoal = async (title: string, description?: string) => {
    if (!selectedMenteeId) return;
    try {
      await addGoal({
        studentId: selectedMenteeId,
        title,
        description: description || '',
        status: 'not_started',
        progressPercentage: 0,
        milestones: [],
      });
      notifySuccess('Goal added');
    } catch {
      notifyError('Failed to add goal');
    }
  };

  const handleUpdateGoal = async (id: string, updates: Partial<Goal>) => {
    try {
      await updateGoal(id, updates);
      notifySuccess('Goal updated');
    } catch {
      notifyError('Failed to update goal');
    }
  };

  const handleDeleteGoal = async (id: string) => {
    try {
      await deleteGoal(id);
      notifySuccess('Goal deleted');
    } catch {
      notifyError('Failed to delete goal');
    }
  };

  return {
    searchQuery, setSearchQuery,
    studentProfiles, setStudentProfiles,
    selectedMenteeId, setSelectedMenteeId,
    menteeSubTab, setMenteeSubTab,
    menteeNotes, setMenteeNotes,
    isSavingNotes, setIsSavingNotes,
    editingStrength, setEditingStrength,
    editingFocus, setEditingFocus,
    strengthInput, setStrengthInput,
    focusInput, setFocusInput,
    newTaskTitle, setNewTaskTitle,
    newTaskPriority, setNewTaskPriority,
    newTaskDueDate, setNewTaskDueDate,
    allTags, setAllTags,
    isAddingTag, setIsAddingTag,
    newTagLabel, setNewTagLabel,
    newTagColor, setNewTagColor,
    mentees, filteredMentees, activeStudentsCount,
    taskActivities, addTask,
    menteeGoals,
    handleAddTag, toggleMenteeTag, handleUpdateNotes, handleSaveStrengthFocus,
    handleAddGoal, handleUpdateGoal, handleDeleteGoal,
  };
}
