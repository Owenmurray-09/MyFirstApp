import React, { useState, useEffect, useMemo } from 'react';
import { View, StyleSheet, FlatList, RefreshControl, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { theme } from '@/config/theme';
import { JobCard } from '@/components/ui/JobCard';
import { JobFilters } from '@/components/ui/JobFilters';
import { useJobs } from '@/lib/hooks/useJobs';
import { useAuth } from '@/lib/hooks/useAuth';

interface Job {
  id: string;
  title: string;
  description: string;
  tags: string[];
  is_paid: boolean;
  stipend_amount: number | null;
  location: string | null;
  images: string[];
  created_at: string;
  companies: {
    name: string;
  };
}

interface Filters {
  keyword: string;
  paidOnly: boolean;
  location: string;
  tags: string[];
}

export default function StudentHomeScreen() {
  const { signOut, profile } = useAuth();
  const [filters, setFilters] = useState<Filters>({
    keyword: '',
    paidOnly: false,
    location: '',
    tags: [],
  });

  const { jobs, loading, error, refresh } = useJobs({
    keyword: filters.keyword,
    paidOnly: filters.paidOnly,
    location: filters.location,
    tags: filters.tags,
  });

  // Get unique tags from all jobs for filter options
  const availableTags = useMemo(() => {
    const allTags = jobs.flatMap(job => job.tags || []);
    return [...new Set(allTags)].sort();
  }, [jobs]);

  const handleRefresh = async () => {
    await refresh();
  };

  const handleJobPress = (jobId: string) => {
    router.push(`/(student)/jobs/${jobId}`);
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
      <Text style={styles.emptyTitle}>
        {error ? 'Unable to load jobs' : 'No jobs found'}
      </Text>
      <Text style={styles.emptyText}>
        {error
          ? 'There was an issue loading job data. Please try again later.'
          : filters.keyword || filters.paidOnly || filters.location || filters.tags.length > 0
            ? 'Try adjusting your filters'
            : 'Check back later for new opportunities'}
      </Text>
    </View>
  );

  // Only show loading screen on initial load, not on refresh
  const [hasInitiallyLoaded, setHasInitiallyLoaded] = useState(false);

  useEffect(() => {
    if (!loading && !hasInitiallyLoaded) {
      setHasInitiallyLoaded(true);
    }
  }, [loading, hasInitiallyLoaded]);

  if (loading && !hasInitiallyLoaded) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loading}>
          <Text style={styles.loadingText}>Loading jobs...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const handleLogout = async () => {
    try {
      await signOut();
      console.log('Logged out successfully');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.leftSection}>
            <Text style={styles.title}>Find Jobs</Text>
            <Text style={styles.subtitle}>{jobs.length} opportunities available</Text>
          </View>
          <View style={styles.centerSection}>
            <Text style={styles.bridgeTitle}>BRIDGE</Text>
          </View>
          <View style={styles.rightSection}>
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
              <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>
          </View>
        </View>
        {profile && (
          <Text style={styles.welcomeText}>Welcome back, {profile.name}!</Text>
        )}
      </View>
      
      <JobFilters 
        onFiltersChange={setFilters}
        availableTags={availableTags}
      />
      
      <FlatList
        data={jobs}
        keyExtractor={(item) => item.id}
        renderItem={renderJob}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={handleRefresh} />
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
    paddingBottom: theme.spacing.md,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.sm,
  },
  leftSection: {
    flex: 1,
    alignItems: 'flex-start',
  },
  centerSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rightSection: {
    flex: 1,
    alignItems: 'flex-end',
  },
  bridgeTitle: {
    fontSize: theme.fontSize.xxxl,
    fontFamily: theme.fontFamily.title,
    color: theme.colors.text,
    letterSpacing: 2,
  },
  title: {
    fontSize: theme.fontSize.xl,
    fontFamily: theme.fontFamily.titleMedium,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    fontSize: theme.fontSize.md,
    fontFamily: theme.fontFamily.body,
    color: theme.colors.secondary,
  },
  welcomeText: {
    fontSize: theme.fontSize.lg,
    fontFamily: theme.fontFamily.bodyMedium,
    color: theme.colors.text,
  },
  logoutButton: {
    backgroundColor: theme.colors.accent,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: 8,
  },
  logoutText: {
    color: 'white',
    fontSize: theme.fontSize.sm,
    fontFamily: theme.fontFamily.bodyMedium,
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: theme.fontSize.lg,
    fontFamily: theme.fontFamily.body,
    color: theme.colors.textSecondary,
  },
  list: {
    padding: theme.spacing.lg,
    paddingTop: theme.spacing.md,
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
    fontFamily: theme.fontFamily.titleMedium,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  emptyText: {
    fontSize: theme.fontSize.md,
    fontFamily: theme.fontFamily.body,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
});