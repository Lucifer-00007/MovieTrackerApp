/**
 * TMDB API Response Types
 * Type definitions for TMDB API responses
 * 
 * Requirements: 1.1, 3.2
 */

/** TMDB API response types */
export interface TMDBPaginatedResponse<T> {
  page: number;
  results: T[];
  total_pages: number;
  total_results: number;
}

export interface TMDBMovieResult {
  id: number;
  title: string;
  original_title: string;
  poster_path: string | null;
  backdrop_path: string | null;
  overview: string;
  release_date: string;
  vote_average: number;
  vote_count: number;
  genre_ids: number[];
  adult: boolean;
}

export interface TMDBTVResult {
  id: number;
  name: string;
  original_name: string;
  poster_path: string | null;
  backdrop_path: string | null;
  overview: string;
  first_air_date: string;
  vote_average: number;
  vote_count: number;
  genre_ids: number[];
}

export interface TMDBMultiResult extends TMDBMovieResult, TMDBTVResult {
  media_type: 'movie' | 'tv' | 'person';
}

export interface TMDBMovieDetails {
  id: number;
  title: string;
  original_title: string;
  poster_path: string | null;
  backdrop_path: string | null;
  overview: string;
  release_date: string;
  vote_average: number;
  vote_count: number;
  genres: Array<{ id: number; name: string }>;
  runtime: number | null;
  tagline: string;
  status: string;
  production_countries: Array<{ iso_3166_1: string; name: string }>;
  spoken_languages: Array<{ iso_639_1: string; name: string; english_name: string }>;
  budget: number;
  revenue: number;
}

export interface TMDBTVDetails {
  id: number;
  name: string;
  original_name: string;
  poster_path: string | null;
  backdrop_path: string | null;
  overview: string;
  first_air_date: string;
  vote_average: number;
  vote_count: number;
  genres: Array<{ id: number; name: string }>;
  episode_run_time: number[];
  tagline: string;
  status: string;
  production_countries: Array<{ iso_3166_1: string; name: string }>;
  spoken_languages: Array<{ iso_639_1: string; name: string; english_name: string }>;
  number_of_seasons: number;
  number_of_episodes: number;
}

export interface TMDBCreditsResponse {
  id: number;
  cast: Array<{
    id: number;
    name: string;
    character: string;
    profile_path: string | null;
    order: number;
  }>;
}

export interface TMDBWatchProvidersResponse {
  id: number;
  results: Record<string, {
    link: string;
    flatrate?: Array<{
      provider_id: number;
      provider_name: string;
      logo_path: string;
    }>;
    rent?: Array<{
      provider_id: number;
      provider_name: string;
      logo_path: string;
    }>;
    buy?: Array<{
      provider_id: number;
      provider_name: string;
      logo_path: string;
    }>;
  }>;
}

export interface TMDBVideosResponse {
  id: number;
  results: Array<{
    key: string;
    site: string;
    type: string;
    official: boolean;
  }>;
}