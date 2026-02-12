#!/usr/bin/env node
import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
const files = execSync('git ls-files -z').toString('utf8').split('\0').filter(Boolean);
let changed=0;
for (const f of files) {
  const buf = readFileSync(f);
  let txt = buf.toString('utf8');
  if (txt.includes('\uFFFD')) {
    const before = txt;
    if (f.startsWith('docs/')) txt = txt.replace(/\uFFFD/g,'REPLACEMENT CHARACTER (U+FFFD)');
    else { txt = txt.replace(/AGENTS \uFFFD/g,'AGENTS §'); txt = txt.replace(/\uFFFD/g,'-'); }
    if (txt !== before) { writeFileSync(f, txt, { encoding: 'utf8' }); changed++; }
  }
}
console.log(`fixed files ${changed}`);