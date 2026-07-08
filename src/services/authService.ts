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
  if (!url || !key) return false;
  if (url === 'your_supabase_project_url' || url.startsWith('http://localhost')) return false;
  if (key === 'your_supabase_anon_key' || key === 'placeholder-for-CI') return false;
  return true;
};

const supabaseFetch = async <T>(path: string, accessToken: string): Promise<T | null> => {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const res = await fetch(`${supabaseUrl}${path}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      apikey: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
    },
  });
  if (!res.ok && res.status !== 406) {
    const body = await res.text().catch(() => '');
    throw new Error(`DB request failed: ${res.status} ${body.substring(0, 200)}`);
  }
  if (res.status === 406) return null;
  const json = await res.json();
  return json as T;
};

const getOrCreateProfileForUser = async (authUser: {
  id: string;
  email?: string | null;
  created_at?: string;
  user_metadata?: Record<string, any>;
}, options?: { accessToken?: string }) => {
  const fallbackRole = (authUser.user_metadata?.role as UserRole) || 'student';
  const fallbackName = authUser.user_metadata?.full_name || authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'User';

  const queryPath = `/rest/v1/profiles?id=eq.${authUser.id}&select=id,name,email,role,avatar_url,application_status,created_at`;
  let profile: any = null;

  if (options?.accessToken) {
    const result = await supabaseFetch<any[]>(queryPath, options.accessToken);
    profile = result?.[0] ?? null;
  } else {
    const { data, error } = await supabase
      .from('profiles')
      .select('id,name,email,role,avatar_url,application_status,created_at')
      .eq('id', authUser.id)
      .single();
    if (error && error.code !== 'PGRST116') throw error;
    profile = data;
  }

  if (profile) return profile;

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

  const doInsert = async () => {
    const res = await fetch(`${supabaseUrl}/rest/v1/profiles?select=id,name,email,role,avatar_url,application_status,created_at`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${options?.accessToken || anonKey}`,
        apikey: anonKey,
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
      },
      body: JSON.stringify({
        id: authUser.id,
        email: authUser.email || '',
        name: fallbackName,
        role: fallbackRole,
        created_at: authUser.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }),
    });
    if (res.status === 409) {
      const existingRes = await fetch(`${supabaseUrl}/rest/v1/profiles?id=eq.${authUser.id}&select=id,name,email,role,avatar_url,application_status,created_at`, {
        headers: {
          Authorization: `Bearer ${options?.accessToken || anonKey}`,
          apikey: anonKey,
        },
      });
      if (existingRes.ok) {
        const arr = await existingRes.json();
        if (arr?.length) return arr[0];
      }
      return getFallbackProfile(authUser, fallbackName, fallbackRole);
    }
    if (!res.ok) throw new Error(`Profile insert failed: ${res.status}`);
    const arr = await res.json();
    return arr?.[0] || getFallbackProfile(authUser, fallbackName, fallbackRole);
  };

  return doInsert();
};

const getFallbackProfile = (authUser: { id: string; email?: string | null; created_at?: string }, name: string, role: UserRole) => ({
  id: authUser.id,
  email: authUser.email || '',
  name,
  role,
  created_at: authUser.created_at || new Date().toISOString(),
  application_status: null,
});

const signInDirect = async (email: string, password: string): Promise<ServiceResponse<User & { profile?: UserProfileDetails }>> => {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
  if (!supabaseUrl || !anonKey) {
    return { data: null, error: 'Supabase not configured.' };
  }

  const authData = await new Promise<any>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${supabaseUrl}/auth/v1/token?grant_type=password`, true);
    xhr.setRequestHeader('apikey', anonKey);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.timeout = 20000;
    xhr.ontimeout = () => reject(new Error('Login request timed out'));
    xhr.onerror = () => reject(new Error('Network error during login'));
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try { resolve(JSON.parse(xhr.responseText)); }
        catch { reject(new Error('Invalid response from login server')); }
      } else {
        reject(new Error(`Login failed: ${xhr.status}`));
      }
    };
    xhr.send(JSON.stringify({ email, password }));
  });
  const user = authData.user;
  if (!user) return { data: null, error: 'Login failed: no user returned' };
  if (!user.email_confirmed_at) {
    return { data: null, error: 'Please verify your email before signing in. Check your inbox for the confirmation link.' };
  }

  const session = {
    access_token: authData.access_token,
    refresh_token: authData.refresh_token,
    expires_in: authData.expires_in,
    expires_at: authData.expires_at,
    token_type: authData.token_type || 'bearer',
    user,
  };

  try {
    await supabase.auth.setSession(session);
  } catch {
    // setSession may fail if session is already set; continue anyway
  }

  const profile = await getOrCreateProfileForUser(user, { accessToken: authData.access_token });

  const userData: User & { profile?: UserProfileDetails } = {
    id: user.id,
    email: user.email || email,
    name: profile?.name || user.user_metadata?.full_name || email.split('@')[0],
    role: (profile?.role as UserRole) || (user.user_metadata?.role as UserRole) || 'visitor',
    application_status: profile?.application_status || null,
    created_at: user.created_at,
    profile: profile || undefined,
  };

  return { data: userData, error: null };
};

// ===================== Auth Service =====================

export const authService = {
  async signIn(email: string, password: string): Promise<ServiceResponse<User & { profile?: UserProfileDetails }>> {
    if (!hasSupabaseCredentials()) {
      return { data: null, error: 'Supabase not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.' };
    }

    return signInDirect(email, password);
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

    const profile = await getOrCreateProfileForUser(session.user, { accessToken: session.access_token });

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

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('id,name,email,role,avatar_url,application_status,created_at,phone,bio,specialization')
      .eq('id', userId)
      .single();

    if (error) return { data: null, error: handleError(error).error };

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
          getOrCreateProfileForUser(session.user, { accessToken: session.access_token }).then(profile => {
            if (profile && (profile.name !== userData.name || (profile.role as UserRole) !== userData.role)) {
              callback({
                ...userData,
                name: profile.name || userData.name,
                role: (profile.role as UserRole) || userData.role,
                application_status: profile.application_status || null,
              });
            }
          }).catch(() => {}).finally(() => {
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
