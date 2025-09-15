import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Alert,
  Clipboard,
  Share,
} from 'react-native';
import { theme } from '@/config/theme';
import { Input } from './Input';
import { Button } from './Button';
import { Card } from './Card';
import { useCreateRecommendation, generateRecommendationTemplate } from '@/lib/hooks/useRecommendations';

interface RecommendationModalProps {
  visible: boolean;
  onClose: () => void;
  onRecommendationCreated?: () => void;
  studentId: string;
  studentName: string;
  jobId?: string;
  jobTitle?: string;
  companyName?: string;
  employerName?: string;
}

export function RecommendationModal({
  visible,
  onClose,
  onRecommendationCreated,
  studentId,
  studentName,
  jobId,
  jobTitle,
  companyName,
  employerName,
}: RecommendationModalProps) {
  const [content, setContent] = useState('');
  const [isEdited, setIsEdited] = useState(false);

  const { createRecommendation, loading } = useCreateRecommendation();

  // Generate template when modal opens
  React.useEffect(() => {
    if (visible && !isEdited) {
      const template = generateRecommendationTemplate(
        studentName,
        jobTitle,
        companyName,
        employerName
      );
      setContent(template);
    }
  }, [visible, studentName, jobTitle, companyName, employerName, isEdited]);

  const handleContentChange = (text: string) => {
    setContent(text);
    setIsEdited(true);
  };

  const handleSave = async () => {
    if (!content.trim()) {
      Alert.alert('Error', 'Please enter recommendation content');
      return;
    }

    try {
      await createRecommendation({
        student_id: studentId,
        job_id: jobId,
        content: content.trim(),
      });

      Alert.alert('Success', 'Recommendation saved successfully!');
      onRecommendationCreated?.();
      onClose();
    } catch (error) {
      console.error('Error saving recommendation:', error);
      Alert.alert('Error', 'Failed to save recommendation. Please try again.');
    }
  };

  const handleCopy = async () => {
    try {
      await Clipboard.setString(content);
      Alert.alert('Copied!', 'Recommendation copied to clipboard');
    } catch (error) {
      Alert.alert('Error', 'Failed to copy to clipboard');
    }
  };

  const handleShare = async () => {
    try {
      const result = await Share.share({
        message: content,
        title: `Recommendation for ${studentName}`,
      });

      if (result.action === Share.sharedAction) {
        Alert.alert('Shared!', 'Recommendation shared successfully');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to share recommendation');
    }
  };

  const handleClose = () => {
    // Reset state when closing
    setContent('');
    setIsEdited(false);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Write Recommendation</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <Card style={styles.infoCard}>
            <Text style={styles.infoTitle}>Recommendation for:</Text>
            <Text style={styles.studentName}>{studentName}</Text>
            {jobTitle && (
              <Text style={styles.jobInfo}>
                Position: {jobTitle}
                {companyName && ` at ${companyName}`}
              </Text>
            )}
          </Card>

          <Card style={styles.editorCard}>
            <View style={styles.editorHeader}>
              <Text style={styles.editorTitle}>Recommendation Letter</Text>
              <View style={styles.actionButtons}>
                <TouchableOpacity onPress={handleCopy} style={styles.actionButton}>
                  <Text style={styles.actionButtonText}>Copy</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleShare} style={styles.actionButton}>
                  <Text style={styles.actionButtonText}>Share</Text>
                </TouchableOpacity>
              </View>
            </View>
            
            <Input
              value={content}
              onChangeText={handleContentChange}
              multiline
              placeholder="Enter recommendation content..."
              style={styles.contentInput}
              numberOfLines={20}
            />
          </Card>
        </ScrollView>

        <View style={styles.footer}>
          <Button
            title="Save Recommendation"
            onPress={handleSave}
            loading={loading}
            disabled={loading || !content.trim()}
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  closeButton: {
    padding: theme.spacing.sm,
  },
  closeButtonText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.primary,
  },
  title: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
  },
  placeholder: {
    width: 60,
  },
  content: {
    flex: 1,
    padding: theme.spacing.lg,
  },
  infoCard: {
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  infoTitle: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  studentName: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  jobInfo: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
  },
  editorCard: {
    padding: theme.spacing.lg,
  },
  editorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  editorTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  actionButton: {
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: 8,
    backgroundColor: theme.colors.surface || '#f5f5f5',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  actionButtonText: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.primary,
  },
  contentInput: {
    minHeight: 300,
    maxHeight: 400,
    textAlignVertical: 'top',
    fontSize: theme.fontSize.md,
    lineHeight: 20,
  },
  footer: {
    padding: theme.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
});