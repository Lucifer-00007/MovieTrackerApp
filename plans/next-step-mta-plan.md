# Plan for Improving the Overall Performance of the System

## Notes

- 
- 
- 
- 

-------------------------------------------------
## Bugs

#### Priority Lv: P0

- [x] Fix the following packages compatibility warning which come when we run the command `expo start`, following best practices:
	```
	> expo start

	Starting project at /Users/ani/Developer/ANI/🍀 Projects&Orgs/1VibeCodeAI/AntiGravity/MovieTrackerApp
	React Compiler enabled
	Starting Metro Bundler
	The following packages should be updated for best compatibility with the installed expo version:
	  @types/jest@30.0.0 - expected version: 29.5.14
	  jest@30.2.0 - expected version: ~29.7.0
	Your project may not work correctly until you install the expected versions of the packages.

	```

- [x] Make a detailed summary report md file with all the issues, possible solutions, challenges faces etc in ./md-docs/reports/ following best practices

- [x] In `./services/analytics.ts` file fix this error:
	```
	Type 'number' is not assignable to type 'Timeout'.ts(2322)
	(property) AnalyticsService.sendTimer: NodeJS.Timeout | null
	```

- [x] I think the TMDB API is not responding. Create a constants usage variable in .env file. Which can be set true/false accordingly. When set to true its will use the the data from the constants and ignore the API. Also update the codebase to be flexible to use any other API other than TMDB(Make a md doc on how to setup to match the keys based on fronted). Make these changes following best practices

- [x] Fix these warnings and errors in Using mock data adapter:

```
 LOG  [API] Using mock data adapter
 WARN  setLayoutAnimationEnabledExperimental is currently a no-op in the New Architecture.
 WARN  [expo-av]: Expo AV has been deprecated and will be removed in SDK 54. Use the `expo-audio` and `expo-video` packages to replace the required functionality.
 ERROR  React has detected a change in the order of Hooks called by %s. This will lead to bugs and errors if not fixed. For more information, read the Rules of Hooks: https://react.dev/link/rules-of-hooks

   Previous render            Next render
   ------------------------------------------------------
%s   ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
 HomeScreen(./(tabs)/index.tsx) 1. useSyncExternalStore       useSyncExternalStore
2. useCallback                useCallback
3. useCallback                useCallback
4. useSyncExternalStore       useSyncExternalStore
5. useDebugValue              useDebugValue
6. useCallback                useCallback
7. useCallback                useCallback
8. useSyncExternalStore       useSyncExternalStore
9. useDebugValue              useDebugValue
10. useEffect                 useEffect
11. useContext                useContext
12. useContext                useContext
13. useContext                useContext
14. useEffect                 useEffect
15. useState                  useState
16. useCallback               useCallback
17. useSyncExternalStore      useSyncExternalStore
18. useEffect                 useEffect
19. useContext                useContext
20. useContext                useContext
21. useContext                useContext
22. useEffect                 useEffect
23. useState                  useState
24. useCallback               useCallback
25. useSyncExternalStore      useSyncExternalStore
26. useEffect                 useEffect
27. useContext                useContext
28. useContext                useContext
29. useContext                useContext
30. useEffect                 useEffect
31. useState                  useState
32. useCallback               useCallback
33. useSyncExternalStore      useSyncExternalStore
34. useEffect                 useEffect
35. useContext                useContext
36. useContext                useContext
37. useContext                useContext
38. useEffect                 useEffect
39. useState                  useState
40. useCallback               useCallback
41. useSyncExternalStore      useSyncExternalStore
42. useEffect                 useEffect
43. useMemo                   useMemo
44. useMemo                   useMemo
45. useMemo                   useMemo
46. useMemo                   useMemo
47. useMemo                   useMemo
48. useCallback               useCallback
49. useCallback               useCallback
50. useCallback               useCallback
51. undefined                 useSyncExternalStore
 

Code: use-theme-color.ts
  11 |   colorName: keyof typeof Colors.light & keyof typeof Colors.dark
  12 | ) {
> 13 |   const theme = useColorScheme() ?? 'light';
     |                               ^
  14 |   const colorFromProps = props[theme];
  15 |
  16 |   if (colorFromProps) {
Call Stack
  useThemeColor (hooks/use-theme-color.ts:13:31)
  HomeScreen (app/(tabs)/index.tsx:219:37) 

Code: _layout.tsx
  13 |
  14 |   return (
> 15 |     <Tabs
     |     ^
  16 |       screenOptions={{
  17 |         tabBarActiveTintColor: colors.tabIconSelected,
  18 |         tabBarInactiveTintColor: colors.tabIconDefault,
Call Stack
  TabLayout (app/(tabs)/_layout.tsx:15:5)
  RootLayout (app/_layout.tsx:99:9)
 ERROR  [Error: Rendered more hooks than during the previous render.] 

Code: use-theme-color.ts
  11 |   colorName: keyof typeof Colors.light & keyof typeof Colors.dark
  12 | ) {
> 13 |   const theme = useColorScheme() ?? 'light';
     |                               ^
  14 |   const colorFromProps = props[theme];
  15 |
  16 |   if (colorFromProps) {
Call Stack
  useThemeColor (hooks/use-theme-color.ts:13:31)
  HomeScreen (app/(tabs)/index.tsx:219:37) 

Code: _layout.tsx
  13 |
  14 |   return (
> 15 |     <Tabs
     |     ^
  16 |       screenOptions={{
  17 |         tabBarActiveTintColor: colors.tabIconSelected,
  18 |         tabBarInactiveTintColor: colors.tabIconDefault,
Call Stack
  TabLayout (app/(tabs)/_layout.tsx:15:5)
  RootLayout (app/_layout.tsx:99:9)
```

