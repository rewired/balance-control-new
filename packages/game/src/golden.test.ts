import { Client } from 'boardgame.io/client';
import { describe, it, expect } from 'vitest';
import { createBCGame } from './factory.js';

describe('Golden replay — 0006', () => {
  it('has the expected SHA-256 after ten fixed engine turns', () => {
    const client = Client({ game: createBCGame({ matchSeed: 'golden-0006' }), numPlayers: 2 });
    for (let q = 1; q <= 10; q++) {
      const { G, ctx } = client.getState()!;
      const markerId = `INF-${ctx.currentPlayer}-${q > 8 ? 1 : Math.ceil(q / 2)}`;
      const sourceTileId = G.exp.core.influencesOnBoard?.find(marker => marker.id === markerId)?.tileId;
      const targetTileId = G.exp.core.tiles.drawResolution!.tileId;
      client.moves.placeTile({ q, r: 0 });
      client.moves.doPoliticalAction({ type: 'placeOrMoveInfluence', payload: { markerId, sourceTileId, targetTileId } });
    }
    const { G, ctx } = client.getState()!;
    expect(ctx.turn).toBe(11);
    expect(G.exp.core.influencesOnBoard).toHaveLength(8);
    expect(G.exp.core.resources.noise).toEqual({ DOM: 4, FOR: 0, INF: 0 }); // CORE-01-07-04A
    expect(G.lastTurnHash).toBe('58c3cf0fc6b589cc9fb18a7c201935acf5444fa7ce2f70ecccd6a78e4381b479');
  });
});
