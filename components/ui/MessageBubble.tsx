import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '@/config/theme';
import { Avatar } from './Avatar';

interface MessageBubbleProps {
  message: {
    id: string;
    body: string;
    created_at: string;
    sender_user_id: string;
  };
  senderName?: string;
  senderAvatar?: string;
  isOwnMessage: boolean;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  senderName,
  senderAvatar,
  isOwnMessage,
}) => {
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  return (
    <View style={[styles.container, isOwnMessage && styles.ownMessageContainer]}>
      {!isOwnMessage && (
        <Avatar src={senderAvatar} name={senderName} size="sm" />
      )}
      
      <View style={[
        styles.bubble,
        isOwnMessage ? styles.ownBubble : styles.otherBubble,
      ]}>
        {!isOwnMessage && senderName && (
          <Text style={styles.senderName}>{senderName}</Text>
        )}
        <Text style={[
          styles.messageText,
          isOwnMessage ? styles.ownMessageText : styles.otherMessageText,
        ]}>
          {message.body}
        </Text>
        <Text style={[
          styles.timestamp,
          isOwnMessage ? styles.ownTimestamp : styles.otherTimestamp,
        ]}>
          {formatTime(message.created_at)}
        </Text>
      </View>
      
      {isOwnMessage && (
        <Avatar src={senderAvatar} name={senderName} size="sm" />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginBottom: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
  },
  ownMessageContainer: {
    justifyContent: 'flex-end',
  },
  bubble: {
    maxWidth: '75%',
    marginHorizontal: theme.spacing.sm,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
  },
  ownBubble: {
    backgroundColor: theme.colors.primary,
    borderBottomRightRadius: theme.borderRadius.sm,
  },
  otherBubble: {
    backgroundColor: theme.colors.surface,
    borderBottomLeftRadius: theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  senderName: {
    fontSize: theme.fontSize.xs,
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
    color: theme.colors.background,
  },
  otherMessageText: {
    color: theme.colors.text,
  },
  timestamp: {
    fontSize: theme.fontSize.xs,
    alignSelf: 'flex-end',
  },
  ownTimestamp: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  otherTimestamp: {
    color: theme.colors.textLight,
  },
});