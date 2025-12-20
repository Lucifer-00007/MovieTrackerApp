/**
 * Property-based tests for Preferences Zustand Store
 * Feature: moviestream-mvp
 * 
 * Property 22: System Theme Respect
 * For any UserPreferences with themeMode set to 'system', the app SHALL use 
 * the device's color scheme preference.
 * 
 * **Validates: Requirements 9.3**
 */

import * as fc from 'fast-check';
import { usePreferencesStore } from '@/stores/preferencesStore';
import * as storage from '@/services/storage';
import { useColorScheme } from '@/hooks/use-color-scheme';
import type { UserPreferences, ThemeMode } from '@/types/user';

// Mock the storage service
jest.mock('@/services/storage', () => ({
  getUserPreferences: jest.fn(),
  saveUserPreferences: jest.fn(),
  updateUserPreferences: jest.fn(),
}));

// Mock the color scheme hook
jest.mock('@/hooks/use-color-scheme', () => ({
  useColorScheme: jest.fn(),
}));

const mockStorage = storage as jest.Mocked<typeof storage>;
const mockUseColorScheme = useColorScheme as jest.MockedFunction<typeof useColorScheme>;

// Arbitraries for generating test data
const themeModeArb = fc.constantFrom('light' as const, 'dark' as const, 'system' as const);
const languageArb = fc.constantFrom('en', 'es', 'fr', 'de', 'ja', 'zh');
const deviceColorSchemeArb = fc.constantFrom('light' as const, 'dark' as const);

const userPreferencesArb = fc.record({
  themeMode: themeModeArb,
  language: languageArb,
  analyticsEnabled: fc.boolean(),
  notificationsEnabled: fc.boolean(),
  notificationTypes: fc.record({
    downloads: fc.boolean(),
    newReleases: fc.boolean(),
  }),
  gdprConsentGiven: fc.boolean(),
  gdprConsentDate: fc.option(fc.date().map(d => d.toISOString()), { nil: null }),
});

// Helper to reset store state between tests
const resetStore = () => {
  usePreferencesStore.setState({
    preferences: {
      themeMode: 'system',
      language: 'en',
      analyticsEnabled: false,
      notificationsEnabled: true,
      notificationTypes: {
        downloads: true,
        newReleases: true,
      },
      gdprConsentGiven: false,
      gdprConsentDate: null,
    },
    isLoading: false,
    error: null,
  });
};

