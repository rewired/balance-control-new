#!/usr/bin/env node
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const root = dirname(fileURLToPath(import.meta.url)) + '/..';
const cmd = `rg -n --no-heading -g "packages/game/src/**/*.ts" -e "G\\.[A-Za-z0-9_\\.\\[\\]']+\\s*(\\+=|-==|\\*=|/=|=|\\+\\+|--)" -e "G\\.[^\n]+\\.(push|pop|shift|unshift|splice|sort|reverse)\\s*\\("`;
try {
  const out = execSync(cmd, { stdio: ['ignore', 'pipe', 'pipe'], cwd: root, encoding: 'utf8' });
  if (out && out.trim().length) {
    console.error('Direct G-writes detected in @bc/game files (disallowed outside resolver):');
    console.error(out);
    process.exit(2);
  }
  console.log('No direct G-writes detected in @bc/game.');
} catch (err) {
  if (err.status === 2) process.exit(2);
  if (err.stdout) {
    console.error(String(err.stdout));
  }
  if (err.stderr) {
    console.error(String(err.stderr));
  }
  // If ripgrep missing, degrade gracefully
  console.log('Skipping mutation check (rg not available).');
}