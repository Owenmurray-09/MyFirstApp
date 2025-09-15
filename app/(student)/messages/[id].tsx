import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { theme } from '@/config/theme';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useMessages, useSendMessage } from '@/lib/hooks/useMessages';
import { useAuth } from '@/lib/hooks/useAuth';
import { MaterialIcons } from '@expo/vector-icons';

export default function MessageThreadScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { profile } = useAuth();
  const { messages, loading, error } = useMessages(id as string);
  const { sendMessage, loading: sending } = useSendMessage();

  const [newMessage, setNewMessage] = useState('');
  const flatListRef = useRef<FlatList>(null);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages.length > 0 && flatListRef.current) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages.length]);

  const handleSend = async () => {
    if (!newMessage.trim() || !id) return;

    try {
      await sendMessage(id as string, newMessage.trim());
      setNewMessage('');
    } catch (error: any) {
      console.error('Failed to send message:', error);
    }
  };

  const renderMessage = ({ item }: { item: any }) => {
    const isOwn = item.sender_user_id === profile?.id;

    return (
      <View style={[styles.messageContainer, isOwn && styles.ownMessageContainer]}>
        <View style={[styles.messageBubble, isOwn && styles.ownMessageBubble]}>
          {!isOwn && (
            <Text style={styles.senderName}>
              {item.sender_profile?.full_name || 'Unknown'}
            </Text>
          )}
          <Text style={[styles.messageText, isOwn && styles.ownMessageText]}>
            {item.body}
          </Text>
          <Text style={[styles.messageTime, isOwn && styles.ownMessageTime]}>
            {new Date(item.created_at).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
        </View>
      </View>
    );
  };

  const renderEmpty = () => (
    <View style={styles.empty}>
      <Text style={styles.emptyText}>No messages yet. Start the conversation!</Text>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loading}>
          <Text style={styles.loadingText}>Loading messages...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.error}>
          <Text style={styles.errorText}>Error loading messages: {error}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={90}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Message Thread</Text>
          </View>
        </View>

        {/* Messages */}
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          contentContainerStyle={styles.messagesList}
          ListEmptyComponent={renderEmpty}
          showsVerticalScrollIndicator={false}
        />

        {/* Message Input */}
        <View style={styles.inputContainer}>
          <View style={styles.inputWrapper}>
            <Input
              value={newMessage}
              onChangeText={setNewMessage}
              placeholder="Type a message..."
              multiline
              maxLength={500}
              style={styles.messageInput}
            />
            <Button
              title="Send"
              onPress={handleSend}
              disabled={!newMessage.trim() || sending}
              loading={sending}
              style={styles.sendButton}
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  backButton: {
    padding: theme.spacing.sm,
    marginRight: theme.spacing.sm,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
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
  error: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  errorText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.danger,
    textAlign: 'center',
  },
  messagesList: {
    padding: theme.spacing.md,
    flexGrow: 1,
  },
  messageContainer: {
    marginBottom: theme.spacing.md,
    alignItems: 'flex-start',
  },
  ownMessageContainer: {
    alignItems: 'flex-end',
  },
  messageBubble: {
    backgroundColor: theme.colors.border,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    maxWidth: '80%',
  },
  ownMessageBubble: {
    backgroundColor: theme.colors.primary,
  },
  senderName: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  messageText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
    lineHeight: 20,
    marginBottom: theme.spacing.xs,
  },
  ownMessageText: {
    color: theme.colors.white,
  },
  messageTime: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
  },
  ownMessageTime: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  inputContainer: {
    padding: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: theme.spacing.sm,
  },
  messageInput: {
    flex: 1,
    maxHeight: 100,
  },
  sendButton: {
    minWidth: 80,
  },
});