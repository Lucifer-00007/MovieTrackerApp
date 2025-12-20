/**
 * Media components barrel export
 */

export { MediaCard } from './MediaCard';
export type { MediaCardProps } from './MediaCard';
export {
  getVariantDimensions,
  getPosterUrl,
  formatRating,
  shouldShowRating,
  calculateTouchTarget,
  generateAccessibilityLabel,
  TMDB_IMAGE_BASE,
} from './media-card-utils';
export type { MediaCardVariant } from './media-card-utils';

export { HeroCarousel } from './HeroCarousel';
export type { HeroCarouselProps } from './HeroCarousel';

export { ContentRow } from './ContentRow';
export type { ContentRowProps } from './ContentRow';

export { TrailerPlayer } from './TrailerPlayer';
export type { TrailerPlayerProps, TrailerPlayerState } from './TrailerPlayer';
export {
  getYouTubeEmbedUrl,
  formatTime,
  calculateProgress,
  shouldShowTrailerButton,
  isValidVideoKey,
  calculateSeekPosition,
} from './trailer-utils';
