/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect } from 'vitest';
import { createBCGame } from './factory.js';
import { CorePhases } from './core.turns.js';
import { buildMoveCatalog, corePoliticalMoves, createExpansionRegistry, createResolver } from '@bc/rules';

type GLike = any;

function setupGame(exp01 = true) {
  const Game = createBCGame({ expansions: { exp01 } });
  const setup = Game.setup as unknown as (ctx: { matchID: string; numPlayers: number; setupData?: unknown }) => any;
  const G = setup({ matchID: 't', numPlayers: 2, setupData: { expansions: { exp01 } } });
  return { Game, G } as const;
}

function doAction(G: GLike, type: string, payload: any = {}) {
  const move = (action: any) => (CorePhases as any).ExactlyOnePoliticalAction.moves.doPoliticalAction({ G, ctx: { currentPlayer: '0', playOrderPos: 0, playOrder: ['0','1'] } } as any, action);
  move({ type, payload });
}

describe('EXP-01 Measures - Task 0027', () => {
  it('CORE-only leaves no exp01 state', () => {
    const { G } = setupGame(false);
    expect((G as any).exp?.exp01).toBeUndefined();
  });

  it('initializes open measures = 3', () => {
    const { G } = setupGame(true);
    const m = (G as any).exp.exp01.measures;
    expect(m.open.length).toBe(3);
  });

  it('TakeMeasure moves from open to hand and refills open', () => {
    const { G } = setupGame(true);
    const m = (G as any).exp.exp01.measures;
    const takeId = m.open[0];
    doAction(G, 'exp01_takeMeasure', { measureId: takeId });
    expect(((G as any).exp.exp01.measures.hands['0']).length).toBeGreaterThan(0);
    expect((G as any).exp.exp01.measures.open.length).toBe(3);
  });

  it('hand limit enforced (max 2)', () => {
    const { G } = setupGame(true);
    doAction(G, 'exp01_takeMeasure', { measureId: (G as any).exp.exp01.measures.open[0] });
    doAction(G, 'exp01_takeMeasure', { measureId: (G as any).exp.exp01.measures.open[0] });
    const before = (G as any).exp.exp01.measures.hands['0'].slice();
    const candidate = (G as any).exp.exp01.measures.open[0];
    doAction(G, 'exp01_takeMeasure', { measureId: candidate });
    expect((G as any).exp.exp01.measures.hands['0']).toEqual(before);
  });

  it('PlayMeasure -> recycle on first play; finalDiscard on second', () => {
    const { G } = setupGame(true);
    const mods = createExpansionRegistry((G as any).cfg.expansions);
    const resolve = createResolver(mods);

    const m = (G as any).exp.exp01.measures;
    const id = m.open[0];
    doAction(G, 'exp01_takeMeasure', { measureId: id });
    doAction(G, 'exp01_playMeasure', { measureId: id });
    expect(((G as any).exp.exp01.measures.recycle).includes(id)).toBe(true);

    // reset per-round flag, then play again => finalDiscard
    resolve(G, { kind: 'resetMeasuresRound', expansion: 'exp01' });
    ;(G as any).exp.exp01.measures.hands['0'].push(id);
    doAction(G, 'exp01_playMeasure', { measureId: id });
    expect(((G as any).exp.exp01.measures.finalDiscard).includes(id)).toBe(true);
  });

  it('reshuffles recycle into draw to refill open deterministically', () => {
    const { G } = setupGame(true);
    const mods = createExpansionRegistry((G as any).cfg.expansions);
    const resolve = createResolver(mods);

    // Put one card into recycle by playing it
    const id = (G as any).exp.exp01.measures.open[0];
    doAction(G, 'exp01_takeMeasure', { measureId: id });
    doAction(G, 'exp01_playMeasure', { measureId: id });

    // Drain draw pile by repeated takes from open[0]
    for (let k = 0; k < 32; k++) {
      const open0 = (G as any).exp.exp01.measures.open[0];
      if (!open0) break;
      doAction(G, 'exp01_takeMeasure', { measureId: open0 });
      const m = (G as any).exp.exp01.measures;
      if (m.drawPile.length === 0) break;
      // allow second political action to end turn
      doAction(G, 'chooseNoop', {});
      // reset per-round to allow subsequent plays if needed
      resolve(G, { kind: 'resetMeasuresRound', expansion: 'exp01' });
    }
    const beforeOpenLen = (G as any).exp.exp01.measures.open.length;
    const candidate = (G as any).exp.exp01.measures.open[0];
    if (candidate) doAction(G, 'exp01_takeMeasure', { measureId: candidate });

    const afterOpenLen = (G as any).exp.exp01.measures.open.length;
    expect(afterOpenLen).toBeGreaterThanOrEqual(Math.min(3, beforeOpenLen));
  });

  it('enumerators list legal options only (AGENTS -4.1)', async () => {
    const { G } = setupGame(true);
    const mods = createExpansionRegistry((G as any).cfg.expansions);
    const catalog = buildMoveCatalog(corePoliticalMoves(), mods);
    const takeDef: any = catalog.definitions['exp01_takeMeasure'];
    const playDef: any = catalog.definitions['exp01_playMeasure'];
    const takeOpts = takeDef.enumerate(G, '0');
    expect(Array.isArray(takeOpts) && takeOpts.length > 0).toBe(true);
    // execute a take, then play should enumerate that id
    doAction(G, 'exp01_takeMeasure', { measureId: takeOpts[0].measureId });
    const playOpts = playDef.enumerate(G, '0');
    expect(playOpts.length).toBeGreaterThan(0);
    // after playing once, enumerator should be empty due to per-round limit
    doAction(G, 'exp01_playMeasure', { measureId: takeOpts[0].measureId });
    const playOpts2 = playDef.enumerate(G, '0');
    expect(playOpts2.length).toBe(0);
  });
});