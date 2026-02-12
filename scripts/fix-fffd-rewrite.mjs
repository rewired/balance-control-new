#!/usr/bin/env node
import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';

const files = execSync('git ls-files -z').toString('utf8').split('\0').filter(Boolean);
let n=0;
for (const f of files) {
  const buf = readFileSync(f);
  let s = buf.toString('utf8');
  if (s.includes('\uFFFD')) {
    s = s.replace(/AGENTS \uFFFD/g, 'AGENTS §');
    s = s.replace(/\uFFFD/g, '—');
    writeFileSync(f, s, { encoding: 'utf8' });
    n++;
  }
}
console.log(`rewritten ${n} files`);