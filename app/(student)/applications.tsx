import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { theme } from '@/config/theme';
import { Card } from '@/components/ui/Card';
import { Tag } from '@/components/ui/Tag';
import { useApplications } from '@/lib/hooks/useApplications';

export default function ApplicationsScreen() {
  const { applications, loading, error } = useApplications();
  const router = useRouter();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'accepted':
        return 'success';
      case 'rejected':
        return 'danger';
      case 'pending':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'accepted':
        return 'Accepted';
      case 'rejected':
        return 'Rejected';
      case 'pending':
        return 'Under Review';
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loading}>
          <Text style={styles.loadingText}>Loading applications...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.error}>
          <Text style={styles.errorText}>Error loading applications: {error}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>My Applications</Text>
          <Text style={styles.subtitle}>
            Track the status of your job applications
          </Text>
        </View>

        <View style={styles.content}>
          {applications.length === 0 ? (
            <Card style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>No Applications Yet</Text>
              <Text style={styles.emptyText}>
                When you apply for jobs, they'll appear here so you can track their status.
              </Text>
              <TouchableOpacity
                style={styles.browseButton}
                onPress={() => router.push('/(student)/')}
              >
                <Text style={styles.browseButtonText}>Browse Jobs</Text>
              </TouchableOpacity>
            </Card>
          ) : (
            applications.map((application) => (
              <TouchableOpacity
                key={application.id}
                onPress={() => router.push(`/(student)/jobs/${application.job_id}`)}
              >
                <Card style={styles.applicationCard}>
                  <View style={styles.applicationHeader}>
                    <View style={styles.applicationInfo}>
                      <Text style={styles.jobTitle}>{application.jobs?.title}</Text>
                      <Text style={styles.companyName}>
                        {application.jobs?.companies?.name}
                      </Text>
                    </View>
                    <Tag
                      label={getStatusLabel(application.status)}
                      variant={getStatusColor(application.status)}
                    />
                  </View>

                  {application.note && (
                    <View style={styles.noteSection}>
                      <Text style={styles.noteLabel}>Your Note:</Text>
                      <Text style={styles.noteText}>{application.note}</Text>
                    </View>
                  )}

                  <Text style={styles.applicationDate}>
                    Applied {new Date(application.created_at).toLocaleDateString()}
                  </Text>
                </Card>
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scroll: {
    flex: 1,
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
  error: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  errorText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.danger,
    textAlign: 'center',
  },
  header: {
    padding: theme.spacing.lg,
    paddingBottom: 0,
  },
  title: {
    fontSize: theme.fontSize.xxl,
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
  },
  emptyCard: {
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
    lineHeight: 22,
    marginBottom: theme.spacing.lg,
  },
  browseButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
  },
  browseButtonText: {
    color: theme.colors.white,
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.medium,
  },
  applicationCard: {
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  applicationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.md,
  },
  applicationInfo: {
    flex: 1,
    marginRight: theme.spacing.md,
  },
  jobTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  companyName: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
  },
  noteSection: {
    marginBottom: theme.spacing.md,
  },
  noteLabel: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  noteText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
    lineHeight: 20,
  },
  applicationDate: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
  },
});