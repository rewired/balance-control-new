import { describe, it, expect } from 'vitest';
import { stableHash } from './hash.js';

describe('stableHash', () => {
  it('is stable across key order', () => {
    const a = { b: 1, a: { z: [3,2,1], q: 'x' } } as const;
    const b = { a: { q: 'x', z: [3,2,1] }, b: 1 } as const;
    expect(stableHash(a)).toBe(stableHash(b));
  });
});