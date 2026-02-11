import { shuffleSeeded } from '@bc/shared';
import type { AxialCoord, CoreState, ResourceId, Zone, ExpansionId } from './types.js';
import { canPay, subResources, addResources as addRes, createCoreResourceRegistry, type ResourceAmounts } from './resources.js';
import type { ExpansionModule } from './expansion-registry.js';
import { isFullySurrounded } from './hotspot.js';
import { planProductionForTile } from './production.plan.js';
import { computeMajority } from './majority.js';

export type EffectKind =
  | 'addResources'
  | 'offerTile'
  | 'placeTile'
  | 'resolveHotspotAt'
  | 'applyProductionAt'
  | 'addNoise'
  | 'moveInfluenceToTile'
  | 'moveObject'
  | 'initMeasures'
  | 'takeMeasure'
  | 'playMeasure'
  | 'resetMeasuresRound';

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

export interface AddNoiseEffect extends BaseEffect {
  kind: 'addNoise';
  resource: ResourceId;
  amount: number;
}

export interface MoveInfluenceToTileEffect extends BaseEffect {
  kind: 'moveInfluenceToTile';
  playerID: string;
  tileId: string;
  count: number; // >=1
}

export interface MoveObjectEffect extends BaseEffect { // AGENTS §3.1 Zones
  kind: 'moveObject';
  object: { kind: 'Influence'; owner: string; id?: string };
  from: { zone: Zone };
  to: { zone: Zone; tileId?: string };
  count: number;
}

export interface InitMeasuresEffect extends BaseEffect {
  kind: 'initMeasures';
  expansion: ExpansionId;
  deck: string[];
  openCount: number;
}
export interface TakeMeasureEffect extends BaseEffect {
  kind: 'takeMeasure';
  expansion: ExpansionId;
  playerID: string;
  measureId: string; // must be from open
}
export interface PlayMeasureEffect extends BaseEffect {
  kind: 'playMeasure';
  expansion: ExpansionId;
  playerID: string;
  measureId: string; // must be in hand
}
export interface ResetMeasuresRoundEffect extends BaseEffect {
  kind: 'resetMeasuresRound';
  expansion: ExpansionId;
}

export type EffectDescriptor =
  | AddResourcesEffect
  | OfferTileEffect
  | PlaceTileEffect
  | ResolveHotspotAtEffect
  | ApplyProductionAtEffect
  | AddNoiseEffect
  | MoveInfluenceToTileEffect
  | MoveObjectEffect
  | InitMeasuresEffect
  | TakeMeasureEffect
  | PlayMeasureEffect
  | ResetMeasuresRoundEffect;

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

function getExp01Measures(G: CoreState): import('./types.js').Exp01MeasuresState | undefined {
  const exp = (G as CoreState & { exp: NonNullable<CoreState['exp']> }).exp;
  const s = exp?.exp01?.measures as import('./types.js').Exp01MeasuresState | undefined;
  return s;
}

function drawFromDeckExp01(G: CoreState): string | undefined {
  const m = getExp01Measures(G); if (!m) return undefined;
  if (m.drawPile.length === 0 && m.recycle.length > 0) {
    // EXP-01-07: Recycle -> Draw reshuffle (deterministic)
    m.drawPile = shuffleSeeded(m.recycle.slice(), G.matchSeed + '|exp01:measures:cycle:' + (m.cycle|0));
    m.recycle.length = 0; m.cycle = (m.cycle|0) + 1;
  }
  return m.drawPile.shift();
}

