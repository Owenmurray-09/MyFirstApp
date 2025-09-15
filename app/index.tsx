import React, { useEffect } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';

export default function IndexScreen() {
  const router = useRouter();

  useEffect(() => {
    // Small delay to ensure router is mounted
    const timer = setTimeout(() => {
      // Always redirect to sign-in page
      // The sign-in page will handle authentication state and redirect appropriately
      router.replace('/(auth)/sign-in');
    }, 0);

    return () => clearTimeout(timer);
  }, [router]);

  // Return empty view while redirecting
  return <View />;
}