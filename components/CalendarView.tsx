import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '@/config/theme';
import { Calendar, CalendarEvent } from '@/components/ui/Calendar';
import { EventModal } from '@/components/ui/EventModal';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/lib/hooks/useAuth';
import { useEvents, useUpdateEvent } from '@/lib/hooks/useEvents';
import { useJobs } from '@/lib/hooks/useJobs';

interface CalendarViewProps {
  jobId?: string; // Optional job filter for employer job-specific calendar
}

export function CalendarView({ jobId }: CalendarViewProps) {
  const { profile } = useAuth();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [showEventModal, setShowEventModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const { events, loading, refresh } = useEvents();
  const { updateEvent, acceptEvent, declineEvent, cancelEvent } = useUpdateEvent();
  const { jobs } = useJobs(profile?.role === 'employer' ? { companyId: profile.company_id } : {});

  // Transform events for calendar component
  const calendarEvents: CalendarEvent[] = useMemo(() => {
    const filteredEvents = jobId ? events.filter(e => e.job_id === jobId) : events;
    
    return filteredEvents.map(event => ({
      id: event.id,
      title: event.title,
      date: new Date(event.start_time),
      startTime: new Date(event.start_time),
      endTime: new Date(event.end_time),
      type: event.event_type as 'interview' | 'shift' | 'meeting',
      jobTitle: event.jobs?.title,
      company: event.jobs?.companies?.name,
    }));
  }, [events, jobId]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  const handleEventPress = (event: CalendarEvent) => {
    const dbEvent = events.find(e => e.id === event.id);
    if (!dbEvent) return;

    const isOrganizer = dbEvent.organizer_user_id === profile?.id;
    const isParticipant = dbEvent.participant_user_id === profile?.id;
    const canRespond = isParticipant && dbEvent.status === 'pending';
    const canCancel = isOrganizer && ['pending', 'confirmed'].includes(dbEvent.status);

    const actions = [];

    if (canRespond) {
      actions.push(
        { text: 'Accept', onPress: () => handleAcceptEvent(dbEvent.id) },
        { text: 'Decline', onPress: () => handleDeclineEvent(dbEvent.id) }
      );
    }

    if (canCancel) {
      actions.push(
        { text: 'Cancel Event', style: 'destructive' as const, onPress: () => handleCancelEvent(dbEvent.id) }
      );
    }

    actions.push({ text: 'Close', style: 'cancel' as const });

    const statusText = {
      pending: 'Pending response',
      confirmed: 'Confirmed',
      declined: 'Declined',
      cancelled: 'Cancelled',
    }[dbEvent.status];

    const organizerText = isOrganizer ? 'You' : dbEvent.organizer?.full_name;
    const participantText = isParticipant ? 'You' : dbEvent.participant?.full_name;

    Alert.alert(
      event.title,
      [
        event.jobTitle && `Job: ${event.jobTitle}`,
        event.company && `Company: ${event.company}`,
        `Organizer: ${organizerText}`,
        dbEvent.participant_user_id && `Participant: ${participantText}`,
        `Status: ${statusText}`,
        `Time: ${event.startTime?.toLocaleString()} - ${event.endTime?.toLocaleString()}`,
        dbEvent.description && `\n${dbEvent.description}`,
      ]
        .filter(Boolean)
        .join('\n'),
      actions
    );
  };

  const handleAcceptEvent = async (eventId: string) => {
    try {
      await acceptEvent(eventId);
      refresh();
    } catch (error) {
      Alert.alert('Error', 'Failed to accept event');
    }
  };

  const handleDeclineEvent = async (eventId: string) => {
    try {
      await declineEvent(eventId);
      refresh();
    } catch (error) {
      Alert.alert('Error', 'Failed to decline event');
    }
  };

  const handleCancelEvent = async (eventId: string) => {
    try {
      await cancelEvent(eventId);
      refresh();
    } catch (error) {
      Alert.alert('Error', 'Failed to cancel event');
    }
  };

  const getDefaultJobId = () => {
    if (jobId) return jobId;
    if (profile?.role === 'employer' && jobs.length > 0) {
      return jobs[0].id;
    }
    return undefined;
  };

  const canCreateEvent = () => {
    return profile?.role === 'employer' && (jobId || jobs.length > 0);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loading}>
          <Text style={styles.loadingText}>Loading calendar...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>
            {jobId ? 'Job Calendar' : 'My Calendar'}
          </Text>
          <Text style={styles.subtitle}>
            {profile?.role === 'student' 
              ? 'Your interviews and events'
              : jobId 
                ? 'Events for this job'
                : 'Events you organize'
            }
          </Text>
        </View>

        <View style={styles.content}>
          <Card>
            <Calendar
              events={calendarEvents}
              onDatePress={setSelectedDate}
              onEventPress={handleEventPress}
              selectedDate={selectedDate}
            />
          </Card>

          {canCreateEvent() && (
            <View style={styles.actions}>
              <Button
                title="Create Event"
                onPress={() => setShowEventModal(true)}
                variant="outline"
              />
            </View>
          )}

          {/* Upcoming events */}
          {events.length > 0 && (
            <Card style={styles.upcomingSection}>
              <Text style={styles.sectionTitle}>Upcoming Events</Text>
              {events
                .filter(event => new Date(event.start_time) >= new Date())
                .slice(0, 5)
                .map(event => (
                  <TouchableOpacity
                    key={event.id}
                    style={styles.eventItem}
                    onPress={() => handleEventPress(calendarEvents.find(e => e.id === event.id)!)}
                  >
                    <View style={styles.eventHeader}>
                      <Text style={styles.eventTitle}>{event.title}</Text>
                      <Text style={[styles.eventStatus, styles[`status${event.status.charAt(0).toUpperCase() + event.status.slice(1)}`]]}>
                        {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
                      </Text>
                    </View>
                    <Text style={styles.eventTime}>
                      {new Date(event.start_time).toLocaleDateString()} at{' '}
                      {new Date(event.start_time).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Text>
                    {event.jobs && (
                      <Text style={styles.eventJob}>
                        {event.jobs.title} at {event.jobs.companies?.name}
                      </Text>
                    )}
                  </TouchableOpacity>
                ))}
            </Card>
          )}

          {events.length === 0 && (
            <Card style={styles.emptyState}>
              <Text style={styles.emptyTitle}>No events scheduled</Text>
              <Text style={styles.emptyText}>
                {profile?.role === 'student'
                  ? 'Interview invitations and events will appear here'
                  : 'Create events to schedule interviews and meetings'
                }
              </Text>
            </Card>
          )}
        </View>
      </ScrollView>

      <EventModal
        visible={showEventModal}
        onClose={() => setShowEventModal(false)}
        onEventCreated={() => {
          refresh();
          setShowEventModal(false);
        }}
        jobId={getDefaultJobId()}
        initialDate={selectedDate}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: theme.fontSize.lg,
    color: theme.colors.textSecondary,
  },
  header: {
    padding: theme.spacing.lg,
  },
  title: {
    fontSize: theme.fontSize.xxxl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
  },
  content: {
    padding: theme.spacing.lg,
    paddingTop: 0,
    gap: theme.spacing.lg,
  },
  actions: {
    alignItems: 'center',
  },
  upcomingSection: {
    padding: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  eventItem: {
    padding: theme.spacing.md,
    borderRadius: 8,
    backgroundColor: theme.colors.surface || '#f9f9f9',
    marginBottom: theme.spacing.sm,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.xs,
  },
  eventTitle: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    flex: 1,
    marginRight: theme.spacing.sm,
  },
  eventStatus: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 2,
    borderRadius: 12,
  },
  statusPending: {
    backgroundColor: '#fff3e0',
    color: '#f57c00',
  },
  statusConfirmed: {
    backgroundColor: '#e8f5e8',
    color: '#4caf50',
  },
  statusDeclined: {
    backgroundColor: '#ffebee',
    color: '#f44336',
  },
  statusCancelled: {
    backgroundColor: '#f5f5f5',
    color: '#9e9e9e',
  },
  eventTime: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  eventJob: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text,
    fontStyle: 'italic',
  },
  emptyState: {
    padding: theme.spacing.xl,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  emptyText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
});