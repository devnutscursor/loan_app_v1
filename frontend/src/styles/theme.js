/**
 * Application Theme Configuration
 * 
 * This file serves as a central location for all theme-related colors and styles.
 * Change colors here to update them throughout the entire application.
 */

// Main theme colors
const colors = {
  // Primary color and its variations
  primary: '#3b82f6', // blue-500 - Main brand color
  primaryLight: '#60a5fa', // blue-400
  primaryDark: '#2563eb', // blue-600
  primaryHover: '#2563eb', // blue-600
  primaryFocus: '#3b82f6', // blue-500

  
// Gradient colors
  blue600: '#2563eb',
  blue700: '#1d4ed8',
  blue800: '#1e40af',
  blue900: '#1e3a8a',

  // Secondary colors
  secondary: '#64748b', // slate-500
  secondaryLight: '#94a3b8', // slate-400
  secondaryDark: '#475569', // slate-600
  
  // Accent colors
  accent: '#8b5cf6', // violet-500
  
  // Status colors
  success: '#10b981', // emerald-500
  danger: '#ef4444', // red-500
  warning: '#f59e0b', // amber-500
  info: '#06b6d4', // cyan-500
  
  // Neutral colors
  white: '#ffffff',
  black: '#000000',
  gray50: '#f9fafb',
  gray100: '#f3f4f6',
  gray200: '#e5e7eb',
  gray300: '#d1d5db',
  gray400: '#9ca3af',
  gray500: '#6b7280',
  gray600: '#4b5563',
  gray700: '#374151',
  gray800: '#1f2937',
  gray900: '#111827',
};

// New gradients object
const gradients = {
  primary: 'linear-gradient(to right, #2563eb, #1e40af)', // blue-600 to blue-800
  primaryHover: 'linear-gradient(to right, #1d4ed8, #1e3a8a)', // blue-700 to blue-900
};

// Typography
const typography = {
  fontFamily: {
    sans: '"Inter", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    serif: 'ui-serif, Georgia, Cambria, "Times New Roman", Times, serif',
    mono: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
  },
  fontSize: {
    xs: '0.75rem',
    sm: '0.875rem',
    base: '1rem',
    lg: '1.125rem',
    xl: '1.25rem',
    '2xl': '1.5rem',
    '3xl': '1.875rem',
    '4xl': '2.25rem',
    '5xl': '3rem',
  },
};

// Spacing
const spacing = {
  none: '0',
  xs: '0.25rem',
  sm: '0.5rem',
  md: '1rem',
  lg: '1.5rem',
  xl: '2rem',
  '2xl': '3rem',
  '3xl': '4rem',
};

// Border radius
const borderRadius = {
  none: '0',
  sm: '0.125rem',
  md: '0.375rem',
  lg: '0.5rem',
  xl: '0.75rem',
  full: '9999px',
};

// Shadow
const shadow = {
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
};

// Button styles
const buttons = {
  primary: {
    background: colors.primary,
    hoverBackground: colors.primaryHover,
    text: colors.white,
    border: 'transparent',
  },
  secondary: {
    background: colors.white,
    hoverBackground: colors.gray100,
    text: colors.gray700,
    border: colors.gray300,
  },
  outline: {
    background: 'transparent',
    hoverBackground: colors.gray100,
    text: colors.primary,
    border: colors.primary,
  },
  danger: {
    background: colors.danger,
    hoverBackground: '#dc2626', // red-600
    text: colors.white,
    border: 'transparent',
  },
};

// Form control styles
const forms = {
  input: {
    border: colors.gray300,
    text: colors.gray700,
    placeholder: colors.gray500,
    background: colors.white,
    focus: colors.primary,
  },
  checkbox: {
    background: colors.primary,
    border: colors.gray300,
  },
  radio: {
    background: colors.primary,
    border: colors.gray300,
  },
  select: {
    border: colors.gray300,
    text: colors.gray700,
    background: colors.white,
    focus: colors.primary,
  },
};

// Step navigator styles
const stepNavigator = {
  circleSize: '2rem', // Smaller circle size
  activeBackground: colors.primary,
  activeBorder: colors.primary,
  activeText: colors.white,
  completedBackground: colors.primary,
  completedBorder: colors.primary, 
  completedText: colors.white,
  inactiveBackground: colors.white,
  inactiveBorder: colors.gray300,
  inactiveText: colors.gray500,
  connectorCompleted: colors.primary,
  connectorIncomplete: colors.gray300,
  padding: '0 2rem', // Left and right padding
};

// Export the theme
const theme = {
  colors,
  typography,
  spacing,
  borderRadius,
  shadow,
  gradients,
  buttons: {
    ...buttons,
    primary: {
      ...buttons.primary,
      background: gradients.primary, // Use gradient for buttons
      hoverBackground: gradients.primaryHover,
    },
  },
  forms,
  stepNavigator,
};

export default theme;
