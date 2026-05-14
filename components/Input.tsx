import React from 'react';
import { TextInput as PaperInput, TextInputProps as PaperInputProps } from 'react-native-paper';
import { StyleSheet, ViewStyle, View, Text } from 'react-native';
import { colors, radius, typography, spacing } from '../constants/theme';

/**
 * Modern Input component with refined styling
 * Supports icons and error states with a premium feel
 */
interface InputProps extends Omit<PaperInputProps, 'left' | 'right'> {
  errorText?: string;
  leftIcon?: string;
  rightIcon?: string;
  onRightIconPress?: () => void;
  right?: React.ReactNode;
}

export default function Input({ 
  error, 
  errorText, 
  style, 
  leftIcon, 
  rightIcon, 
  onRightIconPress,
  right,
  ...props 
}: InputProps) {
  return (
    <View style={styles.container}>
      <PaperInput
        mode="outlined"
        outlineColor={error ? colors.error : colors.border}
        activeOutlineColor={error ? colors.error : colors.primary}
        outlineStyle={styles.outline}
        style={[styles.input, style as ViewStyle]}
        contentStyle={styles.content}
        placeholderTextColor={colors.placeholder}
        left={leftIcon ? <PaperInput.Icon icon={leftIcon} color={colors.textTertiary} size={20} /> : undefined}
        right={right || (rightIcon ? <PaperInput.Icon icon={rightIcon} color={colors.textTertiary} size={20} onPress={onRightIconPress} /> : undefined)}
        theme={{
          colors: {
            background: colors.surface,
            onSurfaceVariant: colors.textSecondary,
            primary: colors.primary,
          },
        }}
        {...props}
      />
      {errorText ? <Text style={styles.errorText}>{errorText}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: spacing.xs,
  },
  input: {
    backgroundColor: colors.surface,
  },
  outline: {
    borderRadius: radius.md,
    borderWidth: 1.2,
  },
  content: {
    ...typography.body,
    paddingHorizontal: spacing.sm,
    height: 52,
  },
  errorText: {
    ...typography.caption,
    color: colors.error,
    marginTop: 4,
    marginLeft: 4,
  },
});
