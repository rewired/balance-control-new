import { Client } from 'boardgame.io/client';
import { createResolver, type CoreState } from '@bc/rules';
import { describe, expect, it } from 'vitest';
import { createBCGame } from './factory.js';

type CoreClient = ReturnType<typeof Client<CoreState>>;
const grass = { tileId: 'Grassroots-1', coord: { q: 0, r: 1 } };

function giveMeasure(G: CoreState, expansion: 'exp01' | 'exp03', measureId: string): void {
  const deck = G.exp![expansion]!.measures!;
  const slot = deck.open.indexOf(measureId);
  if (slot >= 0) deck.open[slot] = null;
  else deck.drawPile.splice(deck.drawPile.indexOf(measureId), 1);
  deck.hands['0'].push(measureId);
}

function setupCosts(draw: string[], prepare: (G: CoreState) => void): CoreClient {
  const game = createBCGame({ expansions: { exp01: true, exp02: true, exp03: true }, variants: { tileRecycling: true } });
  const setup = game.setup!;
  game.setup = (context, data) => {
    const G = setup(context, data);
    G.tiles.discardFaceUp = G.tiles.drawPile.filter(id => id !== grass.tileId && !draw.includes(id));
    G.tiles.drawPile = [...draw];
    G.tiles.board.push(grass);
    G.influencesOnBoard = [{ ...G.players['0'].personal.influence.shift()!, tileId: grass.tileId }];
    prepare(G);
    return G;
  };
  return Client({ game, numPlayers: 2 });
}

function convert(client: CoreClient, payment?: unknown): void {
  client.moves.doPoliticalAction({ type: 'convertResources', payload: {
    tileId: grass.tileId, input: 'FOR', output: 'INF', ...(payment === undefined ? {} : { payment }),
  } });
}

