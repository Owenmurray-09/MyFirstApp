import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/lib/hooks/useAuth';

export default function IndexScreen() {
  const router = useRouter();
  const { session, profile, loading, error } = useAuth();

  useEffect(() => {
    console.log('Index screen useEffect:', {
      loading,
      session: !!session,
      profile: profile?.role,
      profileExists: !!profile,
      sessionUserId: session?.user?.id,
      profileName: profile?.name,
      fullProfile: profile
    });

    // Wait for loading to complete
    if (loading) {
      console.log('Index: Still loading...');
      return;
    }

    if (!session) {
      console.log('Index: No session - redirecting to sign-in');
      router.replace('/(auth)/sign-in');
      return;
    }

    if (!profile?.role) {
      console.log('Index: No profile role - redirecting to onboarding', {
        profile,
        hasProfile: !!profile,
        role: profile?.role,
        profileName: profile?.name,
        currentPath: window?.location?.pathname
      });

      // Only redirect if we're not already on onboarding
      if (window?.location?.pathname !== '/onboarding') {
        console.log('Index: Redirecting to onboarding...');
        router.replace('/(auth)/onboarding');
      } else {
        console.log('Index: Already on onboarding, skipping redirect');
      }
      return;
    }

    console.log('Index: Profile found with role - redirecting to dashboard:', profile.role);
    if (profile.role === 'student') {
      console.log('Index: Redirecting to student dashboard');
      router.replace('/(student)/');
    } else if (profile.role === 'employer') {
      console.log('Index: Redirecting to employer dashboard');
      router.replace('/(employer)/');
    }
  }, [session, profile, loading, router]);

  // Show loading while waiting for authentication
  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loading}>Loading...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorTitle}>Database Setup Required</Text>
        <Text style={styles.error}>
          {error.includes('Database not set up')
            ? 'Please set up your database by running the schema.sql file in your Supabase SQL Editor.'
            : error}
        </Text>
        <Text style={styles.errorInstructions}>
          Go to: https://supabase.com/dashboard/project/iydmakvgonzlyxgpwwzt/sql
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.loading}>Redirecting...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f9f9f9',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  loading: {
    fontSize: 16,
    color: '#666',
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#EF4444',
    marginBottom: 12,
    textAlign: 'center',
  },
  error: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 22,
  },
  errorInstructions: {
    fontSize: 14,
    color: '#3B82F6',
    textAlign: 'center',
    textDecorationLine: 'underline',
  },
});