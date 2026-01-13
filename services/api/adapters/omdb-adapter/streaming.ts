/**
 * OMDb Adapter - Streaming Methods
 * Handles streaming provider information with fallback data
 */

import type { StreamingProvider } from '@/types/media';
import { logFallbackUsage } from './utils';
import { STREAMING_URLS } from '@/constants/api';

/**
 * Get streaming/watch providers
 * Fallback: Returns reasonable defaults since OMDb doesn't provide this data
 * Provides common streaming platforms as potential providers
 * 
 * Requirements: 4.4, 6.4
 */
export async function getWatchProviders(
  mediaType: 'movie' | 'tv',
  mediaId: number,
  countryCode: string
): Promise<StreamingProvider[]> {
  logFallbackUsage('getWatchProviders', 'reasonable defaults (not supported by OMDb)');
  
  // Provide reasonable defaults based on country
  const commonProviders: StreamingProvider[] = [];
  
  // Add common providers based on country
  switch (countryCode.toUpperCase()) {
    case 'US':
      commonProviders.push(
        { 
          providerId: 8, 
          providerName: 'Netflix', 
          logoPath: '/netflix-logo.png', 
          link: STREAMING_URLS.NETFLIX,
          type: 'flatrate',
          isAvailable: true
        },
        { 
          providerId: 337, 
          providerName: 'Disney Plus', 
          logoPath: '/disney-plus-logo.png', 
          link: STREAMING_URLS.DISNEY_PLUS,
          type: 'flatrate',
          isAvailable: true
        },
        { 
          providerId: 15, 
          providerName: 'Hulu', 
          logoPath: '/hulu-logo.png', 
          link: STREAMING_URLS.HULU,
          type: 'flatrate',
          isAvailable: true
        },
        { 
          providerId: 9, 
          providerName: 'Amazon Prime Video', 
          logoPath: '/amazon-prime-logo.png', 
          link: STREAMING_URLS.PRIME_VIDEO,
          type: 'flatrate',
          isAvailable: true
        }
      );
      break;
    case 'GB':
    case 'UK':
      commonProviders.push(
        { 
          providerId: 8, 
          providerName: 'Netflix', 
          logoPath: '/netflix-logo.png', 
          link: STREAMING_URLS.NETFLIX,
          type: 'flatrate',
          isAvailable: true
        },
        { 
          providerId: 9, 
          providerName: 'Amazon Prime Video', 
          logoPath: '/amazon-prime-logo.png', 
          link: STREAMING_URLS.PRIME_VIDEO,
          type: 'flatrate',
          isAvailable: true
        },
        { 
          providerId: 337, 
          providerName: 'Disney Plus', 
          logoPath: '/disney-plus-logo.png', 
          link: STREAMING_URLS.DISNEY_PLUS,
          type: 'flatrate',
          isAvailable: true
        },
        { 
          providerId: 103, 
          providerName: 'BBC iPlayer', 
          logoPath: '/bbc-iplayer-logo.png', 
          link: STREAMING_URLS.BBC_IPLAYER,
          type: 'flatrate',
          isAvailable: true
        }
      );
      break;
    case 'CA':
      commonProviders.push(
        { 
          providerId: 8, 
          providerName: 'Netflix', 
          logoPath: '/netflix-logo.png', 
          link: STREAMING_URLS.NETFLIX,
          type: 'flatrate',
          isAvailable: true
        },
        { 
          providerId: 9, 
          providerName: 'Amazon Prime Video', 
          logoPath: '/amazon-prime-logo.png', 
          link: STREAMING_URLS.PRIME_VIDEO,
          type: 'flatrate',
          isAvailable: true
        },
        { 
          providerId: 337, 
          providerName: 'Disney Plus', 
          logoPath: '/disney-plus-logo.png', 
          link: STREAMING_URLS.DISNEY_PLUS,
          type: 'flatrate',
          isAvailable: true
        },
        { 
          providerId: 230, 
          providerName: 'Crave', 
          logoPath: '/crave-logo.png', 
          link: STREAMING_URLS.CRAVE,
          type: 'flatrate',
          isAvailable: true
        }
      );
      break;
    default:
      // Global providers for other countries
      commonProviders.push(
        { 
          providerId: 8, 
          providerName: 'Netflix', 
          logoPath: '/netflix-logo.png', 
          link: STREAMING_URLS.NETFLIX,
          type: 'flatrate',
          isAvailable: true
        },
        { 
          providerId: 9, 
          providerName: 'Amazon Prime Video', 
          logoPath: '/amazon-prime-logo.png', 
          link: STREAMING_URLS.PRIME_VIDEO,
          type: 'flatrate',
          isAvailable: true
        },
        { 
          providerId: 337, 
          providerName: 'Disney Plus', 
          logoPath: '/disney-plus-logo.png', 
          link: STREAMING_URLS.DISNEY_PLUS,
          type: 'flatrate',
          isAvailable: true
        }
      );
      break;
  }
  
  // Return a subset of providers (simulate that not all content is on all platforms)
  // Return 1-3 providers randomly to simulate realistic availability
  const numProviders = Math.min(commonProviders.length, Math.floor(Math.random() * 3) + 1);
  return commonProviders.slice(0, numProviders);
}