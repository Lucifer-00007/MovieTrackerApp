/**
 * Color and Design Token Constants
 * Centralized theme tokens for the MovieTracker app
 */

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/** Convert hex color to RGB values */
export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

/** Calculate relative luminance for contrast ratio */
function getLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/** Calculate contrast ratio between two colors (WCAG 2.1) */
export function getContrastRatio(color1: string, color2: string): number {
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);
  if (!rgb1 || !rgb2) return 0;

  const l1 = getLuminance(rgb1.r, rgb1.g, rgb1.b);
  const l2 = getLuminance(rgb2.r, rgb2.g, rgb2.b);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

/** Minimum contrast ratio for WCAG AA compliance */
export const MIN_CONTRAST_RATIO = 4.5;


// ============================================================================
// SOLID COLORS
// ============================================================================

export const SOLID_COLORS = {
  WHITE: '#FFFFFF',
  BLACK: '#000000',
  PURE_BLACK: '#000',
  GRAY_LIGHT: '#D0D0D0',
  GRAY_DARK: '#353636',
  GRAY_MEDIUM: '#808080',
  BLUE_LINK: '#0a7ea4',
  GOLD: '#FFD700',
} as const;

// ============================================================================
// OVERLAY COLORS
// ============================================================================

export const OVERLAY_COLORS = {
  WHITE_10: 'rgba(255,255,255,0.1)',
  WHITE_20: 'rgba(255,255,255,0.2)',
  WHITE_30: 'rgba(255,255,255,0.3)',
  WHITE_50: 'rgba(255,255,255,0.5)',
  WHITE_70: 'rgba(255,255,255,0.7)',
  WHITE_80: 'rgba(255,255,255,0.8)',
  BLACK_05: 'rgba(0,0,0,0.05)',
  BLACK_50: 'rgba(0,0,0,0.5)',
  BLACK_60: 'rgba(0,0,0,0.6)',
  BLACK_70: 'rgba(0,0,0,0.7)',
  BLACK_80: 'rgba(0,0,0,0.8)',
  BLACK_95: 'rgba(0,0,0,0.95)',
} as const;

// ============================================================================
// THEME COLORS
// ============================================================================

export const Colors = {
  light: {
    text: '#11181C',
    textSecondary: '#687076',
    textMuted: '#889096',
    background: '#FFFFFF',
    backgroundSecondary: '#F4F4F5',
    tint: '#0a7ea4',
    icon: '#687076',
    border: '#E4E4E7',
    card: '#FFFFFF',
    cardBorder: '#E4E4E7',
    success: '#22C55E',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6',
    ratingBadge: '#FEF3C7',
    ratingText: '#92400E',
    skeleton: '#E4E4E7',
    skeletonHighlight: '#F4F4F5',
    tabIconDefault: '#687076',
    tabIconSelected: '#0a7ea4',
  },
  dark: {
    text: '#ECEDEE',
    textSecondary: '#B4B8BC',
    textMuted: '#9BA1A6',
    background: '#151718',
    backgroundSecondary: '#1E2022',
    tint: '#4FB3D9',
    icon: '#9BA1A6',
    border: '#2E3235',
    card: '#1E2022',
    cardBorder: '#2E3235',
    success: '#22C55E',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6',
    ratingBadge: '#422006',
    ratingText: '#FCD34D',
    skeleton: '#2E3235',
    skeletonHighlight: '#3E4245',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: '#FFFFFF',
  },
} as const;

/** Text/background color pairs for accessibility testing */
export const TextColorPairs = {
  light: [
    { text: Colors.light.text, background: Colors.light.background },
    { text: Colors.light.textSecondary, background: Colors.light.background },
    { text: Colors.light.textMuted, background: Colors.light.background },
  ],
  dark: [
    { text: Colors.dark.text, background: Colors.dark.background },
    { text: Colors.dark.textSecondary, background: Colors.dark.background },
    { text: Colors.dark.textMuted, background: Colors.dark.background },
  ],
} as const;


// ============================================================================
// COUNTRY GRADIENTS
// ============================================================================

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

// ============================================================================
// SPACING
// ============================================================================

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
  xxxxl: 52,
} as const;

// ============================================================================
// BORDER RADIUS
// ============================================================================

export const BorderRadius = {
  xs: 1,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
} as const;

// ============================================================================
// TYPOGRAPHY
// ============================================================================

export const Typography = {
  sizes: {
    xxs: 10,
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    xxxl: 32,
  },
  weights: {
    normal: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
  lineHeights: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
  },
} as const;

// ============================================================================
// ANIMATION DURATIONS
// ============================================================================

export const AnimationDurations = {
  instant: 100,
  fast: 200,
  normal: 300,
  slow: 500,
  verySlow: 1000,
} as const;

// ============================================================================
// COMPONENT TOKENS
// ============================================================================

export const ComponentTokens = {
  touchTarget: {
    min: 44,
    recommended: 48,
  },
  mediaCard: {
    small: { width: 100, height: 150 },
    medium: { width: 140, height: 210 },
    large: { width: 200, height: 300 },
  },
  heroCarousel: {
    height: 400,
    autoAdvanceInterval: 5000,
  },
  skeleton: {
    duration: 1500,
  },
  header: {
    default: 56,
    large: 96,
  },
  icon: {
    xs: 16,
    sm: 20,
    md: 24,
    lg: 32,
    xl: 48,
  },
  button: {
    small: { height: 32, paddingHorizontal: 12 },
    medium: { height: 44, paddingHorizontal: 16 },
    large: { height: 52, paddingHorizontal: 24 },
  },
  input: {
    height: 48,
    borderRadius: BorderRadius.md,
  },
  badge: {
    small: { minWidth: 32, minHeight: 24 },
    medium: { minWidth: 44, minHeight: 28 },
  },
  playButton: {
    size: 70,
    iconSize: 28,
  },
  playButtonLarge: {
    size: 80,
    iconSize: 48,
  },
  progressBar: {
    height: 4,
    thumbSize: 16,
  },
  syncIndicator: {
    size: 20,
  },
  removeButton: {
    size: 24,
  },
  synopsis: {
    expandThreshold: 200,
    collapsedLines: 4,
  },
  cast: {
    maxDisplay: 10,
    itemWidth: 80,
  },
  contentRow: {
    itemSpacing: 12,
  },
  detailPage: {
    sectionSpacing: 24,
    actionButtonSize: 56,
    infoCardMinWidth: 100,
    galleryImageHeight: 200,
  },
} as const;
