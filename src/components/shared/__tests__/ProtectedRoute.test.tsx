import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

const {
  mockGetCurrentUser, mockSignIn, mockSignUp, mockSignOut,
  mockResetPassword, mockUpdatePassword, mockOnAuthStateChange,
} = vi.hoisted(() => ({
  mockGetCurrentUser: vi.fn(),
  mockSignIn: vi.fn(),
  mockSignUp: vi.fn(),
  mockSignOut: vi.fn(),
  mockResetPassword: vi.fn(),
  mockUpdatePassword: vi.fn(),
  mockOnAuthStateChange: vi.fn(() => vi.fn()),
}));

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
  interpretError: vi.fn((err: string | null) => err || ''),
}));

vi.mock('@/src/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

vi.mock('@/src/lib/idleRecovery', () => ({
  idleRecovery: { configure: vi.fn() },
}));

import { AuthProvider } from '../../../context/AuthContext';
import ProtectedRoute from '../ProtectedRoute';

function renderProtected(initialEntries: string[], element: React.ReactElement) {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <Routes>
        <Route path="/protected" element={<AuthProvider>{element}</AuthProvider>} />
        <Route path="/auth" element={<div data-testid="auth-page">Auth Page</div>} />
        <Route path="/pending-approval" element={<div data-testid="pending-page">Pending Approval</div>} />
        <Route path="/" element={<div data-testid="home-page">Home</div>} />
      </Routes>
    </MemoryRouter>
  );
}

describe('ProtectedRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetCurrentUser.mockResolvedValue({ data: null, error: 'No active session' });
  });

  it('shows loading spinner when authLoading is true', () => {
    mockGetCurrentUser.mockImplementation(() => new Promise(() => {}));

    renderProtected(
      ['/protected'],
      <ProtectedRoute>
        <div data-testid="child">Protected Content</div>
      </ProtectedRoute>
    );

    expect(screen.getByText('Authenticating')).toBeInTheDocument();
    expect(screen.queryByTestId('child')).not.toBeInTheDocument();
  });

  it('redirects to /auth when no user', async () => {
    renderProtected(
      ['/protected'],
      <ProtectedRoute allowedRoles={['student']}>
        <div data-testid="child">Protected Content</div>
      </ProtectedRoute>
    );

    await waitFor(() => {
      expect(screen.getByTestId('auth-page')).toBeInTheDocument();
    });

    expect(screen.queryByTestId('child')).not.toBeInTheDocument();
  });

  it('renders children when user has allowed role', async () => {
    mockGetCurrentUser.mockResolvedValue({
      data: {
        id: 'user-1',
        email: 'student@test.com',
        name: 'Student User',
        role: 'student',
        created_at: '2025-01-01T00:00:00Z',
      },
      error: null,
    });

    renderProtected(
      ['/protected'],
      <ProtectedRoute allowedRoles={['student']}>
        <div data-testid="child">Protected Content</div>
      </ProtectedRoute>
    );

    await waitFor(() => {
      expect(screen.getByTestId('child')).toBeInTheDocument();
    });

    expect(screen.queryByTestId('auth-page')).not.toBeInTheDocument();
  });

  it('redirects mentor to / when role not in allowedRoles', async () => {
    mockGetCurrentUser.mockResolvedValue({
      data: {
        id: 'mentor-1',
        email: 'mentor@test.com',
        name: 'Mentor User',
        role: 'mentor',
        created_at: '2025-01-01T00:00:00Z',
      },
      error: null,
    });

    renderProtected(
      ['/protected'],
      <ProtectedRoute allowedRoles={['student']}>
        <div data-testid="child">Protected Content</div>
      </ProtectedRoute>
    );

    await waitFor(() => {
      expect(screen.getByTestId('home-page')).toBeInTheDocument();
    });

    expect(screen.queryByTestId('child')).not.toBeInTheDocument();
  });

  it('renders children for student with pending status when role matches allowedRoles', async () => {
    mockGetCurrentUser.mockResolvedValue({
      data: {
        id: 'student-1',
        email: 'student@test.com',
        name: 'Student User',
        role: 'student',
        created_at: '2025-01-01T00:00:00Z',
        application_status: 'pending',
      },
      error: null,
    });

    renderProtected(
      ['/protected'],
      <ProtectedRoute allowedRoles={['student']}>
        <div data-testid="child">Protected Content</div>
      </ProtectedRoute>
    );

    await waitFor(() => {
      expect(screen.getByTestId('child')).toBeInTheDocument();
    });
  });

  it('redirects visitor to /auth when no allowedRoles specified but not logged in', async () => {
    mockGetCurrentUser.mockResolvedValue({ data: null, error: 'No active session' });

    renderProtected(
      ['/protected'],
      <ProtectedRoute>
        <div data-testid="child">Protected Content</div>
      </ProtectedRoute>
    );

    await waitFor(() => {
      expect(screen.getByTestId('auth-page')).toBeInTheDocument();
    });
  });

  it('renders children when no allowedRoles specified and logged in', async () => {
    mockGetCurrentUser.mockResolvedValue({
      data: {
        id: 'user-1',
        email: 'user@test.com',
        name: 'Any User',
        role: 'student',
        created_at: '2025-01-01T00:00:00Z',
      },
      error: null,
    });

    renderProtected(
      ['/protected'],
      <ProtectedRoute>
        <div data-testid="child">Protected Content</div>
      </ProtectedRoute>
    );

    await waitFor(() => {
      expect(screen.getByTestId('child')).toBeInTheDocument();
    });
  });
});
