import { describe, it, expect, beforeEach } from 'vitest';
import { z } from 'zod';
import { buildMoveCatalog, corePoliticalMoves } from './moves.js';
import { createExpansionRegistry, registerExpansion, __resetRegisteredExpansionsForTest } from './expansion-registry.js';
import type { ExpansionModule } from './expansion-registry.js';

function makeStubExp01(): ExpansionModule {
  return {
    id: 'exp01',
    registerResources: () => void 0,
    setupExpansionState: () => void 0,
    extendMoves: ({ add }) => {
      add({
        type: 'exp01_stub',
        payloadSchema: z.object({ v: z.number().int() }).strict(),
        execute: (_G, _payload) => { void _G; void _payload; },
        enumerate: () => [ { v: 1 } ],
      });
    },
  };
}

describe('Move catalog — Task 0016', () => {
  beforeEach(() => {
    __resetRegisteredExpansionsForTest();
  });

  it('core-only catalog contains only core moves', () => {
    const catalog = buildMoveCatalog(corePoliticalMoves(), []);
    expect(catalog.types).toEqual(['chooseNoop']);
    expect(Object.keys(catalog.schemas)).toEqual(['chooseNoop']);
  });

  it('core + exp01 includes expansion moves when enabled', () => {
    registerExpansion(makeStubExp01());
    const mods = createExpansionRegistry({ exp01: true, exp02: false, exp03: false });
    const catalog = buildMoveCatalog(corePoliticalMoves(), mods);
    expect(catalog.types).toEqual(['chooseNoop','exp01_stub']);
  });

  it('disabled expansion moves are absent', () => {
    registerExpansion(makeStubExp01());
    const mods = createExpansionRegistry({ exp01: false, exp02: false, exp03: false });
    const catalog = buildMoveCatalog(corePoliticalMoves(), mods);
    expect(catalog.types).toEqual(['chooseNoop']);
  });

  it('bot-schema validation fails strictly for illegal payload', () => {
    const catalog = buildMoveCatalog(corePoliticalMoves(), []);
    const schema = catalog.schemas['chooseNoop'];
    expect(() => schema.parse({ any: 'thing' })).toThrow();
    expect(() => schema.parse({})).not.toThrow();
  });
});


