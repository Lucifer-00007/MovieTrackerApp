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

- [] Fix the following 2 issues
	- The current light mode theme is identical to dark mode theme colors fix this. 
	- Also i have a placeholder image which i want to use when  `EXPO_PUBLIC_USE_MOCK_DATA=true`now at which path should i keep this image such that it can be used throughout the app ?? 

- [] 
- [] 
- [] 
- [] 


#### Priority Lv: P1
- []
- [] 
- [] 
- [] 


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

