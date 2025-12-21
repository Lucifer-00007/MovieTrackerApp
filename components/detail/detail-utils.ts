/**
 * Detail Page Utility Functions
 * Pure functions for detail page logic - testable without React
 * 
 * Requirements: 4.2, 4.3, 4.4, 4.5, 4.6
 */

import type { MediaDetails, CastMember, StreamingProvider, Genre } from '@/types/media';
import { ComponentTokens } from '@/constants/theme';

/** TMDB image base URL */
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p';

/** Check if mock data mode is enabled */
function isMockDataMode(): boolean {
  return process.env.EXPO_PUBLIC_USE_MOCK_DATA === 'true';
}

/** Synopsis expand threshold in characters */
export const SYNOPSIS_EXPAND_THRESHOLD = ComponentTokens.synopsis.expandThreshold;

/** Maximum cast members to display initially */
export const MAX_CAST_DISPLAY = ComponentTokens.cast.maxDisplay;

/**
 * Get backdrop URL for hero image
 * @param backdropPath - TMDB backdrop path
 * @param size - Image size (default w1280)
 */
export function getBackdropUrl(backdropPath: string | null, size: string = 'w1280'): string | null {
  if (!backdropPath) return null;
  if (isMockDataMode()) return 'placeholder';
  return `${TMDB_IMAGE_BASE}/${size}${backdropPath}`;
}

/**
 * Get profile URL for cast member
 * @param profilePath - TMDB profile path
 * @param size - Image size (default w185)
 */
export function getProfileUrl(profilePath: string | null, size: string = 'w185'): string | null {
  if (!profilePath) return null;
  if (isMockDataMode()) return 'placeholder';
  return `${TMDB_IMAGE_BASE}/${size}${profilePath}`;
}

/**
 * Get provider logo URL
 * @param logoPath - TMDB logo path
 * @param size - Image size (default w92)
 */
export function getProviderLogoUrl(logoPath: string | null, size: string = 'w92'): string | null {
  if (!logoPath) return null;
  if (isMockDataMode()) return 'placeholder';
  return `${TMDB_IMAGE_BASE}/${size}${logoPath}`;
}

/**
 * Format runtime to hours and minutes
 * @param runtime - Runtime in minutes
 * @returns Formatted string like "2h 15m" or null if no runtime
 */
export function formatRuntime(runtime: number | null): string | null {
  if (!runtime || runtime <= 0) return null;
  const hours = Math.floor(runtime / 60);
  const minutes = runtime % 60;
  if (hours === 0) return `${minutes}m`;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${minutes}m`;
}

/**
 * Format release year from date string
 * @param releaseDate - ISO date string
 * @returns Year string or empty string if invalid
 */
export function formatReleaseYear(releaseDate: string): string {
  if (!releaseDate) return '';
  const year = new Date(releaseDate).getFullYear();
  return isNaN(year) ? '' : String(year);
}

/**
 * Format rating to one decimal place
 * @param rating - Vote average
 * @returns Formatted rating string or null
 */
export function formatRating(rating: number | null): string | null {
  if (rating === null || rating === undefined || rating <= 0) return null;
  return rating.toFixed(1);
}

/**
 * Format genres as comma-separated string
 * @param genres - Array of genre objects
 * @returns Comma-separated genre names
 */
export function formatGenres(genres: Genre[]): string {
  return genres.map(g => g.name).join(', ');
}

/**
 * Check if synopsis should be expandable
 * @param overview - Synopsis text
 * @returns True if text exceeds threshold
 */
export function shouldSynopsisExpand(overview: string): boolean {
  return overview.length > SYNOPSIS_EXPAND_THRESHOLD;
}

/**
 * Get limited cast members for display
 * @param cast - Full cast array
 * @param limit - Maximum members to return (default MAX_CAST_DISPLAY)
 * @returns Limited cast array sorted by order
 */
export function getLimitedCast(cast: CastMember[], limit: number = MAX_CAST_DISPLAY): CastMember[] {
  return [...cast]
    .sort((a, b) => a.order - b.order)
    .slice(0, limit);
}

/**
 * Check if cast section should be visible
 * @param cast - Cast array
 * @returns True if cast has members
 */
export function shouldShowCast(cast: CastMember[]): boolean {
  return cast.length > 0;
}

/**
 * Check if providers section should be visible
 * @param providers - Providers array
 * @returns True if providers exist
 */
export function shouldShowProviders(providers: StreamingProvider[]): boolean {
  return providers.length > 0;
}

/**
 * Group providers by type
 * @param providers - Array of streaming providers
 * @returns Grouped providers object
 */
export function groupProvidersByType(providers: StreamingProvider[]): {
  flatrate: StreamingProvider[];
  rent: StreamingProvider[];
  buy: StreamingProvider[];
} {
  return {
    flatrate: providers.filter(p => p.type === 'flatrate'),
    rent: providers.filter(p => p.type === 'rent'),
    buy: providers.filter(p => p.type === 'buy'),
  };
}

/**
 * Check if detail page has required fields
 * @param details - Media details object
 * @returns Object with field availability
 */
export function getDetailFieldsAvailability(details: MediaDetails): {
  hasTitle: boolean;
  hasGenres: boolean;
  hasRuntime: boolean;
  hasReleaseYear: boolean;
  hasRating: boolean;
  hasOverview: boolean;
  hasBackdrop: boolean;
} {
  return {
    hasTitle: Boolean(details.title),
    hasGenres: details.genres.length > 0,
    hasRuntime: details.runtime !== null && details.runtime > 0,
    hasReleaseYear: Boolean(formatReleaseYear(details.releaseDate)),
    hasRating: details.voteAverage !== null && details.voteAverage > 0,
    hasOverview: Boolean(details.overview),
    hasBackdrop: Boolean(details.backdropPath),
  };
}

/**
 * Generate accessibility label for detail header
 * @param details - Media details
 * @returns Accessibility label string
 */
export function generateDetailAccessibilityLabel(details: MediaDetails): string {
  const parts: string[] = [details.title];
  
  const year = formatReleaseYear(details.releaseDate);
  if (year) parts.push(year);
  
  if (details.genres.length > 0) {
    parts.push(details.genres.slice(0, 2).map(g => g.name).join(' and '));
  }
  
  const rating = formatRating(details.voteAverage);
  if (rating) parts.push(`rated ${rating} out of 10`);
  
  if (details.ageRating) {
    parts.push(`age rating ${details.ageRating}`);
  }
  
  return parts.join(', ');
}

/**
 * Generate accessibility label for cast member
 * @param member - Cast member
 * @returns Accessibility label string
 */
export function generateCastAccessibilityLabel(member: CastMember): string {
  return `${member.name} as ${member.character}`;
}

/**
 * Generate accessibility label for provider
 * @param provider - Streaming provider
 * @returns Accessibility label string
 */
export function generateProviderAccessibilityLabel(provider: StreamingProvider): string {
  const typeLabel = provider.type === 'flatrate' ? 'Stream on' : 
                    provider.type === 'rent' ? 'Rent on' : 'Buy on';
  const availabilityLabel = provider.isAvailable ? '' : ', currently unavailable';
  return `${typeLabel} ${provider.providerName}${availabilityLabel}`;
}
