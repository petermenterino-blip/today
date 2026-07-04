import { useState } from 'react';
import { usePrograms } from '../../../hooks/usePrograms';
import { notifySuccess, notifyError } from '../../../utils/toast';
import type { User, Program } from '../../../types';

export function useProgramManager(currentUser: User | null) {
  const { programs, addProgram, deleteProgram, updateProgram } = usePrograms();

  const [isCreatingProgram, setIsCreatingProgram] = useState(false);
  const [programWizardStep, setProgramWizardStep] = useState(1);
  const [newProgramData, setNewProgramData] = useState<Partial<Program>>({
    title: '',
    description: '',
    duration: '',
    mentor: currentUser?.name || '',
    category: 'Design',
    difficulty: 'Beginner',
    outcomes: [],
    status: 'active'
  });

  const [editingProgram, setEditingProgram] = useState<Program | null>(null);
  const [editFormTab, setEditFormTab] = useState<'basics' | 'details' | 'curriculum' | 'objectives'>('basics');
  const [newModuleTitle, setNewModuleTitle] = useState('');
  const [newModuleDesc, setNewModuleDesc] = useState('');
  const [newResourceTitle, setNewResourceTitle] = useState('');
  const [newResourceUrl, setNewResourceUrl] = useState('');
  const [newAssignmentTitle, setNewAssignmentTitle] = useState('');
  const [newAssignmentDesc, setNewAssignmentDesc] = useState('');
  const [newOutcomeInput, setNewOutcomeInput] = useState('');
  const [newSkillInput, setNewSkillInput] = useState('');
  const [newPrereqInput, setNewPrereqInput] = useState('');

  const handleEditProgramClick = (program: Program) => {
    setEditingProgram({
      ...program,
      visibility: program.visibility || 'public',
      status: program.status || 'published',
      skillsCovered: program.skillsCovered || [],
      modules: program.modules || [],
      resources: program.resources || [],
      assignments: program.assignments || [],
      prerequisites: program.prerequisites || [],
      outcomes: program.outcomes || [],
      maxStudents: program.maxStudents || 100,
    });
    setEditFormTab('basics');
    setNewModuleTitle('');
    setNewModuleDesc('');
    setNewResourceTitle('');
    setNewResourceUrl('');
    setNewAssignmentTitle('');
    setNewAssignmentDesc('');
    setNewOutcomeInput('');
    setNewSkillInput('');
    setNewPrereqInput('');
  };

  const handleSaveProgramEdit = async () => {
    if (!editingProgram) return;
    if (!editingProgram.title?.trim()) { notifyError('Program title is required.'); return; }
    if (!editingProgram.description?.trim()) { notifyError('Program description is required.'); return; }
    try {
      const res = await updateProgram(editingProgram.id, editingProgram);
      if (res && !res.error) {
        notifySuccess('Program updated successfully.');
        setEditingProgram(null);
      } else {
        notifyError(res?.error || 'Unable to update program. Please try again.');
      }
    } catch {
      notifyError('Unable to update program. Please try again.');
    }
  };

  return {
    programs,
    isCreatingProgram, setIsCreatingProgram,
    programWizardStep, setProgramWizardStep,
    newProgramData, setNewProgramData,
    editingProgram, setEditingProgram,
    editFormTab, setEditFormTab,
    newModuleTitle, setNewModuleTitle,
    newModuleDesc, setNewModuleDesc,
    newResourceTitle, setNewResourceTitle,
    newResourceUrl, setNewResourceUrl,
    newAssignmentTitle, setNewAssignmentTitle,
    newAssignmentDesc, setNewAssignmentDesc,
    newOutcomeInput, setNewOutcomeInput,
    newSkillInput, setNewSkillInput,
    newPrereqInput, setNewPrereqInput,
    handleEditProgramClick,
    handleSaveProgramEdit,
    addProgram, deleteProgram,
  };
}
