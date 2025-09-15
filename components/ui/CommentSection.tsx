import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, FlatList } from 'react-native';
import { theme } from '@/config/theme';
import { Avatar } from './Avatar';
import { Input } from './Input';
import { Button } from './Button';

interface Comment {
  id: string;
  author_name: string;
  author_avatar?: string;
  body: string;
  created_at: string;
}

interface CommentSectionProps {
  comments: Comment[];
  onAddComment: (body: string) => Promise<void>;
  loading?: boolean;
}

export const CommentSection: React.FC<CommentSectionProps> = ({
  comments,
  onAddComment,
  loading = false,
}) => {
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!newComment.trim()) return;
    
    setSubmitting(true);
    try {
      await onAddComment(newComment.trim());
      setNewComment('');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const renderComment = ({ item }: { item: Comment }) => (
    <View style={styles.commentItem}>
      <Avatar src={item.author_avatar} name={item.author_name} size="sm" />
      <View style={styles.commentContent}>
        <View style={styles.commentHeader}>
          <Text style={styles.authorName}>{item.author_name}</Text>
          <Text style={styles.commentDate}>{formatDate(item.created_at)}</Text>
        </View>
        <Text style={styles.commentBody}>{item.body}</Text>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading comments...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Reviews & Comments</Text>
      
      <View style={styles.composer}>
        <Input
          placeholder="Share your experience working here..."
          value={newComment}
          onChangeText={setNewComment}
          multiline
          style={styles.commentInput}
        />
        <Button
          title="Post Comment"
          onPress={handleSubmit}
          disabled={!newComment.trim()}
          loading={submitting}
          size="sm"
        />
      </View>
      
      {comments.length === 0 ? (
        <Text style={styles.noComments}>No comments yet. Be the first to share your experience!</Text>
      ) : (
        <FlatList
          data={comments}
          keyExtractor={(item) => item.id}
          renderItem={renderComment}
          style={styles.commentsList}
          scrollEnabled={false}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: theme.spacing.md,
  },
  sectionTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  composer: {
    marginBottom: theme.spacing.lg,
  },
  commentInput: {
    marginBottom: theme.spacing.sm,
  },
  loadingText: {
    textAlign: 'center',
    color: theme.colors.textSecondary,
    padding: theme.spacing.xl,
  },
  noComments: {
    textAlign: 'center',
    color: theme.colors.textSecondary,
    fontStyle: 'italic',
    padding: theme.spacing.xl,
  },
  commentsList: {
    maxHeight: 400,
  },
  commentItem: {
    flexDirection: 'row',
    marginBottom: theme.spacing.md,
    paddingBottom: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  commentContent: {
    flex: 1,
    marginLeft: theme.spacing.md,
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  authorName: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.text,
  },
  commentDate: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  commentBody: {
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
    lineHeight: 20,
  },
});