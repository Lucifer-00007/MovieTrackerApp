/**
 * Real Trailer Player Component
 * Uses expo-video for actual video playback
 * 
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5
 */

import { useState, useEffect } from 'react';
import { StyleSheet, View, Text, Pressable, ActivityIndicator } from 'react-native';

import { useThemeColor } from '@/hooks/use-theme-color';
import { Spacing, Typography } from '@/constants/theme';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { VideoPlayerContent } from './VideoPlayerContent';
import type { TrailerPlayerProps, TrailerPlayerState } from './types';

export function RealTrailerPlayer({
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  loadingOverlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.medium,
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
  errorActions: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.md,
  },
  dismissButton: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.semibold,
  },
});