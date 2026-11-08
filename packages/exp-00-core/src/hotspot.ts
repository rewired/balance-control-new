import { getTopology } from '@bc/rules';
import { isOccupied } from './placement.js';
import type { AxialCoord, CoreState } from '@bc/rules';

export function isFullySurrounded(state: CoreState, coord: AxialCoord): boolean {
  const nbrs = getTopology(state.cfg?.topology).neighbors(coord);
  return nbrs.every((c) => isOccupied(state.exp.core.tiles.board, c)); // CORE-01-06-01..02
}
