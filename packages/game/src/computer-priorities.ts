import { boardInfluenceScores, influenceLimit, isProhibited, modifyOutput } from '@bc/exp-00-core';
import {
  computeMajority, createExpansionRegistry, getTopology, isFullySurrounded,
  type AxialCoord, type CoreState, type ExpansionHooks,
} from '@bc/rules';
import type { EngineMoveOption } from './legal-options.js';

export function resourceValue(amount: number): number {
  return Math.min(amount, 6) + 0.05 * Math.max(0, amount - 6);
}

export function influenceValue(G: CoreState, hooks: readonly ExpansionHooks[]) {
  const { players, allTiles, tiles } = G.exp.core;
  const counts = Object.fromEntries(boardInfluenceScores(G));
  const limit = influenceLimit(G);
  const access: Record<string, number> = {};
  // CORE-01-04-14A: a controlled Standard Committee provides repeatable access to formalization.
  for (const { tileId, coord } of tiles.board) {
    if (allTiles[tileId].kind !== 'Committee') continue;
    const { controller, scores } = computeMajority(G, coord, 'details');
    if (controller === null) continue;
    const effect = { kind: 'formalizeInfluence' as const, playerID: controller, tileId, resources: [], contextCoord: coord };
    if (isProhibited(G, effect, hooks) || modifyOutput(G, effect, hooks, 1) <= 0) continue;
    const margin = scores[controller] - Math.max(...Object.entries(scores).filter(([id]) => id !== controller).map(([, score]) => score));
    access[controller] = Math.max(access[controller] ?? 0, 1 + 0.15 * Math.min(2, margin - 1));
  }

  return Object.fromEntries(Object.entries(players).map(([id, { personal, usedStartCommittee }]) => {
    const count = counts[id];
    const spare = personal.influence.length;
    const remaining = limit - count;
    const needsCommittee = remaining > spare;
    // CORE-01-09-00/-03: accelerate the race near the limit and favor real Board Influence as the pile runs out.
    const race = 105 * count + 14 * count ** 2;
    const readyToWin = remaining === 1 && spare > 0 ? 85 : 0;
    const supply = (tiles.drawPile.length < 4 ? 24 : 61) * spare;
    const committee = needsCommittee ? (access[id] ?? 0) * (spare === 0 ? 38 : 26) : 0;
    const start = needsCommittee && !usedStartCommittee ? 8 : 0;
    const stock = Object.values(personal.resources).reduce((sum, amount) => sum + resourceValue(amount), 0);
    return [id, race + readyToWin + supply + committee + start + stock];
  }));
}

/** Keep routes to a committee in the candidate set even when many generic Influence moves are legal. */
export function committeeCandidates(G: CoreState, playerID: string, options: readonly EngineMoveOption[]) {
  if (options[0]?.moveType !== 'doPoliticalAction') return [];
  const { allTiles, players, tiles } = G.exp.core;
  const player = players[playerID];
  const supply = player.personal.influence.length;
  if ((boardInfluenceScores(G).find(([id]) => id === playerID)?.[1] ?? 0) + supply >= influenceLimit(G)) return [];
  const byTarget = new Map<string, EngineMoveOption>();
  for (const option of options) {
    if (option.moveType !== 'doPoliticalAction') continue;
    const { type, payload } = option.parameters[0] as { type: string; payload: { targetTileId?: string; sourceTileId?: string } };
    if (type !== 'placeOrMoveInfluence' || !payload.targetTileId) continue;
    const current = byTarget.get(payload.targetTileId);
    const currentPayload = (current?.parameters[0] as { payload: { sourceTileId?: string } } | undefined)?.payload;
    if (!current || (currentPayload?.sourceTileId && !payload.sourceTileId)) byTarget.set(payload.targetTileId, option);
  }
  const { adjacent } = getTopology(G.cfg.topology);
  const candidates: { option: EngineMoveOption; value: number }[] = [];
  for (const { tileId, coord } of tiles.board) {
    if (allTiles[tileId].kind !== 'Committee') continue;
    const { controller, scores } = computeMajority(G, coord, 'details');
    if (controller === playerID) continue;
    const lead = Math.max(...Object.values(scores)) - scores[playerID];
    if (lead > 1) continue;
    const direct = byTarget.get(tileId);
    if (direct) candidates.push({ option: direct, value: 2 - lead });
    // CORE-01-05-03B/-04: taking an adjacent Lobbyist can give virtual control of the Committee.
    for (const lobbyist of tiles.board) {
      if (allTiles[lobbyist.tileId].kind !== 'Lobbyist' || !adjacent(coord, lobbyist.coord)) continue;
      const option = byTarget.get(lobbyist.tileId);
      if (option) candidates.push({ option, value: 1 - lead });
    }
  }
  return [...new Set(candidates.sort((a, b) => b.value - a.value).map(({ option }) => option))].slice(0, 3);
}

/** Include placements that could end the game before ordinary candidate sampling. */
export function winningCandidates(G: CoreState, playerID: string, options: readonly EngineMoveOption[]) {
  const counts = Object.fromEntries(boardInfluenceScores(G));
  const { allTiles, players, tiles } = G.exp.core;
  const limit = influenceLimit(G);
  const spare = players[playerID].personal.influence.length;
  if (spare === 0 || counts[playerID] + spare < limit) return [];
  if (options[0]?.moveType === 'placeTile') {
    const { neighbors } = getTopology(G.cfg.topology);
    const key = ({ q, r }: AxialCoord) => `${q},${r}`;
    const occupied = new Set(tiles.board.map(site => key(site.coord)));
    const closing = new Set<string>();
    for (const site of tiles.board) {
      if (allTiles[site.tileId].kind !== 'Hotspot' || site.enclosureProcessed) continue;
      const { controller } = computeMajority(G, site.coord, 'details');
      // A newly placed Lobbyist carries no Influence. Placement cannot give the Hotspot a different majority.
      if (controller !== playerID) continue;
      const gaps = neighbors(site.coord).map(key).filter(coord => !occupied.has(coord));
      if (gaps.length === 1) closing.add(gaps[0]);
    }
    const drawn = tiles.drawResolution && allTiles[tiles.drawResolution.tileId];
    return options.filter(option => {
      const coord = option.parameters[0] as AxialCoord;
      // CORE-01-06-02A/-03: the drawn Tile can itself be a Hotspot placed into a fully enclosed gap.
      return closing.has(key(coord)) || (drawn?.kind === 'Hotspot' && isFullySurrounded(G, coord));
    });
  }
  if (counts[playerID] !== limit - 1) return [];
  const direct = options.find(option => {
    if (option.moveType !== 'doPoliticalAction') return false;
    const { type, payload } = option.parameters[0] as { type: string; payload: { sourceTileId?: string } };
    return type === 'placeOrMoveInfluence' && !payload.sourceTileId;
  });
  return direct ? [direct] : options.filter(option => option.moveType === 'chooseHotspotOutcome');
}

export function activeComputerHooks(G: CoreState) {
  return createExpansionRegistry(G.cfg.expansions).flatMap(module => module.hooks ?? []);
}
