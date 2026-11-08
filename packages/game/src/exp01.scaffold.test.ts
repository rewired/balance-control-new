import { Client } from 'boardgame.io/client';
import { InitializeGame } from 'boardgame.io/internal';
import { describe, it, expect } from 'vitest';
import { createBCGame } from './factory.js';
import { buildMoveCatalog, createExpansionRegistry } from '@bc/rules';

describe('EXP-01 scaffold - Task 0022', () => {
  it('CORE-only: no ECO, no exp01 slice, no exp01 moves', () => {
    const { G } = InitializeGame({ game: createBCGame(), numPlayers: 2 });
    expect(G.exp?.exp01).toBeUndefined();
    expect(G.exp.core.resources.bank.ECO).toBeUndefined();
    const catalog = buildMoveCatalog(createExpansionRegistry(G.cfg.expansions));
    expect(catalog.types.some(type => type.startsWith('exp01_'))).toBe(false);
  });

  it('CORE + EXP-01: ECO and Measure actions are available', () => {
    const client = Client({ game: createBCGame({ expansions: { exp01: true } }), numPlayers: 2 });
    const { G } = client.getState()!;
    expect(G.exp?.exp01).toBeDefined();
    expect(G.exp.core.resources.bank.ECO).toBeDefined();
    const catalog = buildMoveCatalog(createExpansionRegistry(G.cfg.expansions));
    expect(catalog.types).toContain('exp01_takeMeasure');
    const measureId = G.exp!.exp01!.measures!.open[0];

    client.moves.placeTile(G.exp.core.tiles.drawResolution!.legalCoords[0]);
    client.moves.doPoliticalAction({ type: 'exp01_takeMeasure', payload: { measureId } });
    expect(client.getState()!.G.exp?.exp01?.measures?.hands['0']).toEqual([measureId]);
  });

  it('rejects unknown payload keys without spending the political action', () => {
    const client = Client({ game: createBCGame({ expansions: { exp01: true } }), numPlayers: 2 });
    client.moves.placeTile(client.getState()!.G.exp.core.tiles.drawResolution!.legalCoords[0]);
    const before = client.getState()!;
    const measureId = before.G.exp!.exp01!.measures!.open[0];
    client.moves.doPoliticalAction({ type: 'exp01_takeMeasure', payload: { measureId, extra: 1 } });
    const after = client.getState()!;
    expect(after._stateID).toBe(before._stateID);
    expect(after.ctx).toEqual(before.ctx);
    expect(after.G).toEqual(before.G);
  });
});
