import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { Database } from '@/types/db';

type Thread = Database['public']['Tables']['threads']['Row'] & {
  applications?: {
    id: string;
    jobs: {
      title: string;
      companies: {
        name: string;
      };
    };
    students: {
      full_name: string;
    };
  };
  last_message?: {
    content: string;
    created_at: string;
    sender_user_id: string;
    sender?: {
      full_name: string;
      role: 'student' | 'employer';
    };
  };
};

type ThreadInsert = Database['public']['Tables']['threads']['Insert'];

type Message = Database['public']['Tables']['messages']['Row'] & {
  sender?: {
    full_name: string;
    role: 'student' | 'employer';
  };
};

type MessageInsert = Database['public']['Tables']['messages']['Insert'];

interface UseThreadsFilters {
  role?: 'student' | 'employer';
}

interface UseThreadsReturn {
  threads: Thread[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

interface UseThreadReturn {
  thread: Thread | null;
  messages: Message[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

interface UseSendMessageReturn {
  sendMessage: (threadId: string, content: string) => Promise<void>;
  loading: boolean;
  error: string | null;
}

export function useThreads(
  filters: UseThreadsFilters = {},
  signal?: AbortSignal
): UseThreadsReturn {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadThreads = useCallback(async () => {
    setError(null);
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      let query = supabase
        .from('threads')
        .select(`
          *,
          applications!inner (
            id,
            jobs!inner (
              title,
              companies!inner (
                name
              )
            ),
            students!inner (
              full_name
            )
          )
        `)
        .order('updated_at', { ascending: false });

      if (filters.role === 'student') {
        query = query.eq('applications.student_user_id', user.id);
      } else if (filters.role === 'employer') {
        query = query.eq('applications.jobs.companies.owner_user_id', user.id);
      }

      const { data: threadsData, error: threadsError } = await query.abortSignal(signal);

      if (threadsError) throw threadsError;

      // Get last message for each thread with sender info
      const threadsWithMessages = await Promise.all(
        (threadsData as Thread[]).map(async (thread) => {
          const { data: lastMessage } = await supabase
            .from('messages')
            .select(`
              content,
              created_at,
              sender_user_id,
              profiles!sender_user_id (
                full_name,
                role
              )
            `)
            .eq('thread_id', thread.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          return {
            ...thread,
            last_message: lastMessage ? {
              ...lastMessage,
              sender: lastMessage.profiles,
            } : undefined,
          };
        })
      );

      setThreads(threadsWithMessages);
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return;
      setError(err instanceof Error ? err.message : 'Failed to load threads');
    } finally {
      setLoading(false);
    }
  }, [filters, signal]);

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

export function useThread(threadId: string, signal?: AbortSignal): UseThreadReturn {
  const [thread, setThread] = useState<Thread | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadThread = useCallback(async () => {
    if (!threadId) return;

    setError(null);
    setLoading(true);

    try {
      // Load thread details
      const { data: threadData, error: threadError } = await supabase
        .from('threads')
        .select(`
          *,
          applications!inner (
            id,
            jobs!inner (
              title,
              companies!inner (
                name
              )
            ),
            students!inner (
              full_name
            )
          )
        `)
        .eq('id', threadId)
        .single()
        .abortSignal(signal);

      if (threadError) throw threadError;

      // Load messages
      const { data: messagesData, error: messagesError } = await supabase
        .from('messages')
        .select(`
          *,
          profiles!sender_user_id (
            full_name,
            role
          )
        `)
        .eq('thread_id', threadId)
        .order('created_at', { ascending: true })
        .abortSignal(signal);

      if (messagesError) throw messagesError;

      setThread(threadData as Thread);
      setMessages(messagesData as Message[]);
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return;
      setError(err instanceof Error ? err.message : 'Failed to load thread');
    } finally {
      setLoading(false);
    }
  }, [threadId, signal]);

  useEffect(() => {
    loadThread();

    // Set up real-time subscription for messages in this thread
    const messagesSubscription = supabase
      .channel(`thread-${threadId}-messages`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `thread_id=eq.${threadId}`,
        },
        async (payload) => {
          // Get the full message with sender info
          const { data: newMessage } = await supabase
            .from('messages')
            .select(`
              *,
              profiles!sender_user_id (
                full_name,
                role
              )
            `)
            .eq('id', payload.new.id)
            .single();

          if (newMessage) {
            setMessages(prev => [...prev, {
              ...newMessage,
              sender: newMessage.profiles,
            } as Message]);
          }
        }
      )
      .subscribe();

    return () => {
      messagesSubscription.unsubscribe();
    };
  }, [loadThread, threadId]);

  return {
    thread,
    messages,
    loading,
    error,
    refresh: loadThread,
  };
}

export function useSendMessage(): UseSendMessageReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = useCallback(async (threadId: string, content: string) => {
    setError(null);
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      const messageData: MessageInsert = {
        thread_id: threadId,
        sender_user_id: user.id,
        content,
      };

      const { error: insertError } = await supabase
        .from('messages')
        .insert(messageData);

      if (insertError) throw insertError;

      // Update thread's last_message_at and updated_at timestamps
      const now = new Date().toISOString();
      const { error: updateError } = await supabase
        .from('threads')
        .update({ 
          updated_at: now,
          last_message_at: now 
        })
        .eq('id', threadId);

      if (updateError) throw updateError;
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