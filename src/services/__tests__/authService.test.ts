import { authService } from '../authService';
import type { Mock } from 'vitest';

interface AuthEventListener {
  (event: string, session: Record<string, unknown> | null): void;
}

const authListenerRef: { current: AuthEventListener | null } = { current: null };

const {
  mockSingle, mockFrom, mockSignIn, mockSignUp, mockSignOut,
  mockGetSession, mockResetPassword, mockUpdateUser, mockOnAuthStateChange,
} = vi.hoisted(() => {
  const mSingle = vi.fn();
  const mOrder = vi.fn();
  const mEq = vi.fn(() => ({ single: mSingle, order: mOrder }));
  const mSelect = vi.fn(() => ({ eq: mEq }));
  const mInsert = vi.fn(() => ({ select: () => ({ single: mSingle }) }));
  const mFrom = vi.fn(() => ({ select: mSelect, insert: mInsert }));

  return {
    mockSingle: mSingle,
    mockFrom: mFrom,
    mockSignIn: vi.fn(),
    mockSignUp: vi.fn(),
    mockSignOut: vi.fn(),
    mockGetSession: vi.fn(),
    mockResetPassword: vi.fn(),
    mockUpdateUser: vi.fn(),
    mockOnAuthStateChange: vi.fn((listener: AuthEventListener) => {
      authListenerRef.current = listener;
      return { data: { subscription: { unsubscribe: vi.fn() } } };
    }),
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
      onAuthStateChange: mockOnAuthStateChange,
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
            email_confirmed_at: '2025-01-01T00:00:00Z',
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

    it('uses metadata role when the profile row is missing', async () => {
      mockSignIn.mockResolvedValue({
        data: {
          user: {
            id: 'mentor-1',
            email: 'mentor@mentorino.com',
            created_at: '2025-01-01T00:00:00Z',
            email_confirmed_at: '2025-01-01T00:00:00Z',
            user_metadata: { full_name: 'Mentor User', role: 'mentor' },
          },
        },
        error: null,
      });

      mockSingle
        .mockResolvedValueOnce({
          data: null,
          error: { code: 'PGRST116', message: 'No rows found' },
        })
        .mockResolvedValueOnce({
          data: {
            id: 'mentor-1',
            name: 'Mentor User',
            email: 'mentor@mentorino.com',
            role: 'mentor',
            created_at: '2025-01-01T00:00:00Z',
          },
          error: null,
        });

      const result = await authService.signIn('mentor@mentorino.com', 'correct');

      expect(result.error).toBeNull();
      expect(result.data!.role).toBe('mentor');
      expect(result.data!.name).toBe('Mentor User');
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
      expect(mockResetPassword).toHaveBeenCalledWith('test@mentorino.com', {
        redirectTo: 'http://localhost:3000/#/reset-password',
      });
    });
  });

  describe('updatePassword', () => {
    it('updates user password', async () => {
      mockUpdateUser.mockResolvedValue({ error: null });

      const result = await authService.updatePassword('NewStr0ng!Pass');

      expect(result.error).toBeNull();
      expect(mockUpdateUser).toHaveBeenCalledWith({ password: 'NewStr0ng!Pass' });
    });

    it('returns error on updatePassword failure', async () => {
      mockUpdateUser.mockResolvedValue({
        data: null,
        error: { message: 'Password too weak' },
      });

      const result = await authService.updatePassword('weak');

      expect(result.error).toBe('Password too weak');
    });
  });

  describe('signIn extended', () => {
    it('returns verification error when email not confirmed', async () => {
      mockSignIn.mockResolvedValue({
        data: {
          user: {
            id: 'user-1',
            email: 'unverified@test.com',
            created_at: '2025-01-01T00:00:00Z',
            email_confirmed_at: null,
            user_metadata: { full_name: 'Unverified' },
          },
        },
        error: null,
      });

      const result = await authService.signIn('unverified@test.com', 'password');

      expect(result.error).toBe('Please verify your email before signing in. Check your inbox for the confirmation link.');
      expect(result.data).toBeNull();
    });

    it('throws on profile fetch permission error', async () => {
      mockSignIn.mockResolvedValue({
        data: {
          user: {
            id: 'user-1',
            email: 'test@mentorino.com',
            created_at: '2025-01-01T00:00:00Z',
            email_confirmed_at: '2025-01-01T00:00:00Z',
            user_metadata: { full_name: 'Test User' },
          },
        },
        error: null,
      });

      mockSingle.mockResolvedValue({
        data: null,
        error: { code: '42501', message: 'permission denied for table profiles' },
      });

      await expect(authService.signIn('test@mentorino.com', 'correct')).rejects.toThrow();
    });
  });

  describe('signUp extended', () => {
    it('returns error when signup returns no user', async () => {
      mockSignUp.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      const result = await authService.signUp('no-user@test.com', 'Str0ng!Pass', 'No User');

      expect(result.error).toBe('Signup failed');
      expect(result.data).toBeNull();
    });
  });

  describe('signOut extended', () => {
    it('returns error on signOut failure', async () => {
      mockSignOut.mockResolvedValue({
        error: { message: 'Network error' },
      });

      const result = await authService.signOut();

      expect(result.error).toBe('Unable to connect. Please check your internet connection.');
    });
  });

  describe('getCurrentUser extended', () => {
    it('returns error when supabase not configured', async () => {
      vi.stubEnv('VITE_SUPABASE_URL', 'your_supabase_project_url');

      const result = await authService.getCurrentUser();

      expect(result.error).toBe('Supabase not configured.');
      expect(result.data).toBeNull();
    });

    it('returns error when getSession fails', async () => {
      mockGetSession.mockResolvedValue({
        data: { session: null },
        error: { message: 'Invalid refresh token' },
      });

      const result = await authService.getCurrentUser();

      expect(result.error).toBe('Your session has expired. Please log in again.');
      expect(result.data).toBeNull();
    });
  });

  describe('resetPassword extended', () => {
    it('returns error on resetPassword failure', async () => {
      mockResetPassword.mockResolvedValue({
        data: null,
        error: { message: 'User not found' },
      });

      const result = await authService.resetPassword('nonexistent@test.com');

      expect(result.error).toBe('The requested resource was not found.');
    });
  });

  describe('getFullProfile', () => {
    it('returns full profile on success', async () => {
      mockSingle.mockResolvedValue({
        data: {
          id: 'user-1',
          name: 'Test User',
          email: 'test@mentorino.com',
          role: 'mentor',
          avatar_url: 'https://example.com/avatar.png',
          application_status: 'approved',
          created_at: '2025-01-01T00:00:00Z',
          phone: '123-456-7890',
          bio: 'A mentor',
          specialization: 'Web Dev',
        },
        error: null,
      });

      const result = await authService.getFullProfile('user-1', 'test@mentorino.com');

      expect(result.error).toBeNull();
      expect(result.data).not.toBeNull();
      expect(result.data!.id).toBe('user-1');
      expect(result.data!.role).toBe('mentor');
      expect(result.data!.profile).toBeDefined();
    });

    it('returns error when supabase not configured', async () => {
      vi.stubEnv('VITE_SUPABASE_URL', 'your_supabase_project_url');

      const result = await authService.getFullProfile('user-1', 'test@test.com');

      expect(result.error).toBe('Supabase not configured.');
      expect(result.data).toBeNull();
    });

    it('returns error when profile fetch fails', async () => {
      mockSingle.mockResolvedValue({
        data: null,
        error: { message: 'Internal server error' },
      });

      const result = await authService.getFullProfile('user-1', 'test@mentorino.com');

      expect(result.error).toBe('Internal server error');
      expect(result.data).toBeNull();
    });
  });

  describe('onAuthStateChange', () => {
    beforeEach(() => {
      authListenerRef.current = null;
    });

    it('returns null when supabase not configured', () => {
      vi.stubEnv('VITE_SUPABASE_URL', 'your_supabase_project_url');

      const unsubscribe = authService.onAuthStateChange(vi.fn());

      expect(unsubscribe).toBeNull();
    });

    it('calls callback on SIGNED_IN event', () => {
      const callback = vi.fn();
      authService.onAuthStateChange(callback);

      expect(authListenerRef.current).not.toBeNull();

      authListenerRef.current!('SIGNED_IN', {
        user: {
          id: 'user-1',
          email: 'test@mentorino.com',
          created_at: '2025-01-01T00:00:00Z',
          user_metadata: { full_name: 'Test User', role: 'student' },
        },
      });

      expect(callback).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'user-1',
          email: 'test@mentorino.com',
          role: 'student',
        })
      );
    });

    it('calls callback on TOKEN_REFRESHED event', () => {
      const callback = vi.fn();
      authService.onAuthStateChange(callback);

      authListenerRef.current!('TOKEN_REFRESHED', {
        user: {
          id: 'user-1',
          email: 'test@mentorino.com',
          created_at: '2025-01-01T00:00:00Z',
          user_metadata: { full_name: 'Test User', role: 'student' },
        },
      });

      expect(callback).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'user-1' })
      );
    });

    it('calls callback with null on SIGNED_OUT event', () => {
      const callback = vi.fn();
      authService.onAuthStateChange(callback);

      authListenerRef.current!('SIGNED_OUT', null);

      expect(callback).toHaveBeenCalledWith(null);
    });

    it('returns unsubscribe function', () => {
      const callback = vi.fn();
      const unsubscribe = authService.onAuthStateChange(callback);

      expect(unsubscribe).toBeInstanceOf(Function);
    });
  });
});
