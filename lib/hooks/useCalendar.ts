import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { Database } from '@/types/db';

type Event = Database['public']['Tables']['events']['Row'] & {
  profiles?: {
    full_name: string;
    role: 'student' | 'employer';
  };
};

type EventInsert = Database['public']['Tables']['events']['Insert'];

interface UseCalendarFilters {
  startDate?: string;
  endDate?: string;
}

interface UseCalendarReturn {
  events: Event[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

interface UseCreateEventReturn {
  createEvent: (data: Omit<EventInsert, 'id' | 'created_at'>) => Promise<Event>;
  loading: boolean;
  error: string | null;
}

export function useCalendar(
  filters: UseCalendarFilters = {},
  signal?: AbortSignal
): UseCalendarReturn {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadEvents = useCallback(async () => {
    setError(null);
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      let query = supabase
        .from('events')
        .select(`
          *,
          profiles!organizer_user_id (
            full_name,
            role
          )
        `)
        .eq('organizer_user_id', user.id)
        .order('start_time', { ascending: true });

      if (filters.startDate) {
        query = query.gte('start_time', filters.startDate);
      }

      if (filters.endDate) {
        query = query.lte('start_time', filters.endDate);
      }

      const { data, error } = await query.abortSignal(signal);

      if (error) throw error;
      setEvents(data as Event[]);
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return;
      setError(err instanceof Error ? err.message : 'Failed to load events');
    } finally {
      setLoading(false);
    }
  }, [filters, signal]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  return {
    events,
    loading,
    error,
    refresh: loadEvents,
  };
}

export function useCreateEvent(): UseCreateEventReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createEvent = useCallback(async (
    data: Omit<EventInsert, 'id' | 'created_at'>
  ): Promise<Event> => {
    setError(null);
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      const eventData: EventInsert = {
        ...data,
        organizer_user_id: user.id,
      };

      const { data: event, error } = await supabase
        .from('events')
        .insert(eventData)
        .select(`
          *,
          profiles!organizer_user_id (
            full_name,
            role
          )
        `)
        .single();

      if (error) throw error;
      return event as Event;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create event';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    createEvent,
    loading,
    error,
  };
}