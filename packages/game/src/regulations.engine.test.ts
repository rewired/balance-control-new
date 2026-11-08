import { Client } from 'boardgame.io/client';
import type { BoardPlacement, CoreState } from '@bc/rules';
import { describe, expect, it } from 'vitest';
import { createBCGame } from './factory.js';

const apparatus = { tileId: 'AuthorityApparatus', coord: { q: 1, r: 0 } };
const grassroots = { tileId: 'Grassroots-1', coord: { q: 1, r: -1 } };

function setupSecurity(board: BoardPlacement[], prepare: (G: CoreState) => void) {
  const game = createBCGame({ expansions: { exp02: true } });
  const setup = game.setup!;
  game.setup = (context, data) => {
    const G = setup(context, data);
    const draw = ['Committee-7', 'Committee-8', 'Committee-9', 'Committee-10'];
    G.tiles.discardFaceUp = G.tiles.drawPile.filter(id => !draw.includes(id) && !board.some(tile => tile.tileId === id));
    G.tiles.drawPile = draw;
    G.tiles.board.push(...board);
    prepare(G);
    return G;
  };
  return Client({ game, numPlayers: 2 });
}

function takeIntoFixtureHand(G: CoreState, card: string): void {
  const deck = G.exp!.exp02!.measures!;
  const slot = deck.open.indexOf(card);
  if (slot >= 0) deck.open[slot] = null;
  else deck.drawPile.splice(deck.drawPile.indexOf(card), 1);
  deck.hands['0'].push(card);
}

function mark(G: CoreState, owner: string, tileId: string): void {
  (G.influencesOnBoard ??= []).push({ ...G.players[owner].personal.influence.shift()!, tileId });
}

describe('Regulation operations through boardgame.io', () => {
  it('combines the placement price with the Measure and pays a SecurityLevel-reduced exchange with zero output', () => {
    const client = setupSecurity([apparatus, grassroots], G => {
      takeIntoFixtureHand(G, 'SEC_M01');
      mark(G, '0', grassroots.tileId);
      Object.assign(G.players['0'].personal.resources, { SEC: 3, INF: 1, DOM: 3 });
    });
    client.moves.placeTile({ q: -1, r: 0 });
    const before = client.getState()!;
    const play = (regulationKind: string) => client.moves.doPoliticalAction({
      type: 'exp02_playMeasure',
      payload: { measureId: 'SEC_M01', regulation: { operation: 'place', regulationKind, tileId: grassroots.tileId } },
    });
    play('Control');
    expect(client.getState()!._stateID).toBe(before._stateID);
    play('SecurityLevel');
    const placed = client.getState()!;
    expect(placed.ctx.activePlayers).toEqual({ '0': 'AdditionalPoliticalAction' });
    expect(placed.G.exp!.exp02!.regulations!.attached).toEqual([{ id: 'reg-1', kind: 'SecurityLevel', tileId: grassroots.tileId }]);
    expect(placed.G.resources.bank).toMatchObject({ SEC: 3, INF: 1 });
    client.moves.doPoliticalAction({
      type: 'convertResources', payload: { tileId: grassroots.tileId, input: 'DOM', output: 'FOR' },
    });
    const after = client.getState()!;
    expect(after.ctx.currentPlayer).toBe('1');
    expect(after.G.resources.bank.DOM).toBe(3);
    expect(after.G.players['0'].personal.resources).toMatchObject({ DOM: 0, FOR: 0, SEC: 0, INF: 0 });
  });

  it('uses Authority Apparatus as its only local context when moving an existing Regulation', () => {
    const client = setupSecurity([apparatus, grassroots], G => {
      mark(G, '0', apparatus.tileId);
      const zones = G.exp!.exp02!.regulations!;
      zones.attached.push(
        { id: 'reg-1', kind: 'Blockade', tileId: grassroots.tileId },
        { id: 'reg-2', kind: 'SecurityLevel', tileId: grassroots.tileId },
      );
      zones.serial = 2;
    });
    client.moves.placeTile({ q: -1, r: 0 });
    client.moves.doPoliticalAction({
      type: 'activateAuthorityApparatus',
      payload: { regulation: { operation: 'move', regulationId: 'reg-2', tileId: 'Committee-7' } },
    });
    const after = client.getState()!;
    expect(after.ctx.currentPlayer).toBe('1');
    expect(after.G.exp!.exp02!.regulations!.attached).toEqual([
      { id: 'reg-1', kind: 'Blockade', tileId: grassroots.tileId },
      { id: 'reg-2', kind: 'SecurityLevel', tileId: 'Committee-7' },
    ]);
  });

  it.each([false, true])('consumes Emergency Decree at enclosure after a payable=%s placement attempt', payable => {
    const hotspot = { tileId: 'Hotspot-1', coord: { q: 1, r: 0 } };
    const board = [
      hotspot,
      { tileId: 'Committee-1', coord: { q: 2, r: -1 } },
      { tileId: 'Committee-2', coord: { q: 1, r: -1 } },
      { tileId: 'Committee-3', coord: { q: 0, r: 1 } },
      { tileId: 'Committee-4', coord: { q: 1, r: 1 } },
    ];
    const client = setupSecurity(board, G => {
      takeIntoFixtureHand(G, 'SEC_M02');
      mark(G, '1', hotspot.tileId);
      G.players['0'].personal.resources.SEC = payable ? 4 : 2;
    });
    client.moves.placeTile({ q: -1, r: 0 });
    client.moves.doPoliticalAction({ type: 'exp02_playMeasure', payload: { measureId: 'SEC_M02', targetTileId: hotspot.tileId } });
    expect(client.getState()!.G.activeMeasureEffects?.[0].sourceCardId).toBe('SEC_M02');
    client.moves.doPoliticalAction({ type: 'placeOrMoveInfluence', payload: { markerId: 'INF-0-1', targetTileId: 'Committee-7' } });
    client.moves.placeTile({ q: 2, r: 0 });

    const { G, ctx } = client.getState()!;
    expect(ctx.activePlayers).toEqual({ '1': 'ExactlyOnePoliticalAction' });
    expect(G.activeMeasureEffects).toBeUndefined();
    expect(G.tiles.board.find(tile => tile.tileId === hotspot.tileId)?.enclosureProcessed).toBe(true);
    expect(G.resources.bank.SEC).toBe(payable ? 4 : 2);
    expect(G.exp!.exp02!.regulations!.attached).toHaveLength(payable ? 1 : 0);
    expect(G.influencesOnBoard!.filter(marker => marker.tileId === hotspot.tileId)).toHaveLength(payable ? 1 : 2);
  });
});
