import crypto from 'node:crypto';

function stableStringifyInternal(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return '[' + value.map((v) => stableStringifyInternal(v)).join(',') + ']';
  const obj = value as Record<string, unknown>; const keys = Object.keys(obj).sort();
  const body = keys.map((k) => JSON.stringify(k) + ':' + stableStringifyInternal(obj[k])).join(',');
  return '{' + body + '}';
}

export function stableHash(value: unknown): string {
  const s = stableStringifyInternal(value);
  return crypto.createHash('sha256').update(s).digest('hex');
}