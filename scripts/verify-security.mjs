#!/usr/bin/env node

import { spawnSync } from 'node:child_process';

const isCi = process.env.CI === 'true';
const semgrepCommand = 'semgrep scan --config=auto --error --exclude node_modules --exclude dist --exclude cloud-run-api/dist --exclude scripts/node_modules';

const checks = [
  { name: 'Clone isolation', command: 'npm run check:clone-isolation' },
  { name: 'TypeScript typecheck', command: 'npm run typecheck' },
  { name: 'Lint', command: 'npm run lint' },
  { name: 'Build', command: 'npm run build' },
  { name: 'Playwright tests', command: 'npx playwright test --workers=1 --reporter=line' },
  { name: 'Cloud Run API install', command: 'npm --prefix cloud-run-api ci' },
  { name: 'Cloud Run API build', command: 'npm --prefix cloud-run-api run build' },
  { name: 'Cloud Run API lint', command: 'npm --prefix cloud-run-api run lint' },
  { name: 'Cloud Run API security tests', command: 'npm --prefix cloud-run-api run test:security' },
  { name: 'Root dependency audit', command: 'npm audit --audit-level=high' },
  { name: 'Cloud Run API dependency audit', command: 'npm --prefix cloud-run-api audit --audit-level=high' },
  { name: 'Scripts dependency audit', command: 'npm --prefix scripts audit --audit-level=high' },
  ...(isCi ? [{ name: 'Semgrep SAST', command: semgrepCommand }] : []),
  {
    name: isCi ? 'Secrets scan (gitleaks history)' : 'Secrets scan (gitleaks staged)',
    command: isCi
      ? 'gitleaks git --redact --no-banner .'
      : 'gitleaks git --staged --redact --no-banner .',
  },
];

function runCheck(command) {
  return spawnSync(command, {
    shell: true,
    stdio: 'inherit',
    env: process.env,
  });
}

console.log('Repository Security Verification');
console.log('================================');

if (!isCi) {
  console.log('[INFO] Semgrep is enforced by the Linux CI security workflow.');
}

const failedChecks = [];

for (const check of checks) {
  console.log(`\n[RUN] ${check.name}`);
  const result = runCheck(check.command);
  if (result.status !== 0) {
    failedChecks.push(check.name);
    console.error(`[FAIL] ${check.name}`);
  } else {
    console.log(`[PASS] ${check.name}`);
  }
}

if (failedChecks.length > 0) {
  console.error('\nSecurity verification failed. The following checks did not pass:');
  for (const name of failedChecks) {
    console.error(`- ${name}`);
  }
  process.exit(1);
}

console.log('\nAll repository security verification checks passed.');