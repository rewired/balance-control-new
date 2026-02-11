import type { AxialCoord, CoreState, ResourceId } from './types.js';
import { canPay, subResources, addResources as addRes } from './resources.js';
import { createCoreResourceRegistry } from './resources.js';
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
  const p = findTileAt(G, coord); if (!p) return false;
  const t = G.allTiles[p.tileId];
  return !!t && t.kind === 'StartCommittee';
}

export interface ResolveContext {
  modules?: ExpansionModule[]; // enabled modules providing hooks
}

export interface ResolveResult { ok: boolean; reason?: string }

export function createResolver(modules: ExpansionModule[] = []) {
  const registry = createCoreResourceRegistry();
  const hooks = modules.map((m) => m.hooks).filter(Boolean) as NonNullable<ExpansionModule['hooks']>[];

  return function resolveEffect(G: CoreState, effect: EffectDescriptor, ctx?: ResolveContext): ResolveResult {
    // 1) Assign ContextTile (already part of descriptor)
    const immune = isStartCommitteeContext(G, effect.contextCoord); // AGENTS §3.7

    // 2) Prohibitions
    if (!immune) {
      for (const h of hooks) {
        if (h.prohibitions) {
          // A prohibitions hook may return truthy to indicate block (opaque contract until 0015)
          const blocked = (h.prohibitions as any)({ G, effect });
          if (blocked) return { ok: false, reason: 'prohibited' };
        }
      }
    }

    // Prepare working copies for atomicity
    const work = { player: { resources: { ...G.players[(effect as any).playerID]?.personal.resources } }, noise: { ...G.resources.noise } } as any;

    // 3) Cost increases (apply to effect.cost)
    let cost = { ...(effect as any).cost } as Partial<Record<ResourceId, number>> | undefined;
    if (!immune && hooks.length && cost) {
      for (const h of hooks) {
        if (h.costIncreases) {
          const delta = (h.costIncreases as any)({ G, effect, cost }) as Partial<Record<ResourceId, number>> | undefined;
          if (delta) {
            for (const k of Object.keys(delta)) {
              const id = k as ResourceId;
              cost[id] = (cost[id] ?? 0) + (delta[id] ?? 0);
            }
          }
        }
      }
    }

    // If there is a cost, ensure payability on working copy
    if (cost) {
      if (!canPay(registry, work.player.resources, cost)) return { ok: false, reason: 'insufficient' };
      subResources(registry, work.player.resources, cost);
    }

    // 4) Output modifiers
    let amount = (effect as any).amount as number;
    if (!immune && hooks.length) {
      for (const h of hooks) {
        if (h.outputModifiers) {
          const mod = (h.outputModifiers as any)({ G, effect, amount }) as number | undefined;
          if (typeof mod === 'number') amount = mod;
        }
      }
    }

    // 5) Floors (>= 0)
    if (amount < 0) amount = 0;

    // 6) Execute atomically on real state
    switch (effect.kind) {
      case 'addResources': {
        // commit cost changes first (if any)
        if (cost) {
          G.players[effect.playerID].personal.resources = work.player.resources;
        }
        if (amount > 0) addRes(registry, G.players[effect.playerID].personal.resources, { [effect.resource]: amount });
        return { ok: true };
      }
      default:
        return { ok: false, reason: 'unknown-effect' };
    }
  };
}