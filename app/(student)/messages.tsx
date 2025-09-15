import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { theme } from '@/config/theme';
import { Card } from '@/components/ui/Card';
import { useThreads } from '@/lib/hooks/useMessages';

export default function MessagesScreen() {
  const { threads, loading, error } = useThreads();
  const router = useRouter();

  const renderThread = ({ item }: { item: any }) => {
    const lastMessage = item.messages[item.messages.length - 1];

    return (
      <TouchableOpacity onPress={() => router.push(`/(student)/messages/${item.id}`)}>
        <Card style={styles.threadCard}>
          <View style={styles.threadHeader}>
            <Text style={styles.jobTitle}>{item.jobs?.title}</Text>
            <Text style={styles.companyName}>{item.jobs?.companies?.name}</Text>
          </View>

          {lastMessage && (
            <View style={styles.lastMessage}>
              <Text style={styles.messagePreview} numberOfLines={2}>
                {lastMessage.body}
              </Text>
              <Text style={styles.messageTime}>
                {new Date(lastMessage.created_at).toLocaleDateString()}
              </Text>
            </View>
          )}
        </Card>
      </TouchableOpacity>
    );
  };

  const renderEmpty = () => (
    <View style={styles.empty}>
      <Text style={styles.emptyTitle}>No Messages Yet</Text>
      <Text style={styles.emptyText}>
        When you contact employers about job opportunities, your conversations will appear here.
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
      <View style={styles.header}>
        <Text style={styles.title}>Messages</Text>
        <Text style={styles.subtitle}>
          {threads.length} conversation{threads.length !== 1 ? 's' : ''}
        </Text>
      </View>

      <FlatList
        data={threads}
        keyExtractor={(item) => item.id}
        renderItem={renderThread}
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
  list: {
    padding: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    flexGrow: 1,
  },
  threadCard: {
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  threadHeader: {
    marginBottom: theme.spacing.sm,
  },
  jobTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  companyName: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
  },
  lastMessage: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingTop: theme.spacing.sm,
  },
  messagePreview: {
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
    lineHeight: 20,
    marginBottom: theme.spacing.xs,
  },
  messageTime: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: theme.spacing.xxl,
  },
  emptyTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  emptyText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
});