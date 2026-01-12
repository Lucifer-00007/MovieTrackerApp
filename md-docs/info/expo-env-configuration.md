# Expo Environment Configuration Guide

> Best practices for managing environment variables across development, preview, and production builds

## Table of Contents

1. [Overview](#overview)
2. [Environment Variable Types](#environment-variable-types)
3. [Configuration Methods](#configuration-methods)
4. [Build Profile Configuration](#build-profile-configuration)
5. [Sensitive Data Management](#sensitive-data-management)
6. [MovieTracker Configuration](#movietracker-configuration)
7. [Troubleshooting](#troubleshooting)

---

## Overview

Expo supports environment variables through multiple sources with a clear priority order:

| Priority | Source | Use Case |
|----------|--------|----------|
| 1 (Highest) | `eas.json` profile `env` | Build-specific overrides |
| 2 | EAS Secrets | Sensitive keys (API keys, tokens) |
| 3 | `.env` files | Local development defaults |
| 4 (Lowest) | System environment | CI/CD pipelines |

---

## Environment Variable Types

### Public Variables (Client-Side)

Variables prefixed with `EXPO_PUBLIC_` are embedded in the JavaScript bundle and accessible in your app code.

```env
# Accessible in app via process.env.EXPO_PUBLIC_API_URL
EXPO_PUBLIC_API_URL=https://api.example.com
EXPO_PUBLIC_FEATURE_FLAG=true
```

```typescript
// In your code
const apiUrl = process.env.EXPO_PUBLIC_API_URL;
```

> **Warning:** Never put secrets in `EXPO_PUBLIC_` variables - they're visible in the client bundle!

### Build-Time Variables (Native Only)

Variables without the `EXPO_PUBLIC_` prefix are only available during the build process, not in runtime JavaScript.

```env
# Only available during native build
SENTRY_AUTH_TOKEN=secret_token
GOOGLE_SERVICES_JSON=./google-services.json
```

---

## Configuration Methods

### Method 1: Local `.env` Files

Create environment files in your project root:

```
.env                 # Default (loaded always)
.env.local           # Local overrides (git-ignored)
.env.development     # Development-specific
.env.production      # Production-specific
```

Example `.env`:
```env
# API Configuration
EXPO_PUBLIC_API_PROVIDER=cloudflare
EXPO_PUBLIC_USE_MOCK_DATA=false

# Feature Flags
EXPO_PUBLIC_DISABLE_ANALYTICS=true
```

> **Note:** `.env` files are loaded locally but NOT automatically used by EAS Build. Use `eas.json` or EAS Secrets for cloud builds.

### Method 2: EAS.json Profile Environment

Define environment variables per build profile in `eas.json`:

```json
{
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "env": {
        "EXPO_PUBLIC_API_PROVIDER": "mock",
        "EXPO_PUBLIC_USE_MOCK_DATA": "true",
        "EXPO_PUBLIC_DISABLE_ANALYTICS": "true"
      }
    },
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      },
      "env": {
        "EXPO_PUBLIC_API_PROVIDER": "cloudflare",
        "EXPO_PUBLIC_USE_MOCK_DATA": "false",
        "EXPO_PUBLIC_DISABLE_ANALYTICS": "true"
      }
    },
    "production": {
      "autoIncrement": true,
      "env": {
        "EXPO_PUBLIC_API_PROVIDER": "cloudflare",
        "EXPO_PUBLIC_USE_MOCK_DATA": "false",
        "EXPO_PUBLIC_DISABLE_ANALYTICS": "false"
      }
    }
  }
}
```

### Method 3: EAS Secrets (Recommended for Sensitive Data)

Store sensitive values securely in EAS:

```bash
# Create a secret
eas secret:create --scope project --name EXPO_PUBLIC_TMDB_API_KEY --value "your_api_key"

# List secrets
eas secret:list

# Delete a secret
eas secret:delete --name EXPO_PUBLIC_TMDB_API_KEY
```

**Scope options:**
- `--scope project` - Available to this project only
- `--scope account` - Available to all projects in your account

### Method 4: Environment File for EAS Build

Reference a local `.env` file in your build profile:

```json
{
  "build": {
    "production": {
      "env": {
        "ENV_FILE": ".env.production"
      }
    }
  }
}
```

---

## Build Profile Configuration

### Recommended Profile Setup

```json
{
  "cli": {
    "version": ">= 16.18.0",
    "appVersionSource": "remote"
  },
  "build": {
    "base": {
      "env": {
        "EXPO_PUBLIC_APP_NAME": "MovieTracker"
      }
    },
    "development": {
      "extends": "base",
      "developmentClient": true,
      "distribution": "internal",
      "ios": {
        "simulator": true
      },
      "env": {
        "EXPO_PUBLIC_API_PROVIDER": "mock",
        "EXPO_PUBLIC_USE_MOCK_DATA": "true",
        "EXPO_PUBLIC_DISABLE_ANALYTICS": "true",
        "EXPO_PUBLIC_LOG_LEVEL": "debug"
      }
    },
    "preview": {
      "extends": "base",
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      },
      "env": {
        "EXPO_PUBLIC_API_PROVIDER": "cloudflare",
        "EXPO_PUBLIC_USE_MOCK_DATA": "false",
        "EXPO_PUBLIC_DISABLE_ANALYTICS": "true",
        "EXPO_PUBLIC_LOG_LEVEL": "warn"
      }
    },
    "production": {
      "extends": "base",
      "autoIncrement": true,
      "env": {
        "EXPO_PUBLIC_API_PROVIDER": "cloudflare",
        "EXPO_PUBLIC_USE_MOCK_DATA": "false",
        "EXPO_PUBLIC_DISABLE_ANALYTICS": "false",
        "EXPO_PUBLIC_LOG_LEVEL": "error"
      }
    }
  },
  "submit": {
    "production": {}
  }
}
```

### Profile Inheritance

Use `extends` to inherit from a base profile:

```json
{
  "build": {
    "base": {
      "env": {
        "EXPO_PUBLIC_COMMON_VAR": "shared_value"
      }
    },
    "preview": {
      "extends": "base",
      "env": {
        "EXPO_PUBLIC_SPECIFIC_VAR": "preview_value"
      }
    }
  }
}
```

---

## Sensitive Data Management

### Do's and Don'ts

| ✅ Do | ❌ Don't |
|-------|---------|
| Use EAS Secrets for API keys | Commit API keys to git |
| Use `EXPO_PUBLIC_` only for non-sensitive data | Put secrets in `EXPO_PUBLIC_` variables |
| Add `.env.local` to `.gitignore` | Commit `.env.local` files |
| Rotate secrets regularly | Share secrets in plain text |

### Setting Up Secrets for MovieTracker

```bash
# API Keys (if using TMDB or OMDb providers)
eas secret:create --scope project --name EXPO_PUBLIC_TMDB_API_KEY --value "your_tmdb_key"
eas secret:create --scope project --name EXPO_PUBLIC_OMDB_API_KEY --value "your_omdb_key"

# Verify secrets are set
eas secret:list
```

### Accessing Secrets in Builds

EAS Secrets are automatically injected during build. No code changes needed:

```typescript
// This works automatically if secret is set
const apiKey = process.env.EXPO_PUBLIC_TMDB_API_KEY;
```

---

## MovieTracker Configuration

### Available Environment Variables

| Variable | Values | Description |
|----------|--------|-------------|
| `EXPO_PUBLIC_API_PROVIDER` | `cloudflare`, `tmdb`, `omdb`, `mock` | API backend to use |
| `EXPO_PUBLIC_USE_MOCK_DATA` | `true`, `false` | Use mock data instead of API |
| `EXPO_PUBLIC_DISABLE_ANALYTICS` | `true`, `false` | Disable analytics tracking |
| `EXPO_PUBLIC_TMDB_API_KEY` | API key string | TMDB API key (if using tmdb provider) |
| `EXPO_PUBLIC_OMDB_API_KEY` | API key string | OMDb API key (if using omdb provider) |

### Recommended Configuration by Environment

#### Development (Local)
```env
EXPO_PUBLIC_API_PROVIDER=mock
EXPO_PUBLIC_USE_MOCK_DATA=true
EXPO_PUBLIC_DISABLE_ANALYTICS=true
```

#### Preview (Internal Testing)
```env
EXPO_PUBLIC_API_PROVIDER=cloudflare
EXPO_PUBLIC_USE_MOCK_DATA=false
EXPO_PUBLIC_DISABLE_ANALYTICS=true
```

#### Production (Store Release)
```env
EXPO_PUBLIC_API_PROVIDER=cloudflare
EXPO_PUBLIC_USE_MOCK_DATA=false
EXPO_PUBLIC_DISABLE_ANALYTICS=false
```

### Complete eas.json for MovieTracker

```json
{
  "cli": {
    "version": ">= 16.18.0",
    "appVersionSource": "remote"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "ios": {
        "simulator": true
      },
      "env": {
        "EXPO_PUBLIC_API_PROVIDER": "mock",
        "EXPO_PUBLIC_USE_MOCK_DATA": "true",
        "EXPO_PUBLIC_DISABLE_ANALYTICS": "true"
      }
    },
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      },
      "env": {
        "EXPO_PUBLIC_API_PROVIDER": "cloudflare",
        "EXPO_PUBLIC_USE_MOCK_DATA": "false",
        "EXPO_PUBLIC_DISABLE_ANALYTICS": "true"
      }
    },
    "production": {
      "autoIncrement": true,
      "env": {
        "EXPO_PUBLIC_API_PROVIDER": "cloudflare",
        "EXPO_PUBLIC_USE_MOCK_DATA": "false",
        "EXPO_PUBLIC_DISABLE_ANALYTICS": "false"
      }
    }
  },
  "submit": {
    "production": {}
  }
}
```

---

## Troubleshooting

### Variable Not Available in App

**Problem:** `process.env.EXPO_PUBLIC_*` returns `undefined`

**Solutions:**
1. Ensure variable has `EXPO_PUBLIC_` prefix
2. Restart Metro bundler after changing `.env`
3. For EAS builds, check `eas.json` env or EAS Secrets

```bash
# Clear cache and restart
npx expo start --clear
```

### EAS Build Not Using Local .env

**Problem:** EAS Build ignores local `.env` file

**Solution:** EAS Build doesn't automatically load `.env` files. Use:
- `eas.json` `env` block for non-sensitive values
- EAS Secrets for sensitive values

### Secret Not Found in Build

**Problem:** EAS Secret not available during build

**Solutions:**
1. Verify secret exists: `eas secret:list`
2. Check secret scope matches project
3. Ensure secret name matches exactly (case-sensitive)

### Different Values in Dev vs Build

**Problem:** App behaves differently locally vs in EAS build

**Solution:** Ensure `eas.json` env matches your local `.env`:

```bash
# Debug: Print env during build
# Add to eas.json build profile:
{
  "env": {
    "EXPO_PUBLIC_DEBUG": "true"
  }
}
```

```typescript
// In app code
if (process.env.EXPO_PUBLIC_DEBUG === 'true') {
  console.log('API Provider:', process.env.EXPO_PUBLIC_API_PROVIDER);
}
```

---

## Quick Reference

### Checking Current Configuration

**View EAS Secrets:**
```bash
eas secret:list
```

**View eas.json profile env:**
```bash
# View entire eas.json
cat eas.json

# Or use jq to extract specific profile env (if jq installed)
cat eas.json | jq '.build.preview.env'
```

**View current .env file:**
```bash
cat .env
```

**Debug env in running app:**
```typescript
// Add temporarily to check what's loaded
console.log('Current env:', {
  provider: process.env.EXPO_PUBLIC_API_PROVIDER,
  mockData: process.env.EXPO_PUBLIC_USE_MOCK_DATA,
  analytics: process.env.EXPO_PUBLIC_DISABLE_ANALYTICS,
});
```

### Commands

| Command | Description |
|---------|-------------|
| `eas secret:list` | List all EAS Secrets |
| `eas secret:create --name NAME --value VALUE` | Create a secret |
| `eas secret:delete --name NAME` | Delete a secret |
| `cat eas.json` | View eas.json config |
| `npx expo start --clear` | Restart with cleared cache |

### File Locations

| File | Purpose |
|------|---------|
| `.env` | Local development defaults |
| `.env.local` | Local overrides (git-ignored) |
| `eas.json` | Build profiles and env config |

### Priority Order

```
eas.json env > EAS Secrets > .env files > System env
```
