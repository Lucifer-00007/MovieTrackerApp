import * as Localization from 'expo-localization';
import { getCurrentLocale } from '../services/localization';

/**
 * Format a date according to the current locale
 */
export function formatDate(
  date: Date | string | number,
  options: Intl.DateTimeFormatOptions = {}
): string {
  const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
  
  if (isNaN(dateObj.getTime())) {
    return 'Invalid Date';
  }
  
  const locale = getCurrentLocale();
  const localeCode = getIntlLocaleCode(locale);
  
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    ...options,
  };
  
  try {
    return new Intl.DateTimeFormat(localeCode, defaultOptions).format(dateObj);
  } catch (error) {
    // Fallback to English if locale is not supported
    return new Intl.DateTimeFormat('en-US', defaultOptions).format(dateObj);
  }
}

/**
 * Format a date for display in media cards (e.g., "2023", "Dec 2023")
 */
export function formatReleaseDate(date: string): string {
  if (!date) return '';
  
  const dateObj = new Date(date);
  if (isNaN(dateObj.getTime())) return date;
  
  return formatDate(dateObj, { year: 'numeric' });
}

/**
 * Format a date for detail pages (e.g., "December 15, 2023")
 */
export function formatDetailDate(date: string): string {
  if (!date) return '';
  
  const dateObj = new Date(date);
  if (isNaN(dateObj.getTime())) return date;
  
  return formatDate(dateObj, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Format a number according to the current locale
 */
export function formatNumber(
  number: number,
  options: Intl.NumberFormatOptions = {}
): string {
  if (typeof number !== 'number' || isNaN(number)) {
    return '0';
  }
  
  const locale = getCurrentLocale();
  const localeCode = getIntlLocaleCode(locale);
  
  try {
    return new Intl.NumberFormat(localeCode, options).format(number);
  } catch (error) {
    // Fallback to English if locale is not supported
    return new Intl.NumberFormat('en-US', options).format(number);
  }
}

/**
 * Format a rating (e.g., "8.5", "7.2/10")
 */
export function formatRating(rating: number, maxRating: number = 10): string {
  if (typeof rating !== 'number' || isNaN(rating)) {
    return '';
  }
  
  const formattedRating = formatNumber(rating, {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
  
  return maxRating === 10 ? formattedRating : `${formattedRating}/${maxRating}`;
}

/**
 * Format runtime in minutes to hours and minutes (e.g., "2h 30m")
 */
export function formatRuntime(minutes: number): string {
  if (typeof minutes !== 'number' || isNaN(minutes) || minutes <= 0) {
    return '';
  }
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  if (hours === 0) {
    return `${remainingMinutes}m`;
  }
  
  if (remainingMinutes === 0) {
    return `${hours}h`;
  }
  
  return `${hours}h ${remainingMinutes}m`;
}

/**
 * Format file size in bytes to human readable format (e.g., "1.5 GB")
 */
export function formatFileSize(bytes: number): string {
  if (typeof bytes !== 'number' || isNaN(bytes) || bytes < 0) {
    return '0 B';
  }
  
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let size = bytes;
  let unitIndex = 0;
  
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  
  const formattedSize = formatNumber(size, {
    minimumFractionDigits: unitIndex > 0 ? 1 : 0,
    maximumFractionDigits: unitIndex > 0 ? 1 : 0,
  });
  
  return `${formattedSize} ${units[unitIndex]}`;
}

/**
 * Format percentage (e.g., "75%")
 */
export function formatPercentage(value: number): string {
  if (typeof value !== 'number' || isNaN(value)) {
    return '0%';
  }
  
  return formatNumber(value, {
    style: 'percent',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

/**
 * Format currency according to locale
 */
export function formatCurrency(amount: number, currency: string = 'USD'): string {
  if (typeof amount !== 'number' || isNaN(amount)) {
    return '';
  }
  
  const locale = getCurrentLocale();
  const localeCode = getIntlLocaleCode(locale);
  
  try {
    return new Intl.NumberFormat(localeCode, {
      style: 'currency',
      currency,
    }).format(amount);
  } catch (error) {
    // Fallback to USD format
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  }
}

/**
 * Format relative time (e.g., "2 hours ago", "in 3 days")
 */
export function formatRelativeTime(date: Date | string | number): string {
  const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
  
  if (isNaN(dateObj.getTime())) {
    return '';
  }
  
  const locale = getCurrentLocale();
  const localeCode = getIntlLocaleCode(locale);
  
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000);
  
  try {
    const rtf = new Intl.RelativeTimeFormat(localeCode, { numeric: 'auto' });
    
    if (Math.abs(diffInSeconds) < 60) {
      return rtf.format(-diffInSeconds, 'second');
    } else if (Math.abs(diffInSeconds) < 3600) {
      return rtf.format(-Math.floor(diffInSeconds / 60), 'minute');
    } else if (Math.abs(diffInSeconds) < 86400) {
      return rtf.format(-Math.floor(diffInSeconds / 3600), 'hour');
    } else if (Math.abs(diffInSeconds) < 2592000) {
      return rtf.format(-Math.floor(diffInSeconds / 86400), 'day');
    } else if (Math.abs(diffInSeconds) < 31536000) {
      return rtf.format(-Math.floor(diffInSeconds / 2592000), 'month');
    } else {
      return rtf.format(-Math.floor(diffInSeconds / 31536000), 'year');
    }
  } catch (error) {
    // Fallback to simple format
    return formatDate(dateObj);
  }
}

/**
 * Convert app locale code to Intl-compatible locale code
 */
function getIntlLocaleCode(locale: string): string {
  const localeMap: Record<string, string> = {
    en: 'en-US',
    es: 'es-ES',
    fr: 'fr-FR',
    de: 'de-DE',
    ja: 'ja-JP',
    zh: 'zh-CN',
    ru: 'ru-RU',
    hi: 'hi-IN',
  };
  
  return localeMap[locale] || 'en-US';
}

/**
 * Get locale-specific decimal and grouping separators
 */
export function getLocaleSeparators(): {
  decimal: string;
  grouping: string;
} {
  const localeInfo = Localization.getLocales()[0];
  
  return {
    decimal: localeInfo?.decimalSeparator || '.',
    grouping: localeInfo?.digitGroupingSeparator || ',',
  };
}

/**
 * Format a number with locale-specific separators
 */
export function formatNumberWithSeparators(number: number): string {
  const separators = getLocaleSeparators();
  const formatted = formatNumber(number);
  
  // The Intl.NumberFormat already handles separators correctly
  return formatted;
}