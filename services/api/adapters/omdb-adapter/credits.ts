/**
 * OMDb Adapter - Credits Methods
 * Handles cast and crew information retrieval
 */

import type { CastMember } from '@/types/media';
import { getDetailsByImdbId, getImdbIdFromNumeric } from '../../omdb';
import { getCastMembers } from '../../omdb-mappers';
import { handleAdapterError } from './utils';

/**
 * Get movie cast/credits
 * 
 * Requirements: 5.1, 5.4
 */
export async function getMovieCredits(movieId: number): Promise<CastMember[]> {
  try {
    const imdbId = getImdbIdFromNumeric(movieId);
    
    if (!imdbId) {
      console.warn(`[OMDb Adapter] Cannot get credits for movie ${movieId}: IMDb ID not found`);
      return [];
    }
    
    const details = await getDetailsByImdbId({ imdbId, plot: 'short' });
    return getCastMembers(details);
  } catch (error) {
    return handleAdapterError(error, 'getMovieCredits', []);
  }
}

/**
 * Get TV show cast/credits
 * 
 * Requirements: 5.1, 5.4
 */
export async function getTvCredits(tvId: number): Promise<CastMember[]> {
  try {
    const imdbId = getImdbIdFromNumeric(tvId);
    
    if (!imdbId) {
      console.warn(`[OMDb Adapter] Cannot get credits for TV ${tvId}: IMDb ID not found`);
      return [];
    }
    
    const details = await getDetailsByImdbId({ imdbId, plot: 'short' });
    return getCastMembers(details);
  } catch (error) {
    return handleAdapterError(error, 'getTvCredits', []);
  }
}