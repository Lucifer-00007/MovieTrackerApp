/**
 * API constants
 * URLs and endpoints used throughout the app
 */

/** Base API URLs */
export const API_BASE_URLS = {
  TMDB: process.env.EXPO_PUBLIC_TMDB_API_URL || 'https://api.themoviedb.org/3',
  OMDB: process.env.EXPO_PUBLIC_OMDB_API_URL || 'https://www.omdbapi.com',
  CLOUDFLARE: process.env.EXPO_PUBLIC_CLOUDFLARE_API_URL || 'https://movie-api-worker.cloud-worker-api.workers.dev',
  ANALYTICS: process.env.EXPO_PUBLIC_ANALYTICS_API_URL || 'https://api.moviestream.app/analytics',
  TMDB_IMAGES: 'https://image.tmdb.org/t/p',
} as const;

/** Documentation URLs */
export const DOC_URLS = {
  EXPO_ROUTER: 'https://docs.expo.dev/router/introduction',
  REACT_NATIVE_IMAGES: 'https://reactnative.dev/docs/images',
  EXPO_COLOR_SCHEMES: 'https://docs.expo.dev/develop/user-interface/color-themes/',
} as const;

/** Streaming service URLs */
export const STREAMING_URLS = {
  NETFLIX: 'https://netflix.com',
  DISNEY_PLUS: 'https://disneyplus.com',
  HULU: 'https://hulu.com',
  PRIME_VIDEO: 'https://primevideo.com',
  BBC_IPLAYER: 'https://bbc.co.uk/iplayer',
  CRAVE: 'https://crave.ca',
} as const;

/** API Headers */
export const API_HEADERS = {
  RATE_LIMIT_REMAINING: 'X-RateLimit-Remaining',
} as const;

/** YouTube embed URL template */
export const YOUTUBE_EMBED_URL = (videoKey: string) =>
  `https://www.youtube.com/embed/${videoKey}?autoplay=1&controls=1&showinfo=0&rel=0&iv_load_policy=3&modestbranding=1`;

/** TMDB image URL template */
export const TMDB_IMAGE_URL = (size: string, path: string) =>
  `${API_BASE_URLS.TMDB_IMAGES}/${size}${path}`;