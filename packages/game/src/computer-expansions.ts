import { isProhibited, modifyOutput, planProductionForTile, productionReceipt } from '@bc/exp-00-core';
import { regulationPlacementPrice } from '@bc/exp-02-security';
import {
  computeMajority, createExpansionRegistry, getTopology, type ActiveMeasureEffect, type BoardPlacement,
  type CoreState, type ExpansionModule, type RegulationKind, type RegulationOperation, type ResourceAmounts, type Tile,
} from '@bc/rules';
import type { EngineMoveOption } from './legal-options.js';
import { resourceValue } from './computer-priorities.js';

type Site = BoardPlacement & { tile: Tile; controller: string | null; enclosure: number };
type Card = { id: string; module: ExpansionModule };
type CardPlan = { value: number; budget: Readonly<Partial<ResourceAmounts>>; missing: ResourceAmounts };

const PRODUCTION_VALUE = 5;

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

  function cardPlan({ id, module }: Card, playerID: string, rivals: Site[], income: ResourceAmounts, hasGrassroots: boolean): CardPlan {
    const rule = module.measureRules?.[id];
    if (!rule) return { value: 0, budget: {}, missing: {} };
    const stock = players[playerID].personal.resources;
    const budget = { ...rule.cost };
    let upside = 4;
    // These cards need a second budget for their immediate or registered placement.
    if (id === 'SEC_M01' || id === 'SEC_M02' || id === 'SEC_M12') {
      // EXP-02-08-M01-03, EXP-02-08-M02-03/-04 and EXP-02-08-M12-03/-04.
      const targets = id === 'SEC_M01' ? rivals : rivals.filter(site => site.tile.kind === 'Hotspot');
      upside = Math.max(0, ...targets.map(site => disruption(site, 'Blockade')));
      budget.SEC = (budget.SEC ?? 0) + placementPrice;
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
        site.controller === playerID && site.tile.kind === 'ResortTile' ? 3 * site.tile.w : 0));
    } else if (id === 'SEC_M11' || id === 'CLM_M04') {
      upside = Math.max(0, ...Object.keys(players).filter(id => id !== playerID).map(id => hand(id).length * 5));
    } else if (rule.targetTile && !board.some(site => rule.targetTile?.(G, playerID, site.tile, site.coord))) {
      upside = 0;
    }
    const missing: ResourceAmounts = {};
    let preparation = 0;
    for (const [resource, amount] of Object.entries(budget)) {
      const need = Math.max(0, (amount ?? 0) - (stock[resource] ?? 0));
      if (!need) continue;
      missing[resource] = need;
      const canTrade = hasGrassroots && Object.entries(stock).some(([input, count]) => input !== resource && count >= 3);
      const uncovered = Math.max(0, need - (income[resource] ?? 0));
      preparation += 5 * need + (canTrade ? 0 : 9) * uncovered;
    }
    return { value: upside > 0 ? Math.max(0, 8 + Math.min(18, 1.2 * upside) - preparation) : 0, budget, missing };
  }

  function activeOperation(effect: ActiveMeasureEffect): RegulationOperation | undefined {
    if (effect.regulation) return effect.regulation;
    // EXP-02-08-M02-03: score the public, registered objective if the enclosure is close.
    if (effect.sourceCardId === 'SEC_M02' && effect.targetTileId) {
      return { operation: 'place', regulationKind: 'Blockade', tileId: effect.targetTileId };
    }
  }

  function tactics(playerID: string, income: ResourceAmounts) {
    const rivals = openRivals(playerID);
    const cards = hand(playerID);
    const hasGrassroots = board.some(site => site.controller === playerID && site.tile.kind === 'Grassroots'
      && !regulationsAt.get(site.tileId)?.some(regulation => regulation.kind === 'Blockade' || regulation.kind === 'SecurityLevel'));
    const handPlans = cards.map(card => cardPlan(card, playerID, rivals, income, hasGrassroots));
    // EXP-01-06-03/-04B: all expansions share the hand limit.
    const marketPlans = new Map(cards.length < 2
      ? market.map(card => [card.id, cardPlan(card, playerID, rivals, income, hasGrassroots)]) : []);
    const bestHeld = handPlans.reduce<CardPlan>((best, plan) => plan.value > best.value ? plan : best,
      { value: 0, budget: {}, missing: {} });
    const bestMarket = Math.max(0, ...Array.from(marketPlans.values(), plan => plan.value));
    const innerOrder = board.some(site => site.tile.kind === 'Hotspot' && site.tile.hotspotOutcome === 'regulation'
      && site.controller === playerID && site.enclosure >= 4);
    const pendingPlacement = activeMeasureEffects.some(effect => {
      if (effect.owner !== playerID || effect.used) return false;
      const operation = activeOperation(effect);
      return operation?.operation === 'place' && regulationValue(operation, playerID) > 0;
    });
    const secGoal = pendingPlacement || (innerOrder && rivals.some(site => disruption(site, 'Blockade') > 0)) ? placementPrice : 0;
    const stock = players[playerID].personal.resources;
    const missing = { ...bestHeld.missing };
    if ((stock.SEC ?? 0) < secGoal) missing.SEC = Math.max(missing.SEC ?? 0, secGoal - (stock.SEC ?? 0));
    return { bestHeld, bestMarket, marketPlans, missing, secGoal, stock, hasGrassroots };
  }

  function productionForecast(state: CoreState): Record<string, ResourceAmounts> {
    const income: Record<string, ResourceAmounts> = Object.fromEntries(Object.keys(players).map(id => [id, {}]));
    for (const site of board) {
      if (site.tile.kind !== 'ResortTile') continue;
      const effect = { kind: 'applyProductionAt' as const, coord: site.coord, contextCoord: site.coord };
      if (isProhibited(state, effect, hooks)) continue;
      const production = planProductionForTile(state, site.coord, modules);
      if (!production) continue;
      for (const id of production.winners) {
        const { resort, share } = production;
        income[id][resort] = (income[id][resort] ?? 0) + productionReceipt(state, id, share, hooks);
      }
    }
    return income;
  }

  let nextIncome: Record<string, ResourceAmounts> | undefined;
  const nextProduction = () => nextIncome ??= productionForecast(G);
  const playerPlans = new Map<string, ReturnType<typeof tactics>>();
  function playerPlan(playerID: string) {
    const cached = playerPlans.get(playerID);
    if (cached) return cached;
    const plan = tactics(playerID, nextProduction()[playerID]);
    playerPlans.set(playerID, plan);
    return plan;
  }

  function score(scores: Record<string, number>) {
    // Use the canonical production plan and value a one-settlement boost separately from permanent income.
    const next = nextProduction();
    const future = longTerm === G ? next : productionForecast(longTerm);
    for (const site of board) {
      if (site.tile.kind !== 'ResortTile' && site.controller !== null) {
        const regulations = regulationsAt.get(site.tileId) ?? [];
        scores[site.controller] -= Math.max(0, ...regulations.map(regulation => disruption(site, regulation.kind)));
      }
    }
    for (const id of Object.keys(players)) {
      const { bestHeld, bestMarket, secGoal, stock } = playerPlan(id);
      // One viable card is a plan. Additional hand cards do not earn a stockpiling bonus.
      scores[id] += 0.65 * bestHeld.value + bestMarket / 4;
      scores[id] += 5 * Math.min(stock.SEC ?? 0, secGoal);
      for (const resource of Object.keys(stock)) {
        const lasting = resourceValue(future[id][resource] ?? 0);
        const immediate = resourceValue(next[id][resource] ?? 0);
        scores[id] += 3 * lasting + 2 * immediate;
      }
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

  function playValue(option: EngineMoveOption, playerID: string): number {
    if (option.moveType !== 'doPoliticalAction') return 0;
    const { type, payload } = option.parameters[0] as { type: string; payload: {
      measureId?: string; targetTileId?: string; regulation?: RegulationOperation;
    } };
    if (!type.endsWith('_playMeasure')) return 0;
    const site = payload.targetTileId ? sites.get(payload.targetTileId) : undefined;
    if (payload.regulation) return 0.8 * regulationValue(payload.regulation, playerID);
    if (payload.measureId === 'ECO_M02' && site?.tile.kind === 'ResortTile') {
      return site.controller === playerID ? 4 * site.tile.w : 0;
    }
    if ((payload.measureId === 'ECO_M04' || payload.measureId === 'ECO_M05') && site?.tile.kind === 'ResortTile') {
      return site.controller && site.controller !== playerID ? 5 : 0;
    }
    const card = hand(playerID).find(({ id }) => id === payload.measureId);
    // An already legal play can use the printed effect now, without spending a turn on acquiring or funding the card.
    return card ? Math.min(8, cardPlan(card, playerID, openRivals(playerID), {}, false).value / 2) : 0;
  }

  function fundingValue(option: EngineMoveOption, playerID: string): number {
    if (option.moveType !== 'doPoliticalAction') return 0;
    const { type, payload } = option.parameters[0] as { type: string; payload: { tileId: string; input: string; output: string } };
    if (type !== 'convertResources') return 0;
    const { bestHeld, secGoal, stock } = playerPlan(playerID);
    const budget = { ...bestHeld.budget };
    if (secGoal) budget.SEC = Math.max(secGoal, budget.SEC ?? 0);
    if ((budget[payload.output] ?? 0) <= (stock[payload.output] ?? 0)) return 0;
    const contextCoord = sites.get(payload.tileId)?.coord;
    // CORE-01-04-22D and EXP-02-04-B-05: credit the exchange output after modifiers, excluding later Settlement.
    const output = modifyOutput(G, { ...payload, kind: 'convertResources', playerID, contextCoord }, hooks, 1);
    const nextStock = { ...stock, [payload.output]: (stock[payload.output] ?? 0) + output };
    for (const cost of option.costBreakdown) {
      if (cost.playerID === playerID) nextStock[cost.resource] -= cost.amount;
    }
    const gap = (resources: ResourceAmounts) => Object.entries(budget).reduce((sum, [resource, amount]) =>
      sum + Math.max(0, (amount ?? 0) - (resources[resource] ?? 0)), 0);
    return 12 * Math.max(0, gap(stock) - gap(nextStock));
  }

  function preferred(options: readonly EngineMoveOption[], playerID: string, limit: number): EngineMoveOption[] {
    const { marketPlans, missing, hasGrassroots } = playerPlan(playerID);
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
      } else if (type === 'convertResources' && payload?.output && missing[payload.output] > 0) {
        value = 16;
      } else if (type === 'placeOrMoveInfluence' && Object.keys(missing).length > 0 && !hasGrassroots && site?.tile.kind === 'Grassroots'
        && site.controller !== playerID) {
        value = 5;
      }
      if (value <= 0) continue;
      const cost = option.costBreakdown.reduce((sum, item) => sum + (item.playerID === playerID
        ? item.amount * (missing[item.resource] > 0 ? 3 : 1) : 0), 0);
      const key = id ?? payload?.output ?? type;
      if (value - cost > (best.get(key)?.value ?? -Infinity)) {
        best.set(key, { option, value: value - cost });
      }
    }
    return Array.from(best.values()).sort((a, b) => b.value - a.value).slice(0, limit).map(({ option }) => option);
  }

  return { score, preferred, playValue, fundingValue };
}
