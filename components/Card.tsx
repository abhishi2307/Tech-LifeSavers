import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { colors, radius, shadows } from '../constants/theme';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
  variant?: 'elevated' | 'flat' | 'outline' | 'grouped';
}

export default function Card({ children, style, variant = 'elevated' }: CardProps) {
  const variantStyle = () => {
    switch (variant) {
      case 'flat':
        return styles.flat;
      case 'outline':
        return styles.outline;
      case 'grouped':
        return styles.grouped;
      default:
        return styles.elevated;
    }
  };

  return (
    <View style={[styles.base, variantStyle(), style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.xl,
    padding: 16,
    overflow: 'hidden',
  },
  elevated: {
    backgroundColor: colors.surface,
    ...shadows.card,
  },
  flat: {
    backgroundColor: colors.surfaceVariant,
  },
  outline: {
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  grouped: {
    backgroundColor: colors.surface,
    ...shadows.sm,
  },
});
