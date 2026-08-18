import { readFileSync, readdirSync } from 'node:fs';
import { basename, extname, join } from 'node:path';

const forbidden = [
  'myparliament-474716',
  '234447527867',
  'rogerdavidclarke@democraticai.ai',
  'noreply@democraticai.ai',
];
const credentialPatterns = [
  /AIza[0-9A-Za-z_-]{30,}/,
  /re_[0-9A-Za-z_-]{20,}/,
  /BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY/,
  /(?:VITE_API_KEY|VALID_API_KEYS)=[0-9A-Za-z_-]{20,}/,
];
const placeholderPattern = /replace-with|your-|<REDACTED/i;
const excludedDirectories = new Set(['.git', '.venv', 'dist', 'node_modules', 'security', 'documents']);
const extensions = new Set(['.cjs', '.html', '.js', '.json', '.mjs', '.ps1', '.py', '.sh', '.tf', '.ts', '.tsx', '.yaml', '.yml']);

function walk(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    if (entry.isDirectory() && excludedDirectories.has(entry.name)) return [];
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return walk(path);
    if (path.endsWith('scripts\\check-clone-isolation.mjs') || path.endsWith('scripts/check-clone-isolation.mjs')) return [];
    if (entry.name.startsWith('.env') && !entry.name.endsWith('.template') && entry.name !== '.env.example') return [];
    return extensions.has(extname(entry.name)) || basename(path) === 'Dockerfile' ? [path] : [];
  });
}

const violations = walk('.').flatMap(file => {
  const source = readFileSync(file, 'utf8');
  return forbidden.filter(value => source.includes(value)).map(value => `${file}: ${value}`);
});

if (violations.length > 0) {
  console.error('Clone isolation check failed:\n' + violations.join('\n'));
  process.exit(1);
}
console.log('Clone isolation check passed');


