# Constants Consolidation & Dependency Cleanup Report

**Date:** January 14, 2026  
**Project:** MovieTracker  
**Author:** Kiro AI Assistant

---

## Executive Summary

This report documents the consolidation of hardcoded constants throughout the MovieTracker codebase, following DRY (Don't Repeat Yourself) principles. The effort also uncovered and resolved critical runtime errors including circular imports and missing component tokens, as well as dependency management issues.

---

## 1. Root Cause Analysis (RCA)

### 1.1 Hardcoded Constants Scattered Across Codebase

**Problem:** The codebase contained 78+ hardcoded values spread across multiple files:
- 34 dimension values (widths, heights, sizes)
- 4 URL strings
- 28 API-related keys and identifiers
- 12 timing/animation values

**Root Cause:** Organic code growth without enforced centralization standards led to:
- Duplicate magic numbers across components
- Inconsistent spacing and sizing
- Difficult maintenance when values needed updates
- No single source of truth for design tokens

### 1.2 Circular Import Errors

**Problem:** Runtime errors with "Maximum call stack size exceeded":
```
Require cycle: services/api/adapters/omdb-adapter.ts -> services/api/adapters/omdb-adapter.ts
Require cycle: services/api/omdb-mappers.ts -> services/api/omdb-mappers.ts
```

**Root Cause:** Legacy compatibility files were re-exporting from themselves instead of the correct subfolder:
```typescript
// BROKEN: Self-referential export
export { omdbAdapter } from './omdb-adapter';

// File structure:
// services/api/adapters/omdb-adapter.ts    <- This file
// services/api/adapters/omdb-adapter/      <- Target folder
```

### 1.3 Missing ComponentTokens Properties

**Problem:** Runtime TypeError: "Cannot read property 'expandThreshold' of undefined"

**Root Cause:** During constants consolidation, code was updated to reference `ComponentTokens.synopsis.expandThreshold` and `ComponentTokens.cast.maxDisplay`, but these properties were never added to the `ComponentTokens` object in `constants/colors.ts`.

### 1.4 Duplicate Dependencies

**Problem:** `expo-doctor` reported duplicate `expo-constants` packages:
```
expo-constants@18.0.13 (at: node_modules/expo-constants)
expo-constants@18.0.12 (at: node_modules/expo-asset/node_modules/expo-constants)
expo-constants@18.0.12 (at: node_modules/expo-linking/node_modules/expo-constants)
```

**Root Cause:** 
- Transitive dependencies (`expo-asset`, `expo-linking`) had peer dependencies on older `expo-constants` version
- Presence of both `package-lock.json` and `bun.lock` caused package manager confusion

---

## 2. Challenges Faced

### 2.1 Identifying True Constants vs. Acceptable Values

**Challenge:** The `find:constants` script flagged items that shouldn't be centralized:
- Package names: `"react-native-reanimated"` (import string, not a constant)
- Error class names: `"AnalyticsNetworkError"` (class identifier)
- JSDoc comments: `"5000"` in `(default: 5000)` documentation
- Math operations: `"100"` in percentage calculations `(x / y * 100)`

**Resolution:** Updated the detection script with allowlists and context-aware filtering.

### 2.2 Type Errors During Migration

**Challenge:** Updating components to use centralized constants revealed pre-existing type mismatches:
- `EmptyState` component expected `icon` prop, not `iconName`
- `SearchFilters` type had `yearFrom`/`yearTo`, not `year`

**Resolution:** Fixed type errors as encountered during the consolidation process.

### 2.3 Import Path Resolution

**Challenge:** Invalid import `@/constants` doesn't resolve to a barrel export:
```typescript
// BROKEN
import { API_BASE_URLS, ANIMATION_DURATION } from '@/constants';

// CORRECT
import { API_BASE_URLS } from '@/constants/api';
import { ANIMATION_DURATION } from '@/constants/animations';
```

**Resolution:** Updated imports to reference specific constant files.

---

## 3. Implemented Solutions

### 3.1 Constants Centralization

Created/updated centralized constant files:

| File | Contents Added |
|------|----------------|
| `constants/layout.ts` | `PARALLAX_*`, `GDPR_*`, `POSTER_CARD_*`, `BROWSE_*`, `RANK_BADGE_SIZE`, `SEEK_BAR_TOUCH_HEIGHT`, `DEMO_IMAGE_SIZE`, `MODAL_SPACING` |
| `constants/animations.ts` | `WAVE_DURATION`, `DOWNLOAD_CONFIG` object |
| `constants/colors.ts` | `ComponentTokens.playButtonLarge`, `synopsis`, `cast`, `contentRow` |
| `constants/test-ids.ts` | `ICON_NAMES` object, `STORAGE_KEYS` |
| `constants/api.ts` | `DOC_URLS`, `API_HEADERS`, `YOUTUBE_EMBED_URL` |

### 3.2 Circular Import Fixes

Updated legacy compatibility files to use explicit paths:

```typescript
// services/api/adapters/omdb-adapter.ts
- export { omdbAdapter } from './omdb-adapter';
+ export { omdbAdapter } from './omdb-adapter/index';

// services/api/omdb-mappers.ts
- export * from './omdb-mappers';
+ export * from './omdb-mappers/index';
```

### 3.3 ComponentTokens Additions

Added missing tokens to `constants/colors.ts`:

```typescript
export const ComponentTokens = {
  // ... existing tokens
  synopsis: {
    expandThreshold: 200,
  },
  cast: {
    maxDisplay: 10,
  },
  contentRow: {
    itemSpacing: 12,
  },
} as const;
```

### 3.4 Dependency Deduplication

1. Removed `package-lock.json` (project uses Bun)
2. Added `overrides` to `package.json`:
   ```json
   {
     "overrides": {
       "expo-constants": "~18.0.13"
     }
   }
   ```
3. Clean reinstall: `rm -rf node_modules bun.lock && bun install`

### 3.5 Detection Script Enhancement

Updated `scripts/find-hardcoded-constants.js` with:

```javascript
// Known acceptable values that shouldn't be flagged
const ACCEPTABLE_VALUES = [
  'react-native-reanimated',  // Package import name
  'AnalyticsNetworkError',    // Error class name
];

// Acceptable timing values in specific contexts
const ACCEPTABLE_TIMING_CONTEXTS = [
  { value: '5000', context: 'default:' },      // JSDoc comments
  { value: '100', context: '* 100' },          // Percentage calculations
  { value: '100', context: '/ 100' },
];
```

---

## 4. Results

### Before
```
📁 DIMENSIONS (34 found)
📁 URLS (4 found)
📁 API-KEYS (28 found)
📁 TIMING (12 found)
```

### After
```
✅ No obvious hard-coded constants found. Nice work!
```

### Dependency Health
```
17/17 checks passed. No issues detected!
```

---

## 5. Files Modified

### Constants Files
- `constants/layout.ts`
- `constants/animations.ts`
- `constants/colors.ts`
- `constants/test-ids.ts`
- `constants/api.ts`

### Component Files (Updated Imports)
- `components/hello-wave.tsx`
- `components/parallax-scroll-view.tsx`
- `components/ui/GdprConsentModal.tsx`
- `components/ui/Skeleton.tsx`
- `components/ui/ErrorState.tsx`
- `components/ui/error-state-utils.ts`
- `components/ui/OfflineBanner.tsx`
- `components/media/trailer-player/MockTrailerPlayer.tsx`
- `components/media/trailer-player/VideoPlayerContent.tsx`
- `components/media/trailer-utils.ts`
- `components/media/ContentRow.tsx`
- `components/media/HeroCarousel.tsx`
- `components/downloads/CompletedDownloadsList.tsx`
- `components/downloads/DownloadQueueList.tsx`
- `components/search/SearchResults.tsx`
- `components/country/CountryContentList.tsx`
- `components/profile/WatchlistCard.tsx`
- `components/detail/detail-utils.ts`
- `components/detail/RecommendationsRow.tsx`

### Service Files
- `services/downloads.ts`
- `services/localization.ts`
- `services/api/adapters/mock-adapter.ts`
- `services/api/adapters/omdb-adapter.ts`
- `services/api/omdb-mappers.ts`
- `services/api/omdb/config.ts`
- `services/api/cloudflare.ts`
- `services/api/tmdb/client.ts`
- `services/api/omdb/client.ts`
- `services/api/omdb/utils.ts`

### App Routes
- `app/(tabs)/index.tsx`
- `app/(tabs)/browse.tsx`
- `app/(tabs)/explore.tsx`
- `app/(tabs)/profile.tsx`
- `app/modal.tsx`
- `app/movie/[id].tsx`

### Configuration
- `package.json` (added overrides)
- `scripts/find-hardcoded-constants.js`

---

## 6. Recommendations

### Immediate
1. Run `bun run find:constants` periodically to catch new hardcoded values
2. Add pre-commit hook to run the constants finder script

### Long-term
1. Consider creating a `constants/index.ts` barrel export for cleaner imports
2. Add ESLint rule to warn on magic numbers in style definitions
3. Document the constants structure in the project README

---

## 7. Lessons Learned

1. **Legacy compatibility layers need explicit paths** - When a file and folder share the same name, always use explicit `/index` suffix
2. **ComponentTokens should be complete before referencing** - Add all required tokens before updating consuming code
3. **Single package manager** - Mixing lock files causes resolution conflicts
4. **Context matters for constants** - Not all strings/numbers are constants; detection tools need context awareness
