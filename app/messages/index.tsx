import React, { useState } from 'react';
import { View, StyleSheet, FlatList, Text, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { theme } from '@/config/theme';
import { Card } from '@/components/ui/Card';
import { Tag } from '@/components/ui/Tag';
import { useAuth } from '@/lib/hooks/useAuth';
import { useThreads } from '@/lib/hooks/useThreads';

function ThreadItem({ thread, currentUserId, onPress }: {
  thread: any;
  currentUserId: string;
  onPress: (threadId: string) => void;
}) {
  const job = thread.applications?.jobs;
  const student = thread.applications?.students;
  const company = job?.companies;
  const lastMessage = thread.last_message;
  const isUnread = thread.last_message_at && thread.last_message?.sender_user_id !== currentUserId;

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 60) {
      return `${minutes}m ago`;
    } else if (hours < 24) {
      return `${hours}h ago`;
    } else if (days < 7) {
      return `${days}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  return (
    <TouchableOpacity onPress={() => onPress(thread.id)}>
      <Card style={[styles.threadItem, isUnread && styles.unreadThread]}>
        <View style={styles.threadHeader}>
          <Text style={styles.jobTitle} numberOfLines={1}>
            {job?.title || 'Job Application'}
          </Text>
          <Text style={styles.timestamp}>
            {lastMessage ? formatTime(lastMessage.created_at) : 'No messages'}
          </Text>
        </View>
        
        <View style={styles.threadMeta}>
          <Text style={styles.companyName}>{company?.name}</Text>
          <Text style={styles.studentName}>• {student?.full_name}</Text>
        </View>
        
        {lastMessage && (
          <View style={styles.lastMessage}>
            <Text style={styles.messageSender}>
              {lastMessage.sender?.full_name || 'Unknown'}:
            </Text>
            <Text style={styles.messagePreview} numberOfLines={2}>
              {lastMessage.content}
            </Text>
          </View>
        )}
        
        <View style={styles.threadFooter}>
          <Tag label={`Application #${thread.application_id}`} variant="outline" />
          {isUnread && <View style={styles.unreadIndicator} />}
        </View>
      </Card>
    </TouchableOpacity>
  );
}

export default function MessagesScreen() {
  const { profile } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  
  const { threads, loading, refresh } = useThreads({
    role: profile?.role as 'student' | 'employer'
  });

  const handleThreadPress = (threadId: string) => {
    router.push(`/messages/${threadId}`);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  const renderThread = ({ item }: { item: any }) => (
    <ThreadItem
      thread={item}
      currentUserId={profile?.id || ''}
      onPress={handleThreadPress}
    />
  );

  const renderEmpty = () => (
    <View style={styles.empty}>
      <Text style={styles.emptyTitle}>No conversations yet</Text>
      <Text style={styles.emptyText}>
        {profile?.role === 'student' 
          ? 'Apply to jobs to start conversations with employers'
          : 'Conversations with applicants will appear here'
        }
      </Text>
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

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Messages</Text>
        <Text style={styles.subtitle}>{threads.length} conversations</Text>
      </View>

      <FlatList
        data={threads}
        keyExtractor={(item) => item.id}
        renderItem={renderThread}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        contentContainerStyle={styles.list}
        ListEmptyComponent={renderEmpty}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    padding: theme.spacing.lg,
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
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: theme.fontSize.lg,
    color: theme.colors.textSecondary,
  },
  list: {
    padding: theme.spacing.lg,
    paddingTop: 0,
    flexGrow: 1,
  },
  threadItem: {
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  unreadThread: {
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.primary,
  },
  threadHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.sm,
  },
  jobTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    flex: 1,
    marginRight: theme.spacing.md,
  },
  timestamp: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  threadMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  companyName: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
  },
  studentName: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
    marginLeft: theme.spacing.sm,
  },
  lastMessage: {
    marginBottom: theme.spacing.md,
  },
  messageSender: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  messagePreview: {
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
    lineHeight: 20,
  },
  threadFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  unreadIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.primary,
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: theme.spacing.xxl,
  },
  emptyTitle: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  emptyText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
});