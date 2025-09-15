import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { theme } from '@/config/theme';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

export default function SignInScreen() {
  // TODO: Add magic link email sign-in as alternative to password flow
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);

  const handleAuth = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        
        if (error) throw error;
        
        Alert.alert('Success', 'Please check your email for verification link');
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        
        if (error) throw error;
        
        // Check if user has completed onboarding
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .single();
        
        if (!profile?.role) {
          router.replace('/(auth)/onboarding');
        } else if (profile.role === 'student') {
          router.replace('/(student)');
        } else {
          router.replace('/(employer)');
        }
      }
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Welcome to JobConnect</Text>
        <Text style={styles.subtitle}>
          {isSignUp ? 'Create your account' : 'Sign in to continue'}
        </Text>
      </View>

      <Card style={styles.form}>
        <Input
          label="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          placeholder="Enter your email"
        />
        
        <Input
          label="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholder="Enter your password"
        />
        
        <Button
          title={isSignUp ? 'Create Account' : 'Sign In'}
          onPress={handleAuth}
          loading={loading}
          style={styles.authButton}
        />
        
        <Button
          title={isSignUp ? 'Already have an account? Sign In' : 'Need an account? Sign Up'}
          onPress={() => setIsSignUp(!isSignUp)}
          variant="outline"
          style={styles.switchButton}
        />
      </Card>
      
      {!isSignUp && (
        <View style={styles.footer}>
          <Text style={styles.footerText}>Forgot your password?</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: theme.spacing.lg,
  },
  header: {
    alignItems: 'center',
    marginBottom: theme.spacing.xxl,
  },
  title: {
    fontSize: theme.fontSize.xxxl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  subtitle: {
    fontSize: theme.fontSize.lg,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  form: {
    padding: theme.spacing.lg,
  },
  authButton: {
    marginTop: theme.spacing.md,
  },
  switchButton: {
    marginTop: theme.spacing.md,
  },
  footer: {
    alignItems: 'center',
    marginTop: theme.spacing.xl,
  },
  footerText: {
    color: theme.colors.primary,
    fontSize: theme.fontSize.md,
  },
});