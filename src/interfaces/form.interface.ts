export interface FormTemplate {
  id: string;
  title: string;
  type: 'weekly_checkin' | 'reflection' | 'feedback' | 'session_prep' | 'survey' | 'program_review';
  fields: FormField[];
  createdAt: string;
  updatedAt: string;
}

export interface FormField {
  id: string;
  type: 'short_text' | 'paragraph' | 'multiple_choice' | 'checkboxes' | 'rating' | 'date';
  label: string;
  required: boolean;
  options?: string[];
}

export interface FormSubmission {
  id: string;
  form_id: string;
  user_id: string;
  user_name: string;
  responses: Record<string, any>;
  submitted_at: string;
}
