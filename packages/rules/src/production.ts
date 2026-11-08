import type { AxialCoord, CoreState } from './types.js';
import type { ExpansionModule } from './expansion-registry.js';
import { planProductionForTile } from './production.plan.js';
import { createResolver } from './effects.js';

export { collectProductionModifiers } from './production.plan.js';

export function resolveProductionForTile(state: CoreState, coord: AxialCoord, modules?: readonly ExpansionModule[]): void {
  const resolve = createResolver(modules);
  resolve(state, { kind: 'applyProductionAt', coord });
}

export function resolveRoundSettlement(state: CoreState, modules?: readonly ExpansionModule[]): void {
  // CORE-01-07-03: resolve production for each ResortTile on the Board.
  const resolve = createResolver(modules);
  for (const p of state.tiles.board) {
    if (state.allTiles[p.tileId]?.kind === 'ResortTile') {
      resolve(state, { kind: 'applyProductionAt', coord: p.coord });
    }
  }
  // CORE-01-07-17: expiring effects remain active through all production in this Settlement.
  resolve(state, { kind: 'expireProductionEffects', boundary: 'settlementEnd' });
}

export { planProductionForTile };
