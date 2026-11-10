import { getTopology, type AxialCoord, type CoreState, type MajorityBreakdown, type MajorityResult } from '@bc/rules';

function scoreTile(state: CoreState, coord: AxialCoord): MajorityBreakdown {
  const scores = Object.fromEntries(Object.keys(state.exp.core.players).sort().map(playerID => [playerID, 0]));
  const placement = state.exp.core.tiles.board.find(p => p.coord.q === coord.q && p.coord.r === coord.r);
  const tile = placement && state.exp.core.allTiles[placement.tileId];
  // CORE-01-08-05: Start Committee cannot be controlled.
  if (!tile || tile.kind === 'StartCommittee') return scores;

  // CORE-01-05-03A: count the real markers of each player on the tile.
  for (const marker of state.exp.core.influencesOnBoard ?? []) {
    // VAR-01-05-02: a challenged marker remains on Board but contributes zero here.
    if (marker.tileId === tile.id && marker.challengedAt !== tile.id && Object.hasOwn(scores, marker.owner)) {
      scores[marker.owner] += 1;
    }
  }

  // CORE-01-05-07: Lobbyists use real markers only, so looking up a controller cannot recurse further.
  if (tile.kind === 'Lobbyist') return scores;

  const { adjacent } = getTopology(state.cfg.topology);
  for (const neighbor of state.exp.core.tiles.board) {
    if (state.exp.core.allTiles[neighbor.tileId]?.kind !== 'Lobbyist' || !adjacent(coord, neighbor.coord)) continue;
    // CORE-01-05-04/-08/-09: each controlled adjacent Lobbyist adds one to its controller.
    const controller = computeMajority(state, neighbor.coord);
    if (controller !== null) scores[controller] += 1;
  }
  return scores;
}

// CORE-01-05-01/-02/-03A: select the highest positive score or the tied leaders.
export function computeMajority(state: CoreState, coord: AxialCoord): string | null;
export function computeMajority(state: CoreState, coord: AxialCoord, format: 'details'): MajorityResult;
export function computeMajority(state: CoreState, coord: AxialCoord, format?: 'details'): string | null | MajorityResult {
  const scores = scoreTile(state, coord);
  let highest = 0;
  let leaders: string[] = [];
  for (const [playerID, score] of Object.entries(scores)) {
    if (score > highest) {
      highest = score;
      leaders = [playerID];
    } else if (score === highest && highest > 0) {
      leaders.push(playerID);
    }
  }
  const controller = leaders.length === 1 ? leaders[0] : null;
  return format === 'details' ? { controller, leaders, scores } : controller;
}

// CORE-01-05-03B: control includes virtual Influence even on tiles without real markers.
export function getControl(state: CoreState, coord: AxialCoord): string | null {
  return computeMajority(state, coord);
}
