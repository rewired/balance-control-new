/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect } from 'vitest';
import { createBCGame } from './factory.js';
import { buildMoveCatalog, corePoliticalMoves, createExpansionRegistry } from '@bc/rules';

describe('EXP-01 scaffold - Task 0022', () => {
  it('CORE-only: no ECO, no exp01 slice, no exp01 moves', () => {
    const Game = createBCGame({ expansions: { exp01: false } });
    const setup = Game.setup as unknown as (ctx: { matchID: string; numPlayers: number; setupData?: unknown }) => any;
    const G = setup({ matchID: 't', numPlayers: 2, setupData: { expansions: { exp01: false } } });
    expect((G as any).exp?.exp01).toBeUndefined();
    expect((G as any).resources.bank.ECO).toBeUndefined();
    const mods = createExpansionRegistry((G as any).cfg.expansions);
    const catalog = buildMoveCatalog(corePoliticalMoves(), mods);
    expect(catalog.types.includes('exp01_noop')).toBe(false);
  });

  it('CORE + EXP-01: ECO exists, exp01 slice exists, stub move present and runs', async () => {
    const Game = createBCGame({ expansions: { exp01: true } });
    const setup = Game.setup as unknown as (ctx: { matchID: string; numPlayers: number; setupData?: unknown }) => any;
    const G = setup({ matchID: 't', numPlayers: 2, setupData: { expansions: { exp01: true } } });
    expect((G as any).exp?.exp01).toBeDefined();
    expect((G as any).resources.bank.ECO).toBeDefined();

    const mods = createExpansionRegistry((G as any).cfg.expansions);
    const catalog = buildMoveCatalog(corePoliticalMoves(), mods);
    expect(catalog.types.includes('exp01_noop')).toBe(true);

    // run via political action pathway
    const { CorePhases } = await import('./core.turns.js');
    const move = (action: any) => (CorePhases as any).ExactlyOnePoliticalAction.moves.doPoliticalAction({ G, ctx: { playOrderPos: 0, playOrder: ['0','1'] } } as any, action);
    const before = ((G as any).exp.exp01.sentinel === true);
    move({ type: 'exp01_noop', payload: {} });
    const after = ((G as any).exp.exp01.sentinel === true);
    expect(after).toBe(!before);
  });

  it('EXP-01 move schema is strict (rejects unknown keys)', async () => {
    const Game = createBCGame({ expansions: { exp01: true } });
    const setup = Game.setup as unknown as (ctx: { matchID: string; numPlayers: number; setupData?: unknown }) => any;
    const G = setup({ matchID: 't', numPlayers: 2, setupData: { expansions: { exp01: true } } });
    const { CorePhases } = await import('./core.turns.js');
    const move = (action: any) => (CorePhases as any).ExactlyOnePoliticalAction.moves.doPoliticalAction({ G, ctx: { playOrderPos: 0, playOrder: ['0','1'] } } as any, action);
    expect(() => move({ type: 'exp01_noop', payload: { extra: 1 } })).toThrow();
  });
});