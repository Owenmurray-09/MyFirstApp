import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { theme } from '@/config/theme';
import { Card } from './Card';
import { Tag } from './Tag';

interface JobCardProps {
  id: string;
  title: string;
  companyName: string;
  location?: string;
  tags: string[];
  isPaid: boolean;
  stipendAmount?: number | null;
  image?: string;
  onPress: (id: string) => void;
}

export const JobCard: React.FC<JobCardProps> = ({
  id,
  title,
  companyName,
  location,
  tags,
  isPaid,
  stipendAmount,
  image,
  onPress,
}) => {
  const formatStipend = (amount?: number | null) => {
    if (!amount) return null;
    return `$${amount.toLocaleString()}`;
  };

  return (
    <TouchableOpacity onPress={() => onPress(id)} style={styles.container}>
      <Card style={styles.card}>
        {image && (
          <Image source={{ uri: image }} style={styles.image} resizeMode="cover" />
        )}
        
        <View style={styles.content}>
          <Text style={styles.title} numberOfLines={2}>{title}</Text>
          <Text style={styles.company}>{companyName}</Text>
          
          {location && (
            <Text style={styles.location}>📍 {location}</Text>
          )}
          
          <View style={styles.paymentInfo}>
            <Tag 
              label={isPaid ? (stipendAmount ? formatStipend(stipendAmount) || 'Paid' : 'Paid') : 'Unpaid'} 
              variant={isPaid ? 'success' : 'warning'}
            />
          </View>
          
          <View style={styles.tags}>
            {tags.slice(0, 3).map((tag, index) => (
              <Tag key={index} label={tag} variant="default" />
            ))}
            {tags.length > 3 && (
              <Tag label={`+${tags.length - 3}`} variant="default" />
            )}
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: theme.spacing.md,
  },
  card: {
    padding: 0,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: 160,
  },
  content: {
    padding: theme.spacing.md,
  },
  title: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  company: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.sm,
  },
  location: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.md,
  },
  paymentInfo: {
    marginBottom: theme.spacing.md,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: theme.spacing.sm,
  },
});