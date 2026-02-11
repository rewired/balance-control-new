// CORE-01-05 â€” Majority & Control (canonical)
import { adjacent as hexAdjacent } from './topology/hex.js';
import type { AxialCoord, BoardPlacement, CoreState, Tile } from './types.js';

export interface MajorityBreakdown { [playerID: string]: number }

function findPlacementAt(board: BoardPlacement[], coord: AxialCoord): BoardPlacement | undefined {
  return board.find((p) => p.coord.q === coord.q && p.coord.r === coord.r);
}

function influencesOnTile(state: CoreState, tileId: string, playerID: string): number {
  const list = (state as any).influencesOnBoard as Array<{ tileId: string; owner: string; count: number }> | undefined;
  if (!list) return 0;
  return list.filter((i) => i.tileId === tileId && i.owner === playerID).reduce((a, b) => a + b.count, 0);
}

function adjacentLobbyistBonus(state: CoreState, targetCoord: AxialCoord, playerID: string): number {
  const neighbors = [
    { q: +1, r: 0 },
    { q: +1, r: -1 },
    { q: 0, r: -1 },
    { q: -1, r: 0 },
    { q: -1, r: +1 },
    { q: 0, r: +1 },
  ].map((d) => ({ q: targetCoord.q + d.q, r: targetCoord.r + d.r }));

  let bonus = 0;
  for (const n of neighbors) {
    const placement = findPlacementAt(state.tiles.board, n);
    if (!placement) continue;
    const tile = state.allTiles[placement.tileId] as Tile | undefined;
    if (tile && tile.kind === 'Lobbyist') {
      // CORE-01-05-04..06 â€” Lobbyist contributes +1 virtual Influence to adjacent tile for the same player
      // Design note: we interpret contribution for the player who has any Influence present on the Lobbyist tile.
      // If multiple players have presence, both will get +1 from that tile (no exclusivity specified in CORE text).
      const present = influencesOnTile(state, placement.tileId, playerID);
      if (present > 0) bonus += 1;
    }
  }
  return bonus;
}

export function computeMajority(state: CoreState, coord: AxialCoord): string | null {
  const placement = findPlacementAt(state.tiles.board, coord);
  if (!placement) return null;
  const players = Object.keys(state.players);
  const scores: MajorityBreakdown = {};
  for (const pid of players) {
    const base = influencesOnTile(state, placement.tileId, pid);
    const bonus = adjacentLobbyistBonus(state, coord, pid);
    scores[pid] = base + bonus;
  }
  const entries = Object.entries(scores);
  entries.sort((a, b) => b[1] - a[1]);
  if (entries.length === 0) return null;
  const [topPlayer, topScore] = entries[0];
  const second = entries[1]?.[1] ?? -Infinity;
  if (topScore <= 0) return null; // nobody present
  if (topScore === second) return null; // CORE-01-05-02 tie â†’ no control
  return topPlayer; // CORE-01-05-01 strict majority
}

export function getControl(state: CoreState, coord: AxialCoord): string | null {
  // CORE-01-05-03A
  return computeMajority(state, coord);
}
