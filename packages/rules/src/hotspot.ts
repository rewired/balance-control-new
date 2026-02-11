import { hexNeighbors } from './topology/hex.js';
import { isOccupied } from './placement.js';
import type { AxialCoord, CoreState } from './types.js';

export function isFullySurrounded(state: CoreState, coord: AxialCoord): boolean {
  const nbrs = hexNeighbors(coord);
  return nbrs.every((c) => isOccupied(state.tiles.board, c)); // CORE-01-06-01..02
}