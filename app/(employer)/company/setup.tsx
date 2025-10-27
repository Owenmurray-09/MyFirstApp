import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { theme } from '@/config/theme';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { supabase } from '@/lib/supabase';

export default function CompanySetupScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [companySaved, setCompanySaved] = useState(false);
  const [existingCompany, setExistingCompany] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    location: '',
    email: '',
    phone: '',
  });

  useEffect(() => {
    loadExistingCompany();
  }, []);

  const loadExistingCompany = async () => {
    console.log('🔄 loadExistingCompany called');
    try {
      console.log('🔄 Getting user for company load...');
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('❌ No user found');
        return;
      }
      console.log('✅ User found for load:', user.id);

      console.log('🔄 Querying companies table...');
      const { data: company, error } = await supabase
        .from('companies')
        .select('*')
        .eq('owner_user_id', user.id)
        .single();

      console.log('🔄 Company query result:', { company, error });

      if (error && error.code !== 'PGRST116') {
        console.error('❌ Error loading company:', error);
        return;
      }

      if (company) {
        console.log('✅ Company found, updating state...');
        setExistingCompany(company);
        setFormData({
          name: company.name || '',
          description: company.description || '',
          location: company.location || '',
          email: company.email || '',
          phone: company.phone || '',
        });
        setCompanySaved(true);
        console.log('✅ Company data loaded successfully');
      } else {
        console.log('ℹ️ No company found (new user)');
      }
    } catch (error) {
      console.error('❌ Error loading company:', error);
    } finally {
      console.log('🔄 Setting loadingData to false');
      setLoadingData(false);
    }
  };

  const handleSaveCompany = async () => {
    console.log('🔄 handleSaveCompany called');
    console.log('Form data:', formData);
    console.log('Existing company:', existingCompany);

    console.log('🔄 Starting save process...');
    setLoading(true);
    try {
      console.log('🔄 Getting user...');
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');
      console.log('✅ User found:', user.id);

      const companyData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        location: formData.location.trim() || null,
        email: formData.email.trim() || null,
        phone: formData.phone.trim() || null,
      };
      console.log('🔄 Company data prepared:', companyData);

      if (existingCompany) {
        console.log('🔄 Updating existing company...');
        // Update existing company
        const { error } = await supabase
          .from('companies')
          .update(companyData)
          .eq('id', existingCompany.id);

        if (error) throw error;
        console.log('✅ Company updated successfully');
      } else {
        console.log('🔄 Creating new company...');
        // Create new company
        const { error } = await supabase
          .from('companies')
          .insert({
            ...companyData,
            owner_user_id: user.id,
          });

        if (error) throw error;
        console.log('✅ Company created successfully');
      }

      console.log('🔄 Setting companySaved to true...');
      setCompanySaved(true);
      console.log('🔄 Reloading company data...');
      // Reload the company data to get the latest version
      await loadExistingCompany();
      console.log('✅ Save process completed!');
    } catch (error: any) {
      console.error('Company creation error:', error);
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleContinueToDashboard = () => {
    console.log('Navigating to employer dashboard');
    router.replace('/(employer)/');
  };

  if (loadingData) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading company information...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>
            {existingCompany ? 'Edit Company Profile' : 'Setup Your Company'}
          </Text>
          <Text style={styles.subtitle}>
            {existingCompany
              ? 'Update your company information'
              : 'Create your company profile to start posting jobs'
            }
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

          <Input
            label="Contact Email *"
            value={formData.email}
            onChangeText={(text) => setFormData(prev => ({ ...prev, email: text }))}
            placeholder="contact@yourcompany.com"
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Input
            label="Contact Phone"
            value={formData.phone}
            onChangeText={(text) => setFormData(prev => ({ ...prev, phone: text }))}
            placeholder="+1 (555) 123-4567"
            keyboardType="phone-pad"
          />

          {!companySaved ? (
            <Button
              title={existingCompany ? "Update Company Profile" : "Save Company Profile"}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: theme.fontSize.lg,
    color: theme.colors.textSecondary,
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