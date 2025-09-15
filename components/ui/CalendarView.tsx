import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { theme } from '@/config/theme';
import { Card } from './Card';

interface CalendarEvent {
  id: string;
  title: string;
  start_at: string;
  end_at: string;
  notes?: string;
}

interface CalendarViewProps {
  events: CalendarEvent[];
  onEventPress?: (event: CalendarEvent) => void;
  loading?: boolean;
}

export const CalendarView: React.FC<CalendarViewProps> = ({ events, onEventPress, loading }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };
  
  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };
  
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };
  
  const getEventsForDate = (day: number) => {
    const targetDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    const targetDateString = targetDate.toISOString().split('T')[0];
    
    return events.filter(event => {
      const eventDate = new Date(event.start_at).toISOString().split('T')[0];
      return eventDate === targetDateString;
    });
  };
  
  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };
  
  const renderCalendarGrid = () => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const days = [];
    
    // Add empty cells for days before month starts
    for (let i = 0; i < firstDay; i++) {
      days.push(
        <View key={`empty-${i}`} style={styles.dayCell} />
      );
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dayEvents = getEventsForDate(day);
      const isToday = 
        new Date().getDate() === day &&
        new Date().getMonth() === currentDate.getMonth() &&
        new Date().getFullYear() === currentDate.getFullYear();
      
      days.push(
        <View key={day} style={[styles.dayCell, isToday && styles.today]}>
          <Text style={[styles.dayNumber, isToday && styles.todayText]}>{day}</Text>
          {dayEvents.length > 0 && (
            <View style={styles.eventDots}>
              {dayEvents.slice(0, 3).map((_, index) => (
                <View key={index} style={styles.eventDot} />
              ))}
            </View>
          )}
        </View>
      );
    }
    
    return days;
  };
  
  const renderUpcomingEvents = () => {
    const now = new Date();
    const upcomingEvents = events
      .filter(event => new Date(event.start_at) >= now)
      .sort((a, b) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime())
      .slice(0, 5);
    
    return upcomingEvents.map(event => (
      <TouchableOpacity
        key={event.id}
        onPress={() => onEventPress?.(event)}
        style={styles.eventItem}
      >
        <View style={styles.eventTime}>
          <Text style={styles.eventDate}>
            {new Date(event.start_at).toLocaleDateString('en-US', { 
              month: 'short', 
              day: 'numeric' 
            })}
          </Text>
          <Text style={styles.eventTimeText}>
            {new Date(event.start_at).toLocaleTimeString('en-US', { 
              hour: 'numeric', 
              minute: '2-digit' 
            })}
          </Text>
        </View>
        <View style={styles.eventDetails}>
          <Text style={styles.eventTitle}>{event.title}</Text>
          {event.notes && (
            <Text style={styles.eventNotes} numberOfLines={1}>{event.notes}</Text>
          )}
        </View>
      </TouchableOpacity>
    ));
  };
  
  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading calendar...</Text>
      </View>
    );
  }
  
  return (
    <ScrollView style={styles.container}>
      <Card style={styles.calendarCard}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigateMonth('prev')} style={styles.navButton}>
            <Text style={styles.navText}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.monthTitle}>{formatDate(currentDate)}</Text>
          <TouchableOpacity onPress={() => navigateMonth('next')} style={styles.navButton}>
            <Text style={styles.navText}>›</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.weekdays}>
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <Text key={day} style={styles.weekday}>{day}</Text>
          ))}
        </View>
        
        <View style={styles.calendar}>
          {renderCalendarGrid()}
        </View>
      </Card>
      
      <Card style={styles.eventsCard}>
        <Text style={styles.eventsTitle}>Upcoming Events</Text>
        {events.length === 0 ? (
          <Text style={styles.noEvents}>No upcoming events</Text>
        ) : (
          <View style={styles.eventsList}>
            {renderUpcomingEvents()}
          </View>
        )}
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.surface,
  },
  loadingText: {
    textAlign: 'center',
    color: theme.colors.textSecondary,
    padding: theme.spacing.xl,
  },
  calendarCard: {
    margin: theme.spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  navButton: {
    padding: theme.spacing.sm,
  },
  navText: {
    fontSize: theme.fontSize.xl,
    color: theme.colors.primary,
    fontWeight: theme.fontWeight.bold,
  },
  monthTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
  },
  weekdays: {
    flexDirection: 'row',
    marginBottom: theme.spacing.sm,
  },
  weekday: {
    flex: 1,
    textAlign: 'center',
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.textSecondary,
    paddingVertical: theme.spacing.sm,
  },
  calendar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.28%',
    aspectRatio: 1,
    padding: theme.spacing.xs,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  today: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.sm,
  },
  dayNumber: {
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
  },
  todayText: {
    color: theme.colors.background,
    fontWeight: theme.fontWeight.bold,
  },
  eventDots: {
    flexDirection: 'row',
    marginTop: theme.spacing.xs,
  },
  eventDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: theme.colors.secondary,
    marginHorizontal: 1,
  },
  eventsCard: {
    margin: theme.spacing.md,
    marginTop: 0,
  },
  eventsTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  noEvents: {
    textAlign: 'center',
    color: theme.colors.textSecondary,
    fontStyle: 'italic',
    padding: theme.spacing.lg,
  },
  eventsList: {
    gap: theme.spacing.sm,
  },
  eventItem: {
    flexDirection: 'row',
    padding: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.primary,
  },
  eventTime: {
    marginRight: theme.spacing.md,
    alignItems: 'center',
  },
  eventDate: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.primary,
  },
  eventTimeText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
  },
  eventDetails: {
    flex: 1,
  },
  eventTitle: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  eventNotes: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
  },
});