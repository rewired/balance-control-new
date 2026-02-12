#!/usr/bin/env node
import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';

const files = execSync('git ls-files -z').toString('utf8').split('\0').filter(Boolean);

let bomRemoved=0; const replacedIn=[];

for (const f of files) {
  const buf = readFileSync(f);
  let s = buf.toString('utf8');
  let changed = false;
  // Strip BOM
  if (buf.length>=3 && buf[0]===0xEF && buf[1]===0xBB && buf[2]===0xBF) { s = s.replace(/^\uFEFF/, ''); changed=true; bomRemoved++; }
  // Targeted U+FFFD fixes
  const before = s;
  // 1) AGENTS ? -> AGENTS - (common in comments)
  s = s.replace(/AGENTS \uFFFD/g, 'AGENTS -');
  // 2) Quote usage in docs: "?" -> "REPLACEMENT CHARACTER (U+FFFD)"
  s = s.replace(/"\uFFFD"/g, '"REPLACEMENT CHARACTER (U+FFFD)"');
  // 3) Lone U+FFFD in docs sentences -> REPLACEMENT CHARACTER (U+FFFD)
  if (f.startsWith('docs/')) s = s.replace(/\uFFFD/g, 'REPLACEMENT CHARACTER (U+FFFD)');
  if (s !== before) { changed = true; replacedIn.push(f); }
  if (changed) writeFileSync(f, s, { encoding: 'utf8' });
}

console.log(JSON.stringify({ bomRemoved, replacedIn }, null, 2));