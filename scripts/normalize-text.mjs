#!/usr/bin/env node
import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';

const mappings = new Map([
  ['Â§','§'],
  ['Â ',' '],
  ['â€”','—'],
  ['â€“','–'],
  ['â€œ','“'],
  ['â€˜','‘'],
  ['â€™','’'],
  ['â€','„'],
  ['â€','”'],
  ['â€¦','…'],
  ['Ã‚Â§','§'],
  ['Ãƒâ€šÂ§','§'],
  ['Ã¢â‚¬â€œ','–'],
  ['Ã¢â‚¬â€”','—'],
  ['Ã¢â‚¬Å“','“'],
  ['Ã¢â‚¬Â','”'],
  ['Ã¢â‚¬â„¢','’'],
  ['Ã¢â‚¬Â¦','…'],
  ['AGENTS \uFFFD','AGENTS §'],
]);

const textExts = new Set(['.md','.mdx','.ts','.tsx','.js','.mjs','.cjs','.json','.yml','.yaml','.css','.html','.txt']);

function listFiles() {
  const out = execSync('git ls-files -z', { encoding: 'buffer' });
  return out.toString('utf8').split('\0').filter(Boolean);
}

function hasTextExt(path) {
  const i = path.lastIndexOf('.');
  if (i < 0) return false;
  const ext = path.slice(i);
  return textExts.has(ext);
}

function containsMojibake(s) {
  return /[ÃÂ]|â€”|â€“|â€|Ãƒ/.test(s);
}

let changed = 0;
for (const f of listFiles()) {
  if (!hasTextExt(f)) continue;
  const buf = readFileSync(f);
  let s = buf.toString('utf8');

  const hadBom = buf.length >= 3 && buf[0] === 0xef && buf[1] === 0xbb && buf[2] === 0xbf;
  const hadCrlf = s.includes('\r\n');

  const before = s;

  if (f.startsWith('docs/') || f.includes('packages/rules/src/types.ts') || f.includes('packages/rules/src/effects.ts') || f.includes('packages/rules/src/setup.ts') || f.includes('packages/rules/src/moves.ts')) {
    s = Buffer.from(s, 'latin1').toString('utf8');
  } else if (containsMojibake(s)) {
    const attempt = Buffer.from(s, 'latin1').toString('utf8');
    const count = (x) => (x.match(/[ÃÂ]|â€”|â€“|â€|Ãƒ/g)?.length ?? 0);
    if (count(attempt) < count(s)) s = attempt;
  }

  if (hadCrlf) s = s.replace(/\r\n/g, '\n');
  for (const [bad, good] of mappings) s = s.split(bad).join(good);

  let modified = hadBom || hadCrlf || s !== before;
  if (modified) {
    if (s.charCodeAt(0) === 0xFEFF) s = s.slice(1);
    writeFileSync(f, s, { encoding: 'utf8' });
    changed++;
  }
}
console.log(`Normalized ${changed} files.`);