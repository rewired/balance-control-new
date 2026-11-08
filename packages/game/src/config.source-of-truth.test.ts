import { describe, it, expect, beforeEach } from 'vitest';
import { InitializeGame } from 'boardgame.io/internal';
import { createBCGame } from './factory.js';
import { __resetRegisteredExpansionsForTest, assertExpansionStateMatchesConfig, registerExpansion, ensureExpansionSlice, createExpansionRegistry, type ExpansionModule } from '@bc/rules';

function makeNoopModule(id: 'exp01'|'exp02'|'exp03'): ExpansionModule {
  return {
    id,
    registerResources: () => void 0,
    setupExpansionState: () => void 0,
    extendMoves: () => void 0,
  };
}

describe('Task 0021 - Config is source of truth', () => {
  beforeEach(() => { __resetRegisteredExpansionsForTest(); });

  it('disabled config ignores hooks and rejects a ghost slice', () => {
    registerExpansion(makeNoopModule('exp01'));
    const game = createBCGame({ expansions: { exp01: false } });
    const G = structuredClone(InitializeGame({ game, numPlayers: 2 }).G);
    // simulate ghost slice
    ensureExpansionSlice(G, 'exp01', { __ghost: true });
    // registry must still ignore because flags from cfg
    const mods = createExpansionRegistry(G.cfg.expansions);
    expect(mods).toEqual([]);
    expect(() => assertExpansionStateMatchesConfig(G)).toThrowError(/present for disabled exp01/);
  });

  it('enabled config requires slice (throws if missing)', () => {
    // do not register module -> no setupExpansionState to create slice
    const game = createBCGame({ expansions: { exp01: true } });
    expect(() => InitializeGame({ game, numPlayers: 2 })).toThrowError(/missing for enabled exp01/);
  });
});
