/**
 * TrailerPlayer Component
 * Video player for YouTube trailers using expo-video
 * Shows mock UI when in mock data mode
 * 
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5
 */

import { useCallback, useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { Image } from 'expo-image';

import { useThemeColor } from '@/hooks/use-theme-color';
import { Spacing, BorderRadius, Typography } from '@/constants/theme';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { logTrailerTap } from '@/services/analytics';
import {
  getYouTubeEmbedUrl,
  formatTime,
  calculateProgress,
  calculateSeekPosition,
} from './trailer-utils';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

/** Check if mock data mode is enabled */
function isMockDataMode(): boolean {
  return process.env.EXPO_PUBLIC_USE_MOCK_DATA === 'true';
}

/** Placeholder image for mock mode */
const PLACEHOLDER_IMAGE = require('@/assets/images/placeholder-poster.png');

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

/**
 * Mock Trailer Player - shown when EXPO_PUBLIC_USE_MOCK_DATA=true
 */
function MockTrailerPlayer({
  onClose,
  onVideoEnd,
  testID,
}: Pick<TrailerPlayerProps, 'onClose' | 'onVideoEnd' | 'testID'>) {
  const textColor = useThemeColor({}, 'text');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const tintColor = useThemeColor({}, 'tint');
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);

  // Simulate playback progress
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          setIsPlaying(false);
          onVideoEnd?.();
          return 0;
        }
        return prev + 2;
      });
    }, 500);

    return () => clearInterval(interval);
  }, [isPlaying, onVideoEnd]);

  const togglePlayPause = () => {
    setIsPlaying(prev => !prev);
  };

  return (
    <View style={[styles.container, { backgroundColor: '#000000' }]} testID={testID}>
      {/* Background Image */}
      <Image
        source={PLACEHOLDER_IMAGE}
        style={styles.mockBackground}
        contentFit="cover"
      />

      {/* Overlay */}
      <View style={styles.mockOverlay}>
        {/* Mock Mode Badge */}
        <View style={styles.mockBadge}>
          <Text style={styles.mockBadgeText}>Mock Mode - No Video Available</Text>
        </View>

        {/* Close Button */}
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

        {/* Center Play Button */}
        <View style={styles.centerControls}>
          <Pressable
            onPress={togglePlayPause}
            style={[styles.playPauseButton, { backgroundColor: tintColor }]}
            accessibilityRole="button"
            accessibilityLabel={isPlaying ? 'Pause' : 'Play'}
            testID={testID ? `${testID}-play-pause` : undefined}
          >
            <IconSymbol
              name={isPlaying ? 'pause.fill' : 'play.fill'}
              size={48}
              color="#FFFFFF"
            />
          </Pressable>
          <Text style={styles.mockText}>
            {isPlaying ? 'Simulating playback...' : 'Tap to simulate playback'}
          </Text>
        </View>

        {/* Progress Bar */}
        <View style={styles.bottomBar}>
          <Text style={styles.timeText}>{formatTime((progress / 100) * 120)}</Text>
          <View style={styles.seekBarContainer}>
            <View style={styles.seekBarBackground}>
              <View style={[styles.seekBarProgress, { width: `${progress}%` }]} />
            </View>
          </View>
          <Text style={styles.timeText}>{formatTime(120)}</Text>
        </View>
      </View>
    </View>
  );
}

/**
 * Real Trailer Player - uses expo-video
 */
