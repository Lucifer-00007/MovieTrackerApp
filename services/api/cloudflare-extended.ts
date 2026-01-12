/**
 * Cloudflare Extended API Service
 * Exposes Cloudflare-specific features not covered by the generic MediaApiAdapter
 * 
 * Use this for:
 * - IMDB upcoming movies and news
 * - TV season/episode details
 * - Region-based discovery
 * - Genre lists
 * - Now playing, top rated, popular lists
 */

import * as cf from './cloudflare';
import type {
  CFSeasonDetails,
  CFEpisode,
  CFGenre,
  CFRegion,
  CFIMDBUpcomingData,
  CFIMDBNewsData,
  CFDiscoverMovieOptions,
  CFDiscoverTVOptions,
} from './cloudflare-types';

// ============================================================================
// Movie Lists
// ============================================================================

/** Get popular movies */
export async function getPopularMovies(page = 1) {
  return cf.getPopularMovies(page);
}

/** Get top-rated movies */
export async function getTopRatedMovies(page = 1) {
  return cf.getTopRatedMovies(page);
}

/** Get now playing movies */
export async function getNowPlayingMovies(page = 1) {
  return cf.getNowPlayingMovies(page);
}

/** Get upcoming movies (TMDB) */
export async function getUpcomingMovies(page = 1) {
  return cf.getUpcomingMovies(page);
}

// ============================================================================
// TV Show Lists
// ============================================================================

/** Get popular TV shows */
export async function getPopularTVShows(page = 1) {
  return cf.getPopularTVShows(page);
}

/** Get top-rated TV shows */
export async function getTopRatedTVShows(page = 1) {
  return cf.getTopRatedTVShows(page);
}

/** Get TV shows airing today */
export async function getAiringTodayTVShows(page = 1) {
  return cf.getAiringTodayTVShows(page);
}

/** Get TV shows currently on the air */
export async function getOnTheAirTVShows(page = 1) {
  return cf.getOnTheAirTVShows(page);
}

// ============================================================================
// TV Seasons & Episodes
// ============================================================================

/** Get season details with all episodes */
export async function getSeasonDetails(
  tvId: number,
  seasonNumber: number
): Promise<CFSeasonDetails> {
  return cf.getSeasonDetails(tvId, seasonNumber);
}

/** Get single episode details */
export async function getEpisodeDetails(
  tvId: number,
  seasonNumber: number,
  episodeNumber: number
): Promise<CFEpisode> {
  return cf.getEpisodeDetails(tvId, seasonNumber, episodeNumber);
}

// ============================================================================
// Genres
// ============================================================================

/** Get all movie genres */
export async function getMovieGenres(): Promise<CFGenre[]> {
  return cf.getMovieGenres();
}

/** Get all TV genres */
export async function getTVGenres(): Promise<CFGenre[]> {
  return cf.getTVGenres();
}

// ============================================================================
// Regions & Discovery
// ============================================================================

/** Get available region filters */
export async function getRegions(): Promise<CFRegion[]> {
  return cf.getRegions();
}

/** Discover movies with advanced filters */
export async function discoverMovies(options: CFDiscoverMovieOptions) {
  return cf.discoverMovies(options);
}

/** Discover TV shows with advanced filters */
export async function discoverTVShows(options: CFDiscoverTVOptions) {
  return cf.discoverTVShows(options);
}

// ============================================================================
// IMDB Data
// ============================================================================

/** 
 * Get upcoming movies from IMDB
 * Supports 50+ regions including US, IN, GB, JP, etc.
 */
export async function getIMDBUpcoming(
  region = 'US',
  refresh = false
): Promise<CFIMDBUpcomingData> {
  return cf.getIMDBUpcoming(region, refresh);
}

/** Get entertainment news from IMDB */
export async function getIMDBNews(
  limit = 10,
  refresh = false
): Promise<CFIMDBNewsData> {
  return cf.getIMDBNews(limit, refresh);
}

/** Check IMDB scraping health status */
export async function getIMDBHealth() {
  return cf.getIMDBHealth();
}

// ============================================================================
// Health Check
// ============================================================================

/** Check API health */
export async function checkHealth() {
  return cf.getHealth();
}

// ============================================================================
// Re-export types for convenience
// ============================================================================

export type {
  CFMovieResult,
  CFTVShowResult,
  CFSeasonDetails,
  CFEpisode,
  CFGenre,
  CFRegion,
  CFIMDBUpcomingData,
  CFIMDBNewsData,
  CFDiscoverMovieOptions,
  CFDiscoverTVOptions,
} from './cloudflare-types';
