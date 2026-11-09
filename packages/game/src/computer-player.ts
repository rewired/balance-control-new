import type { Ctx, Game } from 'boardgame.io';
import { computeMajority, getTopology, type AxialCoord, type CoreState, type PaymentSelection } from '@bc/rules';
import type { ComputerPosition } from './computer-position.js';
import { engineMoveOptions, previewEngineOptions, type EngineMoveOption, type EngineSnapshot } from './legal-options.js';

const TURN_HORIZON = 3;
const ACTION_HORIZON = 8;
const REPLY_WIDTH = 2;

interface PositionValue {
  winners?: string[];
  scores: Record<string, number>;
}

function evaluate({ G, ctx }: EngineSnapshot): PositionValue {
  const { allTiles, influencesOnBoard, players, tiles } = G.exp.core;
  // Heuristic only: value real markers first, then future influence and economic position.
  const scores = Object.fromEntries(Object.values(players).map(({ id, personal }) => [id,
    45 * personal.influence.length + Object.values(personal.resources).reduce((sum, amount) => sum + amount, 0),
  ]));
  for (const { owner } of influencesOnBoard ?? []) scores[owner] += 100;
  for (const { tileId, coord } of tiles.board) {
    const tile = allTiles[tileId];
    if (tile.kind !== 'ResortTile') continue;
    const controller = computeMajority(G, coord);
    if (controller !== null) scores[controller] += 3 * tile.w;
  }
  // CORE-01-09-03/-04: use the actual settlement result for a finished game.
  const result = ctx.gameover as { winners: string[] } | undefined;
  return { winners: result?.winners, scores };
}

function compare(left: PositionValue, right: PositionValue, playerID: string): number {
  const rank = ({ winners }: PositionValue) => {
    if (!winners) return 0;
    if (!winners.includes(playerID)) return -1;
    return winners.length === 1 ? 2 : 1;
  };
  const margin = ({ scores }: PositionValue) => scores[playerID] - Math.max(
    ...Object.entries(scores).filter(([id]) => id !== playerID).map(([, score]) => score),
  );
  return rank(left) - rank(right) || margin(left) - margin(right);
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
      payload: { markerId: string; sourceTileId?: string; targetTileId: string; payment?: PaymentSelection };
    };
    // Keep different routes and payments, and distinguish starting markers for formalization timing.
    const key = JSON.stringify([payload.sourceTileId, payload.targetTileId, startingMarkers.has(payload.markerId), payload.payment]);
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
  return legal.length ? shortlist(uniqueMarkerOptions(G, playerID, legal), budget, compactness(G)) : [];
}

function rankedOptions(game: Game<CoreState>, state: EngineSnapshot, playerID: string, budget: number) {
  const candidates = sampleComputerOptions({ G: state.G, ctx: state.ctx, revision: state._stateID }, playerID, budget);
  const countNeighbors = compactness(state.G);
  const ranked = Array.from(previewEngineOptions(game, state, candidates), ({ option, next }) => {
    const neighbors = option.moveType === 'placeTile' ? countNeighbors(option) : 0;
    return { option, next, value: evaluate(next), neighbors };
  });
  return ranked.sort((a, b) => compare(b.value, a.value, playerID) || b.neighbors - a.neighbors);
}

type Variation = ReturnType<typeof rankedOptions>[number];

function distinctLines(ranked: Variation[], width: number): Variation[] {
  const seen = new Set<string>();
  const lines: Variation[] = [];
  for (const line of ranked) {
    const { option } = line;
    const action = option.parameters[0] as { payload?: { sourceTileId?: string; measureId?: string } };
    const key = option.moveType === 'placeTile' ? JSON.stringify(option.parameters[0])
      : JSON.stringify([actionType(option), option.contextTile, action.payload?.sourceTileId, action.payload?.measureId]);
    if (seen.has(key)) continue;
    seen.add(key);
    lines.push(line);
    if (lines.length === width) break;
  }
  return lines;
}

/** Search a bounded set of continuations, with opponents choosing according to their own position. */
export function chooseComputerMove(game: Game<CoreState>, { G, ctx, revision }: ComputerPosition, playerID: string): EngineMoveOption | undefined {
  if (ctx.gameover !== undefined || actingPlayer(ctx) !== playerID) return undefined;
  const state: EngineSnapshot = { G, ctx, _stateID: revision, plugins: { random: { data: { seed: G.matchSeed } } } };
  const lastTurn = state.ctx.turn + TURN_HORIZON;
  // Quoting and replaying each action gets more expensive as the board grows. Keep the horizon and narrow the search.
  const largeBoard = G.exp.core.tiles.board.length >= 25;
  const rootWidth = largeBoard ? 2 : 4;
  const rootSamples = largeBoard ? 12 : 24;
  const followUpSamples = largeBoard ? 3 : 5;

  function follow(line: Variation, remaining: number, canBranch: boolean): PositionValue {
    const { next, value } = line;
    if (!remaining || next.ctx.turn >= lastTurn || value.winners) return value;

    const actor = actingPlayer(next.ctx);
    const ranked = rankedOptions(game, next, actor, followUpSamples);
    const branch = canBranch && actor !== playerID;
    const replies = distinctLines(ranked, branch ? REPLY_WIDTH : 1);
    let best: PositionValue | undefined;
    for (const reply of replies) {
      const result = follow(reply, remaining - 1, canBranch && replies.length === 1);
      if (!best || compare(result, best, actor) > 0) best = result;
    }
    return best ?? value;
  }

  const ranked = rankedOptions(game, state, playerID, rootSamples);
  const lines = distinctLines(ranked, rootWidth);
  if (lines.length === 1 || lines[0]?.value.winners?.length === 1 && lines[0].value.winners[0] === playerID) {
    return lines[0].option;
  }
  let best: { option: EngineMoveOption; value: PositionValue } | undefined;
  for (const line of lines) {
    const value = follow(line, ACTION_HORIZON - 1, true);
    if (!best || compare(value, best.value, playerID) > 0) best = { option: line.option, value };
  }
  if (best) return best.option;
  // Fall back to the first accepted move if the sampled candidates were all rejected.
  const legal = engineMoveOptions(state.G, state.ctx, playerID);
  return previewEngineOptions(game, state, legal).next().value?.option;
}
