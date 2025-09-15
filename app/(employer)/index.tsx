import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, RefreshControl, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { theme } from '@/config/theme';
import { JobCard } from '@/components/ui/JobCard';
import { Button } from '@/components/ui/Button';

interface Job {
  id: string;
  title: string;
  description: string;
  tags: string[];
  is_paid: boolean;
  stipend_amount: number | null;
  location: string | null;
  images: string[];
  status: 'open' | 'closed';
  created_at: string;
  companies: {
    name: string;
  };
}

export default function EmployerHomeScreen() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadJobs();
  }, []);

  const loadJobs = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('jobs')
        .select(`
          id,
          title,
          description,
          tags,
          is_paid,
          stipend_amount,
          location,
          images,
          status,
          created_at,
          companies!inner (
            name
          )
        `)
        .eq('companies.owner_user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setJobs(data || []);
    } catch (error) {
      console.error('Error loading jobs:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadJobs();
    setRefreshing(false);
  };

  const handleJobPress = (jobId: string) => {
    router.push(`/(employer)/jobs/${jobId}/applicants`);
  };

  const handleNewJob = () => {
    router.push('/(employer)/jobs/new');
  };

  const renderJob = ({ item }: { item: Job }) => (
    <JobCard
      id={item.id}
      title={item.title}
      companyName={item.companies.name}
      location={item.location}
      tags={item.tags}
      isPaid={item.is_paid}
      stipendAmount={item.stipend_amount}
      image={item.images?.[0]}
      onPress={handleJobPress}
    />
  );

  const renderEmpty = () => (
    <View style={styles.empty}>
      <Text style={styles.emptyTitle}>No jobs posted yet</Text>
      <Text style={styles.emptyText}>Create your first job posting to start hiring students</Text>
      <Button
        title="Post Your First Job"
        onPress={handleNewJob}
        style={styles.emptyButton}
      />
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loading}>
          <Text style={styles.loadingText}>Loading your jobs...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Jobs</Text>
        <Text style={styles.subtitle}>{jobs.length} jobs posted</Text>
        <Button
          title="+ Post New Job"
          onPress={handleNewJob}
          style={styles.newJobButton}
        />
      </View>
      
      <FlatList
        data={jobs}
        keyExtractor={(item) => item.id}
        renderItem={renderJob}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
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
    marginBottom: theme.spacing.md,
  },
  newJobButton: {
    alignSelf: 'flex-start',
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
    marginBottom: theme.spacing.lg,
  },
  emptyButton: {
    marginTop: theme.spacing.md,
  },
});