import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const {
  mockInterpretError,
  mockGetCurrentUser, mockSignIn, mockSignUp, mockSignOut,
  mockResetPassword, mockUpdatePassword, mockOnAuthStateChange,
  authStateChangeCallbacks,
} = vi.hoisted(() => {
  const callbacks: Array<(user: Record<string, unknown> | null) => void> = [];

  return {
    mockInterpretError: vi.fn((err: string | null) => err || ''),
    mockGetCurrentUser: vi.fn(),
    mockSignIn: vi.fn(),
    mockSignUp: vi.fn(),
    mockSignOut: vi.fn(),
    mockResetPassword: vi.fn(),
    mockUpdatePassword: vi.fn(),
    mockOnAuthStateChange: vi.fn((cb: (user: Record<string, unknown> | null) => void) => {
      callbacks.push(cb);
      return vi.fn();
    }),
    authStateChangeCallbacks: callbacks,
  };
});

vi.mock('@/src/services/authService', () => ({
  authService: {
    signIn: mockSignIn,
    signUp: mockSignUp,
    signOut: mockSignOut,
    getCurrentUser: mockGetCurrentUser,
    resetPassword: mockResetPassword,
    updatePassword: mockUpdatePassword,
    onAuthStateChange: mockOnAuthStateChange,
  },
}));

vi.mock('@/src/lib/errorHandler', () => ({
  interpretError: mockInterpretError,
}));

