# Tech Stack

## Framework & Runtime
- **React Native** with **Expo SDK 54** (managed workflow)
- **TypeScript** with strict mode enabled
- **React 19.1** with React Compiler enabled (experimental)

## Routing & Navigation
- **Expo Router 6** with file-based routing and typed routes
- **React Navigation 7** (bottom tabs, stack navigation)

## UI & Styling
- **React Native StyleSheet** for component styling
- **expo-image** for optimized image loading
- **@expo/vector-icons** and **expo-symbols** for iconography
- **react-native-reanimated** for animations
- Custom theming system with light/dark mode support

## State Management (Planned)
- **React Query** (TanStack Query) for server state
- **Zustand** for local UI state

## Build & Development
- **Bun** as package manager (bun.lock present)
- **ESLint** with expo flat config
- New Architecture enabled (`newArchEnabled: true`)

## Common Commands
```bash
# Install dependencies
bun install

# Start development server
bun run dev
# or
bun expo start

# Platform-specific
bun run ios      # iOS simulator
bun run android  # Android emulator
bun run web      # Web browser

# Linting
bun run lint

# Reset to fresh project
bun run reset-project

# Production build
bun expo export
```

## Path Aliases
- `@/*` maps to project root (e.g., `@/components`, `@/hooks`, `@/constants`)
