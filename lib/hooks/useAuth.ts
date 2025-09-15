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
    console.log('loadProfile called for user:', userId);
    console.log('Current session state:', !!session);

    try {
      // First, let's test if we can access the table at all
      console.log('Testing basic table access...');
      const { data: testData, error: testError } = await supabase
        .from('profiles')
        .select('count')
        .limit(1);

      console.log('Basic table access test:', { testData, testError });

      if (testError) {
        console.error('Cannot access profiles table:', testError);
        throw testError;
      }

      // Now try the actual profile query with minimal fields
      console.log('Querying for specific profile...');
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId);

      console.log('Profile query result:', { profiles, error, userId });

      // Convert to single profile format
      const profile = profiles && profiles.length > 0 ? profiles[0] : null;

      console.log('Final profile result:', profile);

      if (error) {
        console.log('Profile query error details:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        });
      }

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        // Check for common database setup issues
        if (error.code === '42P01') {
          throw new Error('Database not set up: Please run the schema.sql in Supabase SQL Editor');
        }
        if (error.code === 'PGRST301') {
          throw new Error('JWT token invalid - auth issue');
        }
        console.error('Unhandled profile query error:', error);
        throw error;
      }

      // PGRST116 means no profile exists yet - this is normal for new users
      if (error && error.code === 'PGRST116') {
        console.log('No profile found - user needs onboarding');
        setProfile(null);
      } else {
        console.log('Profile loaded successfully:', profile?.role);
        setProfile(profile);
      }
    } catch (err) {
      console.error('Error loading profile:', err);
      setError(err instanceof Error ? err.message : 'Failed to load profile');
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

      console.log('upsertProfile: inserting data:', profileData);

      const { data: updatedProfile, error } = await supabase
        .from('profiles')
        .upsert(profileData)
        .select()
        .single();

      if (error) throw error;

      console.log('upsertProfile: profile updated successfully:', updatedProfile);
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