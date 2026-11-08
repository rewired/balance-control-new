import type { AxialCoord, CoreState } from '@bc/rules';
import type { RulesModule } from '@bc/rules';
import { planProductionForTile } from './production.plan.js';
import { createResolver } from '@bc/rules';

export { collectProductionModifiers } from './production.plan.js';

export function resolveProductionForTile(state: CoreState, coord: AxialCoord, modules?: readonly RulesModule[]): void {
  const resolve = createResolver(modules);
  resolve(state, { kind: 'applyProductionAt', coord });
}

export function resolveRoundSettlement(state: CoreState, modules?: readonly RulesModule[]): boolean {
  // CORE-01-07-04(c): settle ResortTiles in ascending ordinal Tile ID order.
  const resolve = createResolver(modules);
  resolve(state, { kind: 'beforeSettlementProduction' });
  if (state.exp.core.pendingRegulationChoices?.length) return false;
  const resorts = state.exp.core.tiles.board.filter(placement => state.exp.core.allTiles[placement.tileId]?.kind === 'ResortTile');
  resorts.sort((a, b) => a.tileId < b.tileId ? -1 : a.tileId > b.tileId ? 1 : 0);
  for (const placement of resorts) {
    resolve(state, { kind: 'applyProductionAt', coord: placement.coord });
  }
  // CORE-01-07-17: expiring effects remain active through all production in this Settlement.
  resolve(state, { kind: 'expireMeasureEffects', boundary: 'settlementEnd' });
  return true;
}

export { planProductionForTile };
