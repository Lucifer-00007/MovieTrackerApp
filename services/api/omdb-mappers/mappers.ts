/**
 * OMDb Data Mappers
 * Main mapping functions to convert OMDb responses to application types
 */

import type { MediaItem, MediaDetails } from '@/types/media';
import type { SearchResults } from '@/types/user';
import { generateNumericId } from '../omdb';
import {
  parseRuntime,
  parseGenres,
  parseCountries,
  parseLanguages,
  parseVoteCount,
  parseRating,
  parseReleaseDate,
  parseReleasedDate,
} from './parsers';
import { normalizePosterUrl } from './images';

/**
 * Map OMDb media type to application media type
 */
export function mapMediaType(omdbType: 'movie' | 'series' | 'episode'): 'movie' | 'tv' {
  return omdbType === 'movie' ? 'movie' : 'tv';
}

/**
 * Map OMDb search item to MediaItem
 * Used for search results and trending content
 * 
 * Requirements: 1.5, 3.4
 */
export function mapOMDbToMediaItem(omdbItem: any): MediaItem {
  return {
    id: generateNumericId(omdbItem.imdbID),
    title: omdbItem.Title || '',
    originalTitle: omdbItem.Title || '',
    overview: omdbItem.Plot || '',
    releaseDate: parseReleaseDate(omdbItem.Year),
    posterPath: normalizePosterUrl(omdbItem.Poster),
    backdropPath: null, // OMDb doesn't provide backdrop images
    voteAverage: parseRating(omdbItem.imdbRating),
    voteCount: parseVoteCount(omdbItem.imdbVotes),
    popularity: 0, // OMDb doesn't provide popularity scores
    genreIds: parseGenres(omdbItem.Genre).map(g => g.id),
    originalLanguage: 'en', // OMDb doesn't specify, default to English
    adult: false, // OMDb doesn't provide adult content flags
    video: false,
    mediaType: mapMediaType(omdbItem.Type),
  };
}

/**
 * Map OMDb detail response to MediaDetails
 * Used for detailed movie/TV show information
 * 
 * Requirements: 1.5, 3.4
 */
export function mapOMDbToMediaDetails(omdbDetail: any): MediaDetails {
  const genres = parseGenres(omdbDetail.Genre);
  
  return {
    id: generateNumericId(omdbDetail.imdbID),
    title: omdbDetail.Title || '',
    originalTitle: omdbDetail.Title || '',
    overview: omdbDetail.Plot || '',
    releaseDate: parseReleasedDate(omdbDetail.Released) || parseReleaseDate(omdbDetail.Year),
    runtime: parseRuntime(omdbDetail.Runtime),
    genres,
    productionCountries: parseCountries(omdbDetail.Country),
    spokenLanguages: parseLanguages(omdbDetail.Language),
    posterPath: normalizePosterUrl(omdbDetail.Poster),
    backdropPath: null, // OMDb doesn't provide backdrop images
    voteAverage: parseRating(omdbDetail.imdbRating),
    voteCount: parseVoteCount(omdbDetail.imdbVotes),
    popularity: 0, // OMDb doesn't provide popularity scores
    budget: 0, // OMDb doesn't provide budget information
    revenue: 0, // OMDb doesn't provide revenue information
    status: 'Released', // Assume released if in OMDb
    tagline: '', // OMDb doesn't provide taglines
    adult: false, // OMDb doesn't provide adult content flags
    video: false,
    homepage: null, // OMDb doesn't provide homepage URLs
    imdbId: omdbDetail.imdbID,
    originalLanguage: parseLanguages(omdbDetail.Language)[0]?.iso6391 || 'en',
    mediaType: mapMediaType(omdbDetail.Type),
  };
}

/**
 * Map OMDb search results to SearchResults
 * Separates movies and TV shows into appropriate arrays
 * 
 * Requirements: 2.4
 */
export function mapOMDbSearchToSearchResults(
  omdbResults: any,
  page: number = 1
): SearchResults {
  if (!omdbResults.items || omdbResults.items.length === 0) {
    return {
      movies: [],
      tvShows: [],
      totalResults: 0,
      page,
      totalPages: 0,
    };
  }
  
  const movies: MediaItem[] = [];
  const tvShows: MediaItem[] = [];
  
  omdbResults.items.forEach((item: any) => {
    const mediaItem = mapOMDbToMediaItem(item);
    
    if (mediaItem.mediaType === 'movie') {
      movies.push(mediaItem);
    } else {
      tvShows.push(mediaItem);
    }
  });
  
  return {
    movies,
    tvShows,
    totalResults: omdbResults.totalResults || 0,
    page,
    totalPages: omdbResults.totalPages || 0,
  };
}