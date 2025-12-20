/**
 * Media type definitions for MovieStream MVP
 * Defines core media entities: movies, TV shows, and related data
 */

/** Genre classification */
export interface Genre {
  id: number;
  name: string;
}

/** Country information */
export interface Country {
  iso_3166_1: string;
  name: string;
}

/** Language information */
export interface Language {
  iso_639_1: string;
  name: string;
  englishName: string;
}

/** Base media item displayed in cards and lists */
export interface MediaItem {
  id: number;
  title: string;
  originalTitle: string;
  posterPath: string | null;
  backdropPath: string | null;
  overview: string;
  releaseDate: string;
  voteAverage: number | null;
  voteCount: number;
  mediaType: 'movie' | 'tv';
  genreIds: number[];
  ageRating?: string | null;
}

/** Trending item with rank position */
export interface TrendingItem extends MediaItem {
  rank: number;
}

/** Full media details for detail pages */
export interface MediaDetails extends MediaItem {
  runtime: number | null;
  genres: Genre[];
  tagline: string;
  status: string;
  productionCountries: Country[];
  spokenLanguages: Language[];
  budget?: number;
  revenue?: number;
  numberOfSeasons?: number;
  numberOfEpisodes?: number;
}

/** Cast member information */
export interface CastMember {
  id: number;
  name: string;
  character: string;
  profilePath: string | null;
  order: number;
}

/** Streaming provider information */
export interface StreamingProvider {
  providerId: number;
  providerName: string;
  logoPath: string;
  link: string;
  type: 'flatrate' | 'rent' | 'buy';
  isAvailable: boolean;
}

/** Country hub configuration */
export interface CountryConfig {
  code: string;
  name: string;
  flag: string;
  region: string;
}

/** Supported countries for country hubs */
export const SUPPORTED_COUNTRIES: CountryConfig[] = [
  { code: 'US', name: 'United States', flag: '🇺🇸', region: 'en-US' },
  { code: 'JP', name: 'Japan', flag: '🇯🇵', region: 'ja-JP' },
  { code: 'IN', name: 'India', flag: '🇮🇳', region: 'hi-IN' },
  { code: 'CN', name: 'China', flag: '🇨🇳', region: 'zh-CN' },
  { code: 'RU', name: 'Russia', flag: '🇷🇺', region: 'ru-RU' },
  { code: 'ES', name: 'Spain', flag: '🇪🇸', region: 'es-ES' },
  { code: 'DE', name: 'Germany', flag: '🇩🇪', region: 'de-DE' },
];
