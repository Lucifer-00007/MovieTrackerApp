/**
 * Cloudflare Worker API Adapter
 * Maps Cloudflare API responses to the MediaApiAdapter interface
 */

import type { MediaApiAdapter, PaginatedResponse } from '../types';
import type {
  TrendingItem,
  MediaDetails,
  CastMember,
  StreamingProvider,
  MediaItem,
} from '@/types/media';
import type { SearchResults } from '@/types/user';
import type {
  CFMovieResult,
  CFMovieDetails,
  CFTVShowResult,
  CFTVShowDetails,
} from '../cloudflare-types';
import * as cf from '../cloudflare';

// ============================================================================
// Transformers
// ============================================================================

/** Transform Cloudflare movie result to MediaItem */
function transformMovieResult(movie: CFMovieResult, rank?: number): MediaItem | TrendingItem {
  const base: MediaItem = {
    id: movie.id,
    title: movie.title,
    originalTitle: movie.title,
    posterPath: movie.posterPath,
    backdropPath: movie.backdropPath,
    overview: movie.overview,
    releaseDate: movie.releaseDate,
    voteAverage: movie.voteAverage,
    voteCount: movie.voteCount,
    mediaType: 'movie',
    genreIds: movie.genreIds,
  };

  if (rank !== undefined) {
    return { ...base, rank } as TrendingItem;
  }
  return base;
}

/** Transform Cloudflare TV result to MediaItem */
function transformTVResult(tv: CFTVShowResult, rank?: number): MediaItem | TrendingItem {
  const base: MediaItem = {
    id: tv.id,
    title: tv.name,
    originalTitle: tv.name,
    posterPath: tv.posterPath,
    backdropPath: tv.backdropPath,
    overview: tv.overview,
    releaseDate: tv.firstAirDate,
    voteAverage: tv.voteAverage,
    voteCount: tv.voteCount,
    mediaType: 'tv',
    genreIds: tv.genreIds,
  };

  if (rank !== undefined) {
    return { ...base, rank } as TrendingItem;
  }
  return base;
}

/** Transform Cloudflare movie details to MediaDetails */
function transformMovieDetails(movie: CFMovieDetails): MediaDetails {
  return {
    id: movie.id,
    title: movie.title,
    originalTitle: movie.title,
    posterPath: movie.posterPath,
    backdropPath: movie.backdropPath,
    overview: movie.overview,
    releaseDate: movie.releaseDate,
    voteAverage: movie.voteAverage,
    voteCount: movie.voteCount,
    mediaType: 'movie',
    genreIds: movie.genres.map((g) => g.id),
    runtime: movie.runtime,
    genres: movie.genres,
    tagline: movie.tagline,
    status: movie.status,
    productionCountries: [],
    spokenLanguages: movie.spokenLanguages.map((l) => ({
      iso_639_1: l.iso_639_1,
      name: l.name,
      englishName: l.name,
    })),
    budget: movie.budget,
    revenue: movie.revenue,
  };
}

/** Transform Cloudflare TV details to MediaDetails */
function transformTVDetails(tv: CFTVShowDetails): MediaDetails {
  return {
    id: tv.id,
    title: tv.name,
    originalTitle: tv.name,
    posterPath: tv.posterPath,
    backdropPath: tv.backdropPath,
    overview: tv.overview,
    releaseDate: tv.firstAirDate,
    voteAverage: tv.voteAverage,
    voteCount: tv.voteCount,
    mediaType: 'tv',
    genreIds: tv.genres.map((g) => g.id),
    runtime: tv.episodeRunTime[0] ?? null,
    genres: tv.genres,
    tagline: tv.tagline,
    status: tv.status,
    productionCountries: [],
    spokenLanguages: [],
    numberOfSeasons: tv.numberOfSeasons,
    numberOfEpisodes: tv.numberOfEpisodes,
  };
}

/** Transform Cloudflare cast to CastMember */
function transformCast(
  credits: { cast: { id: number; name: string; character: string; profilePath: string | null }[] } | null
): CastMember[] {
  if (!credits?.cast) return [];
  
  return credits.cast.map((member, index) => ({
    id: member.id,
    name: member.name,
    character: member.character,
    profilePath: member.profilePath,
    order: index,
  }));
}

// ============================================================================
// Adapter Implementation
// ============================================================================

