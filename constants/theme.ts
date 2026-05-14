/**
 * MediPulse AI Design System - Modern Medical Aesthetics
 * Focused on clarity, trust, and accessibility.
 */

export const colors = {
  // Brand Colors
  primary: '#2563EB',      // Medical Blue
  secondary: '#7C3AED',    // Wellness Purple
  accent: '#F59E0B',       // Attention Yellow
  
  // Semantic Colors
  success: '#10B981',      // Emerald Green
  error: '#EF4444',        // Rose Red
  warning: '#F59E0B',      // Amber
  info: '#3B82F6',         // Sky Blue
  
  // Neutral Colors
  background: '#F8FAFC',   // Very Light Slate
  surface: '#FFFFFF',      // Pure White
  surfaceVariant: '#F1F5F9', // Light Slate
  
  // Text Colors
  text: '#0F172A',         // Slate 900
  textSecondary: '#475569', // Slate 600
  textTertiary: '#94A3B8',  // Slate 400
  
  // Border Colors
  border: '#E2E8F0',       // Slate 200
  borderLight: '#F1F5F9',  // Slate 100
  placeholder: '#94A3B8',  // Slate 400
  
  // States
  disabled: '#CBD5E1',     // Slate 300
  white: '#FFFFFF',
};

export const typography = {
  h1: {
    fontSize: 32,
    fontWeight: '800' as const,
    lineHeight: 40,
    letterSpacing: -0.5,
  },
  h2: {
    fontSize: 24,
    fontWeight: '700' as const,
    lineHeight: 32,
    letterSpacing: -0.4,
  },
  h3: {
    fontSize: 20,
    fontWeight: '700' as const,
    lineHeight: 28,
  },
  h4: {
    fontSize: 16,
    fontWeight: '600' as const,
    lineHeight: 24,
  },
  body: {
    fontSize: 16,
    fontWeight: '400' as const,
    lineHeight: 24,
  },
  bodySm: {
    fontSize: 14,
    fontWeight: '500' as const,
    lineHeight: 20,
  },
  caption: {
    fontSize: 12,
    fontWeight: '500' as const,
    lineHeight: 16,
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
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

/**
 * Modern Shadows (No Elevation for Android)
 * Using subtle borders and soft shadows for a premium flat look
 */
export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
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
    disabled: colors.disabled,
    placeholder: colors.textTertiary,
    backdrop: 'rgba(0,0,0,0.5)',
    notification: colors.accent,
  },
  roundness: radius.md,
};
