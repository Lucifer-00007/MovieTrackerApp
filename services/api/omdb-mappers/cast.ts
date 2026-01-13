/**
 * OMDb Cast and Crew Processing
 * Utilities for parsing cast and crew information
 */

import type { CastMember, ExtendedCastMember } from '@/types/media';

/**
 * Handles edge cases like empty strings and N/A values
 */
export function parseNameString(nameString: string | undefined): string[] {
  if (!nameString || nameString === 'N/A' || nameString.trim() === '') {
    return [];
  }
  
  return nameString.split(',').map(name => name.trim()).filter(name => name.length > 0);
}

/**
 * Generate a consistent numeric ID for cast members based on their name
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
  
  // Ensure positive number and reasonable range
  return Math.abs(hash) % 10000000;
}

/**
 * Parse actors string from OMDb response to CastMember array
 * Handles comma-separated actor names
 * 
 * @param actorsString - Comma-separated string of actor names
 * @returns Array of CastMember objects
 */
export function parseCastString(actorsString: string | undefined): CastMember[] {
  const names = parseNameString(actorsString);
  
  return names.map((name, index) => ({
    id: generateCastMemberId(name),
    name,
    character: '', // OMDb doesn't provide character names in search results
    order: index,
    profilePath: null, // OMDb doesn't provide actor photos
  }));
}

/**
 * Parse directors string from OMDb response to ExtendedCastMember array
 * 
 * @param directorString - Comma-separated string of director names
 * @returns Array of ExtendedCastMember objects with director role
 */
export function parseDirectors(directorString: string | undefined): ExtendedCastMember[] {
  const names = parseNameString(directorString);
  
  return names.map((name, index) => ({
    id: generateCastMemberId(name),
    name,
    character: '',
    order: index,
    profilePath: null,
    job: 'Director',
    department: 'Directing',
  }));
}

/**
 * Parse writers string from OMDb response to ExtendedCastMember array
 * Handles writer credits which may include roles in parentheses
 * 
 * @param writerString - Comma-separated string of writer names
 * @returns Array of ExtendedCastMember objects with writer role
 */
export function parseWriters(writerString: string | undefined): ExtendedCastMember[] {
  const names = parseNameString(writerString);
  
  return names.map((name, index) => {
    // Clean up writer names that might have roles in parentheses
    const cleanName = name.replace(/\s*\([^)]*\)/g, '').trim();
    
    return {
      id: generateCastMemberId(cleanName),
      name: cleanName,
      character: '',
      order: index,
      profilePath: null,
      job: 'Writer',
      department: 'Writing',
    };
  });
}

/**
 * Extract all cast and crew information from OMDb detail response
 * Combines actors, directors, and writers into organized structure
 * 
 * @param omdbDetail - OMDb detail response object
 * @returns Object containing actors, directors, writers, and combined cast
 */
export function extractCastAndCrew(omdbDetail: any): {
  actors: CastMember[];
  directors: ExtendedCastMember[];
  writers: ExtendedCastMember[];
  allCast: CastMember[];
} {
  const actors = parseCastString(omdbDetail.Actors);
  const directors = parseDirectors(omdbDetail.Director);
  const writers = parseWriters(omdbDetail.Writer);
  
  // Combine all cast and crew into a single array
  const allCast: CastMember[] = [
    ...actors,
    ...directors.map(d => ({
      id: d.id,
      name: d.name,
      character: d.job,
      order: d.order + actors.length,
      profilePath: d.profilePath,
    })),
    ...writers.map(w => ({
      id: w.id,
      name: w.name,
      character: w.job,
      order: w.order + actors.length + directors.length,
      profilePath: w.profilePath,
    })),
  ];
  
  return {
    actors,
    directors,
    writers,
    allCast,
  };
}

/**
 * Get cast members (actors only) from OMDb detail response
 * 
 * @param omdbDetail - OMDb detail response object
 * @returns Array of CastMember objects (actors only)
 */
export function getCastMembers(omdbDetail: any): CastMember[] {
  return parseCastString(omdbDetail.Actors);
}

/**
 * Get full credits (all cast and crew) from OMDb detail response
 * 
 * @param omdbDetail - OMDb detail response object
 * @returns Array of all cast and crew members
 */
export function getFullCredits(omdbDetail: any): CastMember[] {
  const { allCast } = extractCastAndCrew(omdbDetail);
  return allCast;
}