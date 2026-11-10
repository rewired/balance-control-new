import type { Ctx, Game } from 'boardgame.io';
import { CoreStages, influenceLimit } from '@bc/exp-00-core';
import { computeMajority, getTopology, type AxialCoord, type CoreState, type PaymentSelection, type RegulationOperation } from '@bc/rules';
import { inspectExpansions } from './computer-expansions.js';
import type { ComputerPosition, ComputerStyle } from './computer-position.js';
import { engineMoveOptions, previewEngineOptions, type EngineMoveOption, type EngineSnapshot } from './legal-options.js';

const TURN_HORIZON = 3;
const ACTION_HORIZON = 8;
const REPLY_WIDTH = 2;

interface PositionValue {
  winners?: string[];
  turn: number;
  influence: Record<string, number>;
  reserves: Record<string, number>;
  economy: Record<string, number>;
}

interface Continuation {
  preferred: PositionValue;
  alternative?: PositionValue;
}

function reserveScores(G: CoreState, ctx: Ctx): Record<string, number> {
  const { tiles, players, pendingHotspot, decisionContinuation } = G.exp.core;
  const stage = ctx.activePlayers?.[ctx.currentPlayer];
  // CORE-01-06-03 and CORE-01-09-01A: the current turn can still have a political action on the last tile.
  const currentSlot = stage === CoreStages.DrawAndPlaceTile || stage === CoreStages.ExactlyOnePoliticalAction
    || stage === CoreStages.AdditionalPoliticalAction || pendingHotspot !== undefined
    || decisionContinuation === 'enclosures' || decisionContinuation === 'additional';
  const seats = ctx.playOrder.length;
  return Object.fromEntries(ctx.playOrder.map((id, index) => {
    // CORE-01-04-04/-06/-07 and CORE-01-09-01: each future turn uses at least one tile.
    // Count one opportunity per own turn at most. The reducer handles actual draws and extra placements.
    const distance = (index - ctx.playOrderPos + seats - 1) % seats + 1;
    const futureTurns = Math.floor((tiles.drawPile.length + seats - distance) / seats);
    const opportunities = futureTurns + Number(index === ctx.playOrderPos && currentSlot);
    const usable = ctx.gameover ? 0 : Math.min(players[id].personal.influence.length, opportunities);
    let score = 0;
    for (let marker = 1; marker <= usable; marker++) score += 45 / marker;
    return [id, score];
  }));
}

function evaluate({ G, ctx }: EngineSnapshot): PositionValue {
  const { allTiles, influencesOnBoard, players, tiles } = G.exp.core;
  // Heuristic only: value real markers first, then future influence and economic position.
  const influence = Object.fromEntries(Object.keys(players).map(id => [id, 0]));
  const economy = Object.fromEntries(Object.values(players).map(({ id, personal }) => [id,
    Object.values(personal.resources).reduce((sum, amount) => sum + amount, 0),
  ]));
  for (const { owner } of influencesOnBoard ?? []) influence[owner] += 100;
  const expansions = inspectExpansions(G);
  if (expansions) expansions.score(economy);
  else {
    for (const { tileId, coord } of tiles.board) {
      const tile = allTiles[tileId];
      if (tile.kind !== 'ResortTile') continue;
      const controller = computeMajority(G, coord);
      if (controller !== null) economy[controller] += 3 * tile.w;
    }
  }
  // CORE-01-09-00 and CORE-01-09-03/-04: use the engine result for a finished game.
  const result = ctx.gameover as { winners: string[] } | undefined;
  return { winners: result?.winners, turn: ctx.turn, influence, reserves: reserveScores(G, ctx), economy };
}

function outcomeRank({ winners }: PositionValue, playerID: string): number {
  if (!winners) return 0;
  return winners.includes(playerID) ? 1 / winners.length : -1;
}

function margin({ influence, reserves, economy }: PositionValue, playerID: string, style: ComputerStyle): number {
  const score = (id: string) => influence[id] + style.reserveWeight * reserves[id] + style.economyWeight * economy[id];
  return score(playerID) - Math.max(...Object.keys(influence).filter(id => id !== playerID).map(score));
}

