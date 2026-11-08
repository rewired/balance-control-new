import { shuffleSeeded, stableHash } from '@bc/shared';
import {
  budgetDeficitIds, createExpansionRegistry, createMatchResourceRegistry, ensureExpansionSlice,
  getRegulationRules, getTopology, greenwashingResources, paymentPlans,
  type ActiveMeasureEffect, type AddResourcesEffect, type AxialCoord, type CoreState,
  type DecisionQuote, type DrawTileEffect, type EffectDescriptor, type EffectResolver,
  type ExpansionHooks, type ExpansionId, type ExpansionModule, type ExpireMeasureEffects, type Influence,
  type MeasureDeckState, type PaymentQuote, type PendingHotspot, type PendingRegulationChoice, type PlaceTileEffect,
  type PlayMeasureEffect, type PoliticalActionEffect, type RegisterMeasureEffect,
  type ResolveHotspotAtEffect, type ResolveRegulationEffect, type ResolveResult,
  type ResourceAmounts, type ResourceId, type ResourceRegistry, type RulesModule, type Surcharge, type TakeMeasureEffect,
} from '@bc/rules';
import { isFullySurrounded } from './hotspot.js';
import { planProductionForTile } from './production.plan.js';
import { computeMajority, getControl } from './majority.js';
import { isLegalPlacement, legalPlacementCoords } from './placement.js';
import { coreStateForHash } from './state-migration.js';

function findTileAt(G: CoreState, coord?: AxialCoord) {
  if (!coord) return undefined;
  return G.exp.core.tiles.board.find((p) => p.coord.q === coord.q && p.coord.r === coord.r);
}

function isStartCommitteeContext(G: CoreState, coord?: AxialCoord): boolean {
  const p = findTileAt(G, coord);
  if (!p) return false;
  const t = G.exp.core.allTiles[p.tileId];
  return !!t && t.kind === 'StartCommittee';
}

type BankTransfer = { resource: ResourceId; amount: number } & (
  | { from: 'PersonalSupply'; to: 'Bank'; playerID: string }
  | { from: 'Bank'; to: 'PersonalSupply'; playerID: string }
  | { from: 'Bank'; to: 'Noise' }
);

function isResourceCount(value: number): boolean {
  return Number.isSafeInteger(value) && value >= 0;
}

function copyBalances(amounts: ResourceAmounts): ResourceAmounts {
  return Object.assign(Object.create(null), amounts);
}

// CORE-01-00-04A through -04D and CORE-01-06-00-11: stage all transfers before writing any zone.
function createBankTransaction(G: CoreState, registry: ResourceRegistry) {
  const bank = copyBalances(G.exp.core.resources.bank);
  const noise = copyBalances(G.exp.core.resources.noise);
  const supplies = new Map<string, ResourceAmounts>();
  let changed = false;

  function transfer({ resource, amount, ...route }: BankTransfer): ResolveResult {
    if (!registry.has(resource)) return { ok: false, reason: 'inactive-resource' };
    if (!isResourceCount(amount)) return { ok: false, reason: 'invalid-resource-amount' };

    let account = noise;
    if (route.to !== 'Noise') {
      const { playerID } = route;
      if (!Object.hasOwn(G.exp.core.players, playerID)) return { ok: false, reason: 'no-player' };
      account = supplies.get(playerID) ?? copyBalances(G.exp.core.players[playerID].personal.resources);
      supplies.set(playerID, account);
    }
    if (amount === 0) return { ok: true };

    const available = bank[resource] ?? 0;
    const balance = account[resource] ?? 0;
    if (!isResourceCount(available) || !isResourceCount(balance)) {
      return { ok: false, reason: 'invalid-resource-balance' };
    }
    if (route.from === 'PersonalSupply' && balance < amount) {
      return { ok: false, reason: 'insufficient' };
    }

    // CORE-01-00-04B: missing bank stock is created and immediately transferred.
    const bankAfter = route.from === 'Bank' ? Math.max(0, available - amount) : available + amount;
    const accountAfter = route.from === 'Bank' ? balance + amount : balance - amount;
    if (!isResourceCount(bankAfter) || !isResourceCount(accountAfter)) {
      return { ok: false, reason: 'invalid-resource-balance' };
    }
    bank[resource] = bankAfter;
    account[resource] = accountAfter;
    changed = true;
    return { ok: true };
  }

  function commit(): void {
    if (!changed) return;
    G.exp.core.resources = { bank, noise };
    for (const [playerID, balances] of supplies) G.exp.core.players[playerID].personal.resources = balances;
  }

  return { transfer, commit };
}

// CORE-01-06-00-07(b) and -11: build the complete payment without mutating game zones.
type PaymentPreview = true | ((quote: PaymentQuote) => void) | ReadonlySet<string>;

function planPayment(
  G: CoreState,
  registry: ResourceRegistry,
  effect: EffectDescriptor & { playerID: string },
  hooks: readonly ExpansionHooks[],
  baseCost?: Partial<ResourceAmounts>,
  preview?: PaymentPreview,
): { ok: true; transaction: ReturnType<typeof createBankTransaction> } | { ok: false; reason?: string } {
  const cost: Partial<ResourceAmounts> = Object.assign(Object.create(null), baseCost);
  const units: Surcharge[] = [];
  for (const hook of hooks) {
    const delta = hook.costIncreases?.({ G, effect, cost });
    for (const [resource, amount] of Object.entries(delta ?? {})) cost[resource] = (cost[resource] ?? 0) + (amount ?? 0);
    const additional = hook.surcharges?.({ G, effect, cost });
    if (additional) units.push(...additional);
  }
  for (const [resource, amount] of Object.entries(cost)) {
    if (!registry.has(resource)) return { ok: false, reason: 'inactive-resource' };
    if (!isResourceCount(amount ?? 0)) return { ok: false, reason: 'invalid-resource-amount' };
  }
  let first: ReturnType<typeof createBankTransaction> | undefined;
  let reason = effect.payment ? 'invalid-or-unpayable-cost' : 'insufficient';
  const explore = preview === true || typeof preview === 'function';
  const unpaidDeficits = typeof preview === 'object' ? preview : undefined;
  const plans = paymentPlans(G, registry, effect, cost, units, isStartCommitteeContext(G, effect.contextCoord), hooks, explore, unpaidDeficits);
  for (const selected of plans) {
    const transaction = createBankTransaction(G, registry);
    const result = selected.transfers.map(route => transaction.transfer({ from: 'PersonalSupply', to: 'Bank', ...route }))
      .find(transfer => !transfer.ok);
    if (result) {
      reason = result.reason ?? reason;
      continue;
    }
    first ??= { ...transaction, commit: () => {
      transaction.commit();
      // CORE-01-06-00-11, EXP-01-08-M08-05 and EXP-03-08-M13-09: usage follows successful payment.
      const council = G.exp.core.activeMeasureEffects?.find(instance => instance.id === selected.useCouncil);
      if (council) council.used = true;
      consumeMeasureEffects(G, selected.consumeEffects);
    } };
    if (typeof preview !== 'function') break;
    preview({
      ...(selected.selection ? { payment: selected.selection } : {}),
      costBreakdown: selected.transfers,
      contextTile: effect.kind === 'placeTile' ? effect.tileId : findTileAt(G, effect.contextCoord)?.tileId ?? null,
    });
  }
  return first ? { ok: true, transaction: first } : { ok: false, reason };
}

