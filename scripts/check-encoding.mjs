#!/usr/bin/env node
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const exts = new Set(['.ts','.tsx','.js','.mjs','.cjs','.json','.md','.mdx','.yml','.yaml','.css','.html','.txt','.cjs']);

function listFiles() { return execSync('git ls-files -z').toString('utf8').split('\0').filter(Boolean); }
function hasTextExt(p){ const i=p.lastIndexOf('.'); return i>=0 && exts.has(p.slice(i)); }

const offenders = [];
for (const f of listFiles()) {
  if (!hasTextExt(f)) continue;
  const buf = readFileSync(f);
  if (buf.length>=3 && buf[0]===0xEF && buf[1]===0xBB && buf[2]===0xBF) offenders.push(`${f} (BOM)`);
  const s = buf.toString('utf8');
  if (s.includes('\uFFFD')) offenders.push(`${f} (U+FFFD)`);
}
if (offenders.length) { console.error('Encoding issues found:\n' + offenders.join('\n')); process.exit(1); }
console.log('Encoding OK: no BOM, no U+FFFD.');