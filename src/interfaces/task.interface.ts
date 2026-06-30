export interface ActionItem {
  id: string;
  studentId: string;
  mentorId: string;
  title: string;
  description: string;
  dueDate: string;
  status: 'pending' | 'in_progress' | 'submitted' | 'completed';
  createdAt: string;
  updatedAt: string;
}
