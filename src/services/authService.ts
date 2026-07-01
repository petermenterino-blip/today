import { supabase } from '../lib/supabase';
import { ServiceResponse, User, UserRole } from '../types';
import { handleError } from '../lib/serviceHelper';

export interface UserProfileDetails {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  name: string;
  avatar_url: string;
  role: UserRole;
  created_at: string;
  phone_number?: string;
  bio?: string;
  discipline?: string;
  github_url?: string;
  linkedin_url?: string;
  specialties?: string[];
  google_calendar_connected?: boolean;
  google_calendar_email?: string;
}

const hasSupabaseCredentials = (): boolean => {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
  return !!(url && key && url !== 'your_supabase_project_url');
};

// ===================== Auth Service =====================

export const authService = {
  async signIn(email: string, password: string): Promise<ServiceResponse<User & { profile?: UserProfileDetails }>> {
    if (!hasSupabaseCredentials()) {
      return { data: null, error: 'Supabase not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.' };
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { data: null, error: handleError(error).error };
    if (!data.user) return { data: null, error: 'Login failed' };

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single();

    const userData: User & { profile?: UserProfileDetails } = {
      id: data.user.id,
      email: data.user.email || email,
      name: profile?.name || data.user.user_metadata?.full_name || email.split('@')[0],
      role: profile?.role || null,
      application_status: profile?.application_status || null,
      created_at: data.user.created_at,
      profile: profile || undefined,
    };

    return { data: userData, error: null };
  },

  async signUp(email: string, password: string, fullName: string): Promise<ServiceResponse<User>> {
    if (!hasSupabaseCredentials()) {
      return { data: null, error: 'Supabase not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.' };
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName, role: 'student' } },
    });
    if (error) return { data: null, error: handleError(error).error };
    if (!data.user) return { data: null, error: 'Signup failed' };

    const user: User = {
      id: data.user.id,
      email: data.user.email || email,
      name: fullName,
      role: 'student',
      created_at: data.user.created_at,
    };
    return { data: user, error: null };
  },

  async signOut(): Promise<ServiceResponse<void>> {
    if (!hasSupabaseCredentials()) {
      return { data: undefined, error: null };
    }

    const { error } = await supabase.auth.signOut();
    if (error) return { data: undefined, error: handleError(error).error };
    return { data: undefined, error: null };
  },

  async getCurrentUser(): Promise<ServiceResponse<User & { profile?: UserProfileDetails }>> {
    if (!hasSupabaseCredentials()) {
      return { data: null, error: 'Supabase not configured.' };
    }

    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) return { data: null, error: handleError(error).error };
    if (!session?.user) return { data: null, error: 'No active session' };

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single();

    const userData: User & { profile?: UserProfileDetails } = {
      id: session.user.id,
      email: session.user.email || '',
      name: profile?.name || session.user.user_metadata?.full_name || '',
      role: profile?.role || null,
      application_status: profile?.application_status || null,
      created_at: session.user.created_at,
      profile: profile || undefined,
    };

    return { data: userData, error: null };
  },

  async getFullProfile(userId: string, email: string): Promise<ServiceResponse<User & { profile?: UserProfileDetails }>> {
    if (!hasSupabaseCredentials()) {
      return { data: null, error: 'Supabase not configured.' };
    }

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) return { data: null, error: handleError(error).error };

    const userData: User & { profile?: UserProfileDetails } = {
      id: userId,
      email: profile?.email || email,
      name: profile?.name || email.split('@')[0],
      role: profile?.role || null,
      application_status: profile?.application_status || null,
      created_at: profile?.created_at || new Date().toISOString(),
      profile: profile || undefined,
    };

    return { data: userData, error: null };
  },

  async resetPassword(email: string): Promise<ServiceResponse<void>> {
    if (!hasSupabaseCredentials()) {
      return { data: undefined, error: 'Supabase not configured.' };
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) return { data: undefined, error: handleError(error).error };
    return { data: undefined, error: null };
  },

  async updatePassword(password: string): Promise<ServiceResponse<void>> {
    if (!hasSupabaseCredentials()) {
      return { data: undefined, error: 'Supabase not configured.' };
    }

    const { error } = await supabase.auth.updateUser({ password });
    if (error) return { data: undefined, error: handleError(error).error };
    return { data: undefined, error: null };
  },

  onAuthStateChange(callback: (user: User | null) => void): (() => void) | null {
    if (!hasSupabaseCredentials()) return null;

    const { data } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        if (session?.user) {
          try {
            const { data: profile } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .single();

            const userData: User = {
              id: session.user.id,
              email: session.user.email || '',
              name: profile?.name || session.user.user_metadata?.full_name || '',
              role: profile?.role || null,
              application_status: profile?.application_status || null,
              created_at: session.user.created_at,
            };
            callback(userData);
          } catch {
            callback(null);
          }
        }
      } else if (event === 'SIGNED_OUT') {
        callback(null);
      }
    });

    return () => data?.subscription.unsubscribe();
  },
};
