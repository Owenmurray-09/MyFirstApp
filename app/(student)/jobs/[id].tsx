import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Text, Image, Alert, Dimensions, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { theme } from '@/config/theme';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Tag } from '@/components/ui/Tag';
import { Input } from '@/components/ui/Input';
import { useJob } from '@/lib/hooks/useJobs';
import { useApply } from '@/lib/hooks/useApplications';
import { useComments, useAddComment } from '@/lib/hooks/useComments';

const { width: screenWidth } = Dimensions.get('window');

interface CommentSectionProps {
  jobId: string;
}

function CommentSection({ jobId }: CommentSectionProps) {
  const [newComment, setNewComment] = useState('');
  const { comments, loading: commentsLoading } = useComments(jobId);
  const { addComment, loading: addingComment } = useAddComment();

  const handleAddComment = async () => {
    if (!newComment.trim()) return;

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
      
      <View style={styles.addCommentSection}>
        <Input
          value={newComment}
          onChangeText={setNewComment}
          placeholder="Share your experience or ask a question..."
          multiline
        />
        <Button
          title="Post Comment"
          onPress={handleAddComment}
          loading={addingComment}
          disabled={!newComment.trim()}
          style={styles.postCommentButton}
        />
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
  const [applicationNote, setApplicationNote] = useState('');
  const [showApplicationForm, setShowApplicationForm] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const { job, loading } = useJob(id as string);
  const { apply, loading: applying } = useApply();

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
    if (!showApplicationForm) {
      setShowApplicationForm(true);
      return;
    }

    if (!id) return;

    try {
      await apply(id, applicationNote.trim() || undefined);
      Alert.alert('Success', 'Your application has been submitted!');
      setShowApplicationForm(false);
      setApplicationNote('');
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
                  ? (job.stipend_amount ? `$${job.stipend_amount}` : 'Paid') 
                  : 'Unpaid'
                } 
                variant={job.is_paid ? 'success' : 'warning'}
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
            <Text style={styles.sectionTitle}>Apply for this Position</Text>
            
            {showApplicationForm ? (
              <View style={styles.applicationForm}>
                <Input
                  label="Cover Note (Optional)"
                  value={applicationNote}
                  onChangeText={setApplicationNote}
                  multiline
                  placeholder="Tell the employer why you're interested in this position..."
                />
                
                <View style={styles.applicationActions}>
                  <Button
                    title="Submit Application"
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
                title="Apply Now"
                onPress={handleApply}
                style={styles.applyButton}
              />
            )}
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
});