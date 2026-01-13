/**
 * Mock Trailer Player Component
 * Shows mock UI when in mock data mode
 * 
 * Requirements: 5.1, 5.2
 */

import { useState, useEffect } from 'react';
import { StyleSheet, View, Text, Pressable } from 'react-native';
import { Image } from 'expo-image';

import { useThemeColor } from '@/hooks/use-theme-color';
import { Spacing, BorderRadius, Typography } from '@/constants/theme';
import { SOLID_COLORS, OVERLAY_COLORS, ComponentTokens } from '@/constants/colors';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { formatTime } from '../trailer-utils';

/** Placeholder image for mock mode */
const PLACEHOLDER_IMAGE = require('@/assets/images/placeholder-poster.png');

interface MockTrailerPlayerProps {
  onClose?: () => void;
  onVideoEnd?: () => void;
  testID?: string;
}

export function MockTrailerPlayer({
  onClose,
  onVideoEnd,
  testID,
}: MockTrailerPlayerProps) {
  const tintColor = useThemeColor({}, 'tint');
  const [isPlaying, setIsPlaying] = useState(false);
  const [mockProgress, setMockProgress] = useState(0);

  // Simulate playback progress
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setMockProgress(prev => {
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
    <View style={[styles.container, { backgroundColor: SOLID_COLORS.BLACK }]} testID={testID}>
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
              <IconSymbol name="xmark" size={24} color={SOLID_COLORS.WHITE} />
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
              color={SOLID_COLORS.WHITE}
            />
          </Pressable>
          <Text style={styles.mockText}>
            {isPlaying ? 'Simulating playback...' : 'Tap to simulate playback'}
          </Text>
        </View>

        {/* Progress Bar */}
        <View style={styles.bottomBar}>
          <Text style={styles.timeText}>{formatTime((mockProgress / 100) * 120)}</Text>
          <View style={styles.seekBarContainer}>
            <View style={styles.seekBarBackground}>
              <View style={[styles.seekBarProgress, { width: `${mockProgress}%` }]} />
            </View>
          </View>
          <Text style={styles.timeText}>{formatTime(120)}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  mockBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.3,
  },
  mockOverlay: {
    flex: 1,
    justifyContent: 'space-between',
    padding: Spacing.md,
  },
  mockBadge: {
    position: 'absolute',
    top: Spacing.md,
    left: Spacing.md,
    backgroundColor: OVERLAY_COLORS.BLACK_80,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  mockBadgeText: {
    color: SOLID_COLORS.WHITE,
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.medium,
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
    gap: Spacing.md,
  },
  playPauseButton: {
    width: ComponentTokens.playButtonLarge.size,
    height: ComponentTokens.playButtonLarge.size,
    borderRadius: ComponentTokens.playButtonLarge.size / 2,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: SOLID_COLORS.BLACK,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  mockText: {
    color: SOLID_COLORS.WHITE,
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.medium,
    textAlign: 'center',
    opacity: 0.8,
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
    overflow: 'hidden',
  },
  seekBarProgress: {
    height: '100%',
    backgroundColor: SOLID_COLORS.WHITE,
    borderRadius: 2,
  },
});