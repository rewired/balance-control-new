/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect } from 'vitest';
import { createCoreResourceRegistry, makeEmptyResourceBank, addResources, canPay, subResources } from './resources.js';

describe('Resource registry — Task 0011', () => {
  it('core-only registry contains exactly DOM/FOR/INF', () => {
    const r = createCoreResourceRegistry();
    expect(r.list()).toEqual(['DOM','FOR','INF']);
    expect(r.has('DOM')).toBe(true);
    expect(r.has('ECO')).toBe(false);
  });
  it('no keys outside registry; unknown cost rejected', () => {
    const r = createCoreResourceRegistry();
    const bank = makeEmptyResourceBank(r);
    addResources(r, bank, { DOM: 3 });
    expect(() => canPay(r, bank, { ECO: 1 } as any)).toThrow();
  });
  it('can pay deterministically and subResources enforces non-negative', () => {
    const r = createCoreResourceRegistry();
    const bank = makeEmptyResourceBank(r);
    addResources(r, bank, { FOR: 2, INF: 1 });
    expect(canPay(r, bank, { FOR: 2 })).toBe(true);
    subResources(r, bank, { FOR: 2 });
    expect(bank.FOR).toBe(0);
    expect(canPay(r, bank, { INF: 2 })).toBe(false);
  });
});