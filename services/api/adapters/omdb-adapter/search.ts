/**
 * OMDb Adapter - Search Methods
 * Handles content search functionality
 */

import type { SearchResults } from '@/types/user';
import { searchContent } from '../../omdb';
import { mapOMDbSearchToSearchResults } from '../../omdb-mappers';
import { handleAdapterError } from './utils';

/**
 * Search for content
 * 
 * Requirements: 2.4
 */
export async function searchMulti(query: string, page: number): Promise<SearchResults> {
  try {
    const results = await searchContent({ query, page });
    return mapOMDbSearchToSearchResults(results, page);
  } catch (error) {
    return handleAdapterError(error, 'searchMulti', {
      results: [],
      totalResults: 0,
      totalPages: 0,
      page,
    });
  }
}