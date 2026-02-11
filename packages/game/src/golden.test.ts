import { describe, it, expect } from 'vitest';
import { buildInitialCoreState, drawUntilPlaceable, adjacent as hexAdjacent, isFullySurrounded, resolveRoundSettlement, createResolver } from '@bc/rules';
import type { CoreState, Tile, AxialCoord } from '@bc/rules';
import { stableHash } from '@bc/shared';

function neighborsOf(c: AxialCoord): AxialCoord[] {
  return [
    { q: c.q + 1, r: c.r + 0 },
    { q: c.q + 1, r: c.r - 1 },
    { q: c.q + 0, r: c.r - 1 },
    { q: c.q - 1, r: c.r + 0 },
    { q: c.q - 1, r: c.r + 1 },
    { q: c.q + 0, r: c.r + 1 },
  ];
}

describe('Golden replay — 0006', () => {
  it('stable final hash for fixed seed + action list', () => {
    const G: CoreState = buildInitialCoreState(2, 'golden-0006');
    let pos = 0; const N = 10; // 10 placements across 5 full rounds
    for (let step = 0; step < N; step++) {
      const res = drawUntilPlaceable(G.tiles.drawPile, G.tiles.discardFaceUp, G.tiles.board, hexAdjacent);
      G.tiles.drawPile = res.drawPile; G.tiles.discardFaceUp = res.discardFaceUp;
      if (!res.drawn) break;
      const legal = res.legalCoords.slice().sort((a,b)=> a.q===b.q ? a.r-b.r : a.q-b.q);
      const coord = legal[0];
      const tileId = res.drawn;

      // neighbor hotspots before
      const candidates = neighborsOf(coord)
        .map((c) => ({ c, placement: G.tiles.board.find((bp) => bp.coord.q === c.q && bp.coord.r === c.r) }))
        .filter((x) => !!x.placement)
        .map((x) => ({ c: x.c, tile: G.allTiles[x.placement!.tileId] as Tile, was: isFullySurrounded(G, x.c) }))
        .filter((x) => x.tile && x.tile.kind === 'Hotspot');

      // place
      G.tiles.board.push({ tileId, coord });

      const placed = G.allTiles[tileId] as Tile;
      if (placed && placed.kind === 'Hotspot' && isFullySurrounded(G, coord)) (createResolver([])(G, { kind: 'resolveHotspotAt', coord, contextCoord: coord }));
      for (const h of candidates) if (!h.was && isFullySurrounded(G, h.c)) (createResolver([])(G, { kind: 'resolveHotspotAt', coord: h.c, contextCoord: h.c }));

      // political noop -> end turn
      if (pos === 1) resolveRoundSettlement(G); // end of round after player 1 in 2-player game
      pos = (pos + 1) % 2;
    }

    const hash = stableHash(G);
    // Replace EXPECTED with the first observed value to lock determinism
    const EXPECTED = '0354c350b76c354d8b6403672ae55e0d768c5315eaeb49fdcd4bed4e15c8b534';
    expect(hash).toBe(EXPECTED);
  });
});