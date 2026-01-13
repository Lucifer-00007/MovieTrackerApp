/**
 * OMDb Adapter - Images Methods
 * Handles image URL processing and validation
 */

import { validateAndNormalizePosterUrl } from '../../omdb-mappers';

/**
 * Get image URL
 * OMDb returns direct poster URLs, so we validate and return them
 * Handles cases where no poster is available
 * 
 * Requirements: 6.1, 6.2, 6.3, 6.5
 */
export function getImageUrl(path: string | null, _size?: string): string | null {
  // Handle null or undefined path
  if (!path) {
    return null;
  }
  
  // Handle OMDb's "N/A" response for missing posters
  if (path === 'N/A') {
    return null;
  }
  
  // OMDb returns full URLs directly, not paths
  // Validate that it's a proper URL
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return validateAndNormalizePosterUrl(path);
  }
  
  // If it's a path (shouldn't happen with OMDb), return null
  return null;
}