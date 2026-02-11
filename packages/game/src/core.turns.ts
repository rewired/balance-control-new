import type { Game } from 'boardgame.io';
import type { CoreState, AxialCoord, Tile } from '@bc/rules';
import { buildMoveCatalog, corePoliticalMoves, createExpansionRegistry, assertExpansionStateMatchesConfig } from '@bc/rules';
import { isFullySurrounded, drawUntilPlaceable, adjacent as hexAdjacent } from '@bc/rules';
import { createResolver } from '@bc/rules';

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
      assertExpansionStateMatchesConfig(G);
      const res = drawUntilPlaceable(G.tiles.drawPile, G.tiles.discardFaceUp, G.tiles.board, hexAdjacent);
      const modules = createExpansionRegistry(G.cfg.expansions);
      const resolve = createResolver(modules);
      resolve(G, {
        kind: 'offerTile',
        drawPile: res.drawPile,
        discardFaceUp: res.discardFaceUp,
        pending: res.drawn ? { tileId: res.drawn, legalCoords: res.legalCoords } : undefined,
      });
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

        // Apply placement via resolver
        const modules = createExpansionRegistry(G.cfg.expansions);
        const resolve = createResolver(modules);
        resolve(G, { kind: 'placeTile', tileId: p.tileId, coord, contextCoord: coord });

        // CORE-01-06-02..03: resolve any Hotspot that becomes fully surrounded immediately
        // Check placed tile if it is a Hotspot
        const placedTile = G.allTiles[p.tileId] as Tile;
        if (placedTile && placedTile.kind === 'Hotspot' && isFullySurrounded(G, coord)) {
          resolve(G, { kind: 'resolveHotspotAt', coord, contextCoord: coord });
        }
        // Check neighbor Hotspots that changed from not surrounded -> surrounded
        for (const h of candidates) {
          if (!h.was && isFullySurrounded(G, h.coord)) {
            resolve(G, { kind: 'resolveHotspotAt', coord: h.coord, contextCoord: h.coord });
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
      doPoliticalAction: ({ G, ctx, events }, action: { type: string; payload: unknown }) => {
        const modules = createExpansionRegistry(G.cfg.expansions);
        const catalog = buildMoveCatalog(corePoliticalMoves(), modules);
        const def = catalog.definitions[action?.type as string];
        if (!def) return;
        const validated = def.payloadSchema.parse(action?.payload ?? {});
        def.execute(G, String((ctx as any)?.currentPlayer ?? (ctx as any)?.playerID ?? '0'), validated as unknown as never);
        const t = (G as any).turn ?? ((G as any).turn = {}); if (t.bannedMoveType && def.type === t.bannedMoveType) { return; } if (t.allowExtraPoliticalAction) { t.allowExtraPoliticalAction = false; } else { t.bannedMoveType = undefined; events?.endTurn?.(); }
      },
    },
    next: Phases.DrawAndPlaceTile,
  },
};