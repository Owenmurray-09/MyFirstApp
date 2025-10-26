import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Text, Image, Alert, Dimensions, TouchableOpacity, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { theme } from '@/config/theme';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Tag } from '@/components/ui/Tag';
import { Input } from '@/components/ui/Input';
import { useJob } from '@/lib/hooks/useJobs';
import { useApply, useCheckApplication } from '@/lib/hooks/useApplications';
import { useComments, useAddComment } from '@/lib/hooks/useComments';
import { useAuth } from '@/lib/hooks/useAuth';

const { width: screenWidth } = Dimensions.get('window');

interface CommentSectionProps {
  jobId: string;
}

function CommentSection({ jobId }: CommentSectionProps) {
  const [newComment, setNewComment] = useState('');
  const [hasWorkedHere, setHasWorkedHere] = useState(false); // TODO: Check if user has worked here
  const { comments, loading: commentsLoading } = useComments(jobId);
  const { addComment, loading: addingComment } = useAddComment();

  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    if (!hasWorkedHere) {
      Alert.alert(
        'Not Eligible',
        'Only people who have worked at this company can leave reviews and comments.',
        [{ text: 'OK' }]
      );
      return;
    }

    try {
      await addComment(jobId, newComment.trim());
      setNewComment('');
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  return (
    <Card style={styles.commentsCard}>
      <Text style={styles.sectionTitle}>Reviews & Comments</Text>
      <Text style={styles.sectionSubtitle}>
        Only people who have worked here can leave reviews
      </Text>

      <View style={styles.addCommentSection}>
        <Input
          value={newComment}
          onChangeText={setNewComment}
          placeholder={hasWorkedHere
            ? "Share your experience working here..."
            : "You must have worked here to leave a review"
          }
          multiline
          editable={hasWorkedHere}
        />
        <Button
          title="Post Review"
          onPress={handleAddComment}
          loading={addingComment}
          disabled={!newComment.trim() || !hasWorkedHere}
          style={[
            styles.postCommentButton,
            !hasWorkedHere && styles.disabledButton
          ]}
        />
        {!hasWorkedHere && (
          <Text style={styles.restrictionText}>
            💼 Apply and complete work here to leave a review
          </Text>
        )}
      </View>

      {commentsLoading ? (
        <Text style={styles.loadingText}>Loading comments...</Text>
      ) : comments.length === 0 ? (
        <Text style={styles.noCommentsText}>No comments yet. Be the first to share!</Text>
      ) : (
        <View style={styles.commentsList}>
          {comments.map((comment) => (
            <View key={comment.id} style={styles.commentItem}>
              <Text style={styles.commentAuthor}>{comment.profiles?.full_name || 'Anonymous'}</Text>
              <Text style={styles.commentContent}>{comment.content}</Text>
              <Text style={styles.commentDate}>
                {new Date(comment.created_at).toLocaleDateString()}
              </Text>
            </View>
          ))}
        </View>
      )}
    </Card>
  );
}

export default function JobDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [applicationNote, setApplicationNote] = useState('');
  const [applicationEmail, setApplicationEmail] = useState('');
  const [applicationPhone, setApplicationPhone] = useState('');
  const [showApplicationForm, setShowApplicationForm] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const { job, loading } = useJob(id as string);
  const { apply, loading: applying } = useApply();
  const { hasApplied, loading: checkingApplication } = useCheckApplication(id as string);
  const { profile } = useAuth();

  const renderImageCarousel = () => {
    if (!job?.images || job.images.length === 0) return null;

    return (
      <View style={styles.imageCarousel}>
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={(e) => {
            const newIndex = Math.round(e.nativeEvent.contentOffset.x / screenWidth);
            setCurrentImageIndex(newIndex);
          }}
        >
          {job.images.map((image, index) => (
            <Image
              key={index}
              source={{ uri: image }}
              style={styles.carouselImage}
            />
          ))}
        </ScrollView>
        
        {job.images.length > 1 && (
          <View style={styles.imageIndicators}>
            {job.images.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.indicator,
                  index === currentImageIndex && styles.activeIndicator
                ]}
              />
            ))}
          </View>
        )}
      </View>
    );
  };

  const handleApply = async () => {
    if (hasApplied) {
      Alert.alert('Already Applied', 'You have already applied for this position.');
      return;
    }

    if (!showApplicationForm) {
      setShowApplicationForm(true);
      return;
    }

    // VALIDATION DISABLED
    // Validate required fields (make email required, phone optional)
    // if (!applicationEmail.trim()) {
    //   Alert.alert('Email Required', 'Please provide your email address so the employer can contact you.');
    //   return;
    // }

    // Basic email validation
    // const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    // if (!emailRegex.test(applicationEmail.trim())) {
    //   Alert.alert('Invalid Email', 'Please enter a valid email address.');
    //   return;
    // }

    if (!id) return;

    try {
      await apply(
        id,
        applicationNote.trim() || undefined,
        applicationEmail.trim(),
        applicationPhone.trim()
      );
      Alert.alert('Success', 'Your application has been submitted!');
      setShowApplicationForm(false);
      setApplicationNote('');
      setApplicationEmail('');
      setApplicationPhone('');
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  if (loading || !job) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loading}>
          <Text style={styles.loadingText}>Loading job details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {renderImageCarousel()}
        
        <View style={styles.content}>
          <Card style={styles.jobCard}>
            <Text style={styles.title}>{job.title}</Text>
            <Text style={styles.company}>{job.companies?.name}</Text>
            
            {job.location && (
              <Text style={styles.location}>📍 {job.location}</Text>
            )}
            
            <View style={styles.paymentInfo}>
              <Tag
                label={job.is_paid
                  ? (job.stipend_amount ? `$${job.stipend_amount}` : 'Paid Position')
                  : 'Internship'
                }
                variant={job.is_paid ? 'success' : 'primary'}
              />
            </View>
            
            <View style={styles.tags}>
              {job.tags?.map((tag, index) => (
                <Tag key={index} label={tag} />
              ))}
            </View>
          </Card>
          
          <Card style={styles.descriptionCard}>
            <Text style={styles.sectionTitle}>Job Description</Text>
            <Text style={styles.description}>{job.description}</Text>
          </Card>
          
          <Card style={styles.companyCard}>
            <Text style={styles.sectionTitle}>About {job.companies?.name}</Text>
            <Text style={styles.companyDescription}>{job.companies?.description}</Text>
            {job.companies?.location && (
              <Text style={styles.companyLocation}>📍 {job.companies.location}</Text>
            )}
          </Card>
          
          <Card style={styles.applicationCard}>
            <Text style={styles.sectionTitle}>
              {job.is_paid ? 'Apply for this Position' : 'Apply as an Intern'}
            </Text>

            {showApplicationForm ? (
              <View style={styles.applicationForm}>
                <Input
                  label="Email Address"
                  value={applicationEmail}
                  onChangeText={setApplicationEmail}
                  placeholder="your.email@example.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />

                <Input
                  label="Phone Number (Optional)"
                  value={applicationPhone}
                  onChangeText={setApplicationPhone}
                  placeholder="+1 (555) 123-4567"
                  keyboardType="phone-pad"
                />

                <Input
                  label="Cover Note (Optional)"
                  value={applicationNote}
                  onChangeText={setApplicationNote}
                  multiline
                  placeholder="Tell the employer why you're interested in this position..."
                />

                <View style={styles.applicationActions}>
                  <Button
                    title={job.is_paid ? "Submit Application" : "Apply as Intern"}
                    onPress={handleApply}
                    loading={applying}
                  />
                  <Button
                    title="Cancel"
                    onPress={() => setShowApplicationForm(false)}
                    variant="outline"
                  />
                </View>
              </View>
            ) : (
              <Button
                title={hasApplied
                  ? "Application Submitted"
                  : (job.is_paid ? "Apply Now" : "Apply as an Intern")
                }
                onPress={handleApply}
                style={[styles.applyButton, hasApplied && styles.appliedButton]}
                disabled={hasApplied || checkingApplication}
              />
            )}
          </Card>

          <Card style={styles.contactCard}>
            <Text style={styles.sectionTitle}>Contact Employer</Text>
            <Text style={styles.contactDescription}>
              Have questions about this {job.is_paid ? 'position' : 'internship'}?
              Contact the employer directly.
            </Text>

            <View style={styles.contactButtonsContainer}>
              <Button
                title="📧 Email"
                onPress={() => {
                  const email = job?.companies?.email || 'contact@company.com';
                  const subject = `Question about ${job?.title}`;
                  const body = `Hi,\n\nI'm interested in the ${job?.title} position and have some questions.\n\nBest regards`;
                  Linking.openURL(`mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
                }}
                variant="outline"
                style={styles.contactButton}
              />

              <Button
                title="💬 WhatsApp"
                onPress={() => {
                  const phone = job?.companies?.phone || '';
                  if (!phone) {
                    Alert.alert('No WhatsApp', 'WhatsApp contact not available for this employer.');
                    return;
                  }
                  const message = `Hi! I'm interested in the ${job?.title} position.`;
                  Linking.openURL(`whatsapp://send?phone=${phone}&text=${encodeURIComponent(message)}`);
                }}
                variant="outline"
                style={styles.contactButton}
              />
            </View>
          </Card>
          
          <CommentSection jobId={id as string} />
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
  imageCarousel: {
    position: 'relative',
  },
  carouselImage: {
    width: screenWidth,
    height: 250,
  },
  imageIndicators: {
    position: 'absolute',
    bottom: 10,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  activeIndicator: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  content: {
    padding: theme.spacing.lg,
  },
  jobCard: {
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  title: {
    fontSize: theme.fontSize.xxl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  company: {
    fontSize: theme.fontSize.lg,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.sm,
  },
  location: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.md,
  },
  paymentInfo: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  descriptionCard: {
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  companyCard: {
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  applicationCard: {
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  description: {
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
    lineHeight: 22,
  },
  companyDescription: {
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
    lineHeight: 22,
    marginBottom: theme.spacing.sm,
  },
  companyLocation: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  applicationForm: {
    gap: theme.spacing.md,
  },
  applicationActions: {
    gap: theme.spacing.sm,
  },
  applyButton: {
    marginTop: theme.spacing.sm,
  },
  appliedButton: {
    backgroundColor: theme.colors.success,
    opacity: 0.7,
  },
  commentsCard: {
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  addCommentSection: {
    marginBottom: theme.spacing.lg,
  },
  postCommentButton: {
    marginTop: theme.spacing.md,
  },
  noCommentsText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  commentsList: {
    gap: theme.spacing.md,
  },
  commentItem: {
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    paddingBottom: theme.spacing.md,
  },
  commentAuthor: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  commentContent: {
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
    lineHeight: 20,
    marginBottom: theme.spacing.xs,
  },
  commentDate: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  contactCard: {
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  contactDescription: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
    lineHeight: 20,
    marginBottom: theme.spacing.md,
  },
  contactButtonsContainer: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    justifyContent: 'space-between',
  },
  contactButton: {
    flex: 1,
    marginTop: theme.spacing.sm,
  },
  sectionSubtitle: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    fontStyle: 'italic',
    marginBottom: theme.spacing.md,
  },
  disabledButton: {
    opacity: 0.5,
  },
  restrictionText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: theme.spacing.sm,
    fontStyle: 'italic',
  },
});