import React, { useEffect } from 'react';
import { useLocalSearchParams, router } from 'expo-router';

export default function EmployerMessageThreadScreen() {
  const { threadId } = useLocalSearchParams<{ threadId: string }>();

  useEffect(() => {
    // Redirect to shared message thread
    if (threadId) {
      router.replace(`/messages/${threadId}`);
    }
  }, [threadId]);

  return null;
}