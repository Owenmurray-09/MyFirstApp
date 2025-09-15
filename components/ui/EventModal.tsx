import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { theme } from '@/config/theme';
import { Input } from './Input';
import { Button } from './Button';
import { Card } from './Card';
import { useCreateEvent } from '@/lib/hooks/useEvents';

interface EventModalProps {
  visible: boolean;
  onClose: () => void;
  onEventCreated?: () => void;
  jobId?: string;
  participantUserId?: string;
  initialDate?: Date;
}

export function EventModal({
  visible,
  onClose,
  onEventCreated,
  jobId,
  participantUserId,
  initialDate,
}: EventModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [eventType, setEventType] = useState<'interview' | 'shift' | 'meeting'>('interview');
  const [date, setDate] = useState(initialDate || new Date());
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');

  const { createEvent, loading } = useCreateEvent();

  const handleSubmit = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter an event title');
      return;
    }

    if (!jobId) {
      Alert.alert('Error', 'Job ID is required');
      return;
    }

    try {
      const startDateTime = new Date(date);
      const [startHour, startMinute] = startTime.split(':').map(Number);
      startDateTime.setHours(startHour, startMinute, 0, 0);

      const endDateTime = new Date(date);
      const [endHour, endMinute] = endTime.split(':').map(Number);
      endDateTime.setHours(endHour, endMinute, 0, 0);

      if (endDateTime <= startDateTime) {
        Alert.alert('Error', 'End time must be after start time');
        return;
      }

      await createEvent({
        title: title.trim(),
        description: description.trim() || undefined,
        start_time: startDateTime.toISOString(),
        end_time: endDateTime.toISOString(),
        event_type: eventType,
        job_id: jobId,
        participant_user_id: participantUserId,
      });

      // Reset form
      setTitle('');
      setDescription('');
      setEventType('interview');
      setStartTime('09:00');
      setEndTime('10:00');

      onEventCreated?.();
      onClose();
    } catch (error) {
      console.error('Error creating event:', error);
      Alert.alert('Error', 'Failed to create event. Please try again.');
    }
  };

  const formatDateForInput = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  const handleDateChange = (dateString: string) => {
    const newDate = new Date(dateString);
    if (!isNaN(newDate.getTime())) {
      setDate(newDate);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Create Event</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <Card style={styles.form}>
            <Input
              label="Event Title"
              value={title}
              onChangeText={setTitle}
              placeholder="Interview with candidate"
              required
            />

            <Input
              label="Description (Optional)"
              value={description}
              onChangeText={setDescription}
              placeholder="Additional details about the event"
              multiline
              style={styles.textArea}
            />

            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Event Type</Text>
              <View style={styles.typeButtons}>
                {(['interview', 'shift', 'meeting'] as const).map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.typeButton,
                      eventType === type && styles.typeButtonActive,
                    ]}
                    onPress={() => setEventType(type)}
                  >
                    <Text
                      style={[
                        styles.typeButtonText,
                        eventType === type && styles.typeButtonTextActive,
                      ]}
                    >
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <Input
              label="Date"
              value={formatDateForInput(date)}
              onChangeText={handleDateChange}
              placeholder="YYYY-MM-DD"
            />

            <View style={styles.timeRow}>
              <View style={styles.timeInput}>
                <Input
                  label="Start Time"
                  value={startTime}
                  onChangeText={setStartTime}
                  placeholder="HH:MM"
                />
              </View>
              <View style={styles.timeInput}>
                <Input
                  label="End Time"
                  value={endTime}
                  onChangeText={setEndTime}
                  placeholder="HH:MM"
                />
              </View>
            </View>
          </Card>
        </ScrollView>

        <View style={styles.footer}>
          <Button
            title="Create Event"
            onPress={handleSubmit}
            loading={loading}
            disabled={loading || !title.trim()}
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  closeButton: {
    padding: theme.spacing.sm,
  },
  closeButtonText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.primary,
  },
  title: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
  },
  placeholder: {
    width: 60,
  },
  content: {
    flex: 1,
    padding: theme.spacing.lg,
  },
  form: {
    padding: theme.spacing.lg,
    gap: theme.spacing.lg,
  },
  textArea: {
    minHeight: 80,
  },
  section: {
    gap: theme.spacing.sm,
  },
  sectionLabel: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.text,
  },
  typeButtons: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  typeButton: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: 'white',
    alignItems: 'center',
  },
  typeButtonActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  typeButtonText: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.text,
  },
  typeButtonTextActive: {
    color: 'white',
  },
  timeRow: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  timeInput: {
    flex: 1,
  },
  footer: {
    padding: theme.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
});