import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, FlatList, KeyboardAvoidingView, Platform, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { theme } from '@/config/theme';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Tag } from '@/components/ui/Tag';
import { useAuth } from '@/lib/hooks/useAuth';
import { useThread, useSendMessage } from '@/lib/hooks/useThreads';
import { RecommendationModal } from '@/components/ui/RecommendationModal';

function MessageBubble({ message, isOwnMessage }: {
  message: any;
  isOwnMessage: boolean;
}) {
  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <View style={[
      styles.messageBubble,
      isOwnMessage ? styles.ownMessage : styles.otherMessage
    ]}>
      {!isOwnMessage && (
        <Text style={styles.senderName}>
          {message.sender?.full_name || 'Unknown'}
        </Text>
      )}
      <Text style={[
        styles.messageText,
        isOwnMessage ? styles.ownMessageText : styles.otherMessageText
      ]}>
        {message.content}
      </Text>
      <Text style={[
        styles.messageTime,
        isOwnMessage ? styles.ownMessageTime : styles.otherMessageTime
      ]}>
        {formatTime(message.created_at)}
      </Text>
    </View>
  );
}

function ThreadHeader({ thread, userRole, onRequestRecommendation }: {
  thread: any;
  userRole: 'student' | 'employer';
  onRequestRecommendation: () => void;
}) {
  const job = thread?.applications?.jobs;
  const company = job?.companies;
  const student = thread?.applications?.students;

  return (
    <Card style={styles.threadHeader}>
      <View style={styles.headerContent}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        
        <View style={styles.threadInfo}>
          <Text style={styles.jobTitle}>
            {job?.title || 'Job Application'}
          </Text>
          <View style={styles.threadMeta}>
            <Text style={styles.metaText}>
              {company?.name}
            </Text>
            {userRole === 'employer' && (
              <Text style={styles.metaText}>
                • {student?.full_name}
              </Text>
            )}
          </View>
          <View style={styles.threadActions}>
            <Tag 
              label={`Application #${thread?.application_id}`} 
              variant="outline" 
            />
            {userRole === 'student' && (
              <TouchableOpacity
                style={styles.recommendationButton}
                onPress={onRequestRecommendation}
              >
                <Text style={styles.recommendationButtonText}>
                  Ask for Recommendation
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Card>
  );
}

export default function MessageThreadScreen() {
  const { threadId } = useLocalSearchParams<{ threadId: string }>();
  const { profile } = useAuth();
  const [newMessage, setNewMessage] = useState('');
  const [showRecommendationModal, setShowRecommendationModal] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const { thread, messages, loading } = useThread(threadId as string);
  const { sendMessage, loading: sendingMessage } = useSendMessage();

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages.length > 0 && flatListRef.current) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages.length]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !threadId) return;

    try {
      await sendMessage(threadId, newMessage.trim());
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleRequestRecommendation = () => {
    setShowRecommendationModal(true);
  };

  const renderMessage = ({ item }: { item: any }) => (
    <MessageBubble
      message={item}
      isOwnMessage={item.sender_user_id === profile?.id}
    />
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loading}>
          <Text style={styles.loadingText}>Loading conversation...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!thread) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loading}>
          <Text style={styles.loadingText}>Conversation not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ThreadHeader 
        thread={thread} 
        userRole={profile?.role as 'student' | 'employer'} 
        onRequestRecommendation={handleRequestRecommendation}
      />
      
      <KeyboardAvoidingView 
        style={styles.keyboardView} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          style={styles.messagesList}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
        />
        
        <View style={styles.inputContainer}>
          <Input
            value={newMessage}
            onChangeText={setNewMessage}
            placeholder="Type a message..."
            multiline
            style={styles.messageInput}
            onSubmitEditing={handleSendMessage}
          />
          <Button
            title="Send"
            onPress={handleSendMessage}
            loading={sendingMessage}
            disabled={!newMessage.trim() || sendingMessage}
            size="sm"
            style={styles.sendButton}
          />
        </View>
      </KeyboardAvoidingView>

      <RecommendationModal
        visible={showRecommendationModal}
        onClose={() => setShowRecommendationModal(false)}
        onRecommendationCreated={() => {
          setShowRecommendationModal(false);
          // Could add success feedback here
        }}
        studentId={thread?.applications?.students?.id || profile?.id || ''}
        studentName={thread?.applications?.students?.full_name || 'Student'}
        jobId={thread?.applications?.jobs?.id}
        jobTitle={thread?.applications?.jobs?.title}
        companyName={thread?.applications?.jobs?.companies?.name}
        employerName={profile?.name || undefined}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
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
  threadHeader: {
    margin: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    padding: theme.spacing.lg,
  },
  headerContent: {
    gap: theme.spacing.md,
  },
  backButton: {
    alignSelf: 'flex-start',
  },
  backButtonText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.primary,
    fontWeight: theme.fontWeight.medium,
  },
  threadInfo: {
    gap: theme.spacing.sm,
  },
  jobTitle: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
  },
  threadMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  metaText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
  },
  threadActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: theme.spacing.sm,
  },
  recommendationButton: {
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    backgroundColor: theme.colors.primary,
    borderRadius: 8,
    marginLeft: theme.spacing.sm,
  },
  recommendationButtonText: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
    color: 'white',
  },
  keyboardView: {
    flex: 1,
  },
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    padding: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    flexGrow: 1,
  },
  messageBubble: {
    marginVertical: theme.spacing.xs,
    padding: theme.spacing.md,
    borderRadius: 16,
    maxWidth: '80%',
  },
  ownMessage: {
    alignSelf: 'flex-end',
    backgroundColor: theme.colors.primary,
    borderBottomRightRadius: 4,
  },
  otherMessage: {
    alignSelf: 'flex-start',
    backgroundColor: theme.colors.surface || '#f0f0f0',
    borderBottomLeftRadius: 4,
  },
  senderName: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  messageText: {
    fontSize: theme.fontSize.md,
    lineHeight: 20,
    marginBottom: theme.spacing.xs,
  },
  ownMessageText: {
    color: 'white',
  },
  otherMessageText: {
    color: theme.colors.text,
  },
  messageTime: {
    fontSize: theme.fontSize.xs,
  },
  ownMessageTime: {
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'right',
  },
  otherMessageTime: {
    color: theme.colors.textSecondary,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: theme.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    gap: theme.spacing.md,
    alignItems: 'flex-end',
  },
  messageInput: {
    flex: 1,
    marginBottom: 0,
    maxHeight: 100,
  },
  sendButton: {
    alignSelf: 'flex-end',
  },
});