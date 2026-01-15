/**
 * MediaCard utility functions
 * Pure logic functions that can be tested without React Native dependencies
 */

import { ComponentTokens } from '@/constants/colors';
import { API_BASE_URLS } from '@/constants/api';

/** Media card size variants */
export type MediaCardVariant = 'large' | 'medium' | 'small';

/** TMDB image base URL */
export const TMDB_IMAGE_BASE = API_BASE_URLS.TMDB_IMAGES;

/** Placeholder image for mock data mode */
export { PlaceholderImages, BLURHASH_PLACEHOLDER } from '@/constants/images';
import { PlaceholderImages } from '@/constants/images';
export const PLACEHOLDER_IMAGE = PlaceholderImages.poster;

/** Check if mock data mode is enabled */
export function isMockDataMode(): boolean {
  return process.env.EXPO_PUBLIC_USE_MOCK_DATA === 'true';
}

/** Get poster URL based on variant size */
export function getPosterUrl(posterPath: string | null, variant: MediaCardVariant): string | null {
  if (!posterPath) return null;
  
  // In mock data mode, return special marker for placeholder
  if (isMockDataMode() || posterPath === 'placeholder') {
    return 'placeholder';
  }
  
  const sizeMap: Record<MediaCardVariant, string> = {
    large: 'w500',
    medium: 'w342',
    small: 'w185',
  };
  
  return `${TMDB_IMAGE_BASE}/${sizeMap[variant]}${posterPath}`;
}

/** Get dimensions for each variant */
export function getVariantDimensions(variant: MediaCardVariant): { width: number; height: number } {
  return ComponentTokens.mediaCard[variant];
}

/** Format rating to one decimal place */
export function formatRating(rating: number): string {
  return rating.toFixed(1);
}

/** Check if rating should be displayed */
export function shouldShowRating(rating: number | null): boolean {
  return rating !== null && rating > 0;
}

/** Calculate touch target dimensions ensuring minimum 44x44 */
export function calculateTouchTarget(variant: MediaCardVariant): { width: number; height: number } {
  const dimensions = getVariantDimensions(variant);
  const minTouchTarget = ComponentTokens.touchTarget.min;
  
  return {
    width: Math.max(dimensions.width, minTouchTarget),
    height: Math.max(dimensions.height, minTouchTarget),
  };
}

/** Generate accessibility label for media card */
export function generateAccessibilityLabel(
  title: string, 
  rating: number | null, 
  ageRating?: string | null
): string {
  const parts: string[] = [title];
  
  if (shouldShowRating(rating)) {
    parts.push(`rated ${formatRating(rating!)} out of 10`);
  }
  
  if (ageRating) {
    parts.push(`age rating ${ageRating}`);
  }
  
  return parts.join(', ');
}
