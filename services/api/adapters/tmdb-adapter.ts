/**
 * TMDB API Adapter
 * Wraps the existing TMDB API client to conform to the MediaApiAdapter interface
 */

import type { MediaApiAdapter, PaginatedResponse } from '../types';
import type {
  TrendingItem,
  MediaDetails,
  CastMember,
  StreamingProvider,
  MediaItem,
} from '@/types/media';
import type { SearchResults } from '@/types/user';
import * as tmdb from '../tmdb';

export const tmdbAdapter: MediaApiAdapter = {
  async getTrending(
    mediaType: 'all' | 'movie' | 'tv',
    timeWindow: 'day' | 'week',
    page: number
  ): Promise<PaginatedResponse<TrendingItem>> {
    return tmdb.getTrending(mediaType, timeWindow, page);
  },

  async getMovieDetails(movieId: number): Promise<MediaDetails> {
    return tmdb.getMovieDetails(movieId);
  },

  async getTvDetails(tvId: number): Promise<MediaDetails> {
    return tmdb.getTvDetails(tvId);
  },

  async searchMulti(query: string, page: number): Promise<SearchResults> {
    return tmdb.searchMulti(query, page);
  },

  async getMovieCredits(movieId: number): Promise<CastMember[]> {
    return tmdb.getMovieCredits(movieId);
  },

  async getTvCredits(tvId: number): Promise<CastMember[]> {
    return tmdb.getTvCredits(tvId);
  },

  async getWatchProviders(
    mediaType: 'movie' | 'tv',
    mediaId: number,
    countryCode: string
  ): Promise<StreamingProvider[]> {
    return tmdb.getWatchProviders(mediaType, mediaId, countryCode);
  },

  async getRecommendations(
    mediaType: 'movie' | 'tv',
    mediaId: number,
    page: number
  ): Promise<PaginatedResponse<MediaItem>> {
    const result = await tmdb.getRecommendations(mediaType, mediaId, page);
    return {
      items: result.items,
      totalPages: result.totalPages,
      totalResults: result.items.length,
    };
  },

  async discoverByCountry(
    mediaType: 'movie' | 'tv',
    countryCode: string,
    options: {
      page?: number;
      genre?: number;
      year?: number;
      sortBy?: string;
    }
  ): Promise<PaginatedResponse<TrendingItem>> {
    return tmdb.discoverByCountry(mediaType, countryCode, options);
  },

  async getTrailerKey(mediaType: 'movie' | 'tv', mediaId: number): Promise<string | null> {
    return tmdb.getTrailerKey(mediaType, mediaId);
  },

  getImageUrl(path: string | null, size?: string): string | null {
    return tmdb.getImageUrl(path, size);
  },
};
