export type UserRole = 'student' | 'mentor' | 'visitor';

export interface Session {
  id: string;
  mentorId: string;
  studentId: string;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  meetingUrl?: string;
  recordingUrl?: string;
  attendanceStatus: 'attended' | 'missed' | 'late' | 'pending';
  notes?: string;
  createdAt: string;
  updatedAt: string;
  programId?: string;
  duration?: string;
  timezone?: string;
  meetingType?: 'Google Meet' | 'Zoom' | 'Offline';
  sessionType?: string;
  recurringSession?: boolean;
  reminderTime?: string;
  attachedFiles?: string;
  status?: 'scheduled' | 'cancelled' | 'completed';
  internalNotes?: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  created_at: string;
  application_status?: 'pending' | 'approved' | 'rejected' | null;
}

export interface Application {
  id: string;
  user_id?: string;
  user_name?: string;
  user_email: string;
  full_name: string;
  linkedin_url?: string;
  portfolio_url?: string;
  resume_link?: string;
  goal: string;
  message_to_mentor?: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  mentor_type?: string;
  phone?: string;
  meeting_preference?: 'Virtual' | 'In-Person' | 'Hybrid';
  frequency?: string;
  seriousness?: number;
  location?: string;
  focus_area?: string;
  program_id?: string;
  role_selected?: string;
  top_strength?: string;
  needs_focus?: string;
}

export interface StudentProfile {
  user_id: string;
  id?: string; // Compatibility with interfaces/student.interface.ts
  name?: string;
  email?: string;
  linkedin_url: string;
  resume_link: string;
  bio: string;
  specialization: string;
  current_status: string;
  status?: 'applied' | 'active' | 'at_risk' | 'completed' | 'alumni';
  healthStatus?: 'active' | 'needs_attention' | 'at_risk';
  mentor_id?: string;
  tags?: string[];
  growth_score?: number;
  goal_progress?: number;
  notes?: string;
  metrics?: {
    attendanceRate: number;
    goalCompletionRate: number;
    activityLevel: number;
  };
}

export interface TaskActivity {
  id: string;
  user_id: string;
  mentor_id?: string;
  user_name: string;
  status: 'pending' | 'in_progress' | 'submitted' | 'completed' | 'reviewed' | 'approved' | 'rejected';
  mentor_response?: string;
  created_at: string;
  program_id?: string;
  task_title?: string;
  description?: string;
  due_date?: string;
  priority?: 'low' | 'medium' | 'high';
  file_url?: string;
  feedback?: string;
  
  // Form 2 / Growth Audit fields
  pb_card_details?: string;
  pb_linkedin_url?: string;
  pb_resume_link?: string;
  pb_brand_vision?: string;
  pb_card_creation?: boolean;
  pb_linkedin_review?: boolean;
  pb_resume_review?: boolean;
  pb_cover_letter?: boolean;
  pb_dress_code?: boolean;
  pb_greeting_intro?: boolean;
  roadmap_topic?: string;
  interview_recommendation?: string;
  net_attended_event?: string;
  net_people_met?: string;
  net_contact_info?: string;
  net_panel_summary?: string;
  pw_introduction?: string;
  pw_volunteer_hours?: string;
  cert_topic?: string;
}

export interface StudentTag {
  id: string;
  label: string;
  color: string;
}

export interface SharedFile {
  id: string;
  user_id: string;
  name: string;
  url: string;
  type: 'PDF' | 'Resume' | 'Portfolio' | 'Figma' | 'GitHub' | 'Google Drive' | 'Other';
  category: string;
  shared_at: string;
}

export interface FormField {
  id: string;
  type: 'short_text' | 'paragraph' | 'multiple_choice' | 'checkboxes' | 'rating' | 'date';
  label: string;
  required: boolean;
  options?: string[];
}

export interface CustomForm {
  id: string;
  title: string;
  description: string;
  fields: FormField[];
  assigned_to: string[]; // user ids
  created_at: string;
}

export interface FormSubmission {
  id: string;
  form_id: string;
  user_id: string;
  user_name: string;
  responses: Record<string, any>;
  submitted_at: string;
}

