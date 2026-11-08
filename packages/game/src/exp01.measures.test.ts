/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect } from 'vitest';
import { Client } from 'boardgame.io/client';
import { createBCGame, setupCoreMatch } from './factory.js';
import { buildMoveCatalog, corePoliticalMoves, createExpansionRegistry, createResolver, type CoreState } from '@bc/rules';

function setupGame(exp01 = true) {
  const G = setupCoreMatch(2, { matchSeed: 't', expansions: { exp01 } });
  return { G };
}

function doAction(G: CoreState, type: string, payload: unknown = {}) {
  const catalog = buildMoveCatalog(corePoliticalMoves(), createExpansionRegistry(G.cfg.expansions));
  const definition = catalog.definitions[type];
  return definition.execute(G, '0', definition.payloadSchema.parse(payload));
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
    m.hands['0'].push(m.recycle.splice(m.recycle.indexOf(id), 1)[0]);
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
      // reset per-round to allow subsequent plays if needed
      resolve(G, { kind: 'resetMeasuresRound', expansion: 'exp01' });
    }
    const beforeOpenLen = (G as any).exp.exp01.measures.open.length;
    const candidate = (G as any).exp.exp01.measures.open[0];
    if (candidate) doAction(G, 'exp01_takeMeasure', { measureId: candidate });

    const afterOpenLen = (G as any).exp.exp01.measures.open.length;
    expect(afterOpenLen).toBeGreaterThanOrEqual(Math.min(3, beforeOpenLen));
  });

  it('holds the same engine turn through a Measure and its additional action', () => {
    const client = Client({ game: createBCGame({ matchSeed: 'measure-turn', expansions: { exp01: true } }), numPlayers: 2 });
    const place = () => client.moves.placeTile(client.getState()!.G.tiles.drawResolution!.legalCoords[0]);
    const measures = () => client.getState()!.G.exp!.exp01!.measures!;
    const take = () => client.moves.doPoliticalAction({ type: 'exp01_takeMeasure', payload: { measureId: measures().open[0] } });
    const play = (measureId: string) => client.moves.doPoliticalAction({ type: 'exp01_playMeasure', payload: { measureId } });
    const firstPlayerTurn = () => {
      const { G } = client.getState()!;
      const targetTileId = G.tiles.drawResolution!.tileId;
      const markerId = G.players['0'].personal.influence[0].id;
      place();
      client.moves.doPoliticalAction({ type: 'placeOrMoveInfluence', payload: { markerId, targetTileId } });
    };

    // Player 1 takes one Measure in each of the first two rounds.
    for (let round = 0; round < 2; round++) {
      firstPlayerTurn();
      place();
      take();
      expect(client.getState()!.ctx.currentPlayer).toBe('0');
    }
    firstPlayerTurn();
    place();
    const before = client.getState()!;
    const [first, second] = measures().hands['1'];

    take(); // Full hand: no card transfer or turn advancement (DD-0018 T09).
    expect(client.getState()!._stateID).toBe(before._stateID);
    expect(measures().hands['1']).toEqual([first, second]);

    play(first);
    const extra = client.getState()!;
    expect(extra.ctx.currentPlayer).toBe('1');
    expect(extra.ctx.turn).toBe(before.ctx.turn);
    expect(extra.ctx.activePlayers).toEqual({ '1': 'AdditionalPoliticalAction' });
    expect(measures().hands['1']).toEqual([second]);
    expect(measures().usedThisRound['1']).toBe(true);

    play(second);
    expect(client.getState()!._stateID).toBe(extra._stateID);
    expect(measures().hands['1']).toEqual([second]);

    take();
    const next = client.getState()!;
    expect(next.ctx.turn).toBe(before.ctx.turn + 1);
    expect(next.ctx.currentPlayer).toBe('0');
    expect(next.ctx.activePlayers).toEqual({ '0': 'DrawAndPlaceTile' });
    expect(measures().hands['1']).toHaveLength(2);
    expect(measures().usedThisRound['1']).toBe(false);
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
