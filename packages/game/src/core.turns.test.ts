import { Client } from 'boardgame.io/client';
import { describe, expect, it } from 'vitest';
import { stableHash } from '@bc/shared';
import { createBCGame } from './factory.js';

function replayTwoRounds() {
  const game = createBCGame({ matchSeed: 'task-0030-turns' });
  const setup = game.setup!;
  game.setup = (context, data) => {
    const G = setup(context, data);
    const tileId = 'DOM-W1-1';
    G.exp.core.tiles.drawPile = G.exp.core.tiles.drawPile.filter(id => id !== tileId && id !== 'Committee-1');
    G.exp.core.tiles.board.push({ tileId, coord: { q: 0, r: 1 } }, { tileId: 'Committee-1', coord: { q: -1, r: 0 } });
    const marker = G.exp.core.players['0'].personal.influence.pop()!;
    G.exp.core.influencesOnBoard = [{ ...marker, tileId }];
    return G;
  };
  const client = Client({ game, numPlayers: 2 });
  const hashes: string[] = [];

  for (const [index, coord] of [{ q: 1, r: 0 }, { q: 2, r: 0 }, { q: 3, r: 0 }, { q: 4, r: 0 }].entries()) {
    const player = String(index % 2);
    const before = client.getState()!;
    expect(before.ctx.turn).toBe(index + 1);
    expect(before.ctx.currentPlayer).toBe(player);
    expect(before.ctx.activePlayers).toEqual({ [player]: 'DrawAndPlaceTile' });
    const offered = before.G.exp.core.tiles.drawResolution!.tileId;

    client.moves.placeTile(coord);
    const placed = client.getState()!;
    expect(placed.ctx.turn).toBe(before.ctx.turn);
    expect(placed.ctx.currentPlayer).toBe(player);
    expect(placed.ctx.activePlayers).toEqual({ [player]: 'ExactlyOnePoliticalAction' });
    expect(placed.G.exp.core.tiles.board).toHaveLength(before.G.exp.core.tiles.board.length + 1);
    expect(placed.G.exp.core.tiles.board).toContainEqual({ tileId: offered, coord });
    expect(placed.G.exp.core.tiles.drawResolution).toBeNull();
    expect(placed.G.exp.core.players['0'].personal.resources.DOM).toBe(Math.floor(index / 2));

    const markerId = placed.G.exp.core.players[player].personal.influence[0].id;
    client.moves.doPoliticalAction({ type: 'placeOrMoveInfluence', payload: { markerId, targetTileId: 'Committee-1' } });
    const after = client.getState()!;
    const nextPlayer = String((index + 1) % 2);
    expect(after.ctx.turn).toBe(before.ctx.turn + 1);
    expect(after.ctx.currentPlayer).toBe(nextPlayer);
    expect(after.ctx.activePlayers).toEqual({ [nextPlayer]: 'DrawAndPlaceTile' });
    expect(after.G.exp.core.tiles.drawResolution?.tileId).toBe(before.G.exp.core.tiles.drawPile[0]);
    expect(after.G.exp.core.players['0'].personal.resources.DOM).toBe(Math.floor((index + 1) / 2));
    expect(after.G.lastTurnHash).toMatch(/^[0-9a-f]{64}$/);
    expect(after.G.lastTurnHash).not.toBe(before.G.lastTurnHash);
    hashes.push(after.G.lastTurnHash!);
  }

  return hashes;
}

describe('CORE turn lifecycle through boardgame.io', () => {
  it('keeps the same player through placement and action, settles once per round and replays deterministically', () => {
    expect(replayTwoRounds()).toEqual(replayTwoRounds());
  });

  it('T19: hashes the placed game state identically before and after JSON persistence', () => {
    const client = Client({ game: createBCGame(), numPlayers: 2 });
    client.moves.placeTile({ q: 1, r: 0 });
    const placed = client.getState()!.G;
    expect(placed.exp.core.tiles.drawResolution).toBeNull();
    expect(placed.lastTurnHash).toBeUndefined();

    const restored = JSON.parse(JSON.stringify(placed));
    expect(restored.exp.core.tiles.drawResolution).toBeNull();
    expect(stableHash(placed)).toBe(stableHash(restored));
    expect(stableHash({ ...placed, lastTurnHash: undefined })).toBe(stableHash(restored));
  });
});
