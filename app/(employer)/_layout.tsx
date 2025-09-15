import React, { useEffect } from 'react';
import { Stack, useRouter } from 'expo-router';
import { useAuth } from '@/lib/hooks/useAuth';
import { View, Text, StyleSheet } from 'react-native';

export default function EmployerLayout() {
  const { profile, loading, session } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    
    if (!session) {
      router.replace('/(auth)/sign-in');
      return;
    }

    if (profile?.role !== 'employer') {
      if (!profile?.role) {
        router.replace('/(auth)/onboarding');
      } else if (profile.role === 'student') {
        router.replace('/(student)/');
      }
      return;
    }
  }, [session, profile, loading, router]);

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

  return <Stack screenOptions={{ headerShown: false }} />;
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