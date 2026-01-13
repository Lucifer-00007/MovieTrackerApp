/**
 * Trailer utility functions
 * Pure functions for trailer player logic
 * 
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5
 */

import { YOUTUBE_EMBED_URL } from '@/constants/api';

/**
 * Get YouTube embed URL from video key
 * @param videoKey - YouTube video ID
 * @returns Full YouTube embed URL
 */
export function getYouTubeEmbedUrl(videoKey: string): string {
  if (!videoKey || videoKey.trim() === '') {
    return '';
  }
  return YOUTUBE_EMBED_URL(videoKey);
}

/**
 * Format time in seconds to MM:SS format
 * @param seconds - Time in seconds
 * @returns Formatted time string
 */
export function formatTime(seconds: number): string {
  if (!isFinite(seconds) || seconds < 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Calculate progress percentage
 * @param position - Current position in seconds
 * @param duration - Total duration in seconds
 * @returns Progress percentage (0-100)
 */
export function calculateProgress(position: number, duration: number): number {
  if (duration <= 0 || !isFinite(duration)) return 0;
  if (position < 0 || !isFinite(position)) return 0;
  return Math.min(100, Math.max(0, (position / duration) * 100));
}

/**
 * Determine if trailer button should be visible
 * Based on Property 13: Trailer Button Visibility
 * @param trailerKey - YouTube video key or null
 * @returns true if play button should be visible
 */
export function shouldShowTrailerButton(trailerKey: string | null | undefined): boolean {
  return trailerKey !== null && trailerKey !== undefined && trailerKey.trim() !== '';
}

/**
 * Validate YouTube video key format
 * YouTube video IDs are typically 11 characters
 * @param videoKey - Video key to validate
 * @returns true if valid format
 */
export function isValidVideoKey(videoKey: string | null | undefined): boolean {
  if (!videoKey) return false;
  const trimmed = videoKey.trim();
  // YouTube video IDs are typically 11 characters, alphanumeric with - and _
  return trimmed.length > 0 && /^[a-zA-Z0-9_-]+$/.test(trimmed);
}

/**
 * Calculate seek position from touch event
 * @param touchX - X coordinate of touch
 * @param seekBarWidth - Width of seek bar
 * @param duration - Total video duration
 * @returns New position in seconds
 */
export function calculateSeekPosition(
  touchX: number,
  seekBarWidth: number,
  duration: number
): number {
  if (seekBarWidth <= 0 || duration <= 0) return 0;
  const percentage = Math.max(0, Math.min(1, touchX / seekBarWidth));
  return percentage * duration;
}
