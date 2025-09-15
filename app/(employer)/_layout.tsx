import React, { useEffect } from 'react';
import { Stack, useRouter } from 'expo-router';
import { useAuth } from '@/lib/hooks/useAuth';
import { View, Text, StyleSheet } from 'react-native';

export default function EmployerLayout() {
  const { profile, loading, session } = useAuth();
  const router = useRouter();

  useEffect(() => {
    console.log('Employer layout useEffect:', {
      loading,
      hasSession: !!session,
      profileRole: profile?.role,
      profileExists: !!profile
    });

    // Wait for loading to complete
    if (loading) {
      console.log('Employer layout: still loading...');
      return;
    }

    if (!session) {
      console.log('Employer layout: no session, redirecting to sign-in');
      router.replace('/(auth)/sign-in');
      return;
    }

    if (profile?.role !== 'employer') {
      if (!profile?.role) {
        console.log('Employer layout: no profile role, redirecting to onboarding');
        router.replace('/(auth)/onboarding');
      } else if (profile.role === 'student') {
        console.log('Employer layout: student profile, redirecting to student');
        router.replace('/(student)/');
      }
      return;
    }

    console.log('Employer layout: valid employer profile, staying on employer dashboard');
  }, [session, profile, loading, router]);

  // Show loading while waiting for authentication
  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loading}>Loading...</Text>
      </View>
    );
  }

  if (!session || profile?.role !== 'employer') {
    return (
      <View style={styles.container}>
        <Text style={styles.loading}>Redirecting...</Text>
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="jobs/new" />
      <Stack.Screen name="company/setup" />
    </Stack>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
  },
  loading: {
    fontSize: 16,
    color: '#666',
  },
});