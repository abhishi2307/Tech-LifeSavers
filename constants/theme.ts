import { MD3LightTheme } from 'react-native-paper';

/**
 * Healthcare-themed color palette
 * Dark blue primary colors with accessibility-friendly contrast
 */
export const colors = {
  primary: '#1E88E5', // Medical blue
  primaryDark: '#1565C0',
  secondary: '#42A5F5',
  accent: '#00BCD4', // Cyan accent
  background: '#F5F7FA',
  surface: '#FFFFFF',
  error: '#E53935',
  success: '#43A047',
  warning: '#FB8C00',
  text: '#212121',
  textSecondary: '#757575',
  border: '#E0E0E0',
  card: '#FFFFFF',
  disabled: '#BDBDBD',
};

/**
 * React Native Paper theme configuration
 * Dark blue healthcare palette with modern rounded UI
 */
export const theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: colors.primary,
    primaryContainer: colors.primaryDark,
    secondary: colors.secondary,
    tertiary: colors.accent,
    background: colors.background,
    surface: colors.surface,
    error: colors.error,
    onPrimary: '#FFFFFF',
    onPrimaryContainer: '#FFFFFF',
    onSecondary: '#FFFFFF',
    onSurface: colors.text,
    onBackground: colors.text,
    onError: '#FFFFFF',
  },
  roundness: 16, // Modern rounded corners
  fonts: {
    ...MD3LightTheme.fonts,
  },
};

export default theme;
