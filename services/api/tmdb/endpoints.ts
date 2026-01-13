/**
 * TMDB API Endpoints
 * High-level API functions for different TMDB endpoints
 * 
 * Requirements: 1.1, 3.2, 4.2, 6.2, 16.7
 */

import type {
  MediaItem,
  TrendingItem,
  MediaDetails,
  CastMember,
  StreamingProvider,
} from '@/types/media';
import type { SearchResults } from '@/types/user';
import { buildUrl, fetchWithRetry } from './client';
import type {
  TMDBPaginatedResponse,
  TMDBMovieResult,
  TMDBTVResult,
  TMDBMultiResult,
  TMDBMovieDetails,
  TMDBTVDetails,
  TMDBCreditsResponse,
  TMDBWatchProvidersResponse,
  TMDBVideosResponse,
} from './types';
import {
  transformMovieToMediaItem,
  transformTVToMediaItem,
  transformMultiToMediaItem,
  transformMovieDetails,
  transformTVDetails,
  transformCredits,
  transformWatchProviders,
} from './transformers';

/**
 * Get trending movies and TV shows
 * @param mediaType - 'all', 'movie', or 'tv'
 * @param timeWindow - 'day' or 'week'
 * @param page - Page number (default 1)
 * @returns Array of trending items with rank
 */
export async function getTrending(
  mediaType: 'all' | 'movie' | 'tv' = 'all',
  timeWindow: 'day' | 'week' = 'week',
  page: number = 1
): Promise<{ items: TrendingItem[]; totalPages: number; totalResults: number }> {
  const url = buildUrl(`/trending/${mediaType}/${timeWindow}`, { page });
  const response = await fetchWithRetry<TMDBPaginatedResponse<TMDBMultiResult>>(url);

  const items = response.results
    .map((item, index) => {
      const rank = (page - 1) * 20 + index + 1;
      if (item.media_type === 'movie') {
        return transformMovieToMediaItem(item as TMDBMovieResult, rank) as TrendingItem;
      }
      if (item.media_type === 'tv') {
        return transformTVToMediaItem(item as TMDBTVResult, rank) as TrendingItem;
      }
      return null;
    })
    .filter((item): item is TrendingItem => item !== null);

  return {
    items,
    totalPages: response.total_pages,
    totalResults: response.total_results,
  };
}

/**
 * Get movie details by ID
 * @param movieId - TMDB movie ID
 * @returns Full movie details
 */
export async function getMovieDetails(movieId: number): Promise<MediaDetails> {
  const url = buildUrl(`/movie/${movieId}`);
  const response = await fetchWithRetry<TMDBMovieDetails>(url);
  return transformMovieDetails(response);
}

/**
 * Get TV series details by ID
 * @param tvId - TMDB TV series ID
 * @returns Full TV series details
 */
export async function getTvDetails(tvId: number): Promise<MediaDetails> {
  const url = buildUrl(`/tv/${tvId}`);
  const response = await fetchWithRetry<TMDBTVDetails>(url);
  return transformTVDetails(response);
}

/**
 * Search for movies and TV shows
 * @param query - Search query string
 * @param page - Page number (default 1)
 * @returns Search results grouped by type
 */
export async function searchMulti(
  query: string,
  page: number = 1
): Promise<SearchResults> {
  if (!query.trim()) {
    return {
      movies: [],
      tvShows: [],
      totalResults: 0,
      page: 1,
      totalPages: 0,
    };
  }

  const url = buildUrl('/search/multi', { query: encodeURIComponent(query), page });
  const response = await fetchWithRetry<TMDBPaginatedResponse<TMDBMultiResult>>(url);

  const movies: MediaItem[] = [];
  const tvShows: MediaItem[] = [];

  response.results.forEach(item => {
    if (item.media_type === 'movie') {
      movies.push(transformMovieToMediaItem(item as TMDBMovieResult));
    } else if (item.media_type === 'tv') {
      tvShows.push(transformTVToMediaItem(item as TMDBTVResult));
    }
  });

  return {
    movies,
    tvShows,
    totalResults: response.total_results,
    page: response.page,
    totalPages: response.total_pages,
  };
}

/**
 * Get movie credits (cast)
 * @param movieId - TMDB movie ID
 * @returns Array of cast members
 */
export async function getMovieCredits(movieId: number): Promise<CastMember[]> {
  const url = buildUrl(`/movie/${movieId}/credits`);
  const response = await fetchWithRetry<TMDBCreditsResponse>(url);
  return transformCredits(response);
}

