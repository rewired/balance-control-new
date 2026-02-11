#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const root = dirname(fileURLToPath(import.meta.url)) + '/..';

function runRg(args) {
  const res = spawnSync('rg', args, { cwd: root, encoding: 'utf8' });
  // ripgrep exit codes: 0=matches, 1=none, 2=error
  if (res.status === 2) {
    console.error(res.stderr || 'ripgrep error');
    return { error: true, out: res.stdout || '' };
  }
  return { error: false, out: res.stdout || '' };
}

let failed = false;

// Check @bc/game for any direct G writes
{
  const args = [
    '-n', '--no-heading',
    '-g', 'packages/game/src/**/*.ts',
    '-e', "G\\.[A-Za-z0-9_\\.\\[\\]']+\\s*(\\+=|-==|\\*=|/=|=|\\+\\+|--)",
    '-e', "G\\.[^\\n]+\\.(push|pop|shift|unshift|splice|sort|reverse)\\s*\\("
  ];
  const { error, out } = runRg(args);
  if (!error && out.trim().length) {
    console.error('Direct G-writes detected in @bc/game files (disallowed outside resolver):');
    console.error(out);
    failed = true;
  }
}

// Check @bc/rules for state.* writes outside allowlist
{
  const allow = [
    'packages/rules/src/effects.ts',
          ];
  const globs = ['packages/rules/src/**/*.ts'];
  for (const a of allow) globs.push(`!${a}`);
  const args = ['-n', '--no-heading'];
  for (const g of globs) args.push('-g', g);
  args.push('-e', "\\bstate\\.[A-Za-z0-9_\\.\\[\\]']+\\s*(\\+=|-==|\\*=|/=|=|\\+\\+|--)");
  args.push('-e', "\\bstate\\.[^\\n]+\\.(push|pop|shift|unshift|splice|sort|reverse)\\s*\\(");
  const { error, out } = runRg(args);
  if (!error && out.trim().length) {
    console.error('Direct state-writes detected in @bc/rules (outside allowlist):');
    console.error(out);
    failed = true;
  }
}

if (failed) process.exit(2);
console.log('Mutation check passed.');