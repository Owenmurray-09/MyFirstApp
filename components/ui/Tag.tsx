import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, View } from 'react-native';
import { theme } from '@/config/theme';

interface TagProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  variant?: 'default' | 'success' | 'warning' | 'primary';
  style?: ViewStyle;
}

export const Tag: React.FC<TagProps> = ({
  label,
  selected = false,
  onPress,
  variant = 'default',
  style,
}) => {
  // TEMP_TRACER: remove later - fixed invalid component definition for web
  const Component = onPress ? TouchableOpacity : View;

  const tagStyle = [
    styles.tag,
    styles[variant],
    selected && styles.selected,
    selected && styles[`${variant}Selected`],
    style,
  ];

  const textStyle = [
    styles.text,
    styles[`${variant}Text`],
    selected && styles.selectedText,
    selected && styles[`${variant}SelectedText`],
  ];

  return (
    <Component onPress={onPress} style={tagStyle}>
      <Text style={textStyle}>{label}</Text>
    </Component>
  );
};

const styles = StyleSheet.create({
  tag: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.xl,
    borderWidth: 1,
    marginRight: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  default: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
  },
  success: {
    backgroundColor: '#ECFDF5',
    borderColor: theme.colors.success,
  },
  warning: {
    backgroundColor: '#FFFBEB',
    borderColor: theme.colors.warning,
  },
  primary: {
    backgroundColor: theme.colors.primaryLight,
    borderColor: theme.colors.primaryLight,
  },
  selected: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  defaultSelected: {
    backgroundColor: theme.colors.primary,
  },
  successSelected: {
    backgroundColor: theme.colors.success,
  },
  warningSelected: {
    backgroundColor: theme.colors.warning,
  },
  primarySelected: {
    backgroundColor: theme.colors.primaryDark,
  },
  text: {
    fontSize: theme.fontSize.sm,
    fontFamily: theme.fontFamily.bodyMedium,
  },
  defaultText: {
    color: theme.colors.text,
  },
  successText: {
    color: theme.colors.success,
  },
  warningText: {
    color: theme.colors.warning,
  },
  primaryText: {
    color: theme.colors.textOnPrimary,
  },
  selectedText: {
    color: theme.colors.textOnPrimary,
  },
  defaultSelectedText: {
    color: theme.colors.textOnPrimary,
  },
  successSelectedText: {
    color: theme.colors.textOnPrimary,
  },
  warningSelectedText: {
    color: theme.colors.textOnPrimary,
  },
  primarySelectedText: {
    color: theme.colors.textOnPrimary,
  },
});