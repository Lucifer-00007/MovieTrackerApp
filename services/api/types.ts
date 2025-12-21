/**
 * API Adapter Interface
 * Defines the contract that any API provider must implement
 * This allows switching between TMDB, mock data, or custom APIs
 */

import type {
  MediaItem,
  TrendingItem,
  MediaDetails,
  CastMember,
  StreamingProvider,
} from '@/types/media';
import type { SearchResults } from '@/types/user';

/** Paginated response wrapper */
export interface PaginatedResponse<T> {
  items: T[];
  totalPages: number;
  totalResults: number;
}

/** API Adapter interface - implement this for custom API providers */
export interface MediaApiAdapter {
  /** Get trending content */
  getTrending(
    mediaType: 'all' | 'movie' | 'tv',
    timeWindow: 'day' | 'week',
    page: number
  ): Promise<PaginatedResponse<TrendingItem>>;

  /** Get movie details */
  getMovieDetails(movieId: number): Promise<MediaDetails>;

  /** Get TV show details */
  getTvDetails(tvId: number): Promise<MediaDetails>;

  /** Search for content */
  searchMulti(query: string, page: number): Promise<SearchResults>;

  /** Get movie cast */
  getMovieCredits(movieId: number): Promise<CastMember[]>;

  /** Get TV show cast */
  getTvCredits(tvId: number): Promise<CastMember[]>;

  /** Get streaming providers */
  getWatchProviders(
    mediaType: 'movie' | 'tv',
    mediaId: number,
    countryCode: string
  ): Promise<StreamingProvider[]>;

  /** Get recommendations */
  getRecommendations(
    mediaType: 'movie' | 'tv',
    mediaId: number,
    page: number
  ): Promise<PaginatedResponse<MediaItem>>;

  /** Discover content by country */
  discoverByCountry(
    mediaType: 'movie' | 'tv',
    countryCode: string,
    options: {
      page?: number;
      genre?: number;
      year?: number;
      sortBy?: string;
    }
  ): Promise<PaginatedResponse<TrendingItem>>;

  /** Get trailer key */
  getTrailerKey(mediaType: 'movie' | 'tv', mediaId: number): Promise<string | null>;

  /** Get image URL */
  getImageUrl(path: string | null, size?: string): string | null;
}

/** API configuration */
export interface ApiConfig {
  baseUrl: string;
  imageBaseUrl: string;
  apiKey: string;
}
