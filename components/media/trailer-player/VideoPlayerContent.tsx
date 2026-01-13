/**
 * Video Player Content Component
 * Renders the actual video player UI after components are loaded
 * 
 * Requirements: 5.3, 5.4, 5.5
 */

import { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, Text, Pressable, ActivityIndicator, Dimensions } from 'react-native';

import { useThemeColor } from '@/hooks/use-theme-color';
import { Spacing, Typography } from '@/constants/theme';
import { SOLID_COLORS, OVERLAY_COLORS, ComponentTokens } from '@/constants/colors';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { logTrailerTap } from '@/services/analytics';
import {
  getYouTubeEmbedUrl,
  formatTime,
  calculateProgress,
  calculateSeekPosition,
} from '../trailer-utils';
import type { TrailerPlayerProps, TrailerPlayerState } from './types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface VideoPlayerContentProps extends TrailerPlayerProps {
  VideoComponents: {
    useVideoPlayer: any;
    VideoView: any;
    useEvent: any;
  };
}

export function VideoPlayerContent({
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
}: VideoPlayerContentProps) {
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.isPlaying]);

  const handleShowControls = useCallback(() => {
    setState(prev => ({ ...prev, showControls: true }));
    resetControlsTimeout();
  }, [resetControlsTimeout]);

  useEffect(() => {
    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    handleShowControls();
  }, [player, state.isPlaying, handleShowControls, mediaId, mediaType, sourceScreen]);

  const seekTo = useCallback((position: number) => {
    if (!player) return;
    player.currentTime = position;
    handleShowControls();
  }, [player, handleShowControls]);

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
      style={[styles.container, { backgroundColor: SOLID_COLORS.BLACK }]}
      onPress={handleShowControls}
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
          <ActivityIndicator size="large" color={SOLID_COLORS.WHITE} />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      )}

      {state.showControls && !state.isLoading && (
        <View style={styles.controlsOverlay}>
          {onClose && (
            <View style={styles.topBar}>
              <Pressable onPress={onClose} style={styles.closeButton}>
                <IconSymbol name="xmark" size={24} color={SOLID_COLORS.WHITE} />
              </Pressable>
            </View>
          )}

          <View style={styles.centerControls}>
            <Pressable onPress={togglePlayPause} style={styles.playPauseButton}>
              <IconSymbol
                name={state.isPlaying ? 'pause.fill' : 'play.fill'}
                size={48}
                color={SOLID_COLORS.WHITE}
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  video: {
    flex: 1,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: OVERLAY_COLORS.BLACK_80,
    gap: Spacing.md,
  },
  loadingText: {
    color: SOLID_COLORS.WHITE,
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.medium,
  },
  controlsOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'space-between',
    padding: Spacing.md,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  closeButton: {
    width: ComponentTokens.touchTarget.min,
    height: ComponentTokens.touchTarget.min,
    borderRadius: 22,
    backgroundColor: OVERLAY_COLORS.BLACK_60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerControls: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playPauseButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: OVERLAY_COLORS.BLACK_60,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: SOLID_COLORS.BLACK,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
  },
  timeText: {
    color: SOLID_COLORS.WHITE,
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.medium,
    minWidth: 40,
    textAlign: 'center',
  },
  seekBarContainer: {
    flex: 1,
    height: 40,
    justifyContent: 'center',
  },
  seekBarBackground: {
    height: ComponentTokens.progressBar.height,
    backgroundColor: OVERLAY_COLORS.WHITE_30,
    borderRadius: 2,
    position: 'relative',
  },
  seekBarProgress: {
    height: '100%',
    backgroundColor: SOLID_COLORS.WHITE,
    borderRadius: 2,
  },
  seekBarThumb: {
    position: 'absolute',
    top: -6,
    width: ComponentTokens.progressBar.thumbSize,
    height: ComponentTokens.progressBar.thumbSize,
    borderRadius: 8,
    backgroundColor: SOLID_COLORS.WHITE,
    marginLeft: -8,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
    gap: Spacing.md,
  },
  errorTitle: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.bold,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: Typography.sizes.md,
    textAlign: 'center',
    lineHeight: Typography.lineHeights.relaxed,
  },
  dismissButton: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: 8,
  },
  retryButtonText: {
    color: SOLID_COLORS.WHITE,
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.semibold,
  },
});