- [x] Fix the following 2 issues
	- The current light mode theme is identical to dark mode theme colors fix this. 
	- Also i have a placeholder image which i want to use when  `EXPO_PUBLIC_USE_MOCK_DATA=true`now at which path should i keep this image such that it can be used throughout the app ?? 

- [x] Make a detailed report md  with the RCA, challenges faced and solution implemeted based on the placeholder image issue in - ./md-docs/reports/

- [x] Update/add the following file:
	- update ./md-docs/README.md

	- update ./README.md

	- Add a readme to each folder in ./app/, ./assets/, ./components/, ./constants/, ./hooks/, ./locales/,  ./scripts/, ./services/, ./stores/, ./types/ and ./utils/

- [x] Use `./md-docs/info/OMDb-API.md` for API docs.
	- Implement the OMDb-API also without disturbing the codebase and use `EXPO_PUBLIC_API_PROVIDER=omdb` following best practices.

- [x] If adb is working and my mobile is detected then why am i getting errors:

```
➜  MovieTrackerApp git:(main) ✗ adb version                                                                          
Android Debug Bridge version 1.0.41
Version 36.0.0-13206524
Installed as /opt/homebrew/bin/adb
Running on Darwin 25.2.0 (arm64)
➜  MovieTrackerApp git:(main) ✗ 
➜  MovieTrackerApp git:(main) ✗ 
➜  MovieTrackerApp git:(main) ✗ 
➜  MovieTrackerApp git:(main) ✗ bun run android                                                                      
$ expo start --android
env: load .env
env: export EXPO_PUBLIC_TMDB_API_KEY EXPO_PUBLIC_USE_MOCK_DATA EXPO_PUBLIC_API_PROVIDER EXPO_PUBLIC_DISABLE_ANALYTICS
Starting project at /Users/ani/Developer/ANI/🍀 Projects&Orgs/1VibeCodeAI/AntiGravity/MovieTrackerApp
React Compiler enabled
Starting Metro Bundler
Failed to resolve the Android SDK path. Default install location not found: /Users/ani/Library/Android/sdk. Use ANDROID_HOME to set the Android SDK location.
Failed to resolve the Android SDK path. Default install location not found: /Users/ani/Library/Android/sdk. Use ANDROID_HOME to set the Android SDK location.
Failed to resolve the Android SDK path. Default install location not found: /Users/ani/Library/Android/sdk. Use ANDROID_HOME to set the Android SDK location.
Failed to resolve the Android SDK path. Default install location not found: /Users/ani/Library/Android/sdk. Use ANDROID_HOME to set the Android SDK location.
Failed to resolve the Android SDK path. Default install location not found: /Users/ani/Library/Android/sdk. Use ANDROID_HOME to set the Android SDK location.
Failed to resolve the Android SDK path. Default install location not found: /Users/ani/Library/Android/sdk. Use ANDROID_HOME to set the Android SDK location.
Failed to resolve the Android SDK path. Default install location not found: /Users/ani/Library/Android/sdk. Use ANDROID_HOME to set the Android SDK location.
Failed to resolve the Android SDK path. Default install location not found: /Users/ani/Library/Android/sdk. Use ANDROID_HOME to set the Android SDK location.
› Opening exp://192.168.1.3:8081 on POCO_F1
Failed to resolve the Android SDK path. Default install location not found: /Users/ani/Library/Android/sdk. Use ANDROID_HOME to set the Android SDK location.
Failed to resolve the Android SDK path. Default install location not found: /Users/ani/Library/Android/sdk. Use ANDROID_HOME to set the Android SDK location.
Failed to resolve the Android SDK path. Default install location not found: /Users/ani/Library/Android/sdk. Use ANDROID_HOME to set the Android SDK location.
Failed to resolve the Android SDK path. Default install location not found: /Users/ani/Library/Android/sdk. Use ANDROID_HOME to set the Android SDK location.
Failed to resolve the Android SDK path. Default install location not found: /Users/ani/Library/Android/sdk. Use ANDROID_HOME to set the Android SDK location.
Failed to resolve the Android SDK path. Default install location not found: /Users/ani/Library/Android/sdk. Use ANDROID_HOME to set the Android SDK location.
Failed to resolve the Android SDK path. Default install location not found: /Users/ani/Library/Android/sdk. Use ANDROID_HOME to set the Android SDK location.
Failed to resolve the Android SDK path. Default install location not found: /Users/ani/Library/Android/sdk. Use ANDROID_HOME to set the Android SDK location.

```

