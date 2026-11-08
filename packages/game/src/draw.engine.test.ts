import { Client } from 'boardgame.io/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { __resetRegisteredExpansionsForTest, ensureExpansionSlice, registerExpansion } from '@bc/rules';
import * as topology from '../../rules/src/topology/index.js';
import { createBCGame } from './factory.js';

function gameWithDrawPile(ids: string[], config: unknown = {}, withControlledResort = false) {
  const game = createBCGame(config);
  const setup = game.setup!;
  game.setup = (context, data) => {
    const G = setup(context, data);
    if (withControlledResort) {
      const tileId = 'DOM-W1-1';
      G.exp.core.tiles.board.push({ tileId, coord: { q: 0, r: 1 } });
      const marker = G.exp.core.players['0'].personal.influence.pop()!;
      G.exp.core.influencesOnBoard = [{ ...marker, tileId }];
    }
    G.exp.core.tiles.discardFaceUp = G.exp.core.tiles.drawPile.filter(id => !ids.includes(id) && !G.exp.core.tiles.board.some(p => p.tileId === id));
    G.exp.core.tiles.drawPile = ids.slice();
    return G;
  };
  return game;
}

function registerPlacementCost() {
  registerExpansion({
    id: 'exp01',
    registerResources: () => {},
    setupExpansionState: G => { ensureExpansionSlice(G, 'exp01', {}); },
    hooks: {
      costIncreases: ({ G, effect }) => {
        if (effect.kind !== 'placeTile' || effect.tileId !== 'Committee-1') return;
        expect(G.exp.core.tiles.drawResolution?.tileId).toBe(effect.tileId);
        expect(G.exp.core.tiles.drawPile).not.toContain(effect.tileId);
        return { DOM: 1 };
      },
    },
  });
}

