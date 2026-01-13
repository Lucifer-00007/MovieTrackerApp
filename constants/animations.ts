/**
 * Animation and timing constants
 * Duration and timing values used throughout the app
 */

/** Animation durations in milliseconds */
export const ANIMATION_DURATION = {
  /** Very fast animations */
  INSTANT: 100,
  
  /** Fast animations */
  FAST: 300,
  
  /** Standard animations */
  NORMAL: 500,
  
  /** Slow animations */
  SLOW: 1000,
  
  /** Very slow animations */
  VERY_SLOW: 2000,
  
  /** Auto-advance intervals */
  HERO_CAROUSEL: 5000,
  
  /** Timeout durations */
  CONTROLS_TIMEOUT: 3000,
  API_TIMEOUT: 10000,
  ANALYTICS_TIMEOUT: 30000,
  ANALYTICS_BATCH_INTERVAL: 30000,
  ANALYTICS_RETRY_DELAY: 1000,
  
  /** Debounce delays */
  SEARCH_DEBOUNCE: 300,
  
  /** Retry delays */
  API_RETRY_DELAY: 1000,
  OMDB_RETRY_DELAY: 2000,
  
  /** Hello wave animation */
  WAVE_DURATION: 300,
} as const;

/** Download service configuration */
export const DOWNLOAD_CONFIG = {
  MAX_CONCURRENT: 3,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY_MS: 1000,
} as const;

/** Easing functions */
export const EASING = {
  EASE_IN_OUT: 'ease-in-out',
  EASE_IN: 'ease-in',
  EASE_OUT: 'ease-out',
  LINEAR: 'linear',
} as const;

/** Animation presets */
export const ANIMATION_PRESETS = {
  FADE_IN: {
    duration: ANIMATION_DURATION.FAST,
    easing: EASING.EASE_OUT,
  },
  SLIDE_IN: {
    duration: ANIMATION_DURATION.NORMAL,
    easing: EASING.EASE_IN_OUT,
  },
  BOUNCE: {
    duration: ANIMATION_DURATION.NORMAL,
    easing: EASING.EASE_OUT,
  },
} as const;