--> Your ANDROID_HOME environment variable isn't set. Since adb is at /opt/homebrew/bin/adb, you likely installed it standalone via Homebrew (brew install android-platform-tools), which only gives you adb and fastboot — not the full SDK that Expo needs.

- [x] Fix this issue as well, follow best practices.

```

- watchlistStore.property.test.ts and preferencesStore.property.test.ts have React Native Flow type import issues

- MediaCard.property.test.ts has a PNG file parsing issue

- analytics.property.test.ts has an unspecified error

```

- [x] Add some scripts:
  - To find code files longer than 500 lines. Ignore markdown or files that are not related to development. Follow these practices for future developments as well.
  - Find all the hard-coded constants throughout the codebase, that can be moved to constants folder such that we can follow the DRY principals.


- [x] Consider refactoring these files into smaller modules following best practice:

   1300 lines │ __tests__/services/api/omdb.property.test.ts
   1066 lines │ __tests__/services/api/omdb-mappers.property.test.ts
    983 lines │ app/(tabs)/profile.tsx
    885 lines │ services/api/omdb.ts
    862 lines │ __tests__/components/DetailPage.property.test.ts
    791 lines │ app/country/[code].tsx
    751 lines │ __tests__/services/analytics.property.test.ts
    741 lines │ components/media/TrailerPlayer.tsx
    722 lines │ __tests__/services/api/omdb-adapter.property.test.ts
    721 lines │ services/api/tmdb.ts
    713 lines │ app/(tabs)/search.tsx
    643 lines │ services/api/adapters/omdb-adapter.ts
    625 lines │ __tests__/services/api/integration.test.ts
    557 lines │ __tests__/services/api/adapter-compliance.test.ts
    546 lines │ services/api/omdb-mappers.ts
    544 lines │ services/analytics.ts


- [x] Move constants to ./constants/ changes following best practices: 

- Move colors to constants/colors.ts
- Move API URLs to constants/api.ts
- Move dimensions to constants/layout.ts
- Move timing values to constants/animations.ts

📁 DIMENSIONS (34 found)

  "48"
    └─ app/(tabs)/browse.tsx:179
  "40"
    └─ app/(tabs)/downloads.tsx:373, app/(tabs)/downloads.tsx:374
  "100"
    └─ app/(tabs)/explore.tsx:62, app/(tabs)/explore.tsx:62, app/country/[code].tsx:742 (+1 more)
  "20"
    └─ app/(tabs)/profile.tsx:958, app/(tabs)/profile.tsx:959, app/modal.tsx:23 (+1 more)
  "24"
    └─ app/(tabs)/profile.tsx:969, app/(tabs)/profile.tsx:970, app/country/[code].tsx:630
  "44"
    └─ app/country/[code].tsx:637, app/movie/[id].tsx:330, app/tv/[id].tsx:331 (+1 more)
  "150"
    └─ app/country/[code].tsx:743
  "70"
    └─ components/detail/DetailHeader.tsx:266, components/detail/DetailHeader.tsx:267, components/detail/DetailHeader.tsx:274 (+1 more)
  "28"
    └─ components/detail/DetailHeader.tsx:282, components/hello-wave.tsx:7
  "16"
    └─ components/media/TrailerPlayer.tsx:686, components/media/TrailerPlayer.tsx:687, components/themed-text.tsx:62 (+2 more)
  "32"
    └─ components/parallax-scroll-view.tsx:75, components/themed-text.tsx:71
  "64"
    └─ components/ui/GdprConsentModal.tsx:247, components/ui/GdprConsentModal.tsx:248

