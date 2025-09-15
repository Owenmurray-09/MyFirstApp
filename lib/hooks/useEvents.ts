import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './useAuth';
import type { Database } from '@/types/db';

type Event = Database['public']['Tables']['events']['Row'] & {
  jobs?: Database['public']['Tables']['jobs']['Row'] & {
    companies?: Database['public']['Tables']['companies']['Row'];
  };
  organizer?: Database['public']['Tables']['profiles']['Row'];
  participant?: Database['public']['Tables']['profiles']['Row'];
};

type CreateEventData = Database['public']['Tables']['events']['Insert'];

export function useEvents() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const { profile } = useAuth();

  const fetchEvents = async () => {
    if (!profile?.id) return;

    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('events')
        .select(`
          *,
          jobs:job_id (
            *,
            companies (*)
          ),
          organizer:organizer_user_id (
            id,
            full_name,
            role
          ),
          participant:participant_user_id (
            id,
            full_name,
            role
          )
        `)
        .or(`organizer_user_id.eq.${profile.id},participant_user_id.eq.${profile.id}`)
        .order('start_time', { ascending: true });

      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [profile?.id]);

  const refresh = async () => {
    await fetchEvents();
  };

  return {
    events,
    loading,
    refresh,
  };
}

export function useCreateEvent() {
  const [loading, setLoading] = useState(false);
  const { profile } = useAuth();

  const createEvent = async (eventData: {
    title: string;
    description?: string;
    start_time: string;
    end_time: string;
    event_type: 'interview' | 'shift' | 'meeting';
    job_id: string;
    participant_user_id?: string;
  }) => {
    if (!profile?.id) throw new Error('Not authenticated');

    try {
      setLoading(true);

      const newEvent: CreateEventData = {
        ...eventData,
        organizer_user_id: profile.id,
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('events')
        .insert(newEvent)
        .select(`
          *,
          jobs:job_id (
            *,
            companies (*)
          ),
          organizer:organizer_user_id (
            id,
            full_name,
            role
          ),
          participant:participant_user_id (
            id,
            full_name,
            role
          )
        `)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating event:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    createEvent,
    loading,
  };
}

export function useUpdateEvent() {
  const [loading, setLoading] = useState(false);

  const updateEvent = async (
    eventId: string,
    updates: Partial<Database['public']['Tables']['events']['Update']>
  ) => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('events')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', eventId)
        .select(`
          *,
          jobs:job_id (
            *,
            companies (*)
          ),
          organizer:organizer_user_id (
            id,
            full_name,
            role
          ),
          participant:participant_user_id (
            id,
            full_name,
            role
          )
        `)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating event:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const acceptEvent = async (eventId: string) => {
    return updateEvent(eventId, { status: 'confirmed' });
  };

  const declineEvent = async (eventId: string) => {
    return updateEvent(eventId, { status: 'declined' });
  };

  const cancelEvent = async (eventId: string) => {
    return updateEvent(eventId, { status: 'cancelled' });
  };

  return {
    updateEvent,
    acceptEvent,
    declineEvent,
    cancelEvent,
    loading,
  };
}

export function useEventsByJob(jobId: string) {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!jobId) return;

    const fetchJobEvents = async () => {
      try {
        setLoading(true);
        
        const { data, error } = await supabase
          .from('events')
          .select(`
            *,
            jobs:job_id (
              *,
              companies (*)
            ),
            organizer:organizer_user_id (
              id,
              full_name,
              role
            ),
            participant:participant_user_id (
              id,
              full_name,
              role
            )
          `)
          .eq('job_id', jobId)
          .order('start_time', { ascending: true });

        if (error) throw error;
        setEvents(data || []);
      } catch (error) {
        console.error('Error fetching job events:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchJobEvents();
  }, [jobId]);

  return {
    events,
    loading,
  };
}