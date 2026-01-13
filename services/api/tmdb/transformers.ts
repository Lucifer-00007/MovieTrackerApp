/**
 * TMDB API Data Transformers
 * Functions to transform TMDB API responses to app types
 * 
 * Requirements: 1.1, 3.2
 */

import type {
  MediaItem,
  TrendingItem,
  MediaDetails,
  CastMember,
  StreamingProvider,
} from '@/types/media';
import type {
  TMDBMovieResult,
  TMDBTVResult,
  TMDBMultiResult,
  TMDBMovieDetails,
  TMDBTVDetails,
  TMDBCreditsResponse,
  TMDBWatchProvidersResponse,
} from './types';

/**
 * Transform TMDB movie result to MediaItem
 */
export function transformMovieToMediaItem(movie: TMDBMovieResult, rank?: number): MediaItem | TrendingItem {
  const base: MediaItem = {
    id: movie.id,
    title: movie.title,
    originalTitle: movie.original_title,
    posterPath: movie.poster_path,
    backdropPath: movie.backdrop_path,
    overview: movie.overview,
    releaseDate: movie.release_date || '',
    voteAverage: movie.vote_average || null,
    voteCount: movie.vote_count,
    mediaType: 'movie',
    genreIds: movie.genre_ids,
  };

  if (rank !== undefined) {
    return { ...base, rank } as TrendingItem;
  }
  return base;
}

/**
 * Transform TMDB TV result to MediaItem
 */
export function transformTVToMediaItem(tv: TMDBTVResult, rank?: number): MediaItem | TrendingItem {
  const base: MediaItem = {
    id: tv.id,
    title: tv.name,
    originalTitle: tv.original_name,
    posterPath: tv.poster_path,
    backdropPath: tv.backdrop_path,
    overview: tv.overview,
    releaseDate: tv.first_air_date || '',
    voteAverage: tv.vote_average || null,
    voteCount: tv.vote_count,
    mediaType: 'tv',
    genreIds: tv.genre_ids,
  };

  if (rank !== undefined) {
    return { ...base, rank } as TrendingItem;
  }
  return base;
}

/**
 * Transform TMDB multi result to MediaItem
 */
export function transformMultiToMediaItem(item: TMDBMultiResult): MediaItem | null {
  if (item.media_type === 'movie') {
    return transformMovieToMediaItem(item);
  }
  if (item.media_type === 'tv') {
    return transformTVToMediaItem(item);
  }
  return null; // Skip person results
}

/**
 * Transform TMDB movie details to MediaDetails
 */
export function transformMovieDetails(response: TMDBMovieDetails): MediaDetails {
  return {
    id: response.id,
    title: response.title,
    originalTitle: response.original_title,
    posterPath: response.poster_path,
    backdropPath: response.backdrop_path,
    overview: response.overview,
    releaseDate: response.release_date || '',
    voteAverage: response.vote_average || null,
    voteCount: response.vote_count,
    mediaType: 'movie',
    genreIds: response.genres.map(g => g.id),
    runtime: response.runtime,
    genres: response.genres.map(g => ({ id: g.id, name: g.name })),
    tagline: response.tagline || '',
    status: response.status,
    productionCountries: response.production_countries.map(c => ({
      iso_3166_1: c.iso_3166_1,
      name: c.name,
    })),
    spokenLanguages: response.spoken_languages.map(l => ({
      iso_639_1: l.iso_639_1,
      name: l.name,
      englishName: l.english_name,
    })),
    budget: response.budget,
    revenue: response.revenue,
  };
}

/**
 * Transform TMDB TV details to MediaDetails
 */
export function transformTVDetails(response: TMDBTVDetails): MediaDetails {
  return {
    id: response.id,
    title: response.name,
    originalTitle: response.original_name,
    posterPath: response.poster_path,
    backdropPath: response.backdrop_path,
    overview: response.overview,
    releaseDate: response.first_air_date || '',
    voteAverage: response.vote_average || null,
    voteCount: response.vote_count,
    mediaType: 'tv',
    genreIds: response.genres.map(g => g.id),
    runtime: response.episode_run_time[0] || null,
    genres: response.genres.map(g => ({ id: g.id, name: g.name })),
    tagline: response.tagline || '',
    status: response.status,
    productionCountries: response.production_countries.map(c => ({
      iso_3166_1: c.iso_3166_1,
      name: c.name,
    })),
    spokenLanguages: response.spoken_languages.map(l => ({
      iso_639_1: l.iso_639_1,
      name: l.name,
      englishName: l.english_name,
    })),
    numberOfSeasons: response.number_of_seasons,
    numberOfEpisodes: response.number_of_episodes,
  };
}

/**
 * Transform TMDB credits response to CastMember array
 */
export function transformCredits(response: TMDBCreditsResponse): CastMember[] {
  return response.cast.map(member => ({
    id: member.id,
    name: member.name,
    character: member.character,
    profilePath: member.profile_path,
    order: member.order,
  }));
}

/**
 * Transform TMDB watch providers response to StreamingProvider array
 */
export function transformWatchProviders(
  response: TMDBWatchProvidersResponse,
  countryCode: string = 'US'
): StreamingProvider[] {
  const countryData = response.results[countryCode];
  if (!countryData) {
    return [];
  }

  const providers: StreamingProvider[] = [];
  const link = countryData.link;

  // Add flatrate (subscription) providers
  countryData.flatrate?.forEach(p => {
    providers.push({
      providerId: p.provider_id,
      providerName: p.provider_name,
      logoPath: p.logo_path,
      link,
      type: 'flatrate',
      isAvailable: true,
    });
  });

  // Add rent providers
  countryData.rent?.forEach(p => {
    providers.push({
      providerId: p.provider_id,
      providerName: p.provider_name,
      logoPath: p.logo_path,
      link,
      type: 'rent',
      isAvailable: true,
    });
  });

  // Add buy providers
  countryData.buy?.forEach(p => {
    providers.push({
      providerId: p.provider_id,
      providerName: p.provider_name,
      logoPath: p.logo_path,
      link,
      type: 'buy',
      isAvailable: true,
    });
  });

  return providers;
}