function isProhibited(G: CoreState, effect: EffectDescriptor, hooks: readonly ExpansionHooks[]): boolean {
  // EXP-02-04-B-01 and CORE-01-06-00-07(c): check Blockade first, then other prohibitions, before pricing.
  const context = { G, effect };
  return hooks.some(hook => hook.blockade?.(context)) || hooks.some(hook => hook.prohibitions?.(context));
}

function modifyOutput(G: CoreState, effect: EffectDescriptor, hooks: readonly ExpansionHooks[], baseAmount: number): number {
  let amount = baseAmount;
  for (const hook of hooks) amount = hook.outputModifiers?.({ G, effect, amount }) ?? amount;
  return Math.max(0, amount);
}

function consumeMeasureEffects(G: CoreState, ids: readonly string[]): void {
  if (!ids.length || !G.exp.core.activeMeasureEffects) return;
  const remaining = G.exp.core.activeMeasureEffects.filter(instance => !ids.includes(instance.id));
  if (remaining.length) G.exp.core.activeMeasureEffects = remaining;
  else delete G.exp.core.activeMeasureEffects;
}

function executePoliticalPlan(
  G: CoreState,
  playerID: string,
  hooks: readonly ExpansionHooks[],
  planAction: (preview?: PaymentPreview) => { ok: true; commit: () => void } | { ok: false; reason?: string },
): ResolveResult {
  const deficits = budgetDeficitIds(G, playerID, hooks);
  const plan = planAction();
  if (plan.ok) {
    plan.commit();
    // EXP-01-08-M06-07: a new Deficit registered by this action applies later.
    consumeMeasureEffects(G, deficits);
    return { ok: true };
  }
  // CORE-01-06-00-11/-12 and EXP-01-08-M06-06/-07: the exception consumes only Deficit
  // instances and only when the requested action is otherwise legal and payable.
  if (deficits.length && (plan.reason === 'insufficient' || plan.reason === 'invalid-or-unpayable-cost')
      && planAction(new Set(deficits)).ok) {
    consumeMeasureEffects(G, deficits);
    return { ...plan, budgetDeficitConsumed: true };
  }
  return plan;
}

function planRegulationAction(G: CoreState, requested: ResolveRegulationEffect, active: readonly RulesModule[], preview?: PaymentPreview) {
  if (!Object.hasOwn(G.exp.core.players, requested.playerID)) return { ok: false, reason: 'no-player' } as const;
  const rules = getRegulationRules(G, active);
  const authority = requested.kind === 'activateAuthorityApparatus' ? rules?.authorityContext(G, requested) : undefined;
  if (requested.kind === 'activateAuthorityApparatus' && !authority) {
    return { ok: false, reason: 'apparatus-unavailable' } as const;
  }
  const context = authority ?? (requested.contextTileId
    ? G.exp.core.tiles.board.find(tile => tile.tileId === requested.contextTileId) : rules?.context(G, requested.regulation));
  if (!context) return { ok: false, reason: 'regulation-unavailable' } as const;
  const effect = { ...requested, contextCoord: context.coord };
  const hooks = active.flatMap(module => module.hooks ?? []);
  if (isProhibited(G, effect, hooks)) return { ok: false, reason: 'prohibited' } as const;
  const operation = rules?.plan(G, requested.regulation, requested.playerID, authority?.tileId);
  if (!operation) return { ok: false, reason: 'invalid-regulation-operation' } as const;
  const payment = planPayment(G, createMatchResourceRegistry(active), effect, hooks, operation.cost, preview);
  if (!payment.ok) return payment;
  return { ok: true, commit: () => {
    payment.transaction.commit();
    operation.commit();
  } } as const;
}

// CORE-01-04-11 and CORE-01-06-06: transfer the actual object between zones.
function placeSupplyMarker(G: CoreState, supply: Influence[], index: number, tileId: string): void {
  const [marker] = supply.splice(index, 1);
  (G.exp.core.influencesOnBoard ??= []).push({ ...marker, tileId });
}

