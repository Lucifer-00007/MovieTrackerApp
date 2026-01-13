/**
 * OMDb Adapter Constants
 * Fallback configuration and search terms
 */

/**
 * Popular search terms used as fallback for trending content
 * These are used when OMDb doesn't provide a trending endpoint
 */
export const POPULAR_SEARCH_TERMS = {
  movie: ['action', 'comedy', 'drama', 'thriller', 'adventure'],
  tv: ['series', 'show', 'drama', 'comedy', 'crime'],
  all: ['movie', 'series', 'action', 'drama', 'comedy'],
};

/**
 * Country-specific search terms for discover by country fallback
 */
export const COUNTRY_SEARCH_TERMS: Record<string, string[]> = {
  US: ['hollywood', 'american'],
  IN: ['bollywood', 'indian'],
  JP: ['anime', 'japanese'],
  CN: ['chinese', 'china'],
  RU: ['russian', 'russia'],
  ES: ['spanish', 'spain'],
  DE: ['german', 'germany'],
  FR: ['french', 'france'],
  KR: ['korean', 'korea'],
  GB: ['british', 'uk'],
};