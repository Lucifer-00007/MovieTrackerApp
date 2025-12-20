# Implementation Plan: MovieStream MVP

## Overview

This implementation plan breaks down the MovieStream MVP into incremental coding tasks. Each task builds on previous work, ensuring no orphaned code. The plan prioritizes core functionality first, with testing tasks marked as optional (*) for faster MVP delivery.

## Tasks

- [x] 1. Project Setup and Core Infrastructure
  - [x] 1.1 Configure project structure and dependencies
    - Install additional dependencies: @tanstack/react-query, zustand, fast-check, @react-native-async-storage/async-storage, expo-av, expo-notifications
    - Create folder structure: services/, stores/, types/, utils/, __tests__/
    - Configure fast-check with Jest for property-based testing
    - _Requirements: 9.1, 10.1_

  - [x] 1.2 Create TypeScript type definitions
    - Create types/media.ts with MediaItem, TrendingItem, MediaDetails, CastMember interfaces
    - Create types/watchlist.ts with WatchlistItem interface
    - Create types/downloads.ts with DownloadItem, DownloadQueueItem interfaces
    - Create types/analytics.ts with AnalyticsEvent interface
    - Create types/user.ts with UserPreferences, SearchFilters interfaces
    - _Requirements: All data model requirements_

  - [x] 1.3 Extend theme configuration
    - Update constants/theme.ts with complete color palette for light/dark modes
    - Add spacing, typography, and component-specific tokens
    - Ensure 4.5:1 contrast ratios for all text colors
    - _Requirements: 9.1, 9.5_

  - [x] 1.4 Write property tests for theme contrast ratios
    - **Property 23: Color Contrast Compliance**
    - **Validates: Requirements 9.5**

- [x] 2. API Client and Data Layer
  - [x] 2.1 Create TMDB API client
    - Create services/api/tmdb.ts with base configuration
    - Implement getTrending(), getMovieDetails(), getTvDetails(), searchMulti()
    - Implement getMovieCredits(), getTvCredits(), getWatchProviders()
    - Implement getRecommendations(), discoverByCountry()
    - Add retry logic with exponential backoff (3 attempts)
    - _Requirements: 1.1, 3.2, 4.2, 6.2, 16.7_

  - [x] 2.2 Write property tests for API retry logic
    - **Property 40: Network Retry Logic**
    - **Validates: Requirements 16.7**

  - [x] 2.3 Create AsyncStorage service
    - Create services/storage.ts with typed get/set/remove operations
    - Implement watchlist persistence functions
    - Implement recently viewed persistence functions
    - Implement user preferences persistence
    - _Requirements: 7.3, 14.3_

  - [x] 2.4 Write property tests for storage persistence
    - **Property 16: Watchlist Toggle** (persistence aspect)
    - **Property 34: Recently Viewed Persistence**
    - **Validates: Requirements 7.3, 14.3**

- [x] 3. State Management
  - [x] 3.1 Create Zustand stores
    - Create stores/watchlistStore.ts with add/remove/toggle actions
    - Create stores/downloadsStore.ts with queue management
    - Create stores/preferencesStore.ts with theme/language/analytics settings
    - Create stores/recentlyViewedStore.ts with add/get actions
    - _Requirements: 7.2, 8.2, 9.2, 14.1_

  - [x] 3.2 Write property tests for watchlist store
    - **Property 16: Watchlist Toggle**
    - **Validates: Requirements 7.2**

  - [x] 3.3 Write property tests for recently viewed store
    - **Property 33: Recently Viewed Limit**
    - **Property 35: Recently Viewed Row Visibility**
    - **Validates: Requirements 14.1, 14.4**

