import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/lib/hooks/useAuth';

export default function IndexScreen() {
  const router = useRouter();
  const { session, profile, loading } = useAuth();

  useEffect(() => {
    if (loading) return;

    if (!session) {
      router.replace('/(auth)/sign-in');
      return;
    }

    if (!profile?.role) {
      router.replace('/(auth)/onboarding');
      return;
    }

    if (profile.role === 'student') {
      router.replace('/(student)/');
    } else if (profile.role === 'employer') {
      router.replace('/(employer)/');
    }
  }, [session, profile, loading, router]);

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loading}>Loading...</Text>
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
});