#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { basename, extname } from 'node:path';

const textExtensions = new Set([
  '.cjs', '.cmd', '.css', '.html', '.js', '.json', '.lock', '.md', '.mdx', '.mjs',
  '.ps1', '.sh', '.svg', '.toml', '.ts', '.tsx', '.txt', '.yaml', '.yml',
]);
const textDotfiles = new Set(['.editorconfig', '.gitattributes', '.gitignore', '.nvmrc']);
const utf8 = new TextDecoder('utf-8', { fatal: true, ignoreBOM: true });
const windows1252 = new TextDecoder('windows-1252');
const byteForCharacter = new Map();
for (let byte = 0x80; byte <= 0xff; byte++) {
  byteForCharacter.set(String.fromCharCode(byte), byte);
  byteForCharacter.set(windows1252.decode(Uint8Array.of(byte)), byte);
}
const continuation = `[${Array.from(byteForCharacter)
  .filter(([, byte]) => byte <= 0xbf)
  .map(([character]) => character)
  .join('')}]`;
const damagedUtf8 = new RegExp(
  `[\\u00c2-\\u00df]${continuation}|[\\u00e0-\\u00ef]${continuation}{2}|[\\u00f0-\\u00f4]${continuation}{3}`,
  'gu',
);

function hasMojibake(source) {
  for (const [sequence] of source.matchAll(damagedUtf8)) {
    try {
      utf8.decode(Uint8Array.from(sequence, character => byteForCharacter.get(character)));
      return true;
    } catch {
      // Only flag byte sequences that form a valid UTF-8 character.
    }
  }
  return false;
}

function hasRedundantJsonEscapes(source) {
  // Consume escaped backslashes first so that a literal "\\u003e" is preserved.
  for (const [token, hex] of source.matchAll(/\\(?:u([\da-fA-F]{4})|[\\/bfnrt"])/g)) {
    if (!hex) continue;
    const code = Number.parseInt(hex, 16);
    if (code >= 0x20 && code <= 0x7e && code !== 0x22 && code !== 0x5c) return token;
  }
  return undefined;
}

const files = execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard', '-z'], {
  encoding: 'utf8',
}).split('\0').filter(Boolean);
const offenders = [];
for (const file of new Set(files)) {
  const extension = extname(file).toLowerCase();
  if ((!textExtensions.has(extension) && !textDotfiles.has(basename(file))) || !existsSync(file)) continue;

  let source;
  try {
    source = utf8.decode(readFileSync(file));
  } catch {
    offenders.push(`${file} (invalid UTF-8)`);
    continue;
  }
  if (source.startsWith('\ufeff')) offenders.push(`${file} (BOM)`);
  if (/[\u0080-\u009f\ufffd]/u.test(source)) offenders.push(`${file} (replacement character or C1 control)`);
  if (hasMojibake(source)) offenders.push(`${file} (misdecoded UTF-8)`);
  const escape = extension === '.json' && hasRedundantJsonEscapes(source);
  if (escape) offenders.push(`${file} (redundant ${escape} escape)`);
}

if (offenders.length) {
  console.error(`Encoding issues found:\n${offenders.join('\n')}`);
  process.exitCode = 1;
} else {
  console.log('Encoding OK: UTF-8 without BOM, mojibake or redundant ASCII JSON escapes.');
}
