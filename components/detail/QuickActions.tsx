/**
 * QuickActions Component
 * Displays action buttons for watchlist, share, and download
 * 
 * Requirements: 7.2, 8.1
 */

import { useCallback } from 'react';
import { StyleSheet, View, Text, Pressable, Share, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { useThemeColor } from '@/hooks/use-theme-color';
import { Spacing, Typography, BorderRadius, ComponentTokens } from '@/constants/theme';

export interface QuickActionsProps {
  /** Title for sharing */
  title: string;
  /** Media type */
  mediaType: 'movie' | 'tv';
  /** Media ID */
  mediaId: number;
  /** Whether item is in watchlist */
  isInWatchlist: boolean;
  /** Whether download is available */
  canDownload?: boolean;
  /** Callback when watchlist button pressed */
  onWatchlistPress: () => void;
  /** Callback when download button pressed */
  onDownloadPress?: () => void;
  /** Test ID */
  testID?: string;
}

export function QuickActions({
  title,
  mediaType,
  mediaId,
  isInWatchlist,
  canDownload = false,
  onWatchlistPress,
  onDownloadPress,
  testID,
}: QuickActionsProps) {
  const backgroundColor = useThemeColor({}, 'backgroundSecondary');
  const textColor = useThemeColor({}, 'text');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const tintColor = useThemeColor({}, 'tint');
  const borderColor = useThemeColor({}, 'border');

  const handleShare = useCallback(async () => {
    if (Platform.OS !== 'web') {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    
    try {
      const url = `https://movietracker.app/${mediaType}/${mediaId}`;
      await Share.share({
        message: `Check out "${title}" on MovieTracker!\n${url}`,
        title: title,
        url: url,
      });
    } catch (error) {
      console.error('Share failed:', error);
    }
  }, [title, mediaType, mediaId]);

  const handleWatchlistPress = useCallback(async () => {
    if (Platform.OS !== 'web') {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    onWatchlistPress();
  }, [onWatchlistPress]);

  const handleDownloadPress = useCallback(async () => {
    if (Platform.OS !== 'web') {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    onDownloadPress?.();
  }, [onDownloadPress]);

  return (
    <View style={[styles.container, { borderColor }]} testID={testID}>
      {/* Watchlist Button */}
      <Pressable
        onPress={handleWatchlistPress}
        style={({ pressed }) => [
          styles.actionButton,
          { backgroundColor, opacity: pressed ? 0.7 : 1 },
        ]}
        accessibilityRole="button"
        accessibilityLabel={isInWatchlist ? 'Remove from watchlist' : 'Add to watchlist'}
      >
        <Ionicons
          name={isInWatchlist ? 'bookmark' : 'bookmark-outline'}
          size={24}
          color={isInWatchlist ? tintColor : textColor}
        />
        <Text style={[styles.actionLabel, { color: textSecondary }]}>
          {isInWatchlist ? 'Saved' : 'Watchlist'}
        </Text>
      </Pressable>

      {/* Share Button */}
      <Pressable
        onPress={handleShare}
        style={({ pressed }) => [
          styles.actionButton,
          { backgroundColor, opacity: pressed ? 0.7 : 1 },
        ]}
        accessibilityRole="button"
        accessibilityLabel="Share"
      >
        <Ionicons name="share-outline" size={24} color={textColor} />
        <Text style={[styles.actionLabel, { color: textSecondary }]}>Share</Text>
      </Pressable>

      {/* Download Button */}
      {canDownload && (
        <Pressable
          onPress={handleDownloadPress}
          style={({ pressed }) => [
            styles.actionButton,
            { backgroundColor, opacity: pressed ? 0.7 : 1 },
          ]}
          accessibilityRole="button"
          accessibilityLabel="Download for offline"
        >
          <Ionicons name="download-outline" size={24} color={textColor} />
          <Text style={[styles.actionLabel, { color: textSecondary }]}>Download</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderBottomWidth: 1,
  },
  actionButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    minWidth: ComponentTokens.detailPage.actionButtonSize,
    minHeight: ComponentTokens.touchTarget.min,
  },
  actionLabel: {
    fontSize: Typography.sizes.xs,
    marginTop: Spacing.xs,
  },
});

export default QuickActions;
