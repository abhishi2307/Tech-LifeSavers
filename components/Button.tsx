import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  ActivityIndicator,
} from 'react-native';
import { useAppTheme } from '../hooks/useAppTheme';
import { radius, spacing } from '../constants/theme';

interface ButtonProps {
  children: React.ReactNode;
  onPress?: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'outline' | 'ghost' | 'tinted';
  /** Legacy react-native-paper compat — maps to variant */
  mode?: 'contained' | 'outlined' | 'text';
  fullWidth?: boolean;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle | ViewStyle[] | any;
  size?: 'sm' | 'md' | 'lg';
  /** Unused — kept for call-site compat */
  icon?: string;
  textColor?: string;
}

const MODE_TO_VARIANT: Record<string, ButtonProps['variant']> = {
  contained: 'primary',
  outlined: 'outline',
  text: 'ghost',
};

const SIZE_H   = { sm: 38, md: 48, lg: 54 };
const SIZE_FONT = { sm: 15, md: 17, lg: 17 };

export default function Button({
  children,
  onPress,
  variant,
  mode,
  fullWidth = true,
  disabled = false,
  loading = false,
  style,
  size = 'md',
  icon,
  textColor,
}: ButtonProps) {
  const { colors: c } = useAppTheme();

  const VARIANT_CFG = {
    primary:   { bg: c.primary,        text: '#fff',              border: 'transparent' },
    secondary: { bg: c.fillTertiary,   text: c.text,              border: 'transparent' },
    danger:    { bg: c.error,          text: '#fff',              border: 'transparent' },
    success:   { bg: c.success,        text: '#fff',              border: 'transparent' },
    outline:   { bg: 'transparent',    text: c.primary,           border: c.primary },
    ghost:     { bg: 'transparent',    text: c.primary,           border: 'transparent' },
    tinted:    { bg: c.primary + '14', text: c.primary,           border: 'transparent' },
  };

  const resolvedVariant: ButtonProps['variant'] =
    variant ?? (mode ? MODE_TO_VARIANT[mode] : 'primary') ?? 'primary';
  const cfg = VARIANT_CFG[resolvedVariant!];
  const h = SIZE_H[size];
  const fs = SIZE_FONT[size];
  const isDisabled = disabled || loading;
  const labelColor = textColor ?? cfg.text;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.75}
      style={[
        styles.base,
        {
          backgroundColor: cfg.bg,
          borderColor: cfg.border,
          borderWidth: resolvedVariant === 'outline' ? 1.5 : 0,
          height: h,
          opacity: isDisabled ? 0.5 : 1,
          alignSelf: fullWidth ? 'stretch' : 'flex-start',
          paddingHorizontal: fullWidth ? spacing.md : spacing.lg,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={labelColor} />
      ) : (
        <Text style={[styles.label, { color: labelColor, fontSize: fs }]}>
          {children}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: spacing.xs,
  },
  label: {
    fontWeight: '600',
    letterSpacing: -0.3,
    textAlign: 'center',
  },
});

