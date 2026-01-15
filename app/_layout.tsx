import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState, useMemo } from 'react';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { useRouteAnnouncements } from '@/hooks/use-route-announcements';
import { initializeAnalytics } from '@/services/analytics';
import { initializeLocalization } from '@/services/localization';
import { usePreferencesStore } from '@/stores/preferencesStore';
import { GdprConsentModal } from '@/components/ui/GdprConsentModal';

export const unstable_settings = {
  anchor: '(tabs)',
};

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
    },
  },
});

export default function RootLayout() {
  const systemColorScheme = useColorScheme();
  const [isConsentModalVisible, setIsConsentModalVisible] = useState(false);
  const [isConsentLoading, setIsConsentLoading] = useState(false);

  // Enable route announcements for screen readers
  useRouteAnnouncements();

  const {
    preferences,
    loadPreferences,
    setGdprConsent,
    setAnalyticsEnabled,
  } = usePreferencesStore();

  // Determine effective color scheme based on user preference
  const effectiveColorScheme = useMemo(() => {
    if (preferences.themeMode === 'system') {
      return systemColorScheme ?? 'light';
    }
    return preferences.themeMode;
  }, [preferences.themeMode, systemColorScheme]);

  // Initialize analytics service and check consent status
  useEffect(() => {
    const initializeApp = async () => {
      // Initialize localization first
      await initializeLocalization();
      
      // Load preferences
      await loadPreferences();
      
      // Initialize analytics service
      initializeAnalytics();
    };

    initializeApp();
  }, [loadPreferences]);

  // Show consent modal if GDPR consent hasn't been given
  useEffect(() => {
    if (preferences && !preferences.gdprConsentGiven) {
      setIsConsentModalVisible(true);
    }
  }, [preferences]);

  const handleConsentAccept = async () => {
    setIsConsentLoading(true);
    try {
      // Set GDPR consent and enable analytics
      await setGdprConsent(true);
      await setAnalyticsEnabled(true);
      setIsConsentModalVisible(false);
    } catch (error) {
      console.error('Failed to save consent:', error);
    } finally {
      setIsConsentLoading(false);
    }
  };

  const handleConsentDecline = async () => {
    setIsConsentLoading(true);
    try {
      // Set GDPR consent but disable analytics
      await setGdprConsent(true);
      await setAnalyticsEnabled(false);
      setIsConsentModalVisible(false);
    } catch (error) {
      console.error('Failed to save consent:', error);
    } finally {
      setIsConsentLoading(false);
    }
  };

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider value={effectiveColorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack
        screenOptions={{
          animation: 'slide_from_right',
          gestureEnabled: true,
          gestureDirection: 'horizontal',
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen 
          name="movie/[id]" 
          options={{ 
            headerShown: false,
            animation: 'slide_from_right',
          }} 
        />
        <Stack.Screen 
          name="web-series/[id]/index" 
          options={{ 
            headerShown: false,
            animation: 'slide_from_right',
          }} 
        />
        <Stack.Screen 
          name="web-series/[id]/season/[seasonNumber]/index" 
          options={{ 
            headerShown: false,
            animation: 'slide_from_right',
          }} 
        />
        <Stack.Screen 
          name="web-series/[id]/season/[seasonNumber]/episode/[episodeNumber]" 
          options={{ 
            headerShown: false,
            animation: 'slide_from_right',
          }} 
        />
        <Stack.Screen 
          name="country/[code]" 
          options={{ 
            headerShown: false,
            animation: 'slide_from_right',
          }} 
        />
        <Stack.Screen 
          name="trailer/[key]" 
          options={{ 
            headerShown: false,
            presentation: 'fullScreenModal',
            animation: 'fade',
          }} 
        />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
      </Stack>
      
      {/* GDPR Consent Modal */}
      <GdprConsentModal
        visible={isConsentModalVisible}
        onAccept={handleConsentAccept}
        onDecline={handleConsentDecline}
        isLoading={isConsentLoading}
      />
      
      <StatusBar style="auto" />
    </ThemeProvider>
    </QueryClientProvider>
  );
}
