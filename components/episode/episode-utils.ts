/**
 * Episode utility functions
 */

import { API_BASE_URLS } from '@/constants/api';

/** Check if mock data mode */
export function isMockDataMode(): boolean {
  return process.env.EXPO_PUBLIC_USE_MOCK_DATA === 'true';
}

/** Get image URL */
export function getImageUrl(path: string | null, size: string = 'w780'): string | null {
  if (!path) return null;
  if (isMockDataMode()) return 'placeholder';
  return `${API_BASE_URLS.TMDB_IMAGES}/${size}${path}`;
}

/** Format air date */
export function formatAirDate(dateString: string): string {
  if (!dateString) return 'TBA';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    weekday: 'long',
    month: 'long', 
    day: 'numeric', 
    year: 'numeric' 
  });
}

/** Format runtime */
export function formatRuntime(minutes: number | null): string {
  if (!minutes) return '';
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}
