/**
 * Mock Data Adapter
 * Returns static mock data for development/testing when API is unavailable
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
import {
  MOCK_TRENDING_ALL,
  MOCK_TRENDING_MOVIES,
  MOCK_TRENDING_TV,
  MOCK_MOVIE_DETAILS,
  MOCK_TV_DETAILS,
  MOCK_CAST,
  MOCK_PROVIDERS,
  getMockSearchResults,
} from '@/constants/mock-data';

/** Simulated network delay for realistic behavior */
const MOCK_DELAY_MS = 300;

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export const mockAdapter: MediaApiAdapter = {
  async getTrending(
    mediaType: 'all' | 'movie' | 'tv',
    _timeWindow: 'day' | 'week',
    page: number
  ): Promise<PaginatedResponse<TrendingItem>> {
    await delay(MOCK_DELAY_MS);
    
    let items: TrendingItem[];
    switch (mediaType) {
      case 'movie':
        items = MOCK_TRENDING_MOVIES;
        break;
      case 'tv':
        items = MOCK_TRENDING_TV;
        break;
      default:
        items = MOCK_TRENDING_ALL;
    }

    return {
      items: items.map((item, index) => ({ ...item, rank: (page - 1) * 20 + index + 1 })),
      totalPages: 1,
      totalResults: items.length,
    };
  },

  async getMovieDetails(movieId: number): Promise<MediaDetails> {
    await delay(MOCK_DELAY_MS);
    
    const details = MOCK_MOVIE_DETAILS[movieId];
    if (details) return details;

    // Return generic details for unknown IDs
    const trending = MOCK_TRENDING_MOVIES.find(m => m.id === movieId);
    if (trending) {
      return {
        ...trending,
        runtime: 120,
        genres: [{ id: 28, name: 'Action' }],
        tagline: 'A mock movie',
        status: 'Released',
        productionCountries: [{ iso_3166_1: 'US', name: 'United States' }],
        spokenLanguages: [{ iso_639_1: 'en', name: 'English', englishName: 'English' }],
      };
    }

    throw new Error(`Movie ${movieId} not found`);
  },

  async getTvDetails(tvId: number): Promise<MediaDetails> {
    await delay(MOCK_DELAY_MS);
    
    const details = MOCK_TV_DETAILS[tvId];
    if (details) return details;

    const trending = MOCK_TRENDING_TV.find(t => t.id === tvId);
    if (trending) {
      return {
        ...trending,
        runtime: 45,
        genres: [{ id: 18, name: 'Drama' }],
        tagline: 'A mock TV show',
        status: 'Returning Series',
        productionCountries: [{ iso_3166_1: 'US', name: 'United States' }],
        spokenLanguages: [{ iso_639_1: 'en', name: 'English', englishName: 'English' }],
        numberOfSeasons: 2,
        numberOfEpisodes: 16,
      };
    }

    throw new Error(`TV show ${tvId} not found`);
  },

  async searchMulti(query: string, page: number): Promise<SearchResults> {
    await delay(MOCK_DELAY_MS);
    
    if (!query.trim()) {
      return { movies: [], tvShows: [], totalResults: 0, page: 1, totalPages: 0 };
    }

    const { movies, tvShows } = getMockSearchResults(query);
    return {
      movies,
      tvShows,
      totalResults: movies.length + tvShows.length,
      page,
      totalPages: 1,
    };
  },

  async getMovieCredits(_movieId: number): Promise<CastMember[]> {
    await delay(MOCK_DELAY_MS);
    return MOCK_CAST;
  },

  async getTvCredits(_tvId: number): Promise<CastMember[]> {
    await delay(MOCK_DELAY_MS);
    return MOCK_CAST;
  },

  async getWatchProviders(
    _mediaType: 'movie' | 'tv',
    _mediaId: number,
    _countryCode: string
  ): Promise<StreamingProvider[]> {
    await delay(MOCK_DELAY_MS);
    return MOCK_PROVIDERS;
  },

  async getRecommendations(
    mediaType: 'movie' | 'tv',
    _mediaId: number,
    _page: number
  ): Promise<PaginatedResponse<MediaItem>> {
    await delay(MOCK_DELAY_MS);
    
    const items = mediaType === 'movie' ? MOCK_TRENDING_MOVIES : MOCK_TRENDING_TV;
    return {
      items: items.slice(0, 5),
      totalPages: 1,
      totalResults: items.slice(0, 5).length,
    };
  },

  async discoverByCountry(
    mediaType: 'movie' | 'tv',
    _countryCode: string,
    options: { page?: number } = {}
  ): Promise<PaginatedResponse<TrendingItem>> {
    await delay(MOCK_DELAY_MS);
    
    const page = options.page || 1;
    const items = mediaType === 'movie' ? MOCK_TRENDING_MOVIES : MOCK_TRENDING_TV;
    
    return {
      items: items.map((item, index) => ({ ...item, rank: (page - 1) * 20 + index + 1 })),
      totalPages: 1,
      totalResults: items.length,
    };
  },

  async getTrailerKey(_mediaType: 'movie' | 'tv', _mediaId: number): Promise<string | null> {
    await delay(MOCK_DELAY_MS);
    // Return a sample YouTube video key for testing
    return 'dQw4w9WgXcQ';
  },

  getImageUrl(path: string | null, _size?: string): string | null {
    // Return placeholder image URL for mock data
    if (!path) return null;
    return `https://via.placeholder.com/500x750?text=Mock+Image`;
  },
};
