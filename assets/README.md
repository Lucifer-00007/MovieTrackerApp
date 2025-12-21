# Assets Directory

This directory contains all static assets for the MovieTracker app including images, icons, and other media files.

## Structure

### `/images/`
Static images used throughout the app:
- App icons and splash screens
- Placeholder images for movies/TV shows
- Background images and graphics
- Logo variations for light/dark themes

## Asset Guidelines

### Image Formats
- **PNG** - For icons, logos, and images with transparency
- **JPEG** - For photos and complex images without transparency
- **SVG** - For scalable vector graphics (when supported)

### Naming Conventions
- Use **kebab-case** for all asset filenames
- Include size suffixes when multiple sizes exist: `icon-24.png`, `icon-48.png`
- Use descriptive names: `movie-placeholder.png`, `app-logo-dark.png`

### Image Optimization
- Optimize all images for mobile devices
- Provide multiple resolutions for different screen densities
- Use `expo-image` component for optimized loading and caching
- Consider WebP format for better compression (when supported)

### Platform-Specific Assets
- iOS app icons: Various sizes from 20x20 to 1024x1024
- Android adaptive icons: Foreground and background layers
- Splash screens: Multiple resolutions for different devices

## Usage

Import assets using require() or ES6 imports:

```typescript
// Using require (recommended for images)
const moviePlaceholder = require('@/assets/images/movie-placeholder.png');

// Using expo-image component
import { Image } from 'expo-image';

<Image 
  source={moviePlaceholder}
  style={{ width: 200, height: 300 }}
  contentFit="cover"
/>
```

## Asset Management

- Keep assets organized in logical subdirectories
- Remove unused assets regularly to reduce bundle size
- Use asset optimization tools during build process
- Consider using remote images for dynamic content (movie posters, etc.)