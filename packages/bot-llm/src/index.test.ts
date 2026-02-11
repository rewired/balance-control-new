import { describe, it, expect } from 'vitest';
import { enumerateLegalIntents, chooseOptionWithLLM, validateChoice } from './index.js';

describe('bot adapter exports', () => {
  it('exports core functions', () => {
    expect(typeof enumerateLegalIntents).toBe('function');
    expect(typeof chooseOptionWithLLM).toBe('function');
    expect(typeof validateChoice).toBe('function');
  });
});