export const cloudflareAdapter: MediaApiAdapter = {
  async getTrending(
    mediaType: 'all' | 'movie' | 'tv',
    timeWindow: 'day' | 'week',
    page: number
  ): Promise<PaginatedResponse<TrendingItem>> {
    // Cloudflare API has separate endpoints for movies and TV
    // For 'all', we fetch both and merge
    if (mediaType === 'all') {
      const [movies, tvShows] = await Promise.all([
        cf.getTrendingMovies(timeWindow, page),
        cf.getTrendingTVShows(timeWindow, page),
      ]);

      const movieItems = movies.data.map((m, i) => transformMovieResult(m, i + 1) as TrendingItem);
      const tvItems = tvShows.data.map((t, i) => transformTVResult(t, movieItems.length + i + 1) as TrendingItem);

      // Interleave results for variety
      const items: TrendingItem[] = [];
      const maxLen = Math.max(movieItems.length, tvItems.length);
      for (let i = 0; i < maxLen; i++) {
        if (movieItems[i]) items.push({ ...movieItems[i], rank: items.length + 1 });
        if (tvItems[i]) items.push({ ...tvItems[i], rank: items.length + 1 });
      }

      return {
        items,
        totalPages: Math.max(movies.totalPages, tvShows.totalPages),
        totalResults: movies.totalResults + tvShows.totalResults,
      };
    }

    if (mediaType === 'movie') {
      const result = await cf.getTrendingMovies(timeWindow, page);
      return {
        items: result.data.map((m, i) => transformMovieResult(m, (page - 1) * 20 + i + 1) as TrendingItem),
        totalPages: result.totalPages,
        totalResults: result.totalResults,
      };
    }

    const result = await cf.getTrendingTVShows(timeWindow, page);
    return {
      items: result.data.map((t, i) => transformTVResult(t, (page - 1) * 20 + i + 1) as TrendingItem),
      totalPages: result.totalPages,
      totalResults: result.totalResults,
    };
  },

  async getMovieDetails(movieId: number): Promise<MediaDetails> {
    const details = await cf.getMovieDetails(movieId);
    return transformMovieDetails(details);
  },

  async getTvDetails(tvId: number): Promise<MediaDetails> {
    const details = await cf.getTVShowDetails(tvId);
    return transformTVDetails(details);
  },

  async searchMulti(query: string, page: number): Promise<SearchResults> {
    if (!query.trim()) {
      return {
        movies: [],
        tvShows: [],
        totalResults: 0,
        page: 1,
        totalPages: 0,
      };
    }

    // Cloudflare API has separate search endpoints
    const [movieResults, tvResults] = await Promise.all([
      cf.searchMovies(query, page),
      cf.searchTVShows(query, page),
    ]);

    return {
      movies: movieResults.data.map((m) => transformMovieResult(m)),
      tvShows: tvResults.data.map((t) => transformTVResult(t)),
      totalResults: movieResults.totalResults + tvResults.totalResults,
      page,
      totalPages: Math.max(movieResults.totalPages, tvResults.totalPages),
    };
  },

  async getMovieCredits(movieId: number): Promise<CastMember[]> {
    // Credits are included in movie details with append=credits
    const details = await cf.getMovieDetails(movieId, 'credits');
    return transformCast(details.credits);
  },

  async getTvCredits(tvId: number): Promise<CastMember[]> {
    // Credits are included in TV details with append=credits
    const details = await cf.getTVShowDetails(tvId, 'credits');
    return transformCast(details.credits);
  },

  async getWatchProviders(
    _mediaType: 'movie' | 'tv',
    _mediaId: number,
    _countryCode: string
  ): Promise<StreamingProvider[]> {
    // Cloudflare API doesn't have watch providers endpoint
    // Return empty array - this could be supplemented with another service
    return [];
  },

  async getRecommendations(
    mediaType: 'movie' | 'tv',
    mediaId: number,
    _page: number
  ): Promise<PaginatedResponse<MediaItem>> {
    // Similar items are included in details response (max 6)
    if (mediaType === 'movie') {
      const details = await cf.getMovieDetails(mediaId, 'similar');
      return {
        items: details.similar.map((m) => transformMovieResult(m)),
        totalPages: 1,
        totalResults: details.similar.length,
      };
    }

    const details = await cf.getTVShowDetails(mediaId, 'similar');
    return {
      items: details.similar.map((t) => transformTVResult(t)),
      totalPages: 1,
      totalResults: details.similar.length,
    };
  },

  async discoverByCountry(
    mediaType: 'movie' | 'tv',
    countryCode: string,
    options: {
      page?: number;
      genre?: number;
      year?: number;
      sortBy?: string;
    }
  ): Promise<PaginatedResponse<TrendingItem>> {
    const { page = 1, genre, year, sortBy } = options;

    // Map country code to Cloudflare region key
    const regionMap: Record<string, string> = {
      US: 'hollywood',
      IN: 'bollywood',
      JP: 'japanese',
      KR: 'korean',
      CN: 'chinese',
      FR: 'french',
      DE: 'german',
      ES: 'spanish',
      IT: 'italian',
      RU: 'russian',
      TR: 'turkish',
    };

    const region = regionMap[countryCode] || countryCode.toLowerCase();

    if (mediaType === 'movie') {
      const result = await cf.discoverMovies({
        page,
        genre,
        year,
        sort_by: sortBy as 'popularity.desc' | undefined,
        region,
      });

      return {
        items: result.data.map((m, i) => transformMovieResult(m, (page - 1) * 20 + i + 1) as TrendingItem),
        totalPages: result.totalPages,
        totalResults: result.totalResults,
      };
    }

    const result = await cf.discoverTVShows({
      page,
      genre,
      year,
      sort_by: sortBy as 'popularity.desc' | undefined,
      region,
    });

    return {
      items: result.data.map((t, i) => transformTVResult(t, (page - 1) * 20 + i + 1) as TrendingItem),
      totalPages: result.totalPages,
      totalResults: result.totalResults,
    };
  },

  async getTrailerKey(mediaType: 'movie' | 'tv', mediaId: number): Promise<string | null> {
    // Videos are included in details response
    if (mediaType === 'movie') {
      const details = await cf.getMovieDetails(mediaId, 'videos');
      const trailer = details.videos.find((v) => v.type === 'Trailer') || details.videos[0];
      return trailer?.key ?? null;
    }

    const details = await cf.getTVShowDetails(mediaId, 'videos');
    const trailer = details.videos.find((v) => v.type === 'Trailer') || details.videos[0];
    return trailer?.key ?? null;
  },

  getImageUrl(path: string | null, size: string = 'w500'): string | null {
    // Cloudflare API returns full URLs, but we handle both cases
    if (!path) return null;
    if (path.startsWith('http')) return path;
    return `https://image.tmdb.org/t/p/${size}${path}`;
  },
};
