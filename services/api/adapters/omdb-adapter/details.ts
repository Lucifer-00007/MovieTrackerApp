/**
 * OMDb Adapter - Details Methods
 * Handles media details retrieval
 */

import type { MediaDetails } from '@/types/media';
import { getDetailsByImdbId, getImdbIdFromNumeric } from '../../omdb';
import { mapOMDbToMediaDetails } from '../../omdb-mappers';
import { handleAdapterError } from './utils';

/**
 * Get movie details by ID
 * 
 * Requirements: 3.4
 */
export async function getMovieDetails(movieId: number): Promise<MediaDetails> {
  try {
    // Try to get IMDb ID from cache
    const imdbId = getImdbIdFromNumeric(movieId);
    
    if (imdbId) {
      const details = await getDetailsByImdbId({ imdbId, plot: 'full' });
      return mapOMDbToMediaDetails(details);
    }
    
    // If no cached IMDb ID, we need to throw an error
    // In practice, items should be fetched via search first which populates the cache
    throw new Error(`Cannot resolve movie ID ${movieId} to IMDb ID. Item must be fetched via search first.`);
  } catch (error) {
    return handleAdapterError(error, 'getMovieDetails');
  }
}

/**
 * Get TV show details by ID
 * 
 * Requirements: 3.4
 */
export async function getTvDetails(tvId: number): Promise<MediaDetails> {
  try {
    // Try to get IMDb ID from cache
    const imdbId = getImdbIdFromNumeric(tvId);
    
    if (imdbId) {
      const details = await getDetailsByImdbId({ imdbId, plot: 'full' });
      return mapOMDbToMediaDetails(details);
    }
    
    // If no cached IMDb ID, we need to throw an error
    throw new Error(`Cannot resolve TV ID ${tvId} to IMDb ID. Item must be fetched via search first.`);
  } catch (error) {
    return handleAdapterError(error, 'getTvDetails');
  }
}