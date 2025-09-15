import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { Database } from '@/types/db';
import type { Session } from '@supabase/supabase-js';

type Profile = Database['public']['Tables']['profiles']['Row'];
type ProfileInsert = Database['public']['Tables']['profiles']['Insert'];

interface UseAuthReturn {
  session: Session | null;
  profile: Profile | null;
  role: 'student' | 'employer' | null;
  loading: boolean;
  error: string | null;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  upsertProfile: (data: Partial<ProfileInsert>) => Promise<void>;
  updateProfile: (data: Partial<ProfileInsert>) => Promise<void>;
}

export function useAuth(): UseAuthReturn {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const role = profile?.role || null;

  // Load profile data when session changes
  const loadProfile = useCallback(async (userId: string) => {
    console.log('=== LOAD PROFILE DEBUG ===');
    console.log('loadProfile called for user:', userId);

    try {
      // Simple direct query for the user's profile
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle(); // Use maybeSingle to handle no results gracefully

      console.log('Supabase profile query result:');
      console.log('- Profile data:', profile);
      console.log('- Error:', error);
      console.log('- User ID searched:', userId);

      if (error) {
        console.error('Profile query error:', error);

        // Check for database setup issues
        if (error.code === '42P01') {
          setError('Database not set up: Please run the schema.sql in Supabase SQL Editor');
          return;
        }
        if (error.code === 'PGRST301') {
          setError('JWT token invalid - auth issue');
          return;
        }

        // For other errors, set error and continue
        setError(error.message);
        setProfile(null);
        return;
      }

      // Set profile (null if no profile exists, which is normal for new users)
      setProfile(profile);

      if (profile) {
        console.log('✅ Profile loaded successfully:');
        console.log('- Name:', profile.name);
        console.log('- Role:', profile.role);
        console.log('- Bio:', profile.bio);
        console.log('- Location:', profile.location);
        console.log('- Interests:', profile.interests);
        console.log('- Full profile:', profile);
      } else {
        console.log('❌ No profile found - user needs onboarding');
      }
      console.log('===========================');

      // Clear any previous errors
      setError(null);
    } catch (err) {
      console.error('Profile loading error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load profile');
      setProfile(null);
    }
  }, []);

  // Set up auth state listener
  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        loadProfile(session.user.id);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session?.user?.email);
      console.log('Session details:', {
        hasSession: !!session,
        userId: session?.user?.id,
        accessToken: session?.access_token ? 'present' : 'missing',
        expiresAt: session?.expires_at
      });

      setSession(session);

      if (session?.user) {
        console.log('Loading profile for user:', session.user.id);
        try {
          await loadProfile(session.user.id);
        } catch (err) {
          console.error('Failed to load profile in auth state change:', err);
        }
      } else {
        setProfile(null);
      }
      console.log('Setting loading to false');
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [loadProfile]);

  const signInWithEmail = useCallback(async (email: string, password: string) => {
    setError(null);
    setLoading(true);
    console.log('useAuth signInWithEmail called');

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      console.log('Supabase signIn response:', { data: data?.user?.email, error });

      if (error) throw error;
    } catch (err) {
      console.error('signInWithEmail error:', err);
      setError(err instanceof Error ? err.message : 'Sign in failed');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const signUpWithEmail = useCallback(async (email: string, password: string) => {
    setError(null);
    setLoading(true);
    console.log('useAuth signUpWithEmail called');

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      console.log('Supabase signUp response:', { data: data?.user?.email, error });

      if (error) throw error;
    } catch (err) {
      console.error('signUpWithEmail error:', err);
      setError(err instanceof Error ? err.message : 'Sign up failed');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const signOut = useCallback(async () => {
    setError(null);
    
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      setSession(null);
      setProfile(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign out failed');
      throw err;
    }
  }, []);

  const upsertProfile = useCallback(async (data: Partial<ProfileInsert>) => {
    setError(null);

    try {
      // Get current user directly from Supabase instead of relying on state
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError) throw userError;
      if (!user) throw new Error('No authenticated user');

      console.log('upsertProfile: authenticated user found:', user.id);

      const profileData = {
        id: user.id,
        ...data,
      };

      console.log('=== UPSERT PROFILE DEBUG ===');
      console.log('Profile data being saved:', profileData);

      const { data: updatedProfile, error } = await supabase
        .from('profiles')
        .upsert(profileData)
        .select()
        .single();

      console.log('Supabase upsert result:', { updatedProfile, error });

      if (error) {
        console.error('❌ UPSERT ERROR:', error);
        throw error;
      }

      console.log('✅ Profile upserted successfully:', updatedProfile);
      console.log('Setting profile state to:', updatedProfile);
      console.log('=============================');
      setProfile(updatedProfile);
    } catch (err) {
      console.error('upsertProfile error:', err);
      setError(err instanceof Error ? err.message : 'Profile update failed');
      throw err;
    }
  }, []);

  const updateProfile = useCallback(async (data: Partial<ProfileInsert>) => {
    setError(null);

    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError) throw userError;
      if (!user) throw new Error('No authenticated user');

      console.log('updateProfile: authenticated user found:', user.id);

      const { data: updatedProfile, error } = await supabase
        .from('profiles')
        .update(data)
        .eq('id', user.id)
        .select()
        .single();

      if (error) throw error;

      console.log('updateProfile: profile updated successfully:', updatedProfile);
      setProfile(updatedProfile);
    } catch (err) {
      console.error('updateProfile error:', err);
      setError(err instanceof Error ? err.message : 'Profile update failed');
      throw err;
    }
  }, []);

  return {
    session,
    profile,
    role,
    loading,
    error,
    signInWithEmail,
    signUpWithEmail,
    signOut,
    upsertProfile,
    updateProfile,
  };
}