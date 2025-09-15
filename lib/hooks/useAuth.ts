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
  signOut: () => Promise<void>;
  upsertProfile: (data: Partial<ProfileInsert>) => Promise<void>;
}

export function useAuth(): UseAuthReturn {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const role = profile?.role || null;

  // TEMP: Bypass authentication for development
  useEffect(() => {
    // Mock session and profile for development
    const mockSession = {
      user: { id: 'mock-user-id', email: 'demo@example.com' }
    } as Session;
    
    const mockProfile: Profile = {
      id: 'mock-user-id',
      role: 'student', // Change to 'employer' to test employer features
      name: 'Demo User',
      bio: 'This is a demo user for testing',
      interests: ['customer service', 'retail'],
      location: 'San Francisco, CA',
      avatar_url: null,
      created_at: new Date().toISOString(),
    };

    setSession(mockSession);
    setProfile(mockProfile);
    setLoading(false);
  }, []);

  const signInWithEmail = useCallback(async (email: string, password: string) => {
    setError(null);
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign in failed');
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
    if (!session?.user) throw new Error('No authenticated user');

    setError(null);
    
    try {
      const profileData = {
        id: session.user.id,
        ...data,
      };

      const { data: updatedProfile, error } = await supabase
        .from('profiles')
        .upsert(profileData)
        .select()
        .single();

      if (error) throw error;
      
      setProfile(updatedProfile);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Profile update failed');
      throw err;
    }
  }, [session?.user]);

  return {
    session,
    profile,
    role,
    loading,
    error,
    signInWithEmail,
    signOut,
    upsertProfile,
  };
}