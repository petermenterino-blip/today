export interface JournalEntry {
  id: string;
  studentId: string;
  type: 'daily' | 'weekly' | 'learning';
  title?: string;
  content: string;
  mood: 'great' | 'good' | 'okay' | 'bad' | 'terrible';
  wins: string[];
  challenges: string[];
  mentorComments?: string[];
  reviewedByMentor: boolean;
  createdAt: string;
  updatedAt: string;
}