describe('Cost interactions through boardgame.io', () => {
  it('waives Climate surcharges before replacing an eligible Regulation unit', () => {
    const client = setupCosts(['Committee-7', 'Committee-8'], G => {
      giveMeasure(G, 'exp01', 'ECO_M10');
      Object.assign(G.players['0'].personal.resources, { ECO: 1, FOR: 3, INF: 1 });
      const zones = G.exp!.exp02!.regulations!;
      zones.attached.push({ id: 'reg-1', kind: 'Administration', tileId: grass.tileId });
      zones.serial = 1;
      for (const sourceCardId of ['CLM_M06', 'CLM_M08', 'CLM_M13']) {
        const result = createResolver()(G, {
          kind: 'registerMeasureEffect',
          instance: { sourceCardId, owner: sourceCardId === 'CLM_M13' ? '0' : '1', playNumber: 1,
            duration: sourceCardId === 'CLM_M13' ? 'untilConsumed' : 'ownerNextTurn' },
        });
        expect(result.ok).toBe(true);
      }
    });
    client.moves.placeTile({ q: 1, r: 0 });
    client.moves.doPoliticalAction({ type: 'exp01_playMeasure', payload: { measureId: 'ECO_M10' } });
    const before = client.getState()!;
    expect(before.ctx.activePlayers).toEqual({ '0': 'AdditionalPoliticalAction' });
    convert(client, { replacement: { costId: 'CLM_M06:1', resource: 'INF' } });
    expect(client.getState()!._stateID).toBe(before._stateID);
    const replacement = { costId: 'reg-1:0', resource: 'INF' };
    convert(client, { replacement, transfers: [{ costId: 'reg-1:0', effectId: 'CLM_M13:1', playerID: '1' }] });
    expect(client.getState()!._stateID).toBe(before._stateID);
    convert(client, { replacement });
    const { G, ctx } = client.getState()!;
    expect(ctx.currentPlayer).toBe('1');
    expect(G.resources.bank).toMatchObject({ FOR: 3, DOM: 0, CLM: 0, INF: 0, ECO: 1 });
    expect(G.players['0'].personal.resources).toMatchObject({ FOR: 0, INF: 1, ECO: 0 });
    expect(G.activeMeasureEffects?.map(instance => instance.id)).toEqual(['CLM_M13:1']);
  });

  it.each([0, 1])('commits the transferred surcharge only when the assigned payer can pay with %i DOM', dom => {
    const client = setupCosts(['Committee-7', 'Committee-8'], G => {
      G.players['0'].personal.resources.FOR = 3;
      G.players['1'].personal.resources.DOM = dom;
      createResolver()(G, { kind: 'registerMeasureEffect', instance: { sourceCardId: 'CLM_M06', owner: '1', playNumber: 1, duration: 'ownerNextTurn' } });
      createResolver()(G, { kind: 'registerMeasureEffect', instance: { sourceCardId: 'CLM_M13', owner: '0', playNumber: 1, duration: 'untilConsumed' } });
    });
    client.moves.placeTile({ q: 1, r: 0 });
    const before = client.getState()!;
    convert(client, { transfers: [{ costId: 'CLM_M06:1', effectId: 'CLM_M13:1', playerID: '1' }] });
    const after = client.getState()!;
    if (dom === 0) {
      expect(after._stateID).toBe(before._stateID);
      expect(after.G).toEqual(before.G);
    } else {
      expect(after.ctx.currentPlayer).toBe('1');
      expect(after.G.players['0'].personal.resources).toMatchObject({ FOR: 0, INF: 1 });
      expect(after.G.players['1'].personal.resources.DOM).toBe(0);
      expect(after.G.resources.bank).toMatchObject({ FOR: 3, DOM: 1 });
      expect(after.G.activeMeasureEffects).toBeUndefined();
    }
  });

  it('uses the mandatory empty slot to consume Budget Deficit without reopening the slot', () => {
    const client = setupCosts(['Committee-7', 'Committee-8', 'Committee-9'], G => {
      giveMeasure(G, 'exp01', 'ECO_M06');
      G.players['0'].personal.resources.ECO = 2;
    });
    client.moves.placeTile({ q: 1, r: 0 });
    client.moves.doPoliticalAction({ type: 'exp01_playMeasure', payload: { measureId: 'ECO_M06', targetPlayerID: '1' } });
    client.moves.doPoliticalAction({ type: 'placeOrMoveInfluence', payload: { markerId: 'INF-0-2', targetTileId: 'Committee-7' } });
    expect(client.getState()!.G.activeMeasureEffects?.[0].id).toBe('ECO_M06:1');
    client.moves.placeTile({ q: 2, r: 0 });
    const { G, ctx } = client.getState()!;
    expect(ctx.turn).toBe(3);
    expect(ctx.currentPlayer).toBe('0');
    expect(G.activeMeasureEffects).toBeUndefined();
    expect(G.players['1'].personal.influence).toHaveLength(4);
    expect(G.resources.bank.ECO).toBe(2);
  });

  it('discards an unaffordable Extreme Weather ResortTile even with recycling', () => {
    const client = setupCosts(['Committee-7', 'DOM-W5-1', 'Committee-8'], G => {
      giveMeasure(G, 'exp03', 'CLM_M12');
      G.players['0'].personal.resources.CLM = 1;
    });
    client.moves.placeTile({ q: 1, r: 0 });
    client.moves.doPoliticalAction({ type: 'exp03_playMeasure', payload: { measureId: 'CLM_M12' } });
    client.moves.doPoliticalAction({ type: 'placeOrMoveInfluence', payload: { markerId: 'INF-0-2', targetTileId: 'Committee-7' } });
    const { G, ctx } = client.getState()!;
    expect(ctx.currentPlayer).toBe('1');
    expect(G.tiles.drawResolution?.tileId).toBe('Committee-8');
    expect(G.tiles.discardFaceUp).toContain('DOM-W5-1');
    expect(G.tiles.drawPile).not.toContain('DOM-W5-1');
    expect(G.resources.bank).toMatchObject({ CLM: 1, DOM: 0 });
  });
});
