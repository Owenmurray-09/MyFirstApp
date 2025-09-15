import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { theme } from '@/config/theme';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/hooks/useAuth';

export default function CompanySetupScreen() {
  const router = useRouter();
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [companySaved, setCompanySaved] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    location: '',
  });

  const handleSaveCompany = async () => {
    if (!formData.name.trim()) {
      Alert.alert('Error', 'Please enter a company name');
      return;
    }

    if (!formData.description.trim()) {
      Alert.alert('Error', 'Please enter a company description');
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      const { error } = await supabase
        .from('companies')
        .insert({
          name: formData.name.trim(),
          description: formData.description.trim(),
          location: formData.location.trim() || null,
          owner_user_id: user.id,
        });

      if (error) throw error;

      console.log('Company created successfully');
      setCompanySaved(true);
    } catch (error: any) {
      console.error('Company creation error:', error);
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleContinueToDashboard = () => {
    console.log('=== COMPANY SETUP CONTINUE CLICKED ===');
    console.log('Profile state:', profile);
    console.log('Profile role:', profile?.role);
    console.log('Profile exists:', !!profile);
    console.log('Current window.location:', window?.location?.href);

    // Check if profile is properly loaded before navigation
    if (profile?.role === 'employer') {
      console.log('✅ Profile confirmed as employer, navigating immediately...');
      console.log('🏢 Navigating to: /(employer)/');
      router.replace('/(employer)/');
      console.log('🏢 Employer dashboard navigation completed');
    } else {
      console.log('⏰ Profile not yet updated (role=' + profile?.role + '), adding delay...');
      // Add delay if profile hasn't updated yet
      setTimeout(() => {
        console.log('⏰ Delayed navigation executing...');
        console.log('🏢 Delayed navigating to: /(employer)/');
        router.replace('/(employer)/');
        console.log('🏢 Delayed employer dashboard navigation completed');
      }, 1000);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Setup Your Company</Text>
          <Text style={styles.subtitle}>
            Create your company profile to start posting jobs
          </Text>
        </View>

        <Card style={styles.formCard}>
          <Text style={styles.sectionTitle}>Company Information</Text>

          <Input
            label="Company Name *"
            value={formData.name}
            onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
            placeholder="e.g. Salón de Patines Music"
          />

          <Input
            label="Description *"
            value={formData.description}
            onChangeText={(text) => setFormData(prev => ({ ...prev, description: text }))}
            placeholder="Describe your company and what you do..."
            multiline
            numberOfLines={4}
          />

          <Input
            label="Location"
            value={formData.location}
            onChangeText={(text) => setFormData(prev => ({ ...prev, location: text }))}
            placeholder="e.g. San José, Costa Rica"
          />

          {!companySaved ? (
            <Button
              title="Save Company Profile"
              onPress={handleSaveCompany}
              loading={loading}
              style={styles.submitButton}
            />
          ) : (
            <View style={styles.successSection}>
              <Text style={styles.successTitle}>✅ Company Profile Saved!</Text>
              <Text style={styles.successMessage}>
                Your company profile has been created successfully. You can now start posting jobs and managing applications.
              </Text>

              <Button
                title="Go to Dashboard"
                onPress={handleContinueToDashboard}
                style={styles.continueButton}
              />

              <Button
                title="Edit Company Info"
                onPress={() => setCompanySaved(false)}
                variant="outline"
                style={styles.editButton}
              />
            </View>
          )}
        </Card>

        <Card style={styles.infoCard}>
          <Text style={styles.infoTitle}>What's Next?</Text>
          <Text style={styles.infoText}>
            After creating your company profile, you'll be able to:
          </Text>
          <Text style={styles.infoItem}>• Post job opportunities</Text>
          <Text style={styles.infoItem}>• Manage applications</Text>
          <Text style={styles.infoItem}>• Communicate with students</Text>
          <Text style={styles.infoItem}>• Build your employer brand</Text>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scroll: {
    flex: 1,
  },
  header: {
    padding: theme.spacing.lg,
    paddingBottom: 0,
  },
  title: {
    fontSize: theme.fontSize.xxl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
  },
  debugInfo: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.primary,
    marginTop: theme.spacing.xs,
    fontFamily: 'monospace',
  },
  formCard: {
    margin: theme.spacing.lg,
    marginTop: theme.spacing.md,
    padding: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  submitButton: {
    marginTop: theme.spacing.lg,
  },
  successSection: {
    alignItems: 'center',
    marginTop: theme.spacing.lg,
  },
  successTitle: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.primary,
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  successMessage: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
    lineHeight: 22,
  },
  continueButton: {
    width: '100%',
    marginBottom: theme.spacing.md,
  },
  editButton: {
    width: '100%',
  },
  infoCard: {
    margin: theme.spacing.lg,
    marginTop: 0,
    padding: theme.spacing.lg,
  },
  infoTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  infoText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
    lineHeight: 20,
  },
  infoItem: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
    lineHeight: 20,
  },
});