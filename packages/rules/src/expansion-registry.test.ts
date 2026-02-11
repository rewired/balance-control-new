import { describe, it, expect, beforeEach } from 'vitest';
import { createExpansionRegistry, registerExpansion, __resetRegisteredExpansionsForTest } from './expansion-registry.js';
import type { ExpansionModule } from './expansion-registry.js';

function mod(id: 'exp01'|'exp02'|'exp03'): ExpansionModule {
  return {
    id,
    registerResources: () => void 0,
    setupExpansionState: () => void 0,
  };
}

describe('Expansion registry — Task 0013', () => {
  beforeEach(() => {
    __resetRegisteredExpansionsForTest();
  });

  it('returns empty list for CORE-only flags', () => {
    registerExpansion(mod('exp03'));
    const list = createExpansionRegistry({ exp01: false, exp02: false, exp03: false });
    expect(list).toEqual([]);
  });

  it('filters by enabled flags', () => {
    registerExpansion(mod('exp01'));
    registerExpansion(mod('exp02'));
    const list = createExpansionRegistry({ exp01: true, exp02: false, exp03: false });
    expect(list.map(m => m.id)).toEqual(['exp01']);
  });

  it('ordering is deterministic (sorted by id)', () => {
    registerExpansion(mod('exp03'));
    registerExpansion(mod('exp01'));
    registerExpansion(mod('exp02'));
    const list = createExpansionRegistry({ exp01: true, exp02: true, exp03: true });
    expect(list.map(m => m.id)).toEqual(['exp01','exp02','exp03']);
  });
});