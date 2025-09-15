import React, { useEffect } from 'react';
import { Tabs, useRouter } from 'expo-router';
import { useAuth } from '@/lib/hooks/useAuth';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { theme } from '@/config/theme';

export default function StudentLayout() {
  const { profile, loading, session } = useAuth();
  const router = useRouter();

  useEffect(() => {
    console.log('Student layout useEffect:', {
      loading,
      hasSession: !!session,
      profileRole: profile?.role,
      profileExists: !!profile
    });

    // Always wait for loading to complete AND for profile data to be available
    if (loading || (!profile && session)) {
      console.log('Student layout: still loading or waiting for profile data...');
      return;
    }

    if (!session) {
      console.log('Student layout: no session, redirecting to sign-in');
      router.replace('/(auth)/sign-in');
      return;
    }

    if (profile?.role !== 'student') {
      if (!profile?.role) {
        console.log('Student layout: no profile role, redirecting to onboarding');
        router.replace('/(auth)/onboarding');
      } else if (profile.role === 'employer') {
        console.log('Student layout: employer profile, redirecting to employer');
        router.replace('/(employer)/');
      }
      return;
    }

    console.log('Student layout: valid student profile, staying on student dashboard');
  }, [session, profile, loading, router]);

  // Show loading while waiting for authentication or profile data
  if (loading || (!profile && session)) {
    return (
      <View style={styles.container}>
        <Text style={styles.loading}>Loading...</Text>
      </View>
    );
  }

  if (!session || profile?.role !== 'student') {
    return (
      <View style={styles.container}>
        <Text style={styles.loading}>Redirecting...</Text>
      </View>
    );
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textSecondary,
        tabBarStyle: {
          backgroundColor: theme.colors.background,
          borderTopColor: theme.colors.border,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Jobs',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="work" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="applications"
        options={{
          title: 'Applications',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="assignment" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: 'Messages',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="chat" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="person" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="jobs"
        options={{
          href: null, // Hide this from tabs since it's just for sub-routes
        }}
      />
    </Tabs>
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