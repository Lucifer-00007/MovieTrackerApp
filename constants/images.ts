/**
 * Image constants for MovieTracker
 * Centralized image references for consistent usage across the app
 */

/** Placeholder images for when real images are unavailable */
export const PlaceholderImages = {
  /** Poster placeholder (2:3 aspect ratio) - used for movie/TV posters */
  poster: require('@/assets/images/placeholder-poster.png'),
  
  /** Profile placeholder - used for cast member photos */
  profile: require('@/assets/images/placeholder-poster.png'),
  
  /** Backdrop placeholder (16:9 aspect ratio) - used for hero images */
  backdrop: require('@/assets/images/placeholder-poster.png'),
} as const;

/** Check if we're using mock data */
export function useMockData(): boolean {
  return process.env.EXPO_PUBLIC_USE_MOCK_DATA === 'true';
}

/**
 * Get the appropriate image source
 * Returns placeholder for mock data mode or null paths
 */
export function getImageSource(
  url: string | null,
  type: keyof typeof PlaceholderImages = 'poster'
): { uri: string } | number {
  // If URL is null, empty, or 'placeholder', use the placeholder image
  if (!url || url === 'placeholder') {
    return PlaceholderImages[type];
  }
  
  return { uri: url };
}
