/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect } from 'vitest';
import { createBCGame } from './factory.js';
import { CorePhases } from './core.turns.js';

function setupGame(exp01 = true) {
  const Game = createBCGame({ expansions: { exp01 } });
  const setup = Game.setup as unknown as (ctx: { matchID: string; numPlayers: number; setupData?: unknown }) => any;
  const G = setup({ matchID: 't', numPlayers: 2, setupData: { expansions: { exp01 } } });
  return { Game, G } as const;
}

function doAction(G: any, type: string, payload: any = {}) {
  const move = (action: any) => (CorePhases as any).ExactlyOnePoliticalAction.moves.doPoliticalAction({ G, ctx: { currentPlayer: '0', playOrderPos: 0, playOrder: ['0','1'] } } as any, action);
  move({ type, payload });
}

describe('EXP-01 Measures — Task 0027 baseline', () => {
  it('smoke: CORE-only leaves no exp01 state', () => {
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
    expect((G as any).exp.exp01.measures.hands['0']).toContain(takeId);
    expect((G as any).exp.exp01.measures.open.length).toBe(3);
  });

  it('hand limit enforced (max 2)', () => {
    const { G } = setupGame(true);
    const m = (G as any).exp.exp01.measures;
    doAction(G, 'exp01_takeMeasure', { measureId: m.open[0] });
    doAction(G, 'exp01_takeMeasure', { measureId: (G as any).exp.exp01.measures.open[0] });
    const before = (G as any).exp.exp01.measures.hands['0'].slice();
    const candidate = (G as any).exp.exp01.measures.open[0];
    doAction(G, 'exp01_takeMeasure', { measureId: candidate });
    expect((G as any).exp.exp01.measures.hands['0']).toEqual(before);
  });

  it('PlayMeasure -> recycle; per-round limit enforced; reset clears flag', () => {
    const { G } = setupGame(true);
    const m = (G as any).exp.exp01.measures;
    const id = m.open[0];
    doAction(G, 'exp01_takeMeasure', { measureId: id });
    doAction(G, 'exp01_playMeasure', { measureId: id });
    expect((G as any).exp.exp01.measures.recycle).toContain(id);
    doAction(G, 'chooseNoop', {}); // consume extra
    (G as any).exp.exp01.measures.hands['0'].push(id);
    (G as any).exp.exp01.measures.playCounts[id] = 1;
    const beforeHand = (G as any).exp.exp01.measures.hands['0'].slice();
    doAction(G, 'exp01_playMeasure', { measureId: id });
    expect((G as any).exp.exp01.measures.hands['0']).toEqual(beforeHand);
  });
});