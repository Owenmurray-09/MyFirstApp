import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { Database } from '@/types/db';

type Comment = Database['public']['Tables']['comments']['Row'] & {
  profiles?: {
    full_name: string;
    role: 'student' | 'employer';
  };
};

type CommentInsert = Database['public']['Tables']['comments']['Insert'];

interface UseCommentsReturn {
  comments: Comment[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

interface UseAddCommentReturn {
  addComment: (jobId: string, content: string) => Promise<void>;
  loading: boolean;
  error: string | null;
}

export function useComments(jobId: string, signal?: AbortSignal): UseCommentsReturn {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadComments = useCallback(async () => {
    if (!jobId) return;

    setError(null);
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from('comments')
        .select(`
          *,
          profiles!commenter_user_id (
            full_name,
            role
          )
        `)
        .eq('job_id', jobId)
        .order('created_at', { ascending: true })
        .abortSignal(signal);

      if (error) throw error;
      setComments(data as Comment[]);
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return;
      setError(err instanceof Error ? err.message : 'Failed to load comments');
    } finally {
      setLoading(false);
    }
  }, [jobId, signal]);

  useEffect(() => {
    loadComments();
  }, [loadComments]);

  return {
    comments,
    loading,
    error,
    refresh: loadComments,
  };
}

export function useAddComment(): UseAddCommentReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addComment = useCallback(async (jobId: string, content: string) => {
    setError(null);
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      const commentData: CommentInsert = {
        job_id: jobId,
        commenter_user_id: user.id,
        content,
      };

      const { error } = await supabase
        .from('comments')
        .insert(commentData);

      if (error) throw error;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add comment';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    addComment,
    loading,
    error,
  };
}