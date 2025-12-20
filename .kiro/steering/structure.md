# Project Structure

```
├── app/                    # Expo Router file-based routing
│   ├── _layout.tsx         # Root layout (ThemeProvider, Stack navigator)
│   ├── modal.tsx           # Modal screen
│   └── (tabs)/             # Tab group (bottom navigation)
│       ├── _layout.tsx     # Tab layout configuration
│       ├── index.tsx       # Home tab
│       └── explore.tsx     # Explore tab
│
├── components/             # Reusable UI components
│   ├── ui/                 # Primitive UI components (collapsible, icons)
│   ├── themed-text.tsx     # Theme-aware text component
│   ├── themed-view.tsx     # Theme-aware view component
│   ├── parallax-scroll-view.tsx
│   └── ...
│
├── constants/              # App-wide constants
│   └── theme.ts            # Colors and fonts for light/dark themes
│
├── hooks/                  # Custom React hooks
│   ├── use-color-scheme.ts # Native color scheme detection
│   ├── use-color-scheme.web.ts # Web-specific implementation
│   └── use-theme-color.ts  # Theme color accessor
│
├── assets/                 # Static assets
│   └── images/             # App icons, splash screens, images
│
├── plans/                  # Project planning documents
├── scripts/                # Build and utility scripts
└── .kiro/                  # Kiro configuration
    ├── steering/           # AI assistant guidance
    └── specs/              # Feature specifications
```

## Conventions

### File Naming
- Use **kebab-case** for all files (e.g., `themed-text.tsx`, `use-color-scheme.ts`)
- Hooks prefixed with `use-` (e.g., `use-theme-color.ts`)
- Platform-specific files use suffix: `.ios.tsx`, `.web.ts`

### Component Patterns
- Functional components with TypeScript props interfaces
- Export named components (not default) for non-screen files
- Screen components use default exports (required by Expo Router)
- Theme-aware components accept `lightColor` and `darkColor` props

### Routing
- Route groups use parentheses: `(tabs)` for tab navigation
- `_layout.tsx` files define navigation structure
- Modal screens use `presentation: 'modal'` option

### Theming
- Colors defined in `constants/theme.ts` with `light` and `dark` variants
- Access theme colors via `useThemeColor` hook
- Use `ThemedText` and `ThemedView` for automatic theme support
