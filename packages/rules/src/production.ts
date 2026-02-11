import type { AxialCoord, CoreState } from './types.js';
import type { ExpansionModule } from './expansion-registry.js';
import { planProductionForTile } from './production.plan.js';
import { createResolver } from './effects.js';

export { collectProductionModifiers } from './production.plan.js';

export function resolveProductionForTile(state: CoreState, coord: AxialCoord, modules: ExpansionModule[] = []): void {
  const resolve = createResolver(modules);
  resolve(state, { kind: 'applyProductionAt', coord, contextCoord: coord });
}

export function resolveRoundSettlement(state: CoreState, modules: ExpansionModule[] = []): void {
  // CORE-01-07 Round Settlement: produce for all ResortTiles on Board via resolver
  for (const p of state.tiles.board) {
    const coord = p.coord;
    const resolve = createResolver(modules);
    resolve(state, { kind: 'applyProductionAt', coord, contextCoord: coord });
  }
}

export { planProductionForTile };