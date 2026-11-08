import type { AxialCoord, CoreState, ResourceId, ResortTile } from './types.js';
import { computeMajority, getControl } from './majority.js';
import type { ExpansionModule, ProductionModifier } from './expansion-registry.js';

// CORE-01-06-16-00: collect modifiers from active sources before applying any.
export function collectProductionModifiers(G: CoreState, coord: AxialCoord, tile: ResortTile, modules: readonly ExpansionModule[]): ProductionModifier[] {
  // EXP-01-08-M09-05/-06: only current sole control by the target suppresses Measure modifiers.
  const freezes = G.cfg.expansions.exp01 ? G.productionEffects?.filter(effect => effect.sourceCardId === 'ECO_M09') : undefined;
  const controller = freezes?.length ? getControl(G, coord) : null;
  const suppressMeasures = controller !== null && freezes?.some(effect => effect.targetPlayerID === controller);

  const out: ProductionModifier[] = [];
  for (const module of modules) {
    if (!G.cfg.expansions[module.id]) continue;
    const modifiers = module.hooks?.productionModifiers?.({ G, coord, tile, amount: tile.w });
    if (!modifiers) continue;
    for (const modifier of modifiers) {
      if (!suppressMeasures || modifier.source !== 'measure') out.push(modifier);
    }
  }
  return out;
}

function getPlacement(state: CoreState, coord: AxialCoord) {
  return state.tiles.board.find((p) => p.coord.q === coord.q && p.coord.r === coord.r);
}

export interface PlannedProduction {
  resort: ResourceId;
  winners: string[]; // positive leaders who receive a regular share
  share: number;     // per-winner amount
  remainder: number; // to noise
}

export function planProductionForTile(state: CoreState, coord: AxialCoord, modules: readonly ExpansionModule[] = []): PlannedProduction | null {
  const placement = getPlacement(state, coord);
  if (!placement) return null;
  const tile = state.allTiles[placement.tileId];
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
