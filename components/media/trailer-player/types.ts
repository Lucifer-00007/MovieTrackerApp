/**
 * TrailerPlayer Types
 * Shared interfaces and types for trailer player components
 */

export interface TrailerPlayerProps {
  /** YouTube video key */
  videoKey: string;
  /** Media ID for analytics tracking */
  mediaId?: number;
  /** Media type for analytics tracking */
  mediaType?: 'movie' | 'tv';
  /** Source screen for analytics tracking */
  sourceScreen?: string;
  /** Whether to autoplay the video */
  autoPlay?: boolean;
  /** Callback when video ends */
  onVideoEnd?: () => void;
  /** Callback when close button is pressed */
  onClose?: () => void;
  /** Callback when error occurs */
  onError?: (error: string) => void;
  /** Test ID for testing */
  testID?: string;
}

export interface TrailerPlayerState {
  isPlaying: boolean;
  isLoading: boolean;
  isBuffering: boolean;
  hasError: boolean;
  errorMessage: string | null;
  duration: number;
  position: number;
  showControls: boolean;
}