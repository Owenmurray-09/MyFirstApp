import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Text, Alert, Switch, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { theme } from '@/config/theme';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { Input } from '@/components/ui/Input';
import { Tag } from '@/components/ui/Tag';

interface Profile {
  id: string;
  role: 'student' | 'employer';
  name: string;
  bio: string | null;
  location: string | null;
  phone: string | null;
  experience: string | null;
  interests: string[];
  avatar_url: string | null;
  daily_digest_enabled: boolean;
}

export default function ProfileScreen() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    bio: '',
    location: '',
    phone: '',
    experience: '',
  });

  useEffect(() => {
    loadProfile();
  }, []);

  // Update editForm whenever profile changes
  useEffect(() => {
    if (profile) {
      const formData = {
        name: profile.name || '',
        bio: profile.bio || '',
        location: profile.location || '',
        phone: profile.phone || '',
        experience: profile.experience || '',
      };
      setEditForm(formData);
    }
  }, [profile]);

  const loadProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      setProfile(data);

      // Update edit form with loaded data
      const formData = {
        name: data.name || '',
        bio: data.bio || '',
        location: data.location || '',
        phone: data.phone || '',
        experience: data.experience || '',
      };
      setEditForm(formData);
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetEditForm = () => {
    const formData = {
      name: profile?.name || '',
      bio: profile?.bio || '',
      location: profile?.location || '',
      phone: profile?.phone || '',
      experience: profile?.experience || '',
    };
    setEditForm(formData);
  };

  const handleSave = async () => {
    if (!profile) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          name: editForm.name.trim(),
          bio: editForm.bio.trim() || null,
          location: editForm.location.trim() || null,
          phone: editForm.phone.trim() || null,
          experience: editForm.experience.trim() || null,
        })
        .eq('id', profile.id);

      if (error) throw error;

      Alert.alert('Success', 'Profile updated successfully');
      setEditing(false);
      await loadProfile();
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
            await supabase.auth.signOut();
            router.replace('/(auth)/sign-in');
          },
        },
      ]
    );
  };

  const handleDailyDigestToggle = async (enabled: boolean) => {
    if (!profile) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ daily_digest_enabled: enabled })
        .eq('id', profile.id);

      if (error) throw error;

      setProfile(prev => prev ? { ...prev, daily_digest_enabled: enabled } : null);
      
      Alert.alert(
        'Settings Updated',
        enabled 
          ? 'You will receive daily digest emails instead of immediate notifications'
          : 'You will receive immediate notifications for new job matches'
      );
    } catch (error: any) {
      Alert.alert('Error', 'Failed to update notification settings');
      console.error('Error updating daily digest setting:', error);
    }
  };

  if (loading || !profile) {
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
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              if (profile?.role === 'student') {
                router.replace('/(student)/');
              } else if (profile?.role === 'employer') {
                router.replace('/(employer)/');
              } else {
                router.back();
              }
            }}
          >
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Profile</Text>
          <View style={styles.headerSpacer} />
        </View>

        <Card style={styles.profileCard}>
          <View style={styles.profileHeader}>
            <Avatar 
              src={profile.avatar_url} 
              name={profile.name} 
              size="lg" 
            />
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{profile.name}</Text>
              <Text style={styles.profileRole}>
                {profile.role === 'student' ? 'Student' : 'Employer'}
              </Text>
              {profile.location && (
                <Text style={styles.profileLocation}>📍 {profile.location}</Text>
              )}
              {profile.phone && (
                <Text style={styles.profileLocation}>📞 {profile.phone}</Text>
              )}
            </View>
          </View>

          {profile.bio && (
            <View style={styles.bioSection}>
              <Text style={styles.sectionTitle}>About</Text>
              <Text style={styles.bioText}>{profile.bio}</Text>
            </View>
          )}

          {profile.experience && (
            <View style={styles.bioSection}>
              <Text style={styles.sectionTitle}>
                {profile.role === 'student' ? 'Experience & Education' : 'Professional Experience'}
              </Text>
              <Text style={styles.bioText}>{profile.experience}</Text>
            </View>
          )}

          {profile.role === 'student' && profile.interests.length > 0 && (
            <View style={styles.interestsSection}>
              <Text style={styles.sectionTitle}>Interests</Text>
              <View style={styles.interestsTags}>
                {profile.interests.map((interest, index) => (
                  <Tag key={index} label={interest} />
                ))}
              </View>
            </View>
          )}
        </Card>

        {/* Notification Settings - Only for students */}
        {profile.role === 'student' && (
          <Card style={styles.settingsCard}>
            <Text style={styles.sectionTitle}>Notification Settings</Text>
            
            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Daily Digest</Text>
                <Text style={styles.settingDescription}>
                  {profile.daily_digest_enabled 
                    ? 'Receive one daily email with job matches'
                    : 'Get immediate notifications for new job matches'
                  }
                </Text>
              </View>
              <Switch
                value={profile.daily_digest_enabled}
                onValueChange={handleDailyDigestToggle}
                trackColor={{ false: '#e1e1e1', true: theme.colors.primary }}
                thumbColor={profile.daily_digest_enabled ? 'white' : '#f4f3f4'}
                ios_backgroundColor="#e1e1e1"
              />
            </View>
            
            <Text style={styles.settingNote}>
              💡 Daily digest helps reduce notification overload while keeping you updated on relevant opportunities.
            </Text>
          </Card>
        )}

        {editing ? (
          <Card style={styles.editCard}>
            <Text style={styles.editTitle}>Edit Profile</Text>
            
            <Input
              label="Name"
              value={editForm.name}
              onChangeText={(text) => setEditForm(prev => ({ ...prev, name: text }))}
              placeholder="Your name"
            />
            
            <Input
              label="Bio"
              value={editForm.bio}
              onChangeText={(text) => setEditForm(prev => ({ ...prev, bio: text }))}
              multiline
              placeholder="Tell us about yourself..."
            />

            <Input
              label={`${profile?.role === 'student' ? 'Experience & Education' : 'Professional Experience'} (Optional)`}
              value={editForm.experience}
              onChangeText={(text) => setEditForm(prev => ({ ...prev, experience: text }))}
              multiline
              placeholder={profile?.role === 'student'
                ? 'Previous jobs, internships, volunteer work, schools attended, relevant coursework...'
                : 'Previous roles, companies, achievements, education...'
              }
            />

            <Input
              label="Location"
              value={editForm.location}
              onChangeText={(text) => setEditForm(prev => ({ ...prev, location: text }))}
              placeholder="City, State"
            />

            <Input
              label="Phone"
              value={editForm.phone}
              onChangeText={(text) => setEditForm(prev => ({ ...prev, phone: text }))}
              placeholder="Your phone number"
              keyboardType="phone-pad"
            />

            <View style={styles.editActions}>
              <Button title="Save Changes" onPress={handleSave} />
              <Button
                title="Cancel"
                onPress={() => {
                  setEditing(false);
                  resetEditForm();
                }}
                variant="outline"
              />
            </View>
          </Card>
        ) : (
          <Card style={styles.actionsCard}>
            <Button
              title="Edit Profile"
              onPress={() => setEditing(true)}
              variant="outline"
              style={styles.actionButton}
            />
            
            <Button 
              title="Sign Out" 
              onPress={handleSignOut} 
              variant="outline"
              style={styles.actionButton}
            />
          </Card>
        )}
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
  },
  backButton: {
    padding: theme.spacing.sm,
  },
  backButtonText: {
    fontSize: theme.fontSize.lg,
    color: theme.colors.primary,
    fontWeight: theme.fontWeight.medium,
  },
  headerSpacer: {
    width: 60, // Same width as back button to center the title
  },
  title: {
    fontSize: theme.fontSize.xxxl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
  },
  profileCard: {
    margin: theme.spacing.lg,
    marginTop: 0,
    padding: theme.spacing.lg,
  },
  profileHeader: {
    flexDirection: 'row',
    marginBottom: theme.spacing.lg,
  },
  profileInfo: {
    flex: 1,
    marginLeft: theme.spacing.md,
    justifyContent: 'center',
  },
  profileName: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  profileRole: {
    fontSize: theme.fontSize.md,
    color: theme.colors.primary,
    fontWeight: theme.fontWeight.medium,
    marginBottom: theme.spacing.xs,
  },
  profileLocation: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
  },
  bioSection: {
    marginBottom: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  bioText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
    lineHeight: 22,
  },
  interestsSection: {
    marginBottom: theme.spacing.lg,
  },
  interestsTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  editCard: {
    margin: theme.spacing.lg,
    marginTop: 0,
    padding: theme.spacing.lg,
  },
  editTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.lg,
  },
  editActions: {
    gap: theme.spacing.sm,
    marginTop: theme.spacing.md,
  },
  actionsCard: {
    margin: theme.spacing.lg,
    marginTop: 0,
    padding: theme.spacing.lg,
  },
  actionButton: {
    marginBottom: theme.spacing.sm,
  },
  settingsCard: {
    margin: theme.spacing.lg,
    marginTop: 0,
    padding: theme.spacing.lg,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    marginBottom: theme.spacing.md,
  },
  settingInfo: {
    flex: 1,
    marginRight: theme.spacing.md,
  },
  settingLabel: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  settingDescription: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    lineHeight: 18,
  },
  settingNote: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: theme.spacing.sm,
  },
});