/**
 * Get TV series credits (cast)
 * @param tvId - TMDB TV series ID
 * @returns Array of cast members
 */
export async function getTvCredits(tvId: number): Promise<CastMember[]> {
  const url = buildUrl(`/tv/${tvId}/credits`);
  const response = await fetchWithRetry<TMDBCreditsResponse>(url);
  return transformCredits(response);
}

/**
 * Get watch providers for a movie or TV show
 * @param mediaType - 'movie' or 'tv'
 * @param mediaId - TMDB media ID
 * @param countryCode - ISO 3166-1 country code (default 'US')
 * @returns Array of streaming providers
 */
export async function getWatchProviders(
  mediaType: 'movie' | 'tv',
  mediaId: number,
  countryCode: string = 'US'
): Promise<StreamingProvider[]> {
  const url = buildUrl(`/${mediaType}/${mediaId}/watch/providers`);
  const response = await fetchWithRetry<TMDBWatchProvidersResponse>(url);
  return transformWatchProviders(response, countryCode);
}

/**
 * Get recommendations for a movie or TV show
 * @param mediaType - 'movie' or 'tv'
 * @param mediaId - TMDB media ID
 * @param page - Page number (default 1)
 * @returns Array of recommended media items
 */
export async function getRecommendations(
  mediaType: 'movie' | 'tv',
  mediaId: number,
  page: number = 1
): Promise<{ items: MediaItem[]; totalPages: number }> {
  const url = buildUrl(`/${mediaType}/${mediaId}/recommendations`, { page });
  
  if (mediaType === 'movie') {
    const response = await fetchWithRetry<TMDBPaginatedResponse<TMDBMovieResult>>(url);
    return {
      items: response.results.map(item => transformMovieToMediaItem(item)),
      totalPages: response.total_pages,
    };
  } else {
    const response = await fetchWithRetry<TMDBPaginatedResponse<TMDBTVResult>>(url);
    return {
      items: response.results.map(item => transformTVToMediaItem(item)),
      totalPages: response.total_pages,
    };
  }
}

/**
 * Discover content by country
 * @param mediaType - 'movie' or 'tv'
 * @param countryCode - ISO 3166-1 country code
 * @param options - Additional filter options
 * @returns Array of media items with rank
 */
export async function discoverByCountry(
  mediaType: 'movie' | 'tv',
  countryCode: string,
  options: {
    page?: number;
    genre?: number;
    year?: number;
    sortBy?: string;
  } = {}
): Promise<{ items: TrendingItem[]; totalPages: number; totalResults: number }> {
  const { page = 1, genre, year, sortBy = 'popularity.desc' } = options;

  const params: Record<string, string | number | undefined> = {
    page,
    sort_by: sortBy,
    with_origin_country: countryCode,
    with_genres: genre,
  };

  if (mediaType === 'movie') {
    if (year) {
      params.primary_release_year = year;
    }
    const url = buildUrl('/discover/movie', params);
    const response = await fetchWithRetry<TMDBPaginatedResponse<TMDBMovieResult>>(url);
    
    return {
      items: response.results.map((item, index) => 
        transformMovieToMediaItem(item, (page - 1) * 20 + index + 1) as TrendingItem
      ),
      totalPages: response.total_pages,
      totalResults: response.total_results,
    };
  } else {
    if (year) {
      params.first_air_date_year = year;
    }
    const url = buildUrl('/discover/tv', params);
    const response = await fetchWithRetry<TMDBPaginatedResponse<TMDBTVResult>>(url);
    
    return {
      items: response.results.map((item, index) => 
        transformTVToMediaItem(item, (page - 1) * 20 + index + 1) as TrendingItem
      ),
      totalPages: response.total_pages,
      totalResults: response.total_results,
    };
  }
}

/**
 * Get trailer key for a movie or TV show
 * @param mediaType - 'movie' or 'tv'
 * @param mediaId - TMDB media ID
 * @returns YouTube video key or null if not available
 */
export async function getTrailerKey(
  mediaType: 'movie' | 'tv',
  mediaId: number
): Promise<string | null> {
  const url = buildUrl(`/${mediaType}/${mediaId}/videos`);
  const response = await fetchWithRetry<TMDBVideosResponse>(url);

  // Find official YouTube trailer
  const trailer = response.results.find(
    video => video.site === 'YouTube' && video.type === 'Trailer' && video.official
  ) || response.results.find(
    video => video.site === 'YouTube' && video.type === 'Trailer'
  ) || response.results.find(
    video => video.site === 'YouTube'
  );

  return trailer?.key || null;
}