function planPoliticalAction(
  G: CoreState,
  requested: PoliticalActionEffect,
  active: readonly RulesModule[],
  preview?: PaymentPreview,
): { ok: true; commit: () => void } | { ok: false; reason?: string } {
  const registry = createMatchResourceRegistry(active);
  const hooks = active.flatMap(module => module.hooks ?? []);
  if (!Object.hasOwn(G.exp.core.players, requested.playerID)) return { ok: false, reason: 'no-player' };
  const player = G.exp.core.players[requested.playerID];
  const supply = player.personal.influence;
  const board = G.exp.core.influencesOnBoard ?? [];
  const tileId = requested.kind === 'placeOrMoveInfluence' ? requested.targetTileId : requested.tileId;
  const placement = G.exp.core.tiles.board.find(tile => tile.tileId === tileId);
  if (!placement) return { ok: false, reason: 'tile-not-on-board' };
  const tile = G.exp.core.allTiles[tileId];
  const start = tile.kind === 'StartCommittee';

  // CORE-01-06-00-05/-05A/-05B and CORE-01-08-06A: bind the local context, including immunity.
  const effect = { ...requested, contextCoord: placement.coord };
  const localHooks = start ? [] : hooks;
  if (isProhibited(G, effect, localHooks)) return { ok: false, reason: 'prohibited' };

  if (effect.kind === 'placeOrMoveInfluence') {
    // CORE-01-04-10/-11/-12 and CORE-01-08-04/-06B: one owned marker, never onto Start Committee.
    if (start || effect.sourceTileId === tileId) return { ok: false, reason: 'invalid-destination' };
    const index = effect.sourceTileId === undefined
      ? supply.findIndex(marker => marker.id === effect.markerId && marker.owner === player.id)
      : board.findIndex(marker => marker.id === effect.markerId && marker.owner === player.id && marker.tileId === effect.sourceTileId);
    if (index < 0) return { ok: false, reason: 'marker-not-in-source' };

    // CORE-01-06-00-07(b) and EXP-02-02-B-02B: cost increases apply; the marker is not output.
    const payment = planPayment(G, registry, effect, localHooks, undefined, preview);
    if (!payment.ok) return payment;
    return { ok: true, commit: () => {
      payment.transaction.commit();
      if (effect.sourceTileId === undefined) placeSupplyMarker(G, supply, index, tileId);
      else board[index].tileId = tileId;
    } };
  }

  if (effect.kind === 'formalizeInfluence') {
    // CORE-01-04-13/-14/-14A and CORE-01-08-07/-07A: Standard control, or one Start use per player.
    if (start ? player.usedStartCommittee : tile.kind !== 'Committee' || getControl(G, placement.coord) !== player.id) {
      return { ok: false, reason: 'committee-unavailable' };
    }
    // CORE-01-08-02/-03: all players must have placed their starting supply.
    if (Object.values(G.exp.core.players).some(p => p.personal.influence.some(marker => marker.starting))) {
      return { ok: false, reason: 'starting-influence-unplaced' };
    }
    // CORE-01-04-15/-16 and CORE-01-08-08/-09: pay the specified combination of active resorts.
    const distinct = new Set(effect.resources);
    if (effect.resources.length !== (start ? 4 : 2) || distinct.size < (start ? 3 : 2)
        || effect.resources.some(resource => !registry.has(resource))) {
      return { ok: false, reason: 'invalid-formalization-cost' };
    }
    const cost: ResourceAmounts = Object.create(null);
    for (const resource of effect.resources) cost[resource] = (cost[resource] ?? 0) + 1;
    // EXP-03-08-M05-05..09: add the selected fixed replacement only after other prerequisites.
    const fee = effect.payment?.greenwashing;
    const fees = start ? [] : greenwashingResources(G, hooks);
    if (fees.length) {
      if (fee === undefined) return { ok: false, reason: 'greenwashing' };
      if (!fees.includes(fee)) return { ok: false, reason: 'invalid-greenwashing-payment' };
      cost[fee] = (cost[fee] ?? 0) + 1;
    } else if (fee !== undefined) {
      return { ok: false, reason: 'invalid-greenwashing-payment' };
    }
    const payment = planPayment(G, registry, effect, localHooks, cost, preview);
    if (!payment.ok) return payment;

    // CORE-01-04-17..19, CORE-01-08-10 and CORE-01-06-00-11: one new marker, or a paid zero output.
    const amount = modifyOutput(G, effect, localHooks, 1);
    if (amount !== 0 && amount !== 1) return { ok: false, reason: 'invalid-influence-output' };
    const owned = [...supply, ...board.filter(marker => marker.owner === player.id)];
    // CORE-01-08-01 and ADD56-01-03-00-01: cap the total across both zones.
    if (owned.length + amount > (G.cfg.addOn56 ? 8 : 7)) return { ok: false, reason: 'influence-cap' };
    const ids = new Set(owned.map(marker => marker.id));
    let serial = 1;
    while (ids.has(`INF-${player.id}-F${serial}`)) serial++;
    return { ok: true, commit: () => {
      payment.transaction.commit();
      if (amount === 1) supply.push({ id: `INF-${player.id}-F${serial}`, owner: player.id });
      if (start) player.usedStartCommittee = true;
    } };
  }

  // CORE-01-04-20..22E: one controlled Grassroots exchange between different active resorts.
  if (tile.kind !== 'Grassroots' || getControl(G, placement.coord) !== player.id) {
    return { ok: false, reason: 'grassroots-unavailable' };
  }
  if (effect.input === effect.output || !registry.has(effect.input) || !registry.has(effect.output)) {
    return { ok: false, reason: 'invalid-conversion-resorts' };
  }
  // EXP-01-05-02/-06/-07: an eligible alternative replaces only the base exchange.
  const alternative = effect.alternative === undefined ? undefined : active
    .flatMap(module => module.conversionAlternatives?.(G, player.id) ?? [])
    .find(option => option.id === effect.alternative && option.input === effect.input);
  if (effect.alternative !== undefined && !alternative) return { ok: false, reason: 'conversion-alternative-unavailable' };
  const payment = planPayment(G, registry, effect, localHooks, { [effect.input]: alternative?.cost ?? 3 }, preview);
  if (!payment.ok) return payment;
  const amount = modifyOutput(G, effect, localHooks, 1);
  const payout = payment.transaction.transfer({
    from: 'Bank', to: 'PersonalSupply', playerID: player.id, resource: effect.output, amount,
  });
  if (!payout.ok) return { ok: false, reason: payout.reason };
  return { ok: true, commit: payment.transaction.commit };
}

// CORE-01-04-05A/-05B: previews and placements share the same legality and payment check.
function planTilePlacement(G: CoreState, effect: PlaceTileEffect, registry: ResourceRegistry, hooks: readonly ExpansionHooks[], preview?: PaymentPreview) {
  if (G.exp.core.tiles.drawResolution?.tileId !== effect.tileId) return { ok: false, reason: 'tile-not-drawn' } as const;
  if (!Object.hasOwn(G.exp.core.players, effect.playerID)) return { ok: false, reason: 'no-player' } as const;
  if (!isLegalPlacement(G.exp.core.tiles.board, effect.coord, getTopology(G.cfg.topology))) {
    return { ok: false, reason: 'illegal-coordinate' } as const;
  }
  const placement = { ...effect, contextCoord: effect.coord };
  if (isProhibited(G, placement, hooks)) return { ok: false, reason: 'prohibited' } as const;
  return planPayment(G, registry, placement, hooks, undefined, preview);
}

// CORE-01-04-04/-06/-07 and VAR-01-01-04 through -08: resolve attempts in the current draw phase.
function drawTile(G: CoreState, effect: DrawTileEffect, registry: ResourceRegistry, hooks: readonly ExpansionHooks[]): ResolveResult {
  if (G.exp.core.tiles.drawResolution) return { ok: false, reason: 'draw-pending' };
  if (!Object.hasOwn(G.exp.core.players, effect.playerID)) return { ok: false, reason: 'no-player' };
  const { tileRecycling } = G.cfg.variants;
  const attempted = new Set<string>();
  const geometry = legalPlacementCoords(G.exp.core.tiles.board, getTopology(G.cfg.topology));

  while (G.exp.core.tiles.drawPile.length > 0) {
    const index = tileRecycling ? G.exp.core.tiles.drawPile.findIndex(id => !attempted.has(id)) : 0;
    if (index < 0) break;
    const [tileId] = G.exp.core.tiles.drawPile.splice(index, 1);
    attempted.add(tileId);
    const drawn = { tileId, legalCoords: [] as AxialCoord[] };
    G.exp.core.tiles.drawResolution = drawn;

    drawn.legalCoords = geometry.filter(coord => planTilePlacement(G, {
      kind: 'placeTile', tileId, coord, playerID: effect.playerID,
    }, registry, hooks, true).ok);
    if (drawn.legalCoords.length > 0) return { ok: true };

    G.exp.core.tiles.drawResolution = null;
    if (tileRecycling && geometry.length === 0) {
      // VAR-01-01-05: reshuffle by match seed, turn and attempt, skipping returned IDs on the next draw.
      G.exp.core.tiles.drawPile = shuffleSeeded([...G.exp.core.tiles.drawPile, tileId], `${G.matchSeed}|tile-recycling|${effect.turn}|${attempted.size}`);
    } else {
      G.exp.core.tiles.discardFaceUp.push(tileId);
    }
  }
  return { ok: true };
}

