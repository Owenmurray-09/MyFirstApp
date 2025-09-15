import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/hooks/useAuth';
import { theme } from '@/config/theme';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Tag } from '@/components/ui/Tag';

const STUDENT_INTERESTS = [
  'cash register', 'customer service', 'heavy lifting', 'front desk',
  'retail', 'barista', 'inventory', 'cleaning', 'basic coding', 'graphic design'
];

export default function OnboardingScreen() {
  const { upsertProfile, signOut } = useAuth();
  const [step, setStep] = useState(1);
  const [role, setRole] = useState<'student' | 'employer' | null>(null);
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [location, setLocation] = useState('');
  const [interests, setInterests] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const handleRoleSelection = (selectedRole: 'student' | 'employer') => {
    setRole(selectedRole);
    setStep(2);
  };

  const handleLogout = async () => {
    try {
      await signOut();
      console.log('Logged out from onboarding');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleInterestToggle = (interest: string) => {
    setInterests(prev => 
      prev.includes(interest) 
        ? prev.filter(i => i !== interest)
        : [...prev, interest]
    );
  };

  const handleComplete = async () => {
    if (!role || !name.trim()) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      console.log('Starting onboarding completion...', { role, name });

      // Use the upsertProfile from useAuth hook to update profile and refresh state
      await upsertProfile({
        role,
        name: name.trim(),
        bio: bio.trim() || null,
        location: location.trim() || null,
        interests: role === 'student' ? interests : [],
      });

      console.log('Profile upserted successfully');

      // If student, also create preferences record
      if (role === 'student' && interests.length > 0) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { error: prefsError } = await supabase
            .from('student_preferences')
            .upsert({
              student_user_id: user.id,
              interest_tags: interests,
            });

          if (prefsError) {
            console.warn('Failed to create preferences:', prefsError);
          } else {
            console.log('Student preferences created');
          }
        }
      }

      // Navigate directly to the appropriate dashboard since we know the role
      console.log('Navigating to dashboard for role:', role);

      // Add a delay to ensure profile state is updated before navigation
      setTimeout(() => {
        if (role === 'student') {
          console.log('Attempting navigation to /(student)/');
          router.replace('/(student)/');
        } else if (role === 'employer') {
          console.log('Attempting navigation to /(employer)/');
          router.replace('/(employer)/');
        } else {
          console.log('Fallback navigation to /');
          router.replace('/');
        }
      }, 500);
    } catch (error: any) {
      console.error('Onboarding completion error:', error);
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const renderRoleSelection = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>What describes you best?</Text>
      <Text style={styles.stepSubtitle}>Choose your role to get started</Text>
      
      <View style={styles.roleButtons}>
        <Card style={styles.roleCard}>
          <Button
            title="I'm a Student"
            onPress={() => handleRoleSelection('student')}
            style={styles.roleButton}
          />
          <Text style={styles.roleDescription}>
            Looking for internships, part-time jobs, and work experience
          </Text>
        </Card>
        
        <Card style={styles.roleCard}>
          <Button
            title="I'm an Employer"
            onPress={() => handleRoleSelection('employer')}
            style={styles.roleButton}
          />
          <Text style={styles.roleDescription}>
            Posting jobs and managing applications from students
          </Text>
        </Card>
      </View>
    </View>
  );

  const renderProfileSetup = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Complete Your Profile</Text>
      <Text style={styles.stepSubtitle}>
        {role === 'student' 
          ? 'Tell employers about yourself and your interests'
          : 'Set up your employer profile'
        }
      </Text>
      
      <Card style={styles.form}>
        <Input
          label="Full Name *"
          value={name}
          onChangeText={setName}
          placeholder="Enter your full name"
        />
        
        <Input
          label="Bio"
          value={bio}
          onChangeText={setBio}
          multiline
          placeholder={role === 'student' 
            ? 'Tell us about your background, studies, and goals...'
            : 'Describe your company and what you do...'
          }
        />
        
        <Input
          label="Location"
          value={location}
          onChangeText={setLocation}
          placeholder="City, State"
        />
        
        {role === 'student' && (
          <View style={styles.interestsSection}>
            <Text style={styles.interestsTitle}>Select Your Interests</Text>
            <Text style={styles.interestsSubtitle}>
              Choose skills and areas you're interested in working with
            </Text>
            
            <View style={styles.interestsTags}>
              {STUDENT_INTERESTS.map(interest => (
                <Tag
                  key={interest}
                  label={interest}
                  selected={interests.includes(interest)}
                  onPress={() => handleInterestToggle(interest)}
                />
              ))}
            </View>
          </View>
        )}
        
        <View style={styles.formActions}>
          <Button
            title="Complete Setup"
            onPress={handleComplete}
            loading={loading}
            disabled={!name.trim()}
          />
          
          <Button
            title="Back"
            onPress={() => setStep(1)}
            variant="outline"
            style={styles.backButton}
          />
        </View>
      </Card>
    </View>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.title}>Welcome!</Text>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.progress}>
          <View style={[styles.progressStep, step >= 1 && styles.progressStepActive]} />
          <View style={[styles.progressStep, step >= 2 && styles.progressStepActive]} />
        </View>
      </View>

      {step === 1 ? renderRoleSelection() : renderProfileSetup()}
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
    padding: theme.spacing.lg,
  },
  header: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: theme.spacing.lg,
  },
  title: {
    fontSize: theme.fontSize.xxxl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
  },
  logoutButton: {
    backgroundColor: theme.colors.error || '#EF4444',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: 8,
  },
  logoutText: {
    color: 'white',
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
  },
  progress: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  progressStep: {
    width: 40,
    height: 4,
    backgroundColor: theme.colors.border,
    borderRadius: 2,
  },
  progressStepActive: {
    backgroundColor: theme.colors.primary,
  },
  stepContainer: {
    flex: 1,
  },
  stepTitle: {
    fontSize: theme.fontSize.xxl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: theme.spacing.sm,
  },
  stepSubtitle: {
    fontSize: theme.fontSize.lg,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
  },
  roleButtons: {
    gap: theme.spacing.lg,
  },
  roleCard: {
    padding: theme.spacing.lg,
    alignItems: 'center',
  },
  roleButton: {
    width: '100%',
    marginBottom: theme.spacing.md,
  },
  roleDescription: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  form: {
    padding: theme.spacing.lg,
  },
  interestsSection: {
    marginTop: theme.spacing.lg,
  },
  interestsTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  interestsSubtitle: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.md,
  },
  interestsTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  formActions: {
    gap: theme.spacing.md,
    marginTop: theme.spacing.xl,
  },
  backButton: {
    marginTop: theme.spacing.sm,
  },
});