- [x] 4. Checkpoint - Core Infrastructure
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Core UI Components
  - [x] 5.1 Create Media Card component
    - Create components/media/MediaCard.tsx with variant support (large/medium/small)
    - Implement poster image with expo-image and placeholder fallback
    - Implement rating badge with conditional visibility
    - Add accessibility labels for all interactive elements
    - Ensure 44x44 minimum touch target
    - _Requirements: 2.1, 2.2, 2.3, 12.1, 12.3, 17.4, 17.5_

  - [x] 5.2 Write property tests for Media Card
    - **Property 1: Media Card Renders Required Fields**
    - **Property 2: Media Card Variant Dimensions**
    - **Property 3: Media Card Graceful Degradation**
    - **Property 27: Accessibility Labels**
    - **Property 28: Touch Target Size**
    - **Validates: Requirements 2.1, 2.2, 12.1, 12.3, 17.4, 17.5**

  - [x] 5.3 Create Hero Carousel component
    - Create components/media/HeroCarousel.tsx with auto-advance (5s interval)
    - Implement swipe gesture navigation with react-native-gesture-handler
    - Add pagination indicators
    - _Requirements: 1.1, 1.2, 1.3_

  - [x] 5.4 Create Content Row component
    - Create components/media/ContentRow.tsx with horizontal scroll
    - Implement infinite scroll with onEndReached callback
    - Add section title and "See All" link
    - _Requirements: 1.4, 1.5_

  - [x] 5.5 Write property tests for infinite scroll pagination
    - **Property 4: Infinite Scroll Pagination**
    - **Validates: Requirements 1.5**

  - [x] 5.6 Create Skeleton components
    - Create components/ui/Skeleton.tsx with variants (card, hero, row, detail)
    - Implement shimmer animation with react-native-reanimated
    - _Requirements: 1.6_

  - [x] 5.7 Create Error and Empty State components
    - Create components/ui/ErrorState.tsx with retry button
    - Create components/ui/EmptyState.tsx with suggestions
    - Create components/ui/OfflineBanner.tsx
    - _Requirements: 6.5, 16.1, 16.2, 16.6, 17.2_

  - [x] 5.8 Write property tests for error states
    - **Property 38: Offline Banner Display**
    - **Property 39: Server Error Display**
    - **Property 42: Empty Filter Results Handling**
    - **Validates: Requirements 16.1, 16.2, 17.2**

- [x] 6. Checkpoint - Core Components
  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. Navigation Setup
  - [x] 7.1 Configure tab navigation
    - Update app/(tabs)/_layout.tsx with 5 tabs: Home, Browse, Downloads, Search, Profile
    - Add appropriate icons for each tab
    - Configure active tab highlighting
    - _Requirements: 10.1, 10.2, 10.3_

  - [x] 7.2 Create screen routes
    - Create app/movie/[id].tsx for movie details
    - Create app/tv/[id].tsx for TV series details
    - Create app/country/[code].tsx for country hub
    - Create app/trailer/[key].tsx for fullscreen trailer
    - Configure smooth animated transitions
    - _Requirements: 2.4, 10.4, 10.5_

- [x] 8. Home Screen Implementation
  - [x] 8.1 Implement Home Screen with Trending Feed
    - Update app/(tabs)/index.tsx with hero carousel and content rows
    - Integrate useQuery for trending data fetching
    - Add skeleton loading states
    - Add Recently Viewed row (conditional on non-empty)
    - Add Recommendations row (conditional on watchlist)
    - _Requirements: 1.1, 1.4, 1.6, 14.1, 14.2, 14.4_

  - [x] 8.2 Write property tests for personalization rows
    - **Property 35: Recently Viewed Row Visibility**
    - **Property 36: Recommendations Based on Watchlist**
    - **Validates: Requirements 14.2, 14.4**

