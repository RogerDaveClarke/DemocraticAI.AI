#!/usr/bin/env node

import { spawnSync } from 'node:child_process';

const hookPath = '.githooks';

const result = spawnSync('git', ['config', 'core.hooksPath', hookPath], {
  stdio: 'inherit',
  env: process.env,
});

if (result.status !== 0) {
  console.error('Failed to configure git hooks path.');
  process.exit(1);
}

spawnSync('chmod', ['+x', `${hookPath}/pre-commit`], {
  stdio: 'ignore',
  env: process.env,
});

console.log(`Git hooks configured: core.hooksPath=${hookPath}`);