📁 COLORS (75 found)

  "#FFFFFF"
    └─ app/(tabs)/downloads.tsx:140, app/(tabs)/downloads.tsx:149, app/(tabs)/downloads.tsx:178 (+40 more)
  "#D0D0D0"
    └─ app/(tabs)/explore.tsx:15
  "#353636"
    └─ app/(tabs)/explore.tsx:15
  "#808080"
    └─ app/(tabs)/explore.tsx:19, app/(tabs)/explore.tsx:103
  "rgba(0, 0, 0, 0.5)"
    └─ app/(tabs)/profile.tsx:961, components/media/TrailerPlayer.tsx:615, components/media/TrailerPlayer.tsx:637 (+2 more)
  "#000"
    └─ app/(tabs)/search.tsx:649, app/country/[code].tsx:695
  "rgba(0,0,0,0.5)"
    └─ app/movie/[id].tsx:207, app/movie/[id].tsx:218, app/tv/[id].tsx:208 (+1 more)
  "#000000"
    └─ app/trailer/[key].tsx:66, components/media/TrailerPlayer.tsx:110, components/media/TrailerPlayer.tsx:272 (+1 more)
  "rgba(0,0,0,0.7)"
    └─ components/detail/DetailHeader.tsx:140
  "rgba(0,0,0,0.95)"
    └─ components/detail/DetailHeader.tsx:140
  "rgba(255,255,255,0.8)"
    └─ components/detail/DetailHeader.tsx:331, components/media/HeroCarousel.tsx:171
  "rgba(255,255,255,0.7)"
    └─ components/detail/DetailHeader.tsx:337, components/detail/DetailHeader.tsx:342
  "rgba(0,0,0,0.8)"
    └─ components/media/HeroCarousel.tsx:151
  "rgba(255,255,255,0.5)"
    └─ components/media/HeroCarousel.tsx:201
  "rgba(0, 0, 0, 0.6)"
    └─ components/media/MediaCard.tsx:257
  "rgba(0, 0, 0, 0.7)"
    └─ components/media/TrailerPlayer.tsx:595
  "rgba(255, 255, 255, 0.3)"
    └─ components/media/TrailerPlayer.tsx:674
  "#0a7ea4"
    └─ components/themed-text.tsx:82
  "rgba(255, 255, 255, 0.2)"
    └─ components/ui/Skeleton.tsx:218

📁 API-KEYS (28 found)

  "phone-portrait-outline"
    └─ app/(tabs)/downloads.tsx:192
  "home-recently-viewed-row"
    └─ app/(tabs)/index.tsx:239
  "home-recommendations-row"
    └─ app/(tabs)/index.tsx:249
  "home-trending-movies-row"
    └─ app/(tabs)/index.tsx:259
  "home-trending-tv-row"
    └─ app/(tabs)/index.tsx:269
  "sync-status-indicator"
    └─ app/(tabs)/profile.tsx:284
  "notifications-section"
    └─ app/(tabs)/profile.tsx:564
  "notifications-toggle"
    └─ app/(tabs)/profile.tsx:575
  "notifications-setting"
    └─ app/(tabs)/profile.tsx:578
  "downloads-notifications-toggle"
    └─ app/(tabs)/profile.tsx:593
  "downloads-notifications-setting"
    └─ app/(tabs)/profile.tsx:596
  "new-releases-notifications-toggle"
    └─ app/(tabs)/profile.tsx:609
  "new-releases-notifications-setting"
    └─ app/(tabs)/profile.tsx:612
  "search-results-container"
    └─ app/(tabs)/search.tsx:494
  "search-movies-section"
    └─ app/(tabs)/search.tsx:529
  "country-hub-content-list"
    └─ app/country/[code].tsx:599
  "react-native-reanimated"
    └─ app/movie/[id].tsx:22, app/tv/[id].tsx:23, components/detail/DetailHeader.tsx:24 (+2 more)
  "movie-recommendations"
    └─ app/movie/[id].tsx:276
  "alert-circle-outline"
    └─ components/ui/ErrorState.tsx:34, components/ui/error-state-utils.ts:86
  "cloud-offline-outline"
    └─ components/ui/OfflineBanner.tsx:48, components/ui/error-state-utils.ts:58
  "X-RateLimit-Remaining"
    └─ services/api/omdb.ts:370
  "user_locale_preference"
    └─ services/localization.ts:34

