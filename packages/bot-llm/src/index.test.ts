import { describe, it, expect } from 'vitest';
import { chooseOptionWithLLM } from './index.js';

describe('bot adapter exports', () => {
  it('exports core functions', () => {
    expect(typeof chooseOptionWithLLM).toBe('function');
  });
});