export interface DayAvailability {
  day: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';
  enabled: boolean;
  startTime: string;
  endTime: string;
}

export interface MentorAvailability {
  id: string;
  mentor_id: string;
  days: DayAvailability[];
}

export interface Booking {
  id: string;
  user_id: string;
  mentor_id?: string;
  user_name: string;
  date: string;
  time: string;
  type?: string;
  status: 'confirmed' | 'cancelled' | 'upcoming' | 'completed';
  program_id?: string;
  created_at?: string;
  meeting_link?: string;
  notes?: string;
  attendance?: 'present' | 'absent' | 'excused';
}

export interface EventRegistration {
  userId: string;
  name: string;
  email: string;
  program: string;
  registrationDate: string;
  status: 'confirmed' | 'pending' | 'cancelled';
  attendanceStatus?: 'none' | 'attended' | 'absent';
}

export interface EventFile {
  id: string;
  name: string;
  type: 'slides' | 'pdf' | 'assignment' | 'recording' | 'resource';
  url: string;
  size?: string;
  uploadedAt: string;
}

export interface EventRecording {
  type: 'zoom' | 'google_meet' | 'youtube' | 'other';
  url: string;
  notes?: string;
}

export interface EventFeedback {
  id: string;
  rating: number;
  studentName: string;
  comment: string;
  suggestion?: string;
  date: string;
}

export interface NetworkEvent {
  id: string;
  title: string;
  date: string;
  time: string; // Start Time
  category?: string;
  endTime?: string;
  timezone?: string;
  location: string; // Meeting Platform (Zoom / Google Meet / Offline)
  meetingLink?: string;
  venue?: string;
  image?: string; // Banner Image
  capacity?: number; // Maximum Participants
  registrationDeadline?: string;
  speaker?: string; // Speaker/Mentor
  visibility?: 'public' | 'private';
  status?: 'draft' | 'published' | 'cancelled' | 'completed';
  tags?: string;
  description: string;
  attendees: string[]; // user ids
  registrations?: EventRegistration[];
  files?: EventFile[];
  recording?: EventRecording;
  feedbacks?: EventFeedback[];
  coverImage?: string;
  duration?: string;
  waitlistLimit?: number;
  resourceFiles?: string;
  requirements?: string;
  eventColor?: string;
  auditLogs?: { editedBy: string; timestamp: string; changedFields: string[] }[];
}

export interface AIChatMessage {
  role: 'user' | 'model';
  content: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
  salesCount: number;
  status: 'active' | 'inactive';
}

export interface Transaction {
  id: string;
  user_name: string;
  amount: number;
  date: string;
  product: string;
  status: 'successful' | 'failed' | 'pending';
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  priority: 'low' | 'medium' | 'high';
  created_at: string;
  program_type?: string;
}

export interface ResourceLink {
  id: string;
  title: string;
  url: string;
  category: string;
  is_pinned: boolean;
}

export interface Program {
  id: string;
  title: string;
  description: string;
  duration?: string;
  mentor?: string;
  image?: string;
  category?: string;
  difficulty?: 'Beginner' | 'Intermediate' | 'Advanced';
  outcomes?: string[];
  progress: number;
  status: 'active' | 'completed' | 'not_started' | 'draft' | 'published';
  studentCount?: number;
  visibility?: 'public' | 'private';
  skillsCovered?: string[];
  modules?: { id: string; title: string; description?: string }[];
  resources?: { id: string; title: string; url?: string }[];
  assignments?: { id: string; title: string; description?: string }[];
  prerequisites?: string[];
  maxStudents?: number;
}

export interface Topic {
  id: string;
  title: string;
}

export interface Quiz {
  question: string;
  options: string[];
  correctIndex: number;
}

export interface Assignment {
  title: string;
  description: string;
}

export interface Lesson {
  id: string;
  title: string;
  videoUrl?: string;
  duration?: string;
  topics: Topic[];
  quiz?: Quiz;
  assignment?: Assignment;
}

export interface Module {
  id: string;
  title: string;
  description: string;
  lessons: Lesson[];
}

export interface ServiceResponse<T> {
  data: T | null;
  error: string | null;
}

export * from './messaging';
