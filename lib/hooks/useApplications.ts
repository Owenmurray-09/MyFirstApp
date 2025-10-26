import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import type { Database } from '@/types/db';

type Application = Database['public']['Tables']['applications']['Row'] & {
  jobs?: {
    id: string;
    title: string;
    company_id: string;
    companies: {
      name: string;
    };
  };
};

type ApplicationInsert = Database['public']['Tables']['applications']['Insert'];

interface UseApplicationsFilters {
  jobId?: string;
}

interface UseApplicationsReturn {
  applications: Application[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

interface UseApplyReturn {
  apply: (jobId: string, note?: string) => Promise<void>;
  loading: boolean;
  error: string | null;
}

export function useApplications(
  filters: UseApplicationsFilters = {},
  signal?: AbortSignal
): UseApplicationsReturn {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Stabilize filters to prevent infinite re-renders
  const stableFilters = useMemo(() => ({
    jobId: filters.jobId || undefined,
  }), [filters.jobId]);

  const loadApplications = useCallback(async () => {
    setError(null);
    setLoading(true);

    try {
      // Get current user for filtering
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setApplications([]);
        return;
      }

      let query = supabase
        .from('applications')
        .select(`
          *,
          jobs!inner (
            id,
            title,
            company_id,
            companies!inner (
              name
            )
          )
        `)
        .eq('student_user_id', user.id)
        .order('created_at', { ascending: false });

      if (stableFilters.jobId) {
        query = query.eq('job_id', stableFilters.jobId);
      }

      const { data, error } = await query.abortSignal(signal);

      if (error) throw error;
      setApplications(data as Application[]);
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return;
      setError(err instanceof Error ? err.message : 'Failed to load applications');
    } finally {
      setLoading(false);
    }
  }, [stableFilters, signal]);

  useEffect(() => {
    loadApplications();
  }, [loadApplications]);

  return {
    applications,
    loading,
    error,
    refresh: loadApplications,
  };
}

interface UseCheckApplicationReturn {
  hasApplied: boolean;
  loading: boolean;
  error: string | null;
}

export function useCheckApplication(jobId: string): UseCheckApplicationReturn {
  const [hasApplied, setHasApplied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkApplication = async () => {
      if (!jobId) return;

      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setHasApplied(false);
          setLoading(false);
          return;
        }

        const { data, error } = await supabase
          .from('applications')
          .select('id')
          .eq('job_id', jobId)
          .eq('student_user_id', user.id)
          .limit(1);

        if (error) throw error;
        setHasApplied(data.length > 0);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to check application status');
      } finally {
        setLoading(false);
      }
    };

    checkApplication();
  }, [jobId]);

  return {
    hasApplied,
    loading,
    error,
  };
}

export function useApply(): UseApplyReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const apply = useCallback(async (jobId: string, note?: string, contactEmail?: string, contactPhone?: string) => {
    setError(null);
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      // Check if already applied
      const { data: existingApplication } = await supabase
        .from('applications')
        .select('id')
        .eq('job_id', jobId)
        .eq('student_user_id', user.id)
        .limit(1);

      if (existingApplication && existingApplication.length > 0) {
        throw new Error('You have already applied for this position');
      }

      // Try with new fields first, fallback to old schema if they don't exist
      let applicationData: any = {
        job_id: jobId,
        student_user_id: user.id,
        note: note || null,
        status: 'submitted',
      };

      // Add contact fields if provided (for new schema)
      if (contactEmail || contactPhone) {
        applicationData.contact_email = contactEmail || null;
        applicationData.contact_phone = contactPhone || null;
      }

      const { error } = await supabase
        .from('applications')
        .insert(applicationData);

      if (error) {
        // If error is due to unknown columns, try without contact fields
        if (error.message?.includes('column') && (contactEmail || contactPhone)) {
          const fallbackData = {
            job_id: jobId,
            student_user_id: user.id,
            note: note || null,
            status: 'submitted',
          };

          const { error: fallbackError } = await supabase
            .from('applications')
            .insert(fallbackData);

          if (fallbackError) throw fallbackError;
        } else {
          throw error;
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to apply for job';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    apply,
    loading,
    error,
  };
}