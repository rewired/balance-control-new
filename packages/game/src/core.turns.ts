import type { Game } from 'boardgame.io';
import type { CoreState, AxialCoord } from '@bc/rules';\nimport { isFullySurrounded, resolveHotspot, resolveRoundSettlement } from '@bc/rules';
import { drawUntilPlaceable, adjacent as hexAdjacent } from '@bc/rules';\nimport { isFullySurrounded, resolveHotspot, resolveRoundSettlement } from '@bc/rules';

export const Phases = {
  DrawAndPlaceTile: 'DrawAndPlaceTile',
  ExactlyOnePoliticalAction: 'ExactlyOnePoliticalAction',
} as const;

export type PhaseName = typeof Phases[keyof typeof Phases];

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
        G.tiles.board.push({ tileId: p.tileId, coord });
        G.turn = { pending: undefined };
        events?.endPhase?.();
      },
    },
    next: Phases.ExactlyOnePoliticalAction,
  },
  [Phases.ExactlyOnePoliticalAction]: {
    moves: {
      chooseNoop: ({ events }) => {
      // CORE-01-04-09: Exactly one political action (placeholder noop)
      events?.endTurn?.();
    },
    },
    next: Phases.DrawAndPlaceTile,
  },
};