📁 URLS (26 found)

  "https://docs.expo.dev/router/introduction"
    └─ app/(tabs)/explore.tsx:44
  "https://reactnative.dev/docs/images"
    └─ app/(tabs)/explore.tsx:64
  "https://docs.expo.dev/develop/user-interface/co..."
    └─ app/(tabs)/explore.tsx:74
  "https://image.tmdb.org/t/p"
    └─ components/detail/detail-utils.ts:12, components/media/HeroCarousel.tsx:31, components/media/media-card-utils.ts:12 (+1 more)
  "https://www.youtube.com/embed/${videoKey}?autop..."
    └─ components/media/trailer-utils.ts:17
  "https://api.moviestream.app/analytics"
    └─ services/analytics.ts:49
  "https://netflix.com"
    └─ services/api/adapters/omdb-adapter.ts:339, services/api/adapters/omdb-adapter.ts:376, services/api/adapters/omdb-adapter.ts:412 (+1 more)
  "https://disneyplus.com"
    └─ services/api/adapters/omdb-adapter.ts:347, services/api/adapters/omdb-adapter.ts:392, services/api/adapters/omdb-adapter.ts:428 (+1 more)
  "https://hulu.com"
    └─ services/api/adapters/omdb-adapter.ts:355
  "https://primevideo.com"
    └─ services/api/adapters/omdb-adapter.ts:363, services/api/adapters/omdb-adapter.ts:384, services/api/adapters/omdb-adapter.ts:420 (+1 more)
  "https://bbc.co.uk/iplayer"
    └─ services/api/adapters/omdb-adapter.ts:400
  "https://crave.ca"
    └─ services/api/adapters/omdb-adapter.ts:436
  "https://www.omdbapi.com"
    └─ services/api/omdb.ts:21
  "https://api.themoviedb.org/3"
    └─ services/api/tmdb.ts:22

📁 TIMING (16 found)

  "300"
    └─ components/hello-wave.tsx:14, services/api/adapters/mock-adapter.ts:27
  "5000"
    └─ components/media/HeroCarousel.tsx:44, services/api/omdb.ts:324
  "100"
    └─ components/media/trailer-utils.ts:41
  "30000"
    └─ services/analytics.ts:42, services/analytics.ts:45
  "1000"
    └─ services/analytics.ts:44, services/api/omdb.ts:182, services/api/tmdb.ts:42 (+1 more)
  "10000"
    └─ services/api/omdb.ts:32, services/api/omdb.ts:183, services/api/omdb.ts:531 (+1 more)
  "2000"
    └─ services/api/omdb.ts:339


- [x] Add if any of the following is missing from the home page.
  - `Trending This Week` - Will have all the top trending movies/web-series/etc of the week from all regions
  - `Top Rated` - Will have the top IMDB rated overall from global region
  - Popular Movies
  - Top Box Office Weekend
  - Top Web Series
  - Recommended for You

- [x] Hide/disable the `No Thanks` and `Accept` popup that appears for analytics that comes every-time when we first open the app. Also there is no text in this popup card only 2 buttons so fix this

- [x] Enhance the overall app UI in light mode. In some of the pages even when i set the theme to light its showing dark mode. Fix these issues while following best practices.

- [x] Enhance the UI/UX of the download page.

- [x] Change flash screen image.

- [] Fix these issues
- Fix all linting errors.
- Move all the hard-coded constants to ./constants folder following DRY principles(use bun run find:long-files). Follow this practice in future developments as well.
- Check the codebase and find if any file is longer than 500 line(use bun run find:long-files). If so break into modules. Ignore the 
-

- []
- []
- []
- []
- []
- []


──────────────────────────────────────────────────────────────────────

## Mobile View

#### Priority Lv: P0
- [] Make the app responsive.
- []
- []


#### Priority Lv: P1
- []
- []
- []


-------------------------------------------------
## New features

#### Priority Lv: P0
- []
- []
- []


#### Priority Lv: P1
- []
- []
- []

-------------------------------------------------
## To be done Manually

#### Priority Lv: P0
- [] 
- []
- []


#### Priority Lv: P1
- []
- []
- []