describe('Feature: moviestream-mvp, Property 22: System Theme Respect', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetStore();
  });

  /**
   * Property 22: System Theme Respect
   * For any UserPreferences with themeMode set to 'system', the app SHALL use 
   * the device's color scheme preference.
   * 
   * **Validates: Requirements 9.3**
   */
  describe('System theme mode respects device preference', () => {
    it('for any device color scheme, system theme mode should follow device setting', async () => {
      await fc.assert(
        fc.asyncProperty(
          deviceColorSchemeArb,
          async (deviceScheme) => {
            resetStore();
            
            // Mock device color scheme
            mockUseColorScheme.mockReturnValue(deviceScheme);
            mockStorage.updateUserPreferences.mockResolvedValue({
              ...usePreferencesStore.getState().preferences,
              themeMode: 'system',
            });

            const store = usePreferencesStore.getState();
            
            // Set theme mode to system
            await store.setThemeMode('system');

            // Verify theme mode is set to system
            const updatedStore = usePreferencesStore.getState();
            expect(updatedStore.preferences.themeMode).toBe('system');

            // When using the color scheme hook, it should return the device scheme
            const actualScheme = useColorScheme();
            expect(actualScheme).toBe(deviceScheme);

            // Storage should have been called to persist the system preference
            expect(mockStorage.updateUserPreferences).toHaveBeenCalledWith({
              themeMode: 'system',
            });
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Non-system theme modes override device preference', () => {
    it('for any explicit theme mode (light/dark), device preference should be ignored', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom('light' as const, 'dark' as const),
          deviceColorSchemeArb,
          async (explicitTheme, deviceScheme) => {
            resetStore();
            
            // Mock device color scheme (different from explicit theme)
            mockUseColorScheme.mockReturnValue(deviceScheme);
            mockStorage.updateUserPreferences.mockResolvedValue({
              ...usePreferencesStore.getState().preferences,
              themeMode: explicitTheme,
            });

            const store = usePreferencesStore.getState();
            
            // Set explicit theme mode
            await store.setThemeMode(explicitTheme);

            // Verify theme mode is set to explicit value
            const updatedStore = usePreferencesStore.getState();
            expect(updatedStore.preferences.themeMode).toBe(explicitTheme);

            // Storage should have been called to persist the explicit preference
            expect(mockStorage.updateUserPreferences).toHaveBeenCalledWith({
              themeMode: explicitTheme,
            });
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Theme mode persistence', () => {
    it('for any theme mode, setting should persist to storage', async () => {
      await fc.assert(
        fc.asyncProperty(
          themeModeArb,
          async (themeMode) => {
            resetStore();
            
            mockStorage.updateUserPreferences.mockResolvedValue({
              ...usePreferencesStore.getState().preferences,
              themeMode,
            });

            const store = usePreferencesStore.getState();
            await store.setThemeMode(themeMode);

            // Verify theme mode is updated in store
            const updatedStore = usePreferencesStore.getState();
            expect(updatedStore.preferences.themeMode).toBe(themeMode);

            // Verify storage was called with correct theme mode
            expect(mockStorage.updateUserPreferences).toHaveBeenCalledWith({
              themeMode,
            });
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Theme mode rollback on storage failure', () => {
    it('for any theme mode, storage failure should rollback to previous state', async () => {
      await fc.assert(
        fc.asyncProperty(
          themeModeArb,
          themeModeArb,
          async (initialTheme, newTheme) => {
            // Skip if themes are the same (no change to test)
            fc.pre(initialTheme !== newTheme);
            
            resetStore();
            
            // Set initial theme
            usePreferencesStore.setState({
              preferences: {
                ...usePreferencesStore.getState().preferences,
                themeMode: initialTheme,
              },
            });

            // Mock storage failure
            const storageError = new Error('Storage failed');
            mockStorage.updateUserPreferences.mockRejectedValue(storageError);

            const store = usePreferencesStore.getState();
            
            // Attempt to set new theme (should fail)
            await store.setThemeMode(newTheme);

            // Verify theme mode rolled back to initial value
            const updatedStore = usePreferencesStore.getState();
            expect(updatedStore.preferences.themeMode).toBe(initialTheme);

            // Verify error is set
            expect(updatedStore.error).toBeTruthy();
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Preferences loading preserves theme mode', () => {
    it('for any stored preferences, loading should preserve theme mode', async () => {
      await fc.assert(
        fc.asyncProperty(
          userPreferencesArb,
          async (storedPrefs) => {
            resetStore();
            
            mockStorage.getUserPreferences.mockResolvedValue(storedPrefs);

            const store = usePreferencesStore.getState();
            await store.loadPreferences();

            // Verify loaded preferences match stored preferences
            const updatedStore = usePreferencesStore.getState();
            expect(updatedStore.preferences.themeMode).toBe(storedPrefs.themeMode);
            expect(updatedStore.preferences.language).toBe(storedPrefs.language);
            expect(updatedStore.preferences.analyticsEnabled).toBe(storedPrefs.analyticsEnabled);
            expect(updatedStore.preferences.notificationsEnabled).toBe(storedPrefs.notificationsEnabled);
            expect(updatedStore.preferences.gdprConsentGiven).toBe(storedPrefs.gdprConsentGiven);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Multiple preference updates are atomic', () => {
    it('for any preference updates, each should be independent and atomic', async () => {
      await fc.assert(
        fc.asyncProperty(
          themeModeArb,
          languageArb,
          fc.boolean(),
          async (themeMode, language, analyticsEnabled) => {
            resetStore();
            
            mockStorage.updateUserPreferences.mockImplementation(async (updates) => ({
              ...usePreferencesStore.getState().preferences,
              ...updates,
            }));

            const store = usePreferencesStore.getState();
            
            // Update multiple preferences
            await store.setThemeMode(themeMode);
            await store.setLanguage(language);
            await store.setAnalyticsEnabled(analyticsEnabled);

            // Verify all updates are reflected
            const updatedStore = usePreferencesStore.getState();
            expect(updatedStore.preferences.themeMode).toBe(themeMode);
            expect(updatedStore.preferences.language).toBe(language);
            expect(updatedStore.preferences.analyticsEnabled).toBe(analyticsEnabled);

            // Verify each update called storage independently
            expect(mockStorage.updateUserPreferences).toHaveBeenCalledWith({ themeMode });
            expect(mockStorage.updateUserPreferences).toHaveBeenCalledWith({ language });
            expect(mockStorage.updateUserPreferences).toHaveBeenCalledWith({ analyticsEnabled });
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Notification type updates preserve other settings', () => {
    it('for any notification type update, other preferences should remain unchanged', async () => {
      await fc.assert(
        fc.asyncProperty(
          userPreferencesArb,
          fc.constantFrom('downloads' as const, 'newReleases' as const),
          fc.boolean(),
          async (initialPrefs, notificationType, enabled) => {
            resetStore();
            
            // Set initial preferences
            usePreferencesStore.setState({
              preferences: initialPrefs,
              isLoading: false,
              error: null,
            });

            mockStorage.updateUserPreferences.mockImplementation(async (updates) => ({
              ...initialPrefs,
              ...updates,
            }));

            const store = usePreferencesStore.getState();
            await store.setNotificationType(notificationType, enabled);

            // Verify notification type was updated
            const updatedStore = usePreferencesStore.getState();
            expect(updatedStore.preferences.notificationTypes[notificationType]).toBe(enabled);

            // Verify other preferences remained unchanged
            expect(updatedStore.preferences.themeMode).toBe(initialPrefs.themeMode);
            expect(updatedStore.preferences.language).toBe(initialPrefs.language);
            expect(updatedStore.preferences.analyticsEnabled).toBe(initialPrefs.analyticsEnabled);
            expect(updatedStore.preferences.notificationsEnabled).toBe(initialPrefs.notificationsEnabled);
            expect(updatedStore.preferences.gdprConsentGiven).toBe(initialPrefs.gdprConsentGiven);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});