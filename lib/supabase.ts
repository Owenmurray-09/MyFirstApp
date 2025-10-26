import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/db';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://iydmakvgonzlyxgpwwzt.supabase.co';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml5ZG1ha3Znb256bHl4Z3B3d3p0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc5NDkyNzcsImV4cCI6MjA3MzUyNTI3N30.uQ-SP9cRzotroN9LzUwUlBnGL7Bdj93S-5XrI9285hU';

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false,
  },
  global: {
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
  },
});

// Debug helper to check connection
console.log('Supabase client initialized with:', {
  url: supabaseUrl,
  hasKey: !!supabaseAnonKey,
});