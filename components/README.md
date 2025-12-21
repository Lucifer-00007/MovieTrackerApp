# Components Directory

This directory contains all reusable UI components for the MovieTracker app, organized by functionality and complexity.

## Structure

### `/ui/`
Primitive, low-level UI components:
- Base components like buttons, inputs, modals
- Icon components and wrappers
- Collapsible components
- Generic layout components

### Feature-Specific Directories
- `/detail/` - Components for movie/TV detail pages
- `/media/` - Media cards, carousels, and players
- `/search/` - Search-related components and filters
- `/watchlist/` - Watchlist and favorites components

### Theme Components
- **themed-text.tsx** - Theme-aware text component
- **themed-view.tsx** - Theme-aware view component
- **parallax-scroll-view.tsx** - Parallax scrolling component

## Component Conventions

### Naming
- Use **kebab-case** for component files
- Use **PascalCase** for component names
- Prefix theme-aware components with "Themed"

### Structure
```typescript
// Component interface
interface ComponentProps {
  // Props definition
}

// Main component
export function ComponentName({ ...props }: ComponentProps) {
  // Component logic
  return (
    // JSX
  );
}
```

### Export Pattern
- Use **named exports** for reusable components
- Avoid default exports (except for screens)
- Export types alongside components when needed

### Theme Integration
- Accept `lightColor` and `darkColor` props for theme-aware components
- Use `useThemeColor` hook for accessing theme colors
- Extend `ThemedText` and `ThemedView` for consistent theming

## Component Categories

### Base UI Components (`/ui/`)
- Buttons, inputs, modals
- Icons and graphics
- Layout containers
- Navigation elements

### Media Components (`/media/`)
- Movie/TV cards
- Image carousels
- Video players
- Rating displays

### Detail Components (`/detail/`)
- Synopsis sections
- Cast lists
- Trailer players
- Recommendation grids

### Search Components (`/search/`)
- Search bars
- Filter controls
- Result lists
- Sort options

### Watchlist Components (`/watchlist/`)
- Add/remove buttons
- Watchlist grids
- Progress indicators
- Download status

## Best Practices

- Keep components focused and single-purpose
- Use TypeScript interfaces for all props
- Implement proper accessibility features
- Follow React Native performance guidelines
- Test components with property-based testing
- Document complex components with JSDoc comments