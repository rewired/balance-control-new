import type { AxialCoord, CoreState, ResourceId, ResortTile } from '@bc/rules';
import { computeMajority } from './majority.js';
import { createExpansionRegistry, type ProductionModifier, type RulesModule } from '@bc/rules';

// CORE-01-06-16-00: collect modifiers from active sources before applying any.
export function collectProductionModifiers(G: CoreState, coord: AxialCoord, tile: ResortTile, modules: readonly RulesModule[]): ProductionModifier[] {
  const active = createExpansionRegistry(G.cfg.expansions, modules);
  const args = { G, coord, tile, amount: tile.w };
  const out: ProductionModifier[] = [];
  for (const module of active) {
    const modifiers = module.hooks?.productionModifiers?.(args);
    if (!modifiers) continue;
    for (const modifier of modifiers) {
      if (!active.some(source => source.hooks?.excludeProductionModifier?.(args, modifier))) out.push(modifier);
    }
  }
  return out;
}

function getPlacement(state: CoreState, coord: AxialCoord) {
  return state.exp.core.tiles.board.find((p) => p.coord.q === coord.q && p.coord.r === coord.r);
}

export interface PlannedProduction {
  resort: ResourceId;
  winners: string[]; // positive leaders who receive a regular share
  share: number;     // per-winner amount
  remainder: number; // to noise
}

export function planProductionForTile(state: CoreState, coord: AxialCoord, modules: readonly RulesModule[] = []): PlannedProduction | null {
  const placement = getPlacement(state, coord);
  if (!placement) return null;
  const tile = state.exp.core.allTiles[placement.tileId];
  if (tile?.kind !== 'ResortTile') return null;

  const modifiers = collectProductionModifiers(state, coord, tile, modules);
  // CORE-01-06-16(a)(1)-(4): double the printed value, add the net delta, then floor once.
  let doubled: number = tile.w;
  let delta = 0;
  for (const modifier of modifiers) {
    if (modifier.kind === 'double') doubled *= 2;
    else delta += modifier.delta;
  }
  const out = Math.max(0, doubled + delta);

  // CORE-01-06-16(b) and CORE-01-06-13: use the canonical positive leaders.
  const { leaders } = computeMajority(state, coord, 'details');
  if (out === 0 || leaders.length === 0) return { resort: tile.resort, winners: [], share: 0, remainder: 0 };

  // CORE-01-06-16(c) and CORE-01-06-15: only a positive tie can produce a Noise remainder.
  const share = Math.floor(out / leaders.length);
  return { resort: tile.resort, winners: leaders, share, remainder: out - share * leaders.length };
}
