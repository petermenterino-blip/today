import { supabase } from '../lib/supabase';
import { ServiceResponse, User, UserRole } from '../types';
import { handleError } from '../lib/serviceHelper';

const PROFILE_QUERY_TIMEOUT = 5000;

const queryWithTimeout = <T>(thenable: { then: (onfulfilled: (value: T) => any) => any }, ms: number): Promise<T> => {
  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error('Query timed out')), ms)
  );
  return Promise.race([Promise.resolve(thenable) as Promise<T>, timeoutPromise]);
};

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
  if (!url || !key) return false;
  if (url === 'your_supabase_project_url' || url.startsWith('http://localhost')) return false;
  if (key === 'your_supabase_anon_key' || key === 'placeholder-for-CI') return false;
  return true;
};

const buildFallbackProfile = (authUser: {
  id: string;
  email?: string | null;
  created_at?: string;
  user_metadata?: Record<string, any>;
}) => ({
  id: authUser.id,
  email: authUser.email || '',
  name: authUser.user_metadata?.full_name || authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'User',
  role: (authUser.user_metadata?.role as UserRole) || 'student',
  avatar_url: '',
  application_status: null,
  created_at: authUser.created_at || new Date().toISOString(),
});

const pendingProfileFetches = new Map<string, Promise<any>>();

const getOrCreateProfileForUser = async (authUser: {
  id: string;
  email?: string | null;
  created_at?: string;
  user_metadata?: Record<string, any>;
}) => {
  const existing = pendingProfileFetches.get(authUser.id);
  if (existing) return existing;
  const promise = doGetOrCreateProfile(authUser);
  pendingProfileFetches.set(authUser.id, promise);
  promise.finally(() => pendingProfileFetches.delete(authUser.id));
  return promise;
};

const doGetOrCreateProfile = async (authUser: {
  id: string;
  email?: string | null;
  created_at?: string;
  user_metadata?: Record<string, any>;
}) => {
  const fallbackRole = (authUser.user_metadata?.role as UserRole) || 'student';
  const fallbackName = authUser.user_metadata?.full_name || authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'User';

  try {
    const { data: profile, error: profileError } = await queryWithTimeout(
      supabase
        .from('profiles')
        .select('id,name,email,role,avatar_url,application_status,created_at')
        .eq('id', authUser.id)
        .single(),
      PROFILE_QUERY_TIMEOUT
    );

    if (profile) return profile;
    if (profileError && profileError.code !== 'PGRST116') throw profileError;

    const { data: createdProfile, error: createError } = await queryWithTimeout(
      supabase
        .from('profiles')
        .insert({
          id: authUser.id,
          email: authUser.email || '',
          name: fallbackName,
          role: fallbackRole,
          created_at: authUser.created_at || new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single(),
      PROFILE_QUERY_TIMEOUT
    );

    if (createError && createError.code !== '23505') throw createError;
    if (createError?.code === '23505') {
      const { data: existingProfile } = await queryWithTimeout(
        supabase
          .from('profiles')
          .select('id,name,email,role,avatar_url,application_status,created_at')
          .eq('id', authUser.id)
          .single(),
        PROFILE_QUERY_TIMEOUT
      );
      return existingProfile || buildFallbackProfile(authUser);
    }

    return createdProfile || buildFallbackProfile(authUser);
  } catch (err) {
    console.warn('[authService] Profile query failed, using auth metadata fallback:', err);
    return buildFallbackProfile(authUser);
  }
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
    if (!data.user.email_confirmed_at) {
      return { data: null, error: 'Please verify your email before signing in. Check your inbox for the confirmation link.' };
    }

    const profile = await getOrCreateProfileForUser(data.user);

    const userData: User & { profile?: UserProfileDetails } = {
      id: data.user.id,
      email: data.user.email || email,
      name: profile?.name || data.user.user_metadata?.full_name || email.split('@')[0],
      role: (profile?.role as UserRole) || (data.user.user_metadata?.role as UserRole) || 'visitor',
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

    const profile = await getOrCreateProfileForUser(session.user);

    const userData: User & { profile?: UserProfileDetails } = {
      id: session.user.id,
      email: session.user.email || '',
      name: profile?.name || session.user.user_metadata?.full_name || '',
      role: (profile?.role as UserRole) || (session.user.user_metadata?.role as UserRole) || 'visitor',
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

    try {
      const { data: profile, error } = await queryWithTimeout(
        supabase
          .from('profiles')
          .select('id,name,email,role,avatar_url,application_status,created_at,phone,bio,specialization')
          .eq('id', userId)
          .single(),
        PROFILE_QUERY_TIMEOUT
      );

      if (error) throw error;

      const userData: User & { profile?: UserProfileDetails } = {
        id: userId,
        email: profile?.email || email,
        name: profile?.name || email.split('@')[0],
        role: (profile?.role as UserRole) || 'visitor',
        application_status: profile?.application_status || null,
        created_at: profile?.created_at || new Date().toISOString(),
        profile: profile ? { ...profile, first_name: profile.name || '', last_name: '' } as any : undefined,
      };

      return { data: userData, error: null };
    } catch (err) {
      console.warn('[authService] getFullProfile failed, returning minimal profile:', err);
      return {
        data: {
          id: userId,
          email,
          name: email.split('@')[0],
          role: 'visitor' as UserRole,
          application_status: null,
          created_at: new Date().toISOString(),
        },
        error: null,
      };
    }
  },

  async resetPassword(email: string): Promise<ServiceResponse<void>> {
    if (!hasSupabaseCredentials()) {
      return { data: undefined, error: 'Supabase not configured.' };
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/#/reset-password`,
    });
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

    const pendingCallbacks = new Set<string>();

    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'PASSWORD_RECOVERY') {
        if (session?.user) {
          const userId = session.user.id;
          if (pendingCallbacks.has(userId)) return;
          pendingCallbacks.add(userId);

          const userData: User = {
            id: userId,
            email: session.user.email || '',
            name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || '',
            role: (session.user.user_metadata?.role as UserRole) || 'visitor',
            created_at: session.user.created_at,
          };

          // Fire callback synchronously with metadata-derived user
          callback(userData);

          // Fire-and-forget profile enrichment
          getOrCreateProfileForUser(session.user).then(profile => {
            if (profile && (profile.name !== userData.name || (profile.role as UserRole) !== userData.role)) {
              callback({
                ...userData,
                name: profile.name || userData.name,
                role: (profile.role as UserRole) || userData.role,
                application_status: profile.application_status || null,
              });
            }
          }).catch((err) => console.error('[authService] Profile callback failed:', err)).finally(() => {
            pendingCallbacks.delete(userId);
          });
        }
      } else if (event === 'SIGNED_OUT') {
        pendingCallbacks.clear();
        callback(null);
      }
    });

    return () => data?.subscription.unsubscribe();
  },
};
