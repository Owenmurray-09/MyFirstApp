import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { theme } from '@/config/theme';

export interface CalendarEvent {
  id: string;
  title: string;
  date: Date;
  startTime?: Date;
  endTime?: Date;
  type: 'interview' | 'shift' | 'meeting';
  jobTitle?: string;
  company?: string;
}

interface CalendarProps {
  events: CalendarEvent[];
  onDatePress: (date: Date) => void;
  onEventPress?: (event: CalendarEvent) => void;
  selectedDate?: Date;
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export function Calendar({ events, onDatePress, onEventPress, selectedDate }: CalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const getMonthData = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const days = [];
    const current = new Date(startDate);
    
    for (let i = 0; i < 42; i++) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    
    return { days, firstDay, lastDay };
  };

  const getEventsForDate = (date: Date) => {
    return events.filter(event => {
      const eventDate = new Date(event.date);
      return eventDate.toDateString() === date.toDateString();
    });
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
    setCurrentDate(newDate);
  };

  const isToday = (date: Date) => {
    return date.toDateString() === new Date().toDateString();
  };

  const isSelected = (date: Date) => {
    return selectedDate && date.toDateString() === selectedDate.toDateString();
  };

  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === currentDate.getMonth();
  };

  const { days } = getMonthData(currentDate);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigateMonth('prev')}
          style={styles.navButton}
        >
          <Text style={styles.navText}>‹</Text>
        </TouchableOpacity>
        
        <Text style={styles.monthYear}>
          {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
        </Text>
        
        <TouchableOpacity
          onPress={() => navigateMonth('next')}
          style={styles.navButton}
        >
          <Text style={styles.navText}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Day headers */}
      <View style={styles.dayHeaders}>
        {DAYS.map(day => (
          <View key={day} style={styles.dayHeader}>
            <Text style={styles.dayHeaderText}>{day}</Text>
          </View>
        ))}
      </View>

      {/* Calendar grid */}
      <View style={styles.calendar}>
        {Array.from({ length: 6 }).map((_, weekIndex) => (
          <View key={weekIndex} style={styles.week}>
            {days.slice(weekIndex * 7, (weekIndex + 1) * 7).map(date => {
              const dayEvents = getEventsForDate(date);
              const hasEvents = dayEvents.length > 0;
              
              return (
                <TouchableOpacity
                  key={date.toISOString()}
                  style={[
                    styles.day,
                    !isCurrentMonth(date) && styles.otherMonth,
                    isToday(date) && styles.today,
                    isSelected(date) && styles.selected,
                    hasEvents && styles.hasEvents,
                  ]}
                  onPress={() => onDatePress(date)}
                >
                  <Text style={[
                    styles.dayText,
                    !isCurrentMonth(date) && styles.otherMonthText,
                    isToday(date) && styles.todayText,
                    isSelected(date) && styles.selectedText,
                  ]}>
                    {date.getDate()}
                  </Text>
                  {hasEvents && (
                    <View style={styles.eventIndicator}>
                      <Text style={styles.eventCount}>{dayEvents.length}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </View>

      {/* Selected date events */}
      {selectedDate && (
        <View style={styles.eventsSection}>
          <Text style={styles.eventsSectionTitle}>
            Events for {selectedDate.toLocaleDateString()}
          </Text>
          <ScrollView style={styles.eventsList} showsVerticalScrollIndicator={false}>
            {getEventsForDate(selectedDate).map(event => (
              <TouchableOpacity
                key={event.id}
                style={[styles.eventItem, styles[`${event.type}Event`]]}
                onPress={() => onEventPress?.(event)}
              >
                <View style={styles.eventHeader}>
                  <Text style={styles.eventTitle}>{event.title}</Text>
                  <Text style={styles.eventType}>
                    {event.type.charAt(0).toUpperCase() + event.type.slice(1)}
                  </Text>
                </View>
                {event.startTime && event.endTime && (
                  <Text style={styles.eventTime}>
                    {event.startTime.toLocaleTimeString([], { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })} - {event.endTime.toLocaleTimeString([], { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </Text>
                )}
                {event.jobTitle && (
                  <Text style={styles.eventJob}>
                    {event.jobTitle} {event.company && `at ${event.company}`}
                  </Text>
                )}
              </TouchableOpacity>
            ))}
            {getEventsForDate(selectedDate).length === 0 && (
              <Text style={styles.noEvents}>No events scheduled</Text>
            )}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: theme.spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  navButton: {
    padding: theme.spacing.sm,
    borderRadius: 8,
    backgroundColor: theme.colors.surface || '#f5f5f5',
  },
  navText: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.primary,
  },
  monthYear: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
  },
  dayHeaders: {
    flexDirection: 'row',
    marginBottom: theme.spacing.sm,
  },
  dayHeader: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
  },
  dayHeaderText: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.textSecondary,
  },
  calendar: {
    marginBottom: theme.spacing.lg,
  },
  week: {
    flexDirection: 'row',
  },
  day: {
    flex: 1,
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    margin: 1,
    position: 'relative',
  },
  dayText: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.text,
  },
  otherMonth: {
    opacity: 0.3,
  },
  otherMonthText: {
    color: theme.colors.textSecondary,
  },
  today: {
    backgroundColor: theme.colors.primary,
  },
  todayText: {
    color: 'white',
    fontWeight: theme.fontWeight.bold,
  },
  selected: {
    backgroundColor: theme.colors.primaryLight || theme.colors.primary + '20',
    borderWidth: 2,
    borderColor: theme.colors.primary,
  },
  selectedText: {
    color: theme.colors.primary,
    fontWeight: theme.fontWeight.bold,
  },
  hasEvents: {
    backgroundColor: theme.colors.surface || '#f0f8ff',
  },
  eventIndicator: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: theme.colors.primary,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  eventCount: {
    fontSize: 10,
    fontWeight: theme.fontWeight.bold,
    color: 'white',
  },
  eventsSection: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingTop: theme.spacing.lg,
  },
  eventsSectionTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  eventsList: {
    maxHeight: 200,
  },
  eventItem: {
    padding: theme.spacing.md,
    borderRadius: 8,
    marginBottom: theme.spacing.sm,
    borderLeftWidth: 4,
  },
  interviewEvent: {
    backgroundColor: '#fff3e0',
    borderLeftColor: '#f57c00',
  },
  shiftEvent: {
    backgroundColor: '#e8f5e8',
    borderLeftColor: '#4caf50',
  },
  meetingEvent: {
    backgroundColor: '#e3f2fd',
    borderLeftColor: '#2196f3',
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
  eventType: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.textSecondary,
    textTransform: 'capitalize',
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
  noEvents: {
    textAlign: 'center',
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
    paddingVertical: theme.spacing.xl,
  },
});