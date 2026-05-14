import { Button as PaperButton, ButtonProps as PaperButtonProps } from 'react-native-paper';
import { StyleSheet } from 'react-native';
import { colors } from '../constants/theme';

/**
 * Custom Button component with healthcare theme
 * Provides consistent styling across the app
 */
interface ButtonProps extends PaperButtonProps {
  variant?: 'primary' | 'secondary' | 'danger' | 'outline';
}

export default function Button({ variant = 'primary', style, ...props }: ButtonProps) {
  const getButtonColor = () => {
    switch (variant) {
      case 'secondary':
        return colors.secondary;
      case 'danger':
        return colors.error;
      case 'outline':
        return 'transparent';
      default:
        return colors.primary;
    }
  };

  const getTextColor = () => {
    return variant === 'outline' ? colors.primary : '#FFFFFF';
  };

  const getBorderColor = () => {
    return variant === 'outline' ? colors.primary : 'transparent';
  };

  return (
    <PaperButton
      mode={variant === 'outline' ? 'outlined' : 'contained'}
      buttonColor={getButtonColor()}
      textColor={getTextColor()}
      style={[styles.button, style]}
      contentStyle={styles.content}
      labelStyle={styles.label}
      {...props}
    />
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 12,
    elevation: 2,
  },
  content: {
    paddingVertical: 8,
    paddingHorizontal: 24,
    height: 52,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
});
