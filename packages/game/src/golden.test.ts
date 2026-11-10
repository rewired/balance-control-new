import { Client } from 'boardgame.io/client';
import { describe, it, expect } from 'vitest';
import { createBCGame } from './factory.js';

describe('Golden replay — 0006', () => {
  it.each([
    {
      rules: 'recorded', relocatedMarker: 1, payment: [], noise: { DOM: 4, FOR: 0, INF: 0 },
      hash: '215bbe406d1db3aada6f83694c5fdc99975e28f2b0d1a035061d75fcd70f67ea',
    },
    {
      rules: 'current', relocatedMarker: 4, payment: ['FOR', 'DOM'], noise: { DOM: 3, FOR: 3, INF: 0 },
      hash: '55b48a088bd19f89732552d2e7038a0c5b49ce12cc73031fd2bd88cce2d10743',
    },
  ] as const)('has the expected SHA-256 after ten fixed engine turns with $rules rules', ({ rules, relocatedMarker, payment, noise, hash }) => {
    const game = createBCGame({ matchSeed: 'golden-0006', variants: { resourceCap: true, influenceRecall: true } }, rules);
    const client = Client({ game, numPlayers: 2 });
    for (let q = 1; q <= 10; q++) {
      const { G, ctx } = client.getState()!;
      const markerId = `INF-${ctx.currentPlayer}-${q > 8 ? relocatedMarker : Math.ceil(q / 2)}`;
      const sourceTileId = G.exp.core.influencesOnBoard?.find(marker => marker.id === markerId)?.tileId;
      const targetTileId = G.exp.core.tiles.drawResolution!.tileId;
      const resource = q > 8 ? payment[q - 9] : undefined;
      client.moves.placeTile({ q, r: 0 });
      client.moves.doPoliticalAction({
        type: 'placeOrMoveInfluence',
        payload: { markerId, sourceTileId, targetTileId, ...(resource && { resources: [resource] }) },
      });
    }
    const { G, ctx } = client.getState()!;
    expect(ctx.turn).toBe(11);
    expect(G.exp.core.influencesOnBoard).toHaveLength(8);
    expect(G.exp.core.resources.noise).toEqual(noise); // CORE-01-07-04A
    expect(G.lastTurnHash).toBe(hash);
  });
});
