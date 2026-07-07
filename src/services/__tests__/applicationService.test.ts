import { applicationService } from '../applicationService';
import type { Mock } from 'vitest';

const { mockFrom, mockSingle, mockMaybeSingle } = vi.hoisted(() => {
  const mSingle = vi.fn();
  const mMaybeSingle = vi.fn();
  const mOrder = vi.fn();
  const mLimit = vi.fn();
  const mEq = vi.fn(() => ({ single: mSingle, maybeSingle: mMaybeSingle, order: mOrder, limit: mLimit }));
  const mSelect = vi.fn(() => ({ eq: mEq, order: mOrder, single: mSingle, maybeSingle: mMaybeSingle, limit: mLimit }));
  const mInsertSingle = vi.fn();
  const mInsertSelect = vi.fn(() => ({ single: mInsertSingle }));
  const mInsert = vi.fn(() => ({ select: mInsertSelect }));
  const mUpdateEq = vi.fn();
  const mUpdate = vi.fn(() => ({ eq: mUpdateEq }));
  const mDeleteEq = vi.fn();
  const mDelete = vi.fn(() => ({ eq: mDeleteEq }));
  const mUpsert = vi.fn().mockResolvedValue({ error: null });
  const mFrom = vi.fn(() => ({ select: mSelect, insert: mInsert, update: mUpdate, delete: mDelete, upsert: mUpsert }));
  return { mockFrom: mFrom, mockSingle: mSingle, mockMaybeSingle: mMaybeSingle };
});

const { mockSignUp } = vi.hoisted(() => ({
  mockSignUp: vi.fn(),
}));

vi.mock('../../config/features', () => ({
  features: {
    get edgeApproval() { return false },
    get transactionalProvisioning() { return false },
  },
}))

vi.mock('@/src/lib/supabase', () => ({
  supabase: {
    auth: { signUp: mockSignUp },
    from: mockFrom,
  },
}));

const mockRow = (overrides = {}): any => ({
  id: 'app-1',
  user_id: null,
  email: 'test@mentorino.com',
  first_name: 'Test',
  last_name: 'User',
  phone_number: '+1 555-0000',
  discipline: 'Career Strategist',
  reason_for_applying: { goals: 'Career growth', linkedin_url: '', resume_link: '' },
  status: 'pending_review',
  meeting_preference: 'Virtual',
  frequency: 'Weekly',
  seriousness: 8,
  location: 'Remote',
  program_id: '1',
  role_selected: 'student',
  created_at: '2025-06-01T00:00:00Z',
  updated_at: '2025-06-01T00:00:00Z',
  ...overrides,
});

