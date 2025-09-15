import React, { useState } from 'react';
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
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    location: '',
  });

  const handleSubmit = async () => {
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

      Alert.alert('Success', 'Company profile created successfully!', [
        {
          text: 'OK',
          onPress: () => router.replace('/(employer)/'),
        },
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
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

          <Button
            title="Create Company Profile"
            onPress={handleSubmit}
            loading={loading}
            style={styles.submitButton}
          />
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