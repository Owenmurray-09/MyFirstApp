import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { theme } from '@/config/theme';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Tag } from '@/components/ui/Tag';
import { useAuth } from '@/lib/hooks/useAuth';

const STUDENT_INTERESTS = [
  'cash register', 'customer service', 'heavy lifting', 'front desk',
  'retail', 'barista', 'inventory', 'cleaning', 'basic coding', 'graphic design'
];

export default function ProfileScreen() {
  const { profile, signOut, updateProfile, loading } = useAuth();
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: profile?.name || '',
    bio: profile?.bio || '',
    location: profile?.location || '',
    phone: profile?.phone || '',
    experience: profile?.experience || '',
    interests: profile?.interests || [],
  });

  const handleInterestToggle = (interest: string) => {
    setEditForm(prev => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest]
    }));
  };

  const handleSave = async () => {
    try {
      await updateProfile(editForm);
      setIsEditing(false);
      Alert.alert('Success', 'Profile updated successfully!');
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
              router.replace('/(auth)/sign-in');
            } catch (error: any) {
              Alert.alert('Error', error.message);
            }
          },
        },
      ]
    );
  };

  if (!profile) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loading}>
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Profile</Text>
          <Text style={styles.subtitle}>Manage your account information</Text>
        </View>

        <View style={styles.content}>
          <Card style={styles.profileCard}>
            <View style={styles.profileHeader}>
              <View style={styles.avatarContainer}>
                <Text style={styles.avatarText}>
                  {profile.name?.charAt(0)?.toUpperCase() || 'U'}
                </Text>
              </View>
              <View style={styles.profileInfo}>
                <Text style={styles.profileName}>{profile.name || 'Unnamed User'}</Text>
                <Text style={styles.profileRole}>Student</Text>
              </View>
            </View>

            {isEditing ? (
              <View style={styles.editForm}>
                <Input
                  label="Name"
                  value={editForm.name}
                  onChangeText={(text) => setEditForm({ ...editForm, name: text })}
                  placeholder="Enter your name"
                />

                <Input
                  label="Bio"
                  value={editForm.bio}
                  onChangeText={(text) => setEditForm({ ...editForm, bio: text })}
                  placeholder="Tell us about yourself..."
                  multiline
                />

                <Input
                  label="Experience & Education (Optional)"
                  value={editForm.experience}
                  onChangeText={(text) => setEditForm({ ...editForm, experience: text })}
                  placeholder="Previous jobs, internships, volunteer work, schools attended, relevant coursework..."
                  multiline
                />

                <Input
                  label="Location"
                  value={editForm.location}
                  onChangeText={(text) => setEditForm({ ...editForm, location: text })}
                  placeholder="Your city or region"
                />

                <Input
                  label="Phone (Optional)"
                  value={editForm.phone}
                  onChangeText={(text) => setEditForm({ ...editForm, phone: text })}
                  placeholder="Your phone number"
                  keyboardType="phone-pad"
                />

                <View style={styles.interestsSection}>
                  <Text style={styles.interestsTitle}>Update Your Interests</Text>
                  <Text style={styles.interestsSubtitle}>
                    Choose skills and areas you're interested in working with
                  </Text>

                  <View style={styles.interestsTags}>
                    {STUDENT_INTERESTS.map(interest => (
                      <Tag
                        key={interest}
                        label={interest}
                        selected={editForm.interests.includes(interest)}
                        onPress={() => handleInterestToggle(interest)}
                      />
                    ))}
                  </View>
                </View>

                <View style={styles.editActions}>
                  <Button
                    title="Save Changes"
                    onPress={handleSave}
                    loading={loading}
                  />
                  <Button
                    title="Cancel"
                    onPress={() => {
                      setIsEditing(false);
                      setEditForm({
                        name: profile?.name || '',
                        bio: profile?.bio || '',
                        location: profile?.location || '',
                        phone: profile?.phone || '',
                        experience: profile?.experience || '',
                        interests: profile?.interests || [],
                      });
                    }}
                    variant="outline"
                  />
                </View>
              </View>
            ) : (
              <View style={styles.profileDetails}>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Bio</Text>
                  <Text style={styles.detailValue}>
                    {profile.bio || 'No bio added yet'}
                  </Text>
                </View>

                {profile.experience && (
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Experience & Education</Text>
                    <Text style={styles.detailValue}>
                      {profile.experience}
                    </Text>
                  </View>
                )}

                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Location</Text>
                  <Text style={styles.detailValue}>
                    {profile.location || 'Location not specified'}
                  </Text>
                </View>

                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Phone</Text>
                  <Text style={styles.detailValue}>
                    {profile.phone || 'Phone not provided'}
                  </Text>
                </View>

                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Interests</Text>
                  {profile.interests && profile.interests.length > 0 ? (
                    <View style={styles.interestsTags}>
                      {profile.interests.map((interest, index) => (
                        <Tag key={index} label={interest} />
                      ))}
                    </View>
                  ) : (
                    <Text style={styles.detailValue}>No interests selected</Text>
                  )}
                </View>

                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Member Since</Text>
                  <Text style={styles.detailValue}>
                    {new Date(profile.created_at).toLocaleDateString()}
                  </Text>
                </View>

                <Button
                  title="Edit Profile"
                  onPress={() => setIsEditing(true)}
                  style={styles.editButton}
                />
              </View>
            )}
          </Card>

          <Card style={styles.actionsCard}>
            <Text style={styles.sectionTitle}>Account Actions</Text>

            <Button
              title="Sign Out"
              onPress={handleSignOut}
              variant="outline"
              style={styles.signOutButton}
            />
          </Card>
        </View>
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
  content: {
    padding: theme.spacing.lg,
  },
  profileCard: {
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  avatarContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.white,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  profileRole: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
  },
  profileDetails: {
    gap: theme.spacing.md,
  },
  detailItem: {
    marginBottom: theme.spacing.md,
  },
  detailLabel: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  detailValue: {
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
    lineHeight: 20,
  },
  editButton: {
    marginTop: theme.spacing.md,
  },
  editForm: {
    gap: theme.spacing.md,
  },
  editActions: {
    gap: theme.spacing.sm,
    marginTop: theme.spacing.md,
  },
  actionsCard: {
    padding: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  signOutButton: {
    borderColor: theme.colors.danger,
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
    marginTop: theme.spacing.xs,
  },
});