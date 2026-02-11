#!/usr/bin/env node
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const exts = new Set(['.ts','.tsx','.js','.mjs','.cjs','.json','.md','.mdx','.yml','.yaml','.css','.html','.txt']);

function listFiles() {
  const out = execSync('git ls-files -z', { encoding: 'buffer' });
  return out.toString('utf8').split('\0').filter(Boolean);
}

function hasTextExt(path) {
  const i = path.lastIndexOf('.');
  if (i < 0) return false;
  const ext = path.slice(i);
  return exts.has(ext);
}

const offenders = [];
for (const f of listFiles()) {
  if (!hasTextExt(f)) continue;
  const buf = readFileSync(f);
  if (buf.length >= 3 && buf[0] === 0xef && buf[1] === 0xbb && buf[2] === 0xbf) {
    offenders.push({ file: f, reason: 'BOM' });
    continue;
  }
  const s = buf.toString('utf8');
  if (s.includes('\r\n')) offenders.push({ file: f, reason: 'CRLF' });
}

if (offenders.length) {
  console.error('Encoding/normalization issues found:');
  for (const o of offenders) console.error(`- ${o.file} (${o.reason})`);
  process.exit(1);
}
console.log('Encoding OK: utf-8, no BOM, LF.');