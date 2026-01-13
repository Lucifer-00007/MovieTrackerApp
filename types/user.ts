/**
 * User type definitions for MovieStream MVP
 * Defines user preferences, search filters, and settings
 */

import type { MediaItem } from './media';

/** Theme mode options */
export type ThemeMode = 'light' | 'dark' | 'system';

/** User preferences stored locally */
export interface UserPreferences {
  themeMode: ThemeMode;
  language: string;
  analyticsEnabled: boolean;
  notificationsEnabled: boolean;
  notificationTypes: {
    downloads: boolean;
    newReleases: boolean;
  };
  gdprConsentGiven: boolean;
  gdprConsentDate: string | null;
}

/** Default user preferences */
export const DEFAULT_USER_PREFERENCES: UserPreferences = {
  themeMode: 'system',
  language: 'en',
  analyticsEnabled: true,
  notificationsEnabled: true,
  notificationTypes: {
    downloads: true,
    newReleases: true,
  },
  gdprConsentGiven: true,
  gdprConsentDate: new Date().toISOString(),
};

/** Search filters for content discovery */
export interface SearchFilters {
  country: string | null;
  genre: number | null;
  yearFrom: number | null;
  yearTo: number | null;
}

/** Search results grouped by content type */
export interface SearchResults {
  movies: MediaItem[];
  tvShows: MediaItem[];
  totalResults: number;
  page: number;
  totalPages: number;
}

/** Country hub filters */
export interface CountryHubFilters {
  contentType: 'all' | 'movie' | 'tv' | 'anime';
  genre: number | null;
  year: number | null;
}

/** Recently viewed item */
export interface RecentlyViewedItem {
  id: number;
  mediaType: 'movie' | 'tv';
  title: string;
  posterPath: string | null;
  viewedAt: string;
}
