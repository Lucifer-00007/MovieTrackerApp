/**
 * TrailerPlayer Component
 * Video player for YouTube trailers using expo-av
 * Provides play/pause, seek, and fullscreen controls
 * 
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5
 */

import { useCallback, useRef, useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';

import { useThemeColor } from '@/hooks/use-theme-color';
import { Spacing, BorderRadius, Typography, AnimationDurations } from '@/constants/theme';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { logTrailerTap } from '@/services/analytics';
import {
  getYouTubeEmbedUrl,
  formatTime,
  calculateProgress,
  calculateSeekPosition,
} from './trailer-utils';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

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

export function TrailerPlayer({
  videoKey,
  mediaId,
  mediaType,
  sourceScreen = 'trailer_player',
  autoPlay = true,
  onVideoEnd,
  onClose,
  onError,
  testID,
}: TrailerPlayerProps) {
  const videoRef = useRef<Video>(null);
  const controlsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const tintColor = useThemeColor({}, 'tint');
  const errorColor = useThemeColor({}, 'error');

  const [state, setState] = useState<TrailerPlayerState>({
    isPlaying: autoPlay,
    isLoading: true,
    isBuffering: false,
    hasError: false,
    errorMessage: null,
    duration: 0,
    position: 0,
    showControls: true,
  });

  // Auto-hide controls after 3 seconds
  const resetControlsTimeout = useCallback(() => {
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => {
      if (state.isPlaying) {
        setState(prev => ({ ...prev, showControls: false }));
      }
    }, 3000);
  }, [state.isPlaying]);

  // Show controls and reset timeout
  const showControls = useCallback(() => {
    setState(prev => ({ ...prev, showControls: true }));
    resetControlsTimeout();
  }, [resetControlsTimeout]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, []);

  // Handle playback status updates
  const handlePlaybackStatusUpdate = useCallback((status: AVPlaybackStatus) => {
    if (!status.isLoaded) {
      if (status.error) {
        const errorMsg = `Playback error: ${status.error}`;
        setState(prev => ({
          ...prev,
          hasError: true,
          errorMessage: errorMsg,
          isLoading: false,
        }));
        onError?.(errorMsg);
      }
      return;
    }

    setState(prev => ({
      ...prev,
      isPlaying: status.isPlaying,
      isLoading: false,
      isBuffering: status.isBuffering,
      duration: status.durationMillis ? status.durationMillis / 1000 : 0,
      position: status.positionMillis ? status.positionMillis / 1000 : 0,
    }));

    if (status.didJustFinish) {
      onVideoEnd?.();
    }
  }, [onVideoEnd, onError]);

  // Toggle play/pause
  const togglePlayPause = useCallback(async () => {
    if (!videoRef.current) return;
    
    try {
      if (state.isPlaying) {
        await videoRef.current.pauseAsync();
      } else {
        await videoRef.current.playAsync();
        
        // Log analytics event when trailer starts playing
        if (mediaId && mediaType) {
          logTrailerTap(mediaId, mediaType, sourceScreen);
        }
      }
      showControls();
    } catch (error) {
      console.error('Error toggling playback:', error);
    }
  }, [state.isPlaying, showControls, mediaId, mediaType, sourceScreen]);

  // Seek to position
  const seekTo = useCallback(async (position: number) => {
    if (!videoRef.current) return;
    
    try {
      await videoRef.current.setPositionAsync(position * 1000);
      showControls();
    } catch (error) {
      console.error('Error seeking:', error);
    }
  }, [showControls]);

  // Handle seek bar press
  const handleSeekBarPress = useCallback((event: { nativeEvent: { locationX: number } }) => {
    const seekBarWidth = SCREEN_WIDTH - Spacing.lg * 2;
    const newPosition = calculateSeekPosition(
      event.nativeEvent.locationX,
      seekBarWidth,
      state.duration
    );
    seekTo(newPosition);
  }, [state.duration, seekTo]);

  // Retry loading
  const handleRetry = useCallback(async () => {
    setState(prev => ({
      ...prev,
      hasError: false,
      errorMessage: null,
      isLoading: true,
    }));
    
    if (videoRef.current) {
      try {
        await videoRef.current.unloadAsync();
        await videoRef.current.loadAsync(
          { uri: getYouTubeEmbedUrl(videoKey) },
          { shouldPlay: autoPlay }
        );
      } catch (error) {
        const errorMsg = 'Failed to reload video';
        setState(prev => ({
          ...prev,
          hasError: true,
          errorMessage: errorMsg,
          isLoading: false,
        }));
        onError?.(errorMsg);
      }
    }
  }, [videoKey, autoPlay, onError]);

  const progress = calculateProgress(state.position, state.duration);

  // Error state
  if (state.hasError) {
    return (
      <View 
        style={[styles.container, { backgroundColor }]}
        testID={testID}
      >
        <View style={styles.errorContainer}>
          <IconSymbol name="exclamationmark.triangle" size={48} color={errorColor} />
          <Text style={[styles.errorTitle, { color: textColor }]}>
            Trailer Unavailable
          </Text>
          <Text style={[styles.errorMessage, { color: textSecondary }]}>
            {state.errorMessage || 'Unable to load the trailer. Please try again.'}
          </Text>
          <View style={styles.errorActions}>
            <Pressable
              onPress={handleRetry}
              style={[styles.retryButton, { backgroundColor: tintColor }]}
              accessibilityRole="button"
              accessibilityLabel="Retry loading trailer"
              testID={testID ? `${testID}-retry` : undefined}
            >
              <Text style={styles.retryButtonText}>Retry</Text>
            </Pressable>
            {onClose && (
              <Pressable
                onPress={onClose}
                style={[styles.dismissButton, { borderColor: textSecondary }]}
                accessibilityRole="button"
                accessibilityLabel="Dismiss"
                testID={testID ? `${testID}-dismiss` : undefined}
              >
                <Text style={[styles.dismissButtonText, { color: textSecondary }]}>
                  Dismiss
                </Text>
              </Pressable>
            )}
          </View>
        </View>
      </View>
    );
  }

  return (
    <Pressable
      style={[styles.container, { backgroundColor: '#000000' }]}
      onPress={showControls}
      testID={testID}
    >
      {/* Video Player */}
      <Video
        ref={videoRef}
        source={{ uri: getYouTubeEmbedUrl(videoKey) }}
        style={styles.video}
        resizeMode={ResizeMode.CONTAIN}
        shouldPlay={autoPlay}
        isLooping={false}
        onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
        useNativeControls={false}
        testID={testID ? `${testID}-video` : undefined}
      />

      {/* Loading Indicator */}
      {(state.isLoading || state.isBuffering) && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#FFFFFF" />
          <Text style={styles.loadingText}>
            {state.isBuffering ? 'Buffering...' : 'Loading...'}
          </Text>
        </View>
      )}

      {/* Controls Overlay */}
      {state.showControls && !state.isLoading && (
        <View style={styles.controlsOverlay}>
          {/* Top Bar - Close Button */}
          {onClose && (
            <View style={styles.topBar}>
              <Pressable
                onPress={onClose}
                style={styles.closeButton}
                accessibilityRole="button"
                accessibilityLabel="Close trailer"
                testID={testID ? `${testID}-close` : undefined}
              >
                <IconSymbol name="xmark" size={24} color="#FFFFFF" />
              </Pressable>
            </View>
          )}

          {/* Center - Play/Pause Button */}
          <View style={styles.centerControls}>
            <Pressable
              onPress={togglePlayPause}
              style={styles.playPauseButton}
              accessibilityRole="button"
              accessibilityLabel={state.isPlaying ? 'Pause' : 'Play'}
              testID={testID ? `${testID}-play-pause` : undefined}
            >
              <IconSymbol
                name={state.isPlaying ? 'pause.fill' : 'play.fill'}
                size={48}
                color="#FFFFFF"
              />
            </Pressable>
          </View>

          {/* Bottom Bar - Seek Bar and Time */}
          <View style={styles.bottomBar}>
            {/* Current Time */}
            <Text style={styles.timeText} testID={testID ? `${testID}-current-time` : undefined}>
              {formatTime(state.position)}
            </Text>

            {/* Seek Bar */}
            <Pressable
              style={styles.seekBarContainer}
              onPress={handleSeekBarPress}
              accessibilityRole="adjustable"
              accessibilityLabel={`Video progress: ${Math.round(progress)}%`}
              testID={testID ? `${testID}-seek-bar` : undefined}
            >
              <View style={styles.seekBarBackground}>
                <View
                  style={[styles.seekBarProgress, { width: `${progress}%` }]}
                />
                <View
                  style={[
                    styles.seekBarThumb,
                    { left: `${progress}%` },
                  ]}
                />
              </View>
            </Pressable>

            {/* Duration */}
            <Text style={styles.timeText} testID={testID ? `${testID}-duration` : undefined}>
              {formatTime(state.duration)}
            </Text>
          </View>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: Typography.sizes.md,
    marginTop: Spacing.sm,
  },
  controlsOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: Spacing.md,
    paddingTop: Spacing.xl,
  },
  closeButton: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: BorderRadius.full,
  },
  centerControls: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playPauseButton: {
    minWidth: 80,
    minHeight: 80,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: BorderRadius.full,
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    paddingBottom: Spacing.xl,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  timeText: {
    color: '#FFFFFF',
    fontSize: Typography.sizes.sm,
    minWidth: 45,
    textAlign: 'center',
  },
  seekBarContainer: {
    flex: 1,
    height: 44,
    justifyContent: 'center',
    marginHorizontal: Spacing.sm,
  },
  seekBarBackground: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
    position: 'relative',
  },
  seekBarProgress: {
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 2,
  },
  seekBarThumb: {
    position: 'absolute',
    top: -6,
    width: 16,
    height: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    marginLeft: -8,
  },
  errorContainer: {
    alignItems: 'center',
    padding: Spacing.xl,
  },
  errorTitle: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.bold,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  errorMessage: {
    fontSize: Typography.sizes.md,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  errorActions: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  retryButton: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    minWidth: 100,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.semibold,
  },
  dismissButton: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    minWidth: 100,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dismissButtonText: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.semibold,
  },
});

export default TrailerPlayer;
