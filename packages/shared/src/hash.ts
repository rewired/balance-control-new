import { sha256 } from '@noble/hashes/sha256';
import { bytesToHex } from '@noble/hashes/utils';
import stringify from 'fast-json-stable-stringify';

export function stableHash(value: unknown): string {
  // AGENTS 5.3: normalize with JSON persistence semantics before sorting keys.
  const json = JSON.stringify(value);
  if (json === undefined) throw new TypeError('Hash input must serialize to JSON');
  return bytesToHex(sha256(stringify(JSON.parse(json))));
}
