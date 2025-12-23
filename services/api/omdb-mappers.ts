/**
 * OMDb Data Transformation Layer
 * Transforms OMDb API responses to match the application's MediaItem types
 * 
 * Requirements: 1.5, 3.4
 */

import type {
  MediaItem,
  MediaDetails,
  Genre,
  Country,
  Language,
  CastMember,
} from '@/types/media';
import type { SearchResults } from '@/types/user';
import {
  generateNumericId,
  type OMDbSearchItem,
  type OMDbDetailResponse,
  type OMDbSearchResults,
} from './omdb';

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Parse runtime string (e.g., "142 min") to number of minutes
 * Returns null if runtime is not available or invalid
 */
export function parseRuntime(runtime: string | undefined): number | null {
  if (!runtime || runtime === 'N/A') {
    return null;
  }
  
  const match = runtime.match(/(\d+)/);
  if (match) {
    return parseInt(match[1], 10);
  }
  
  return null;
}

/**
 * Parse comma-separated genre string to Genre array
 */
export function parseGenres(genreString: string | undefined): Genre[] {
  if (!genreString || genreString === 'N/A') {
    return [];
  }
  
  return genreString.split(',').map((name, index) => ({
    id: index + 1, // Generate sequential IDs since OMDb doesn't provide them
    name: name.trim(),
  })).filter(genre => genre.name.length > 0);
}

/**
 * Parse comma-separated country string to Country array
 */
export function parseCountries(countryString: string | undefined): Country[] {
  if (!countryString || countryString === 'N/A') {
    return [];
  }
  
  return countryString.split(',').map(name => {
    const trimmedName = name.trim();
    return {
      iso_3166_1: getCountryCode(trimmedName),
      name: trimmedName,
    };
  }).filter(country => country.name.length > 0);
}

/**
 * Get ISO 3166-1 country code from country name
 * Returns a simplified mapping for common countries
 */
function getCountryCode(countryName: string): string {
  const countryMap: Record<string, string> = {
    'United States': 'US',
    'USA': 'US',
    'United Kingdom': 'GB',
    'UK': 'GB',
    'Canada': 'CA',
    'Australia': 'AU',
    'France': 'FR',
    'Germany': 'DE',
    'Japan': 'JP',
    'India': 'IN',
    'China': 'CN',
    'Spain': 'ES',
    'Italy': 'IT',
    'Russia': 'RU',
    'Brazil': 'BR',
    'Mexico': 'MX',
    'South Korea': 'KR',
    'New Zealand': 'NZ',
  };
  
  return countryMap[countryName] || countryName.substring(0, 2).toUpperCase();
}

/**
 * Parse comma-separated language string to Language array
 */
export function parseLanguages(languageString: string | undefined): Language[] {
  if (!languageString || languageString === 'N/A') {
    return [];
  }
  
  return languageString.split(',').map(name => {
    const trimmedName = name.trim();
    return {
      iso_639_1: getLanguageCode(trimmedName),
      name: trimmedName,
      englishName: trimmedName,
    };
  }).filter(language => language.name.length > 0);
}

/**
 * Get ISO 639-1 language code from language name
 */
function getLanguageCode(languageName: string): string {
  const languageMap: Record<string, string> = {
    'English': 'en',
    'Spanish': 'es',
    'French': 'fr',
    'German': 'de',
    'Japanese': 'ja',
    'Chinese': 'zh',
    'Hindi': 'hi',
    'Korean': 'ko',
    'Italian': 'it',
    'Portuguese': 'pt',
    'Russian': 'ru',
    'Arabic': 'ar',
    'Mandarin': 'zh',
    'Cantonese': 'zh',
  };
  
  return languageMap[languageName] || languageName.substring(0, 2).toLowerCase();
}

/**
 * Parse IMDb vote count string (e.g., "1,234,567") to number
 */
export function parseVoteCount(voteString: string | undefined): number {
  if (!voteString || voteString === 'N/A') {
    return 0;
  }
  
  // Remove commas and parse
  const cleaned = voteString.replace(/,/g, '');
  const parsed = parseInt(cleaned, 10);
  
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Parse IMDb rating string to number
 */
export function parseRating(ratingString: string | undefined): number | null {
  if (!ratingString || ratingString === 'N/A') {
    return null;
  }
  
  const parsed = parseFloat(ratingString);
  return isNaN(parsed) ? null : parsed;
}

/**
 * Validate and normalize poster URL
 * Returns null if poster is not available or invalid
 */
export function normalizePosterUrl(posterUrl: string | undefined): string | null {
  if (!posterUrl || posterUrl === 'N/A') {
    return null;
  }
  
  // OMDb returns direct URLs, validate they're proper URLs
  try {
    new URL(posterUrl);
    return posterUrl;
  } catch {
    return null;
  }
}

/**
 * Parse year string to release date format
 * Handles formats like "2023", "2020–2023", "2020–"
 */
export function parseReleaseDate(yearString: string | undefined): string {
  if (!yearString || yearString === 'N/A') {
    return '';
  }
  
  // Extract the first year from the string
  const match = yearString.match(/(\d{4})/);
  if (match) {
    return match[1];
  }
  
  return yearString;
}

/**
 * Parse released date string to ISO format
 * Handles formats like "25 Dec 2023"
 */
export function parseReleasedDate(releasedString: string | undefined): string {
  if (!releasedString || releasedString === 'N/A') {
    return '';
  }
  
  try {
    const date = new Date(releasedString);
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0];
    }
  } catch {
    // Fall through to return original string
  }
  
  return releasedString;
}

