import React, { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { useAuth } from '@/lib/hooks/useAuth';
import { View, Text, StyleSheet } from 'react-native';

export default function EmployerLayout() {
  const { profile, loading, session } = useAuth();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    console.log('Employer layout useEffect (minimal check):', {
      loading,
      hasSession: !!session,
      currentPath: segments
    });

    // Only check for session - let individual pages handle role checks
    if (!loading && !session) {
      console.log('Employer layout: no session, redirecting to sign-in');
      router.replace('/(auth)/sign-in');
      return;
    }

    console.log('Employer layout: allowing access, individual pages will handle role checks');
  }, [session, loading, router, segments]);

  // Show loading while waiting for authentication
  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loading}>Loading...</Text>
      </View>
    );
  }

  // Only block if no session - let pages handle their own role checks
  if (!session) {
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