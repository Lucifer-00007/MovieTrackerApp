# MovieStream MVP

A cross-platform mobile application for discovering and tracking movies, TV series, and anime content worldwide. Built with React Native and Expo SDK 54.

## Features

- **Global Trending Feed** - Discover popular movies and series with hero carousel and infinite scroll
- **Country Hubs** - Browse top-rated content from USA, Japan, India, China, Russia, Spain, and Germany
- **Detailed Media Pages** - View synopsis, cast, trailers, streaming providers, and recommendations
- **Search & Filters** - Find content by title, country, genre, and release year
- **Watchlist** - Save titles for later viewing with offline persistence
- **Downloads** - Download content for offline viewing with progress tracking
- **Personalization** - Recently viewed history and genre-based recommendations
- **Themes** - Light and dark mode with system preference support
- **Accessibility** - Screen reader support, dynamic type, and 44pt touch targets

## Tech Stack

- **Framework**: React Native with Expo SDK 54
- **Language**: TypeScript (strict mode)
- **Navigation**: Expo Router 6 (file-based routing)
- **State Management**: Zustand for local state, React Query for server state
- **Styling**: React Native StyleSheet with custom theming
- **Testing**: Jest with fast-check for property-based testing
- **API**: TMDB (The Movie Database)

## Getting Started

### Prerequisites

- Node.js 18+ or Bun
- iOS Simulator (macOS) or Android Emulator
- Expo Go app (for physical device testing)

### Installation

```bash
# Install dependencies
bun install

# Start development server
bun run dev
```

### Running the App

```bash
# iOS Simulator
bun run ios

# Android Emulator
bun run android

# Web Browser
bun run web
```

## Project Structure

```
├── app/                    # Expo Router screens
│   ├── (tabs)/            # Tab navigation screens
│   ├── movie/[id].tsx     # Movie detail page
│   ├── tv/[id].tsx        # TV series detail page
│   ├── country/[code].tsx # Country hub page
│   └── trailer/[key].tsx  # Fullscreen trailer player
├── components/            # Reusable UI components
│   ├── detail/           # Detail page components
│   ├── media/            # Media cards, carousels, players
│   ├── search/           # Search utilities
│   ├── ui/               # Base UI components
│   └── watchlist/        # Watchlist utilities
├── services/             # API clients and services
│   ├── api/tmdb.ts       # TMDB API client
│   ├── analytics.ts      # Analytics service
│   ├── downloads.ts      # Download manager
│   ├── localization.ts   # i18n service
│   └── storage.ts        # AsyncStorage wrapper
├── stores/               # Zustand state stores
├── hooks/                # Custom React hooks
├── types/                # TypeScript type definitions
├── constants/            # Theme and configuration
└── __tests__/            # Test files
```

## Testing

```bash
# Run all tests
bun test

# Run tests in watch mode
bun run test:watch

# Run tests with coverage
bun run test:coverage
```

### Property-Based Testing

This project uses property-based testing with fast-check to verify correctness properties. Each property test validates specific requirements from the design document.

Example properties tested:
- Media cards render required fields for any valid input
- Search filters correctly filter results for any combination
- Watchlist toggle persists state correctly
- Theme colors maintain 4.5:1 contrast ratio

## Configuration

### Environment Variables

Create a `.env` file with your TMDB API key:

```
TMDB_API_KEY=your_api_key_here
```

### Theme Customization

Edit `constants/theme.ts` to customize colors, typography, and spacing.

## Scripts

| Command | Description |
|---------|-------------|
| `bun run dev` | Start Expo development server |
| `bun run ios` | Run on iOS simulator |
| `bun run android` | Run on Android emulator |
| `bun run web` | Run in web browser |
| `bun test` | Run test suite |
| `bun run lint` | Run ESLint |

## Architecture

The app follows a layered architecture:

1. **Presentation Layer** - React components and screens
2. **Business Logic Layer** - Custom hooks and Zustand stores
3. **Data Layer** - API clients, AsyncStorage, and caching

Key design decisions:
- File-based routing with Expo Router for type-safe navigation
- Zustand for lightweight, performant state management
- Property-based testing for comprehensive correctness verification
- Modular component design for reusability

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [TMDB](https://www.themoviedb.org/) for the movie and TV data API
- [Expo](https://expo.dev/) for the React Native development platform
- [fast-check](https://github.com/dubzzz/fast-check) for property-based testing
