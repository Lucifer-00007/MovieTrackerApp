/**
 * OMDb API Main Functions
 * Provides high-level API functions for searching and fetching movie/TV data
 * 
 * Requirements: 1.3, 1.4, 8.1
 */

import {
  searchContent,
  getDetailsByImdbId,
  getDetailsByTitle,
  generateNumericId,
  getImdbIdFromNumeric,
  clearIdMappingCache,
  type OMDbSearchParams,
  type OMDbSearchResults,
  type OMDbDetailByIdParams,
  type OMDbDetailByTitleParams,
  type OMDbDetailResponse,
  type OMDbSearchType,
  type OMDbPlotLength,
} from './client';

// Re-export types and utilities
export type {
  OMDbSearchParams,
  OMDbSearchResults,
  OMDbDetailByIdParams,
  OMDbDetailByTitleParams,
  OMDbDetailResponse,
  OMDbSearchType,
  OMDbPlotLength,
};

export {
  generateNumericId,
  getImdbIdFromNumeric,
  clearIdMappingCache,
};

// Re-export main API functions
export {
  searchContent,
  getDetailsByImdbId,
  getDetailsByTitle,
};

// Re-export error classes
export { OMDbError, OMDbApiError } from './client';

// Re-export configuration functions
export { getOMDbConfig, getOMDbApiKey, buildOMDbUrl, isHttpsUrl } from './client';

// Re-export retry utilities
export { fetchWithRetry, calculateBackoffDelay, DEFAULT_RETRY_CONFIG } from './client';