describe('DrawResolution through boardgame.io', () => {
  beforeEach(() => __resetRegisteredExpansionsForTest());
  afterEach(() => vi.restoreAllMocks());

  it('offers orthogonal neighbors and transfers the drawn tile into Board on placement', () => {
    const client = Client({ game: createBCGame({ topology: 'orthogonal' }), numPlayers: 2 });
    const start = client.getState()!;
    const drawn = start.G.exp.core.tiles.drawResolution!;
    expect(drawn.legalCoords).toHaveLength(4);
    expect(start.G.exp.core.tiles.drawPile).not.toContain(drawn.tileId);
    expect(start.G.exp.core.tiles.discardFaceUp).not.toContain(drawn.tileId);

    client.moves.placeTile({ q: 1, r: -1 });
    expect(client.getState()!._stateID).toBe(start._stateID);

    client.moves.placeTile({ q: 1, r: 0 });
    const placed = client.getState()!;
    expect(placed.G.exp.core.tiles.drawResolution).toBeNull();
    expect(placed.G.exp.core.tiles.board).toContainEqual({ tileId: drawn.tileId, coord: { q: 1, r: 0 } });
    expect(placed.ctx.activePlayers).toEqual({ '0': 'ExactlyOnePoliticalAction' });
  });

  it('encloses a Hotspot using the same orthogonal attachment as placement', () => {
    const game = gameWithDrawPile(['Committee-1'], { topology: 'orthogonal' });
    const setup = game.setup!;
    game.setup = (context, data) => {
      const G = setup(context, data);
      const placed = [
        { tileId: 'Hotspot-1', coord: { q: 1, r: 0 } },
        { tileId: 'Committee-2', coord: { q: 2, r: 0 } },
        { tileId: 'Committee-3', coord: { q: 1, r: -1 } },
      ];
      G.exp.core.tiles.discardFaceUp = G.exp.core.tiles.discardFaceUp.filter(id => !placed.some(tile => tile.tileId === id));
      G.exp.core.tiles.board.push(...placed);
      const marker = G.exp.core.players['0'].personal.influence.pop()!;
      G.exp.core.influencesOnBoard = [{ ...marker, tileId: 'Hotspot-1' }];
      return G;
    };
    const client = Client({ game, numPlayers: 2 });
    const supply = client.getState()!.G.exp.core.players['0'].personal.influence;
    const payout = supply[supply.length - 1];
    client.moves.placeTile({ q: 1, r: 1 });
    expect(client.getState()!.G.exp.core.tiles.board.find(tile => tile.tileId === 'Hotspot-1')?.enclosureProcessed).toBe(true);
    expect(client.getState()!.G.exp.core.influencesOnBoard).toHaveLength(2);
    expect(client.getState()!.G.exp.core.influencesOnBoard).toContainEqual({ ...payout, tileId: 'Hotspot-1' });
    expect(client.getState()!.G.exp.core.players['0'].personal.influence).not.toContainEqual(payout);
  });

  it('discards an unaffordable tile and redraws in the same turn even with recycling', () => {
    registerPlacementCost();
    const game = gameWithDrawPile(['Committee-1', 'Grassroots-1'], { expansions: { exp01: true }, variants: { tileRecycling: true } });
    const client = Client({ game, numPlayers: 2 });
    const { G, ctx } = client.getState()!;
    expect(G.exp.core.tiles.discardFaceUp).toContain('Committee-1');
    expect(G.exp.core.tiles.drawResolution?.tileId).toBe('Grassroots-1');
    expect(G.exp.core.tiles.drawPile).toEqual([]);
    expect(G.exp.core.resources.bank.DOM).toBe(0);
    expect(ctx.turn).toBe(1);
    expect(ctx.gameover).toBeUndefined();
  });

  it('charges placement only when the drawn tile is transferred to the Board', () => {
    registerPlacementCost();
    const game = gameWithDrawPile(['Committee-1'], { expansions: { exp01: true } });
    const setup = game.setup!;
    game.setup = (context, data) => {
      const G = setup(context, data);
      G.exp.core.players['0'].personal.resources.DOM = 1;
      return G;
    };
    const client = Client({ game, numPlayers: 2 });
    expect(client.getState()!.G.exp.core.players['0'].personal.resources.DOM).toBe(1);
    expect(client.getState()!.G.exp.core.resources.bank.DOM).toBe(0);

    client.moves.placeTile({ q: 1, r: 0 });
    const { G } = client.getState()!;
    expect(G.exp.core.tiles.drawResolution).toBeNull();
    expect(G.exp.core.players['0'].personal.resources.DOM).toBe(0);
    expect(G.exp.core.resources.bank.DOM).toBe(1);
    expect(G.exp.core.tiles.board).toContainEqual({ tileId: 'Committee-1', coord: { q: 1, r: 0 } });
  });

  it.each([false, true])('ends an unplaceable draw once with tileRecycling=%s', (tileRecycling) => {
    // Isolated positions exercise the no-geometry path with the normal Board and engine hooks.
    vi.spyOn(topology, 'getTopology').mockReturnValue({ adjacent: () => false, neighbors: () => [] });
    const ids = ['Committee-1', 'Committee-2', 'Committee-3'];
    const run = () => Client({ game: gameWithDrawPile(ids, { matchSeed: 'recycle', variants: { tileRecycling } }, true), numPlayers: 2 }).getState()!;
    const { G, ctx } = run();

    expect(G.exp.core.tiles.drawResolution).toBeNull();
    expect(ctx.gameover).toEqual({ winners: ['0'] });
    expect(ctx.turn).toBe(1);
    expect(G.exp.core.players['0'].personal.resources.DOM).toBe(1);
    expect(G.lastTurnHash).toMatch(/^[0-9a-f]{64}$/);
    if (tileRecycling) {
      expect(G.exp.core.tiles.drawPile.slice().sort()).toEqual(ids);
      expect(G.exp.core.tiles.drawPile).toEqual(run().G.exp.core.tiles.drawPile);
      for (const id of ids) expect(G.exp.core.tiles.discardFaceUp).not.toContain(id);
    } else {
      expect(G.exp.core.tiles.drawPile).toEqual([]);
      expect(G.exp.core.tiles.discardFaceUp.slice(-ids.length)).toEqual(ids);
    }
  });

  it('completes the last placed tile and its action before a single final settlement', () => {
    const game = gameWithDrawPile(['Committee-1', 'Committee-2'], {}, true);
    const client = Client({ game, numPlayers: 2 });
    client.moves.placeTile({ q: 1, r: 0 });
    client.moves.doPoliticalAction({ type: 'placeOrMoveInfluence', payload: { markerId: 'INF-0-1', targetTileId: 'Committee-1' } });

    const drawn = client.getState()!;
    expect(drawn.G.exp.core.tiles.drawPile).toEqual([]);
    expect(drawn.G.exp.core.tiles.drawResolution?.tileId).toBe('Committee-2');
    expect(drawn.ctx.gameover).toBeUndefined();
    client.moves.placeTile({ q: 2, r: 0 });
    expect(client.getState()!.ctx.gameover).toBeUndefined();
    client.moves.doPoliticalAction({ type: 'placeOrMoveInfluence', payload: { markerId: 'INF-1-1', targetTileId: 'Committee-2' } });

    const final = client.getState()!;
    expect(final.ctx.gameover).toEqual({ winners: ['0'] });
    expect(final.ctx.turn).toBe(2);
    expect(final.G.exp.core.players['0'].personal.resources.DOM).toBe(1);
    expect(final.G.exp.core.tiles.drawResolution).toBeNull();
  });
});
