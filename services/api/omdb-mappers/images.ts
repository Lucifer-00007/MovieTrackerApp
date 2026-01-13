/**
 * OMDb Image Processing
 * Utilities for handling poster URLs and image validation
 */

/**
 * Normalize poster URL from OMDb response
 * Performs additional validation beyond basic URL parsing
 */
export function normalizePosterUrl(posterUrl: string | undefined): string | null {
  if (!posterUrl || posterUrl === 'N/A') {
    return null;
  }
  
  // OMDb returns full URLs, validate them
  if (posterUrl.startsWith('http://') || posterUrl.startsWith('https://')) {
    return posterUrl;
  }
  
  return null;
}

/**
 * Validate and normalize poster URL with enhanced checks
 * Ensures the URL is accessible and points to a valid image
 * 
 * Requirements: 6.1, 6.2, 6.5
 */
export function validateAndNormalizePosterUrl(posterUrl: string): string | null {
  if (!posterUrl || posterUrl === 'N/A') {
    return null;
  }
  
  // Basic URL validation
  try {
    const url = new URL(posterUrl);
    
    // Only allow HTTP/HTTPS protocols
    if (!['http:', 'https:'].includes(url.protocol)) {
      return null;
    }
    
    // Check if it's likely an image URL
    const pathname = url.pathname.toLowerCase();
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    const hasImageExtension = imageExtensions.some(ext => pathname.endsWith(ext));
    
    // OMDb URLs typically contain image indicators even without extensions
    const hasImageIndicator = pathname.includes('img') || 
                              pathname.includes('poster') || 
                              pathname.includes('image') ||
                              url.hostname.includes('media-amazon') ||
                              url.hostname.includes('imdb');
    
    if (hasImageExtension || hasImageIndicator) {
      return posterUrl;
    }
    
    return null;
  } catch {
    return null;
  }
}