- [x] 9. Detail Page Implementation
  - [x] 9.1 Create Detail Page layout
    - Create shared components/detail/DetailHeader.tsx with parallax hero
    - Create components/detail/Synopsis.tsx with expand/collapse
    - Create components/detail/CastCarousel.tsx with 10-member limit
    - Create components/detail/ProviderList.tsx with availability status
    - Create components/detail/RecommendationsRow.tsx
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.8_

  - [x] 9.2 Write property tests for Detail Page components
    - **Property 8: Detail Page Required Fields**
    - **Property 9: Synopsis Expandability**
    - **Property 10: Cast Carousel Display**
    - **Property 11: Cast Member Limit**
    - **Property 12: Streaming Provider Display**
    - **Validates: Requirements 4.2, 4.3, 4.4, 4.5, 4.6, 16.3**

  - [x] 9.3 Implement Movie Detail Screen
    - Implement app/movie/[id].tsx with data fetching
    - Add watchlist toggle button
    - Add download button (conditional)
    - Handle missing data gracefully (cast, providers)
    - _Requirements: 4.2, 7.2, 8.1, 17.1, 17.6_

  - [x] 9.4 Write property tests for edge case handling
    - **Property 41: Empty Cast Section Handling**
    - **Property 43: Empty Providers Handling**
    - **Validates: Requirements 17.1, 17.6**

  - [x] 9.5 Implement TV Detail Screen
    - Implement app/tv/[id].tsx with data fetching
    - Reuse detail components from movie screen
    - Add season/episode information display
    - _Requirements: 4.2_

- [x] 10. Trailer Playback
  - [x] 10.1 Implement trailer player
    - Create components/media/TrailerPlayer.tsx with expo-av
    - Add play/pause, seek, fullscreen controls
    - Implement app/trailer/[key].tsx fullscreen route
    - Handle trailer unavailable state
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

  - [x] 10.2 Write property tests for trailer visibility
    - **Property 13: Trailer Button Visibility**
    - **Validates: Requirements 5.1, 5.5**

- [ ] 11. Checkpoint - Core Screens
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 12. Country Hub Implementation
  - [ ] 12.1 Create Country Hub screen
    - Implement app/country/[code].tsx with ranked content list
    - Add country flag and name header
    - Implement rank badges (1-10)
    - Add Content_Type filter (movies, series, anime)
    - Add genre and year filters
    - Handle empty filter results
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 17.2_

  - [ ] 12.2 Write property tests for Country Hub
    - **Property 5: Country Hub Content Filtering**
    - **Property 6: Country Hub Rank Badges**
    - **Property 7: Country Hub Header Display**
    - **Validates: Requirements 3.3, 3.4, 3.5, 3.6**

  - [ ] 12.3 Create Browse screen with country selection
    - Implement app/(tabs)/browse.tsx with country grid
    - Display all 7 supported countries with flags
    - Navigate to Country Hub on selection
    - _Requirements: 3.1_

- [ ] 13. Search Implementation
  - [ ] 13.1 Create Search screen
    - Implement app/(tabs)/search.tsx with search input
    - Add 300ms debounce for instant suggestions
    - Group results by Content_Type (movies, TV)
    - Add filter controls (country, genre, year)
    - Handle empty results with suggestions
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6_

  - [ ] 13.2 Write property tests for search
    - **Property 14: Search Results Grouping**
    - **Property 15: Search Filter Application**
    - **Validates: Requirements 6.3, 6.4**

- [ ] 14. Watchlist Implementation
  - [ ] 14.1 Create Watchlist screen
    - Implement watchlist grid in app/(tabs)/profile.tsx or dedicated screen
    - Display all saved titles in grid layout
    - Add remove functionality with immediate UI update
    - Implement sync status indicators
    - _Requirements: 7.4, 7.5, 7.6_

  - [ ] 14.2 Write property tests for watchlist display
    - **Property 17: Watchlist Grid Display**
    - **Validates: Requirements 7.4**