describe('applicationService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('submitApplication', () => {
    it('submits an application successfully', async () => {
      mockFrom.mockReturnValue({
        insert: vi.fn().mockResolvedValue({
          data: [mockRow()],
          error: null,
        }),
        select: vi.fn(),
      });

      const result = await applicationService.submitApplication({
        user_email: 'test@mentorino.com',
        full_name: 'Test User',
        goal: 'Career growth and professional development are my primary objectives as I look to advance in my field and take on more leadership responsibilities within my organization while also building a strong personal brand and network of industry peers who can support my journey toward becoming a thought leader in my domain of expertise which requires consistent effort dedication and a willingness to learn from experienced mentors who have walked this path before me and can provide the guidance and accountability necessary to achieve these ambitious but achievable goals',
        mentor_type: 'Career Strategist',
        phone: '+1 555-0000',
      });

      expect(result.error).toBeNull();
      expect(result.data).not.toBeNull();
      expect(result.data!.user_email).toBe('test@mentorino.com');
    });

    it('rejects goal with fewer than 50 words', async () => {
      const result = await applicationService.submitApplication({
        user_email: 'test@mentorino.com',
        full_name: 'Test User',
        goal: 'Career growth',
        mentor_type: 'Career Strategist',
      });

      expect(result.error).toBe('Please write at least 50 words describing your goals.');
      expect(result.data).toBeNull();
    });

    it('returns error on submission failure', async () => {
      mockFrom.mockReturnValue({
        insert: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Database error' },
        }),
        select: vi.fn(),
      });

      const result = await applicationService.submitApplication({
        user_email: 'test@mentorino.com',
        full_name: 'Test User',
        goal: 'Career growth and professional development are my primary objectives as I look to advance in my field and take on more leadership responsibilities within my organization while also building a strong personal brand and network of industry peers who can support my journey toward becoming a thought leader in my domain of expertise which requires consistent effort dedication and a willingness to learn from experienced mentors who have walked this path before me',
      });

      expect(result.error).toBe('Database error');
      expect(result.data).toBeNull();
    });
  });

  describe('fetchAll', () => {
    it('fetches all applications with mapping', async () => {
      const mockOrderResolve = vi.fn().mockResolvedValue({
        data: [mockRow(), mockRow({ id: 'app-2', email: 'other@test.com', first_name: 'Other' })],
        error: null,
        count: 2,
      });

      const mockEqFn = vi.fn(() => ({ order: mockOrderResolve, single: vi.fn() }));
      const mockOrFn = vi.fn(() => ({ order: mockOrderResolve }));
      const mockSelectResult = {
        eq: mockEqFn,
        or: mockOrFn,
        order: mockOrderResolve,
        range: vi.fn(() => ({ order: mockOrderResolve })),
      };
      mockFrom.mockReturnValue({ select: vi.fn(() => mockSelectResult) });

      const result = await applicationService.fetchAll();

      expect(result.error).toBeNull();
      expect(result.data?.data).toHaveLength(2);
      expect(result.data?.data[0].user_email).toBe('test@mentorino.com');
    });

    it('filters by status', async () => {
      const mockOrderResolve = vi.fn().mockResolvedValue({
        data: [mockRow({ status: 'pending_review' })],
        error: null,
        count: 1,
      });

      const mockEqFn = vi.fn(() => ({ order: mockOrderResolve }));
      const mockSelectResult = { eq: mockEqFn, order: mockOrderResolve };
      mockFrom.mockReturnValue({ select: vi.fn(() => mockSelectResult) });

      const result = await applicationService.fetchAll({ status: 'pending_review' });

      expect(result.error).toBeNull();
      expect(result.data?.data).toHaveLength(1);
    });
  });

  describe('updateStatus', () => {
    it('updates application status to approved', async () => {
      const mockUpdateEq = vi.fn().mockResolvedValue({ error: null });
      mockFrom.mockReturnValue({
        update: vi.fn(() => ({ eq: mockUpdateEq })),
        select: vi.fn(),
      });

      const result = await applicationService.updateStatus('app-1', 'approved');

      expect(result.error).toBeNull();
    });

    it('updates application status to rejected', async () => {
      const mockUpdateEq = vi.fn().mockResolvedValue({ error: null });
      mockFrom.mockReturnValue({
        update: vi.fn(() => ({ eq: mockUpdateEq })),
        select: vi.fn(),
      });

      const result = await applicationService.updateStatus('app-1', 'rejected');

      expect(result.error).toBeNull();
    });
  });

  describe('approveApplication', () => {
    it('approves application and creates user account', async () => {
      const singleMock = vi.fn().mockResolvedValue({
        data: mockRow(),
        error: null,
      });
      const chainResolve = vi.fn().mockResolvedValue({ data: null, error: null });
      const chainMock = vi.fn(() => ({
        single: singleMock,
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
        limit: chainMock,
        order: vi.fn(),
        or: chainMock,
      }));
      const selectMock = vi.fn(() => ({
        eq: chainMock,
        single: singleMock,
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
        limit: chainMock,
        order: vi.fn(),
        or: chainMock,
      }));
      mockFrom.mockReturnValue({
        select: selectMock,
        insert: vi.fn().mockResolvedValue({ data: null, error: null }),
        update: vi.fn(() => ({ eq: vi.fn().mockResolvedValue({ error: null }) })),
        upsert: vi.fn().mockResolvedValue({ error: null }),
      });

      mockSignUp.mockResolvedValue({
        data: { user: { id: 'new-user' } },
        error: null,
      });

      const result = await applicationService.approveApplication('app-1');

      expect(result.error).toBeNull();
      expect(result.data).not.toBeNull();
      expect(result.data.email).toBe('test@mentorino.com');
    });

    it('returns error when application not found', async () => {
      const singleMock = vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Not found' },
      });
      const chainResolve = vi.fn().mockResolvedValue({ data: null, error: null });
      mockFrom.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: singleMock,
            maybeSingle: chainResolve,
            limit: chainResolve,
            order: chainResolve,
          })),
          single: singleMock,
          maybeSingle: chainResolve,
          order: chainResolve,
        })),
      });

      const result = await applicationService.approveApplication('app-999');

      expect(result.error).toContain('Not found');
    });
  });
});
