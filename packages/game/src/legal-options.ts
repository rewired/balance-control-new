import type { Ctx, Game, State } from 'boardgame.io';
import { CreateGameReducer } from '#boardgame-internal';
import { createResolver, politicalMoveQuotes, type CoreState, type PaymentQuote } from '@bc/rules';
import { stableHash } from '@bc/shared';
import { CoreStages } from './core.turns.js';

export interface EngineMoveOption extends Omit<PaymentQuote, 'payment'> {
  playerID: string;
  moveType: string;
  parameters: unknown[];
}

export interface LegalMoveOption extends EngineMoveOption {
  resultingStateHashPreview: string;
}

export function engineMoveOptions(G: CoreState, ctx: Ctx, playerID: string): EngineMoveOption[] {
  if (ctx.gameover !== undefined) return [];
  const resolve = createResolver();
  switch (ctx.activePlayers?.[playerID]) {
    case CoreStages.DrawAndPlaceTile: {
      const drawn = G.tiles.drawResolution;
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

export function hashEngineState({ G, ctx }: Pick<State<CoreState>, 'G' | 'ctx'>): string {
  return stableHash({ G, ctx });
}

// AGENTS §4.3: previews include the same engine events as actual play, including automatic slot skips.
export function legalMoveOptions(game: Game<CoreState>, state: State<CoreState>, playerID: string): LegalMoveOption[] {
  const reduce = CreateGameReducer({ game });
  return engineMoveOptions(state.G, state.ctx, playerID).flatMap(option => {
    // boardgame.io can change nested stage counters while advancing a move.
    const snapshot = structuredClone({
      G: state.G, ctx: state.ctx, plugins: state.plugins, _stateID: state._stateID, _undo: [], _redo: [],
    });
    const next = reduce(snapshot, {
      type: 'MAKE_MOVE',
      payload: { type: option.moveType, args: option.parameters, playerID },
    });
    return next._stateID === state._stateID ? [] : [{ ...option, resultingStateHashPreview: hashEngineState(next) }];
  });
}
