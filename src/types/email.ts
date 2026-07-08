export interface EmailTemplate {
  id: string;
  key: string;
  subject: string;
  body: string;
  variables: string[];
  updated_at: string;
}

export type EmailType = 'visitor_confirmation' | 'mentor_notification' | 'booking_reminder' | 'booking_update' | 'booking_cancelled' | 'booking_rescheduled' | 'system';

export type BookingType = 'intro' | 'rapid' | 'general';

export type EmailStatus = 'pending' | 'sent' | 'failed' | 'bounced';

export interface EmailLog {
  id: string;
  booking_id?: string;
  recipient_email: string;
  sender_email: string;
  subject: string;
  template_key?: string;
  status: EmailStatus;
  email_type: EmailType;
  booking_type?: BookingType;
  sent_at?: string;
  delivered_at?: string;
  failure_reason?: string;
  created_at: string;
}

export const BOOKING_TEMPLATE_KEYS = {
  VISITOR_CONFIRMATION: 'booking_confirmation_visitor',
  MENTOR_NOTIFICATION: 'booking_notification_mentor',
} as const;

export const MENTOR_NOTIFICATION_EMAIL = 'peter@mentorino.me';
