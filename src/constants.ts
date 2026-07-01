import { Product, Transaction } from './types';

export const MOCK_PRODUCTS: Product[] = [
  { id: 'prod-1', name: 'Career Execution Plan', description: '12-week roadmap for career transition.', price: 499, image: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&q=80&w=800', category: 'Program', salesCount: 47, status: 'active' },
  { id: 'prod-2', name: 'Resume + LinkedIn Audit', description: 'Professional review of resume and profile.', price: 250, image: 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?auto=format&fit=crop&q=80&w=800', category: 'Service', salesCount: 89, status: 'active' },
  { id: 'prod-3', name: 'Mock Interview Package', description: '3-session interview preparation.', price: 750, image: 'https://images.unsplash.com/photo-1577962917306-fd29db157834?auto=format&fit=crop&q=80&w=800', category: 'Program', salesCount: 23, status: 'active' },
];
export const MOCK_TRANSACTIONS: Transaction[] = [
  { id: 'tx-1', user_name: 'Alex Student', amount: 499, date: '2026-05-20', product: 'Career Execution Plan', status: 'successful' },
  { id: 'tx-2', user_name: 'Jane Smith', amount: 250, date: '2026-05-22', product: 'Resume Audit', status: 'successful' },
];
