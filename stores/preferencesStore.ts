/**
 * Preferences Zustand Store for MovieStream MVP
 * Manages theme/language/analytics settings
 * 
 * Requirements: 9.2
 * - Apply theme changes immediately
 * - Persist preferences to AsyncStorage
 */

import { create } from 'zustand';
import type { UserPreferences, ThemeMode } from '@/types/user';
import { DEFAULT_USER_PREFERENCES } from '@/types/user';
import {
  getUserPreferences,
  saveUserPreferences,
  updateUserPreferences as updatePrefsInStorage,
} from '@/services/storage';

interface PreferencesStore {
  // State
  preferences: UserPreferences;
  isLoading: boolean;
  error: string | null;

  // Actions
  loadPreferences: () => Promise<void>;
  setThemeMode: (mode: ThemeMode) => Promise<void>;
  setLanguage: (language: string) => Promise<void>;
  setAnalyticsEnabled: (enabled: boolean) => Promise<void>;
  setNotificationsEnabled: (enabled: boolean) => Promise<void>;
  setNotificationType: (type: 'downloads' | 'newReleases', enabled: boolean) => Promise<void>;
  setGdprConsent: (consent: boolean) => Promise<void>;
  updatePreferences: (updates: Partial<UserPreferences>) => Promise<void>;
  resetPreferences: () => Promise<void>;
  clearError: () => void;
}

export const usePreferencesStore = create<PreferencesStore>((set, get) => ({
  // Initial state with defaults
  preferences: { ...DEFAULT_USER_PREFERENCES },
  isLoading: false,
  error: null,

  // Load preferences from storage
  loadPreferences: async () => {
    set({ isLoading: true, error: null });
    try {
      const preferences = await getUserPreferences();
      set({ preferences, isLoading: false });
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to load preferences',
      });
    }
  },

  // Set theme mode
  setThemeMode: async (mode) => {
    const previousPrefs = get().preferences;

    // Optimistic update
    set((state) => ({
      preferences: { ...state.preferences, themeMode: mode },
    }));

    try {
      await updatePrefsInStorage({ themeMode: mode });
    } catch (error) {
      // Rollback on failure
      set({
        preferences: previousPrefs,
        error: error instanceof Error ? error.message : 'Failed to update theme',
      });
    }
  },

  // Set language
  setLanguage: async (language) => {
    const previousPrefs = get().preferences;

    // Optimistic update
    set((state) => ({
      preferences: { ...state.preferences, language },
    }));

    try {
      await updatePrefsInStorage({ language });
    } catch (error) {
      // Rollback on failure
      set({
        preferences: previousPrefs,
        error: error instanceof Error ? error.message : 'Failed to update language',
      });
    }
  },

  // Set analytics enabled
  setAnalyticsEnabled: async (enabled) => {
    const previousPrefs = get().preferences;

    // Optimistic update
    set((state) => ({
      preferences: { ...state.preferences, analyticsEnabled: enabled },
    }));

    try {
      await updatePrefsInStorage({ analyticsEnabled: enabled });
    } catch (error) {
      // Rollback on failure
      set({
        preferences: previousPrefs,
        error: error instanceof Error ? error.message : 'Failed to update analytics setting',
      });
    }
  },

  // Set notifications enabled
  setNotificationsEnabled: async (enabled) => {
    const previousPrefs = get().preferences;

    // Optimistic update
    set((state) => ({
      preferences: { ...state.preferences, notificationsEnabled: enabled },
    }));

    try {
      await updatePrefsInStorage({ notificationsEnabled: enabled });
    } catch (error) {
      // Rollback on failure
      set({
        preferences: previousPrefs,
        error: error instanceof Error ? error.message : 'Failed to update notifications setting',
      });
    }
  },

  // Set specific notification type
  setNotificationType: async (type, enabled) => {
    const previousPrefs = get().preferences;

    // Optimistic update
    set((state) => ({
      preferences: {
        ...state.preferences,
        notificationTypes: {
          ...state.preferences.notificationTypes,
          [type]: enabled,
        },
      },
    }));

    try {
      await updatePrefsInStorage({
        notificationTypes: {
          ...get().preferences.notificationTypes,
          [type]: enabled,
        },
      });
    } catch (error) {
      // Rollback on failure
      set({
        preferences: previousPrefs,
        error: error instanceof Error ? error.message : 'Failed to update notification type',
      });
    }
  },

  // Set GDPR consent
  setGdprConsent: async (consent) => {
    const previousPrefs = get().preferences;

    // Optimistic update
    set((state) => ({
      preferences: {
        ...state.preferences,
        gdprConsentGiven: consent,
        gdprConsentDate: consent ? new Date().toISOString() : null,
      },
    }));

    try {
      await updatePrefsInStorage({
        gdprConsentGiven: consent,
        gdprConsentDate: consent ? new Date().toISOString() : null,
      });
    } catch (error) {
      // Rollback on failure
      set({
        preferences: previousPrefs,
        error: error instanceof Error ? error.message : 'Failed to update GDPR consent',
      });
    }
  },

  // Update multiple preferences at once
  updatePreferences: async (updates) => {
    const previousPrefs = get().preferences;

    // Optimistic update
    set((state) => ({
      preferences: { ...state.preferences, ...updates },
    }));

    try {
      await updatePrefsInStorage(updates);
    } catch (error) {
      // Rollback on failure
      set({
        preferences: previousPrefs,
        error: error instanceof Error ? error.message : 'Failed to update preferences',
      });
    }
  },

  // Reset preferences to defaults
  resetPreferences: async () => {
    const previousPrefs = get().preferences;

    // Optimistic update
    set({ preferences: { ...DEFAULT_USER_PREFERENCES } });

    try {
      await saveUserPreferences({ ...DEFAULT_USER_PREFERENCES });
    } catch (error) {
      // Rollback on failure
      set({
        preferences: previousPrefs,
        error: error instanceof Error ? error.message : 'Failed to reset preferences',
      });
    }
  },

  // Clear error state
  clearError: () => {
    set({ error: null });
  },
}));