- [ ] 15. Checkpoint - Feature Screens
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 16. Downloads Implementation
  - [ ] 16.1 Create Downloads screen
    - Implement app/(tabs)/downloads.tsx with download list
    - Display download progress for active downloads
    - Show storage usage information
    - Add pause/resume/cancel controls
    - _Requirements: 8.2, 8.3, 8.5_

  - [ ] 16.2 Write property tests for downloads
    - **Property 18: Download Progress Tracking**
    - **Property 19: Download Pause/Resume**
    - **Property 20: Storage Warning**
    - **Property 21: Download Cancellation Cleanup**
    - **Validates: Requirements 8.2, 8.3, 8.6, 17.3**

  - [ ] 16.3 Implement download service
    - Create services/downloads.ts with background download support
    - Implement storage check before download
    - Add download complete notification
    - _Requirements: 8.4, 8.6, 8.7, 15.1_

  - [ ] 16.4 Write property tests for download notifications
    - **Property 37: Download Complete Notification**
    - **Validates: Requirements 15.1**

- [ ] 17. Analytics Implementation
  - [ ] 17.1 Create analytics service
    - Create services/analytics.ts with event logging
    - Implement event batching and queue
    - Add network-aware sending
    - Respect analytics opt-out preference
    - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5, 13.6, 19.4_

  - [ ] 17.2 Write property tests for analytics
    - **Property 30: Analytics Event Logging**
    - **Property 31: Analytics Batching**
    - **Property 32: Analytics Opt-Out**
    - **Validates: Requirements 13.1-13.6, 19.4**

  - [ ] 17.3 Integrate analytics tracking
    - Add trailer tap tracking to TrailerPlayer
    - Add watchlist action tracking to watchlist store
    - Add impression tracking to ContentRow
    - Add search query tracking to Search screen
    - Add provider tap tracking to ProviderList
    - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5_

- [ ] 18. Settings and Preferences
  - [ ] 18.1 Create Profile/Settings screen
    - Implement app/(tabs)/profile.tsx with settings sections
    - Add theme mode toggle (light/dark/system)
    - Add language selection
    - Add notification settings
    - Add privacy/analytics settings
    - _Requirements: 9.2, 11.3, 15.3, 19.3_

  - [ ] 18.2 Write property tests for theme settings
    - **Property 22: System Theme Respect**
    - **Validates: Requirements 9.3**

  - [ ] 18.3 Implement GDPR consent flow
    - Create first-launch consent dialog
    - Persist consent to preferences
    - _Requirements: 19.2_

- [ ] 19. Localization
  - [ ] 19.1 Set up i18n infrastructure
    - Create locales/ folder with en.json as default
    - Implement locale loading service
    - Add date/number formatting utilities
    - _Requirements: 11.1, 11.2, 11.4_

  - [ ] 19.2 Write property tests for localization
    - **Property 24: Locale String Loading**
    - **Property 25: Locale Date/Number Formatting**
    - **Property 26: RTL Layout Support**
    - **Validates: Requirements 11.2, 11.4, 11.5**

- [ ] 20. Accessibility Enhancements
  - [ ] 20.1 Add accessibility labels throughout
    - Audit all interactive components for labels
    - Add screen reader announcements for route changes
    - Verify dynamic type support
    - _Requirements: 12.1, 12.4, 12.5_

  - [ ] 20.2 Write property tests for accessibility
    - **Property 27: Accessibility Labels**
    - **Property 28: Touch Target Size**
    - **Property 29: Dynamic Type Support**
    - **Validates: Requirements 12.1, 12.3, 12.4**

- [ ] 21. Age Ratings Display
  - [ ] 21.1 Add age rating badges
    - Add age rating to MediaCard component
    - Add age rating to Detail Page header
    - _Requirements: 19.1_

  - [ ] 21.2 Write property tests for age ratings
    - **Property 44: Age Rating Display**
    - **Validates: Requirements 19.1**

- [ ] 22. Final Checkpoint
  - Update ./README.md following best practices.
  - Ensure all tests pass, ask the user if questions arise.
  - Verify all requirements are implemented
  - Run full test suite including property tests

## Notes

- All tasks are required for comprehensive implementation
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
