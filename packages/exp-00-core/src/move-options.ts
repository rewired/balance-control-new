import type { Ctx } from 'boardgame.io';
import { createResolver, politicalMoveQuotes, type CoreState, type PaymentQuote } from '@bc/rules';
import { CoreStages } from './turn.js';

export interface EngineMoveOption extends Omit<PaymentQuote, 'payment'> {
  playerID: string;
  moveType: string;
  parameters: unknown[];
}

export function engineMoveOptions(G: CoreState, ctx: Ctx, playerID: string): EngineMoveOption[] {
  if (ctx.gameover !== undefined) return [];
  const resolve = createResolver();
  switch (ctx.activePlayers?.[playerID]) {
    case CoreStages.DrawAndPlaceTile: {
      const drawn = G.exp.core.tiles.drawResolution;
      if (!drawn) return [];
      return drawn.legalCoords.flatMap(coord => resolve.actionQuotes(G, {
        kind: 'placeTile', tileId: drawn.tileId, coord, playerID,
      }).map(({ payment, ...quote }) => ({
        ...quote, playerID, moveType: 'placeTile', parameters: payment ? [coord, payment] : [coord],
      })));
    }
    case CoreStages.ResolveHotspot:
      return resolve.hotspotQuotes(G).map(({ choice, ...quote }) => ({
        ...quote, playerID, moveType: 'chooseHotspotOutcome', parameters: [choice],
      }));
    case CoreStages.ResolveRegulationFollowUp:
      return resolve.regulationFollowUpQuotes(G).map(({ choice, ...quote }) => ({
        ...quote, playerID, moveType: 'chooseRegulationFollowUp', parameters: [choice],
      }));
    case CoreStages.ChooseDisplacement: {
      // CORE-01-04-32: only the marker owner receives the legal response destinations.
      const pending = G.exp.core.pendingDisplacement;
      if (pending?.owner !== playerID) return [];
      return pending.destinationTileIds.map(tileId => ({
        playerID, moveType: 'chooseDisplacement', parameters: [tileId], contextTile: tileId, costBreakdown: [],
      }));
    }
    case CoreStages.ExactlyOnePoliticalAction:
    case CoreStages.AdditionalPoliticalAction:
      return Array.from(politicalMoveQuotes(G, playerID, ctx.activePlayers[playerID] === CoreStages.AdditionalPoliticalAction),
        ({ type, payload, ...quote }) => ({
          ...quote, playerID, moveType: 'doPoliticalAction', parameters: [{ type, payload }],
        }));
    default:
      return [];
  }
}
