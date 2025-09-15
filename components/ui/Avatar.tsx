import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { theme } from '@/config/theme';

interface AvatarProps {
  src?: string | null;
  name?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const Avatar: React.FC<AvatarProps> = ({ src, name, size = 'md' }) => {
  const getInitials = (name?: string) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const sizeStyle = styles[size];
  const textSizeStyle = styles[`${size}Text`];

  return (
    <View style={[styles.avatar, sizeStyle]}>
      {src ? (
        <Image source={{ uri: src }} style={[styles.image, sizeStyle]} />
      ) : (
        <Text style={[styles.initials, textSizeStyle]}>{getInitials(name)}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  avatar: {
    borderRadius: 999,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  image: {
    borderRadius: 999,
  },
  initials: {
    color: theme.colors.background,
    fontWeight: theme.fontWeight.bold,
  },
  sm: {
    width: 32,
    height: 32,
  },
  md: {
    width: 48,
    height: 48,
  },
  lg: {
    width: 64,
    height: 64,
  },
  smText: {
    fontSize: theme.fontSize.xs,
  },
  mdText: {
    fontSize: theme.fontSize.md,
  },
  lgText: {
    fontSize: theme.fontSize.lg,
  },
});