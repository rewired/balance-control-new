import { describe, it, expect, beforeEach } from 'vitest';
import { z } from '@bc/rules';
import { buildMoveCatalog } from '@bc/rules';
import { createExpansionRegistry, registerExpansion, __resetRegisteredExpansionsForTest } from '@bc/rules';
import type { ExpansionModule } from '@bc/rules';

function makeStubExp01(): ExpansionModule {
  return {
    id: 'exp01',
    registerResources: () => void 0,
    setupExpansionState: () => void 0,
    extendMoves: ({ add }) => {
      add({
        type: 'exp01_stub',
        payloadSchema: z.object({ v: z.number().int() }).strict(),
        execute: () => ({ ok: true }),
        enumerate: () => [ { v: 1 } ],
      });
    },
  };
}

const coreTypes = ['convertResources', 'formalizeInfluence', 'placeOrMoveInfluence'];

describe('Move catalog — Task 0016', () => {
  beforeEach(() => {
    __resetRegisteredExpansionsForTest();
  });

  it('core-only catalog contains only core moves', () => {
    const catalog = buildMoveCatalog(createExpansionRegistry(undefined));
    expect(catalog.types).toEqual(coreTypes);
    expect(Object.keys(catalog.schemas).sort()).toEqual(coreTypes);
  });

  it('core + exp01 includes expansion moves when enabled', () => {
    registerExpansion(makeStubExp01());
    const mods = createExpansionRegistry({ exp01: true, exp02: false, exp03: false });
    const catalog = buildMoveCatalog(mods);
    expect(catalog.types).toEqual([...coreTypes, 'exp01_stub'].sort());
  });

  it('disabled expansion moves are absent', () => {
    registerExpansion(makeStubExp01());
    const mods = createExpansionRegistry({ exp01: false, exp02: false, exp03: false });
    const catalog = buildMoveCatalog(mods);
    expect(catalog.types).toEqual(coreTypes);
  });

  it('bot-schema validation fails strictly for illegal payload', () => {
    const catalog = buildMoveCatalog(createExpansionRegistry(undefined));
    const schema = catalog.schemas.placeOrMoveInfluence;
    const payload = { markerId: 'i1', targetTileId: 'C1' };
    expect(() => schema.parse({ ...payload, owner: '1' })).toThrow();
    expect(schema.parse(payload)).toEqual(payload);
  });
});


