import type { FnContext, Game, Move } from 'boardgame.io';
import { INVALID_MOVE } from '#boardgame-core';
import type { AxialCoord, CoreState, DecisionContinuation } from '@bc/rules';
import {
  assertExpansionStateMatchesConfig, budgetDeficitIds, buildMoveCatalog,
  createExpansionRegistry, createResolver, HotspotChoiceSchema, PaymentSelectionSchema, politicalMoveOptions, z,
} from '@bc/rules';
import { resolveRoundSettlement } from './production.js';

export const CoreStages = {
  DrawAndPlaceTile: 'DrawAndPlaceTile',
  ResolveHotspot: 'ResolveHotspot',
  ResolveRegulationFollowUp: 'ResolveRegulationFollowUp',
  ExactlyOnePoliticalAction: 'ExactlyOnePoliticalAction',
  AdditionalPoliticalAction: 'AdditionalPoliticalAction',
} as const;

const PoliticalActionSchema = z.object({ type: z.string(), payload: z.unknown() }).strict();

// CORE-01-04-04/-05/-08: place the offered tile at a legal coordinate.
const placeTile: Move<CoreState> = ({ G, ctx, events }, requested: AxialCoord, payment?: unknown) => {
  const drawn = G.exp.core.tiles.drawResolution;
  const coord = drawn?.legalCoords.find(c => c.q === requested?.q && c.r === requested?.r);
  if (!drawn || !coord) return INVALID_MOVE;

  const selected = PaymentSelectionSchema.optional().safeParse(payment);
  if (!selected.success) return INVALID_MOVE;
  const placed = createResolver()(G, { kind: 'placeTile', tileId: drawn.tileId, coord, playerID: ctx.currentPlayer, payment: selected.data });
  if (!placed.ok) return INVALID_MOVE;
  afterEnclosure({ G, ctx, events });
};

// CORE-01-06-04(d), EXP-02-02-G-04 and EXP-03-08-M05-05.
const chooseHotspotOutcome: Move<CoreState> = ({ G, ctx, events, playerID }, action: unknown) => {
  const parsed = HotspotChoiceSchema.safeParse(action);
  if (!parsed.success || playerID == null) return INVALID_MOVE;
  const chosen = createResolver()(G, { kind: 'chooseHotspotOutcome', playerID, choice: parsed.data });
  if (!chosen.ok) return INVALID_MOVE;
  afterEnclosure({ G, ctx, events });
};

// EXP-02-08-M03-03/-04 and EXP-02-08-M05-03/-05.
const chooseRegulationFollowUp: Move<CoreState> = ({ G, ctx, events, playerID }, action: unknown) => {
  const parsed = HotspotChoiceSchema.safeParse(action);
  if (!parsed.success || playerID == null || !G.exp.core.decisionContinuation) return INVALID_MOVE;
  const resolve = createResolver();
  const chosen = resolve(G, { kind: 'chooseRegulationFollowUp', playerID, choice: parsed.data });
  if (!chosen.ok) return INVALID_MOVE;
  const continuation = G.exp.core.decisionContinuation;
  const turn = { G, ctx, events };
  if (suspendForRegulation(turn, continuation)) return;
  resolve(G, { kind: 'recordDecisionContinuation' });
  if (continuation === 'enclosures') afterEnclosure(turn);
  else if (continuation === 'additional') beginPoliticalSlot(turn, true);
  else if (continuation === 'finalSettlement') finishTurn(turn, true);
  else completePoliticalSequence(turn);
};

function finishTurn(turn: TurnContext, final: boolean): void {
  const { G, ctx, events } = turn;
  // CORE-01-07-08/-09: expire turn-bound effects before any regular or final Settlement.
  const resolve = createResolver();
  resolve(G, { kind: 'expireMeasureEffects', boundary: 'turnEnd', playerID: ctx.currentPlayer });
  // CORE-01-07-02/-03 and CORE-01-09-01C: a coinciding final Settlement is the same event.
  if (final || ctx.playOrderPos === ctx.playOrder.length - 1) {
    if (!resolveRoundSettlement(G)) {
      suspendForRegulation(turn, final ? 'finalSettlement' : 'turnEnd');
      return;
    }
  }
  // AGENTS 5.3: record the completed state before the next turn begins.
  resolve(G, { kind: 'recordTurnHash', turn: ctx.turn, playerID: ctx.currentPlayer });
  if (!final) {
    events.endTurn();
    return;
  }
  // CORE-01-09-03/-04: compare real Board markers and share ties.
  const scores = Object.keys(G.exp.core.players).map(playerID => ({
    playerID,
    influence: (G.exp.core.influencesOnBoard ?? []).filter(marker => marker.owner === playerID).length,
  }));
  const highest = Math.max(...scores.map(score => score.influence));
  events.endGame({ winners: scores.filter(score => score.influence === highest).map(score => score.playerID) });
}

