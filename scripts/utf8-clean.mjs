#!/usr/bin/env node
import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';

const files = execSync('git ls-files -z').toString('utf8').split('\0').filter(Boolean);
let n=0;
for (const f of files) {
  const buf = readFileSync(f);
  let sUtf8 = buf.toString('utf8');
  let changed = false;
  if (sUtf8.includes('\uFFFD')) { // invalid sequences when read as utf8
    // fix common patterns
    sUtf8 = sUtf8.replace(/AGENTS \uFFFD/g, 'AGENTS §');
    sUtf8 = sUtf8.replace(/\uFFFD/g, '—');
    changed = true;
  }
  // Also handle files that were mis-decoded earlier (latin1 view of UTF-8 sequences)
  let sLatin1 = buf.toString('latin1');
  if (sLatin1.includes('ï¿½')) {
    sLatin1 = sLatin1.replace(/AGENTS ï¿½/g, 'AGENTS §');
    sLatin1 = sLatin1.replace(/ï¿½/g, '—');
    // now treat as unicode string
    sUtf8 = sLatin1;
    changed = true;
  }
  if (changed) {
    writeFileSync(f, sUtf8, { encoding: 'utf8' });
    n++;
  }
}
console.log(`utf8-clean rewrote ${n} files`);