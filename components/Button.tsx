import React from 'react';
import { Button as PaperButton, ButtonProps as PaperButtonProps } from 'react-native-paper';
import { StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { colors, radius, spacing } from '../constants/theme';

/**
 * Modern Button component with centered text and zero elevation
 */
interface ButtonProps extends Omit<PaperButtonProps, 'children'> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'outline' | 'ghost';
  fullWidth?: boolean;
}

export default function Button({ 
  variant = 'primary', 
  style, 
  contentStyle, 
  labelStyle, 
  fullWidth = true,
  children,
  ...props 
}: ButtonProps) {
  
  const getColors = () => {
    switch (variant) {
      case 'danger':
        return { bg: colors.error, text: '#FFFFFF', mode: 'contained' as const };
      case 'success':
        return { bg: colors.success, text: '#FFFFFF', mode: 'contained' as const };
      case 'secondary':
        return { bg: colors.surfaceVariant, text: colors.text, mode: 'contained' as const };
      case 'outline':
        return { bg: 'transparent', text: colors.primary, mode: 'outlined' as const };
      case 'ghost':
        return { bg: 'transparent', text: colors.textSecondary, mode: 'text' as const };
      default:
        return { bg: colors.primary, text: '#FFFFFF', mode: 'contained' as const };
    }
  };

  const config = getColors();

  return (
    <PaperButton
      mode={config.mode}
      buttonColor={config.bg}
      textColor={config.text}
      elevation={0} // Strictly no elevation
      style={[
        styles.button, 
        !fullWidth && styles.wrap,
        variant === 'outline' && styles.outlined,
        style as ViewStyle
      ]}
      contentStyle={[styles.content, contentStyle as ViewStyle]}
      labelStyle={[styles.label, labelStyle as TextStyle]}
      {...props}
    >
      {children}
    </PaperButton>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: radius.md,
    marginVertical: spacing.xs,
  },
  wrap: {
    alignSelf: 'flex-start',
  },
  outlined: {
    borderColor: colors.border,
    borderWidth: 1.5,
  },
  content: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center', // Center text
    paddingHorizontal: spacing.md,
  },
  label: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.2,
    textAlign: 'center', // Center text
  },
});