vi.mock('@/src/lib/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

vi.mock('@/src/lib/idleRecovery', () => ({
  idleRecovery: {
    configure: vi.fn(),
  },
}));

import { AuthProvider, useAuth } from '../AuthContext';

function TestConsumer() {
  const auth = useAuth();
  return (
    <div>
      <span data-testid="role">{auth.role}</span>
      <span data-testid="user">{auth.user ? JSON.stringify(auth.user) : 'null'}</span>
      <span data-testid="auth-loading">{String(auth.authLoading)}</span>
      <span data-testid="auth-error">{auth.authError || 'null'}</span>
      <button data-testid="login-btn" onClick={() => auth.login('test@test.com', 'pass').catch(() => {})}>Login</button>
      <button data-testid="logout-btn" onClick={() => auth.logout()}>Logout</button>
      <button data-testid="signup-btn" onClick={() => auth.signup('test@test.com', 'pass', 'Name').catch(() => {})}>Signup</button>
      <button data-testid="forgot-pw-btn" onClick={() => auth.forgotPassword('test@test.com').catch(() => {})}>Forgot PW</button>
      <button data-testid="reset-pw-btn" onClick={() => auth.resetPassword('newpass').catch(() => {})}>Reset PW</button>
      <button data-testid="clear-error-btn" onClick={() => auth.clearError()}>Clear Error</button>
      <button data-testid="refresh-btn" onClick={() => auth.refreshSession()}>Refresh</button>
    </div>
  );
}

function UseAuthOutsideProvider() {
  const auth = useAuth();
  return <span data-testid="role">{auth.role}</span>;
}

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authStateChangeCallbacks.length = 0;
    mockInterpretError.mockImplementation((err: string | null) => err || '');
    mockGetCurrentUser.mockResolvedValue({ data: null, error: 'No active session' });
  });

  describe('initial state', () => {
    it('renders children', async () => {
      render(
        <AuthProvider>
          <div data-testid="child">Hello</div>
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('child')).toBeInTheDocument();
      });
    });

    it('provides default visitor role and null user', async () => {
      render(
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('auth-loading')).toHaveTextContent('false');
      });

      expect(screen.getByTestId('role')).toHaveTextContent('visitor');
      expect(screen.getByTestId('user')).toHaveTextContent('null');
    });

    it('sets authLoading to true during initialization', () => {
      mockGetCurrentUser.mockImplementation(() => new Promise(() => {}));

      render(
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>
      );

      expect(screen.getByTestId('auth-loading')).toHaveTextContent('true');
    });
  });

  describe('useAuth outside provider', () => {
    it('throws error when used outside AuthProvider', () => {
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => render(<UseAuthOutsideProvider />)).toThrow(
        'useAuth must be used within an AuthProvider'
      );

      spy.mockRestore();
    });
  });

  describe('login', () => {
    it('sets user and role on successful login', async () => {
      const userData = {
        id: 'user-1',
        email: 'test@mentorino.com',
        name: 'Test User',
        role: 'student' as const,
        created_at: '2025-01-01T00:00:00Z',
      };

      mockSignIn.mockResolvedValue({ data: userData, error: null });

      render(
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('auth-loading')).toHaveTextContent('false');
      });

      await act(async () => {
        await userEvent.click(screen.getByTestId('login-btn'));
      });

      expect(screen.getByTestId('role')).toHaveTextContent('student');
      expect(screen.getByTestId('auth-error')).toHaveTextContent('null');
    });

    it('sets authError on login failure', async () => {
      mockSignIn.mockResolvedValue({ data: null, error: 'Invalid credentials' });
      mockInterpretError.mockImplementation((err: string | null) => err || '');

      render(
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('auth-loading')).toHaveTextContent('false');
      });

      await act(async () => {
        try { await userEvent.click(screen.getByTestId('login-btn')); } catch {}
      });

      await waitFor(() => {
        expect(screen.getByTestId('auth-error')).toHaveTextContent('Invalid credentials');
      });
    });
  });

  describe('logout', () => {
    it('clears user and sets visitor role on logout', async () => {
      const userData = {
        id: 'user-1',
        email: 'test@mentorino.com',
        name: 'Test User',
        role: 'student' as const,
        created_at: '2025-01-01T00:00:00Z',
      };

      mockSignIn.mockResolvedValue({ data: userData, error: null });
      mockSignOut.mockResolvedValue({ error: null });

      render(
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('auth-loading')).toHaveTextContent('false');
      });

      await act(async () => {
        await userEvent.click(screen.getByTestId('login-btn'));
      });

      expect(screen.getByTestId('role')).toHaveTextContent('student');

      await act(async () => {
        await userEvent.click(screen.getByTestId('logout-btn'));
      });

      expect(screen.getByTestId('role')).toHaveTextContent('visitor');
      expect(screen.getByTestId('user')).toHaveTextContent('null');
    });
  });

  describe('signup', () => {
    it('calls authService.signUp on signup', async () => {
      mockSignUp.mockResolvedValue({ data: { id: 'new-user' }, error: null });

      render(
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('auth-loading')).toHaveTextContent('false');
      });

      await act(async () => {
        await userEvent.click(screen.getByTestId('signup-btn'));
      });

      expect(mockSignUp).toHaveBeenCalledWith('test@test.com', 'pass', 'Name');
      expect(screen.getByTestId('auth-error')).toHaveTextContent('null');
    });

    it('sets authError on signup failure', async () => {
      mockSignUp.mockResolvedValue({ data: null, error: 'Email already in use' });
      mockInterpretError.mockImplementation((err: string | null) => err || '');

      render(
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('auth-loading')).toHaveTextContent('false');
      });

      await act(async () => {
        try { await userEvent.click(screen.getByTestId('signup-btn')); } catch {}
      });

      await waitFor(() => {
        expect(screen.getByTestId('auth-error')).toHaveTextContent('Email already in use');
      });
    });
  });

  describe('forgotPassword', () => {
    it('calls authService.resetPassword on forgotPassword', async () => {
      mockResetPassword.mockResolvedValue({ error: null });

      render(
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('auth-loading')).toHaveTextContent('false');
      });

      await act(async () => {
        await userEvent.click(screen.getByTestId('forgot-pw-btn'));
      });

      expect(mockResetPassword).toHaveBeenCalledWith('test@test.com');
    });

    it('sets authError on forgotPassword failure', async () => {
      mockResetPassword.mockResolvedValue({ error: 'User not found' });
      mockInterpretError.mockImplementation((err: string | null) => err || '');

      render(
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('auth-loading')).toHaveTextContent('false');
      });

      await act(async () => {
        try { await userEvent.click(screen.getByTestId('forgot-pw-btn')); } catch {}
      });

      await waitFor(() => {
        expect(screen.getByTestId('auth-error')).toHaveTextContent('User not found');
      });
    });
  });

  describe('clearError', () => {
    it('clears authError', async () => {
      mockSignIn.mockResolvedValue({ data: null, error: 'Some error' });

      render(
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('auth-loading')).toHaveTextContent('false');
      });

      await act(async () => {
        try { await userEvent.click(screen.getByTestId('login-btn')); } catch {}
      });

      await waitFor(() => {
        expect(screen.getByTestId('auth-error')).toHaveTextContent('Some error');
      });

      await act(async () => {
        await userEvent.click(screen.getByTestId('clear-error-btn'));
      });

      expect(screen.getByTestId('auth-error')).toHaveTextContent('null');
    });
  });

  describe('refreshSession', () => {
    it('sets user from existing session on mount', async () => {
      const existingUser = {
        id: 'existing-user',
        email: 'existing@mentorino.com',
        name: 'Existing User',
        role: 'mentor' as const,
        created_at: '2025-01-01T00:00:00Z',
      };

      mockGetCurrentUser.mockResolvedValue({ data: existingUser, error: null });

      render(
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('auth-loading')).toHaveTextContent('false');
      });

      expect(screen.getByTestId('role')).toHaveTextContent('mentor');
    });
  });

  describe('onAuthStateChange', () => {
    it('updates user on SIGNED_IN via auth state change', async () => {
      mockGetCurrentUser.mockResolvedValue({ data: null, error: 'No active session' });

      render(
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('auth-loading')).toHaveTextContent('false');
      });

      expect(screen.getByTestId('role')).toHaveTextContent('visitor');

      act(() => {
        if (authStateChangeCallbacks.length > 0) {
          authStateChangeCallbacks[0]({
            id: 'user-2',
            email: 'incoming@test.com',
            name: 'Incoming User',
            role: 'mentor',
            created_at: '2025-06-01T00:00:00Z',
          });
        }
      });

      await waitFor(() => {
        expect(screen.getByTestId('role')).toHaveTextContent('mentor');
      });
    });

    it('clears user on SIGNED_OUT via auth state change', async () => {
      render(
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('auth-loading')).toHaveTextContent('false');
      });

      act(() => {
        if (authStateChangeCallbacks.length > 0) {
          authStateChangeCallbacks[0](null);
        }
      });

      await waitFor(() => {
        expect(screen.getByTestId('user')).toHaveTextContent('null');
      });
    });
  });
});
