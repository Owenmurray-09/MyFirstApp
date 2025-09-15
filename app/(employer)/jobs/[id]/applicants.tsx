import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, Text, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { theme } from '@/config/theme';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';

interface Application {
  id: string;
  note: string | null;
  status: 'submitted' | 'accepted' | 'rejected';
  created_at: string;
  profiles: {
    name: string;
    bio: string;
    avatar_url: string | null;
  };
}

export default function ApplicantsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadApplications();
    }
  }, [id]);

  const loadApplications = async () => {
    try {
      const { data, error } = await supabase
        .from('applications')
        .select(`
          id,
          note,
          status,
          created_at,
          profiles!inner (
            name,
            bio,
            avatar_url
          )
        `)
        .eq('job_id', id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setApplications(data || []);
    } catch (error) {
      console.error('Error loading applications:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateApplicationStatus = async (applicationId: string, status: 'accepted' | 'rejected') => {
    try {
      const { error } = await supabase
        .from('applications')
        .update({ status })
        .eq('id', applicationId);

      if (error) throw error;

      Alert.alert('Success', `Application ${status} successfully`);
      await loadApplications();
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const renderApplication = ({ item }: { item: Application }) => (
    <Card style={styles.applicationCard}>
      <View style={styles.applicantHeader}>
        <Avatar 
          src={item.profiles.avatar_url} 
          name={item.profiles.name} 
          size="md" 
        />
        <View style={styles.applicantInfo}>
          <Text style={styles.applicantName}>{item.profiles.name}</Text>
          <Text style={styles.applicantBio} numberOfLines={2}>
            {item.profiles.bio}
          </Text>
          <Text style={styles.applicationDate}>
            Applied {new Date(item.created_at).toLocaleDateString()}
          </Text>
        </View>
      </View>

      {item.note && (
        <View style={styles.noteSection}>
          <Text style={styles.noteTitle}>Cover Note:</Text>
          <Text style={styles.noteText}>{item.note}</Text>
        </View>
      )}

      {item.status === 'submitted' && (
        <View style={styles.actions}>
          <Button
            title="Accept"
            onPress={() => updateApplicationStatus(item.id, 'accepted')}
            variant="secondary"
            size="sm"
          />
          <Button
            title="Reject"
            onPress={() => updateApplicationStatus(item.id, 'rejected')}
            variant="outline"
            size="sm"
          />
        </View>
      )}

      {item.status !== 'submitted' && (
        <View style={styles.statusBadge}>
          <Text style={[
            styles.statusText,
            { color: item.status === 'accepted' ? theme.colors.success : theme.colors.error }
          ]}>
            {item.status.toUpperCase()}
          </Text>
        </View>
      )}
    </Card>
  );

  const renderEmpty = () => (
    <View style={styles.empty}>
      <Text style={styles.emptyTitle}>No applications yet</Text>
      <Text style={styles.emptyText}>
        Students will see your job posting and can apply directly
      </Text>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loading}>
          <Text style={styles.loadingText}>Loading applications...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Applications</Text>
        <Text style={styles.subtitle}>{applications.length} applications received</Text>
      </View>

      <FlatList
        data={applications}
        keyExtractor={(item) => item.id}
        renderItem={renderApplication}
        contentContainerStyle={styles.list}
        ListEmptyComponent={renderEmpty}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
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
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: theme.fontSize.lg,
    color: theme.colors.textSecondary,
  },
  list: {
    padding: theme.spacing.lg,
    paddingTop: 0,
    flexGrow: 1,
  },
  applicationCard: {
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  applicantHeader: {
    flexDirection: 'row',
    marginBottom: theme.spacing.md,
  },
  applicantInfo: {
    flex: 1,
    marginLeft: theme.spacing.md,
  },
  applicantName: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  applicantBio: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  applicationDate: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textLight,
  },
  noteSection: {
    marginBottom: theme.spacing.md,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
  },
  noteTitle: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  noteText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
    lineHeight: 20,
  },
  actions: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.surface,
  },
  statusText: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.bold,
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: theme.spacing.xxl,
  },
  emptyTitle: {
    fontSize: theme.fontSize.xl,
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