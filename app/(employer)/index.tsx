import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, RefreshControl, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { supabase } from '@/lib/supabase';
import { theme } from '@/config/theme';
import { JobCard } from '@/components/ui/JobCard';
import { Button } from '@/components/ui/Button';
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
  status: 'open' | 'closed';
  created_at: string;
  companies: {
    name: string;
  };
}

export default function EmployerHomeScreen() {
  const { signOut } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadJobs();
  }, []);

  // Refresh jobs when screen comes into focus (e.g., returning from job posting)
  useFocusEffect(
    React.useCallback(() => {
      console.log('Employer dashboard focused - refreshing jobs');
      loadJobs();
    }, [])
  );

  const loadJobs = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // First check if user has a company
      const { data: company, error: companyError } = await supabase
        .from('companies')
        .select('id')
        .eq('owner_user_id', user.id)
        .single();

      if (companyError && companyError.code === 'PGRST116') {
        // No company found, redirect to setup
        console.log('No company found, redirecting to company setup');
        router.replace('/(auth)/company-setup');
        return;
      }

      if (companyError) {
        console.error('Company query error:', companyError);
        // If we get a 406 or other permissions error, assume company exists and continue
        if (companyError.code === 'PGRST301' || companyError.message?.includes('406')) {
          console.log('Database permissions issue, assuming company exists and continuing');
          setJobs([]);
          return;
        }
        throw companyError;
      }

      // Now load jobs
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
    } finally {
      setLoading(false);
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

  const handleProfile = () => {
    router.push('/profile');
  };

  const handleCompanyProfile = () => {
    router.push('/(employer)/company/setup');
  };

  const handleLogout = async () => {
    try {
      await signOut();
      console.log('Logged out successfully');
      // Navigate to sign-in page after successful logout
      router.replace('/(auth)/sign-in');
    } catch (error) {
      console.error('Logout error:', error);
    }
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
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.title}>My Jobs</Text>
            <Text style={styles.subtitle}>{jobs.length} jobs posted</Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.profileButton} onPress={handleProfile}>
              <Text style={styles.profileText}>Profile</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.companyButton} onPress={handleCompanyProfile}>
              <Text style={styles.companyText}>Company Profile</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
              <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>
          </View>
        </View>
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
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.md,
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
  headerActions: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  profileButton: {
    backgroundColor: theme.colors.secondary,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: 8,
  },
  profileText: {
    color: theme.colors.text,
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
  },
  companyButton: {
    backgroundColor: theme.colors.secondary,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: 8,
  },
  companyText: {
    color: theme.colors.text,
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
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
    fontWeight: theme.fontWeight.medium,
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