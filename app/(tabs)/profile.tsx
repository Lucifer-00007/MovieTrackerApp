/**
 * Profile Screen with Settings and Watchlist
 * Displays user settings and watchlist management
 * 
 * Requirements: 7.4, 7.5, 7.6, 9.2, 11.3, 15.3, 19.3
 * - Display all saved titles in grid layout
 * - Add remove functionality with immediate UI update
 * - Implement sync status indicators
 * - Add theme mode toggle (light/dark/system)
 * - Add language selection
 * - Add notification settings
 * - Add privacy/analytics settings
 */

import { useEffect, useCallback, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  Pressable,
  RefreshControl,
  Alert,
  Dimensions,
  ScrollView,
  Switch,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors, Spacing, Typography, BorderRadius } from '@/constants/theme';
import { useWatchlistStore } from '@/stores/watchlistStore';
import { usePreferencesStore } from '@/stores/preferencesStore';
import { MediaCard } from '@/components/media/MediaCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { Skeleton } from '@/components/ui/Skeleton';
import type { WatchlistItem, WatchlistSyncStatus } from '@/types/watchlist';
import type { ThemeMode } from '@/types/user';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const NUM_COLUMNS = 3;
const CARD_SPACING = Spacing.sm;
const CARD_WIDTH = (SCREEN_WIDTH - Spacing.md * 2 - CARD_SPACING * (NUM_COLUMNS - 1)) / NUM_COLUMNS;
const CARD_HEIGHT = CARD_WIDTH * 1.5;

/** Available languages */
const LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Español' },
  { code: 'fr', name: 'Français' },
  { code: 'de', name: 'Deutsch' },
  { code: 'ja', name: '日本語' },
  { code: 'zh', name: '中文' },
];

/** Theme mode options */
const THEME_MODES: { value: ThemeMode; label: string; description: string }[] = [
  { value: 'light', label: 'Light', description: 'Always use light theme' },
  { value: 'dark', label: 'Dark', description: 'Always use dark theme' },
  { value: 'system', label: 'System', description: 'Follow device setting' },
];

/** Settings section component */
function SettingsSection({ 
  title, 
  children, 
  testID 
}: { 
  title: string; 
  children: React.ReactNode; 
  testID?: string;
}) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  return (
    <View style={styles.settingsSection} testID={testID}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>{title}</Text>
      <View style={[styles.sectionContent, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
        {children}
      </View>
    </View>
  );
}

/** Settings row component */
function SettingsRow({
  title,
  subtitle,
  icon,
  onPress,
  rightElement,
  testID,
}: {
  title: string;
  subtitle?: string;
  icon: string;
  onPress?: () => void;
  rightElement?: React.ReactNode;
  testID?: string;
}) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.settingsRow,
        { opacity: pressed ? 0.7 : 1 },
      ]}
      accessibilityRole="button"
      accessibilityLabel={title}
      testID={testID}
    >
      <View style={styles.settingsRowLeft}>
        <Ionicons name={icon as any} size={20} color={colors.tint} />
        <View style={styles.settingsRowText}>
          <Text style={[styles.settingsRowTitle, { color: colors.text }]}>{title}</Text>
          {subtitle && (
            <Text style={[styles.settingsRowSubtitle, { color: colors.textSecondary }]}>
              {subtitle}
            </Text>
          )}
        </View>
      </View>
      {rightElement || (
        <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
      )}
    </Pressable>
  );
}

/** Language selection modal */
function LanguageModal({
  visible,
  currentLanguage,
  onSelect,
  onClose,
}: {
  visible: boolean;
  currentLanguage: string;
  onSelect: (language: string) => void;
  onClose: () => void;
}) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
        <View style={styles.modalHeader}>
          <Text style={[styles.modalTitle, { color: colors.text }]}>Select Language</Text>
          <Pressable onPress={onClose} style={styles.modalCloseButton}>
            <Ionicons name="close" size={24} color={colors.text} />
          </Pressable>
        </View>
        
        <ScrollView style={styles.modalContent}>
          {LANGUAGES.map((language) => (
            <Pressable
              key={language.code}
              onPress={() => {
                onSelect(language.code);
                onClose();
              }}
              style={({ pressed }) => [
                styles.languageOption,
                { 
                  backgroundColor: pressed ? colors.backgroundSecondary : 'transparent',
                  borderBottomColor: colors.cardBorder,
                },
              ]}
            >
              <Text style={[styles.languageOptionText, { color: colors.text }]}>
                {language.name}
              </Text>
              {currentLanguage === language.code && (
                <Ionicons name="checkmark" size={20} color={colors.tint} />
              )}
            </Pressable>
          ))}
        </ScrollView>
      </View>
    </Modal>
  );
}

