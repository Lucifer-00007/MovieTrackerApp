/**
 * Profile Screen with Settings and Watchlist
 * Displays user settings and watchlist management
 * 
 * Requirements: 7.4, 7.5, 7.6, 9.2, 11.3, 15.3, 19.3
 */

import { useEffect, useCallback, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  Switch,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { useEffectiveColorScheme } from '@/hooks/use-effective-color-scheme';
import { Colors, Spacing, Typography, BorderRadius } from '@/constants/theme';
import { SOLID_COLORS } from '@/constants/colors';
import { PROFILE_GRID, getLanguageName, getThemeLabel } from '@/constants/profile';
import { COMPONENT_TEST_IDS } from '@/constants/test-ids';
import { useWatchlistStore } from '@/stores/watchlistStore';
import { usePreferencesStore } from '@/stores/preferencesStore';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { Skeleton } from '@/components/ui/Skeleton';
import {
  SettingsSection,
  SettingsRow,
  SettingsSeparator,
  LanguageModal,
  ThemeModal,
  WatchlistCard,
} from '@/components/profile';
import type { WatchlistItem } from '@/types/watchlist';
import type { ThemeMode } from '@/types/user';

export default function ProfileScreen() {
  const colorScheme = useEffectiveColorScheme();
  const colors = Colors[colorScheme];
  const router = useRouter();

  // State for modals
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [showThemeModal, setShowThemeModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'watchlist' | 'settings'>('watchlist');

  // Watchlist store
  const {
    items,
    isLoading,
    isSyncing,
    error,
    loadWatchlist,
    removeItem,
    clearError,
  } = useWatchlistStore();

  // Preferences store
  const {
    preferences,
    isLoading: prefsLoading,
    error: prefsError,
    loadPreferences,
    setThemeMode,
    setLanguage,
    setAnalyticsEnabled,
    setNotificationsEnabled,
    setNotificationType,
    clearError: clearPrefsError,
  } = usePreferencesStore();

  // Load data on mount
  useEffect(() => {
    loadWatchlist();
    loadPreferences();
  }, [loadWatchlist, loadPreferences]);

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
    loadPreferences();
  }, [loadWatchlist, loadPreferences]);

  const handleRetry = useCallback(() => {
    clearError();
    clearPrefsError();
    loadWatchlist();
    loadPreferences();
  }, [clearError, clearPrefsError, loadWatchlist, loadPreferences]);

  // Settings handlers
  const handleThemeChange = useCallback(async (theme: ThemeMode) => {
    await setThemeMode(theme);
  }, [setThemeMode]);

  const handleLanguageChange = useCallback(async (language: string) => {
    await setLanguage(language);
  }, [setLanguage]);

  const handleAnalyticsToggle = useCallback(async (enabled: boolean) => {
    await setAnalyticsEnabled(enabled);
  }, [setAnalyticsEnabled]);

  const handleNotificationsToggle = useCallback(async (enabled: boolean) => {
    await setNotificationsEnabled(enabled);
  }, [setNotificationsEnabled]);

  const handleNotificationTypeToggle = useCallback(async (
    type: 'downloads' | 'newReleases', 
    enabled: boolean
  ) => {
    await setNotificationType(type, enabled);
  }, [setNotificationType]);

  const renderItem = useCallback(({ item }: { item: WatchlistItem }) => (
    <WatchlistCard
      item={item}
      onPress={() => handleItemPress(item)}
      onRemove={() => handleRemoveItem(item)}
    />
  ), [handleItemPress, handleRemoveItem]);

  const keyExtractor = useCallback((item: WatchlistItem) => 
    `${item.mediaType}-${item.id}`, []);

  // Tab header
  const renderTabHeader = () => (
    <View style={styles.tabHeader}>
      <View style={[styles.tabContainer, { backgroundColor: colors.backgroundSecondary }]}>
        <Pressable
          onPress={() => setActiveTab('watchlist')}
          style={[
            styles.tabButton,
            activeTab === 'watchlist' && { backgroundColor: colors.tint },
          ]}
        >
          <Text
            style={[
              styles.tabButtonText,
              { color: activeTab === 'watchlist' ? SOLID_COLORS.WHITE : colors.text },
            ]}
          >
            Watchlist
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setActiveTab('settings')}
          style={[
            styles.tabButton,
            activeTab === 'settings' && { backgroundColor: colors.tint },
          ]}
        >
          <Text
            style={[
              styles.tabButtonText,
              { color: activeTab === 'settings' ? SOLID_COLORS.WHITE : colors.text },
            ]}
          >
            Settings
          </Text>
        </Pressable>
      </View>
    </View>
  );

  // Settings content
  const renderSettings = () => (
    <ScrollView 
      style={styles.settingsContainer}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={prefsLoading}
          onRefresh={handleRefresh}
          tintColor={colors.tint}
        />
      }
    >
      {/* Appearance Settings */}
      <SettingsSection title="Appearance" testID="appearance-section">
        <SettingsRow
          title="Theme"
          subtitle={getThemeLabel(preferences.themeMode)}
          icon="color-palette"
          onPress={() => setShowThemeModal(true)}
          testID="theme-setting"
        />
        <SettingsSeparator />
        <SettingsRow
          title="Language"
          subtitle={getLanguageName(preferences.language)}
          icon="language"
          onPress={() => setShowLanguageModal(true)}
          testID="language-setting"
        />
      </SettingsSection>

      {/* Notifications Settings */}
      <SettingsSection title="Notifications" testID={COMPONENT_TEST_IDS.NOTIFICATIONS_SECTION}>
        <SettingsRow
          title="Enable Notifications"
          subtitle="Receive push notifications"
          icon="notifications"
          rightElement={
            <Switch
              value={preferences.notificationsEnabled}
              onValueChange={handleNotificationsToggle}
              trackColor={{ false: colors.backgroundSecondary, true: colors.tint }}
              thumbColor={SOLID_COLORS.WHITE}
              testID={COMPONENT_TEST_IDS.NOTIFICATIONS_TOGGLE}
            />
          }
          testID={COMPONENT_TEST_IDS.NOTIFICATIONS_SETTING}
        />
        {preferences.notificationsEnabled && (
          <>
            <SettingsSeparator />
            <SettingsRow
              title="Download Complete"
              subtitle="Notify when downloads finish"
              icon="download"
              rightElement={
                <Switch
                  value={preferences.notificationTypes.downloads}
                  onValueChange={(enabled) => handleNotificationTypeToggle('downloads', enabled)}
                  trackColor={{ false: colors.backgroundSecondary, true: colors.tint }}
                  thumbColor={SOLID_COLORS.WHITE}
                  testID={COMPONENT_TEST_IDS.DOWNLOADS_NOTIFICATIONS_TOGGLE}
                />
              }
              testID={COMPONENT_TEST_IDS.DOWNLOADS_NOTIFICATIONS_SETTING}
            />
            <SettingsSeparator />
            <SettingsRow
              title="New Releases"
              subtitle="Notify about new content"
              icon="star"
              rightElement={
                <Switch
                  value={preferences.notificationTypes.newReleases}
                  onValueChange={(enabled) => handleNotificationTypeToggle('newReleases', enabled)}
                  trackColor={{ false: colors.backgroundSecondary, true: colors.tint }}
                  thumbColor={SOLID_COLORS.WHITE}
                  testID={COMPONENT_TEST_IDS.NEW_RELEASES_NOTIFICATIONS_TOGGLE}
                />
              }
              testID={COMPONENT_TEST_IDS.NEW_RELEASES_NOTIFICATIONS_SETTING}
            />
          </>
        )}
      </SettingsSection>

      {/* Privacy Settings */}
      <SettingsSection title="Privacy & Analytics" testID="privacy-section">
        <SettingsRow
          title="Analytics & Telemetry"
          subtitle={preferences.analyticsEnabled ? "Enabled" : "Disabled"}
          icon="analytics"
          rightElement={
            <Switch
              value={preferences.analyticsEnabled}
              onValueChange={handleAnalyticsToggle}
              trackColor={{ false: colors.backgroundSecondary, true: colors.tint }}
              thumbColor={SOLID_COLORS.WHITE}
              testID="analytics-toggle"
            />
          }
          testID="analytics-setting"
        />
      </SettingsSection>

      {/* GDPR Consent Info */}
      {preferences.gdprConsentGiven && preferences.gdprConsentDate && (
        <View style={styles.consentInfo}>
          <Text style={[styles.consentText, { color: colors.textSecondary }]}>
            Privacy consent given on {new Date(preferences.gdprConsentDate).toLocaleDateString()}
          </Text>
        </View>
      )}
    </ScrollView>
  );

  // Loading state
  if ((isLoading || prefsLoading) && items.length === 0 && activeTab === 'watchlist') {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {renderTabHeader()}
        <View style={styles.skeletonContainer}>
          <Skeleton variant="card" count={6} />
        </View>
      </View>
    );
  }

  // Error state
  if ((error || prefsError) && items.length === 0 && activeTab === 'watchlist') {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {renderTabHeader()}
        <ErrorState
          title="Failed to load data"
          message={error || prefsError || 'Unknown error'}
          onRetry={handleRetry}
          testID="profile-error"
        />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]} testID="profile-screen">
      {renderTabHeader()}
      
      {activeTab === 'settings' ? (
        renderSettings()
      ) : (
        <>
          {items.length === 0 ? (
            <EmptyState
              title="Your watchlist is empty"
              message="Start adding movies and series to keep track of what you want to watch"
              icon="bookmark-outline"
              actionText="Browse Content"
              onAction={() => router.push('/(tabs)/browse' as any)}
              testID="watchlist-empty"
            />
          ) : (
            <>
              <View style={styles.watchlistHeader}>
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
                numColumns={PROFILE_GRID.NUM_COLUMNS}
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
            </>
          )}
        </>
      )}

      {/* Modals */}
      <LanguageModal
        visible={showLanguageModal}
        currentLanguage={preferences.language}
        onSelect={handleLanguageChange}
        onClose={() => setShowLanguageModal(false)}
      />
      
      <ThemeModal
        visible={showThemeModal}
        currentTheme={preferences.themeMode}
        onSelect={handleThemeChange}
        onClose={() => setShowThemeModal(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabHeader: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.xxl,
    paddingBottom: Spacing.md,
  },
  tabContainer: {
    flexDirection: 'row',
    borderRadius: BorderRadius.md,
    padding: Spacing.xs,
  },
  tabButton: {
    flex: 1,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
  },
  tabButtonText: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.medium,
  },
  watchlistHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.sm,
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
    gap: PROFILE_GRID.CARD_SPACING,
    marginBottom: Spacing.md,
  },
  skeletonContainer: {
    flex: 1,
    padding: Spacing.md,
  },
  settingsContainer: {
    flex: 1,
    paddingHorizontal: Spacing.md,
  },
  consentInfo: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    marginTop: Spacing.md,
  },
  consentText: {
    fontSize: Typography.sizes.xs,
    textAlign: 'center',
  },
});
