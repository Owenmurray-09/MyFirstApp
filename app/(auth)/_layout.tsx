// TEMP_TRACER: remove later - minimal layout for auth routes
import { Stack } from 'expo-router';

export default function AuthLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}