function RealTrailerPlayer({
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
  const controlsTimeoutRef = { current: null as ReturnType<typeof setTimeout> | null };

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

  // Dynamically import expo-video to avoid issues in mock mode
  const [VideoComponents, setVideoComponents] = useState<{
    useVideoPlayer: any;
    VideoView: any;
    useEvent: any;
  } | null>(null);

  useEffect(() => {
    const loadVideoComponents = async () => {
      try {
        const expoVideo = await import('expo-video');
        const expo = await import('expo');
        setVideoComponents({
          useVideoPlayer: expoVideo.useVideoPlayer,
          VideoView: expoVideo.VideoView,
          useEvent: expo.useEvent,
        });
      } catch (error) {
        console.error('Failed to load video components:', error);
        setState(prev => ({
          ...prev,
          hasError: true,
          errorMessage: 'Video player not available',
          isLoading: false,
        }));
        onError?.('Video player not available');
      }
    };

    loadVideoComponents();
  }, [onError]);

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

  const progress = calculateProgress(state.position, state.duration);

  // Loading video components
  if (!VideoComponents) {
    return (
      <View style={[styles.container, { backgroundColor: '#000000' }]} testID={testID}>
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#FFFFFF" />
          <Text style={styles.loadingText}>Loading player...</Text>
        </View>
      </View>
    );
  }

  // Error state
  if (state.hasError) {
    return (
      <View style={[styles.container, { backgroundColor }]} testID={testID}>
        <View style={styles.errorContainer}>
          <IconSymbol name="exclamationmark.triangle" size={48} color={errorColor} />
          <Text style={[styles.errorTitle, { color: textColor }]}>
            Trailer Unavailable
          </Text>
          <Text style={[styles.errorMessage, { color: textSecondary }]}>
            {state.errorMessage || 'Unable to load the trailer. Please try again.'}
          </Text>
          <View style={styles.errorActions}>
            {onClose && (
              <Pressable
                onPress={onClose}
                style={[styles.dismissButton, { backgroundColor: tintColor }]}
                accessibilityRole="button"
                accessibilityLabel="Close"
                testID={testID ? `${testID}-dismiss` : undefined}
              >
                <Text style={styles.retryButtonText}>Close</Text>
              </Pressable>
            )}
          </View>
        </View>
      </View>
    );
  }

  // Render with video player
  return (
    <VideoPlayerContent
      VideoComponents={VideoComponents}
      videoKey={videoKey}
      mediaId={mediaId}
      mediaType={mediaType}
      sourceScreen={sourceScreen}
      autoPlay={autoPlay}
      onVideoEnd={onVideoEnd}
      onClose={onClose}
      onError={onError}
      testID={testID}
    />
  );
}

/**
 * Video Player Content - rendered after video components are loaded
 */
function VideoPlayerContent({
  VideoComponents,
  videoKey,
  mediaId,
  mediaType,
  sourceScreen,
  autoPlay,
  onVideoEnd,
  onClose,
  onError,
  testID,
}: TrailerPlayerProps & { VideoComponents: any }) {
  const { useVideoPlayer, VideoView, useEvent } = VideoComponents;
  const controlsTimeoutRef = { current: null as ReturnType<typeof setTimeout> | null };

  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const tintColor = useThemeColor({}, 'tint');
  const errorColor = useThemeColor({}, 'error');

  const [state, setState] = useState<TrailerPlayerState>({
    isPlaying: autoPlay ?? true,
    isLoading: true,
    isBuffering: false,
    hasError: false,
    errorMessage: null,
    duration: 0,
    position: 0,
    showControls: true,
  });

  // Create video player
  const player = useVideoPlayer(getYouTubeEmbedUrl(videoKey), (p: any) => {
    p.loop = false;
    if (autoPlay) {
      p.play();
    }
  });

  // Listen to player status changes
  const { status } = useEvent(player, 'statusChange', { status: player.status });
  const { isPlaying } = useEvent(player, 'playingChange', { isPlaying: player.playing });

  // Update state based on player status
  useEffect(() => {
    if (status === 'loading') {
      setState(prev => ({ ...prev, isLoading: true }));
    } else if (status === 'readyToPlay') {
      setState(prev => ({
        ...prev,
        isLoading: false,
        duration: player.duration,
      }));
    } else if (status === 'error') {
      const errorMsg = 'Failed to load video';
      setState(prev => ({
        ...prev,
        hasError: true,
        errorMessage: errorMsg,
        isLoading: false,
      }));
      onError?.(errorMsg);
    }
  }, [status, player.duration, onError]);

  // Update playing state
  useEffect(() => {
    setState(prev => ({ ...prev, isPlaying }));
  }, [isPlaying]);

  // Track position updates
  useEffect(() => {
    const interval = setInterval(() => {
      if (player && !state.isLoading) {
        setState(prev => ({
          ...prev,
          position: player.currentTime,
          duration: player.duration,
        }));

        if (player.currentTime >= player.duration && player.duration > 0) {
          onVideoEnd?.();
        }
      }
    }, 250);

    return () => clearInterval(interval);
  }, [player, state.isLoading, onVideoEnd]);

  // Auto-hide controls
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

  const showControls = useCallback(() => {
    setState(prev => ({ ...prev, showControls: true }));
    resetControlsTimeout();
  }, [resetControlsTimeout]);

  useEffect(() => {
    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, []);

  const togglePlayPause = useCallback(() => {
    if (!player) return;

    if (state.isPlaying) {
      player.pause();
    } else {
      player.play();
      if (mediaId && mediaType) {
        logTrailerTap(mediaId, mediaType, sourceScreen ?? 'trailer_player');
      }
    }
    showControls();
  }, [player, state.isPlaying, showControls, mediaId, mediaType, sourceScreen]);

  const seekTo = useCallback((position: number) => {
    if (!player) return;
    player.currentTime = position;
    showControls();
  }, [player, showControls]);

  const handleSeekBarPress = useCallback((event: { nativeEvent: { locationX: number } }) => {
    const seekBarWidth = SCREEN_WIDTH - Spacing.lg * 2;
    const newPosition = calculateSeekPosition(
      event.nativeEvent.locationX,
      seekBarWidth,
      state.duration
    );
    seekTo(newPosition);
  }, [state.duration, seekTo]);

  const progress = calculateProgress(state.position, state.duration);

  if (state.hasError) {
    return (
      <View style={[styles.container, { backgroundColor }]} testID={testID}>
        <View style={styles.errorContainer}>
          <IconSymbol name="exclamationmark.triangle" size={48} color={errorColor} />
          <Text style={[styles.errorTitle, { color: textColor }]}>Trailer Unavailable</Text>
          <Text style={[styles.errorMessage, { color: textSecondary }]}>
            {state.errorMessage || 'Unable to load the trailer.'}
          </Text>
          {onClose && (
            <Pressable
              onPress={onClose}
              style={[styles.dismissButton, { backgroundColor: tintColor }]}
            >
              <Text style={styles.retryButtonText}>Close</Text>
            </Pressable>
          )}
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
      <VideoView
        player={player}
        style={styles.video}
        contentFit="contain"
        nativeControls={false}
      />

      {state.isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#FFFFFF" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      )}

      {state.showControls && !state.isLoading && (
        <View style={styles.controlsOverlay}>
          {onClose && (
            <View style={styles.topBar}>
              <Pressable onPress={onClose} style={styles.closeButton}>
                <IconSymbol name="xmark" size={24} color="#FFFFFF" />
              </Pressable>
            </View>
          )}

          <View style={styles.centerControls}>
            <Pressable onPress={togglePlayPause} style={styles.playPauseButton}>
              <IconSymbol
                name={state.isPlaying ? 'pause.fill' : 'play.fill'}
                size={48}
                color="#FFFFFF"
              />
            </Pressable>
          </View>

          <View style={styles.bottomBar}>
            <Text style={styles.timeText}>{formatTime(state.position)}</Text>
            <Pressable style={styles.seekBarContainer} onPress={handleSeekBarPress}>
              <View style={styles.seekBarBackground}>
                <View style={[styles.seekBarProgress, { width: `${progress}%` }]} />
                <View style={[styles.seekBarThumb, { left: `${progress}%` }]} />
              </View>
            </Pressable>
            <Text style={styles.timeText}>{formatTime(state.duration)}</Text>
          </View>
        </View>
      )}
    </Pressable>
  );
}

/**
 * Main TrailerPlayer export - switches between mock and real player
 */
export function TrailerPlayer(props: TrailerPlayerProps) {
  if (isMockDataMode()) {
    return (
      <MockTrailerPlayer
        onClose={props.onClose}
        onVideoEnd={props.onVideoEnd}
        testID={props.testID}
      />
    );
  }

  return <RealTrailerPlayer {...props} />;
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
  mockBackground: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.3,
  },
  mockOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
  },
  mockBadge: {
    position: 'absolute',
    top: 100,
    alignSelf: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  mockBadgeText: {
    color: '#FFFFFF',
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.medium,
  },
  mockText: {
    color: '#FFFFFF',
    fontSize: Typography.sizes.md,
    marginTop: Spacing.md,
    textAlign: 'center',
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
