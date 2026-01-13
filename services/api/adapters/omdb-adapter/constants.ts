/**
 * OMDb Adapter Constants
 * Fallback configuration and search terms
 */

import { COUNTRIES, getSearchTerms, type CountryCode } from '@/constants/countries';

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
 * Uses centralized country config with additional fallback countries
 */
export const COUNTRY_SEARCH_TERMS: Record<string, string[]> = {
  // From centralized country config
  ...Object.fromEntries(
    Object.keys(COUNTRIES).map(code => [code, getSearchTerms(code)])
  ),
  // Additional countries not in main config
  FR: ['french', 'france'],
  KR: ['korean', 'korea'],
  GB: ['british', 'uk'],
};