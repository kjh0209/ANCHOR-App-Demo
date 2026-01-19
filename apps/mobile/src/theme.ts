/**
 * App Theme - KakaoTaxi/Toss Inspired Design System
 */

export const colors = {
  // Primary colors - 카카오/토스 스타일
  primary: '#3182F6',        // 토스 블루
  primaryDark: '#1B64DA',
  primaryLight: '#E8F3FF',

  // Secondary / Accent
  accent: '#FFE500',         // 카카오 옐로우 (포인트용)
  success: '#00C471',
  warning: '#FF9500',
  error: '#F04452',

  // Neutrals - 깔끔한 그레이 스케일
  background: '#F7F8FA',
  surface: '#FFFFFF',
  surfaceElevated: '#FFFFFF',

  // Text
  textPrimary: '#191F28',
  textSecondary: '#6B7684',
  textTertiary: '#AEB5BC',
  textInverse: '#FFFFFF',

  // Borders
  border: '#E5E8EB',
  borderLight: '#F2F4F6',

  // Status colors
  statusActive: '#3182F6',
  statusPending: '#FF9500',
  statusComplete: '#00C471',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

// Font Family Names (loaded in App.tsx)
export const fonts = {
  thin: 'AppleSDGothicNeo-Thin',
  ultraLight: 'AppleSDGothicNeo-UltraLight',
  light: 'AppleSDGothicNeo-Light',
  regular: 'AppleSDGothicNeo-Regular',
  medium: 'AppleSDGothicNeo-Medium',
  semiBold: 'AppleSDGothicNeo-SemiBold',
  bold: 'AppleSDGothicNeo-Bold',
  extraBold: 'AppleSDGothicNeo-ExtraBold',
  heavy: 'AppleSDGothicNeo-Heavy',
};

export const typography = {
  // Headings
  h1: {
    fontSize: 28,
    fontFamily: fonts.bold,
    lineHeight: 36,
    color: colors.textPrimary,
  },
  h2: {
    fontSize: 22,
    fontFamily: fonts.bold,
    lineHeight: 28,
    color: colors.textPrimary,
  },
  h3: {
    fontSize: 18,
    fontFamily: fonts.semiBold,
    lineHeight: 24,
    color: colors.textPrimary,
  },

  // Body
  bodyLarge: {
    fontSize: 16,
    fontFamily: fonts.regular,
    lineHeight: 24,
    color: colors.textPrimary,
  },
  body: {
    fontSize: 15,
    fontFamily: fonts.regular,
    lineHeight: 22,
    color: colors.textPrimary,
  },
  bodySmall: {
    fontSize: 13,
    fontFamily: fonts.regular,
    lineHeight: 18,
    color: colors.textSecondary,
  },

  // Caption
  caption: {
    fontSize: 12,
    fontFamily: fonts.regular,
    lineHeight: 16,
    color: colors.textTertiary,
  },

  // Labels
  label: {
    fontSize: 14,
    fontFamily: fonts.medium,
    lineHeight: 20,
    color: colors.textSecondary,
  },

  // Buttons
  button: {
    fontSize: 16,
    fontFamily: fonts.semiBold,
    color: colors.textInverse,
  },
  buttonSmall: {
    fontSize: 14,
    fontFamily: fonts.semiBold,
  },
};

export const shadows = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
  },
};

// Common component styles
export const commonStyles = {
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    ...shadows.md,
  },
  cardFlat: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  button: {
    height: 52,
    borderRadius: borderRadius.md,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  buttonPrimary: {
    backgroundColor: colors.primary,
  },
  buttonSecondary: {
    backgroundColor: colors.primaryLight,
  },
  input: {
    height: 52,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    fontSize: 15,
    color: colors.textPrimary,
  },
  inputFocused: {
    borderColor: colors.primary,
    borderWidth: 2,
  },
};

export default {
  colors,
  spacing,
  borderRadius,
  typography,
  shadows,
  commonStyles,
};