/**
 * Map OMDb media type to application media type
 */
export function mapMediaType(omdbType: 'movie' | 'series' | 'episode'): 'movie' | 'tv' {
  return omdbType === 'movie' ? 'movie' : 'tv';
}

// ============================================================================
// MAIN MAPPING FUNCTIONS
// ============================================================================

/**
 * Map OMDb search item to MediaItem
 * Used for search results where limited data is available
 * 
 * Requirements: 1.5, 3.4
 */
export function mapOMDbToMediaItem(omdbItem: OMDbSearchItem): MediaItem {
  return {
    id: generateNumericId(omdbItem.imdbID),
    title: omdbItem.Title,
    originalTitle: omdbItem.Title,
    posterPath: normalizePosterUrl(omdbItem.Poster),
    backdropPath: null, // OMDb doesn't provide backdrop images
    overview: '', // Not available in search results
    releaseDate: parseReleaseDate(omdbItem.Year),
    voteAverage: null, // Not available in search results
    voteCount: 0,
    mediaType: mapMediaType(omdbItem.Type),
    genreIds: [], // Not available in search results
    ageRating: null,
  };
}

/**
 * Map OMDb detail response to MediaDetails
 * Used for full detail pages with comprehensive data
 * 
 * Requirements: 1.5, 3.4
 */
export function mapOMDbToMediaDetails(omdbDetail: OMDbDetailResponse): MediaDetails {
  const genres = parseGenres(omdbDetail.Genre);
  
  return {
    id: generateNumericId(omdbDetail.imdbID),
    title: omdbDetail.Title,
    originalTitle: omdbDetail.Title,
    posterPath: normalizePosterUrl(omdbDetail.Poster),
    backdropPath: null, // OMDb doesn't provide backdrop images
    overview: omdbDetail.Plot !== 'N/A' ? omdbDetail.Plot : '',
    releaseDate: parseReleasedDate(omdbDetail.Released) || parseReleaseDate(omdbDetail.Year),
    voteAverage: parseRating(omdbDetail.imdbRating),
    voteCount: parseVoteCount(omdbDetail.imdbVotes),
    mediaType: mapMediaType(omdbDetail.Type),
    genreIds: genres.map(g => g.id),
    ageRating: omdbDetail.Rated !== 'N/A' ? omdbDetail.Rated : null,
    runtime: parseRuntime(omdbDetail.Runtime),
    genres,
    tagline: '', // OMDb doesn't provide taglines
    status: 'Released', // Assume released for OMDb content
    productionCountries: parseCountries(omdbDetail.Country),
    spokenLanguages: parseLanguages(omdbDetail.Language),
    numberOfSeasons: omdbDetail.totalSeasons ? parseInt(omdbDetail.totalSeasons, 10) : undefined,
  };
}

/**
 * Map OMDb search results to SearchResults format
 * Separates movies and TV shows into their respective arrays
 * 
 * Requirements: 2.4
 */
export function mapOMDbSearchToSearchResults(
  omdbResults: OMDbSearchResults,
  page: number = 1
): SearchResults {
  const mediaItems = omdbResults.items.map(mapOMDbToMediaItem);
  
  return {
    movies: mediaItems.filter(item => item.mediaType === 'movie'),
    tvShows: mediaItems.filter(item => item.mediaType === 'tv'),
    totalResults: omdbResults.totalResults,
    page,
    totalPages: omdbResults.totalPages,
  };
}


// ============================================================================
// CAST DATA PARSING
// ============================================================================

/**
 * Role type for cast/crew members
 */
export type CastRole = 'actor' | 'director' | 'writer';

/**
 * Extended cast member with role information
 */
export interface ExtendedCastMember extends CastMember {
  role: CastRole;
}

/**
 * Parse a comma-separated string of names into an array of trimmed names
 * Handles edge cases like empty strings and N/A values
 */
