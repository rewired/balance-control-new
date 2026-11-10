import { isProhibited, planProductionForTile, productionReceipt } from '@bc/exp-00-core';
import { regulationPlacementPrice } from '@bc/exp-02-security';
import {
  computeMajority, createExpansionRegistry, getTopology, measureBaseCost, type ActiveMeasureEffect, type BoardPlacement,
  type CoreState, type ExpansionModule, type RegulationKind, type RegulationOperation, type Tile,
} from '@bc/rules';
import type { EngineMoveOption } from './legal-options.js';

type Site = BoardPlacement & { tile: Tile; controller: string | null; enclosure: number };
type Card = { id: string; module: ExpansionModule };

const PRODUCTION_VALUE = 5;
const SEC_PREPARATION_VALUE = 3.5;

export function inspectExpansions(G: CoreState) {
  const [, ...modules] = createExpansionRegistry(G.cfg.expansions);
  if (!modules.length) return undefined;

  const { allTiles, tiles, players, activeMeasureEffects = [] } = G.exp.core;
  const longTerm: CoreState = activeMeasureEffects.length ? {
    ...G, exp: { ...G.exp, core: { ...G.exp.core, activeMeasureEffects: undefined } },
  } : G;
  const attached = G.exp.exp02?.regulations?.attached ?? [];
  const security = modules.some(module => module.id === 'exp02');
  const placementPrice = security ? regulationPlacementPrice(G).amount : 0;
  const topology = getTopology(G.cfg.topology);
  const sites = new Map<string, Site>(tiles.board.map(placement => {
    const tile = allTiles[placement.tileId];
    const enclosure = tile.kind === 'Hotspot' && !placement.enclosureProcessed
      ? topology.neighbors(placement.coord).filter(coord =>
        tiles.board.some(other => other.coord.q === coord.q && other.coord.r === coord.r)).length : 0;
    return [placement.tileId, { ...placement, tile, controller: computeMajority(G, placement.coord), enclosure }];
  }));
  const board = [...sites.values()];
  const regulationsAt = new Map<string, typeof attached>();
  for (const regulation of attached) {
    const regulations = regulationsAt.get(regulation.tileId);
    if (regulations) regulations.push(regulation);
    else regulationsAt.set(regulation.tileId, [regulation]);
  }
  const hasBlockade = (tileId: string) => regulationsAt.get(tileId)?.some(regulation => regulation.kind === 'Blockade');
  const hooks = modules.flatMap(module => module.hooks ?? []);
  const market = modules.flatMap(module => (G.exp[module.id]?.measures?.open ?? [])
    .flatMap(id => id ? [{ id, module }] : []));
  const hand = (playerID: string) => modules.flatMap(module => (G.exp[module.id]?.measures?.hands[playerID] ?? [])
    .map(id => ({ id, module })));

  // Estimate the opportunity lost by a tile's controller. Production itself uses the canonical planner below.
  function disruption(site: Site | undefined, kind: RegulationKind): number {
    if (!site || site.controller === null) return 0;
    const strong = kind === 'Blockade' || kind === 'SecurityLevel';
    switch (site.tile.kind) {
      case 'ResortTile':
        return kind === 'Blockade' ? PRODUCTION_VALUE * site.tile.w : kind === 'SecurityLevel' ? PRODUCTION_VALUE : 0;
      case 'Grassroots':
      case 'Committee':
        return strong ? 9 : 2;
      case 'Hotspot':
        if (site.enclosure < 4 || !strong) return 0;
        if (site.tile.hotspotOutcome === 'regulation') {
          return kind === 'Blockade' && ((players[site.controller].personal.resources.SEC ?? 0) >= placementPrice
            || attached.length > 0) ? 12 : 0;
        }
        return players[site.controller].personal.influence.length > 0 ? 12 : 0;
      case 'AuthorityApparatus':
        return attached.length ? kind === 'Blockade' ? 6 : kind === 'Control' ? 2 : 0 : 0;
      default:
        return 0;
    }
  }

  function placementValue(site: Site | undefined, kind: RegulationKind, playerID: string): number {
    const value = disruption(site, kind);
    return site?.controller === playerID ? -value : value;
  }

  function regulationValue(operation: RegulationOperation, playerID: string): number {
    if (operation.operation === 'place') {
      if (hasBlockade(operation.tileId)) return 0;
      return placementValue(sites.get(operation.tileId), operation.regulationKind, playerID);
    }
    const removed = attached.filter(regulation => operation.operation === 'removeAll'
      ? regulation.tileId === operation.tileId : regulation.id === operation.regulationId);
    return removed.reduce((value, { kind, tileId }) => value - placementValue(sites.get(tileId), kind, playerID)
      + (operation.operation === 'move' ? placementValue(sites.get(operation.tileId), kind, playerID) : 0), 0);
  }

  const openRivals = (playerID: string) => board.filter(site => site.controller !== null && site.controller !== playerID
    && !hasBlockade(site.tileId));

  function cardPlan({ id, module }: Card, playerID: string, rivals: Site[]) {
    const rule = module.measureRules?.[id];
    if (!rule) return { value: 0, sec: 0 };
    const stock = players[playerID].personal.resources;
    const cost = measureBaseCost(G, module, id);
    let upside = 4;
    let sec = cost.SEC ?? 0;
    // These cards need a second budget for their immediate or registered placement.
    if (id === 'SEC_M01' || id === 'SEC_M02' || id === 'SEC_M12') {
      // EXP-02-08-M01-03, EXP-02-08-M02-03/-04 and EXP-02-08-M12-03/-04.
      const targets = id === 'SEC_M01' ? rivals : rivals.filter(site => site.tile.kind === 'Hotspot');
      upside = Math.max(0, ...targets.map(site => disruption(site, 'Blockade')));
      sec += placementPrice;
    } else if (rule.extensionTarget) {
      upside = 0;
      for (const { regulation, targetRegulationId } of rule.extensionTarget.options(G)) {
        if (regulation) upside = Math.max(upside, regulationValue(regulation, playerID));
        const target = targetRegulationId && attached.find(item => item.id === targetRegulationId);
        if (target && target.kind !== 'Blockade') {
          upside = Math.max(upside, placementValue(sites.get(target.tileId), target.kind, playerID));
        }
      }
    } else if (id === 'ECO_M02') {
      upside = Math.max(0, ...board.map(site =>
        site.controller === playerID && site.tile.kind === 'ResortTile' ? PRODUCTION_VALUE * site.tile.w : 0));
    } else if (id === 'SEC_M11' || id === 'CLM_M04') {
      upside = Math.max(0, ...Object.keys(players).filter(id => id !== playerID).map(id => hand(id).length * 5));
    } else if (id === 'ECO_M10' && G.cfg.variants.measureRegulationAccess) {
      // EXP-01-08-M10-04: without a possible surcharge there is nothing to replace.
      upside = activeMeasureEffects.length || attached.some(item => item.kind === 'Control' || item.kind === 'Administration') ? 4 : 0;
    } else if (rule.targetTile && !board.some(site => rule.targetTile?.(G, playerID, site.tile, site.coord))) {
      upside = 0;
    }
    const otherMissing = Object.entries(cost).reduce((sum, [resource, amount]) =>
      sum + (resource === 'SEC' ? 0 : Math.max(0, (amount ?? 0) - (stock[resource] ?? 0))), 0);
    return {
      value: Math.max(0, Math.min(id === 'ECO_M02' ? 1.5 : 5, upside / 3) - 1.5 * otherMissing),
      sec: upside >= (G.cfg.variants.measureRegulationAccess ? 4 : PRODUCTION_VALUE) && otherMissing <= 1 ? sec : 0,
    };
  }

  function activeOperation(effect: ActiveMeasureEffect): RegulationOperation | undefined {
    if (effect.regulation) return effect.regulation;
    // EXP-02-08-M02-03: score the public, registered objective if the enclosure is close.
    if (effect.sourceCardId === 'SEC_M02' && effect.targetTileId) {
      return { operation: 'place', regulationKind: 'Blockade', tileId: effect.targetTileId };
    }
  }

  function tactics(playerID: string, includeMarket = security) {
    const rivals = openRivals(playerID);
    const cards = hand(playerID).map(card => cardPlan(card, playerID, rivals));
    const marketPlans = new Map(includeMarket ? market.map(card => [card.id, cardPlan(card, playerID, rivals)]) : []);
    const innerOrder = board.some(site => site.tile.kind === 'Hotspot' && site.tile.hotspotOutcome === 'regulation'
      && site.controller === playerID && site.enclosure >= 4);
    const apparatus = G.cfg.variants.measureRegulationAccess
      && board.some(site => site.tile.kind === 'AuthorityApparatus' && site.controller === playerID && !hasBlockade(site.tileId))
      && rivals.some(site => disruption(site, 'SecurityLevel') >= PRODUCTION_VALUE);
    const pendingPlacement = activeMeasureEffects.some(effect => {
      if (effect.owner !== playerID || effect.used) return false;
      const operation = activeOperation(effect);
      return operation?.operation === 'place' && regulationValue(operation, playerID) > 0;
    });
    const secGoal = Math.max(0, ...cards.map(card => card.sec),
      pendingPlacement || apparatus || (innerOrder && rivals.some(site => disruption(site, 'Blockade') > 0)) ? placementPrice : 0);
    const marketGoal = Math.max(0, ...Array.from(marketPlans.values(), plan => plan.sec));
    const stock = players[playerID].personal.resources;
    const hasGrassroots = board.some(site => site.controller === playerID && site.tile.kind === 'Grassroots'
      && !hasBlockade(site.tileId) && (regulationsAt.get(site.tileId)?.filter(regulation => regulation.kind === 'SecurityLevel').length ?? 0)
        < (G.cfg.variants.measureRegulationAccess ? 2 : 1));
    return { cards, marketPlans, secGoal, stock, hasGrassroots, grassNeeded: (stock.SEC ?? 0) < Math.max(secGoal, marketGoal) };
  }

  function scoreProduction(scores: Record<string, number>, state: CoreState, site: Site, weight: number) {
    const effect = { kind: 'applyProductionAt' as const, coord: site.coord, contextCoord: site.coord };
    if (isProhibited(state, effect, hooks)) return;
    const production = planProductionForTile(state, site.coord, modules);
    if (!production) return;
    for (const id of production.winners) {
      scores[id] += weight * productionReceipt(state, id, production.share, hooks);
    }
  }

  function score(scores: Record<string, number>) {
    for (const site of board) {
      if (site.tile.kind === 'ResortTile') {
        // Price the next receipt with active Measures, and future receipts with persistent Regulations only.
        scoreProduction(scores, longTerm, site, longTerm === G ? PRODUCTION_VALUE : PRODUCTION_VALUE - 1);
        if (longTerm !== G) scoreProduction(scores, G, site, 1);
      } else if (site.controller !== null) {
        const regulations = regulationsAt.get(site.tileId) ?? [];
        scores[site.controller] -= Math.max(0, ...regulations.map(regulation => disruption(site, regulation.kind)));
      }
    }
    for (const id of Object.keys(players)) {
      const { cards, secGoal, stock, hasGrassroots, grassNeeded } = tactics(id);
      scores[id] += cards.reduce((sum, card) => sum + card.value, 0);
      if (hasGrassroots && (grassNeeded || secGoal > 0)) scores[id] += 5;
      // Fund one objective at a time. Surplus SEC keeps its ordinary resource value.
      scores[id] += SEC_PREPARATION_VALUE * Math.min(stock.SEC ?? 0, secGoal);
    }
    for (const effect of activeMeasureEffects) {
      const operation = activeOperation(effect);
      if (operation && !effect.used) {
        const stock = players[effect.owner].personal.resources;
        if (operation.operation !== 'place' || (stock.SEC ?? 0) >= placementPrice) {
          scores[effect.owner] += Math.max(0, regulationValue(operation, effect.owner)) / 2;
        }
      }
      // EXP-02-08-M11-03 and EXP-03-08-M04-05: a ban matters when its target has cards to play.
      if ((effect.sourceCardId === 'SEC_M11' || effect.sourceCardId === 'CLM_M04') && effect.targetPlayerID) {
        scores[effect.targetPlayerID] -= 5 * hand(effect.targetPlayerID).length;
      }
    }
  }

  function preferred(options: readonly EngineMoveOption[], playerID: string, limit: number): EngineMoveOption[] {
    const { marketPlans, secGoal, stock, hasGrassroots, grassNeeded } = tactics(playerID, true);
    const best = new Map<string, { option: EngineMoveOption; value: number }>();
    for (const option of options) {
      if (option.moveType === 'placeTile') continue;
      const action = option.parameters[0] as {
        type?: string; regulation?: RegulationOperation;
        payload?: { measureId?: string; output?: string; targetTileId?: string; regulation?: RegulationOperation };
      };
      const { type = option.moveType, payload } = action;
      const id = payload?.measureId;
      const operation = action.regulation ?? payload?.regulation;
      const site = payload?.targetTileId ? sites.get(payload.targetTileId) : undefined;
      let value = 0;
      if (operation) value = regulationValue(operation, playerID);
      else if (id && type.endsWith('_takeMeasure')) value = marketPlans.get(id)?.value ?? 0;
      else if (id && site?.tile.kind === 'ResortTile') {
        const friendly = site.controller === playerID;
        if (id === 'ECO_M02' && friendly) value = PRODUCTION_VALUE * site.tile.w;
        if ((id === 'ECO_M04' || id === 'ECO_M05') && site.controller !== null && !friendly) value = PRODUCTION_VALUE;
      } else if (type === 'convertResources' && payload?.output === 'SEC' && (stock.SEC ?? 0) < secGoal) {
        value = 10;
      } else if (type === 'placeOrMoveInfluence' && grassNeeded && !hasGrassroots && site?.tile.kind === 'Grassroots'
        && site.controller !== playerID) {
        value = 5;
      }
      if (value <= 0) continue;
      const cost = option.costBreakdown.reduce((sum, item) => sum + (item.playerID === playerID
        ? item.amount * (item.resource === 'SEC' && (stock.SEC ?? 0) <= secGoal ? 3 : 1) : 0), 0);
      const key = id ?? type;
      if (value - cost > (best.get(key)?.value ?? -Infinity)) {
        best.set(key, { option, value: value - cost });
      }
    }
    return Array.from(best.values()).sort((a, b) => b.value - a.value).slice(0, limit).map(({ option }) => option);
  }

  return { score, preferred };
}
