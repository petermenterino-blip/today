import { authService } from '../authService';
import type { Mock } from 'vitest';

const { mockSingle, mockFrom, mockSignIn, mockSignUp, mockSignOut, mockGetSession, mockResetPassword, mockUpdateUser } = vi.hoisted(() => {
  const mSingle = vi.fn();
  const mOrder = vi.fn();
  const mEq = vi.fn(() => ({ single: mSingle, order: mOrder }));
  const mSelect = vi.fn(() => ({ eq: mEq }));
  const mFrom = vi.fn(() => ({ select: mSelect }));

  return {
    mockSingle: mSingle,
    mockFrom: mFrom,
    mockSignIn: vi.fn(),
    mockSignUp: vi.fn(),
    mockSignOut: vi.fn(),
    mockGetSession: vi.fn(),
    mockResetPassword: vi.fn(),
    mockUpdateUser: vi.fn(),
  };
});

vi.mock('@/src/lib/supabase', () => ({
  supabase: {
    auth: {
      signInWithPassword: mockSignIn,
      signUp: mockSignUp,
      signOut: mockSignOut,
      getSession: mockGetSession,
      resetPasswordForEmail: mockResetPassword,
      updateUser: mockUpdateUser,
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } },
      })),
    },
    from: mockFrom,
  },
}));

describe('authService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv('VITE_SUPABASE_URL', 'https://test.supabase.co');
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'test-key');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe('signIn', () => {
    it('returns error when supabase not configured', async () => {
      vi.stubEnv('VITE_SUPABASE_URL', 'your_supabase_project_url');

      const result = await authService.signIn('test@test.com', 'password');

      expect(result.error).toBe('Supabase not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
      expect(result.data).toBeNull();
    });

    it('returns error on failed login', async () => {
      mockSignIn.mockResolvedValue({
        data: { user: null },
        error: { message: 'Invalid login credentials' },
      });

      const result = await authService.signIn('test@test.com', 'wrong');

      expect(result.error).toBe('Invalid login credentials');
      expect(result.data).toBeNull();
    });

    it('returns user data on successful login', async () => {
      mockSignIn.mockResolvedValue({
        data: {
          user: {
            id: 'user-1',
            email: 'test@mentorino.com',
            created_at: '2025-01-01T00:00:00Z',
            user_metadata: { full_name: 'Test User' },
          },
        },
        error: null,
      });

      mockSingle.mockResolvedValue({
        data: {
          id: 'user-1',
          name: 'Test User',
          email: 'test@mentorino.com',
          role: 'student',
          created_at: '2025-01-01T00:00:00Z',
        },
        error: null,
      });

      const result = await authService.signIn('test@mentorino.com', 'correct');

      expect(result.error).toBeNull();
      expect(result.data).not.toBeNull();
      expect(result.data!.id).toBe('user-1');
      expect(result.data!.email).toBe('test@mentorino.com');
      expect(result.data!.name).toBe('Test User');
      expect(result.data!.role).toBe('student');
    });

    it('returns Login failed when no user returned', async () => {
      mockSignIn.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      const result = await authService.signIn('test@test.com', 'password');

      expect(result.error).toBe('Login failed');
    });
  });

  describe('signUp', () => {
    it('returns error when supabase not configured', async () => {
      vi.stubEnv('VITE_SUPABASE_URL', 'your_supabase_project_url');

      const result = await authService.signUp('test@test.com', 'pass', 'Test');

      expect(result.error).toContain('Supabase not configured');
    });

    it('creates user with student role on signup', async () => {
      mockSignUp.mockResolvedValue({
        data: {
          user: {
            id: 'user-2',
            email: 'new@mentorino.com',
            created_at: '2025-06-01T00:00:00Z',
          },
        },
        error: null,
      });

      const result = await authService.signUp('new@mentorino.com', 'Str0ng!Pass', 'New User');

      expect(result.error).toBeNull();
      expect(result.data!.role).toBe('student');
      expect(result.data!.email).toBe('new@mentorino.com');
      expect(result.data!.name).toBe('New User');
      expect(mockSignUp).toHaveBeenCalledWith({
        email: 'new@mentorino.com',
        password: 'Str0ng!Pass',
        options: { data: { full_name: 'New User', role: 'student' } },
      });
    });

    it('returns error on signup failure', async () => {
      mockSignUp.mockResolvedValue({
        data: { user: null },
        error: { message: 'User already registered' },
      });

      const result = await authService.signUp('existing@test.com', 'pass', 'Existing');

      expect(result.error).toBe('User already registered');
    });
  });

  describe('signOut', () => {
    it('succeeds silently when supabase not configured', async () => {
      vi.stubEnv('VITE_SUPABASE_URL', 'your_supabase_project_url');

      const result = await authService.signOut();

      expect(result.error).toBeNull();
    });

    it('signs out successfully', async () => {
      mockSignOut.mockResolvedValue({ error: null });

      const result = await authService.signOut();

      expect(result.error).toBeNull();
    });
  });

  describe('getCurrentUser', () => {
    it('returns error when no active session', async () => {
      mockGetSession.mockResolvedValue({
        data: { session: null },
        error: null,
      });

      const result = await authService.getCurrentUser();

      expect(result.error).toBe('No active session');
      expect(result.data).toBeNull();
    });

    it('returns user data from active session', async () => {
      mockGetSession.mockResolvedValue({
        data: {
          session: {
            user: {
              id: 'user-1',
              email: 'test@mentorino.com',
              created_at: '2025-01-01T00:00:00Z',
              user_metadata: { full_name: 'Test User' },
            },
          },
        },
        error: null,
      });

      mockSingle.mockResolvedValue({
        data: {
          id: 'user-1',
          name: 'Test User',
          email: 'test@mentorino.com',
          role: 'student',
          created_at: '2025-01-01T00:00:00Z',
        },
        error: null,
      });

      const result = await authService.getCurrentUser();

      expect(result.error).toBeNull();
      expect(result.data!.id).toBe('user-1');
      expect(result.data!.email).toBe('test@mentorino.com');
    });
  });

  describe('resetPassword', () => {
    it('sends reset email', async () => {
      mockResetPassword.mockResolvedValue({ error: null });

      const result = await authService.resetPassword('test@mentorino.com');

      expect(result.error).toBeNull();
      expect(mockResetPassword).toHaveBeenCalledWith('test@mentorino.com');
    });
  });

  describe('updatePassword', () => {
    it('updates user password', async () => {
      mockUpdateUser.mockResolvedValue({ error: null });

      const result = await authService.updatePassword('NewStr0ng!Pass');

      expect(result.error).toBeNull();
      expect(mockUpdateUser).toHaveBeenCalledWith({ password: 'NewStr0ng!Pass' });
    });
  });
});
