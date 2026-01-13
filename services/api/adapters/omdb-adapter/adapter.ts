/**
 * OMDb Adapter Main Implementation
 * Combines all modular methods into the MediaApiAdapter interface
 */

import type { MediaApiAdapter } from '../../types';
import { getTrending } from './trending';
import { getMovieDetails, getTvDetails } from './details';
import { searchMulti } from './search';
import { getMovieCredits, getTvCredits } from './credits';
import { getWatchProviders } from './streaming';
import { getRecommendations, discoverByCountry, getTrailerKey } from './recommendations';
import { getImageUrl } from './images';

export const omdbAdapter: MediaApiAdapter = {
  getTrending,
  getMovieDetails,
  getTvDetails,
  searchMulti,
  getMovieCredits,
  getTvCredits,
  getWatchProviders,
  getRecommendations,
  discoverByCountry,
  getTrailerKey,
  getImageUrl,
};