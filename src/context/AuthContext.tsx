import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { User, UserRole } from '../types';
import { authService, UserProfileDetails } from '../services/authService';
import { interpretError } from '../lib/errorHandler';
import { logger } from '../lib/logger';
import { idleRecovery } from '../lib/idleRecovery';

interface AuthContextType {
  user: (User & { profile?: UserProfileDetails }) | null;
  role: UserRole;
  authLoading: boolean;
  authError: string | null;
  login: (email: string, password: string) => Promise<User & { profile?: UserProfileDetails }>;
  signup: (email: string, password: string, fullName: string) => Promise<void>;
  logout: () => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (password: string) => Promise<void>;
  clearError: () => void;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<(User & { profile?: UserProfileDetails }) | null>(null);
  const [role, setRole] = useState<UserRole>('visitor');
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const loginInProgress = React.useRef(false);

  const clearError = useCallback(() => setAuthError(null), []);

  const refreshSession = useCallback(async () => {
    try {
      logger.info('AuthContext', 'Refreshing auth session');
      const profileRes = await authService.getCurrentUser();
      if (profileRes.data) {
        setUser(profileRes.data);
        setRole(profileRes.data.role);
        logger.info('AuthContext', 'Session refreshed successfully', { role: profileRes.data.role });
      }
    } catch (err: any) {
      logger.warn('AuthContext', 'Session refresh failed, continuing with existing session', {
        error: err?.message,
      });
      setAuthError(interpretError(err?.message || 'Connection failed. Please check your internet.'));
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    let initialized = false;

    const AUTH_INIT_TIMEOUT = 15000;
    const timeoutId = setTimeout(() => {
      if (mounted && !initialized) {
        logger.warn('AuthContext', 'Auth init timed out, proceeding as visitor');
        initialized = true;
        setAuthLoading(false);
      }
    }, AUTH_INIT_TIMEOUT);

    const initializeSession = async () => {
      try {
        const profileRes = await authService.getCurrentUser();
        if (mounted) {
          if (profileRes.data) {
            setUser(profileRes.data);
            setRole(profileRes.data.role);
          } else {
            setUser(null);
            setRole('visitor');
          }
        }
      } catch (err: any) {
        if (mounted) {
          logger.error('AuthContext', 'Failed to initialize session', { error: err?.message });
        }
      } finally {
        clearTimeout(timeoutId);
        if (mounted) {
          initialized = true;
          setAuthLoading(false);
        }
      }
    };
    initializeSession();

    const unsubscribe = authService.onAuthStateChange((user) => {
      if (!mounted || !initialized) return;
      if (loginInProgress.current) return;
      if (user) {
        setUser((user.role ? user : { ...user, role: 'visitor' }) as any);
        setRole(user.role || 'visitor');
      } else {
        setUser(null);
        setRole('visitor');
      }
    });

    const handleProfileChange = async () => {
      if (!initialized) return;
      try {
        const { data } = await authService.getCurrentUser();
        if (data && mounted) {
          setUser(data);
          setRole(data.role);
        }
      } catch {
        logger.warn('AuthContext', 'Profile change handler failed');
      }
    };
    window.addEventListener('user-profile-changed', handleProfileChange);

    idleRecovery.configure({
      onSessionValidate: async () => {
        logger.info('AuthContext', 'Validating session after idle');
        if (initialized) await initializeSession();
      },
    });

    return () => {
      mounted = false;
      window.removeEventListener('user-profile-changed', handleProfileChange);
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string): Promise<User & { profile?: UserProfileDetails }> => {
    loginInProgress.current = true;
    setAuthLoading(true);
    setAuthError(null);
    try {
      const { data, error } = await authService.signIn(email, password);
      if (error || !data) {
        setAuthError(interpretError(error));
        throw new Error(error || 'Login failed');
      }
      setUser(data.role ? data : { ...data, role: data.role || 'visitor' });
      setRole(data.role || 'visitor');
      return data;
    } finally {
      setAuthLoading(false);
      loginInProgress.current = false;
    }
  };

  const signup = async (email: string, password: string, fullName: string): Promise<void> => {
    loginInProgress.current = true;
    setAuthLoading(true);
    setAuthError(null);
    try {
      const { data, error } = await authService.signUp(email, password, fullName);
      if (error || !data) {
        setAuthError(interpretError(error));
        throw new Error(error || 'Signup failed');
      }
    } finally {
      setAuthLoading(false);
      loginInProgress.current = false;
    }
  };

  const logout = async () => {
    setAuthLoading(true);
    setAuthError(null);
    try {
      await authService.signOut();
    } catch {}
    setUser(null);
    setRole('visitor');
    setAuthLoading(false);
  };

  const forgotPassword = async (email: string): Promise<void> => {
    setAuthError(null);
    const { error } = await authService.resetPassword(email);
    if (error) {
      setAuthError(interpretError(error));
      throw new Error(error);
    }
  };

  const resetPassword = async (password: string): Promise<void> => {
    setAuthError(null);
    const { error } = await authService.updatePassword(password);
    if (error) {
      setAuthError(interpretError(error));
      throw new Error(error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, role, authLoading, authError, login, signup, logout, forgotPassword, resetPassword, clearError, refreshSession }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
