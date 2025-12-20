/**
 * Profile Screen with Watchlist Display
 * Displays user's saved watchlist items in a grid layout
 * 
 * Requirements: 7.4, 7.5, 7.6
 * - Display all saved titles in grid layout
 * - Add remove functionality with immediate UI update
 * - Implement sync status indicators
 */

import { useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  Pressable,
  RefreshControl,
  Alert,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors, Spacing, Typography, BorderRadius } from '@/constants/theme';
import { useWatchlistStore } from '@/stores/watchlistStore';
import { MediaCard } from '@/components/media/MediaCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { Skeleton } from '@/components/ui/Skeleton';
import type { WatchlistItem, WatchlistSyncStatus } from '@/types/watchlist';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const NUM_COLUMNS = 3;
const CARD_SPACING = Spacing.sm;
const CARD_WIDTH = (SCREEN_WIDTH - Spacing.md * 2 - CARD_SPACING * (NUM_COLUMNS - 1)) / NUM_COLUMNS;
const CARD_HEIGHT = CARD_WIDTH * 1.5;

/** Sync status indicator component */
function SyncStatusIndicator({ status }: { status: WatchlistSyncStatus }) {
  const colorScheme = useColorScheme() ?? 'light';
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
      testID="sync-status-indicator"
    >
      <Ionicons name={config.icon} size={16} color={config.color} />
    </View>
  );
}

/** Watchlist item card with remove functionality */
function WatchlistItemCard({
  item,
  onPress,
  onRemove,
}: {
  item: WatchlistItem;
  onPress: () => void;
  onRemove: () => void;
}) {
  const colorScheme = useColorScheme() ?? 'light';
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
      
      {/* Sync status indicator */}
      <SyncStatusIndicator status={item.syncStatus} />
      
      {/* Remove button */}
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
        <Ionicons name="close" size={14} color="#FFFFFF" />
      </Pressable>
      
      {/* Title below card */}
      <Text
        style={[styles.cardTitle, { color: colors.text }]}
        numberOfLines={2}
      >
        {item.title}
      </Text>
    </View>
  );
}

export default function ProfileScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const router = useRouter();

  const {
    items,
    isLoading,
    isSyncing,
    error,
    loadWatchlist,
    removeItem,
    clearError,
  } = useWatchlistStore();

  // Load watchlist on mount
  useEffect(() => {
    loadWatchlist();
  }, [loadWatchlist]);

  const handleItemPress = useCallback((item: WatchlistItem) => {
    if (item.mediaType === 'movie') {
      router.push(`/movie/${item.id}` as any);
    } else {
      router.push(`/tv/${item.id}` as any);
    }
  }, [router]);

  const handleRemoveItem = useCallback(async (item: WatchlistItem) => {
    await removeItem(item.id, item.mediaType);
  }, [removeItem]);

  const handleRefresh = useCallback(() => {
    loadWatchlist();
  }, [loadWatchlist]);

  const handleRetry = useCallback(() => {
    clearError();
    loadWatchlist();
  }, [clearError, loadWatchlist]);

  const renderItem = useCallback(({ item }: { item: WatchlistItem }) => (
    <WatchlistItemCard
      item={item}
      onPress={() => handleItemPress(item)}
      onRemove={() => handleRemoveItem(item)}
    />
  ), [handleItemPress, handleRemoveItem]);

  const keyExtractor = useCallback((item: WatchlistItem) => 
    `${item.mediaType}-${item.id}`, []);

  // Loading state
  if (isLoading && items.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>My Watchlist</Text>
        </View>
        <View style={styles.skeletonContainer}>
          <Skeleton variant="card" count={6} />
        </View>
      </View>
    );
  }

  // Error state
  if (error && items.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>My Watchlist</Text>
        </View>
        <ErrorState
          title="Failed to load watchlist"
          message={error}
          onRetry={handleRetry}
          testID="watchlist-error"
        />
      </View>
    );
  }

  // Empty state
  if (items.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>My Watchlist</Text>
        </View>
        <EmptyState
          title="Your watchlist is empty"
          message="Start adding movies and series to keep track of what you want to watch"
          icon="bookmark-outline"
          actionText="Browse Content"
          onAction={() => router.push('/(tabs)/browse' as any)}
          testID="watchlist-empty"
        />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]} testID="watchlist-screen">
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>My Watchlist</Text>
        <View style={styles.headerRight}>
          {isSyncing && (
            <View style={styles.syncingIndicator}>
              <Ionicons name="sync" size={18} color={colors.tint} />
              <Text style={[styles.syncingText, { color: colors.textSecondary }]}>
                Syncing...
              </Text>
            </View>
          )}
          <Text style={[styles.itemCount, { color: colors.textSecondary }]}>
            {items.length} {items.length === 1 ? 'title' : 'titles'}
          </Text>
        </View>
      </View>

      <FlatList
        data={items}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        numColumns={NUM_COLUMNS}
        contentContainerStyle={styles.listContent}
        columnWrapperStyle={styles.columnWrapper}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={handleRefresh}
            tintColor={colors.tint}
          />
        }
        testID="watchlist-grid"
        accessibilityLabel={`Watchlist with ${items.length} items`}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.md,
  },
  title: {
    fontSize: Typography.sizes.xxl,
    fontWeight: Typography.weights.bold,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  syncingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  syncingText: {
    fontSize: Typography.sizes.sm,
  },
  itemCount: {
    fontSize: Typography.sizes.sm,
  },
  listContent: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  columnWrapper: {
    gap: CARD_SPACING,
    marginBottom: Spacing.md,
  },
  skeletonContainer: {
    flex: 1,
    padding: Spacing.md,
  },
  cardWrapper: {
    width: CARD_WIDTH,
    position: 'relative',
  },
  cardContainer: {
    width: '100%',
  },
  cardInner: {
    width: '100%',
    height: CARD_HEIGHT,
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
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeButton: {
    position: 'absolute',
    top: Spacing.xs,
    right: Spacing.xs,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 44,
    minHeight: 44,
  },
  cardTitle: {
    fontSize: Typography.sizes.xs,
    marginTop: Spacing.xs,
    textAlign: 'center',
  },
});
