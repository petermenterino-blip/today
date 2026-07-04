import { useState } from 'react';
import { useTasks } from '../../../hooks/useTasks';
import { notifySuccess, notifyError } from '../../../utils/toast';
import type { TaskActivity } from '../../../types';

export function useFeedback() {
  const { taskActivities, updateStatus } = useTasks();
  const [selectedTask, setSelectedTask] = useState<TaskActivity | null>(null);
  const [feedbackResponse, setFeedbackResponse] = useState('');

  const pendingTasks = taskActivities.filter(t => t.status === 'pending' || t.status === 'submitted');

  const handleReviewTask = (task: TaskActivity) => {
    setSelectedTask(task);
    setFeedbackResponse(task.mentor_response || '');
  };

  const submitFeedback = async () => {
    if (selectedTask) {
      try {
        await updateStatus(selectedTask.id, 'reviewed', feedbackResponse);
        setSelectedTask(null);
        setFeedbackResponse('');
        notifySuccess('Feedback submitted successfully!');
      } catch (err: any) {
        notifyError(err.message || 'Failed to submit feedback');
      }
    }
  };

  return {
    selectedTask, setSelectedTask,
    feedbackResponse, setFeedbackResponse,
    pendingTasks,
    handleReviewTask,
    submitFeedback,
  };
}
