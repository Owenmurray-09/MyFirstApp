import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { Database } from '@/types/db';

type StudentPreferences = Database['public']['Tables']['student_preferences']['Row'];

interface UsePreferencesReturn {
  interests: string[];
  loading: boolean;
  error: string | null;
  saveInterests: (interests: string[]) => Promise<void>;
}

export function usePreferences(userId?: string): UsePreferencesReturn {
  const [interests, setInterests] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load user preferences
  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    let mounted = true;

    const loadPreferences = async () => {
      try {
        const { data, error } = await supabase
          .from('student_preferences')
          .select('interest_tags')
          .eq('student_user_id', userId)
          .single();

        if (!mounted) return;

        if (error && error.code !== 'PGRST116') {
          setError(error.message);
        } else {
          setInterests(data?.interest_tags || []);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Failed to load preferences');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadPreferences();

    return () => {
      mounted = false;
    };
  }, [userId]);

  const saveInterests = useCallback(async (newInterests: string[]) => {
    if (!userId) throw new Error('No user ID provided');

    setError(null);
    
    // Optimistic update
    const previousInterests = interests;
    setInterests(newInterests);

    try {
      const { error } = await supabase
        .from('student_preferences')
        .upsert({
          student_user_id: userId,
          interest_tags: newInterests,
        });

      if (error) throw error;
    } catch (err) {
      // Revert optimistic update
      setInterests(previousInterests);
      const errorMessage = err instanceof Error ? err.message : 'Failed to save interests';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [userId, interests]);

  return {
    interests,
    loading,
    error,
    saveInterests,
  };
}