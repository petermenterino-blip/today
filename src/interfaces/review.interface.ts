export type ReviewStatus = 'draft' | 'assigned' | 'pending' | 'submitted' | 'in_review' | 'completed' | 'archived';
export type ReviewPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface Review {
  id: string;
  student_id: string;
  mentor_id: string;
  program_id?: string;
  title: string;
  description?: string;
  status: ReviewStatus;
  priority: ReviewPriority;
  due_date?: string;
  rating?: number;
  feedback?: string;
  mentor_notes?: string;
  mentor_response?: string;
  student_response?: string;
  tags: string[];
  estimated_review_time?: number;
  completion_percentage: number;
  last_edited_at?: string;
  last_edited_by?: string;
  completed_at?: string;
  source_type?: 'task' | 'journal' | 'form' | 'program_review' | 'manual';
  source_id?: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;

  // Joined fields
  student_name?: string;
  student_email?: string;
  student_avatar?: string;
  mentor_name?: string;
  program_name?: string;
}

export interface ReviewHistory {
  id: string;
  review_id: string;
  actor_id?: string;
  from_status?: string;
  to_status: string;
  comment?: string;
  created_at: string;
  actor_name?: string;
}

export interface ReviewStats {
  total: number;
  pending: number;
  completed: number;
  average_rating: number;
  completion_rate: number;
  weekly_count: number;
  monthly_count: number;
  average_review_time: number;
}
