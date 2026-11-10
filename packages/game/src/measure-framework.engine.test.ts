import { Client } from 'boardgame.io/client';
import {
  __resetRegisteredExpansionsForTest, politicalMoveOptions, registerExpansion,
  type CoreState, type ExpansionId,
} from '@bc/rules';
import { beforeEach, describe, expect, it } from 'vitest';
import { createBCGame } from './factory.js';

type CoreClient = ReturnType<typeof Client<CoreState>>;

function registerDeck(id: ExpansionId, cards: string[]): void {
  registerExpansion({ id, registerResources: () => {}, setupExpansionState: () => {}, measureDeck: () => cards });
}

function act(client: CoreClient, expansion: ExpansionId, action: 'takeMeasure' | 'playMeasure', measureId: string) {
  client.moves.doPoliticalAction({ type: `${expansion}_${action}`, payload: { measureId } });
}

function place(client: CoreClient): string {
  const offer = client.getState()!.G.exp.core.tiles.drawResolution!;
  client.moves.placeTile(offer.legalCoords[0]);
  return offer.tileId;
}

function mark(client: CoreClient, targetTileId: string): void {
  const { G, ctx } = client.getState()!;
  const markerId = G.exp.core.players[ctx.currentPlayer].personal.influence[0].id;
  client.moves.doPoliticalAction({ type: 'placeOrMoveInfluence', payload: { markerId, targetTileId } });
}

describe('Shared Measure lifecycle through boardgame.io', () => {
  beforeEach(() => __resetRegisteredExpansionsForTest());

  it('T10: refills only the vacated middle slot in its own deck', () => {
    registerDeck('exp02', ['SEC-1', 'SEC-2', 'SEC-3', 'SEC-4']);
    registerDeck('exp03', ['CLM-1', 'CLM-2', 'CLM-3', 'CLM-4']);
    const client = Client({ game: createBCGame({ expansions: { exp02: true, exp03: true } }), numPlayers: 2 });
    const { G } = client.getState()!;
    const { open, drawPile } = G.exp!.exp02!.measures!;
    expect(G.exp?.exp01).toBeUndefined();
    expect(G.exp.core.playedMeasureThisRound).toEqual({ '0': false, '1': false });
    expect(Object.values(G.exp!.exp02!.measures!.playCounts)).toEqual([0, 0, 0, 0]);

    place(client);
    act(client, 'exp02', 'takeMeasure', open[1]!);
    const { G: after, ctx } = client.getState()!;
    expect(after.exp!.exp02!.measures!.open).toEqual([open[0], drawPile[0], open[2]]);
    expect(after.exp!.exp02!.measures!.hands['0']).toEqual([open[1]]);
    expect(after.exp!.exp03).toEqual(G.exp!.exp03);
    expect(ctx.activePlayers).toEqual({ '0': 'ExactlyOnePoliticalAction' });
    expect([...politicalMoveOptions(after, '0')].some(move => move.type.endsWith('_takeMeasure'))).toBe(false);
    const revision = client.getState()!._stateID;
    act(client, 'exp03', 'takeMeasure', after.exp.exp03!.measures!.open[0]!);
    expect(client.getState()!._stateID).toBe(revision);
  });

  it('refills an exhausted market from the played card before opening the additional slot', () => {
    registerDeck('exp02', ['SEC-1']);
    const game = createBCGame({ expansions: { exp02: true } });
    const setup = game.setup!;
    game.setup = (context, data) => {
      const G = setup(context, data);
      const deck = G.exp!.exp02!.measures!;
      deck.hands['0'].push(deck.open[0]!);
      deck.open[0] = null;
      return G;
    };
    const client = Client({ game, numPlayers: 2 });
    place(client);
    act(client, 'exp02', 'playMeasure', 'SEC-1');
    const extra = client.getState()!;
    const deck = extra.G.exp!.exp02!.measures!;
    expect(extra.ctx.activePlayers).toEqual({ '0': 'AdditionalPoliticalAction' });
    expect(deck.open).toEqual(['SEC-1', null, null]);
    expect(deck.drawPile).toEqual([]);
    expect(deck.recycle).toEqual([]);
    expect(deck.playCounts).toEqual({ 'SEC-1': 1 });
    expect(deck.cycle).toBe(1);
    expect(extra.G.exp.core.playedMeasureThisRound!['0']).toBe(true);

    act(client, 'exp02', 'takeMeasure', 'SEC-1');
    expect(client.getState()!.G.exp!.exp02!.measures!.hands['0']).toEqual(['SEC-1']);
    expect(client.getState()!.G.exp!.exp02!.measures!.open).toEqual([null, null, null]);
  });

  it('applies hand and PlayMeasure limits across all decks and resets usage on the next round', () => {
    registerDeck('exp01', ['ECO-1']);
    registerDeck('exp02', ['SEC-1']);
    registerDeck('exp03', ['CLM-1']);
    const client = Client({ game: createBCGame({ expansions: { exp01: true, exp02: true, exp03: true } }), numPlayers: 2 });
    const opening = place(client);
    act(client, 'exp01', 'takeMeasure', 'ECO-1');
    mark(client, opening);
    mark(client, place(client));
    place(client);
    act(client, 'exp02', 'takeMeasure', 'SEC-1');
    mark(client, place(client));
    place(client);

    const before = client.getState()!;
    act(client, 'exp03', 'takeMeasure', 'CLM-1');
    expect(client.getState()!._stateID).toBe(before._stateID);
    expect([...politicalMoveOptions(before.G, '0')].some(move => move.type === 'exp03_takeMeasure')).toBe(false);

    act(client, 'exp01', 'playMeasure', 'ECO-1');
    const extra = client.getState()!;
    expect(extra.ctx.activePlayers).toEqual({ '0': 'AdditionalPoliticalAction' });
    expect(extra.G.exp.core.playedMeasureThisRound!['0']).toBe(true);
    expect([...politicalMoveOptions(extra.G, '0')].some(move => move.type === 'exp02_playMeasure')).toBe(false);
    act(client, 'exp02', 'playMeasure', 'SEC-1');
    expect(client.getState()!._stateID).toBe(extra._stateID);

    act(client, 'exp03', 'takeMeasure', 'CLM-1');
    expect(client.getState()!.G.exp.core.playedMeasureThisRound!['0']).toBe(true);
    mark(client, place(client));
    expect(client.getState()!.G.exp.core.playedMeasureThisRound!['0']).toBe(false);
    place(client);
    act(client, 'exp02', 'playMeasure', 'SEC-1');
    expect(client.getState()!.G.exp!.exp02!.measures!.playCounts['SEC-1']).toBe(1);
  });
});
