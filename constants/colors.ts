/**
 * Color constants
 * Hardcoded color values used throughout the app
 */

/** Country gradient colors */
export const COUNTRY_GRADIENTS = {
  US: {
    dark: ['#1a365d', '#2c5282'] as const,
    light: ['#ebf8ff', '#bee3f8'] as const,
  },
  JP: {
    dark: ['#742a2a', '#9b2c2c'] as const,
    light: ['#fff5f5', '#fed7d7'] as const,
  },
  IN: {
    dark: ['#744210', '#975a16'] as const,
    light: ['#fffff0', '#fefcbf'] as const,
  },
  CN: {
    dark: ['#742a2a', '#9b2c2c'] as const,
    light: ['#fff5f5', '#fed7d7'] as const,
  },
  RU: {
    dark: ['#1a365d', '#2c5282'] as const,
    light: ['#ebf8ff', '#bee3f8'] as const,
  },
  ES: {
    dark: ['#744210', '#975a16'] as const,
    light: ['#fffff0', '#fefcbf'] as const,
  },
  DE: {
    dark: ['#1c4532', '#276749'] as const,
    light: ['#f0fff4', '#c6f6d5'] as const,
  },
  default: {
    dark: ['#2d3748', '#4a5568'] as const,
    light: ['#f7fafc', '#edf2f7'] as const,
  },
} as const;

/** Common overlay colors */
export const OVERLAY_COLORS = {
  WHITE_10: 'rgba(255,255,255,0.1)',
  WHITE_20: 'rgba(255, 255, 255, 0.2)',
  WHITE_30: 'rgba(255, 255, 255, 0.3)',
  WHITE_50: 'rgba(255,255,255,0.5)',
  WHITE_70: 'rgba(255,255,255,0.7)',
  WHITE_80: 'rgba(255,255,255,0.8)',
  BLACK_05: 'rgba(0,0,0,0.05)',
  BLACK_50: 'rgba(0,0,0,0.5)',
  BLACK_60: 'rgba(0, 0, 0, 0.6)',
  BLACK_70: 'rgba(0,0,0,0.7)',
  BLACK_80: 'rgba(0,0,0,0.8)',
  BLACK_95: 'rgba(0,0,0,0.95)',
} as const;

/** Solid colors */
export const SOLID_COLORS = {
  WHITE: '#FFFFFF',
  BLACK: '#000000',
  PURE_BLACK: '#000',
  GRAY_LIGHT: '#D0D0D0',
  GRAY_DARK: '#353636',
  GRAY_MEDIUM: '#808080',
  BLUE_LINK: '#0a7ea4',
} as const;