import type { AxialCoord, BoardPlacement } from './types.js';
import { getTopology, type Topology } from './topology/index.js';

export function isOccupied(board: BoardPlacement[], coord: AxialCoord): boolean {
  return board.some((p) => p.coord.q === coord.q && p.coord.r === coord.r);
}

export function isLegalPlacement(board: BoardPlacement[], coord: AxialCoord, topology: Topology = getTopology()): boolean {
  if (isOccupied(board, coord)) return false; // CORE-01-04-08
  // must be adjacent to at least one existing tile (CORE-01-04-05)
  return board.some((p) => topology.adjacent(p.coord, coord));
}

export function legalPlacementCoords(board: BoardPlacement[], topology: Topology = getTopology()): AxialCoord[] {
  const candidates: AxialCoord[] = [];
  for (const p of board) {
    for (const n of topology.neighbors(p.coord)) {
      if (!candidates.some((c) => c.q === n.q && c.r === n.r) && isLegalPlacement(board, n, topology)) {
        candidates.push(n);
      }
    }
  }
  return candidates;
}
