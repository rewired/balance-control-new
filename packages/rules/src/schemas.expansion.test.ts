/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect } from 'vitest';
import { MatchConfigSchema, ExpansionFlagsSchema } from './schemas.js';
import { buildInitialCoreState } from './setup.js';

describe('Match config — Task 0010', () => {
  it('defaults expansions to all false when missing', () => {
    const cfg = MatchConfigSchema.parse({});
    expect(cfg.expansions).toEqual({ exp01: false, exp02: false, exp03: false });
  });
  it('rejects unknown keys (strict)', () => {
    expect(() => MatchConfigSchema.parse({ expansions: {}, foo: 1 } as any)).toThrow();
    expect(() => ExpansionFlagsSchema.parse({ exp99: true } as any)).toThrow();
  });
  it('CORE-only state has no expansion slice', () => {
    const G = buildInitialCoreState(2, 's', { expansions: ExpansionFlagsSchema.parse({}) });
    expect((G as any).exp).toBeUndefined();
  });
  it('expansion slices are module-owned (no pre-create in rules)', () => {
    const G = buildInitialCoreState(2, 's', { expansions: ExpansionFlagsSchema.parse({ exp01: true }) });
    expect((G as any).exp).toBeUndefined();
  });
});