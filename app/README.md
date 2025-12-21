# App Directory

This directory contains all screen components and routing configuration for the MovieTracker app using Expo Router 6.

## Structure

### Root Files
- **_layout.tsx** - Root layout with ThemeProvider and Stack navigator
- **modal.tsx** - Modal screen presentation

### Route Groups
- **(tabs)/** - Tab navigation group containing home and explore screens
- **country/** - Country hub pages for regional content
- **movie/** - Movie detail pages
- **tv/** - TV series detail pages  
- **trailer/** - Fullscreen trailer player

## Routing Conventions

- **File-based routing** - Each file automatically becomes a route
- **Dynamic routes** - Use `[param].tsx` for dynamic segments (e.g., `movie/[id].tsx`)
- **Route groups** - Use `(groupName)` for organizing routes without affecting URL structure
- **Layout files** - `_layout.tsx` files define navigation structure for their directory
- **Default exports** - All screen components must use default exports (Expo Router requirement)

## Navigation Structure

```
/ (Root Layout - Stack Navigator)
├── /modal (Modal presentation)
└── /(tabs) (Tab Navigator)
    ├── / (Home tab - index.tsx)
    └── /explore (Explore tab)
```

Dynamic routes:
- `/movie/[id]` - Movie detail page
- `/tv/[id]` - TV series detail page
- `/country/[code]` - Country hub page
- `/trailer/[key]` - Trailer player

## Key Features

- **Type-safe navigation** with Expo Router
- **Nested navigators** (Stack + Tabs)
- **Modal presentations** for overlay screens
- **Theme integration** with automatic light/dark mode
- **Deep linking** support for all routes