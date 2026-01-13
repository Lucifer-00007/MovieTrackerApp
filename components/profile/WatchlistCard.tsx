/**
 * Watchlist Card Component
 * Displays a watchlist item with remove functionality
 */

import { View, Text, Pressable, Alert, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useEffectiveColorScheme } from '@/hooks/use-effective-color-scheme';
import { Colors, Spacing, Typography, BorderRadius } from '@/constants/theme';
import { SOLID_COLORS, OVERLAY_COLORS, ComponentTokens } from '@/constants/colors';
import { PROFILE_GRID } from '@/constants/profile';
import { COMPONENT_TEST_IDS } from '@/constants/test-ids';
import { MediaCard } from '@/components/media/MediaCard';
import type { WatchlistItem, WatchlistSyncStatus } from '@/types/watchlist';

/** Sync status indicator props */
interface SyncStatusIndicatorProps {
  status: WatchlistSyncStatus;
}

/** Sync status indicator component */
function SyncStatusIndicator({ status }: SyncStatusIndicatorProps) {
  const colorScheme = useEffectiveColorScheme();
  const colors = Colors[colorScheme];

  const getStatusConfig = () => {
    switch (status) {
      case 'synced':
        return { icon: 'checkmark-circle' as const, color: colors.success, label: 'Synced' };
      case 'pending':
        return { icon: 'cloud-upload' as const, color: colors.warning, label: 'Syncing' };
      case 'error':
        return { icon: 'alert-circle' as const, color: colors.error, label: 'Sync error' };
    }
  };

  const config = getStatusConfig();

  return (
    <View
      style={styles.syncIndicator}
      accessibilityLabel={config.label}
      testID={COMPONENT_TEST_IDS.SYNC_STATUS_INDICATOR}
    >
      <Ionicons name={config.icon} size={16} color={config.color} />
    </View>
  );
}

/** Watchlist card props */
export interface WatchlistCardProps {
  item: WatchlistItem;
  onPress: () => void;
  onRemove: () => void;
}

/** Watchlist item card with remove functionality */
export function WatchlistCard({ item, onPress, onRemove }: WatchlistCardProps) {
  const colorScheme = useEffectiveColorScheme();
  const colors = Colors[colorScheme];

  const handleLongPress = () => {
    Alert.alert(
      'Remove from Watchlist',
      `Remove "${item.title}" from your watchlist?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: onRemove },
      ]
    );
  };

  return (
    <View style={styles.cardWrapper} testID={`watchlist-item-${item.id}`}>
      <Pressable
        onPress={onPress}
        onLongPress={handleLongPress}
        accessibilityRole="button"
        accessibilityLabel={`${item.title}. Long press to remove from watchlist`}
        accessibilityHint="Double tap to view details, long press to remove"
        style={({ pressed }) => [
          styles.cardContainer,
          { opacity: pressed ? 0.8 : 1 },
        ]}
      >
        <View style={[styles.cardInner, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          {item.posterPath ? (
            <MediaCard
              id={item.id}
              title={item.title}
              posterPath={item.posterPath}
              rating={null}
              ageRating={null}
              variant="small"
              onPress={onPress}
              onLongPress={handleLongPress}
            />
          ) : (
            <View style={[styles.placeholder, { backgroundColor: colors.backgroundSecondary }]}>
              <Text
                style={[styles.placeholderText, { color: colors.textSecondary }]}
                numberOfLines={3}
              >
                {item.title}
              </Text>
            </View>
          )}
        </View>
      </Pressable>
      
      <SyncStatusIndicator status={item.syncStatus} />
      
      <Pressable
        onPress={onRemove}
        accessibilityRole="button"
        accessibilityLabel={`Remove ${item.title} from watchlist`}
        style={({ pressed }) => [
          styles.removeButton,
          { backgroundColor: colors.error, opacity: pressed ? 0.8 : 1 },
        ]}
        testID={`remove-button-${item.id}`}
      >
        <Ionicons name="close" size={14} color={SOLID_COLORS.WHITE} />
      </Pressable>
      
      <Text
        style={[styles.cardTitle, { color: colors.text }]}
        numberOfLines={2}
      >
        {item.title}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  cardWrapper: {
    width: PROFILE_GRID.CARD_WIDTH,
    position: 'relative',
  },
  cardContainer: {
    width: '100%',
  },
  cardInner: {
    width: '100%',
    height: PROFILE_GRID.CARD_HEIGHT,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    overflow: 'hidden',
  },
  placeholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.sm,
  },
  placeholderText: {
    fontSize: Typography.sizes.xs,
    textAlign: 'center',
  },
  syncIndicator: {
    position: 'absolute',
    top: Spacing.xs,
    left: Spacing.xs,
    width: ComponentTokens.syncIndicator.size,
    height: ComponentTokens.syncIndicator.size,
    borderRadius: 10,
    backgroundColor: OVERLAY_COLORS.BLACK_50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeButton: {
    position: 'absolute',
    top: Spacing.xs,
    right: Spacing.xs,
    width: ComponentTokens.removeButton.size,
    height: ComponentTokens.removeButton.size,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: ComponentTokens.touchTarget.min,
    minHeight: ComponentTokens.touchTarget.min,
  },
  cardTitle: {
    fontSize: Typography.sizes.xs,
    marginTop: Spacing.xs,
    textAlign: 'center',
  },
});
