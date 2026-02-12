/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach } from 'vitest';
import { createBCGame } from './factory.js';
import { __resetRegisteredExpansionsForTest, registerExpansion, ensureExpansionSlice, createExpansionRegistry } from '@bc/rules';

function makeNoopModule(id: 'exp01'|'exp02'|'exp03') {
  return {
    id,
    registerResources: () => void 0,
    setupExpansionState: () => void 0,
    extendMoves: () => void 0,
  } as any;
}

describe('Task 0021 - Config is source of truth', () => {
  beforeEach(() => { __resetRegisteredExpansionsForTest(); });

  it('disabled config ignores present slice', () => {
    registerExpansion(makeNoopModule('exp01'));
    const Game = createBCGame({ expansions: { exp01: false } });
    const setup = Game.setup as unknown as (ctx: { matchID: string; numPlayers: number; setupData?: unknown }) => any;
    const G = setup({ matchID: 't', numPlayers: 2, setupData: { expansions: { exp01: false } } });
    // simulate ghost slice
    ensureExpansionSlice(G as any, 'exp01', { __ghost: true } as any);
    // registry must still ignore because flags from cfg
    const mods = createExpansionRegistry((G as any).cfg.expansions);
    expect(mods.map((m:any)=>m.id)).toEqual([]);
  });

  it('enabled config requires slice (throws if missing)', () => {
    // do not register module -> no setupExpansionState to create slice
    const Game = createBCGame({ expansions: { exp01: true } });
    const setup = Game.setup as unknown as (ctx: { matchID: string; numPlayers: number; setupData?: unknown }) => any;
    expect(() => setup({ matchID: 't', numPlayers: 2, setupData: { expansions: { exp01: true } } })).toThrowError(/missing for enabled exp01/);
  });
});
