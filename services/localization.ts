import { I18n } from 'i18n-js';
import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import locale files
import en from '../locales/en.json';

// Define supported locales
export const SUPPORTED_LOCALES = {
  en: 'English',
  // Add more locales as they become available
  // es: 'Español',
  // fr: 'Français',
  // de: 'Deutsch',
  // ja: '日本語',
  // zh: '中文',
  // ru: 'Русский',
  // hi: 'हिन्दी',
} as const;

export type SupportedLocale = keyof typeof SUPPORTED_LOCALES;

// Create i18n instance
const i18n = new I18n({
  en,
  // Add more translations as they become available
});

// Configuration
i18n.enableFallback = true;
i18n.defaultLocale = 'en';

// Storage key for persisted locale preference
const LOCALE_STORAGE_KEY = 'user_locale_preference';

/**
 * Initialize the localization system
 * Sets up the locale based on user preference or device locale
 */
export async function initializeLocalization(): Promise<void> {
  try {
    // Try to get user's saved locale preference
    const savedLocale = await AsyncStorage.getItem(LOCALE_STORAGE_KEY);
    
    if (savedLocale && isValidLocale(savedLocale)) {
      i18n.locale = savedLocale;
    } else {
      // Fall back to device locale or default
      const deviceLocale = getDeviceLocale();
      i18n.locale = deviceLocale;
    }
  } catch (error) {
    console.warn('Failed to initialize localization:', error);
    i18n.locale = 'en'; // Fallback to English
  }
}

/**
 * Get the device's preferred locale
 * Returns a supported locale or falls back to English
 */
function getDeviceLocale(): SupportedLocale {
  const deviceLocales = Localization.getLocales();
  
  for (const locale of deviceLocales) {
    const languageCode = locale.languageCode as SupportedLocale;
    if (isValidLocale(languageCode)) {
      return languageCode;
    }
  }
  
  return 'en'; // Default fallback
}

/**
 * Check if a locale code is supported
 */
function isValidLocale(locale: string): locale is SupportedLocale {
  return locale in SUPPORTED_LOCALES;
}

/**
 * Get the current locale
 */
export function getCurrentLocale(): SupportedLocale {
  return i18n.locale as SupportedLocale;
}

/**
 * Set the current locale and persist the preference
 */
export async function setLocale(locale: SupportedLocale): Promise<void> {
  if (!isValidLocale(locale)) {
    throw new Error(`Unsupported locale: ${locale}`);
  }
  
  i18n.locale = locale;
  
  try {
    await AsyncStorage.setItem(LOCALE_STORAGE_KEY, locale);
  } catch (error) {
    console.warn('Failed to save locale preference:', error);
  }
}

/**
 * Get available locales
 */
export function getAvailableLocales(): Array<{ code: SupportedLocale; name: string }> {
  return Object.entries(SUPPORTED_LOCALES).map(([code, name]) => ({
    code: code as SupportedLocale,
    name,
  }));
}

/**
 * Translate a key with optional interpolation
 */
export function t(key: string, options?: Record<string, string | number>): string {
  return i18n.t(key, options);
}

/**
 * Check if the current locale uses RTL (right-to-left) layout
 */
export function isRTL(): boolean {
  const rtlLocales = ['ar', 'he', 'fa', 'ur']; // Add RTL language codes
  return rtlLocales.includes(getCurrentLocale());
}

/**
 * Get locale information from expo-localization
 */
export function getLocaleInfo() {
  return {
    locales: Localization.getLocales(),
    timezone: Localization.timezone,
    region: Localization.region,
    currency: Localization.currency,
    decimalSeparator: Localization.decimalSeparator,
    digitGroupingSeparator: Localization.digitGroupingSeparator,
    isRTL: Localization.isRTL,
    isMetric: Localization.isMetric,
  };
}

// Export the i18n instance for direct access if needed
export { i18n };