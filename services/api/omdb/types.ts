/**
 * OMDb API Types
 * Type definitions for OMDb API responses and configuration
 */

/** OMDb API Configuration */
export interface OMDbConfig {
  baseUrl: string;
  apiKey: string;
  timeout: number;
}

/** OMDb search result item */
export interface OMDbSearchItem {
  Title: string;
  Year: string;
  imdbID: string;
  Type: 'movie' | 'series' | 'episode';
  Poster: string;
}

/** OMDb search response */
export interface OMDbSearchResponse {
  Search?: OMDbSearchItem[];
  totalResults?: string;
  Response: 'True' | 'False';
  Error?: string;
}

/** OMDb rating from various sources */
export interface OMDbRating {
  Source: string;
  Value: string;
}

/** OMDb detailed response for a single item */
export interface OMDbDetailResponse {
  Title: string;
  Year: string;
  Rated: string;
  Released: string;
  Runtime: string;
  Genre: string;
  Director: string;
  Writer: string;
  Actors: string;
  Plot: string;
  Language: string;
  Country: string;
  Awards: string;
  Poster: string;
  Ratings: OMDbRating[];
  Metascore: string;
  imdbRating: string;
  imdbVotes: string;
  imdbID: string;
  Type: 'movie' | 'series' | 'episode';
  DVD?: string;
  BoxOffice?: string;
  Production?: string;
  Website?: string;
  totalSeasons?: string;
  Response: 'True' | 'False';
  Error?: string;
}

/** OMDb error response */
export interface OMDbErrorResponse {
  Response: 'False';
  Error: string;
}

/** Retry configuration */
export interface RetryConfig {
  maxAttempts: number;
  baseDelayMs: number;
  maxDelayMs: number;
  backoffFactor?: number;
  jitter?: boolean;
}