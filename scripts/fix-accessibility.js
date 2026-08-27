#!/usr/bin/env node

/**
 * Accessibility Fix Script
 * Applies critical accessibility fixes to existing components
 */

const fs = require('fs');
const path = require('path');

function safeDirectoryEntryName(entryName) {
  if (entryName !== path.basename(entryName) || entryName === '.' || entryName === '..') {
    throw new Error(`Refusing unsafe directory entry: ${entryName}`);
  }

  return entryName;
}

function childPath(parentDir, childName) {
  const safeName = safeDirectoryEntryName(childName);
  const separator = parentDir.endsWith(path.sep) ? '' : path.sep;
  return `${parentDir}${separator}${safeName}`;
}

// Define the fixes to apply
const fixes = [
  {
    name: 'Add ARIA labels to buttons',
    files: ['src/components/**/*.tsx'],
    pattern: /<button([^>]*?)onClick={([^}]+)}([^>]*?)>/g,
    replacement: (match, before, onClick, after) => {
      // Only add aria-label if it doesn't already exist
      if (match.includes('aria-label')) return match;
      
      // Extract button content or use generic label
      const ariaLabel = 'aria-label="Perform action"';
      return `<button${before}onClick={${onClick}} ${ariaLabel}${after}>`;
    }
  },
  {
    name: 'Fix close button accessibility',
    pattern: /<button([^>]*?)onClick={([^}]*onClose[^}]*)}([^>]*?)>\s*<X/g,
    replacement: '<button$1onClick={$2} aria-label="Close dialog"$3><X'
  },
  {
    name: 'Add form labels',
    pattern: /<input([^>]*?)placeholder="([^"]*)"([^>]*?)(?!.*id=)/g,
    replacement: (match, before, placeholder, after) => {
      const id = `input-${Math.random().toString(36).substr(2, 9)}`;
      return `<label htmlFor="${id}" className="sr-only">${placeholder}</label>\n<input${before}id="${id}" placeholder="${placeholder}"${after}`;
    }
  },
  {
    name: 'Add textarea labels',
    pattern: /<textarea([^>]*?)placeholder="([^"]*)"([^>]*?)(?!.*id=)/g,
    replacement: (match, before, placeholder, after) => {
      const id = `textarea-${Math.random().toString(36).substr(2, 9)}`;
      return `<label htmlFor="${id}" className="sr-only">${placeholder}</label>\n<textarea${before}id="${id}" placeholder="${placeholder}"${after}`;
    }
  },
  {
    name: 'Add modal accessibility',
    pattern: /<div className="fixed inset-0 bg-black bg-opacity-50([^>]*?)>/g,
    replacement: '<div className="fixed inset-0 bg-black bg-opacity-50$1 role="dialog" aria-modal="true">'
  },
  {
    name: 'Add keyboard navigation to clickable divs',
    pattern: /<div([^>]*?)onClick={([^}]+)}([^>]*?)>/g,
    replacement: (match, before, onClick, after) => {
      if (match.includes('role=') || match.includes('tabIndex')) return match;
      return `<div${before}onClick={${onClick}} role="button" tabIndex={0} onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && ${onClick}()}${after}>`;
    }
  },
  {
    name: 'Add loading announcements',
    pattern: /{isLoading && \(\s*<div([^>]*?)>\s*<div([^>]*?)>\s*<div([^>]*?)animate-spin/g,
    replacement: '{isLoading && (\n<div$1>\n<div role="status" aria-live="polite"$2>\n<div$3animate-spin'
  },
  {
    name: 'Add alt text placeholders for images',
    pattern: /<img([^>]*?)src={([^}]+)}([^>]*?)(?!.*alt=)/g,
    replacement: '<img$1src={$2} alt="Loading image"$3'
  }
];

// Function to apply fixes to a file
function applyFixes(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  fixes.forEach(fix => {
    const originalContent = content;
    if (typeof fix.replacement === 'function') {
      content = content.replace(fix.pattern, fix.replacement);
    } else {
      content = content.replace(fix.pattern, fix.replacement);
    }
    
    if (content !== originalContent) {
      console.log(`Applied fix: ${fix.name} to ${filePath}`);
      modified = true;
    }
  });

  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
  }

  return modified;
}

// Function to find all TSX files
function findTsxFiles(dir) {
  let results = [];
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = childPath(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
      results = results.concat(findTsxFiles(filePath));
    } else if (file.endsWith('.tsx')) {
      results.push(filePath);
    }
  });
  
  return results;
}

// Main execution
console.log('🔧 Starting accessibility fixes...\n');

const srcDir = path.join(process.cwd(), 'src');
if (!fs.existsSync(srcDir)) {
  console.error('❌ src directory not found. Run this script from the project root.');
  process.exit(1);
}

const tsxFiles = findTsxFiles(srcDir);
let totalModified = 0;

tsxFiles.forEach(file => {
  if (applyFixes(file)) {
    totalModified++;
  }
});

console.log(`\n✅ Accessibility fixes complete!`);
console.log(`📁 Files processed: ${tsxFiles.length}`);
console.log(`🔧 Files modified: ${totalModified}`);

// Add accessibility CSS import to main CSS file
const mainCssPath = path.join(process.cwd(), 'src', 'index.css');
if (fs.existsSync(mainCssPath)) {
  let mainCss = fs.readFileSync(mainCssPath, 'utf8');
  if (!mainCss.includes('@import "./styles/accessibility.css"')) {
    mainCss = '@import "./styles/accessibility.css";\n' + mainCss;
    fs.writeFileSync(mainCssPath, mainCss, 'utf8');
    console.log('📄 Added accessibility CSS import to index.css');
  }
}

// Create accessibility configuration
const a11yConfig = {
  "name": "Parliament Explorer Accessibility Configuration",
  "version": "1.0.0",
  "wcag": "2.1 AA",
  "tools": {
    "axe-core": "^4.10.3",
    "eslint-plugin-jsx-a11y": "^6.8.0"
  },
  "testing": {
    "automated": true,
    "manual": true,
    "screenReader": "recommended"
  },
  "checklist": {
    "keyboardNavigation": "in-progress",
    "screenReaderSupport": "in-progress", 
    "colorContrast": "review-needed",
    "focusManagement": "in-progress",
    "formLabeling": "in-progress",
    "imageAltText": "in-progress",
    "semanticHTML": "review-needed",
    "ariaAttributes": "in-progress"
  },
  "nextSteps": [
    "Install eslint-plugin-jsx-a11y",
    "Add automated accessibility tests",
    "Conduct screen reader testing",
    "Verify color contrast ratios",
    "Test keyboard navigation flows",
    "Add skip navigation links",
    "Implement focus management",
    "Add loading announcements"
  ]
};

fs.writeFileSync(
  path.join(process.cwd(), 'accessibility-config.json'),
  JSON.stringify(a11yConfig, null, 2),
  'utf8'
);

console.log('📋 Created accessibility-config.json with project status');

console.log('\n🚀 Next steps:');
console.log('1. Install ESLint accessibility plugin: npm install --save-dev eslint-plugin-jsx-a11y');
console.log('2. Review and test the applied fixes');
console.log('3. Run accessibility audit: npm run a11y-audit');
console.log('4. Test with keyboard navigation');
console.log('5. Test with screen reader software');
console.log('\n📖 See ACCESSIBILITY_AUDIT.md for detailed guidance');