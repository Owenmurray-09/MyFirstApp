import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import type { Database } from '@/types/db';

type Job = Database['public']['Tables']['jobs']['Row'] & {
  companies: {
    name: string;
    description?: string;
    location?: string;
    owner_user_id?: string;
  };
};

type JobInsert = Database['public']['Tables']['jobs']['Insert'];
type JobUpdate = Database['public']['Tables']['jobs']['Update'];

interface JobFilters {
  keyword?: string;
  paidOnly?: boolean;
  location?: string;
  tags?: string[];
}

interface UseJobsReturn {
  jobs: Job[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

interface UseJobReturn {
  job: Job | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

interface UseCreateJobReturn {
  createJob: (data: Omit<JobInsert, 'id'>) => Promise<Job>;
  loading: boolean;
  error: string | null;
}

interface UseUpdateJobReturn {
  updateJob: (id: string, data: JobUpdate) => Promise<Job>;
  loading: boolean;
  error: string | null;
}

interface UseUploadJobImagesReturn {
  uploadImages: (jobId: string, images: File[]) => Promise<string[]>;
  loading: boolean;
  error: string | null;
  progress: number;
}

export function useJobs(filters: JobFilters = {}, signal?: AbortSignal): UseJobsReturn {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Stabilize filters to prevent infinite re-renders
  const stableFilters = useMemo(() => ({
    keyword: filters.keyword || '',
    paidOnly: filters.paidOnly || false,
    location: filters.location || '',
    tags: filters.tags || [],
  }), [filters.keyword, filters.paidOnly, filters.location, filters.tags]);

  const loadJobs = useCallback(async () => {
    setError(null);
    setLoading(true);

    try {
      // First test if we can access the jobs table at all
      const { data: testData, error: testError } = await supabase
        .from('jobs')
        .select('count')
        .limit(1);

      if (testError) {
        // If jobs table doesn't exist or has permission issues, return empty array
        if (testError.code === '42P01' || testError.code === 'PGRST301') {
          setJobs([]);
          return;
        }
        throw testError;
      }

      // Now try the full query
      let query = supabase
        .from('jobs')
        .select(`
          *,
          companies!inner (
            name,
            description,
            location,
            owner_user_id
          )
        `)
        .eq('status', 'open')
        .order('created_at', { ascending: false });

      if (stableFilters.keyword) {
        query = query.or(
          `title.ilike.%${stableFilters.keyword}%,description.ilike.%${stableFilters.keyword}%`
        );
      }

      if (stableFilters.paidOnly) {
        query = query.eq('is_paid', true);
      }

      if (stableFilters.location) {
        query = query.ilike('location', `%${stableFilters.location}%`);
      }

      if (stableFilters.tags && stableFilters.tags.length > 0) {
        query = query.overlaps('tags', stableFilters.tags);
      }

      const { data, error } = await query.abortSignal(signal);

      if (error) throw error;
      setJobs(data as Job[]);
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return;
      setError(err instanceof Error ? err.message : 'Failed to load jobs');
      setJobs([]); // Set empty array on error to prevent flickering
    } finally {
      setLoading(false);
    }
  }, [stableFilters, signal]);

  useEffect(() => {
    loadJobs();
  }, [loadJobs]);

  return {
    jobs,
    loading,
    error,
    refresh: loadJobs,
  };
}

export function useJob(id: string, signal?: AbortSignal): UseJobReturn {
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadJob = useCallback(async () => {
    if (!id) return;

    setError(null);
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from('jobs')
        .select(`
          *,
          companies!inner (
            name,
            description,
            location,
            owner_user_id
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      setJob(data as Job);
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return;
      setError(err instanceof Error ? err.message : 'Failed to load job');
    } finally {
      setLoading(false);
    }
  }, [id, signal]);

  useEffect(() => {
    loadJob();
  }, [loadJob]);

  return {
    job,
    loading,
    error,
    refresh: loadJob,
  };
}

export function useCreateJob(): UseCreateJobReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createJob = useCallback(async (data: Omit<JobInsert, 'id'>): Promise<Job & { notificationResult?: any }> => {
    setError(null);
    setLoading(true);

    try {
      // First, create the job
      const { data: job, error } = await supabase
        .from('jobs')
        .insert(data)
        .select(`
          *,
          companies!inner (
            name,
            description,
            location,
            owner_user_id
          )
        `)
        .single();

      if (error) throw error;

      // Then, call the notification Edge Function
      let notificationResult = null;
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const authToken = session?.access_token;

        if (authToken) {
          const response = await fetch(`${supabase.supabaseUrl}/functions/v1/new-job-notify`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${authToken}`, // Use anon key for client calls
            },
            body: JSON.stringify({ jobId: job.id }),
          });

          if (response.ok) {
            notificationResult = await response.json();
            console.log('Notification result:', notificationResult);
          } else {
            console.warn('Failed to send notifications:', response.status, response.statusText);
            // Don't throw - job creation succeeded, notification failure is non-critical
          }
        }
      } catch (notifyError) {
        console.warn('Error calling notification function:', notifyError);
        // Don't throw - job creation succeeded, notification failure is non-critical
      }

      return { 
        ...job as Job, 
        notificationResult 
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create job';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    createJob,
    loading,
    error,
  };
}

export function useUpdateJob(): UseUpdateJobReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateJob = useCallback(async (id: string, data: JobUpdate): Promise<Job> => {
    setError(null);
    setLoading(true);

    try {
      const { data: job, error } = await supabase
        .from('jobs')
        .update(data)
        .eq('id', id)
        .select(`
          *,
          companies!inner (
            name,
            description,
            location,
            owner_user_id
          )
        `)
        .single();

      if (error) throw error;
      return job as Job;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update job';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    updateJob,
    loading,
    error,
  };
}

export function useUploadJobImages(): UseUploadJobImagesReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  const uploadImages = useCallback(async (jobId: string, images: File[]): Promise<string[]> => {
    setError(null);
    setLoading(true);
    setProgress(0);

    try {
      const uploadPromises = images.map(async (file, index) => {
        const fileExt = file.name.split('.').pop();
        const fileName = `${jobId}/${Date.now()}-${index}.${fileExt}`;

        const { data, error } = await supabase.storage
          .from('job-images')
          .upload(fileName, file);

        if (error) throw error;

        const { data: { publicUrl } } = supabase.storage
          .from('job-images')
          .getPublicUrl(data.path);

        setProgress((prev) => prev + (100 / images.length));
        return publicUrl;
      });

      const urls = await Promise.all(uploadPromises);

      // Update job with new image URLs
      const { data: currentJob } = await supabase
        .from('jobs')
        .select('images')
        .eq('id', jobId)
        .single();

      const currentImages = currentJob?.images || [];
      const updatedImages = [...currentImages, ...urls];

      const { error: updateError } = await supabase
        .from('jobs')
        .update({ images: updatedImages })
        .eq('id', jobId);

      if (updateError) throw updateError;

      return urls;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to upload images';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
      setProgress(0);
    }
  }, []);

  return {
    uploadImages,
    loading,
    error,
    progress,
  };
}