export function createResolver(modules: ExpansionModule[] = []) {
  const registry = createCoreResourceRegistry();
  const hooks = modules.map((m) => m.hooks).filter(Boolean) as NonNullable<ExpansionModule['hooks']>[];

  function resolveEffect(G: CoreState, effect: EffectDescriptor): ResolveResult {
    // 1) Assign ContextTile (already part of descriptor)
    const immune = isStartCommitteeContext(G, effect.contextCoord); // AGENTS §3.7

    // 2) Prohibitions
    if (!immune) {
      for (const h of hooks) {
        const blocked = h.prohibitions?.({ G, effect });
        if (blocked) return { ok: false, reason: 'prohibited' };
      }
    }

    switch (effect.kind) {
      case 'addResources': {
        // Prepare working copy for atomic cost payment
        const workResources: ResourceAmounts = { ...G.players[effect.playerID]?.personal.resources } as ResourceAmounts;
        // 3) Cost increases
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
        // 5) Floors
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

      case 'offerTile': { // CORE-01-04-06..08 draw/offer pipeline
        G.tiles.drawPile = effect.drawPile.slice();
        G.tiles.discardFaceUp = effect.discardFaceUp.slice();
        G.turn = { pending: effect.pending ? { tileId: effect.pending.tileId, legalCoords: effect.pending.legalCoords } : undefined } as CoreState['turn'];
        return { ok: true };
      }

      case 'placeTile': { // CORE-01-04-08 placement apply
        G.tiles.board.push({ tileId: effect.tileId, coord: effect.coord });
        G.turn = { pending: undefined };
        return { ok: true };
      }

      case 'resolveHotspotAt': { // CORE-01-06-02..03 hotspot resolution
        const placement = G.tiles.board.find(p => p.coord.q===effect.coord.q && p.coord.r===effect.coord.r);
        if (!placement) return { ok: true };
        const tile = G.allTiles[placement.tileId];
        if (!tile || tile.kind !== 'Hotspot') return { ok: true };
        if (!isFullySurrounded(G, effect.coord)) return { ok: true };
        const winner = computeMajority(G, effect.coord);
        if (!winner) return { ok: true };
        const move: MoveInfluenceToTileEffect = { kind: 'moveInfluenceToTile', playerID: winner, tileId: placement.tileId, count: 1, contextCoord: effect.contextCoord ?? effect.coord };
        return resolveEffect(G, move);
      }

      case 'applyProductionAt': { // CORE-01-06-16 production order (ties to Noise per CORE-01-06-15)
        const plan = planProductionForTile(G, effect.coord, modules);
        if (!plan) return { ok: true };
        for (const pid of plan.winners) {
          if (plan.share > 0) {
            const add: AddResourcesEffect = { kind: 'addResources', playerID: pid, resource: plan.resort, amount: plan.share, contextCoord: effect.coord };
            const r = resolveEffect(G, add); if (!r.ok) return r;
          }
        }
        if (plan.remainder > 0) {
          const addN: AddNoiseEffect = { kind: 'addNoise', resource: plan.resort, amount: plan.remainder, contextCoord: effect.coord };
          const r2 = resolveEffect(G, addN); if (!r2.ok) return r2;
        }
        return { ok: true };
      }

      case 'addNoise': { // CORE-01-06-15 remainder to Noise
        const n = Math.max(0, (effect.amount as number) | 0);
        if (n > 0) {
          const noise = G.resources.noise as Record<ResourceId, number>;
          noise[effect.resource] = (noise[effect.resource] ?? 0) + n;
        }
        return { ok: true };
      }

      case 'moveInfluenceToTile': {
        const n = Math.max(1, (effect.count as number) | 0);
        const p = G.players[(effect as MoveInfluenceToTileEffect).playerID];
        if (!p) return { ok: false, reason: 'no-player' };
        if (p.personal.influence.length < n) return { ok: true }; // nothing to move
        for (let i=0;i<n;i++) p.personal.influence.pop();
        if (!G.influencesOnBoard) (G as CoreState & { influencesOnBoard: NonNullable<CoreState['influencesOnBoard']> }).influencesOnBoard = [] as NonNullable<CoreState['influencesOnBoard']>;
        const list = G.influencesOnBoard as NonNullable<CoreState['influencesOnBoard']>;
        const rec = list.find((r) => r.tileId === (effect as MoveInfluenceToTileEffect).tileId && r.owner === p.id);
        if (rec) rec.count += n; else list.push({ tileId: (effect as MoveInfluenceToTileEffect).tileId, owner: p.id, count: n });
        return { ok: true };
      }

            case 'moveObject': { // AGENTS §3.1 Zones — generic wrapper
        const mo = effect as MoveObjectEffect;
        if (mo.object.kind === 'Influence' && mo.from.zone === 'PersonalSupply' && mo.to.zone === 'Board' && mo.to.tileId) {
          const placement = G.tiles.board.find(p => p.tileId === mo.to.tileId);
          const coord = placement?.coord ?? effect.contextCoord;
          const move: MoveInfluenceToTileEffect = { kind: 'moveInfluenceToTile', playerID: mo.object.owner, tileId: mo.to.tileId, count: mo.count, contextCoord: coord };
          return resolveEffect(G, move);
        }
        return { ok: false, reason: 'unsupported-move' };
      }

            case 'initMeasures': { // EXP-01-02-E zones; EXP-01-07 lifecycle setup
        const { expansion, deck, openCount } = effect as InitMeasuresEffect;
        if (expansion !== 'exp01') return { ok: true };
        if (!G.exp) (G as CoreState & { exp: NonNullable<CoreState['exp']> }).exp = {};
        if (!(G.exp as NonNullable<CoreState['exp']>).exp01) (G.exp as NonNullable<CoreState['exp']>).exp01 = {};
        const state: import('./types.js').Exp01MeasuresState = {
          drawPile: shuffleSeeded(deck, G.matchSeed + '|exp01:measures:init'),
          open: [], recycle: [], finalDiscard: [],
          hands: Object.fromEntries(Object.keys(G.players).map(pid => [pid, [] as string[]])),
          usedThisRound: Object.fromEntries(Object.keys(G.players).map(pid => [pid, false])),
          playCounts: {},
          cycle: 0,
        };
        for (let i=0; i<openCount; i++) {
          const d = state.drawPile.shift(); if (!d) break; state.open.push(d);
        }
        (G.exp as NonNullable<CoreState['exp']>).exp01.measures = state;
        return { ok: true };
      }

      case 'takeMeasure': { // EXP-01-06-03 hand limit; EXP-01-07 open refill w/ recycle reshuffle
        const { expansion, playerID, measureId } = effect as TakeMeasureEffect;
        if (expansion !== 'exp01') return { ok: true };
        const m = getExp01Measures(G); if (!m) return { ok: true };
        const pid = String(playerID); const hand = (m.hands[pid] ?? (m.hands[pid] = []));
        if (hand.length >= 2) return { ok: false, reason: 'hand-full' };
        const idx = m.open.indexOf(measureId); if (idx < 0) return { ok: false, reason: 'not-open' };
        m.open.splice(idx,1); hand.push(measureId);
        while (m.open.length < 3) {
          const d = drawFromDeckExp01(G);
          if (!d) break; m.open.push(d);
        }
        return { ok: true };
      } {
        const { expansion, playerID, measureId } = effect as TakeMeasureEffect;
        if (expansion !== 'exp01') return { ok: true };
        const m = getExp01Measures(G); if (!m) return { ok: true };
        const pid = String(playerID); const hand = (m.hands[pid] ?? (m.hands[pid] = []));
        if (hand.length >= 2) return { ok: false, reason: 'hand-full' };
        const idx = m.open.indexOf(measureId); if (idx < 0) return { ok: false, reason: 'not-open' };
        m.open.splice(idx,1);
        hand.push(measureId);
        if (m.drawPile.length > 0) m.open.push(m.drawPile.shift()!);
        return { ok: true };
      }

            case 'playMeasure': { // EXP-01-06-02 Play limit per round; EXP-01-07 recycle/final discard cycling
        const { expansion, playerID, measureId } = effect as PlayMeasureEffect;
        if (expansion !== 'exp01') return { ok: true };
        const m = getExp01Measures(G); if (!m) return { ok: true };
        const pid2 = String(playerID);
        if (m.usedThisRound[pid2]) return { ok: false, reason: 'limit-per-round' };
        const hand = m.hands[pid2] ?? [];
        const idx = hand.indexOf(measureId); if (idx < 0) return { ok: false, reason: 'not-in-hand' };
        hand.splice(idx,1);
        const c = (m.playCounts[measureId] ?? 0) + 1; m.playCounts[measureId] = c;
        if (c >= 2) m.finalDiscard.push(measureId); else m.recycle.push(measureId);
        m.usedThisRound[pid2] = true;
        if (!G.turn) (G as CoreState & { turn: NonNullable<CoreState['turn']> }) .turn = {} as NonNullable<CoreState['turn']>;
        (G.turn as NonNullable<CoreState['turn']>).allowExtraPoliticalAction = true;
        (G.turn as NonNullable<CoreState['turn']>).bannedMoveType = 'exp01_playMeasure';
        return { ok: true };
      }

      case 'resetMeasuresRound': {
        const { expansion } = effect as ResetMeasuresRoundEffect;
        if (expansion !== 'exp01') return { ok: true };
        const m = getExp01Measures(G); if (!m) return { ok: true };
        for (const pid of Object.keys(m.usedThisRound)) m.usedThisRound[pid] = false;
        return { ok: true };
      }

      default:
        return { ok: false, reason: 'unknown-effect' };
    }
  }

  return resolveEffect;
}
