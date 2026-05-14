import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { colors, radius, shadows } from '../constants/theme';

/**
 * Modern Card component with premium flat aesthetic
 * Avoids native elevation for a more controlled, consistent look
 */
interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  variant?: 'elevated' | 'flat' | 'outline';
}

export default function Card({ 
  children, 
  style, 
  variant = 'elevated' 
}: CardProps) {
  
  const getVariantStyle = () => {
    switch (variant) {
      case 'flat':
        return { backgroundColor: colors.surfaceVariant };
      case 'outline':
        return { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.border };
      default:
        return { ...shadows.sm, backgroundColor: colors.surface };
    }
  };

  return (
    <View style={[styles.card, getVariantStyle(), style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    padding: 16,
    overflow: 'hidden',
  },
});