type MeasureAction = TakeMeasureEffect | PlayMeasureEffect;

function planMeasureRegistration(
  G: CoreState,
  instance: RegisterMeasureEffect['instance'],
  active: readonly RulesModule[],
  deckId?: ExpansionId,
): { ok: true; commit: () => void } | { ok: false; reason: string } {
  // EXP-01-07-08/-09 and EXP-03-03-02A: keep an eligible card play independent of its card zone.
  const module = active.find((candidate): candidate is ExpansionModule => candidate.id !== 'core'
    && (deckId === undefined
      ? (candidate.measurePrefix !== undefined && instance.sourceCardId.startsWith(candidate.measurePrefix))
        || Object.hasOwn(G.exp[candidate.id]?.measures?.playCounts ?? {}, instance.sourceCardId)
      : candidate.id === deckId));
  const deck = module && G.exp[module.id]?.measures;
  if (!module || (deck && !Object.hasOwn(deck.playCounts, instance.sourceCardId))
      || module.canRegisterMeasure?.(G, instance) === false) {
    return { ok: false, reason: 'inactive-measure' };
  }
  const target = instance.targetPlayerID;
  // EXP-01-08-M09-03 and EXP-03-08-M11-03.
  if (!Object.hasOwn(G.exp.core.players, instance.owner)
      || (target !== undefined && !Object.hasOwn(G.exp.core.players, target))
      || (module.measureRules?.[instance.sourceCardId]?.targetPlayer === 'opponent' && instance.owner === target)) {
    return { ok: false, reason: 'invalid-target' };
  }
  const id = `${instance.sourceCardId}:${instance.playNumber}`;
  if (G.exp.core.activeMeasureEffects?.some(registered => registered.id === id)) return { ok: false, reason: 'duplicate-effect' };
  return { ok: true, commit: () => {
    // CORE-01-07-12/-13/-15/-17: wait for actual game boundaries.
    const waitingForRound = instance.duration === 'nextRound' || instance.duration === 'throughNextRound';
    const waitingForTurn = instance.duration === 'targetNextTurn';
    (G.exp.core.activeMeasureEffects ??= []).push({
      ...instance, id, ...(waitingForRound ? { waitingForRound: true } : {}), ...(waitingForTurn ? { waitingForTurn: true } : {}),
    });
  } };
}

function keepMeasureEffect(instance: ActiveMeasureEffect, boundary: ExpireMeasureEffects): boolean {
  switch (boundary.boundary) {
    case 'turnStart':
      return instance.duration !== 'ownerNextTurn' || instance.owner !== boundary.playerID;
    case 'turnEnd':
      return !(instance.duration === 'thisTurn' && instance.owner === boundary.playerID)
        && !(instance.duration === 'targetNextTurn' && instance.targetPlayerID === boundary.playerID && !instance.waitingForTurn);
    case 'settlementEnd':
      return instance.duration !== 'thisRound'
        && ((instance.duration !== 'nextRound' && instance.duration !== 'throughNextRound') || instance.waitingForRound === true);
  }
}

function measureUsage(G: CoreState): Record<string, boolean> {
  const legacy = G.exp?.exp01?.measures;
  const flags = G.exp.core.playedMeasureThisRound ??= legacy?.usedThisRound ?? Object.fromEntries(
    Object.keys(G.exp.core.players).map(playerID => [playerID, false]),
  );
  if (legacy) delete legacy.usedThisRound;
  return flags;
}

// EXP-01-07-05..05D: keep occupied slots and refill vacancies in slot order.
function refillMeasureMarket(G: CoreState, expansion: ExpansionId, deck: MeasureDeckState): void {
  for (let slot = 0; slot < 3; slot++) {
    if (deck.open[slot]) continue;
    if (deck.drawPile.length === 0 && deck.recycle.length > 0) {
      deck.drawPile = shuffleSeeded(deck.recycle, `${G.matchSeed}|${expansion}:measures:cycle:${deck.cycle}`);
      deck.recycle.length = 0;
      deck.cycle++;
    }
    deck.open[slot] = deck.drawPile.shift() ?? null;
  }
}

