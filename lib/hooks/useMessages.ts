import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { Database } from '@/types/db';

type Thread = Database['public']['Tables']['threads']['Row'] & {
  jobs: {
    title: string;
    companies: {
      name: string;
    };
  };
  employer_profile: {
    full_name: string;
  };
  student_profile: {
    full_name: string;
  };
  messages: {
    id: string;
    body: string;
    created_at: string;
  }[];
};

type Message = Database['public']['Tables']['messages']['Row'] & {
  sender_profile: {
    full_name: string;
  };
};

type ThreadInsert = Database['public']['Tables']['threads']['Insert'];
type MessageInsert = Database['public']['Tables']['messages']['Insert'];

interface UseThreadsReturn {
  threads: Thread[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

interface UseMessagesReturn {
  messages: Message[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

interface UseSendMessageReturn {
  sendMessage: (threadId: string, body: string) => Promise<void>;
  loading: boolean;
  error: string | null;
}

interface UseCreateThreadReturn {
  createThread: (jobId: string, employerUserId: string, studentUserId: string) => Promise<Thread>;
  loading: boolean;
  error: string | null;
}

export function useThreads(): UseThreadsReturn {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadThreads = useCallback(async () => {
    setError(null);
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      const { data, error } = await supabase
        .from('threads')
        .select(`
          *,
          jobs!inner (
            title,
            companies!inner (
              name
            )
          ),
          employer_profile:profiles!employer_user_id (
            full_name
          ),
          student_profile:profiles!student_user_id (
            full_name
          ),
          messages (
            id,
            body,
            created_at
          )
        `)
        .or(`employer_user_id.eq.${user.id},student_user_id.eq.${user.id}`)
        .order('last_message_at', { ascending: false });

      if (error) throw error;
      setThreads(data as Thread[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load threads');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadThreads();
  }, [loadThreads]);

  return {
    threads,
    loading,
    error,
    refresh: loadThreads,
  };
}

export function useMessages(threadId: string): UseMessagesReturn {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadMessages = useCallback(async () => {
    if (!threadId) return;

    setError(null);
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender_profile:profiles!sender_user_id (
            full_name
          )
        `)
        .eq('thread_id', threadId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data as Message[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load messages');
    } finally {
      setLoading(false);
    }
  }, [threadId]);

  useEffect(() => {
    loadMessages();

    // Set up real-time subscription for new messages
    const subscription = supabase
      .channel(`messages:${threadId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `thread_id=eq.${threadId}`,
        },
        (payload) => {
          // Add the new message to the list
          const newMessage = payload.new as Message;
          setMessages(prev => [...prev, newMessage]);
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [loadMessages, threadId]);

  return {
    messages,
    loading,
    error,
    refresh: loadMessages,
  };
}

export function useSendMessage(): UseSendMessageReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = useCallback(async (threadId: string, body: string) => {
    setError(null);
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      const messageData: MessageInsert = {
        thread_id: threadId,
        sender_user_id: user.id,
        body: body.trim(),
      };

      const { error: messageError } = await supabase
        .from('messages')
        .insert(messageData);

      if (messageError) throw messageError;

      // Update thread's last message timestamp
      const { error: threadError } = await supabase
        .from('threads')
        .update({ last_message_at: new Date().toISOString() })
        .eq('id', threadId);

      if (threadError) throw threadError;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send message';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    sendMessage,
    loading,
    error,
  };
}

export function useCreateThread(): UseCreateThreadReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createThread = useCallback(async (
    jobId: string,
    employerUserId: string,
    studentUserId: string
  ): Promise<Thread> => {
    setError(null);
    setLoading(true);

    try {
      // Check if thread already exists
      const { data: existingThread } = await supabase
        .from('threads')
        .select('id')
        .eq('job_id', jobId)
        .eq('employer_user_id', employerUserId)
        .eq('student_user_id', studentUserId)
        .single();

      if (existingThread) {
        // Thread already exists, return it
        const { data: fullThread, error } = await supabase
          .from('threads')
          .select(`
            *,
            jobs!inner (
              title,
              companies!inner (
                name
              )
            ),
            employer_profile:profiles!employer_user_id (
              full_name
            ),
            student_profile:profiles!student_user_id (
              full_name
            ),
            messages (
              id,
              body,
              created_at
            )
          `)
          .eq('id', existingThread.id)
          .single();

        if (error) throw error;
        return fullThread as Thread;
      }

      // Create new thread
      const threadData: ThreadInsert = {
        job_id: jobId,
        employer_user_id: employerUserId,
        student_user_id: studentUserId,
      };

      const { data: newThread, error } = await supabase
        .from('threads')
        .insert(threadData)
        .select(`
          *,
          jobs!inner (
            title,
            companies!inner (
              name
            )
          ),
          employer_profile:profiles!employer_user_id (
            full_name
          ),
          student_profile:profiles!student_user_id (
            full_name
          ),
          messages (
            id,
            body,
            created_at
          )
        `)
        .single();

      if (error) throw error;
      return newThread as Thread;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create thread';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    createThread,
    loading,
    error,
  };
}