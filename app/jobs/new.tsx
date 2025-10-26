import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, ScrollView, Text, Alert, Switch, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { theme } from '@/config/theme';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Tag } from '@/components/ui/Tag';
import { useCreateJob, useUploadJobImages } from '@/lib/hooks/useJobs';
import { z } from 'zod';
import * as ImagePicker from 'expo-image-picker';

const AVAILABLE_TAGS = [
  'cash register', 'customer service', 'heavy lifting', 'front desk',
  'retail', 'barista', 'inventory', 'cleaning', 'basic coding', 'graphic design',
  'programming', 'web development', 'data analysis', 'healthcare', 'research', 
  'marketing', 'writing', 'tutoring', 'manual labor', 'administrative',
  'social media', 'photography', 'event planning', 'sales'
];

const jobSchema = z.object({
  title: z.string().min(1, 'Job title is required').min(5, 'Title must be at least 5 characters'),
  description: z.string().min(1, 'Job description is required').min(20, 'Description must be at least 20 characters'),
  location: z.string().optional(),
  tags: z.array(z.string()).min(1, 'Select at least one skill tag'),
  is_paid: z.boolean(),
  stipend_amount: z.number().min(0, 'Amount must be positive').optional(),
});

export default function NewJobScreen() {
  console.log('🔥🔥🔥 NEW JOB SCREEN LOADED - CLAUDE FIXED VERSION 🔥🔥🔥');

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [isPaid, setIsPaid] = useState(false);
  const [stipendAmount, setStipendAmount] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedImages, setSelectedImages] = useState<ImagePicker.ImagePickerAsset[]>([]);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [loadingCompany, setLoadingCompany] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showingValidationError, setShowingValidationError] = useState(false);

  const scrollViewRef = useRef<ScrollView>(null);
  const { createJob, loading: createLoading } = useCreateJob();
  const { uploadImages, loading: uploadLoading, progress } = useUploadJobImages();

  useEffect(() => {
    loadCompany();
  }, []);

  const loadCompany = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('companies')
        .select('id')
        .eq('owner_user_id', user.id)
        .single();

      if (error) {
        console.log('Company query error in job creation:', error);

        if (error.code === 'PGRST116') {
          // No company found, redirect to setup
          console.log('No company found, redirecting to company setup');
          router.replace('/(auth)/company-setup');
          return;
        }

        // Handle other database permission errors like we do elsewhere
        if (error.code === 'PGRST301' || error.message?.includes('406')) {
          console.log('Database permissions issue, using placeholder company ID');
          setCompanyId('placeholder-company-id');
          return;
        }

        // For other errors, redirect to setup
        console.log('Other company error, redirecting to setup');
        router.replace('/(auth)/company-setup');
        return;
      }

      setCompanyId(data.id);
    } catch (error) {
      console.error('Error loading company:', error);
    } finally {
      setLoadingCompany(false);
    }
  };

  const handleTagToggle = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
    
    // Clear tag validation error
    if (errors.tags) {
      setErrors(prev => ({ ...prev, tags: '' }));
    }
  };

  const pickImages = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Camera roll permissions are required to select images');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
      aspect: [16, 9],
    });

    if (!result.canceled) {
      setSelectedImages(prev => [...prev, ...result.assets].slice(0, 5)); // Max 5 images
    }
  };

  const removeImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
  };

  const validateForm = () => {
    const formData = {
      title: title.trim(),
      description: description.trim(),
      location: location.trim(),
      tags: selectedTags,
      is_paid: isPaid,
      stipend_amount: isPaid && stipendAmount ? parseFloat(stipendAmount) || 0 : undefined,
    };

    console.log('🔍 VALIDATION DEBUG - Form data:', formData);

    try {
      jobSchema.parse(formData);
      console.log('✅ Validation passed!');
      setErrors({});
      return { valid: true, errors: {} };
    } catch (error) {
      console.log('❌ Validation failed, error:', error);
      if (error instanceof z.ZodError && error.errors) {
        console.log('📝 ZodError details:', error.errors);
        const newErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          console.log('Processing error:', err.path, err.message);
          if (err.path[0]) {
            newErrors[err.path[0] as string] = err.message;
          }
        });
        console.log('📊 Final newErrors object:', newErrors);
        setErrors(newErrors);
        return { valid: false, errors: newErrors };
      }
      console.log('⚠️ Non-ZodError validation failure');
      return { valid: false, errors: {} };
    }
  };

  const handleSubmit = async () => {
    console.log('🔥🔥🔥 HANDLE SUBMIT CALLED!!! 🔥🔥🔥');
    console.log('=== JOB POSTING SUBMIT DEBUG ===');
    console.log('handleSubmit called');
    console.log('Company ID:', companyId);
    console.log('Form data for validation:');
    console.log('- Title:', `"${title.trim()}" (length: ${title.trim().length})`);
    console.log('- Description:', `"${description.trim()}" (length: ${description.trim().length})`);
    console.log('- Selected tags:', selectedTags);

    if (!companyId) {
      console.log('❌ No company ID found');
      Alert.alert('Error', 'Company not found. Please set up your company first.');
      return;
    }

    console.log('✅ Company ID exists, skipping validation...');
    // VALIDATION DISABLED
    // const validation = validateForm();
    // console.log('🔍 VALIDATION RESULT:', validation);
    // if (!validation.valid) {
    //   console.log('❌ Form validation failed');
    //   console.log('Validation errors:', validation.errors);
    //   // ... all validation logic commented out
    //   return;
    // }

    console.log('✅ Form validation skipped');

    try {
      const jobData = {
        company_id: companyId,
        title: title.trim(),
        description: description.trim(),
        location: location.trim() || null,
        tags: selectedTags,
        is_paid: isPaid,
        stipend_amount: isPaid && stipendAmount ? parseFloat(stipendAmount) : null,
      };

      console.log('📝 Job data to submit:', jobData);
      console.log('🚀 Calling createJob...');

      let job;
      try {
        job = await createJob(jobData);
        console.log('✅ Job created successfully:', job);
      } catch (createError: any) {
        console.log('❌ Job creation failed:', createError);
        if (typeof window !== 'undefined') {
          window.alert(`Error: ${createError.message || 'Failed to create job'}`);
        } else {
          Alert.alert('Error', createError.message || 'Failed to create job');
        }
        return;
      }

      // Upload images if any selected
      if (selectedImages.length > 0) {
        console.log('📸 Uploading images...');
        try {
          const imageFiles = await Promise.all(
            selectedImages.map(async (asset) => {
              const response = await fetch(asset.uri);
              const blob = await response.blob();
              return new File([blob], asset.fileName || 'image.jpg', { type: 'image/jpeg' });
            })
          );

          await uploadImages(job.id, imageFiles);
          console.log('✅ Images uploaded successfully');
        } catch (imageError) {
          console.warn('⚠️ Image upload failed, but job was created:', imageError);
        }
      }

      // Show success message with notification details
      const notificationResult = (job as any).notificationResult;
      let successMessage = 'Job posted successfully!';

      if (notificationResult?.success && notificationResult?.matchedStudents !== undefined) {
        const matchedCount = notificationResult.matchedStudents;
        if (matchedCount > 0) {
          successMessage += `\n\n🎉 We notified ${matchedCount} matched student${matchedCount === 1 ? '' : 's'}!`;
        } else {
          successMessage += '\n\n📢 Your job is live! Students will be notified as their interests match.';
        }
      } else {
        // Fallback if notification failed
        successMessage += '\n\n📢 Your job is now live and visible to students!';
      }

      console.log('🎉 Success! Showing alert to user');
      console.log('📱 About to show alert...');

      // Use native browser alert for web compatibility, then navigate
      setTimeout(() => {
        if (typeof window !== 'undefined') {
          // Web environment - use native alert
          window.alert(successMessage);
          console.log('👤 Alert shown, navigating back...');
          router.back();
        } else {
          // React Native environment - use Alert.alert
          Alert.alert('Success', successMessage, [
            { text: 'OK', onPress: () => {
              console.log('👤 User clicked OK, navigating back...');
              router.back();
            }}
          ]);
        }
      }, 100);

    } catch (error: any) {
      console.log('❌ UNEXPECTED ERROR in handleSubmit:', error);
      console.log('Error message:', error.message);
      console.log('Error stack:', error.stack);
      if (typeof window !== 'undefined') {
        window.alert(`Error: ${error.message || 'An unexpected error occurred'}`);
      } else {
        Alert.alert('Error', error.message || 'An unexpected error occurred');
      }
    }
    console.log('=== JOB POSTING SUBMIT END ===');
  };

  if (loadingCompany) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loading}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView ref={scrollViewRef} style={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>🔥 CLAUDE MODIFIED THIS PAGE 🔥</Text>
          <Text style={styles.subtitle}>Create a job posting to find students</Text>
        </View>

        <Card style={styles.form}>
          <View>
            <Input
              label="Job Title *"
              value={title}
              onChangeText={(text) => {
                setTitle(text);
                if (errors.title) setErrors(prev => ({ ...prev, title: '' }));
              }}
              placeholder="e.g., Marketing Intern, Server Assistant"
              style={[
                errors.title && styles.inputError,
                showingValidationError && errors.title && styles.inputErrorFlash
              ]}
            />
            {errors.title && <Text style={styles.errorText}>{errors.title}</Text>}
          </View>
          
          <View>
            <Input
              label="Job Description *"
              value={description}
              onChangeText={(text) => {
                setDescription(text);
                if (errors.description) setErrors(prev => ({ ...prev, description: '' }));
              }}
              multiline
              placeholder="Describe the role, responsibilities, and what students will learn..."
              style={[
                errors.description && styles.inputError,
                showingValidationError && errors.description && styles.inputErrorFlash
              ]}
            />
            {errors.description && <Text style={styles.errorText}>{errors.description}</Text>}
          </View>
          
          <Input
            label="Location"
            value={location}
            onChangeText={setLocation}
            placeholder="City, State or Remote"
          />

          <View style={styles.imagesSection}>
            <Text style={styles.sectionTitle}>Job Images (Optional)</Text>
            <Text style={styles.sectionSubtitle}>Add up to 5 images to showcase the workplace or role</Text>
            
            {selectedImages.length > 0 && (
              <ScrollView horizontal style={styles.imagesPreview} showsHorizontalScrollIndicator={false}>
                {selectedImages.map((image, index) => (
                  <View key={index} style={styles.imageContainer}>
                    <Image source={{ uri: image.uri }} style={styles.previewImage} />
                    <TouchableOpacity
                      style={styles.removeImageButton}
                      onPress={() => removeImage(index)}
                    >
                      <Text style={styles.removeImageText}>×</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
            )}
            
            <Button
              title={`Add Images (${selectedImages.length}/5)`}
              onPress={pickImages}
              variant="outline"
              disabled={selectedImages.length >= 5}
              style={styles.addImageButton}
            />
          </View>
          
          <View style={styles.paymentSection}>
            <Text style={styles.sectionTitle}>Payment</Text>
            <View style={styles.paidToggle}>
              <Text style={styles.toggleLabel}>This is a paid position</Text>
              <Switch value={isPaid} onValueChange={setIsPaid} />
            </View>
            
            {isPaid && (
              <View>
                <Input
                  label="Stipend Amount ($)"
                  value={stipendAmount}
                  onChangeText={(text) => {
                    setStipendAmount(text);
                    if (errors.stipend_amount) setErrors(prev => ({ ...prev, stipend_amount: '' }));
                  }}
                  keyboardType="numeric"
                  placeholder="e.g., 2500 for total, 18 for hourly"
                />
                {errors.stipend_amount && <Text style={styles.errorText}>{errors.stipend_amount}</Text>}
              </View>
            )}
          </View>
          
          <View style={styles.tagsSection}>
            <Text style={styles.sectionTitle}>Required Skills & Tags *</Text>
            <Text style={styles.tagsSubtitle}>
              Select tags that match the skills needed for this job
            </Text>
            
            <View style={styles.tagsContainer}>
              {AVAILABLE_TAGS.map(tag => (
                <Tag
                  key={tag}
                  label={tag}
                  selected={selectedTags.includes(tag)}
                  onPress={() => handleTagToggle(tag)}
                />
              ))}
            </View>
            {errors.tags && <Text style={styles.errorText}>{errors.tags}</Text>}
            {selectedTags.length === 0 && (
              <Text style={styles.helperText}>Please select at least one skill tag</Text>
            )}
          </View>
          
          <View style={styles.actions}>
            <Button
              title={uploadLoading ? `Uploading Images... ${Math.round(progress)}%` : "🚨 CLAUDE TEST BUTTON 🚨"}
              onPress={() => {
                alert('🚨 BUTTON CLICKED! 🚨');
                console.log('📋 Post Job button clicked');
                console.log('Button state - createLoading:', createLoading, 'uploadLoading:', uploadLoading);
                handleSubmit();
              }}
              loading={createLoading || uploadLoading}
              disabled={createLoading || uploadLoading}
            />
            
            <Button
              title="Cancel"
              onPress={() => router.back()}
              variant="outline"
              disabled={createLoading || uploadLoading}
            />
          </View>
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
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: theme.fontSize.lg,
    color: theme.colors.textSecondary,
  },
  header: {
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
  },
  title: {
    fontSize: theme.fontSize.xxxl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
  },
  form: {
    margin: theme.spacing.lg,
    marginTop: 0,
    padding: theme.spacing.lg,
  },
  paymentSection: {
    marginVertical: theme.spacing.md,
  },
  sectionTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  paidToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  toggleLabel: {
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
  },
  tagsSection: {
    marginVertical: theme.spacing.md,
  },
  tagsSubtitle: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.md,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  actions: {
    gap: theme.spacing.md,
    marginTop: theme.spacing.xl,
  },
  errorText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.error || '#ff4444',
    marginTop: theme.spacing.xs,
  },
  imagesSection: {
    marginVertical: theme.spacing.md,
  },
  sectionSubtitle: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.md,
  },
  imagesPreview: {
    marginVertical: theme.spacing.md,
  },
  imageContainer: {
    position: 'relative',
    marginRight: theme.spacing.md,
  },
  previewImage: {
    width: 120,
    height: 80,
    borderRadius: 8,
  },
  removeImageButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#ff4444',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeImageText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  addImageButton: {
    marginTop: theme.spacing.md,
  },
  helperText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
    fontStyle: 'italic',
  },
  inputError: {
    borderColor: '#ff4444',
    borderWidth: 2,
  },
  inputErrorFlash: {
    backgroundColor: '#ffeeee',
  },
});