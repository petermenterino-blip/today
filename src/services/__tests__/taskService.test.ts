import { taskService } from '../taskService';
import type { Mock } from 'vitest';
import type { TaskActivity } from '@/src/types';

const { mockOrder, mockFrom, mockSingle, mockInsertSingle } = vi.hoisted(() => {
  const mSingle = vi.fn();
  const mInsertSingle = vi.fn();
  const mOrder = vi.fn();
  const mInsertSelect = vi.fn(() => ({ single: mInsertSingle }));
  const mSelect = vi.fn(() => ({ eq: vi.fn(() => ({ single: mSingle, order: mOrder })), order: mOrder }));
  const mInsert = vi.fn(() => ({ select: mInsertSelect }));
  const mUpdateEq = vi.fn();
  const mUpdate = vi.fn(() => ({ eq: mUpdateEq }));
  const mDeleteEq = vi.fn();
  const mDelete = vi.fn(() => ({ eq: mDeleteEq }));
  const mFrom = vi.fn(() => ({ select: mSelect, insert: mInsert, update: mUpdate, delete: mDelete }));
  return { mockSingle: mSingle, mockOrder: mOrder, mockFrom: mFrom, mockInsertSingle: mInsertSingle };
});

vi.mock('@/src/lib/supabase', () => ({
  supabase: {
    from: mockFrom,
  },
}));

const mockTaskRow = (overrides = {}): any => ({
  id: 'task-1',
  student_id: 'student-1',
  title: 'Complete Algebra Module',
  description: 'Finish chapters 5-8',
  status: 'pending',
  priority: 'high',
  due_date: '2025-07-15',
  created_at: '2025-06-01T00:00:00Z',
  updated_at: '2025-06-01T00:00:00Z',
  file_url: '',
  feedback: '',
  mentor_response: '',
  student: { name: 'Test Student' },
  ...overrides,
});

describe('taskService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('fetchAll', () => {
    it('returns tasks with student names', async () => {
      mockOrder.mockResolvedValue({
        data: [mockTaskRow(), mockTaskRow({ id: 'task-2', title: 'Research Paper' })],
        error: null,
      });

      const result = await taskService.fetchAll();

      expect(result.error).toBeNull();
      expect(result.data).toHaveLength(2);
      expect(result.data![0].task_title).toBe('Complete Algebra Module');
      expect(result.data![0].user_name).toBe('Test Student');
    });

    it('returns error on failure', async () => {
      mockOrder.mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      });

      const result = await taskService.fetchAll();

      expect(result.data).toBeNull();
      expect(result.error).toBe('Database error');
    });
  });

  describe('fetchByUserId', () => {
    it('returns tasks for specific user', async () => {
      mockOrder.mockResolvedValue({
        data: [mockTaskRow({ student_id: 'student-1' })],
        error: null,
      });

      const result = await taskService.fetchByUserId('student-1');

      expect(result.error).toBeNull();
      expect(result.data).toHaveLength(1);
      expect(result.data![0].user_id).toBe('student-1');
    });

    it('returns empty array when no tasks', async () => {
      mockOrder.mockResolvedValue({ data: [], error: null });

      const result = await taskService.fetchByUserId('student-99');

      expect(result.error).toBeNull();
      expect(result.data).toEqual([]);
    });
  });

  describe('insert', () => {
    it('creates a new task', async () => {
      mockSingle.mockResolvedValue({
        data: { email: 'test@mentorino.com' },
        error: null,
      });
      mockInsertSingle.mockResolvedValue({
        data: mockTaskRow(),
        error: null,
      });

      const result = await taskService.insert({
        user_id: 'student-1',
        task_title: 'Complete Algebra Module',
        description: 'Finish chapters 5-8',
        status: 'pending',
        priority: 'high',
        due_date: '2025-07-15',
      });

      expect(result.error).toBeNull();
      expect(result.data).not.toBeNull();
      expect(result.data!.task_title).toBe('Complete Algebra Module');
    });

    it('returns error on insert failure', async () => {
      mockInsertSingle.mockResolvedValue({
        data: null,
        error: { message: 'Insert failed' },
      });

      const result = await taskService.insert({
        user_id: 'student-1',
        task_title: 'Test',
        status: 'pending',
      });

      expect(result.data).toBeNull();
      expect(result.error).toBe('Insert failed');
    });
  });

  describe('updateStatus', () => {
    it('updates task status', async () => {
      const mockSingleFn = vi.fn().mockResolvedValue({
        data: { student_id: 'student-1', mentor_id: 'mentor-1', title: 'Test Task' },
        error: null,
      });
      const mockUpdateEq = vi.fn().mockResolvedValue({ error: null });

      mockFrom
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ single: mockSingleFn }) }),
        })
        .mockReturnValueOnce({
          update: vi.fn(() => ({ eq: mockUpdateEq })),
        });

      const result = await taskService.updateStatus('task-1', 'completed', 'Great work!');

      expect(result.error).toBeNull();
    });
  });

  describe('delete', () => {
    it('deletes a task', async () => {
      const mockDeleteEq = vi.fn().mockResolvedValue({ error: null });

      mockFrom.mockReturnValue({
        select: vi.fn(),
        delete: vi.fn(() => ({ eq: mockDeleteEq })),
      });

      const result = await taskService.delete('task-1');

      expect(result.error).toBeNull();
    });

    it('returns error on delete failure', async () => {
      const mockDeleteEq = vi.fn().mockResolvedValue({ error: { message: 'Delete failed' } });

      mockFrom.mockReturnValue({
        select: vi.fn(),
        delete: vi.fn(() => ({ eq: mockDeleteEq })),
      });

      const result = await taskService.delete('task-1');

      expect(result.error).toBe('Delete failed');
    });
  });
});
