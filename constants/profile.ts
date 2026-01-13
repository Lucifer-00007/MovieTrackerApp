/**
 * Profile screen constants
 * Contains configuration for languages, themes, and grid layout
 */

import { Dimensions } from 'react-native';
import { Spacing } from '@/constants/theme';
import type { ThemeMode } from '@/types/user';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

/** Grid configuration */
export const PROFILE_GRID = {
  NUM_COLUMNS: 3,
  CARD_SPACING: Spacing.sm,
  get CARD_WIDTH() {
    return (SCREEN_WIDTH - Spacing.md * 2 - this.CARD_SPACING * (this.NUM_COLUMNS - 1)) / this.NUM_COLUMNS;
  },
  get CARD_HEIGHT() {
    return this.CARD_WIDTH * 1.5;
  },
} as const;

/** Language option type */
export interface LanguageOption {
  code: string;
  name: string;
}

/** Available languages */
export const LANGUAGES: LanguageOption[] = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Español' },
  { code: 'fr', name: 'Français' },
  { code: 'de', name: 'Deutsch' },
  { code: 'ja', name: '日本語' },
  { code: 'zh', name: '中文' },
];

/** Theme mode option type */
export interface ThemeModeOption {
  value: ThemeMode;
  label: string;
  description: string;
}

/** Theme mode options */
export const THEME_MODES: ThemeModeOption[] = [
  { value: 'light', label: 'Light', description: 'Always use light theme' },
  { value: 'dark', label: 'Dark', description: 'Always use dark theme' },
  { value: 'system', label: 'System', description: 'Follow device setting' },
];

/** Get language name by code */
export function getLanguageName(code: string): string {
  const language = LANGUAGES.find(lang => lang.code === code);
  return language?.name || 'English';
}

/** Get theme label by mode */
export function getThemeLabel(mode: ThemeMode): string {
  const theme = THEME_MODES.find(t => t.value === mode);
  return theme?.label || 'System';
}
