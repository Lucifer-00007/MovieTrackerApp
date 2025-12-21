# Stores Directory

This directory contains Zustand state management stores for the MovieTracker app, providing centralized state management for different app domains.

## Structure

### Core Stores
- **app-store.ts** - Global app state (theme, settings, navigation)
- **user-store.ts** - User preferences and authentication state
- **media-store.ts** - Movies, TV shows, and media-related state

### Feature Stores
- **search-store.ts** - Search queries, filters, and results
- **watchlist-store.ts** - Watchlist and favorites management
- **downloads-store.ts** - Download queue and offline content
- **player-store.ts** - Video player state and controls

## Store Architecture

### Base Store Pattern
```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface StoreState {
  // State properties
}

interface StoreActions {
  // Action methods
}

type Store = StoreState & StoreActions;

export const useStore = create<Store>()(
  persist(
    (set, get) => ({
      // Initial state
      
      // Actions
      action: () => set((state) => ({ ...state })),
    }),
    {
      name: 'store-name',
      // Persistence configuration
    }
  )
);
```

### State Slicing
```typescript
// Separate concerns with state slices
interface AppSlice {
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
}

interface UserSlice {
  user: User | null;
  login: (user: User) => void;
  logout: () => void;
}

type AppStore = AppSlice & UserSlice;
```

## Core Stores

### App Store
Global application state:
```typescript
import { useAppStore } from '@/stores/app-store';

function MyComponent() {
  const { theme, setTheme, isLoading } = useAppStore();
  
  return (
    <Button onPress={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
      Toggle Theme
    </Button>
  );
}
```

### Media Store
Movies and TV shows state:
```typescript
import { useMediaStore } from '@/stores/media-store';

function MovieList() {
  const { 
    trendingMovies, 
    fetchTrendingMovies, 
    isLoading 
  } = useMediaStore();
  
  useEffect(() => {
    fetchTrendingMovies();
  }, []);
}
```

### Watchlist Store
User's saved content:
```typescript
import { useWatchlistStore } from '@/stores/watchlist-store';

function MovieCard({ movie }) {
  const { 
    watchlist, 
    addToWatchlist, 
    removeFromWatchlist,
    isInWatchlist 
  } = useWatchlistStore();
  
  const inWatchlist = isInWatchlist(movie.id);
}
```

## Store Categories

### UI State
- **Theme** - Light/dark mode preferences
- **Navigation** - Current route and navigation state
- **Modals** - Modal visibility and content
- **Loading** - Loading states for different operations

### User Data
- **Authentication** - Login status and user info
- **Preferences** - User settings and customization
- **History** - Recently viewed content
- **Favorites** - Liked and saved content

### Content Data
- **Movies** - Movie data and metadata
- **TV Shows** - Series data and episode information
- **Search** - Search results and query history
- **Recommendations** - Personalized content suggestions

### App Features
- **Downloads** - Offline content management
- **Player** - Video playback state
- **Notifications** - Alert and notification state
- **Sync** - Data synchronization status

## Persistence Strategy

### Local Storage
```typescript
// Persist user preferences
export const useUserStore = create<UserStore>()(
  persist(
    (set, get) => ({
      // Store implementation
    }),
    {
      name: 'user-preferences',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
```

### Selective Persistence
```typescript
// Only persist specific fields
export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      // Store implementation
    }),
    {
      name: 'app-state',
      partialize: (state) => ({
        theme: state.theme,
        language: state.language,
        // Don't persist loading states
      }),
    }
  )
);
```

## State Management Patterns

### Optimistic Updates
```typescript
// Update UI immediately, handle errors later
const addToWatchlist = async (movie: Movie) => {
  // Optimistic update
  set((state) => ({
    watchlist: [...state.watchlist, movie]
  }));
  
  try {
    await api.addToWatchlist(movie.id);
  } catch (error) {
    // Revert on error
    set((state) => ({
      watchlist: state.watchlist.filter(m => m.id !== movie.id)
    }));
    throw error;
  }
};
```

### Computed Values
```typescript
// Derive state from other state
const useMediaStore = create<MediaStore>((set, get) => ({
  movies: [],
  searchQuery: '',
  
  // Computed getter
  get filteredMovies() {
    const { movies, searchQuery } = get();
    return movies.filter(movie => 
      movie.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
  },
}));
```

### Action Composition
```typescript
// Compose complex actions from simple ones
const useWatchlistStore = create<WatchlistStore>((set, get) => ({
  watchlist: [],
  
  addToWatchlist: (movie) => set((state) => ({
    watchlist: [...state.watchlist, movie]
  })),
  
  removeFromWatchlist: (movieId) => set((state) => ({
    watchlist: state.watchlist.filter(m => m.id !== movieId)
  })),
  
  toggleWatchlist: (movie) => {
    const { isInWatchlist, addToWatchlist, removeFromWatchlist } = get();
    if (isInWatchlist(movie.id)) {
      removeFromWatchlist(movie.id);
    } else {
      addToWatchlist(movie);
    }
  },
}));
```

## Best Practices

### Store Design
- Keep stores focused on specific domains
- Use TypeScript for all state and actions
- Implement proper error handling
- Use immer for complex state updates

### Performance
- Use selectors to prevent unnecessary re-renders
- Implement proper memoization
- Avoid storing derived state
- Use shallow equality checks

### Testing
- Test store actions and state changes
- Mock external dependencies
- Use property-based testing for state invariants
- Test persistence and rehydration

### DevTools
- Use Zustand devtools for debugging
- Implement proper action naming
- Add logging for important state changes
- Monitor store performance