/** Theme selection modal */
function ThemeModal({
  visible,
  currentTheme,
  onSelect,
  onClose,
}: {
  visible: boolean;
  currentTheme: ThemeMode;
  onSelect: (theme: ThemeMode) => void;
  onClose: () => void;
}) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
        <View style={styles.modalHeader}>
          <Text style={[styles.modalTitle, { color: colors.text }]}>Select Theme</Text>
          <Pressable onPress={onClose} style={styles.modalCloseButton}>
            <Ionicons name="close" size={24} color={colors.text} />
          </Pressable>
        </View>
        
        <ScrollView style={styles.modalContent}>
          {THEME_MODES.map((theme) => (
            <Pressable
              key={theme.value}
              onPress={() => {
                onSelect(theme.value);
                onClose();
              }}
              style={({ pressed }) => [
                styles.themeOption,
                { 
                  backgroundColor: pressed ? colors.backgroundSecondary : 'transparent',
                  borderBottomColor: colors.cardBorder,
                },
              ]}
            >
              <View style={styles.themeOptionContent}>
                <Text style={[styles.themeOptionTitle, { color: colors.text }]}>
                  {theme.label}
                </Text>
                <Text style={[styles.themeOptionDescription, { color: colors.textSecondary }]}>
                  {theme.description}
                </Text>
              </View>
              {currentTheme === theme.value && (
                <Ionicons name="checkmark" size={20} color={colors.tint} />
              )}
            </Pressable>
          ))}
        </ScrollView>
      </View>
    </Modal>
  );
}

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

  const getCurrentLanguageName = () => {
    const language = LANGUAGES.find(lang => lang.code === preferences.language);
    return language?.name || 'English';
  };

  const getCurrentThemeName = () => {
    const theme = THEME_MODES.find(mode => mode.value === preferences.themeMode);
    return theme?.label || 'System';
  };

  const renderItem = useCallback(({ item }: { item: WatchlistItem }) => (
    <WatchlistItemCard
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
              { color: activeTab === 'watchlist' ? '#FFFFFF' : colors.text },
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
              { color: activeTab === 'settings' ? '#FFFFFF' : colors.text },
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
          subtitle={getCurrentThemeName()}
          icon="color-palette"
          onPress={() => setShowThemeModal(true)}
          testID="theme-setting"
        />
        <View style={[styles.separator, { backgroundColor: colors.cardBorder }]} />
        <SettingsRow
          title="Language"
          subtitle={getCurrentLanguageName()}
          icon="language"
          onPress={() => setShowLanguageModal(true)}
          testID="language-setting"
        />
      </SettingsSection>

      {/* Notifications Settings */}
      <SettingsSection title="Notifications" testID="notifications-section">
        <SettingsRow
          title="Enable Notifications"
          subtitle="Receive push notifications"
          icon="notifications"
          rightElement={
            <Switch
              value={preferences.notificationsEnabled}
              onValueChange={handleNotificationsToggle}
              trackColor={{ false: colors.backgroundSecondary, true: colors.tint }}
              thumbColor="#FFFFFF"
              testID="notifications-toggle"
            />
          }
          testID="notifications-setting"
        />
        {preferences.notificationsEnabled && (
          <>
            <View style={[styles.separator, { backgroundColor: colors.cardBorder }]} />
            <SettingsRow
              title="Download Complete"
              subtitle="Notify when downloads finish"
              icon="download"
              rightElement={
                <Switch
                  value={preferences.notificationTypes.downloads}
                  onValueChange={(enabled) => handleNotificationTypeToggle('downloads', enabled)}
                  trackColor={{ false: colors.backgroundSecondary, true: colors.tint }}
                  thumbColor="#FFFFFF"
                  testID="downloads-notifications-toggle"
                />
              }
              testID="downloads-notifications-setting"
            />
            <View style={[styles.separator, { backgroundColor: colors.cardBorder }]} />
            <SettingsRow
              title="New Releases"
              subtitle="Notify about new content"
              icon="star"
              rightElement={
                <Switch
                  value={preferences.notificationTypes.newReleases}
                  onValueChange={(enabled) => handleNotificationTypeToggle('newReleases', enabled)}
                  trackColor={{ false: colors.backgroundSecondary, true: colors.tint }}
                  thumbColor="#FFFFFF"
                  testID="new-releases-notifications-toggle"
                />
              }
              testID="new-releases-notifications-setting"
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
              thumbColor="#FFFFFF"
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
        // Watchlist content
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
    paddingTop: Spacing.xl,
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
    gap: CARD_SPACING,
    marginBottom: Spacing.md,
  },
  skeletonContainer: {
    flex: 1,
    padding: Spacing.md,
  },
  
  // Settings styles
  settingsContainer: {
    flex: 1,
    paddingHorizontal: Spacing.md,
  },
  settingsSection: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.semibold,
    marginBottom: Spacing.sm,
  },
  sectionContent: {
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    overflow: 'hidden',
  },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    minHeight: 60,
  },
  settingsRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingsRowText: {
    marginLeft: Spacing.md,
    flex: 1,
  },
  settingsRowTitle: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.medium,
  },
  settingsRowSubtitle: {
    fontSize: Typography.sizes.sm,
    marginTop: Spacing.xs,
  },
  separator: {
    height: 1,
    marginLeft: Spacing.md + 20 + Spacing.md, // Icon width + margin
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

  // Modal styles
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.md,
  },
  modalTitle: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.bold,
  },
  modalCloseButton: {
    padding: Spacing.sm,
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalContent: {
    flex: 1,
  },
  languageOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderBottomWidth: 1,
    minHeight: 60,
  },
  languageOptionText: {
    fontSize: Typography.sizes.md,
  },
  themeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderBottomWidth: 1,
    minHeight: 80,
  },
  themeOptionContent: {
    flex: 1,
  },
  themeOptionTitle: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.medium,
  },
  themeOptionDescription: {
    fontSize: Typography.sizes.sm,
    marginTop: Spacing.xs,
  },

  // Watchlist card styles
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
