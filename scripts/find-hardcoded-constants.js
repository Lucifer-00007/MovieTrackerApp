#!/usr/bin/env node

/**
 * Find hard-coded constants that could be moved to the constants folder.
 * Detects: colors, URLs, dimensions, strings, and magic numbers.
 * 
 * Usage: node scripts/find-hardcoded-constants.js
 */

const fs = require('fs');
const path = require('path');

// Code file extensions to check
const CODE_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx'];

// Directories to ignore
const IGNORE_DIRS = [
  'node_modules', '.git', '.expo', 'dist', 'build',
  'coverage', '.next', 'android', 'ios', 'constants',
  '__tests__', '__mocks__', 'locales', 'assets'
];

// Files to ignore
const IGNORE_FILES = [
  'jest.config.js', 'eslint.config.js', 'metro.config.js',
  'babel.config.js', 'setup.ts'
];

// Known acceptable values that shouldn't be flagged
// These are package names, class names, or math constants - not hardcoded values
const ACCEPTABLE_VALUES = [
  'react-native-reanimated',  // Package import name
  'AnalyticsNetworkError',    // Error class name
];

// Acceptable timing values in specific contexts
const ACCEPTABLE_TIMING_CONTEXTS = [
  { value: '5000', context: 'default:' },      // JSDoc default value comments
  { value: '100', context: '* 100' },          // Percentage calculations (x / y * 100)
  { value: '100', context: '/ 100' },          // Percentage calculations (x / 100)
];

// Patterns to detect hard-coded constants
const PATTERNS = [
  {
    name: 'Hex Colors',
    regex: /['"`](#[0-9A-Fa-f]{3,8})['"`]/g,
    category: 'colors',
    extract: (match) => match[1]
  },
  {
    name: 'RGB/RGBA Colors',
    regex: /['"`](rgba?\([^)]+\))['"`]/g,
    category: 'colors',
    extract: (match) => match[1]
  },
  {
    name: 'API URLs',
    regex: /['"`](https?:\/\/[^'"`\s]+)['"`]/g,
    category: 'urls',
    extract: (match) => match[1],
    ignore: ['localhost', '127.0.0.1', 'example.com', 'placeholder']
  },
  {
    name: 'Magic Numbers (dimensions)',
    regex: /(?:width|height|padding|margin|size|radius|fontSize):\s*(\d{2,})/g,
    category: 'dimensions',
    extract: (match) => match[1],
    minValue: 10
  },
  {
    name: 'Timeout/Duration Values',
    regex: /(?:timeout|duration|delay|interval).*?(\d{3,})/gi,
    category: 'timing',
    extract: (match) => match[1]
  },
  {
    name: 'API Keys Pattern',
    regex: /['"`]([A-Za-z0-9_-]{20,})['"`]/g,
    category: 'api-keys',
    extract: (match) => match[1],
    ignore: ['node_modules', 'expo-router']
  }
];

function isCodeFile(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const fileName = path.basename(filePath);
  
  if (IGNORE_FILES.includes(fileName)) return false;
  return CODE_EXTENSIONS.includes(ext);
}

function walkDir(dir, results = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    
    if (entry.isDirectory()) {
      if (!IGNORE_DIRS.includes(entry.name) && !entry.name.startsWith('.')) {
        walkDir(fullPath, results);
      }
    } else if (entry.isFile() && isCodeFile(fullPath)) {
      results.push(fullPath);
    }
  }
  
  return results;
}

function analyzeFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const findings = [];
  
  for (const pattern of PATTERNS) {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      let match;
      
      // Skip import/require lines
      if (line.trim().startsWith('import') || line.includes('require(')) continue;
      // Skip comments
      if (line.trim().startsWith('//') || line.trim().startsWith('*')) continue;
      
      const regex = new RegExp(pattern.regex.source, pattern.regex.flags);
      while ((match = regex.exec(line)) !== null) {
        const value = pattern.extract(match);
        
        // Apply ignore filters
        if (pattern.ignore?.some(ig => value.toLowerCase().includes(ig.toLowerCase()))) continue;
        if (pattern.minValue && parseInt(value) < pattern.minValue) continue;
        
        // Skip known acceptable values (package names, class names, etc.)
        if (ACCEPTABLE_VALUES.includes(value)) continue;
        
        // Skip acceptable timing values in specific contexts
        if (pattern.category === 'timing') {
          const isAcceptable = ACCEPTABLE_TIMING_CONTEXTS.some(
            ctx => ctx.value === value && line.includes(ctx.context)
          );
          if (isAcceptable) continue;
        }
        
        findings.push({
          type: pattern.name,
          category: pattern.category,
          value: value.length > 50 ? value.substring(0, 47) + '...' : value,
          line: i + 1,
          context: line.trim().substring(0, 80)
        });
      }
    }
  }
  
  return findings;
}

// Run
console.log('\n🔍 Scanning for hard-coded constants...\n');

const root = process.cwd();
const files = walkDir(root);
const allFindings = new Map();

for (const file of files) {
  const findings = analyzeFile(file);
  if (findings.length > 0) {
    const relativePath = path.relative(root, file);
    allFindings.set(relativePath, findings);
  }
}

if (allFindings.size === 0) {
  console.log('✅ No obvious hard-coded constants found. Nice work!\n');
} else {
  // Group by category
  const byCategory = {};
  
  for (const [file, findings] of allFindings) {
    for (const finding of findings) {
      if (!byCategory[finding.category]) {
        byCategory[finding.category] = [];
      }
      byCategory[finding.category].push({ file, ...finding });
    }
  }
  
  console.log('─'.repeat(70));
  
  for (const [category, items] of Object.entries(byCategory)) {
    console.log(`\n📁 ${category.toUpperCase()} (${items.length} found)\n`);
    
    // Dedupe by value
    const uniqueValues = new Map();
    for (const item of items) {
      if (!uniqueValues.has(item.value)) {
        uniqueValues.set(item.value, []);
      }
      uniqueValues.get(item.value).push(`${item.file}:${item.line}`);
    }
    
    for (const [value, locations] of uniqueValues) {
      console.log(`  "${value}"`);
      console.log(`    └─ ${locations.slice(0, 3).join(', ')}${locations.length > 3 ? ` (+${locations.length - 3} more)` : ''}`);
    }
  }
  
  console.log('\n' + '─'.repeat(70));
  console.log(`\n💡 Suggestions:`);
  console.log(`   • Move colors to constants/colors.ts`);
  console.log(`   • Move API URLs to constants/api.ts`);
  console.log(`   • Move dimensions to constants/layout.ts`);
  console.log(`   • Move timing values to constants/animations.ts\n`);
}
