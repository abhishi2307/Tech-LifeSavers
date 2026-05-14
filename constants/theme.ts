/**
 * MediPulse AI Design System — Apple Human Interface Guidelines
 */

export const darkColors = {
  primary: '#0A84FF',
  secondary: '#5E5CE6',
  accent: '#FF9F0A',
  success: '#30D158',
  error: '#FF453A',
  warning: '#FF9F0A',
  info: '#64D2FF',

  background: '#000000',
  surface: '#1C1C1E',
  surfaceVariant: '#2C2C2E',
  surfaceElevated: '#3A3A3C',

  text: '#FFFFFF',
  textSecondary: '#8E8E93',
  textTertiary: '#636366',
  textQuaternary: '#48484A',

  fillPrimary: 'rgba(120,120,128,0.36)',
  fillSecondary: 'rgba(120,120,128,0.32)',
  fillTertiary: 'rgba(118,118,128,0.24)',

  border: '#38383A',
  borderLight: '#2C2C2E',
  separator: '#38383A',
  placeholder: '#48484A',

  disabled: '#3A3A3C',
  white: '#FFFFFF',

  rolePatient: '#0A84FF',
  roleFamily: '#30D158',
  roleCaregiver: '#FF9F0A',
  roleDoctor: '#5E5CE6',
  roleOrg: '#FF453A',
};

export const colors = {
  // Apple System Colors
  primary: '#007AFF',       // iOS System Blue
  secondary: '#5856D6',     // iOS Indigo
  accent: '#FF9500',        // iOS Orange

  // Semantic
  success: '#34C759',       // iOS Green
  error: '#FF3B30',         // iOS Red
  warning: '#FF9500',       // iOS Orange
  info: '#32ADE6',          // iOS Teal

  // Apple System Background
  background: '#F2F2F7',    // iOS Grouped Background
  surface: '#FFFFFF',       // iOS Primary Background
  surfaceVariant: '#EFEFF4',// iOS Secondary Grouped Background
  surfaceElevated: '#FFFFFF',

  // Apple Label Colors
  text: '#1C1C1E',          // iOS Label (primary)
  textSecondary: '#6D6D72', // iOS Secondary Label
  textTertiary: '#AEAEB2',  // iOS Tertiary Label
  textQuaternary: '#C7C7CC',// iOS Quaternary Label

  // Fills
  fillPrimary: 'rgba(120,120,128,0.2)',
  fillSecondary: 'rgba(120,120,128,0.16)',
  fillTertiary: 'rgba(118,118,128,0.12)',

  // Borders & Separators
  border: '#C6C6C8',        // iOS Separator
  borderLight: '#E5E5EA',   // iOS Opaque Separator
  separator: '#C6C6C8',
  placeholder: '#C7C7CC',

  // States
  disabled: '#D1D1D6',      // iOS System Gray 4
  white: '#FFFFFF',

  // Role accent colors
  rolePatient: '#007AFF',
  roleFamily: '#34C759',
  roleCaregiver: '#FF9500',
  roleDoctor: '#5856D6',
  roleOrg: '#FF3B30',
};

export const typography = {
  largeTitle: {
    fontSize: 34,
    fontWeight: '700' as const,
    lineHeight: 41,
    letterSpacing: 0.37,
  },
  title1: {
    fontSize: 28,
    fontWeight: '700' as const,
    lineHeight: 34,
    letterSpacing: 0.36,
  },
  title2: {
    fontSize: 22,
    fontWeight: '700' as const,
    lineHeight: 28,
    letterSpacing: 0.35,
  },
  title3: {
    fontSize: 20,
    fontWeight: '600' as const,
    lineHeight: 25,
    letterSpacing: 0.38,
  },
  h1: {
    fontSize: 34,
    fontWeight: '700' as const,
    lineHeight: 41,
    letterSpacing: 0.37,
  },
  h2: {
    fontSize: 22,
    fontWeight: '700' as const,
    lineHeight: 28,
    letterSpacing: 0.35,
  },
  h3: {
    fontSize: 20,
    fontWeight: '600' as const,
    lineHeight: 25,
    letterSpacing: 0.38,
  },
  h4: {
    fontSize: 17,
    fontWeight: '600' as const,
    lineHeight: 22,
    letterSpacing: -0.41,
  },
  headline: {
    fontSize: 17,
    fontWeight: '600' as const,
    lineHeight: 22,
    letterSpacing: -0.41,
  },
  body: {
    fontSize: 17,
    fontWeight: '400' as const,
    lineHeight: 22,
    letterSpacing: -0.41,
  },
  bodySm: {
    fontSize: 15,
    fontWeight: '400' as const,
    lineHeight: 20,
    letterSpacing: -0.24,
  },
  callout: {
    fontSize: 16,
    fontWeight: '400' as const,
    lineHeight: 21,
    letterSpacing: -0.32,
  },
  subheadline: {
    fontSize: 15,
    fontWeight: '400' as const,
    lineHeight: 20,
    letterSpacing: -0.24,
  },
  footnote: {
    fontSize: 13,
    fontWeight: '400' as const,
    lineHeight: 18,
    letterSpacing: -0.08,
  },
  caption: {
    fontSize: 12,
    fontWeight: '400' as const,
    lineHeight: 16,
    letterSpacing: 0,
  },
  caption2: {
    fontSize: 11,
    fontWeight: '400' as const,
    lineHeight: 13,
    letterSpacing: 0.06,
  },
  overline: {
    fontSize: 10,
    fontWeight: '700' as const,
    lineHeight: 14,
    letterSpacing: 1.2,
    textTransform: 'uppercase' as const,
  },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const radius = {
  xs: 4,
  sm: 8,
  md: 10,
  lg: 14,
  xl: 20,
  xxl: 28,
  full: 9999,
};

export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
  },
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
};

export const theme = {
  colors: {
    primary: colors.primary,
    background: colors.background,
    surface: colors.surface,
    error: colors.error,
    text: colors.text,
    onSurface: colors.text,
    onSurfaceVariant: colors.textSecondary,
    disabled: colors.disabled,
    placeholder: colors.placeholder,
    backdrop: 'rgba(0,0,0,0.4)',
    notification: colors.error,
    outline: colors.border,
  },
  roundness: radius.md,
};

export const darkTheme = {
  colors: {
    primary: darkColors.primary,
    background: darkColors.background,
    surface: darkColors.surface,
    error: darkColors.error,
    text: darkColors.text,
    onSurface: darkColors.text,
    onSurfaceVariant: darkColors.textSecondary,
    disabled: darkColors.disabled,
    placeholder: darkColors.placeholder,
    backdrop: 'rgba(0,0,0,0.4)',
    notification: darkColors.error,
    outline: darkColors.border,
  },
  roundness: radius.md,
};