function planMeasureAction(
  G: CoreState,
  requested: MeasureAction,
  active: readonly RulesModule[],
  preview?: PaymentPreview,
): { ok: true; commit: () => void } | { ok: false; reason?: string } {
  const { expansion, playerID, measureId } = requested;
  const deck = G.cfg.expansions[expansion] ? G.exp?.[expansion]?.measures : undefined;
  if (!deck || !Object.hasOwn(G.exp.core.players, playerID)) return { ok: false, reason: 'measure-action-unavailable' };
  const take = requested.kind === 'takeMeasure';
  const hand = deck.hands[playerID] ?? [];
  const index = (take ? deck.open : hand).indexOf(measureId);
  if (index < 0) return { ok: false, reason: take ? 'not-open' : 'not-in-hand' };
  // EXP-01-06-02..03: both limits are shared across decks.
  const flags = G.exp.core.playedMeasureThisRound ?? G.exp?.exp01?.measures?.usedThisRound;
  if (!take && flags?.[playerID]) return { ok: false, reason: 'limit-per-round' };
  const enabled = (Object.keys(G.cfg.expansions) as ExpansionId[]).filter(id => G.cfg.expansions[id]);
  if (take && enabled.reduce((sum, id) => sum + (G.exp?.[id]?.measures?.hands[playerID]?.length ?? 0), 0) >= 2) {
    return { ok: false, reason: 'hand-full' };
  }
  const rules = active.find((module): module is ExpansionModule => module.id === expansion)?.measureRules;
  const rule = requested.kind === 'playMeasure' ? rules?.[measureId] : undefined;
  const playNumber = (deck.playCounts[measureId] ?? 0) + 1;
  if (!take && playNumber > 2) return { ok: false, reason: 'play-limit' };
  if (!take && rules && !rule) return { ok: false, reason: 'measure-unavailable' };
  const target = requested.kind === 'playMeasure' ? requested.targetPlayerID : undefined;
  if (rule?.targetPlayer
    ? target === undefined || !Object.hasOwn(G.exp.core.players, target) || (rule.targetPlayer === 'opponent' && target === playerID)
    : target !== undefined) return { ok: false, reason: 'invalid-target' };
  const targetTileId = requested.kind === 'playMeasure' ? requested.targetTileId : undefined;
  const targetRegulationId = requested.kind === 'playMeasure' ? requested.targetRegulationId : undefined;
  const regulation = requested.kind === 'playMeasure' ? requested.regulation : undefined;
  const regulationRules = getRegulationRules(G, active);
  const selectedRegulation = targetRegulationId === undefined ? undefined
    : regulationRules?.attached(G).find(item => item.id === targetRegulationId);
  if (rule?.targetRegulation ? !selectedRegulation : targetRegulationId !== undefined) return { ok: false, reason: 'invalid-target' };
  const placement = regulation ? regulationRules?.context(G, regulation) : G.exp.core.tiles.board.find(tile =>
    tile.tileId === (targetTileId ?? selectedRegulation?.tileId));
  if (rule?.targetTile
    ? !placement || !rule.targetTile(G, playerID, G.exp.core.allTiles[placement.tileId], placement.coord)
    : targetTileId !== undefined) return { ok: false, reason: 'invalid-target' };
  const operation = regulation ? regulationRules?.plan(G, regulation, playerID) : undefined;
  if (rule?.regulation ? !regulation || !placement || (rule.regulation.timing === 'immediate' && !operation)
      || (regulation.operation === 'place' && !regulationRules?.mayAttach(G.exp.core.allTiles[placement.tileId], regulation.regulationKind))
      || regulation.operation !== rule.regulation.operation
      || (rule.regulation.hotspotOnly && (!placement || G.exp.core.allTiles[placement.tileId].kind !== 'Hotspot'))
    : regulation !== undefined) return { ok: false, reason: 'invalid-regulation-operation' };
  const registry = createMatchResourceRegistry(active);
  const targetResort = requested.kind === 'playMeasure' ? requested.targetResort : undefined;
  if (rule?.targetResort
    ? targetResort === undefined || !registry.has(targetResort) || (rule.targetResort === 'unique'
      && G.exp.core.activeMeasureEffects?.some(instance => instance.sourceCardId === measureId && instance.targetResort === targetResort))
    : targetResort !== undefined) return { ok: false, reason: 'invalid-target' };
  // CORE-01-06-00-05(b)/(e): a single targeted Tile supplies the ContextTile.
  const effect = { ...requested, contextCoord: placement?.coord, gainTargetResort: rule?.gainTargetResort };
  const registration = rule?.duration && planMeasureRegistration(G, {
    sourceCardId: measureId, duration: rule.duration, owner: playerID, playNumber: playNumber === 1 ? 1 : 2,
    ...(target === undefined ? {} : { targetPlayerID: target }),
    ...((targetTileId ?? selectedRegulation?.tileId) === undefined ? {} : { targetTileId: targetTileId ?? selectedRegulation?.tileId }),
    ...(targetResort === undefined ? {} : { targetResort }),
    ...(targetRegulationId === undefined ? {} : { targetRegulationId }),
    ...(regulation === undefined ? {} : { regulation }),
  }, active, expansion);
  if (registration && !registration.ok) return registration;

  // EXP-01-06-04C and CORE-01-06-00-07/-11: plan the complete payment before moving cards.
  const hooks = active.flatMap(module => module.hooks ?? []);
  if (isProhibited(G, effect, hooks)) return { ok: false, reason: 'prohibited' };
  // CORE-01-06-00-08/-09 and EXP-02-04-A-06: immediate placement shares this card's one payment.
  const immediateRegulation = rule?.regulation?.timing === 'immediate' ? operation : undefined;
  const cost = { ...rule?.cost };
  for (const [resource, amount] of Object.entries(immediateRegulation?.cost ?? {})) {
    if (amount !== undefined) cost[resource] = (cost[resource] ?? 0) + amount;
  }
  const payment = planPayment(G, registry, effect, hooks, cost, preview);
  if (!payment.ok) return payment;
  if (rule?.gainTargetResort && placement) {
    const tile = G.exp.core.allTiles[placement.tileId];
    if (tile.kind !== 'ResortTile') return { ok: false, reason: 'invalid-target' };
    // EXP-03-08-M03-05: stage the immediate gain in the same paid resolution.
    const output: AddResourcesEffect = { kind: 'addResources', playerID, resource: tile.resort, amount: 1, contextCoord: placement.coord };
    const amount = modifyOutput(G, output, hooks, 1);
    const payout = payment.transaction.transfer({ from: 'Bank', to: 'PersonalSupply', playerID, resource: tile.resort, amount });
    if (!payout.ok) return { ok: false, reason: payout.reason };
  }

  return { ok: true, commit: () => {
    payment.transaction.commit();
    registration?.commit();
    immediateRegulation?.commit();
    if (take) {
      deck.open[index] = null;
      (deck.hands[playerID] ??= []).push(measureId);
    } else {
      // EXP-01-07-01..04: preserve counters through all zone transfers.
      hand.splice(index, 1);
      deck.playCounts[measureId] = playNumber;
      (playNumber === 1 ? deck.recycle : deck.finalDiscard).push(measureId);
      measureUsage(G)[playerID] = true;
    }
    refillMeasureMarket(G, expansion, deck);
  } };
}

