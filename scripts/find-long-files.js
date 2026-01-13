#!/usr/bin/env node

/**
 * Find code files longer than 500 lines.
 * Ignores markdown, config files, and non-development files.
 * 
 * Usage: node scripts/find-long-files.js [threshold]
 * Example: node scripts/find-long-files.js 300
 */

const fs = require('fs');
const path = require('path');

const LINE_THRESHOLD = parseInt(process.argv[2]) || 500;

// Code file extensions to check
const CODE_EXTENSIONS = [
  '.ts', '.tsx', '.js', '.jsx',
  '.json', '.css', '.scss'
];

// Directories to ignore
const IGNORE_DIRS = [
  'node_modules', '.git', '.expo', 'dist', 'build',
  'coverage', '.next', 'android', 'ios', 'assets', '__tests__'
];

// Files to ignore
const IGNORE_FILES = [
  'package-lock.json', 'bun.lock', 'yarn.lock',
  'tsconfig.json', 'jest.config.js', 'eslint.config.js',
  'app.json', 'expo-env.d.ts'
];

function countLines(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  return content.split('\n').length;
}

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
      const lineCount = countLines(fullPath);
      if (lineCount > LINE_THRESHOLD) {
        results.push({ path: fullPath, lines: lineCount });
      }
    }
  }
  
  return results;
}

// Run
console.log(`\n🔍 Finding code files longer than ${LINE_THRESHOLD} lines...\n`);

const root = process.cwd();
const longFiles = walkDir(root).sort((a, b) => b.lines - a.lines);

if (longFiles.length === 0) {
  console.log(`✅ No code files exceed ${LINE_THRESHOLD} lines. Great job!\n`);
} else {
  console.log(`⚠️  Found ${longFiles.length} file(s) exceeding ${LINE_THRESHOLD} lines:\n`);
  console.log('─'.repeat(60));
  
  for (const file of longFiles) {
    const relativePath = path.relative(root, file.path);
    console.log(`  ${file.lines.toString().padStart(5)} lines │ ${relativePath}`);
  }
  
  console.log('─'.repeat(60));
  console.log(`\n💡 Consider refactoring these files into smaller modules.\n`);
}
