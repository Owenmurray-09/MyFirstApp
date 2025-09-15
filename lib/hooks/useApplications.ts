import { useState, useEffect, useCallback } from 'react';
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
  students?: {
    full_name: string;
    email: string;
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

  const loadApplications = useCallback(async () => {
    setError(null);
    setLoading(true);

    try {
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
          ),
          students!inner (
            full_name,
            email
          )
        `)
        .order('created_at', { ascending: false });

      if (filters.jobId) {
        query = query.eq('job_id', filters.jobId);
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
  }, [filters, signal]);

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

  const apply = useCallback(async (jobId: string, note?: string) => {
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

      const applicationData: ApplicationInsert = {
        job_id: jobId,
        student_user_id: user.id,
        note: note || null,
        status: 'pending',
      };

      const { error } = await supabase
        .from('applications')
        .insert(applicationData);

      if (error) throw error;
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