export function createResolver(modules?: readonly RulesModule[]): EffectResolver {
  function activeModules(G: CoreState) {
    return createExpansionRegistry(G.cfg.expansions, modules);
  }

  function actionQuotes(G: CoreState, requested: PoliticalActionEffect | MeasureAction | ResolveRegulationEffect | PlaceTileEffect): PaymentQuote[] {
    const active = activeModules(G);
    const quote = (effect: typeof requested, preview?: PaymentPreview) => {
      switch (effect.kind) {
        case 'takeMeasure':
        case 'playMeasure':
          return planMeasureAction(G, effect, active, preview);
        case 'activateAuthorityApparatus':
        case 'regulationOperation':
          return planRegulationAction(G, effect, active, preview);
        case 'placeTile':
          return planTilePlacement(G, effect, createMatchResourceRegistry(active), active.flatMap(module => module.hooks ?? []), preview);
        default:
          return planPoliticalAction(G, effect, active, preview);
      }
    };
    const options: PaymentQuote[] = [];
    quote(requested, option => options.push(option));
    return options.filter(option => quote({ ...requested, payment: option.payment }).ok);
  }

  function hotspotQuotes(G: CoreState, pending = G.exp.core.pendingHotspot): DecisionQuote[] {
    if (!pending) return [];
    const active = activeModules(G);
    const choices: DecisionQuote[] = [];
    if (pending.outcome === 'greenwashing') {
      const supply = G.exp.core.players[pending.playerID].personal;
      if (supply.influence.length > 0) {
        for (const resource of greenwashingResources(G, active.flatMap(module => module.hooks ?? []))) {
          if ((supply.resources[resource] ?? 0) >= 1) choices.push({
            choice: { kind: 'greenwashing', resource },
            contextTile: pending.tileId,
            costBreakdown: [{ playerID: pending.playerID, resource, amount: 1 }],
          });
        }
      }
    } else {
      const rules = getRegulationRules(G, active);
      const operations = rules ? [...rules.operations(G, 'place'), ...rules.operations(G, 'move')] : [];
      for (const regulation of operations) {
        for (const { payment, ...quote } of actionQuotes(G, {
          kind: 'regulationOperation', playerID: pending.playerID, regulation, contextTileId: pending.tileId,
        })) choices.push({ ...quote, choice: { kind: 'regulation', regulation, ...(payment ? { payment } : {}) } });
      }
    }
    if (choices.length > 0) choices.push({ choice: { kind: 'decline' }, contextTile: pending.tileId, costBreakdown: [] });
    return choices;
  }

  function regulationFollowUpQuotes(G: CoreState): DecisionQuote[] {
    const pending = G.exp.core.pendingRegulationChoices?.[0];
    if (!pending) return [];
    const rules = getRegulationRules(G, activeModules(G));
    const operations = rules?.followUpOperations(G, pending) ?? [];
    return [
      ...operations.flatMap(regulation => actionQuotes(G, {
        kind: 'regulationOperation', playerID: pending.playerID, regulation,
      }).map(({ payment, ...quote }): DecisionQuote => ({
        ...quote, choice: { kind: 'regulation', regulation, ...(payment ? { payment } : {}) },
      }))),
      {
        choice: { kind: 'decline' },
        contextTile: rules?.followUpContext(G, pending) ?? null,
        costBreakdown: [],
      },
    ];
  }

  function removeRegulationFollowUp(G: CoreState, pending: PendingRegulationChoice): void {
    G.exp.core.pendingRegulationChoices!.shift();
    if (!G.exp.core.pendingRegulationChoices!.length) delete G.exp.core.pendingRegulationChoices;
    consumeMeasureEffects(G, [pending.instanceId]);
  }

  function continueRegisteredDecisions(G: CoreState): void {
    while (G.exp.core.pendingRegulationChoices?.length && regulationFollowUpQuotes(G).length === 1) {
      removeRegulationFollowUp(G, G.exp.core.pendingRegulationChoices[0]);
    }
    if (!G.exp.core.pendingRegulationChoices && !G.exp.core.pendingHotspot && G.exp.core.remainingHotspots) {
      const remaining = G.exp.core.remainingHotspots;
      delete G.exp.core.remainingHotspots;
      resumeHotspots(G, remaining);
      if (G.exp.core.pendingRegulationChoices) continueRegisteredDecisions(G);
    }
  }

  function resumeHotspots(G: CoreState, tileIds: string[]): void {
    for (const [index, id] of tileIds.entries()) {
      if (G.exp.core.pendingRegulationChoices) {
        G.exp.core.remainingHotspots = tileIds.slice(index);
        return;
      }
      const placement = G.exp.core.tiles.board.find(tile => tile.tileId === id);
      if (!placement) continue;
      resolveEffect(G, { kind: 'resolveHotspotAt', coord: placement.coord });
      if (G.exp.core.pendingHotspot) {
        const rest = tileIds.slice(index + 1);
        if (rest.length) G.exp.core.remainingHotspots = rest;
        return;
      }
      if (G.exp.core.pendingRegulationChoices) {
        G.exp.core.remainingHotspots = tileIds.slice(placement.enclosureProcessed ? index + 1 : index);
        return;
      }
    }
  }

  function resolveEffect(G: CoreState, requested: EffectDescriptor): ResolveResult {
    const active = activeModules(G);
    const hooks = active.map(module => module.hooks).filter(hook => hook !== undefined);

    // CORE-01-06-00-05(c): production checks local prohibitions on the producing Tile.
    const effect = requested.kind === 'applyProductionAt' ? { ...requested, contextCoord: requested.coord } : requested;
    if (effect.kind === 'recordTurnHash') {
      // AGENTS 5.3: hash the completed turn, excluding the previous checkpoint.
      G.lastTurnHash = stableHash({
        state: coreStateForHash({ ...G, lastTurnHash: undefined }), turn: effect.turn, playerID: effect.playerID,
      });
      return { ok: true };
    }

    if (effect.kind === 'recordDecisionContinuation') {
      // CORE-01-06-04(d) and CORE-01-07-04(b): finish the interrupted resolution before advancing.
      if (effect.continuation) G.exp.core.decisionContinuation = effect.continuation;
      else delete G.exp.core.decisionContinuation;
      return { ok: true };
    }
    if (effect.kind === 'continueRegisteredDecisions') {
      // EXP-01-07-14: finish registered decisions in their trigger order.
      continueRegisteredDecisions(G);
      return { ok: true };
    }

    if (effect.kind === 'registerMeasureEffect') {
      const registration = planMeasureRegistration(G, effect.instance, active);
      if (!registration.ok) return registration;
      registration.commit();
      return { ok: true };
    }

    if (effect.kind === 'consumeBudgetDeficits') {
      // EXP-01-08-M06-07A: complete an empty mandatory slot without reopening it.
      consumeMeasureEffects(G, budgetDeficitIds(G, undefined, hooks).filter(id => effect.ids.includes(id)));
      return { ok: true };
    }

    if (effect.kind === 'expireMeasureEffects') {
      // CORE-01-07-10/-11/-14/-17, EXP-01-08-M03-03, EXP-01-08-M09-04/-07 and EXP-03-08-M11-04.
      const previous = G.exp.core.activeMeasureEffects;
      if (!previous) return { ok: true };
      const remaining = previous.filter(instance => keepMeasureEffect(instance, effect));
      if (effect.boundary === 'turnStart') {
        for (const instance of remaining) {
          if (effect.nextRound) delete instance.waitingForRound;
          if (instance.targetPlayerID === effect.playerID) delete instance.waitingForTurn;
        }
      }
      if (remaining.length === 0) delete G.exp.core.activeMeasureEffects;
      else if (remaining.length !== previous.length) G.exp.core.activeMeasureEffects = remaining;
      return { ok: true };
    }

    if (effect.kind === 'initMeasures') {
      // EXP-01-06-00A/-00B and EXP-01-03-06: initialize only the chosen active deck.
      const { expansion } = effect;
      if (!G.cfg.expansions[expansion]) return { ok: false, reason: 'inactive-expansion' };
      const slice = ensureExpansionSlice<{ measures?: MeasureDeckState }>(G, expansion, {});
      if (slice.measures) return { ok: false, reason: 'deck-already-initialized' };
      const deck: MeasureDeckState = {
        drawPile: shuffleSeeded(effect.deck, `${G.matchSeed}|${expansion}:measures:init`),
        open: [null, null, null], recycle: [], finalDiscard: [],
        hands: Object.fromEntries(Object.keys(G.exp.core.players).map(playerID => [playerID, []])),
        playCounts: Object.fromEntries(effect.deck.map(card => [card, 0])),
        cycle: 0,
      };
      slice.measures = deck;
      measureUsage(G);
      refillMeasureMarket(G, expansion, deck);
      return { ok: true };
    }

    if (effect.kind === 'initRegulations') {
      const rules = getRegulationRules(G, active);
      if (!rules) return { ok: false, reason: 'inactive-expansion' };
      rules.initialize(G);
      return { ok: true };
    }

    if (effect.kind === 'resetMeasuresRound') {
      // CORE-01-07-17 and EXP-01-06-02A: reset only on an actually begun round.
      if (G.exp.core.playedMeasureThisRound || G.exp?.exp01?.measures) {
        const flags = measureUsage(G);
        for (const id of Object.keys(flags)) flags[id] = false;
      }
      return { ok: true };
    }

    if (effect.kind === 'activateAuthorityApparatus') {
      return executePoliticalPlan(G, effect.playerID, hooks, preview => planRegulationAction(G, effect, active, preview));
    }

    if (effect.kind === 'regulationOperation') {
      const plan = planRegulationAction(G, effect, active);
      if (!plan.ok) return plan;
      plan.commit();
      return { ok: true };
    }

    if (effect.kind === 'beforeSettlementProduction') {
      // CORE-01-07-04(b)/-05 and EXP-01-07-14: snapshot registered operations in event order.
      const operations = hooks.flatMap(hook => hook.beforeSettlement?.(G) ?? []);
      for (const { effect: operation, consume } of operations) {
        if (operation) resolveEffect(G, operation);
        consumeMeasureEffects(G, [consume]);
        continueRegisteredDecisions(G);
        if (G.exp.core.pendingRegulationChoices) break;
      }
      return { ok: true };
    }

    if (effect.kind === 'takeMeasure' || effect.kind === 'playMeasure') {
      return executePoliticalPlan(G, effect.playerID, hooks, preview => planMeasureAction(G, effect, active, preview));
    }

    if (effect.kind === 'chooseRegulationFollowUp') {
      // EXP-02-08-M03-03/-04 and EXP-02-08-M05-03/-05.
      const pending = G.exp.core.pendingRegulationChoices?.[0];
      if (!pending || pending.playerID !== effect.playerID) return { ok: false, reason: 'follow-up-unavailable' };
      const { choice } = effect;
      if (choice.kind === 'greenwashing') return { ok: false, reason: 'invalid-follow-up' };
      if (choice.kind === 'decline') {
        removeRegulationFollowUp(G, pending);
      } else {
        const { regulation } = choice;
        if (!getRegulationRules(G, active)?.permitsFollowUp(pending, regulation)) return { ok: false, reason: 'invalid-follow-up' };
        const plan = planRegulationAction(G, {
          kind: 'regulationOperation', playerID: pending.playerID, regulation, payment: choice.payment,
        }, active);
        if (!plan.ok) return plan;
        removeRegulationFollowUp(G, pending);
        plan.commit();
      }
      continueRegisteredDecisions(G);
      return { ok: true };
    }

    if (effect.kind === 'chooseHotspotOutcome') {
      const pending = G.exp.core.pendingHotspot;
      if (!pending || pending.playerID !== effect.playerID) return { ok: false, reason: 'hotspot-choice-unavailable' };
      const placement = G.exp.core.tiles.board.find(tile => tile.tileId === pending.tileId);
      if (!placement) return { ok: false, reason: 'hotspot-unavailable' };
      const { choice } = effect;
      if (choice.kind === 'regulation') {
        if (pending.outcome !== 'regulation' || (choice.regulation.operation !== 'place' && choice.regulation.operation !== 'move')) {
          return { ok: false, reason: 'invalid-hotspot-choice' };
        }
        // EXP-02-02-G-04..05B: the majority player's Regulation resolution uses Inner Order as its context.
        const placed = resolveEffect(G, {
          kind: 'regulationOperation', playerID: pending.playerID, regulation: choice.regulation,
          contextTileId: pending.tileId, payment: choice.payment,
        });
        if (!placed.ok) return placed;
      } else if (choice.kind === 'greenwashing') {
        if (pending.outcome !== 'greenwashing') return { ok: false, reason: 'invalid-hotspot-choice' };
        const supply = G.exp.core.players[pending.playerID].personal.influence;
        if (!supply.length) return { ok: false, reason: 'influence-unavailable' };
        // EXP-03-08-M05-05..08: stage the single fixed fee separately from ordinary surcharges.
        const transaction = createBankTransaction(G, createMatchResourceRegistry(active));
        const fee = transaction.transfer({
          from: 'PersonalSupply', to: 'Bank', playerID: pending.playerID, resource: choice.resource, amount: 1,
        });
        if (!fee.ok) return fee;
        const outcome: ResolveHotspotAtEffect = { kind: 'resolveHotspotAt', coord: placement.coord, contextCoord: placement.coord };
        const amount = modifyOutput(G, outcome, hooks, 1);
        if (amount !== 0 && amount !== 1) return { ok: false, reason: 'invalid-influence-output' };
        transaction.commit();
        if (amount === 1) placeSupplyMarker(G, supply, supply.length - 1, pending.tileId);
      }
      // CORE-01-06-04(d)/-04A: decline also completes the event before moving to the next Tile ID.
      placement.enclosureProcessed = true;
      delete G.exp.core.pendingHotspot;
      const rest = G.exp.core.remainingHotspots ?? [];
      delete G.exp.core.remainingHotspots;
      resumeHotspots(G, rest);
      continueRegisteredDecisions(G);
      return { ok: true };
    }

    if (effect.kind === 'drawTile') return drawTile(G, effect, createMatchResourceRegistry(active), hooks);
    if (effect.kind === 'placeTile') {
      // CORE-01-04-04/-05B: transfer the offered tile and its payment together.
      const plan = planTilePlacement(G, effect, createMatchResourceRegistry(active), hooks);
      if (!plan.ok) return plan;
      const topology = getTopology(G.cfg.topology);
      // CORE-01-06-02/-02A: only a first full enclosure can generate an event.
      const candidates = G.exp.core.tiles.board.filter(p => !p.enclosureProcessed && G.exp.core.allTiles[p.tileId]?.kind === 'Hotspot'
        && topology.adjacent(p.coord, effect.coord) && !isFullySurrounded(G, p.coord));
      const placed = { tileId: effect.tileId, coord: effect.coord };
      plan.transaction.commit();
      G.exp.core.tiles.board.push(placed);
      G.exp.core.tiles.drawResolution = null;

      // CORE-01-06-03/-03A: resolve all enclosures before the political action, in ordinal Tile ID order.
      if (G.exp.core.allTiles[placed.tileId]?.kind === 'Hotspot') candidates.push(placed);
      candidates.sort((a, b) => a.tileId < b.tileId ? -1 : a.tileId > b.tileId ? 1 : 0);
      resumeHotspots(G, candidates.map(candidate => candidate.tileId));
      continueRegisteredDecisions(G);
      return { ok: true };
    }

    if (effect.kind === 'resolveHotspotAt') {
      const placement = G.exp.core.tiles.board.find(p => p.coord.q === effect.coord.q && p.coord.r === effect.coord.r);
      const hotspot = placement && G.exp.core.allTiles[placement.tileId];
      // CORE-01-06-01/-02A: check geometry and the persisted guard before evaluating the event.
      if (G.exp.core.pendingHotspot || !placement || placement.enclosureProcessed || hotspot?.kind !== 'Hotspot'
          || !isFullySurrounded(G, placement.coord)) return { ok: true };

      // CORE-01-06-04(a) and EXP-02-08-M02-03..05: each registered decree attempts once before majority.
      const triggers = hooks.flatMap(hook => hook.beforeHotspot?.(G, placement.tileId) ?? []);
      for (const { effect: operation, consume } of triggers) {
        resolveEffect(G, operation);
        consumeMeasureEffects(G, [consume]);
        if (G.exp.core.pendingRegulationChoices) return { ok: true };
      }

      // CORE-01-06-00-05(d) and CORE-01-06-04(b)/(c): bind the Hotspot, then check its majority and outcome.
      const outcome = { ...effect, contextCoord: placement.coord };
      const winner = computeMajority(G, placement.coord);
      if (winner !== null && !isProhibited(G, outcome, hooks)) {
        // EXP-02-02-G-04/-07 and EXP-03-08-M05-04..09: only the entitled player may choose.
        const choice = hotspot.hotspotOutcome === 'regulation' ? 'regulation'
          : greenwashingResources(G, hooks).length ? 'greenwashing' : undefined;
        if (choice) {
          const pending: PendingHotspot = { tileId: placement.tileId, playerID: winner, outcome: choice };
          if (hotspotQuotes(G, pending).length) {
            G.exp.core.pendingHotspot = pending;
            return { ok: true };
          }
        } else {
          // CORE-01-06-05/-06/-07 and CORE-01-06-00-07(a): transfer one existing marker without a payer.
          const supply = G.exp.core.players[winner].personal.influence;
          const amount = modifyOutput(G, outcome, hooks, 1);
          if (amount === 1 && supply.length > 0) placeSupplyMarker(G, supply, supply.length - 1, placement.tileId);
        }
      }
      // CORE-01-06-04(d)/-04A: consume the enclosure even when its outcome did not execute.
      placement.enclosureProcessed = true;
      return { ok: true };
    }

    if (effect.kind === 'placeOrMoveInfluence' || effect.kind === 'formalizeInfluence' || effect.kind === 'convertResources') {
      return executePoliticalPlan(G, effect.playerID, hooks, preview => planPoliticalAction(G, effect, active, preview));
    }

    // 1) Assign ContextTile (already part of descriptor)
    const immune = isStartCommitteeContext(G, effect.contextCoord); // AGENTS §3.7

    // 2) Prohibitions
    if (!immune && isProhibited(G, effect, hooks)) return { ok: false, reason: 'prohibited' };

    switch (effect.kind) {
      case 'addResources': { // CORE-01-06-00-07(b), CORE-01-06-00-11
        const registry = createMatchResourceRegistry(active);
        if (!registry.has(effect.resource)) return { ok: false, reason: 'inactive-resource' };
        if (!Object.hasOwn(G.exp.core.players, effect.playerID)) return { ok: false, reason: 'no-player' };

        // 3) Cost increases and payment planning
        const payment = planPayment(G, registry, effect, immune ? [] : hooks, effect.cost);
        if (!payment.ok) return payment;
        const { transaction } = payment;
        // 4) Output modifiers, 5) Floor, 6) Commit cost and payout together.
        const amount = modifyOutput(G, effect, immune ? [] : hooks, effect.amount);
        const payout = transaction.transfer({ from: 'Bank', to: 'PersonalSupply', playerID: effect.playerID, resource: effect.resource, amount });
        if (payout.ok) transaction.commit();
        return payout;
      }

      case 'applyProductionAt': { // CORE-01-06-16A/-17 and CORE-01-06-00-07(a)
        const plan = planProductionForTile(G, effect.coord, active);
        if (!plan) return { ok: true };
        const transaction = createBankTransaction(G, createMatchResourceRegistry(active));
        // EXP-03-08-M11-05..09: cap each applicable receipt after the regular split.
        for (const pid of plan.winners) {
          const amount = Math.min(plan.share, ...hooks.map(hook => hook.productionReceiptLimit?.(G, pid) ?? plan.share));
          const payout = transaction.transfer({ from: 'Bank', to: 'PersonalSupply', playerID: pid, resource: plan.resort, amount });
          if (!payout.ok) return payout;
        }
        const noise = transaction.transfer({ from: 'Bank', to: 'Noise', resource: plan.resort, amount: plan.remainder });
        if (noise.ok) transaction.commit();
        return noise;
      }

      case 'addNoise': { // CORE-01-06-15 remainder to Noise
        const transaction = createBankTransaction(G, createMatchResourceRegistry(active));
        const noise = transaction.transfer({ from: 'Bank', to: 'Noise', resource: effect.resource, amount: effect.amount });
        if (noise.ok) transaction.commit();
        return noise;
      }

      default:
        return { ok: false, reason: 'unknown-effect' };
    }
  }

  return Object.assign(resolveEffect, {
    actionQuotes, hotspotQuotes, regulationFollowUpQuotes,
  });
}
