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
  const lastUserIdRef = React.useRef<string | null>(null);
  const lastRoleRef = React.useRef<UserRole>('visitor');

  const clearError = useCallback(() => setAuthError(null), []);

  const refreshSession = useCallback(async () => {
    try {
      logger.info('AuthContext', 'Refreshing auth session');
      const profileRes = await authService.getCurrentUser();
      if (profileRes.data) {
        lastUserIdRef.current = profileRes.data.id;
        lastRoleRef.current = profileRes.data.role;
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

    const AUTH_INIT_TIMEOUT = 8000;
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
            lastUserIdRef.current = profileRes.data.id;
            lastRoleRef.current = profileRes.data.role;
            setUser(profileRes.data);
            setRole(profileRes.data.role);
          } else {
            lastUserIdRef.current = null;
            lastRoleRef.current = 'visitor';
            setUser(null);
            setRole('visitor');
          }
        }
      } catch (err: any) {
        if (mounted) {
          logger.error('AuthContext', 'Failed to initialize session', { error: err?.message });
          try {
            const { data: { session } } = await (await import('../lib/supabase')).supabase.auth.getSession();
            if (session?.user) {
              const role = (session.user.user_metadata?.role || session.user.app_metadata?.role || 'visitor') as UserRole;
              const fallbackUser = {
                id: session.user.id,
                email: session.user.email || '',
                name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || '',
                role,
                created_at: session.user.created_at,
              };
              lastUserIdRef.current = fallbackUser.id;
              lastRoleRef.current = role;
              setUser(fallbackUser as any);
              setRole(role);
              logger.info('AuthContext', 'Session restored from JWT fallback', { role });
            }
          } catch (fallbackErr) {
            logger.warn('AuthContext', 'JWT fallback also failed', { error: String(fallbackErr) });
          }
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

    const unsubscribe = authService.onAuthStateChange((incoming) => {
      if (!mounted || !initialized) return;
      if (loginInProgress.current) return;
      if (incoming) {
        const nextRole = incoming.role || 'visitor';
        if (lastUserIdRef.current === incoming.id && lastRoleRef.current === nextRole) return;
        lastUserIdRef.current = incoming.id;
        lastRoleRef.current = nextRole;
        setUser(incoming as any);
        setRole(nextRole);
      } else {
        lastUserIdRef.current = null;
        lastRoleRef.current = 'visitor';
        setUser(null);
        setRole('visitor');
      }
    });

    const handleProfileChange = async () => {
      if (!initialized) return;
      try {
        const { data } = await authService.getCurrentUser();
        if (data && mounted) {
          lastUserIdRef.current = data.id;
          lastRoleRef.current = data.role;
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
      lastUserIdRef.current = data.id;
      lastRoleRef.current = data.role || 'visitor';
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
    lastUserIdRef.current = null;
    lastRoleRef.current = 'visitor';
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
