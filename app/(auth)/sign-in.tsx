import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, TextInput } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/lib/hooks/useAuth';
import { theme } from '@/config/theme';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

export default function SignInScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const { signInWithEmail, signUpWithEmail, loading, error, session, profile } = useAuth();

  // Refs for input focus management
  const emailInputRef = useRef<TextInput>(null);
  const passwordInputRef = useRef<TextInput>(null);

  // Check if user is already authenticated and redirect appropriately
  useEffect(() => {
    // Don't do anything while still loading
    if (loading) {
      return;
    }

    if (session && profile) {
      console.log('User already authenticated, redirecting to dashboard...');
      if (profile.role === 'student') {
        router.replace('/(student)/');
      } else if (profile.role === 'employer') {
        router.replace('/(employer)/');
      } else {
        // If no role set yet, redirect to onboarding
        router.replace('/(auth)/onboarding');
      }
    } else if (session && !profile) {
      // Give a bit more time for profile to load after session is restored
      // This handles the case where session loads faster than profile
      const timer = setTimeout(() => {
        if (!profile) {
          // Only redirect to onboarding if profile still doesn't exist after delay
          console.log('User authenticated but no profile after delay, redirecting to onboarding...');
          router.replace('/(auth)/onboarding');
        }
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [session, profile, loading, router]);

  const handleAuth = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    // Clear any previous errors
    setLocalError(null);

    console.log('Starting auth process...', { email, isSignUp });

    try {
      if (isSignUp) {
        console.log('Attempting sign up...');
        await signUpWithEmail(email, password);
        setIsSignUp(false);
        Alert.alert('Success', 'Account created! You can now sign in below.');
      } else {
        console.log('Attempting sign in...');
        await signInWithEmail(email, password);
        console.log('Sign in completed successfully');
        // The useEffect hook will handle navigation once the profile is loaded
      }
    } catch (error: any) {
      console.error('Auth error:', error);

      // Provide user-friendly error messages
      let errorMessage = 'Authentication failed';

      if (error.message?.includes('Invalid login credentials')) {
        errorMessage = isSignUp
          ? 'Unable to create account. Please check your email and password.'
          : 'Unable to sign in. Please check your email and password.';
      } else if (error.message?.includes('Email not confirmed')) {
        errorMessage = 'Please check your email and click the verification link before signing in.';
      } else if (error.message?.includes('User not found')) {
        errorMessage = 'No account found with this email address. Please sign up first.';
      } else if (error.message?.includes('Password')) {
        errorMessage = 'Incorrect password. Please try again.';
      } else if (error.message?.includes('Email')) {
        errorMessage = 'Please enter a valid email address.';
      } else if (error.message) {
        errorMessage = error.message;
      }

      console.log('About to show alert:', errorMessage);
      setLocalError(errorMessage);

      // Also show alert for immediate feedback
      Alert.alert('Unable to Sign In', errorMessage);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Welcome to Bridge</Text>
        <Text style={styles.subtitle}>
          {isSignUp ? 'Create your account' : 'Sign in to continue'}
        </Text>
      </View>

      <Card style={styles.form}>
        {(localError || error) && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{localError || error}</Text>
          </View>
        )}

        <Input
          ref={emailInputRef}
          label="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          placeholder="Enter your email"
          returnKeyType="next"
          onSubmitEditing={() => passwordInputRef.current?.focus()}
        />

        <Input
          ref={passwordInputRef}
          label="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholder="Enter your password"
          returnKeyType="done"
          onSubmitEditing={handleAuth}
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
    fontFamily: theme.fontFamily.title,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  subtitle: {
    fontSize: theme.fontSize.lg,
    fontFamily: theme.fontFamily.body,
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
    color: theme.colors.accent,
    fontSize: theme.fontSize.md,
    fontFamily: theme.fontFamily.body,
  },
  errorContainer: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
    borderWidth: 1,
    borderRadius: 8,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  errorText: {
    color: '#DC2626',
    fontSize: theme.fontSize.md,
    fontFamily: theme.fontFamily.bodyMedium,
    textAlign: 'center',
  },
});