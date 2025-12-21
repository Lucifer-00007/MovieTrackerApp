# Scripts Directory

This directory contains build scripts, utilities, and automation tools for the MovieTracker project.

## Structure

### Build Scripts
- Build automation and optimization
- Asset processing and bundling
- Environment-specific configurations
- Release preparation scripts

### Development Scripts
- Development server utilities
- Code generation tools
- Database seeding scripts
- Mock data generators

### Deployment Scripts
- CI/CD pipeline scripts
- Platform-specific build scripts
- App store submission automation
- Environment deployment tools

## Script Categories

### Build & Bundle
```bash
# Production build
bun run build:prod

# Development build with debugging
bun run build:dev

# Asset optimization
bun run optimize:assets
```

### Code Quality
```bash
# Linting and formatting
bun run lint:fix
bun run format

# Type checking
bun run type-check

# Test coverage
bun run test:coverage
```

### Development Tools
```bash
# Generate component templates
bun run generate:component

# Create mock data
bun run generate:mocks

# Database operations
bun run db:seed
```

### Platform Builds
```bash
# iOS build
bun run build:ios

# Android build
bun run build:android

# Web build
bun run build:web
```

## Script Conventions

### Naming
- Use **kebab-case** for script files
- Prefix with category: `build-`, `deploy-`, `generate-`
- Use descriptive names: `generate-app-icons.js`

### Structure
```javascript
#!/usr/bin/env node

/**
 * Script description and usage
 */

const { execSync } = require('child_process');
const path = require('path');

// Script configuration
const config = {
  // Configuration options
};

// Main script logic
async function main() {
  try {
    // Script implementation
  } catch (error) {
    console.error('Script failed:', error.message);
    process.exit(1);
  }
}

// Run script if called directly
if (require.main === module) {
  main();
}
```

## Common Scripts

### Asset Processing
- **generate-app-icons.js** - Generate app icons for all platforms
- **optimize-images.js** - Compress and optimize image assets
- **generate-splash-screens.js** - Create splash screens for different devices

### Code Generation
- **create-component.js** - Generate component boilerplate
- **create-screen.js** - Generate screen component with routing
- **create-hook.js** - Generate custom hook template

### Build Automation
- **prebuild.js** - Pre-build setup and validation
- **postbuild.js** - Post-build cleanup and optimization
- **bundle-analyzer.js** - Analyze bundle size and dependencies

### Testing & QA
- **run-e2e-tests.js** - Execute end-to-end test suite
- **generate-test-data.js** - Create test fixtures and mock data
- **validate-translations.js** - Check translation completeness

## Environment Configuration

### Development
```javascript
const devConfig = {
  apiUrl: 'https://api.dev.movietracker.com',
  debugMode: true,
  mockData: true
};
```

### Production
```javascript
const prodConfig = {
  apiUrl: 'https://api.movietracker.com',
  debugMode: false,
  mockData: false
};
```

## Usage Guidelines

### Running Scripts
```bash
# Direct execution
node scripts/build-production.js

# Via package.json
bun run build:prod

# With arguments
node scripts/generate-component.js --name=MovieCard --type=functional
```

### Error Handling
- Always include proper error handling
- Provide meaningful error messages
- Exit with appropriate status codes
- Log progress for long-running scripts

### Documentation
- Include usage instructions in script comments
- Document required environment variables
- Provide examples for complex scripts
- Keep README updated with new scripts

## Best Practices

- Make scripts idempotent (safe to run multiple times)
- Use cross-platform compatible commands
- Validate inputs and prerequisites
- Provide progress feedback for long operations
- Clean up temporary files and resources
- Use TypeScript for complex scripts
- Test scripts in different environments
- Version control all scripts and configurations