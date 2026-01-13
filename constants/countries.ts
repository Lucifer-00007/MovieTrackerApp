/**
 * Country Constants
 * Centralized country configuration for the MovieTracker app
 */

import type { Ionicons } from '@expo/vector-icons';

/** Country code type */
export type CountryCode = 'US' | 'JP' | 'IN' | 'CN' | 'RU' | 'ES' | 'DE';

/** Extended country configuration */
export interface CountryConfig {
  code: CountryCode;
  name: string;
  flag: string;
  region: string;
  /** Icon name for the country's content type */
  icon: keyof typeof Ionicons.glyphMap;
  /** Friendly label for the region's content */
  regionLabel: string;
  /** Approximate content count */
  contentCount: string;
  /** Search terms for API queries */
  searchTerms: string[];
  /** Cloudflare API region key */
  cloudflareRegion: string;
}

/** Supported countries with full configuration */
export const COUNTRIES: Record<CountryCode, CountryConfig> = {
  US: {
    code: 'US',
    name: 'United States',
    flag: '🇺🇸',
    region: 'en-US',
    icon: 'film-outline',
    regionLabel: 'Hollywood & More',
    contentCount: '10K+ titles',
    searchTerms: ['hollywood', 'american'],
    cloudflareRegion: 'hollywood',
  },
  JP: {
    code: 'JP',
    name: 'Japan',
    flag: '🇯🇵',
    region: 'ja-JP',
    icon: 'sparkles-outline',
    regionLabel: 'Anime & J-Drama',
    contentCount: '5K+ titles',
    searchTerms: ['anime', 'japanese'],
    cloudflareRegion: 'japanese',
  },
  IN: {
    code: 'IN',
    name: 'India',
    flag: '🇮🇳',
    region: 'hi-IN',
    icon: 'musical-notes-outline',
    regionLabel: 'Bollywood & Regional',
    contentCount: '8K+ titles',
    searchTerms: ['bollywood', 'indian'],
    cloudflareRegion: 'bollywood',
  },
  CN: {
    code: 'CN',
    name: 'China',
    flag: '🇨🇳',
    region: 'zh-CN',
    icon: 'videocam-outline',
    regionLabel: 'Chinese Cinema',
    contentCount: '3K+ titles',
    searchTerms: ['chinese', 'mandarin'],
    cloudflareRegion: 'chinese',
  },
  RU: {
    code: 'RU',
    name: 'Russia',
    flag: '🇷🇺',
    region: 'ru-RU',
    icon: 'snow-outline',
    regionLabel: 'Russian Films',
    contentCount: '2K+ titles',
    searchTerms: ['russian'],
    cloudflareRegion: 'russian',
  },
  ES: {
    code: 'ES',
    name: 'Spain',
    flag: '🇪🇸',
    region: 'es-ES',
    icon: 'sunny-outline',
    regionLabel: 'Spanish Content',
    contentCount: '4K+ titles',
    searchTerms: ['spanish', 'espanol'],
    cloudflareRegion: 'spanish',
  },
  DE: {
    code: 'DE',
    name: 'Germany',
    flag: '🇩🇪',
    region: 'de-DE',
    icon: 'construct-outline',
    regionLabel: 'German Productions',
    contentCount: '2K+ titles',
    searchTerms: ['german', 'deutsch'],
    cloudflareRegion: 'german',
  },
} as const;

/** Array of supported countries (for iteration) */
export const SUPPORTED_COUNTRIES = Object.values(COUNTRIES);

/** Array of supported country codes */
export const SUPPORTED_COUNTRY_CODES = Object.keys(COUNTRIES) as CountryCode[];

/** Default values for unknown countries */
export const DEFAULT_COUNTRY_CONFIG = {
  icon: 'globe-outline' as keyof typeof Ionicons.glyphMap,
  regionLabel: 'Regional Content',
  contentCount: '1K+ titles',
  searchTerms: [] as string[],
} as const;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/** Get country config by code */
export function getCountryConfig(code: string): CountryConfig | undefined {
  return COUNTRIES[code as CountryCode];
}

/** Check if a country code is supported */
export function isCountrySupported(code: string): boolean {
  return code in COUNTRIES;
}

/** Get country icon by code */
export function getCountryIcon(code: string): keyof typeof Ionicons.glyphMap {
  return COUNTRIES[code as CountryCode]?.icon ?? DEFAULT_COUNTRY_CONFIG.icon;
}

/** Get region label by code */
export function getRegionLabel(code: string): string {
  return COUNTRIES[code as CountryCode]?.regionLabel ?? DEFAULT_COUNTRY_CONFIG.regionLabel;
}

/** Get content count by code */
export function getContentCount(code: string): string {
  return COUNTRIES[code as CountryCode]?.contentCount ?? DEFAULT_COUNTRY_CONFIG.contentCount;
}

/** Get search terms by code */
export function getSearchTerms(code: string): string[] {
  return COUNTRIES[code as CountryCode]?.searchTerms ?? DEFAULT_COUNTRY_CONFIG.searchTerms;
}

/** Get cloudflare region key by code */
export function getCloudflareRegion(code: string): string {
  return COUNTRIES[code as CountryCode]?.cloudflareRegion ?? code.toLowerCase();
}