export function parseNameString(nameString: string | undefined): string[] {
  if (!nameString || nameString === 'N/A' || nameString.trim() === '') {
    return [];
  }
  
  return nameString
    .split(',')
    .map(name => name.trim())
    .filter(name => name.length > 0);
}

/**
 * Generate a unique numeric ID for a cast member based on their name
 * Uses a hash function similar to IMDb ID generation
 */
export function generateCastMemberId(name: string): number {
  let hash = 0;
  const normalizedName = name.toLowerCase().trim();
  
  for (let i = 0; i < normalizedName.length; i++) {
    const char = normalizedName.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  return Math.abs(hash);
}

/**
 * Parse comma-separated actors string to CastMember array
 * 
 * Requirements: 5.1, 5.2, 5.5
 * 
 * @param actorsString - Comma-separated string of actor names from OMDb
 * @returns Array of CastMember objects
 */
export function parseCastString(actorsString: string | undefined): CastMember[] {
  const names = parseNameString(actorsString);
  
  return names.map((name, index) => ({
    id: generateCastMemberId(name),
    name,
    character: '', // OMDb doesn't provide character names
    profilePath: null, // OMDb doesn't provide profile images
    order: index,
  }));
}

/**
 * Parse director string to CastMember array with director role
 * 
 * Requirements: 5.3
 * 
 * @param directorString - Comma-separated string of director names from OMDb
 * @returns Array of ExtendedCastMember objects with director role
 */
export function parseDirectors(directorString: string | undefined): ExtendedCastMember[] {
  const names = parseNameString(directorString);
  
  return names.map((name, index) => ({
    id: generateCastMemberId(name),
    name,
    character: 'Director',
    profilePath: null,
    order: index,
    role: 'director' as CastRole,
  }));
}

/**
 * Parse writer string to CastMember array with writer role
 * Handles various writer credit formats (e.g., "Name (screenplay)")
 * 
 * Requirements: 5.3
 * 
 * @param writerString - Comma-separated string of writer names from OMDb
 * @returns Array of ExtendedCastMember objects with writer role
 */
export function parseWriters(writerString: string | undefined): ExtendedCastMember[] {
  const names = parseNameString(writerString);
  
  return names.map((name, index) => {
    // Extract credit type if present (e.g., "John Doe (screenplay)")
    const creditMatch = name.match(/^(.+?)\s*\(([^)]+)\)$/);
    const cleanName = creditMatch ? creditMatch[1].trim() : name;
    const creditType = creditMatch ? creditMatch[2].trim() : 'Writer';
    
    return {
      id: generateCastMemberId(cleanName),
      name: cleanName,
      character: creditType,
      profilePath: null,
      order: index,
      role: 'writer' as CastRole,
    };
  });
}

/**
 * Extract all cast and crew from an OMDb detail response
 * Combines actors, directors, and writers into a single array
 * 
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5
 * 
 * @param omdbDetail - OMDb detail response
 * @returns Object containing actors, directors, writers, and combined cast
 */
export function extractCastAndCrew(omdbDetail: OMDbDetailResponse): {
  actors: CastMember[];
  directors: ExtendedCastMember[];
  writers: ExtendedCastMember[];
  allCast: CastMember[];
} {
  const actors = parseCastString(omdbDetail.Actors);
  const directors = parseDirectors(omdbDetail.Director);
  const writers = parseWriters(omdbDetail.Writer);
  
  // Combine all cast members, with directors and writers first
  // Re-order to maintain consistent ordering
  const allCast: CastMember[] = [
    ...directors.map((d, i) => ({ ...d, order: i })),
    ...writers.map((w, i) => ({ ...w, order: directors.length + i })),
    ...actors.map((a, i) => ({ ...a, order: directors.length + writers.length + i })),
  ];
  
  return {
    actors,
    directors,
    writers,
    allCast,
  };
}

/**
 * Get cast members for a media item (actors only)
 * This is the primary function used by the adapter for getMovieCredits/getTvCredits
 * 
 * Requirements: 5.1, 5.4
 * 
 * @param omdbDetail - OMDb detail response
 * @returns Array of CastMember objects (actors only)
 */
export function getCastMembers(omdbDetail: OMDbDetailResponse): CastMember[] {
  return parseCastString(omdbDetail.Actors);
}

/**
 * Get full credits including directors and writers
 * Useful for detail pages that show complete crew information
 * 
 * Requirements: 5.1, 5.2, 5.3
 * 
 * @param omdbDetail - OMDb detail response
 * @returns Array of all cast and crew members
 */
export function getFullCredits(omdbDetail: OMDbDetailResponse): CastMember[] {
  const { allCast } = extractCastAndCrew(omdbDetail);
  return allCast;
}
