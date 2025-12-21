/**
 * Hook to get the effective color scheme based on user preference
 * Respects user's theme setting (light/dark/system)
 */

import { useColorScheme as useSystemColorScheme } from 'react-native';
import { usePreferencesStore } from '@/stores/preferencesStore';

export function useEffectiveColorScheme(): 'light' | 'dark' {
  const systemColorScheme = useSystemColorScheme();
  const themeMode = usePreferencesStore((state) => state.preferences.themeMode);

  if (themeMode === 'system') {
    return systemColorScheme ?? 'light';
  }

  return themeMode;
}
