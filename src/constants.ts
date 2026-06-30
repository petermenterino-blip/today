import { Product, Application, Booking, Transaction, User, Announcement, ResourceLink } from './types';

// Zero out mock data for production-readiness as requested
export const MOCK_PRODUCTS: Product[] = [
  { id: 'prod-1', name: 'Career Execution Plan', description: '12-week roadmap for career transition.', price: 499, image: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&q=80&w=800', category: 'Program', salesCount: 47, status: 'active' },
  { id: 'prod-2', name: 'Resume + LinkedIn Audit', description: 'Professional review of resume and profile.', price: 250, image: 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?auto=format&fit=crop&q=80&w=800', category: 'Service', salesCount: 89, status: 'active' },
  { id: 'prod-3', name: 'Mock Interview Package', description: '3-session interview preparation.', price: 750, image: 'https://images.unsplash.com/photo-1577962917306-fd29db157834?auto=format&fit=crop&q=80&w=800', category: 'Program', salesCount: 23, status: 'active' },
];
export const MOCK_STUDENTS: User[] = [
  { id: 'student-1', email: 'student@example.com', name: 'Alex Student', role: 'student', created_at: '2026-01-15' },
  { id: 'student-2', email: 'jane@example.com', name: 'Jane Smith', role: 'student', created_at: '2026-02-01' },
];
export const MOCK_APPLICATIONS: Application[] = [
  { id: 'app-1', user_email: 'student@example.com', full_name: 'Alex Student', goal: 'Career transition to UX design', status: 'approved', created_at: '2026-01-15' },
];
export const MOCK_BOOKINGS: Booking[] = [
  { id: 'bk-1', user_id: 'student-1', user_name: 'Alex Student', date: '2026-06-15', time: '10:00 AM', status: 'confirmed' },
];
export const MOCK_TRANSACTIONS: Transaction[] = [
  { id: 'tx-1', user_name: 'Alex Student', amount: 499, date: '2026-05-20', product: 'Career Execution Plan', status: 'successful' },
  { id: 'tx-2', user_name: 'Jane Smith', amount: 250, date: '2026-05-22', product: 'Resume Audit', status: 'successful' },
];
export const MOCK_ANNOUNCEMENTS: Announcement[] = [
  { id: 'ann-1', title: 'New Workshop Series', content: 'Starting next week', priority: 'medium', created_at: '2026-05-01' },
];
export const MOCK_RESOURCE_LINKS: ResourceLink[] = [
  { id: 'res-1', title: 'Portfolio Guide', url: 'https://example.com', category: 'Design', is_pinned: true },
];

export const PLAN_DETAILS = {
  basic: {
    name: 'Foundation',
    price: 0,
    features: ['Community Access', 'Curated Newsletter', 'Public Workshops']
  },
  premium: {
    name: 'Execution',
    price: 499,
    features: ['1:1 Strategy Sessions', 'Personalized Roadmap', 'The Vault Access', 'Priority Support']
  }
};
