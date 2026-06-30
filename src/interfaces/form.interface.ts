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
  type: 'text' | 'textarea' | 'radio' | 'checkbox' | 'rating' | 'date' | 'file';
  label: string;
  required: boolean;
  options?: string[]; // for radio, checkbox
}

export interface FormSubmission {
  id: string;
  formId: string;
  studentId: string;
  responses: Record<string, any>;
  submittedAt: string;
}
