import { shuffleSeeded, stableHash } from '@bc/shared';
import {
  buildMoveCatalog, createExpansionRegistry, createMatchResourceRegistry, ensureExpansionSlice,
  getTopology, isRegisteredAction, MeasureExtensionTargetSchema, paymentPlans,
  type ActiveMeasureEffect, type AxialCoord, type ConversionSelection, type CoreState,
  type DecisionQuote, type DrawTileEffect, type EffectDecision, type EffectDescriptor, type EffectResolver,
  type ExpansionHooks, type ExpansionId, type ExpansionModule, type ExpireMeasureEffects, type Influence,
  type MeasureDeckState, type MoveQuote, type PaymentQuote, type PendingHotspot, type PendingRegulationChoice, type PlaceTileEffect,
  type PlannedPayment,
  type PlayMeasureEffect, type PoliticalActionEffect, type RegisterMeasureEffect,
  type ResolveHotspotAtEffect, type ResolveRegulationEffect, type ResolveResult,
  type ResourceAmounts, type ResourceId, type ResourceRegistry, type RulesModule, type Surcharge, type TakeMeasureEffect,
} from '@bc/rules';
import { isFullySurrounded } from './hotspot.js';
import { influenceLimit, influenceLimitWinners } from './influence.js';
import { planProductionForTile, productionReceipt } from './production.plan.js';
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
): { ok: true; transaction: ReturnType<typeof createBankTransaction>; payment: PlannedPayment } | { ok: false; reason?: string } {
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
  let first: { transaction: ReturnType<typeof createBankTransaction>; payment: PlannedPayment } | undefined;
  let reason = effect.payment ? 'invalid-or-unpayable-cost' : 'insufficient';
  const explore = preview === true || typeof preview === 'function';
  const ignoredSurcharges = typeof preview === 'object' ? preview : undefined;
  const plans = paymentPlans(G, registry, effect, cost, units, isStartCommitteeContext(G, effect.contextCoord), hooks, explore, ignoredSurcharges);
  for (const selected of plans) {
    const transaction = createBankTransaction(G, registry);
    const result = selected.transfers.map(route => transaction.transfer({ from: 'PersonalSupply', to: 'Bank', ...route }))
      .find(transfer => !transfer.ok);
    if (result) {
      reason = result.reason ?? reason;
      continue;
    }
    first ??= { payment: selected, transaction: { ...transaction, commit: () => {
      transaction.commit();
      // CORE-01-06-00-11: apply planned usage only with successful payment.
      for (const instance of G.exp.core.activeMeasureEffects ?? []) {
        if (selected.markUsed.includes(instance.id)) instance.used = true;
      }
      consumeMeasureEffects(G, selected.consumeEffects);
    } } };
    if (typeof preview !== 'function') break;
    preview({
      ...(selected.selection ? { payment: selected.selection } : {}),
      costBreakdown: selected.transfers,
      contextTile: effect.kind === 'placeTile' ? effect.tileId : findTileAt(G, effect.contextCoord)?.tileId ?? null,
    });
  }
  return first ? { ok: true, ...first } : { ok: false, reason };
}

export function isProhibited(G: CoreState, effect: EffectDescriptor, hooks: readonly ExpansionHooks[]): boolean {
  // CORE-01-06-00-07(c) and -10: priority prohibitions run before the other checks and before pricing.
  const context = { G, effect };
  return hooks.some(hook => hook.priorityProhibition?.(context)) || hooks.some(hook => hook.prohibitions?.(context));
}

export function modifyOutput(G: CoreState, effect: EffectDescriptor, hooks: readonly ExpansionHooks[], baseAmount: number): number {
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
  const attempts = hooks.flatMap(hook => hook.politicalAttempt?.(G, playerID) ?? []);
  const plan = planAction();
  if (plan.ok) {
    plan.commit();
    // CORE-01-06-00-11: usage applies to the effects present when the attempt started.
    consumeMeasureEffects(G, attempts.flatMap(attempt => attempt.consume));
    return { ok: true };
  }
  // CORE-01-06-00-11/-12: apply registered failure exceptions without committing the failed action.
  const consumed = attempts.filter(attempt => attempt.consumeOnFailure?.(plan.reason, ids => planAction(new Set(ids)).ok))
    .flatMap(attempt => attempt.consume);
  if (consumed.length) {
    consumeMeasureEffects(G, consumed);
    return { ...plan, attemptEffectsConsumed: true };
  }
  return plan;
}

