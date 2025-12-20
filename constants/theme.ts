/**
 * Theme configuration for MovieStream MVP
 * Re-exports colors and adds platform-specific configurations
 */

import { Platform } from 'react-native';

// Re-export all color and token definitions
export {
  Colors,
  Spacing,
  BorderRadius,
  Typography,
  ComponentTokens,
  AnimationDurations,
  getContrastRatio,
  hexToRgb,
  TextColorPairs,
  MIN_CONTRAST_RATIO,
} from './colors';

/** Font families (platform-specific) */
export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
