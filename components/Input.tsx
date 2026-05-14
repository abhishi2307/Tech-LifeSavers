import React from 'react';
import { TextInput as PaperInput, TextInputProps as PaperInputProps } from 'react-native-paper';
import { StyleSheet, ViewStyle, View, Text } from 'react-native';
import { useAppTheme } from '../hooks/useAppTheme';
import { radius, spacing } from '../constants/theme';

interface InputProps extends Omit<PaperInputProps, 'left' | 'right'> {
  errorText?: string;
  leftIcon?: string;
  right?: React.ReactNode;
}

export default function Input({
  error,
  errorText,
  style,
  leftIcon,
  right,
  ...props
}: InputProps) {
  const { colors: c } = useAppTheme();

  return (
    <View style={styles.container}>
      <PaperInput
        mode="outlined"
        outlineColor={error ? c.error : c.border}
        activeOutlineColor={error ? c.error : c.primary}
        outlineStyle={styles.outline}
        style={[styles.input, { backgroundColor: c.surface }, style as ViewStyle]}
        contentStyle={styles.content}
        textColor={c.text}
        placeholderTextColor={c.textTertiary}
        left={
          leftIcon ? (
            <PaperInput.Icon icon={leftIcon} color={c.textTertiary} size={20} />
          ) : undefined
        }
        right={right}
        theme={{
          colors: {
            background: c.surface,
            onSurfaceVariant: c.textSecondary,
            primary: c.primary,
            error: c.error,
          },
          roundness: radius.md,
        }}
        {...props}
      />
      {errorText ? <Text style={[styles.errorText, { color: c.error }]}>{errorText}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: spacing.sm,
  },
  input: {
    // backgroundColor set dynamically
  },
  outline: {
    borderRadius: radius.md,
    borderWidth: 1,
  },
  content: {
    fontSize: 17,
    letterSpacing: -0.41,
    height: 52,
  },
  errorText: {
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
    fontWeight: '400',
  },
});

