import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { useApplications } from '../../../hooks/useApplications';
import { useTasks } from '../../../hooks/useTasks';
import { useGoals } from '../../../hooks/useGoals';
import { tagService } from '../../../services/tagService';
import { studentService } from '../../../services/studentService';
import { applicationService } from '../../../services/applicationService';
import { crmInitializationService } from '../../../services/crmInitializationService';
import { useRealtime } from '../../../hooks/useRealtime';
import { notifySuccess, notifyError } from '../../../utils/toast';
import { logger } from '../../../lib/logger';
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
  const [editingGoal, setEditingGoal] = useState(false);
  const [strengthInput, setStrengthInput] = useState('');
  const [focusInput, setFocusInput] = useState('');
  const [goalInput, setGoalInput] = useState('');
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [newTaskDueDate, setNewTaskDueDate] = useState('');
  const [allTags, setAllTags] = useState<StudentTag[]>([]);
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [newTagLabel, setNewTagLabel] = useState('');
  const [newTagColor, setNewTagColor] = useState('bg-blue-100 text-blue-700');

  const mentees = studentProfiles.map(profile => {
    const app = applications.find(a => a.user_id === profile.user_id || a.user_email === profile.email);
    const isApproved = app?.status === 'approved' || app?.status === 'invited' || profile.status === 'active';
    return {
      user_id: profile.user_id || profile.id,
      id: profile.id,
      full_name: profile.name || profile.full_name || profile.email || 'Unknown',
      user_email: profile.email || profile.user_email || '',
      focus_area: profile.specialization || profile.focus_area || app?.focus_area || 'Standard Program',
      goal: app?.goal || '',
      status: isApproved ? 'approved' : 'pending',
      program_id: profile.program_id || app?.program_id || null,
      application_status: profile.application_status || app?.status || null,
      created_at: profile.created_at || app?.created_at || '',
      updated_at: profile.updated_at || app?.updated_at || '',
      top_strength: (app as any)?.top_strength || '',
      needs_focus: (app as any)?.needs_focus || '',
      phone: profile.phone || app?.phone || '',
      linkedin_url: profile.linkedin_url || app?.linkedin_url || '',
      resume_link: profile.resume_link || app?.resume_link || '',
      health_status: profile.healthStatus || 'active',
      last_login: profile.lastLogin || null,
      invited_at: profile.invited_at || null,
      first_login_at: profile.first_login_at || null,
    };
  }).filter((m, idx, self) => self.findIndex(s => s.user_id === m.user_id) === idx);

  const filteredMentees = mentees.filter(app => {
    const matchesSearch = app.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.user_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (app.focus_area && app.focus_area.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (app.phone && app.phone.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesSearch;
  });

  const activeStudentsCount = studentProfiles.filter(p => p.status === 'active' || p.current_status === 'Active').length;

  useRealtime([
    { table: 'profiles', callback: () => { loadProfiles(); } },
    { table: 'tags', callback: () => { tagService.getAll().then(setAllTags); } },
  ]);

  const loadProfiles = async () => {
    const profiles = await studentService.getAll();
    setStudentProfiles(profiles);
  };

  useEffect(() => {
    loadProfiles();
    tagService.getAll().then(setAllTags);
  }, []);

  useEffect(() => {
    if (selectedMenteeId) {
      const profile = studentProfiles.find(p => (p.user_id || p.id) === selectedMenteeId);
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
    const profile = studentProfiles.find(p => (p.user_id || p.id) === menteeId);
    if (!profile) return;
    const currentTags = profile.tags || [];
    const newTags = currentTags.includes(tagId)
      ? currentTags.filter(t => t !== tagId)
      : [...currentTags, tagId];
    await studentService.update(profile.user_id || profile.id, { tags: newTags } as any);
    setStudentProfiles(prev => prev.map(p => (p.user_id || p.id) === menteeId ? { ...p, tags: newTags } : p));
  };

  const handleUpdateNotes = async () => {
    if (!selectedMenteeId) return;
    setIsSavingNotes(true);
    try {
      await studentService.update(selectedMenteeId, { notes: menteeNotes } as any);
      setStudentProfiles(prev => prev.map(p => (p.user_id || p.id) === selectedMenteeId ? { ...p, notes: menteeNotes } : p));
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

  const handleSaveGoal = async (value: string) => {
    if (!selectedMenteeId) return;
    try {
      const mentee = mentees.find(m => m.user_id === selectedMenteeId);
      if (!mentee) return;
      await applicationService.updateExtras(mentee.id, { goal: value });
      await refreshApps();
      notifySuccess('Statement of Intent updated');
    } catch {
      notifyError('Failed to save goal');
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
    } catch (err) {
      logger.error('useMentees', 'Failed to add goal', { studentId: selectedMenteeId, title, error: err instanceof Error ? err.message : String(err) });
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

  const handleAddStudent = async (email: string, name: string, programId?: string) => {
    try {
      const existing = await studentService.getAll();
      const existingStudent = existing.find(s => s.email === email);
      if (existingStudent) {
        notifyError('A student with this email already exists');
        return;
      }

      const tempPassword = crypto.randomUUID().slice(0, 12) + '!Aa1';
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password: tempPassword,
        options: {
          data: { full_name: name, role: 'student' },
        },
      });

      if (signUpError) {
        notifyError(signUpError.message);
        return;
      }

      if (signUpData?.user) {
        const userId = signUpData.user.id;
        await supabase.from('profiles').upsert({
          id: userId,
          email,
          name,
          role: 'student',
          status: 'active',
          mentor_id: currentUser?.id,
          health_status: 'active',
          growth_score: 0,
          metrics: { attendanceRate: 0, goalCompletionRate: 0, activityLevel: 0 },
          tags: [],
          program_id: programId || null,
        });

        await crmInitializationService.ensureStudentCrmExists(userId, currentUser?.id);
        await loadProfiles();
        notifySuccess(`Student ${name} added successfully. They will receive an email to set up their account.`);
      }
    } catch (err: any) {
      notifyError(err?.message || 'Failed to add student');
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
    editingGoal, setEditingGoal,
    strengthInput, setStrengthInput,
    focusInput, setFocusInput,
    goalInput, setGoalInput,
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
    handleAddTag, toggleMenteeTag, handleUpdateNotes, handleSaveStrengthFocus, handleSaveGoal,
    handleAddGoal, handleUpdateGoal, handleDeleteGoal,
    handleAddStudent,
  };
}
