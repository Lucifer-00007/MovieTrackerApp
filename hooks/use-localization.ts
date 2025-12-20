import { useState, useEffect, useCallback } from 'react';
import { 
  t, 
  getCurrentLocale, 
  setLocale, 
  getAvailableLocales, 
  isRTL,
  type SupportedLocale 
} from '../services/localization';

/**
 * Hook for accessing localization functionality
 */
export function useLocalization() {
  const [currentLocale, setCurrentLocale] = useState<SupportedLocale>(getCurrentLocale());
  const [isRightToLeft, setIsRightToLeft] = useState(isRTL());

  // Update state when locale changes
  useEffect(() => {
    const locale = getCurrentLocale();
    setCurrentLocale(locale);
    setIsRightToLeft(isRTL());
  }, []);

  const changeLocale = useCallback(async (locale: SupportedLocale) => {
    try {
      await setLocale(locale);
      setCurrentLocale(locale);
      setIsRightToLeft(isRTL());
    } catch (error) {
      console.error('Failed to change locale:', error);
      throw error;
    }
  }, []);

  const translate = useCallback((key: string, options?: Record<string, string | number>) => {
    return t(key, options);
  }, []);

  return {
    currentLocale,
    isRightToLeft,
    availableLocales: getAvailableLocales(),
    changeLocale,
    t: translate,
  };
}

/**
 * Hook for translating a specific key with automatic re-rendering on locale change
 */
export function useTranslation(key: string, options?: Record<string, string | number>) {
  const { t: translate } = useLocalization();
  return translate(key, options);
}