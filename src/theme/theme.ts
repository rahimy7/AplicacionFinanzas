// src/theme/theme.ts
export const COLORS = {
  primary: {
    main: '#3B82F6', // blue-500
    dark: '#1D4ED8', // blue-700
    light: '#EFF6FF', // blue-50
  },
  secondary: {
    main: '#8B5CF6', // violet-500
    dark: '#6D28D9', // violet-700
    light: '#F5F3FF', // violet-50
  },
  success: {
    main: '#10B981', // emerald-500
    dark: '#047857', // emerald-700
    light: '#ECFDF5', // emerald-50
  },
  error: {
    main: '#EF4444', // red-500
    dark: '#B91C1C', // red-700
    light: '#FEF2F2', // red-50
  },
  warning: {
    main: '#F59E0B', // amber-500
    dark: '#B45309', // amber-700
    light: '#FFFBEB', // amber-50
  },
  info: {
    main: '#3B82F6', // blue-500
    dark: '#1D4ED8', // blue-700
    light: '#EFF6FF', // blue-50
  },
  grey: {
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
    900: '#111827',
  },
  common: {
    white: '#FFFFFF',
    black: '#000000',
  },
  background: {
    default: '#F3F4F6', // gray-100
    paper: '#FFFFFF',
  },
  text: {
    primary: '#111827', // gray-900
    secondary: '#6B7280', // gray-500
    disabled: '#9CA3AF', // gray-400
  },
};

export const FONT_SIZE = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 30,
  '4xl': 36,
};

export const FONT_WEIGHT = {
  normal: "400" as const,
  medium: "500" as const,
  semibold: "600" as const,
  bold: "700" as const,
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
  '3xl': 64,
};

export const BORDER_RADIUS = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

export const SHADOWS = {
  sm: {
    shadowColor: COLORS.common.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: COLORS.common.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  lg: {
    shadowColor: COLORS.common.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
};

const theme = {
  COLORS,
  FONT_SIZE,
  FONT_WEIGHT,
  SPACING,
  BORDER_RADIUS,
  SHADOWS,
};

export default theme;