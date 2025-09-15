import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/lib/hooks/useAuth';

export default function IndexScreen() {
  const router = useRouter();
  const { session, profile, loading, error } = useAuth();
  const profileRef = useRef(profile);
  const hasTriedRouting = useRef(false);

  // Keep profile ref current
  profileRef.current = profile;

  useEffect(() => {
    console.log('=== INDEX SCREEN DEBUG ===');
    console.log('Loading state:', loading);
    console.log('Session exists:', !!session);
    console.log('Session user ID:', session?.user?.id);
    console.log('Profile exists:', !!profile);
    console.log('Profile role:', profile?.role);
    console.log('Profile name:', profile?.name);
    console.log('Full profile object:', profile);
    console.log('Auth error:', error);
    console.log('hasTriedRouting:', hasTriedRouting.current);
    console.log('========================');

    // Wait for loading to complete
    if (loading) {
      console.log('Index: Still loading...');
      return;
    }

    if (!session) {
      console.log('Index: No session - redirecting to sign-in');
      hasTriedRouting.current = false;
      router.replace('/(auth)/sign-in');
      return;
    }

    // If we have a session and profile with role, route to dashboard immediately
    if (session?.user?.id && profile?.role && !hasTriedRouting.current) {
      console.log('Index: Profile found with role - redirecting to dashboard:', profile.role);
      hasTriedRouting.current = true;
      if (profile.role === 'student') {
        console.log('Index: Redirecting to student dashboard');
        router.replace('/(student)/');
      } else if (profile.role === 'employer') {
        console.log('Index: Redirecting to employer dashboard');
        router.replace('/(employer)/');
      }
      return;
    }

    // If we have a session but no profile/role, wait for state to sync
    if (session?.user?.id && (!profile || !profile.role) && !hasTriedRouting.current) {
      console.log('Index: Session exists but profile missing/incomplete', {
        sessionUserId: session.user.id,
        profile,
        hasProfile: !!profile,
        role: profile?.role,
        profileName: profile?.name,
        currentPath: window?.location?.pathname
      });

      // Give time for profile state to load, then check using ref
      const timer = setTimeout(() => {
        console.log('Index: Timeout fired - checking current profile state...');
        console.log('Profile ref current:', profileRef.current);
        console.log('Profile role ref current:', profileRef.current?.role);

        hasTriedRouting.current = true;

        // Use ref to get current profile state
        if (profileRef.current?.role) {
          console.log('Index: Profile loaded during delay - routing to dashboard');
          if (profileRef.current.role === 'student') {
            router.replace('/(student)/');
          } else if (profileRef.current.role === 'employer') {
            router.replace('/(employer)/');
          }
        } else {
          console.log('Index: No profile found after delay - redirecting to onboarding');
          router.replace('/(auth)/onboarding');
        }
      }, 2000); // Give enough time for profile loading

      // Cleanup timer
      return () => clearTimeout(timer);
    }
  }, [session, profile, loading, router, session?.user?.id]);

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