function compare(left: PositionValue, right: PositionValue, playerID: string, style: ComputerStyle): number {
  const outcome = outcomeRank(left, playerID);
  // Between losing lines, prefer the one that keeps the game alive longer.
  return outcome - outcomeRank(right, playerID) || (outcome === -1 ? left.turn - right.turn : 0)
    || margin(left, playerID, style) - margin(right, playerID, style);
}

function valueWithImmediateEffects(later: PositionValue, immediate: PositionValue, weight: number): PositionValue {
  const blend = (key: 'influence' | 'reserves' | 'economy') => Object.fromEntries(Object.entries(later[key])
    .map(([id, score]) => [id, score + (immediate[key][id] - score) * weight]));
  return { ...later, influence: blend('influence'), reserves: blend('reserves'), economy: blend('economy') };
}

function rateContinuation({ preferred, alternative = preferred }: Continuation, immediate: PositionValue, playerID: string,
  style: ComputerStyle) {
  // The expected value weights the opponent's second choice by one third.
  // A cautious seat shifts weight from that estimate to its own worst case.
  const alternativeWeight = style.riskTolerance / 3
    + (compare(alternative, preferred, playerID, style) < 0 ? 1 - style.riskTolerance : 0);
  const weighReplies = (first: number, second: number) => first + (second - first) * alternativeWeight;
  const outcome = weighReplies(outcomeRank(preferred, playerID), outcomeRank(alternative, playerID));
  // An immediate advantage can expire before the horizon. Blend only the positional scores.
  const position = (later: PositionValue) => margin(valueWithImmediateEffects(later, immediate, style.impulsivity), playerID, style);
  const preferredPosition = position(preferred);
  return {
    outcome,
    survival: outcome === -1 ? weighReplies(preferred.turn, alternative.turn) : 0,
    position: preferred === alternative ? preferredPosition : weighReplies(preferredPosition, position(alternative)),
  };
}

function actionType(option: EngineMoveOption): string {
  return option.moveType === 'doPoliticalAction' ? (option.parameters[0] as { type: string }).type : option.moveType;
}

