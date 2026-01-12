# MovieTracker - Expo Build Guide

> Complete guide to building and deploying MovieTracker for iOS, Android, and Web

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Development Setup](#development-setup)
3. [Building for Development](#building-for-development)
4. [Building for Production](#building-for-production)
5. [Platform-Specific Builds](#platform-specific-builds)
6. [EAS Build (Recommended)](#eas-build-recommended)
7. [Local Builds](#local-builds)
8. [Over-the-Air Updates](#over-the-air-updates)
9. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Tools

| Tool | Version | Purpose |
|------|---------|---------|
| Node.js | 18+ | JavaScript runtime |
| Bun | 1.0+ | Package manager (preferred) |
| EAS CLI | Latest | Cloud builds and submissions |

### Optional Tools (Only for Local Builds or Simulators)

| Tool | When Needed |
|------|-------------|
| Xcode 15+ | Running iOS Simulator locally, or local iOS builds |
| Android Studio | Running Android Emulator locally, or local Android builds |

> **Note:** If you use EAS Build (cloud), you don't need Xcode or Android Studio installed. EAS handles all native compilation in the cloud.

### Install Dependencies

```bash
# Install Bun (if not installed)
curl -fsSL https://bun.sh/install | bash

# Install EAS CLI globally
bun add -g eas-cli

# Install project dependencies
bun install
```

### Expo Account Setup

1. Create an account at [expo.dev](https://expo.dev)
2. Login via CLI:
```bash
eas login
```

---

## Development Setup

### Environment Variables

Create a `.env` file in the project root:

```bash
# Copy example and edit
cp .env.example .env
```

Required variables:
```env
# API Provider: 'tmdb', 'cloudflare', 'omdb', or 'mock'
EXPO_PUBLIC_API_PROVIDER=cloudflare

# TMDB API Key (if using tmdb provider)
EXPO_PUBLIC_TMDB_API_KEY=your_key_here

# OMDb API Key (if using omdb provider)
EXPO_PUBLIC_OMDB_API_KEY=your_key_here

# Use mock data for development
EXPO_PUBLIC_USE_MOCK_DATA=false

# Disable analytics in development
EXPO_PUBLIC_DISABLE_ANALYTICS=true
```

### Start Development Server

```bash
# Start Expo dev server
bun run dev

# Or with specific platform
bun run ios      # iOS Simulator
bun run android  # Android Emulator
bun run web      # Web browser
```

---

## Building for Development

### Understanding Build Types

| Build Type | Needs Dev Server | JS Bundled | Use Case |
|------------|------------------|------------|----------|
| `development` | Yes | No | Active development with hot reload |
| `preview` | No | Yes | Internal testing, standalone APK/IPA |
| `production` | No | Yes | Store release |

> **Important:** Development builds create a "development client" that still requires a Metro bundler connection (like Expo Go). For a standalone app that works independently without your computer, use `preview` or `production` profiles.

### Development Builds (Requires Dev Server)

Development builds include native code and dev tools but need a running Metro server. Use these for active development with hot reload.

```bash
# Create development build profile
eas build --profile development --platform ios
eas build --profile development --platform android

# Or build for both
eas build --profile development --platform all
```

### Preview Builds (Standalone - Recommended for Testing)

Preview builds bundle your JavaScript into the app. They work completely independently without a dev server.

```bash
# Standalone APK for Android
eas build --profile preview --platform android

# Standalone IPA for iOS (Ad Hoc)
eas build --profile preview --platform ios
```

Make sure your `eas.json` has the preview profile:

```json
{
  "build": {
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    }
  }
}
```

### Running Development Builds

1. Install the build on your device/simulator
2. Start the dev server: `bun run dev`
3. Scan QR code or enter URL in the development build app

---

## Building for Production

### Quick Production Build

```bash
# iOS App Store build
eas build --platform ios --profile production

# Android Play Store build (AAB)
eas build --platform android --profile production

# Both platforms
eas build --platform all --profile production
```

### Build Profiles

Create/update `eas.json` in project root:

```json
{
  "cli": {
    "version": ">= 5.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "ios": {
        "simulator": true
      }
    },
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "autoIncrement": true
    }
  },
  "submit": {
    "production": {}
  }
}
```

---

## Platform-Specific Builds

### iOS

#### Requirements
- macOS with Xcode 15+
- Apple Developer account ($99/year)
- Valid provisioning profiles and certificates

#### App Store Build

```bash
# Build for App Store
eas build --platform ios --profile production

# Submit to App Store Connect
eas submit --platform ios
```

#### TestFlight Distribution

```bash
# Build and auto-submit to TestFlight
eas build --platform ios --profile production --auto-submit
```

#### Ad Hoc Distribution (Internal Testing)

```bash
# Register devices first
eas device:create

# Build for registered devices
eas build --platform ios --profile preview
```

### Android

#### Requirements
- Android Studio with SDK
- Google Play Developer account ($25 one-time)
- Keystore for signing

#### Play Store Build (AAB)

```bash
# Build Android App Bundle
eas build --platform android --profile production

# Submit to Google Play
eas submit --platform android
```

#### APK for Direct Install

```bash
# Build APK (preview profile)
eas build --platform android --profile preview
```

#### Keystore Management

```bash
# EAS manages keystores automatically, but you can use your own:
eas credentials --platform android
```

### Web

#### Static Export

```bash
# Export static web build
npx expo export --platform web

# Output in ./dist folder
```

#### Deploy to Vercel

```bash
# Install Vercel CLI
bun add -g vercel

# Deploy
vercel ./dist
```

#### Deploy to Netlify

```bash
# Build
npx expo export --platform web

# Deploy via Netlify CLI or drag-drop ./dist to netlify.com
```

---

## EAS Build (Recommended)

EAS Build is Expo's cloud build service. It handles native compilation without local setup.

### Why EAS Build?

- No local Xcode/Android Studio required
- Consistent build environment
- Automatic code signing
- Built-in CI/CD
- Free tier available

### First-Time Setup

```bash
# Initialize EAS in your project
eas build:configure

# This creates eas.json with default profiles
```

### Build Commands

```bash
# Interactive build (choose platform and profile)
eas build

# Specific platform and profile
eas build --platform ios --profile production
eas build --platform android --profile production

# Check build status
eas build:list

# View build logs
eas build:view
```

### Build Artifacts

After build completes:
- iOS: `.ipa` file (download from EAS dashboard)
- Android: `.aab` or `.apk` file

---

## Local Builds

For offline builds or CI/CD pipelines without EAS.

### iOS Local Build

```bash
# Generate native iOS project
npx expo prebuild --platform ios

# Open in Xcode
open ios/movieTracker.xcworkspace

# Or build via CLI
cd ios && xcodebuild -workspace movieTracker.xcworkspace \
  -scheme movieTracker \
  -configuration Release \
  -archivePath build/movieTracker.xcarchive \
  archive
```

### Android Local Build

```bash
# Generate native Android project
npx expo prebuild --platform android

# Build APK
cd android && ./gradlew assembleRelease

# Build AAB
cd android && ./gradlew bundleRelease

# Output: android/app/build/outputs/
```

### Clean Native Projects

```bash
# Remove generated native code
npx expo prebuild --clean
```

---

## Over-the-Air Updates

Push JavaScript updates without app store review.

### EAS Update Setup

```bash
# Configure EAS Update
eas update:configure

# Create update channel
eas channel:create production
```

### Publishing Updates

```bash
# Publish update to production channel
eas update --channel production --message "Bug fixes"

# Preview update before publishing
eas update --channel preview --message "Testing new feature"
```

### Update Branches

```bash
# Create branch for staged rollout
eas update --branch staging --message "v1.1.0 beta"

# Point channel to branch
eas channel:edit production --branch staging
```

---

## Troubleshooting

### Common Issues

#### Build Fails: "SDK version mismatch"

```bash
# Update Expo SDK
npx expo install expo@latest

# Reinstall dependencies
rm -rf node_modules bun.lock
bun install
```

#### iOS: "Provisioning profile" errors

```bash
# Reset credentials
eas credentials --platform ios

# Or use EAS to manage automatically
eas build --platform ios --clear-credentials
```

#### Android: "Keystore" errors

```bash
# Reset Android credentials
eas credentials --platform android
```

#### Metro Bundler Issues

```bash
# Clear Metro cache
npx expo start --clear

# Or manually
rm -rf node_modules/.cache
```

#### Native Module Errors

```bash
# Regenerate native projects
npx expo prebuild --clean

# Then rebuild
eas build --platform all
```

### Build Logs

```bash
# View recent builds
eas build:list

# View specific build logs
eas build:view [BUILD_ID]

# Download build artifacts
eas build:download [BUILD_ID]
```

### Getting Help

- [Expo Documentation](https://docs.expo.dev)
- [EAS Build Docs](https://docs.expo.dev/build/introduction/)
- [Expo Discord](https://chat.expo.dev)
- [GitHub Issues](https://github.com/expo/expo/issues)

---

## Quick Reference

### Essential Commands

| Command | Description |
|---------|-------------|
| `bun run dev` | Start development server |
| `eas build --platform ios` | Build iOS app |
| `eas build --platform android` | Build Android app |
| `eas submit --platform ios` | Submit to App Store |
| `eas submit --platform android` | Submit to Play Store |
| `eas update --channel production` | Push OTA update |
| `npx expo export --platform web` | Export web build |

### Build Profiles

| Profile | Use Case |
|---------|----------|
| `development` | Dev builds with debugging |
| `preview` | Internal testing (APK/Ad Hoc) |
| `production` | Store releases |

### Environment

| Variable | Values |
|----------|--------|
| `EXPO_PUBLIC_API_PROVIDER` | `cloudflare`, `tmdb`, `omdb`, `mock` |
| `EXPO_PUBLIC_USE_MOCK_DATA` | `true`, `false` |
| `EXPO_PUBLIC_DISABLE_ANALYTICS` | `true`, `false` |
