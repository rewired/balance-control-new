import type { AxialCoord, CoreState, ResourceId } from './types.js';
import { canPay, subResources, addResources as addRes, createCoreResourceRegistry, type ResourceAmounts } from './resources.js';
import type { ExpansionModule } from './expansion-registry.js';
import { resolveHotspot } from './hotspot.js';
import { resolveProductionForTile } from './production.js';

export type EffectKind =
  | 'addResources'
  | 'offerTile'            // set draw/discard + pending offer for placement (phase onBegin)
  | 'placeTile'            // push tile to board and clear pending
  | 'resolveHotspotAt'     // resolve hotspot if fully surrounded
  | 'applyProductionAt';   // run production for a single tile

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

export interface OfferTileEffect extends BaseEffect {
  kind: 'offerTile';
  drawPile: string[];
  discardFaceUp: string[];
  pending?: { tileId: string; legalCoords: AxialCoord[] };
}

export interface PlaceTileEffect extends BaseEffect {
  kind: 'placeTile';
  tileId: string;
  coord: AxialCoord;
}

export interface ResolveHotspotAtEffect extends BaseEffect {
  kind: 'resolveHotspotAt';
  coord: AxialCoord;
}

export interface ApplyProductionAtEffect extends BaseEffect {
  kind: 'applyProductionAt';
  coord: AxialCoord;
}

export type EffectDescriptor =
  | AddResourcesEffect
  | OfferTileEffect
  | PlaceTileEffect
  | ResolveHotspotAtEffect
  | ApplyProductionAtEffect;

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

    // 2) Prohibitions — always evaluated unless Start Committee
    if (!immune) {
      for (const h of hooks) {
        const blocked = h.prohibitions?.({ G, effect });
        if (blocked) return { ok: false, reason: 'prohibited' };
      }
    }

    // Effect-kind specific execution including cost/output/floors when applicable
    switch (effect.kind) {
      case 'addResources': {
        // Prepare working copies for atomicity on cost payment
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
        // 6) Apply atomically
        if (cost) {
          G.players[effect.playerID].personal.resources = workResources;
        }
        if (amount > 0) {
          const deltaGeneric: Partial<Record<ResourceId, number>> = { [effect.resource]: amount };
          addRes(registry, G.players[effect.playerID].personal.resources, deltaGeneric as Partial<ResourceAmounts>);
        }
        return { ok: true };
      }

      case 'offerTile': {
        // Atomic assignment of draw/discard and pending offer
        G.tiles.drawPile = effect.drawPile.slice();
        G.tiles.discardFaceUp = effect.discardFaceUp.slice();
        G.turn = { pending: effect.pending ? { tileId: effect.pending.tileId, legalCoords: effect.pending.legalCoords } : undefined } as CoreState['turn'];
        return { ok: true };
      }

      case 'placeTile': {
        G.tiles.board.push({ tileId: effect.tileId, coord: effect.coord });
        G.turn = { pending: undefined };
        return { ok: true };
      }

      case 'resolveHotspotAt': {
        resolveHotspot(G, effect.coord);
        return { ok: true };
      }

      case 'applyProductionAt': {
        resolveProductionForTile(G, effect.coord, modules);
        return { ok: true };
      }

      default:
        return { ok: false, reason: 'unknown-effect' };
    }
  };
}