function uniqueMarkerOptions(G: CoreState, playerID: string, options: EngineMoveOption[]): EngineMoveOption[] {
  const { players, influencesOnBoard } = G.exp.core;
  const startingMarkers = new Set([...players[playerID].personal.influence, ...influencesOnBoard ?? []]
    .filter(marker => marker.starting).map(marker => marker.id));
  const seen = new Set<string>();
  return options.filter(option => {
    if (actionType(option) !== 'placeOrMoveInfluence') return true;
    const { payload } = option.parameters[0] as {
      payload: { markerId: string; sourceTileId?: string; targetTileId: string; resources?: string[]; payment?: PaymentSelection };
    };
    // Keep different routes and payments, and distinguish starting markers for formalization timing.
    const key = JSON.stringify([
      payload.sourceTileId, payload.targetTileId, startingMarkers.has(payload.markerId), payload.resources, payload.payment,
    ]);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function shortlist(options: EngineMoveOption[], budget: number, compactness: (option: EngineMoveOption) => number): EngineMoveOption[] {
  if (options.length <= budget) return options;
  const indices = new Set(Array.from({ length: budget }, (_, i) => Math.floor(i * (options.length - 1) / (budget - 1))));
  if (options[0].moveType === 'placeTile') {
    // Include compact placements where an enclosure can matter, as well as a spread of other coordinates.
    const compact = options.map((option, index) => ({ index, neighbors: compactness(option) }))
      .sort((a, b) => b.neighbors - a.neighbors);
    for (const { index } of compact.slice(0, Math.ceil(budget / 2))) indices.add(index);
    return options.filter((_, index) => indices.has(index));
  }
  const types = new Set<string>();
  // Keep a candidate of each action type, even if most options are variations of another action.
  return options.filter((option, index) => {
    const type = actionType(option);
    const firstOfType = !types.has(type);
    types.add(type);
    return firstOfType || indices.has(index);
  });
}

function actingPlayer(ctx: Ctx): string {
  return Object.keys(ctx.activePlayers ?? {})[0] ?? ctx.currentPlayer;
}

function compactness(G: CoreState) {
  const { adjacent } = getTopology(G.cfg.topology);
  return (option: EngineMoveOption) => G.exp.core.tiles.board
    .filter(tile => adjacent(tile.coord, option.parameters[0] as AxialCoord)).length;
}

export function sampleComputerOptions({ G, ctx }: ComputerPosition, playerID: string, budget: number): EngineMoveOption[] {
  const legal = engineMoveOptions(G, ctx, playerID);
  if (!legal.length) return [];
  const options = uniqueMarkerOptions(G, playerID, legal);
  const sampled = shortlist(options, budget, compactness(G));
  if (!G.cfg.variants.measureRegulationAccess || options.length <= budget || options[0].moveType === 'placeTile') return sampled;
  const preferred = inspectExpansions(G)?.preferred(options, playerID, Math.ceil(budget / 4)) ?? [];
  return [...new Set([...sampled, ...preferred])];
}

function nextPlayerRecalls({ G, ctx }: EngineSnapshot, options: EngineMoveOption[]) {
  const opponent = ctx.playOrder[(ctx.playOrderPos + 1) % ctx.playOrder.length];
  const { players, influencesOnBoard } = G.exp.core;
  if (!players[opponent].personal.influence.length) return [];
  const targets = new Set(influencesOnBoard?.filter(marker => marker.owner === opponent).map(marker => marker.id));
  // CORE-01-09-00 and CORE-01-04-11: the next player can win by placing a reserve marker.
  if (targets.size !== influenceLimit(G) - 1) return [];
  // CORE-01-04-24/-25: keep one legal payment per opposing marker for the tactical preview.
  return options.filter(option => actionType(option) === 'recallInfluence'
    && targets.delete((option.parameters[0] as { payload: { markerId: string } }).payload.markerId));
}

function rankedOptions(game: Game<CoreState>, state: EngineSnapshot, playerID: string, style: ComputerStyle, budget: number,
  defendNextTurn = false) {
  const legal = engineMoveOptions(state.G, state.ctx, playerID);
  if (!legal.length) return [];
  const options = uniqueMarkerOptions(state.G, playerID, legal);
  const countNeighbors = compactness(state.G);
  const sampled = shortlist(options, budget, countNeighbors);
  const preferred = options.length > budget && options[0].moveType !== 'placeTile'
    ? inspectExpansions(state.G)?.preferred(options, playerID, Math.ceil(budget / 4)) ?? []
    : [];
  const defensive = new Set(defendNextTurn ? nextPlayerRecalls(state, options) : []);
  const candidates = new Set([...sampled, ...preferred, ...defensive]);
  const ranked = Array.from(previewEngineOptions(game, state, candidates), ({ option, next }) => {
    const neighbors = option.moveType === 'placeTile' ? countNeighbors(option) : 0;
    return { option, next, value: evaluate(next), neighbors, defensive: defensive.has(option) };
  });
  return ranked.sort((a, b) => compare(b.value, a.value, playerID, style) || b.neighbors - a.neighbors);
}

type Variation = ReturnType<typeof rankedOptions>[number];

function playsMeasure(line: Variation): boolean {
  return actionType(line.option).endsWith('_playMeasure');
}

function distinctLines(ranked: Variation[], width: number, expanded: boolean): Variation[] {
  const seen = new Set<string>();
  const lines: Variation[] = [];
  for (const line of ranked) {
    const { option } = line;
    const action = option.parameters[0] as {
      regulation?: RegulationOperation;
      payload?: {
        sourceTileId?: string; measureId?: string; targetPlayerID?: string; targetResort?: string;
        output?: string; regulation?: RegulationOperation; targetRegulationId?: string;
        lobbyistTileId?: string; markerId?: string;
      };
    };
    const type = actionType(option);
    const political = [type, option.contextTile, action.payload?.sourceTileId, action.payload?.measureId];
    if (type === 'counterLobby') political.push(action.payload?.lobbyistTileId);
    if (type === 'displaceInfluence' || type === 'recallInfluence') political.push(action.payload?.markerId);
    const targets = expanded ? [action.payload?.targetPlayerID, action.payload?.targetResort, action.payload?.output,
      action.regulation ?? action.payload?.regulation, action.payload?.targetRegulationId] : [];
    const key = JSON.stringify(option.moveType === 'placeTile' ? option.parameters[0] : [...political, ...targets]);
    if (seen.has(key)) continue;
    seen.add(key);
    lines.push(line);
    if (lines.length === width) break;
  }
  return lines;
}

/** Search a bounded set of continuations, with opponents choosing according to their own position. */
export function chooseComputerMove(game: Game<CoreState>, { G, ctx, revision, styles }: ComputerPosition, playerID: string): EngineMoveOption | undefined {
  if (ctx.gameover !== undefined || actingPlayer(ctx) !== playerID) return undefined;
  const state: EngineSnapshot = { G, ctx, _stateID: revision, plugins: { random: { data: { seed: G.matchSeed } } } };
  const expanded = Object.values(G.cfg.expansions).some(Boolean);
  const lastTurn = state.ctx.turn + TURN_HORIZON;
  const style = styles[playerID];
  // Quoting and replaying each action gets more expensive as the board grows. Keep the horizon and narrow the search.
  const largeBoard = G.exp.core.tiles.board.length >= 25;
  const rootWidth = largeBoard ? 2 : 4;
  const rootSamples = largeBoard ? 12 : 24;
  const followUpSamples = largeBoard ? 3 : 5;

  function follow(line: Variation, remaining: number, canBranch: boolean): Continuation {
    const { next, value } = line;
    if (!remaining || next.ctx.turn >= lastTurn || value.winners) return { preferred: value };

    const actor = actingPlayer(next.ctx);
    const actorStyle = styles[actor];
    const ranked = rankedOptions(game, next, actor, actorStyle, followUpSamples);
    const branch = canBranch && actor !== playerID;
    const replies = distinctLines(ranked, branch ? REPLY_WIDTH : 1, expanded);
    if (!replies.length) return { preferred: value };
    // After an empty-hand pickup, compare playing the new card and its additional action with the regular action.
    if (G.cfg.variants.measureRegulationAccess && actor === playerID && next.ctx.turn === state.ctx.turn
        && next.G.exp.core.emptyHandPickupUsed && next.ctx.activePlayers?.[actor] === CoreStages.ExactlyOnePoliticalAction) {
      const play = ranked.find(playsMeasure);
      const regular = ranked.find(reply => !playsMeasure(reply));
      if (play && regular) {
        const played = follow(play, remaining - 1, canBranch);
        const ordinary = follow(regular, remaining - 1, canBranch);
        return compare(played.preferred, ordinary.preferred, actor, actorStyle) > 0 ? played : ordinary;
      }
    }
    if (replies.length === 1) return follow(replies[0], remaining - 1, canBranch);

    const [first, second] = replies.map(reply => follow(reply, remaining - 1, false).preferred);
    return compare(second, first, actor, actorStyle) > 0
      ? { preferred: second, alternative: first }
      : { preferred: first, alternative: second };
  }

  const ranked = rankedOptions(game, state, playerID, style, rootSamples, true);
  const lines = distinctLines(ranked, rootWidth, expanded);
  if (lines[0]?.value.winners?.length === 1 && lines[0].value.winners[0] === playerID) return lines[0].option;
  const defense = ranked.find(line => line.defensive);
  if (defense && !lines.includes(defense)) lines.push(defense);
  if (G.cfg.variants.measureRegulationAccess) {
    const play = ranked.find(playsMeasure);
    const pickup = !G.exp.core.emptyHandPickupUsed && ranked.find(line => line.next.G.exp.core.emptyHandPickupUsed);
    // EXP-01-06-04E: a zero-cost empty-hand pickup preserves the regular action.
    if (!defense && pickup && !pickup.option.costBreakdown.length) return pickup.option;
    const regulation = ranked.find(line => actionType(line.option) === 'activateAuthorityApparatus');
    for (const line of [play, pickup, regulation]) {
      if (line && !lines.includes(line)) lines.push(line);
    }
  }
  if (lines.length === 1) return lines[0].option;
  let best: { option: EngineMoveOption; rating: ReturnType<typeof rateContinuation> } | undefined;
  for (const line of lines) {
    const later = follow(line, ACTION_HORIZON - 1, true);
    const rating = rateContinuation(later, line.value, playerID, style);
    if (!best || (rating.outcome - best.rating.outcome || rating.survival - best.rating.survival
      || rating.position - best.rating.position) > 0) best = { option: line.option, rating };
  }
  if (best) return best.option;
  // Fall back to the first accepted move if the sampled candidates were all rejected.
  const legal = engineMoveOptions(state.G, state.ctx, playerID);
  return previewEngineOptions(game, state, legal).next().value?.option;
}
