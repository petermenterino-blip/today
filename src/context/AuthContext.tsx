import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, UserRole } from '../types';
import { authService, UserProfileDetails } from '../services/authService';

interface AuthContextType {
  user: (User & { profile?: UserProfileDetails }) | null;
  role: UserRole;
  authLoading: boolean;
  login: (email: string, password: string) => Promise<User & { profile?: UserProfileDetails }>;
  signup: (email: string, password: string, fullName: string) => Promise<void>;
  logout: () => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (password: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<(User & { profile?: UserProfileDetails }) | null>(null);
  const [role, setRole] = useState<UserRole>('visitor');
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
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
      } catch (err) {
        console.error('Failed to initialize session:', err);
      } finally {
        if (mounted) {
          setAuthLoading(false);
        }
      }
    };
    initializeSession();

    // Supabase real-time auth state listener (no-op if not using Supabase)
    const unsubscribe = authService.onAuthStateChange((user) => {
      if (!mounted) return;
      if (user) {
        setUser(user as any);
        setRole(user.role);
      } else {
        setUser(null);
        setRole('visitor');
      }
    });

    // Re-read auth user when profile/applications change (e.g. mentor approves)
    const handleProfileChange = async () => {
      const { data } = await authService.getCurrentUser();
      if (data && mounted) {
        setUser(data);
        setRole(data.role);
      }
    };
    window.addEventListener('user-profile-changed', handleProfileChange);
    return () => {
      mounted = false;
      window.removeEventListener('user-profile-changed', handleProfileChange);
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string): Promise<User & { profile?: UserProfileDetails }> => {
    setAuthLoading(true);
    const { data, error } = await authService.signIn(email, password);
    if (error || !data) {
      setAuthLoading(false);
      throw new Error(error || 'Login failed');
    }
    setUser(data);
    setRole(data.role);
    setAuthLoading(false);
    return data;
  };

  const signup = async (email: string, password: string, fullName: string): Promise<void> => {
    setAuthLoading(true);
    const { data, error } = await authService.signUp(email, password, fullName);
    if (error || !data) {
      setAuthLoading(false);
      throw new Error(error || 'Signup failed');
    }
    setAuthLoading(false);
  };

  const logout = async () => {
    setAuthLoading(true);
    await authService.signOut();
    setUser(null);
    setRole('visitor');
    setAuthLoading(false);
  };

  const forgotPassword = async (email: string): Promise<void> => {
    const { error } = await authService.resetPassword(email);
    if (error) {
      throw new Error(error);
    }
  };

  const resetPassword = async (password: string): Promise<void> => {
    const { error } = await authService.updatePassword(password);
    if (error) {
      throw new Error(error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, role, authLoading, login, signup, logout, forgotPassword, resetPassword }}>
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
