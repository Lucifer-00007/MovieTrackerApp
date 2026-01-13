/**
 * OMDb Data Parsers
 * Utility functions for parsing OMDb API response data
 */

import type { Genre, Country, Language } from '@/types/media';

/**
 * Parse runtime string (e.g., "148 min") to number of minutes
 * Returns null if runtime is not available or invalid
 */
export function parseRuntime(runtime: string | undefined): number | null {
  if (!runtime || runtime === 'N/A') {
    return null;
  }
  
  const match = runtime.match(/(\d+)/);
  return match ? parseInt(match[1], 10) : null;
}

/**
 * Parse comma-separated genre string to Genre array
 */
export function parseGenres(genreString: string | undefined): Genre[] {
  if (!genreString || genreString === 'N/A') {
    return [];
  }
  
  return genreString.split(',').map(name => ({
    id: generateGenreId(name.trim()),
    name: name.trim(),
  }));
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
      iso31661: getCountryCode(trimmedName),
      englishName: trimmedName,
      nativeName: trimmedName,
    };
  });
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
      iso6391: getLanguageCode(trimmedName),
      englishName: trimmedName,
      name: trimmedName,
    };
  });
}

/**
 * Parse IMDb vote count string (e.g., "1,234,567") to number
 */
export function parseVoteCount(voteString: string | undefined): number {
  if (!voteString || voteString === 'N/A') {
    return 0;
  }
  
  const cleanString = voteString.replace(/,/g, '');
  const parsed = parseInt(cleanString, 10);
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
 * Handles formats like "2023", "2020–2023", "2020–"
 */
export function parseReleaseDate(yearString: string | undefined): string {
  if (!yearString || yearString === 'N/A') {
    return '';
  }
  
  // Extract the first year from formats like "2020–2023" or "2020–"
  const match = yearString.match(/(\d{4})/);
  if (match) {
    return `${match[1]}-01-01`;
  }
  
  return '';
}

/**
 * Handles formats like "25 Dec 2023"
 */
export function parseReleasedDate(releasedString: string | undefined): string {
  if (!releasedString || releasedString === 'N/A') {
    return '';
  }
  
  try {
    const date = new Date(releasedString);
    if (isNaN(date.getTime())) {
      return '';
    }
    return date.toISOString().split('T')[0];
  } catch {
    return '';
  }
}

// Helper functions
function generateGenreId(genreName: string): number {
  const genreMap: Record<string, number> = {
    'Action': 28,
    'Adventure': 12,
    'Animation': 16,
    'Comedy': 35,
    'Crime': 80,
    'Documentary': 99,
    'Drama': 18,
    'Family': 10751,
    'Fantasy': 14,
    'History': 36,
    'Horror': 27,
    'Music': 10402,
    'Mystery': 9648,
    'Romance': 10749,
    'Science Fiction': 878,
    'Sci-Fi': 878,
    'TV Movie': 10770,
    'Thriller': 53,
    'War': 10752,
    'Western': 37,
  };
  
  return genreMap[genreName] || Math.abs(genreName.split('').reduce((a, b) => a + b.charCodeAt(0), 0));
}

function getCountryCode(countryName: string): string {
  const countryMap: Record<string, string> = {
    'United States': 'US',
    'USA': 'US',
    'United Kingdom': 'GB',
    'UK': 'GB',
    'Canada': 'CA',
    'Australia': 'AU',
    'Germany': 'DE',
    'France': 'FR',
    'Italy': 'IT',
    'Spain': 'ES',
    'Japan': 'JP',
    'South Korea': 'KR',
    'China': 'CN',
    'India': 'IN',
    'Russia': 'RU',
    'Brazil': 'BR',
    'Mexico': 'MX',
  };
  
  return countryMap[countryName] || countryName.substring(0, 2).toUpperCase();
}

function getLanguageCode(languageName: string): string {
  const languageMap: Record<string, string> = {
    'English': 'en',
    'Spanish': 'es',
    'French': 'fr',
    'German': 'de',
    'Italian': 'it',
    'Portuguese': 'pt',
    'Russian': 'ru',
    'Japanese': 'ja',
    'Korean': 'ko',
    'Chinese': 'zh',
    'Hindi': 'hi',
    'Arabic': 'ar',
  };
  
  return languageMap[languageName] || languageName.substring(0, 2).toLowerCase();
}