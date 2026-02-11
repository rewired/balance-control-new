import type { AxialCoord, CoreState, ResourceId } from './types.js';
import { canPay, subResources, addResources as addRes, createCoreResourceRegistry, type ResourceAmounts } from './resources.js';
import type { ExpansionModule } from './expansion-registry.js';

export type EffectKind = 'addResources';

export interface BaseEffect {
  kind: EffectKind;
  contextCoord?: AxialCoord; // ContextTile binding (AGENTS §3.5 step 1)
}

export interface AddResourcesEffect extends BaseEffect {
  kind: 'addResources';
  playerID: string;
  resource: ResourceId;
  amount: number; // base amount before modifiers
  cost?: Partial<Record<ResourceId, number>>; // paid from player personal supply
}

export type EffectDescriptor = AddResourcesEffect;

function findTileAt(G: CoreState, coord?: AxialCoord) {
  if (!coord) return undefined;
  return G.tiles.board.find((p) => p.coord.q === coord.q && p.coord.r === coord.r);
}

function isStartCommitteeContext(G: CoreState, coord?: AxialCoord): boolean {
  const p = findTileAt(G, coord);
  if (!p) return false;
  const t = G.allTiles[p.tileId];
  return !!t && t.kind === 'StartCommittee';
}

export interface ResolveResult { ok: boolean; reason?: string }

export function createResolver(modules: ExpansionModule[] = []) {
  const registry = createCoreResourceRegistry();
  const hooks = modules.map((m) => m.hooks).filter(Boolean) as NonNullable<ExpansionModule['hooks']>[];

  return function resolveEffect(G: CoreState, effect: EffectDescriptor): ResolveResult {
    // 1) Assign ContextTile (already part of descriptor)
    const immune = isStartCommitteeContext(G, effect.contextCoord); // AGENTS §3.7

    // 2) Prohibitions
    if (!immune) {
      for (const h of hooks) {
        const blocked = h.prohibitions?.({ G, effect });
        if (blocked) return { ok: false, reason: 'prohibited' };
      }
    }

    // Prepare working copies for atomicity
    const workResources: ResourceAmounts = { ...G.players[effect.playerID]?.personal.resources } as ResourceAmounts;

    // 3) Cost increases (apply to effect.cost) — call even if no initial cost
    let cost: Partial<Record<ResourceId, number>> | undefined = effect.cost ? { ...effect.cost } : undefined;
    if (!immune) {
      for (const h of hooks) {
        const delta = h.costIncreases?.({ G, effect, cost });
        if (delta) {
          if (!cost) cost = {};
          for (const k of Object.keys(delta)) {
            const id = k as ResourceId;
            cost[id] = (cost[id] ?? 0) + (delta[id] ?? 0);
          }
        }
      }
    }

    // If there is a cost, ensure payability on working copy
    if (cost) {
      if (!canPay(registry, workResources, cost)) return { ok: false, reason: 'insufficient' };
      subResources(registry, workResources, cost);
    }

    // 4) Output modifiers
    let amount = effect.amount;
    if (!immune) {
      for (const h of hooks) {
        const mod = h.outputModifiers?.({ G, effect, amount });
        if (typeof mod === 'number') amount = mod;
      }
    }

    // 5) Floors (>= 0)
    if (amount < 0) amount = 0;

    // 6) Execute atomically on real state
    switch (effect.kind) {
      case 'addResources': {
        if (cost) {
          G.players[effect.playerID].personal.resources = workResources;
        }
        if (amount > 0) {
          const deltaGeneric: Partial<Record<ResourceId, number>> = { [effect.resource]: amount };
          addRes(registry, G.players[effect.playerID].personal.resources, deltaGeneric as Partial<ResourceAmounts>);
        }
        return { ok: true };
      }
      default:
        return { ok: false, reason: 'unknown-effect' };
    }
  };
}


