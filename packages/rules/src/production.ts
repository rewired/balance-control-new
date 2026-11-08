import type { AxialCoord, CoreState } from './types.js';
import type { ExpansionModule } from './expansion-registry.js';
import { planProductionForTile } from './production.plan.js';
import { createResolver } from './effects.js';

export { collectProductionModifiers } from './production.plan.js';

export function resolveProductionForTile(state: CoreState, coord: AxialCoord, modules?: readonly ExpansionModule[]): void {
  const resolve = createResolver(modules);
  resolve(state, { kind: 'applyProductionAt', coord });
}

export function resolveRoundSettlement(state: CoreState, modules?: readonly ExpansionModule[]): boolean {
  // CORE-01-07-04(c): settle ResortTiles in ascending ordinal Tile ID order.
  const resolve = createResolver(modules);
  resolve(state, { kind: 'beforeSettlementProduction' });
  if (state.pendingRegulationChoices?.length) return false;
  const resorts = state.tiles.board.filter(placement => state.allTiles[placement.tileId]?.kind === 'ResortTile');
  resorts.sort((a, b) => a.tileId < b.tileId ? -1 : a.tileId > b.tileId ? 1 : 0);
  for (const placement of resorts) {
    resolve(state, { kind: 'applyProductionAt', coord: placement.coord });
  }
  // CORE-01-07-17: expiring effects remain active through all production in this Settlement.
  resolve(state, { kind: 'expireMeasureEffects', boundary: 'settlementEnd' });
  return true;
}

export { planProductionForTile };