type TurnContext = Pick<FnContext<CoreState>, 'G' | 'ctx' | 'events'>;

function suspendForRegulation(turn: TurnContext, continuation: DecisionContinuation): boolean {
  const resolve = createResolver();
  resolve(turn.G, { kind: 'continueRegisteredDecisions' });
  const pending = turn.G.exp.core.pendingRegulationChoices?.[0];
  if (!pending) return false;
  resolve(turn.G, { kind: 'recordDecisionContinuation', continuation });
  turn.events.setActivePlayers({ value: { [pending.playerID]: CoreStages.ResolveRegulationFollowUp } });
  return true;
}

function afterEnclosure(turn: TurnContext): void {
  if (suspendForRegulation(turn, 'enclosures')) return;
  const pending = turn.G.exp.core.pendingHotspot;
  if (pending) {
    // CORE-01-06-03: finish each enclosure choice before the current player's Political Action.
    turn.events.setActivePlayers({ value: { [pending.playerID]: CoreStages.ResolveHotspot } });
  } else {
    beginPoliticalSlot(turn, false);
  }
}

function completePoliticalSequence({ G, ctx, events }: TurnContext): void {
  // CORE-01-09-01A: the last placement keeps its full political action sequence.
  finishTurn({ G, ctx, events }, G.exp.core.tiles.drawPile.length === 0);
}

function beginPoliticalSlot(turn: TurnContext, additional: boolean): void {
  // CORE-01-04-09A..09C: skip an empty slot automatically, after placement or Measure resolution.
  if (politicalMoveOptions(turn.G, turn.ctx.currentPlayer, additional).next().done) {
    createResolver()(turn.G, { kind: 'consumeBudgetDeficits', ids: budgetDeficitIds(turn.G, turn.ctx.currentPlayer) });
    completePoliticalSequence(turn);
    return;
  }
  turn.events.setActivePlayers({ currentPlayer: additional ? CoreStages.AdditionalPoliticalAction : CoreStages.ExactlyOnePoliticalAction });
}

// CORE-01-04-09 and CORE-01-06-00-12: reject invalid input before spending the slot.
const doPoliticalAction: Move<CoreState> = ({ G, ctx, events }, action: unknown) => {
  const input = PoliticalActionSchema.safeParse(action);
  if (!input.success) return INVALID_MOVE;

  const modules = createExpansionRegistry(G.cfg.expansions);
  const catalog = buildMoveCatalog(modules);
  const definition = catalog.definitions[input.data.type];
  if (!definition) return INVALID_MOVE;

  // EXP-01-06-05(c): an additional action cannot be PlayMeasure.
  const additional = ctx.activePlayers?.[ctx.currentPlayer] === CoreStages.AdditionalPoliticalAction;
  if (additional && definition.isPlayMeasure) {
    return INVALID_MOVE;
  }

  const payload = definition.payloadSchema.safeParse(input.data.payload === undefined ? {} : input.data.payload);
  if (!payload.success) return INVALID_MOVE;
  const result = definition.execute(G, ctx.currentPlayer, payload.data);
  if (!result.ok) {
    if (!result.budgetDeficitConsumed) return INVALID_MOVE;
    beginPoliticalSlot({ G, ctx, events }, additional);
    return;
  }

  // EXP-01-06-05(b) and CORE-01-07-08: complete the whole action sequence in this turn.
  if (suspendForRegulation({ G, ctx, events }, definition.isPlayMeasure ? 'additional' : 'turnEnd')) return;
  if (definition.isPlayMeasure) beginPoliticalSlot({ G, ctx, events }, true);
  else completePoliticalSequence({ G, ctx, events });
};

export const CoreTurn: NonNullable<Game<CoreState>['turn']> = {
  // CORE-01-04-01..03: both phases belong to the same engine turn.
  activePlayers: { currentPlayer: CoreStages.DrawAndPlaceTile },
  stages: {
    [CoreStages.DrawAndPlaceTile]: { moves: { placeTile } },
    [CoreStages.ResolveHotspot]: { moves: { chooseHotspotOutcome } },
    [CoreStages.ResolveRegulationFollowUp]: { moves: { chooseRegulationFollowUp } },
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
    if (!G.exp.core.tiles.drawResolution) finishTurn({ G, ctx, events }, true);
  },
};