function extensionAction(active: readonly RulesModule[], kind: ResolveRegulationEffect['kind']) {
  for (const module of active) {
    if (module.id !== 'core' && module.actions?.[kind]) return module.actions[kind];
  }
}

// CORE-01-06-00-05/-07/-11: bind the registered action's context, then pay and commit its plan.
function planExtensionAction(G: CoreState, requested: ResolveRegulationEffect, active: readonly RulesModule[], preview?: PaymentPreview) {
  if (!Object.hasOwn(G.exp.core.players, requested.playerID)) return { ok: false, reason: 'no-player' } as const;
  const action = extensionAction(active, requested.kind);
  if (!action) return { ok: false, reason: 'inactive-expansion' } as const;
  const context = action.context(G, requested);
  if ('reason' in context) return { ok: false, reason: context.reason } as const;
  const effect = { ...requested, contextCoord: context.placement.coord, political: action.political };
  const hooks = active.flatMap(module => module.hooks ?? []);
  if (isProhibited(G, effect, hooks)) return { ok: false, reason: 'prohibited' } as const;
  const operation = action.plan(G, effect, context.placement);
  if (!operation) return { ok: false, reason: 'invalid-extension-operation' } as const;
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

// CORE-01-04-15 and CORE-01-08-08.
const committeeCost = { total: 2, distinct: 2 };
export const startCommitteeCost = { total: 4, distinct: 3 } as const;

function* paymentCombinations(resources: ResourceId[], size: number, offset = 0): Generator<ResourceId[]> {
  if (size === 0) {
    yield [];
    return;
  }
  for (let i = offset; i < resources.length; i++) {
    for (const rest of paymentCombinations(resources, size - 1, i)) yield [resources[i], ...rest];
  }
}

export function* formalizationPayments(resources: ResourceId[], start: boolean): Generator<ResourceId[]> {
  const cost = start ? startCommitteeCost : committeeCost;
  for (const payment of paymentCombinations(resources, cost.total)) {
    if (new Set(payment).size >= cost.distinct) yield payment;
  }
}

type FormalizationEffect = Extract<PoliticalActionEffect, { kind: 'formalizeInfluence' }>;
type PoliticalPlan = { ok: true; commit: () => void; payment: PlannedPayment; output?: number }
  | { ok: false; reason?: string };

function planPoliticalAction(
  G: CoreState,
  requested: PoliticalActionEffect,
  active: readonly RulesModule[],
  preview?: PaymentPreview,
): PoliticalPlan {
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
    return { ok: true, payment: payment.payment, commit: () => {
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
    const required = start ? startCommitteeCost : committeeCost;
    const distinct = new Set(effect.resources);
    if (effect.resources.length !== required.total || distinct.size < required.distinct
        || effect.resources.some(resource => !registry.has(resource))) {
      return { ok: false, reason: 'invalid-formalization-cost' };
    }
    const cost: ResourceAmounts = Object.create(null);
    for (const resource of effect.resources) cost[resource] = (cost[resource] ?? 0) + 1;
    const payment = planPayment(G, registry, effect, localHooks, cost, preview);
    if (!payment.ok) return payment;

    // CORE-01-04-17..19, CORE-01-08-10 and CORE-01-06-00-11: one new marker, or a paid zero output.
    const amount = modifyOutput(G, effect, localHooks, 1);
    if (amount !== 0 && amount !== 1) return { ok: false, reason: 'invalid-influence-output' };
    const owned = [...supply, ...board.filter(marker => marker.owner === player.id)];
    // CORE-01-08-01 and ADD56-01-03-00-01: cap the total across both zones.
    if (owned.length + amount > influenceLimit(G)) return { ok: false, reason: 'influence-cap' };
    const ids = new Set(owned.map(marker => marker.id));
    let serial = 1;
    while (ids.has(`INF-${player.id}-F${serial}`)) serial++;
    return { ok: true, payment: payment.payment, output: amount, commit: () => {
      payment.transaction.commit();
      if (amount === 1) supply.push({ id: `INF-${player.id}-F${serial}`, owner: player.id });
      if (start) player.usedStartCommittee = true;
    } };
  }

  // CORE-01-04-20..22E: use a Grassroots controlled by the payer or with no controller.
  if (tile.kind !== 'Grassroots') return { ok: false, reason: 'grassroots-unavailable' };
  const controller = getControl(G, placement.coord);
  if (controller !== null && controller !== player.id) {
    return { ok: false, reason: 'grassroots-unavailable' };
  }
  if (effect.input === effect.output || !registry.has(effect.input) || !registry.has(effect.output)) {
    return { ok: false, reason: 'invalid-conversion-resorts' };
  }
  // EXP-01-05-02/-06/-07: an eligible alternative replaces only the base exchange.
  const alternative = effect.alternative === undefined ? undefined : active
    .flatMap(module => module.conversionAlternatives?.(G, player.id) ?? [])
    .find(option => option.id === effect.alternative && option.input === effect.input);
  if (effect.alternative !== undefined && (controller !== player.id || !alternative)) {
    return { ok: false, reason: 'conversion-alternative-unavailable' };
  }
  const payment = planPayment(G, registry, effect, localHooks, { [effect.input]: alternative?.cost ?? 3 }, preview);
  if (!payment.ok) return payment;
  const amount = modifyOutput(G, effect, localHooks, 1);
  const payout = payment.transaction.transfer({
    from: 'Bank', to: 'PersonalSupply', playerID: player.id, resource: effect.output, amount,
  });
  if (!payout.ok) return { ok: false, reason: payout.reason };
  return { ok: true, payment: payment.payment, output: amount, commit: payment.transaction.commit };
}

// CORE-01-04-19B..19D: project the exchange and its payment-effect usage in isolated zones.
// The bank transaction replaces balances and can charge other players through payment transfers.
function projectConversion(
  G: CoreState, playerID: string, conversion: ConversionSelection, active: readonly RulesModule[], preview?: PaymentPreview,
) {
  const core = G.exp.core;
  const players = Object.fromEntries(Object.entries(core.players).map(([id, player]) => [
    id, { ...player, personal: { ...player.personal, influence: [...player.personal.influence] } },
  ]));
  const draft: CoreState = { ...G, exp: { ...G.exp, core: {
    ...core, players,
    ...(core.activeMeasureEffects ? { activeMeasureEffects: core.activeMeasureEffects.map(instance => ({ ...instance })) } : {}),
  } } };
  const exchange = planPoliticalAction(draft, { ...conversion, kind: 'convertResources', playerID }, active, preview);
  if (!exchange.ok) return exchange;
  if (exchange.output !== 1) return { ok: false, reason: 'conversion-must-produce' } as const;
  exchange.commit();
  return { ok: true, draft, output: conversion.output, costBreakdown: exchange.payment.transfers,
    replacementUsed: exchange.payment.selection?.replacement !== undefined } as const;
}

type ConversionProjection = Extract<ReturnType<typeof projectConversion>, { ok: true }>;

function spendsConvertedResource(transfers: PlannedPayment['transfers'], playerID: string, output: ResourceId): boolean {
  return transfers.some(entry => entry.playerID === playerID && entry.resource === output && entry.amount > 0);
}

// CORE-01-04-19B/-19C and CORE-01-06-00-05C: pay for a new marker at the Committee with the exchange output.
function planProjectedFormalization(
  projection: ConversionProjection, effect: FormalizationEffect, active: readonly RulesModule[], preview?: PaymentPreview,
): PoliticalPlan {
  const { playerID, tileId, resources, payment } = effect;
  const plan = planPoliticalAction(projection.draft, {
    kind: 'formalizeInfluence', playerID, tileId, resources, payment,
    politicalContinuation: { replacementUsed: projection.replacementUsed },
  }, active, preview);
  if (!plan.ok) return plan;
  if (plan.output !== 1) return { ok: false, reason: 'formalization-must-produce' };
  if (!spendsConvertedResource(plan.payment.transfers, effect.playerID, projection.output)) {
    return { ok: false, reason: 'conversion-output-unspent' };
  }
  return plan;
}

function planConversionAssistedFormalization(
  G: CoreState, effect: FormalizationEffect & { conversion: ConversionSelection }, active: readonly RulesModule[],
  preview?: PaymentPreview,
) {
  const projected = projectConversion(G, effect.playerID, effect.conversion, active, preview);
  if (!projected.ok) return projected;
  const plan = planProjectedFormalization(projected, effect, active, preview);
  if (!plan.ok) return plan;
  // CORE-01-04-19D: commit only after both parts have been planned successfully.
  return { ok: true, commit: () => {
    plan.commit();
    const before = G.exp.core;
    const after = projected.draft.exp.core;
    before.resources = after.resources;
    for (const [id, player] of Object.entries(before.players)) {
      player.personal.resources = after.players[id].personal.resources;
    }
    const player = before.players[effect.playerID];
    const updated = after.players[effect.playerID];
    player.personal.influence = updated.personal.influence;
    player.usedStartCommittee = updated.usedStartCommittee;
    if (after.activeMeasureEffects) before.activeMeasureEffects = after.activeMeasureEffects;
    else delete before.activeMeasureEffects;
  } } as const;
}

function projectedFormalizationQuotes(projection: ConversionProjection, effect: FormalizationEffect, active: readonly RulesModule[]) {
  const options: PaymentQuote[] = [];
  planProjectedFormalization(projection, effect, active, quote => {
    if (spendsConvertedResource(quote.costBreakdown, effect.playerID, projection.output)) options.push(quote);
  });
  return options.filter(quote => planProjectedFormalization(projection, { ...effect, payment: quote.payment }, active).ok);
}

// CORE-01-04-09A and CORE-01-04-19A..19D: price each exchange once and quote its legal completions.
export function* conversionAssistedQuotes(
  G: CoreState, playerID: string, conversions: Iterable<MoveQuote<ConversionSelection>>,
  candidates: Iterable<Pick<FormalizationEffect, 'tileId' | 'resources'>>,
) {
  const targets = [...candidates];
  if (!targets.length) return;
  const active = createExpansionRegistry(G.cfg.expansions);
  for (const { payload: conversion, costBreakdown } of conversions) {
    const projected = projectConversion(G, playerID, conversion, active);
    if (!projected.ok) continue;
    for (const target of targets) {
      for (const quote of projectedFormalizationQuotes(projected, { ...target, kind: 'formalizeInfluence', playerID }, active)) {
        yield {
          contextTile: quote.contextTile,
          costBreakdown: [...costBreakdown, ...quote.costBreakdown],
          payload: { ...target, conversion, ...(quote.payment ? { payment: quote.payment } : {}) },
        };
      }
    }
  }
}

export function checkStartCommitteeFormalization(G: CoreState, playerID: string, tileId: string): ResolveResult {
  if (G.exp.core.allTiles[tileId]?.kind !== 'StartCommittee') return { ok: false, reason: 'invalid-target' };
  const active = createExpansionRegistry(G.cfg.expansions);
  const resorts = createMatchResourceRegistry(active).list();
  const candidates = [...formalizationPayments(resorts, true)].map(resources => ({ tileId, resources }));
  for (const { resources } of candidates) {
    const plan = planPoliticalAction(G, { kind: 'formalizeInfluence', playerID, tileId, resources }, active);
    if (plan.ok) return { ok: true };
    // The Start Committee uses only the base payment. Try another combination if this one is unaffordable.
    if (plan.reason !== 'insufficient') return plan;
  }
  // CORE-01-04-19A and CORE-01-06-00-05C: the Start Committee also accepts a linked Grassroots payment.
  const conversions = buildMoveCatalog(active).definitions.convertResources.quotes?.(G, playerID);
  if (conversions && !conversionAssistedQuotes(G, playerID, conversions as Iterable<MoveQuote<ConversionSelection>>, candidates).next().done) {
    return { ok: true };
  }
  return { ok: false, reason: 'insufficient' };
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
  // CORE-01-06-00-11: validate the registered target before storing the effect.
  if (!Object.hasOwn(G.exp.core.players, instance.owner)
      || (target !== undefined && (!Object.hasOwn(G.exp.core.players, target)
        || module.measureRules?.[instance.sourceCardId]?.targetPlayer?.(G, instance.owner, target) === false))) {
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

// Save compatibility: before usage was shared, it was stored on a Measure deck.
function legacyMeasureUsageDeck(G: CoreState): MeasureDeckState | undefined {
  for (const slice of Object.values(G.exp)) {
    if (slice && 'measures' in slice && slice.measures?.usedThisRound) return slice.measures;
  }
}

function measureUsage(G: CoreState): Record<string, boolean> {
  const legacy = legacyMeasureUsageDeck(G);
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
  const flags = G.exp.core.playedMeasureThisRound ?? legacyMeasureUsageDeck(G)?.usedThisRound;
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
    ? target === undefined || !Object.hasOwn(G.exp.core.players, target) || !rule.targetPlayer(G, playerID, target)
    : target !== undefined) return { ok: false, reason: 'invalid-target' };
  const targetTileId = requested.kind === 'playMeasure' ? requested.targetTileId : undefined;
  const extensionTarget = requested.kind === 'playMeasure' ? rule?.extensionTarget?.plan(G, requested) : undefined;
  if (extensionTarget && !extensionTarget.ok) return extensionTarget;
  if (requested.kind === 'playMeasure' && !rule?.extensionTarget) {
    const extra = MeasureExtensionTargetSchema.safeParse(requested);
    if (!extra.success || Object.values(extra.data).some(value => value !== undefined)) return { ok: false, reason: 'invalid-target' };
  }
  const placement = extensionTarget?.placement ?? G.exp.core.tiles.board.find(tile => tile.tileId === targetTileId);
  if (rule?.targetTile
    ? !placement || !rule.targetTile(G, playerID, G.exp.core.allTiles[placement.tileId], placement.coord)
    : targetTileId !== undefined) return { ok: false, reason: 'invalid-target' };
  const registry = createMatchResourceRegistry(active);
  const targetResort = requested.kind === 'playMeasure' ? requested.targetResort : undefined;
  if (rule?.targetResort
    ? targetResort === undefined || !registry.has(targetResort) || !rule.targetResort(G, targetResort)
    : targetResort !== undefined) return { ok: false, reason: 'invalid-target' };
  // CORE-01-06-00-05(b)/(e): a single targeted Tile supplies the ContextTile.
  const resourceOutputs = rule?.resourceOutputs?.(G, playerID, placement) ?? [];
  const effect = { ...requested, contextCoord: placement?.coord, resourceOutputs };
  const registration = rule?.duration && planMeasureRegistration(G, {
    sourceCardId: measureId, duration: rule.duration, owner: playerID, playNumber: playNumber === 1 ? 1 : 2,
    ...(target === undefined ? {} : { targetPlayerID: target }),
    ...(targetTileId === undefined ? {} : { targetTileId }),
    ...(targetResort === undefined ? {} : { targetResort }),
    ...extensionTarget?.registration,
  }, active, expansion);
  if (registration && !registration.ok) return registration;

  // EXP-01-06-04C and CORE-01-06-00-07/-11: plan the complete payment before moving cards.
  const hooks = active.flatMap(module => module.hooks ?? []);
  if (isProhibited(G, effect, hooks)) return { ok: false, reason: 'prohibited' };
  // CORE-01-06-00-08/-09: an embedded operation shares this card's single payment.
  const operation = extensionTarget?.operation;
  const cost = { ...rule?.cost };
  for (const [resource, amount] of Object.entries(operation?.cost ?? {})) {
    if (amount !== undefined) cost[resource] = (cost[resource] ?? 0) + amount;
  }
  const payment = planPayment(G, registry, effect, hooks, cost, preview);
  if (!payment.ok) return payment;
  for (const output of resourceOutputs) {
    // CORE-01-06-00-11: stage immediate outputs with the same payment.
    const amount = modifyOutput(G, output, hooks, output.amount);
    const payout = payment.transaction.transfer({ from: 'Bank', to: 'PersonalSupply', playerID: output.playerID, resource: output.resource, amount });
    if (!payout.ok) return { ok: false, reason: payout.reason };
  }

  return { ok: true, commit: () => {
    payment.transaction.commit();
    registration?.commit();
    operation?.commit();
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
    if (requested.kind === 'formalizeInfluence' && requested.conversion) {
      const projected = projectConversion(G, requested.playerID, requested.conversion, active);
      if (!projected.ok) return [];
      return projectedFormalizationQuotes(projected, requested, active).map(quote => ({
        ...quote, costBreakdown: [...projected.costBreakdown, ...quote.costBreakdown],
      }));
    }
    const quote = (effect: typeof requested, preview?: PaymentPreview) => {
      switch (effect.kind) {
        case 'takeMeasure':
        case 'playMeasure':
          return planMeasureAction(G, effect, active, preview);
        case 'placeTile':
          return planTilePlacement(G, effect, createMatchResourceRegistry(active), active.flatMap(module => module.hooks ?? []), preview);
        default:
          return isRegisteredAction(effect) ? planExtensionAction(G, effect, active, preview)
            : planPoliticalAction(G, effect, active, preview);
      }
    };
    const options: PaymentQuote[] = [];
    quote(requested, option => options.push(option));
    return options.filter(option => quote({ ...requested, payment: option.payment }).ok);
  }

  function hotspotInfluencePayment(G: CoreState, outcome: ResolveHotspotAtEffect, hooks: readonly ExpansionHooks[]) {
    for (const hook of hooks) {
      const payment = hook.hotspotInfluencePayment?.(G, outcome);
      if (payment) return payment;
    }
  }

  function hotspotDecision(G: CoreState, tileId: string, playerID: string, hooks: readonly ExpansionHooks[]) {
    for (const hook of hooks) {
      const decision = hook.hotspotDecision?.(G, tileId, playerID);
      if (decision) return decision;
    }
  }

  function followUpDecision(G: CoreState, pending: PendingRegulationChoice, hooks: readonly ExpansionHooks[]) {
    for (const hook of hooks) {
      const decision = hook.followUpDecision?.(G, pending);
      if (decision) return decision;
    }
  }

  function effectDecisionQuotes(G: CoreState, decision?: EffectDecision): DecisionQuote[] {
    if (!decision) return [];
    return Array.from(decision.options).flatMap(({ effect, choice }) =>
      actionQuotes(G, effect).map(({ payment, ...quote }) => ({ ...quote, choice: choice(payment) })));
  }

  function hotspotQuotes(G: CoreState, pending = G.exp.core.pendingHotspot): DecisionQuote[] {
    if (!pending) return [];
    const hooks = activeModules(G).flatMap(module => module.hooks ?? []);
    const decision = hotspotDecision(G, pending.tileId, pending.playerID, hooks);
    const choices: DecisionQuote[] = [];
    if (decision?.outcome === pending.outcome) {
      choices.push(...effectDecisionQuotes(G, decision));
    } else {
      const supply = G.exp.core.players[pending.playerID].personal;
      const placement = G.exp.core.tiles.board.find(tile => tile.tileId === pending.tileId);
      if (placement && supply.influence.length > 0) {
        const outcome: ResolveHotspotAtEffect = { kind: 'resolveHotspotAt', coord: placement.coord, contextCoord: placement.coord };
        const payment = !isProhibited(G, outcome, hooks) && hotspotInfluencePayment(G, outcome, hooks);
        if (payment && payment.outcome === pending.outcome) for (const { choice, cost } of payment.options) {
          const costBreakdown = Object.entries(cost).map(([resource, amount]) => ({ playerID: pending.playerID, resource, amount }));
          if (costBreakdown.every(({ resource, amount }) => (supply.resources[resource] ?? 0) >= amount)) {
            choices.push({ choice, contextTile: pending.tileId, costBreakdown });
          }
        }
      }
    }
    if (choices.length > 0) choices.push({ choice: { kind: 'decline' }, contextTile: pending.tileId, costBreakdown: [] });
    return choices;
  }

  function regulationFollowUpQuotes(G: CoreState): DecisionQuote[] {
    const pending = G.exp.core.pendingRegulationChoices?.[0];
    if (!pending) return [];
    const decision = followUpDecision(G, pending, activeModules(G).flatMap(module => module.hooks ?? []));
    return [
      ...effectDecisionQuotes(G, decision),
      {
        choice: { kind: 'decline' },
        contextTile: decision?.contextTile ?? null,
        costBreakdown: [],
      },
    ];
  }

  function completeFollowUp(G: CoreState, decision?: EffectDecision): void {
    G.exp.core.pendingRegulationChoices!.shift();
    if (!G.exp.core.pendingRegulationChoices!.length) delete G.exp.core.pendingRegulationChoices;
    consumeMeasureEffects(G, decision?.consumeOnCompletion ?? []);
  }

  function continueRegisteredDecisions(G: CoreState): void {
    const hooks = activeModules(G).flatMap(module => module.hooks ?? []);
    while (G.exp.core.pendingRegulationChoices?.length) {
      const decision = followUpDecision(G, G.exp.core.pendingRegulationChoices[0], hooks);
      if (effectDecisionQuotes(G, decision).length) break;
      completeFollowUp(G, decision);
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
      // CORE-01-09-00A: a completed winning enclosure stops the remaining events.
      if (influenceLimitWinners(G).length) return;
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

    if (effect.kind === 'completeEmptyPoliticalSlot') {
      // CORE-01-04-09B: complete the slot without attempting or paying for a move.
      const attempts = hooks.flatMap(hook => hook.politicalAttempt?.(G, effect.playerID) ?? []);
      consumeMeasureEffects(G, attempts.filter(attempt => attempt.consumeOnEmptySlot).flatMap(attempt => attempt.consume));
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

    if (effect.kind === 'resetMeasuresRound') {
      // CORE-01-07-17 and EXP-01-06-02A: reset only on an actually begun round.
      if (G.exp.core.playedMeasureThisRound || legacyMeasureUsageDeck(G)) {
        const flags = measureUsage(G);
        for (const id of Object.keys(flags)) flags[id] = false;
      }
      return { ok: true };
    }

    if (isRegisteredAction(effect)) {
      if (extensionAction(active, effect.kind)?.political) {
        return executePoliticalPlan(G, effect.playerID, hooks, preview => planExtensionAction(G, effect, active, preview));
      }
      const plan = planExtensionAction(G, effect, active);
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
      // CORE-01-06-00-11/-12: validate and complete the queued decision once.
      const pending = G.exp.core.pendingRegulationChoices?.[0];
      if (!pending || pending.playerID !== effect.playerID) return { ok: false, reason: 'follow-up-unavailable' };
      const { choice } = effect;
      const decision = followUpDecision(G, pending, hooks);
      if (choice.kind === 'decline') {
        completeFollowUp(G, decision);
      } else {
        const next = decision?.select(choice);
        if (!next) return { ok: false, reason: 'invalid-follow-up' };
        const plan = planExtensionAction(G, next, active);
        if (!plan.ok) return plan;
        completeFollowUp(G, decision);
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
      const decision = hotspotDecision(G, pending.tileId, pending.playerID, hooks);
      if (choice.kind !== 'decline' && decision?.outcome === pending.outcome) {
        const selected = decision.select(choice);
        if (!selected) return { ok: false, reason: 'invalid-hotspot-choice' };
        const placed = resolveEffect(G, selected);
        if (!placed.ok) return placed;
      } else if (choice.kind !== 'decline') {
        const quote = hotspotQuotes(G, pending).find(({ choice: option }) =>
          stableHash(option) === stableHash(choice));
        if (!quote) return { ok: false, reason: 'invalid-hotspot-choice' };
        const supply = G.exp.core.players[pending.playerID].personal.influence;
        // CORE-01-06-00-11: stage the selected payment before committing the Hotspot outcome.
        const transaction = createBankTransaction(G, createMatchResourceRegistry(active));
        for (const transfer of quote.costBreakdown) {
          const fee = transaction.transfer({ from: 'PersonalSupply', to: 'Bank', ...transfer });
          if (!fee.ok) return fee;
        }
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

      // CORE-01-06-04(a): attempt registered effects before checking majority.
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
        // CORE-01-06-04(c): only the entitled player may choose an alternative outcome.
        const choice = hotspotDecision(G, placement.tileId, winner, hooks)?.outcome
          ?? hotspotInfluencePayment(G, outcome, hooks)?.outcome;
        if (choice) {
          const pending: PendingHotspot = { tileId: placement.tileId, playerID: winner, outcome: choice };
          if (hotspotQuotes(G, pending).length) {
            G.exp.core.pendingHotspot = pending;
            return { ok: true };
          }
        } else if (hotspot.hotspotOutcome === undefined) {
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
      if (effect.kind === 'formalizeInfluence' && effect.conversion) {
        const linked = { ...effect, conversion: effect.conversion };
        return executePoliticalPlan(G, effect.playerID, hooks, preview => planConversionAssistedFormalization(G, linked, active, preview));
      }
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
        // CORE-01-06-16A: apply registered receipt limits after the regular split.
        for (const pid of plan.winners) {
          const amount = productionReceipt(G, pid, plan.share, hooks);
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
