import type { AxialCoord, BoardPlacement } from './types.js';
import { hexNeighbors, adjacent as adjacentHex } from './topology/hex.js';

export type AdjacentFn = (a: AxialCoord, b: AxialCoord) => boolean;

export function isOccupied(board: BoardPlacement[], coord: AxialCoord): boolean {
  return board.some((p) => p.coord.q === coord.q && p.coord.r === coord.r);
}

export function isLegalPlacement(board: BoardPlacement[], coord: AxialCoord, adjacent: AdjacentFn = adjacentHex): boolean {
  if (isOccupied(board, coord)) return false; // CORE-01-04-08
  // must be adjacent to at least one existing tile (CORE-01-04-05)
  return board.some((p) => adjacent(p.coord, coord));
}

export function legalPlacementCoords(board: BoardPlacement[], adjacent: AdjacentFn = adjacentHex): AxialCoord[] {
  const candidates: AxialCoord[] = [];
  for (const p of board) {
    for (const n of hexNeighbors(p.coord)) {
      if (!isOccupied(board, n) && !candidates.some((c) => c.q === n.q && c.r === n.r) && isLegalPlacement(board, n, adjacent)) {
        candidates.push(n);
      }
    }
  }
  return candidates;
}