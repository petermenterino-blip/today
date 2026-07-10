export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  read: boolean;
  type: 'session' | 'task' | 'goal' | 'system' | 'journal' | 'review' | 'announcement' | 'event' | 'form' | 'file' | 'credential' | 'message';
  link?: string;
  createdAt: string;
}
