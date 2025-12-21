# Locales Directory

This directory contains internationalization (i18n) files for the MovieTracker app, supporting multiple languages and regions.

## Structure

### Language Files
Organized by language code (ISO 639-1):
- `en.json` - English (default)
- `es.json` - Spanish
- `de.json` - German
- `ru.json` - Russian
- `zh.json` - Chinese (Simplified)
- `ja.json` - Japanese
- `hi.json` - Hindi

### Regional Variants
For region-specific translations:
- `en-US.json` - English (United States)
- `en-GB.json` - English (United Kingdom)
- `zh-CN.json` - Chinese (Simplified, China)
- `zh-TW.json` - Chinese (Traditional, Taiwan)

## Translation Structure

### JSON Format
```json
{
  "common": {
    "loading": "Loading...",
    "error": "Error",
    "retry": "Retry"
  },
  "navigation": {
    "home": "Home",
    "explore": "Explore",
    "watchlist": "Watchlist"
  },
  "movie": {
    "title": "Movies",
    "genres": "Genres",
    "cast": "Cast",
    "synopsis": "Synopsis"
  }
}
```

### Key Organization
- **common** - Shared UI elements (buttons, messages, states)
- **navigation** - Tab labels, screen titles, menu items
- **movie** - Movie-specific terms and labels
- **tv** - TV series-specific terms and labels
- **search** - Search interface and filters
- **settings** - App settings and preferences
- **errors** - Error messages and descriptions

## Usage

### Setting Up i18n
```typescript
import { useTranslation } from 'react-i18next';

function MyComponent() {
  const { t } = useTranslation();
  
  return (
    <Text>{t('common.loading')}</Text>
  );
}
```

### Pluralization
```json
{
  "movie": {
    "count_one": "{{count}} movie",
    "count_other": "{{count}} movies"
  }
}
```

### Interpolation
```json
{
  "welcome": "Welcome, {{name}}!"
}
```

## Localization Features

### Supported Languages
- **English** - Primary language, complete translations
- **Spanish** - Major markets (Spain, Latin America)
- **German** - European market
- **Russian** - Eastern European market
- **Chinese** - Asian market (Simplified/Traditional)
- **Japanese** - Anime and Asian content focus
- **Hindi** - Indian market (Bollywood content)

### Regional Content
- Country-specific movie/TV recommendations
- Local streaming service integration
- Regional rating systems
- Cultural content preferences

### RTL Support
- Arabic and Hebrew language support (planned)
- Right-to-left layout adjustments
- Text direction handling

## Translation Guidelines

### Content Types
- **UI Labels** - Keep concise, under 20 characters when possible
- **Descriptions** - Maintain tone and context
- **Error Messages** - Clear, actionable language
- **Genre Names** - Use standard industry terms

### Cultural Considerations
- Respect local content preferences
- Consider cultural sensitivities
- Use appropriate formality levels
- Adapt date/time formats

### Quality Assurance
- Native speaker review for all translations
- Context-aware translations (not word-for-word)
- Consistent terminology across the app
- Regular updates for new features

## Best Practices

- Use namespaced keys for organization
- Keep translation keys descriptive
- Avoid hardcoded strings in components
- Test all languages on actual devices
- Consider text expansion (German can be 30% longer)
- Implement fallback to English for missing translations
- Use interpolation for dynamic content
- Regular translation audits and updates