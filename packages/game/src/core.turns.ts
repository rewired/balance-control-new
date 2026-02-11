import type { Game } from 'boardgame.io';
import type { CoreState, AxialCoord, Tile } from '@bc/rules';
import { resolveHotspot, isFullySurrounded, drawUntilPlaceable, adjacent as hexAdjacent } from '@bc/rules';

export const Phases = {
  DrawAndPlaceTile: 'DrawAndPlaceTile',
  ExactlyOnePoliticalAction: 'ExactlyOnePoliticalAction',
} as const;

export type PhaseName = typeof Phases[keyof typeof Phases];

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

export const CorePhases: NonNullable<Game<CoreState>['phases']> = {
  [Phases.DrawAndPlaceTile]: {
    start: true,
    onBegin: ({ G }) => {
      const res = drawUntilPlaceable(G.tiles.drawPile, G.tiles.discardFaceUp, G.tiles.board, hexAdjacent);
      G.tiles.drawPile = res.drawPile;
      G.tiles.discardFaceUp = res.discardFaceUp;
      if (res.drawn) {
        G.turn = { pending: { tileId: res.drawn, legalCoords: res.legalCoords } };
      } else {
        G.turn = { pending: undefined };
      }
    },
    moves: {
      placeTile: ({ G, events }, coord: AxialCoord) => {
        const p = G.turn?.pending;
        if (!p) return;
        if (!p.legalCoords.some((c) => c.q === coord.q && c.r === coord.r)) return;

        // Record neighbor Hotspot enclosure state BEFORE placement
        const candidates = neighborsOf(coord)
          .map((c) => ({ c, placement: G.tiles.board.find((bp) => bp.coord.q === c.q && bp.coord.r === c.r) }))
          .filter((x) => !!x.placement)
          .map((x) => ({
            coord: x.c,
            tile: G.allTiles[x.placement!.tileId] as Tile,
            was: isFullySurrounded(G, x.c),
          }))
          .filter((x) => x.tile && x.tile.kind === 'Hotspot');

        // Apply placement
        G.tiles.board.push({ tileId: p.tileId, coord });
        G.turn = { pending: undefined };

        // CORE-01-06-02..03: resolve any Hotspot that becomes fully surrounded immediately
        // Check placed tile if it is a Hotspot
        const placedTile = G.allTiles[p.tileId] as Tile;
        if (placedTile && placedTile.kind === 'Hotspot' && isFullySurrounded(G, coord)) {
          resolveHotspot(G, coord);
        }
        // Check neighbor Hotspots that changed from not surrounded -> surrounded
        for (const h of candidates) {
          if (!h.was && isFullySurrounded(G, h.coord)) {
            resolveHotspot(G, h.coord);
          }
        }

        events?.endPhase?.(); // proceed to ExactlyOnePoliticalAction
      },
    },
    next: Phases.ExactlyOnePoliticalAction,
  },
  [Phases.ExactlyOnePoliticalAction]: {
    moves: {
      // CORE-01-04-09: Exactly one political action (placeholder noop)
      chooseNoop: ({ events }) => {
        events?.endTurn?.();
      },
    },
    next: Phases.DrawAndPlaceTile,
  },
};