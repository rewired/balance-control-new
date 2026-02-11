import { hexNeighbors } from './topology/hex.js';
import { isOccupied } from './placement.js';
import { computeMajority } from './majority.js';
import type { AxialCoord, CoreState, Tile } from './types.js';

export function isFullySurrounded(state: CoreState, coord: AxialCoord): boolean {
  const nbrs = hexNeighbors(coord);
  return nbrs.every((c) => isOccupied(state.tiles.board, c)); // CORE-01-06-01..02
}

function takeFromSupply(state: CoreState, playerID: string): boolean {
  const p = state.players[playerID];
  if (!p || p.personal.influence.length <= 0) return false;
  p.personal.influence.pop();
  return true;
}

function addInfluenceOnBoard(state: CoreState, tileId: string, playerID: string, n = 1): void {
  if (!state.influencesOnBoard) state.influencesOnBoard = [];
  const rec = state.influencesOnBoard.find((r) => r.tileId === tileId && r.owner === playerID);
  if (rec) rec.count += n;
  else state.influencesOnBoard.push({ tileId, owner: playerID, count: n });
}

export function resolveHotspot(state: CoreState, coord: AxialCoord): void {
  const placement = state.tiles.board.find((p) => p.coord.q === coord.q && p.coord.r === coord.r);
  if (!placement) return;
  const tile = state.allTiles[placement.tileId] as Tile | undefined;
  if (!tile || tile.kind !== 'Hotspot') return;
  if (!isFullySurrounded(state, coord)) return;
  const winner = computeMajority(state, coord);
  if (!winner) return; // no control
  if (!takeFromSupply(state, winner)) return; // nothing to move
  addInfluenceOnBoard(state, placement.tileId, winner, 1); // award 1 influence
}