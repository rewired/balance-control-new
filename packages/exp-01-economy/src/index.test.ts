import { describe, it, expect } from 'vitest';
import { exp01Economy } from './index.js';

describe('exp-01-economy scaffold', () => {
  it('exports exp01Economy()', () => {
    expect(typeof exp01Economy).toBe('function');
  });
});