import type { Ctx, FnContext, Game, Move } from 'boardgame.io';
import { INVALID_MOVE } from 'boardgame.io/core';
import type { AxialCoord, CoreState } from '@bc/rules';
import {
  assertExpansionStateMatchesConfig, buildMoveCatalog, corePoliticalMoves,
  createExpansionRegistry, createResolver, PaymentSelectionSchema, politicalMoveOptions, resolveRoundSettlement, z,
} from '@bc/rules';

export const CoreStages = {
  DrawAndPlaceTile: 'DrawAndPlaceTile',
  ExactlyOnePoliticalAction: 'ExactlyOnePoliticalAction',
  AdditionalPoliticalAction: 'AdditionalPoliticalAction',
} as const;

const PoliticalActionSchema = z.object({ type: z.string(), payload: z.unknown() }).strict();

// CORE-01-04-04/-05/-08: place the offered tile at a legal coordinate.
const placeTile: Move<CoreState> = ({ G, ctx, events }, requested: AxialCoord, payment?: unknown) => {
  const drawn = G.tiles.drawResolution;
  const coord = drawn?.legalCoords.find(c => c.q === requested?.q && c.r === requested?.r);
  if (!drawn || !coord) return INVALID_MOVE;

  const selected = PaymentSelectionSchema.optional().safeParse(payment);
  if (!selected.success) return INVALID_MOVE;
  const placed = createResolver()(G, { kind: 'placeTile', tileId: drawn.tileId, coord, playerID: ctx.currentPlayer, payment: selected.data });
  if (!placed.ok) return INVALID_MOVE;
  beginPoliticalSlot({ G, ctx, events }, false);
};

function settleAndRecordTurn(G: CoreState, ctx: Ctx, settle: boolean): void {
  // CORE-01-07-08/-09: expire turn-bound effects before any regular or final Settlement.
  const resolve = createResolver();
  resolve(G, { kind: 'expireMeasureEffects', boundary: 'turnEnd', playerID: ctx.currentPlayer });
  if (settle) resolveRoundSettlement(G);
  // AGENTS 5.3: record the completed state before the next turn begins.
  resolve(G, { kind: 'recordTurnHash', turn: ctx.turn, playerID: ctx.currentPlayer });
}

function finishMatch({ G, ctx, events }: Pick<FnContext<CoreState>, 'G' | 'ctx' | 'events'>): void {
  // CORE-01-09-01C and CORE-01-09-02: settle exactly once, then score the Board.
  settleAndRecordTurn(G, ctx, true);
  // CORE-01-09-03/-04: compare real Board markers and share ties.
  const scores = Object.keys(G.players).map(playerID => ({
    playerID,
    influence: (G.influencesOnBoard ?? []).filter(marker => marker.owner === playerID).length,
  }));
  const highest = Math.max(...scores.map(score => score.influence));
  events.endGame({ winners: scores.filter(score => score.influence === highest).map(score => score.playerID) });
}

type TurnContext = Pick<FnContext<CoreState>, 'G' | 'ctx' | 'events'>;

function completePoliticalSequence({ G, ctx, events }: TurnContext): void {
  // CORE-01-09-01A: the last placement keeps its full political action sequence.
  if (G.tiles.drawPile.length === 0) finishMatch({ G, ctx, events });
  else events.endTurn();
}

function budgetDeficits(G: CoreState, playerID: string): string[] {
  return G.activeMeasureEffects?.filter(instance => instance.sourceCardId === 'ECO_M06' && instance.targetPlayerID === playerID)
    .map(instance => instance.id) ?? [];
}

function beginPoliticalSlot(turn: TurnContext, additional: boolean): void {
  // CORE-01-04-09A..09C: skip an empty slot automatically, after placement or Measure resolution.
  if (politicalMoveOptions(turn.G, turn.ctx.currentPlayer, additional).next().done) {
    createResolver()(turn.G, { kind: 'consumeBudgetDeficits', ids: budgetDeficits(turn.G, turn.ctx.currentPlayer) });
    completePoliticalSequence(turn);
    return;
  }
  turn.events.setStage(additional ? CoreStages.AdditionalPoliticalAction : CoreStages.ExactlyOnePoliticalAction);
}

// CORE-01-04-09 and CORE-01-06-00-12: reject invalid input before spending the slot.
const doPoliticalAction: Move<CoreState> = ({ G, ctx, events }, action: unknown) => {
  const input = PoliticalActionSchema.safeParse(action);
  if (!input.success) return INVALID_MOVE;

  const modules = createExpansionRegistry(G.cfg.expansions);
  const catalog = buildMoveCatalog(corePoliticalMoves(), modules);
  const definition = catalog.definitions[input.data.type];
  if (!definition) return INVALID_MOVE;

  // EXP-01-06-05(c): an additional action cannot be PlayMeasure.
  if (ctx.activePlayers?.[ctx.currentPlayer] === CoreStages.AdditionalPoliticalAction && definition.isPlayMeasure) {
    return INVALID_MOVE;
  }

  const payload = definition.payloadSchema.safeParse(input.data.payload === undefined ? {} : input.data.payload);
  if (!payload.success) return INVALID_MOVE;
  const deficits = budgetDeficits(G, ctx.currentPlayer);
  if (!definition.execute(G, ctx.currentPlayer, payload.data).ok) return INVALID_MOVE;
  createResolver()(G, { kind: 'consumeBudgetDeficits', ids: deficits });

  // EXP-01-06-05(b) and CORE-01-07-08: complete the whole action sequence in this turn.
  if (definition.isPlayMeasure) beginPoliticalSlot({ G, ctx, events }, true);
  else completePoliticalSequence({ G, ctx, events });
};

export const CoreTurn: NonNullable<Game<CoreState>['turn']> = {
  // CORE-01-04-01..03: both phases belong to the same engine turn.
  activePlayers: { currentPlayer: CoreStages.DrawAndPlaceTile },
  stages: {
    [CoreStages.DrawAndPlaceTile]: { moves: { placeTile } },
    [CoreStages.ExactlyOnePoliticalAction]: { moves: { doPoliticalAction } },
    [CoreStages.AdditionalPoliticalAction]: { moves: { doPoliticalAction } },
  },
  onBegin: ({ G, ctx, events }) => {
    assertExpansionStateMatchesConfig(G);
    const resolve = createResolver();

    const nextRound = ctx.turn > 1 && ctx.playOrderPos === 0;
    // CORE-01-07-12/-14/-17: apply duration boundaries at the beginning of the actual turn.
    resolve(G, { kind: 'expireMeasureEffects', boundary: 'turnStart', playerID: ctx.currentPlayer, nextRound });

    // CORE-01-07-17 and EXP-01-07-07: reset usage at the start of the next round.
    if (nextRound) {
      resolve(G, { kind: 'resetMeasuresRound' });
    }

    // CORE-01-04-04/-06/-07: resolve the draw sequence before offering placement.
    const draw = resolve(G, { kind: 'drawTile', playerID: ctx.currentPlayer, turn: ctx.turn });
    if (!draw.ok) throw new Error(`Draw failed: ${draw.reason}`);
    // CORE-01-09-01B and VAR-01-01-08: an exhausted draw omits political action.
    if (!G.tiles.drawResolution) finishMatch({ G, ctx, events });
  },
  onEnd: ({ G, ctx }) => {
    // CORE-01-07-02/-03: settle once when the last player completes the round.
    settleAndRecordTurn(G, ctx, ctx.playOrderPos === ctx.playOrder.length - 1);
  },
};
