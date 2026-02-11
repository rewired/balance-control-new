/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect } from 'vitest';
import { createBCGame, CoreGame } from './factory.js';
import { buildMoveCatalog, corePoliticalMoves, createExpansionRegistry } from '@bc/rules';

const setupWith = (game: any, numPlayers: number, setupData?: unknown) => {
  const fn = game.setup as unknown as (ctx: { matchID: string; numPlayers: number; setupData?: unknown }) => any;
  return fn({ matchID: 't', numPlayers, setupData });
};

describe('Game factory — Task 0018', () => {
  it('CORE-only: no modules, no exp slice, catalog only core', () => {
    const G = setupWith(CoreGame, 2);
    expect((G as any).exp).toBeUndefined();
    const mods = createExpansionRegistry({ exp01: false, exp02: false, exp03: false });
    expect(mods.map(m => m.id)).toEqual([]);
    const catalog = buildMoveCatalog(corePoliticalMoves(), mods);
    expect(catalog.types).toEqual(['chooseNoop']);
  });

  it('CORE + exp01: module present and setupExpansionState executed', () => {
    const Game = createBCGame({ expansions: { exp01: true } });
    const G = setupWith(Game, 2);
    expect((G as any).exp?.exp01).toBeDefined();
    // sentinel set by stub module
    expect((G as any).exp?.exp01?.__boot).toBe(true);
    const mods = createExpansionRegistry({ exp01: true, exp02: false, exp03: false });
    expect(mods.map(m => m.id)).toEqual(['exp01']);
  });
});