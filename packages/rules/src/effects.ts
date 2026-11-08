import { shuffleSeeded, stableHash } from '@bc/shared';
import type { ActiveMeasureEffect, AxialCoord, CoreState, Influence, MeasureDeckState, ResourceId, ExpansionId } from './types.js';
import { createMatchResourceRegistry, type ResourceAmounts, type ResourceRegistry } from './resources.js';
import { createExpansionRegistry, ensureExpansionSlice, type ExpansionHooks, type ExpansionModule } from './expansion-registry.js';
import { isFullySurrounded } from './hotspot.js';
import { planProductionForTile } from './production.plan.js';
import { computeMajority, getControl } from './majority.js';
import { isLegalPlacement, legalPlacementCoords } from './placement.js';
import { getTopology } from './topology/index.js';

export type EffectKind =
  | 'addResources'
  | 'drawTile'
  | 'placeTile'
  | 'resolveHotspotAt'
  | 'applyProductionAt'
  | 'registerMeasureEffect'
  | 'expireMeasureEffects'
  | 'addNoise'
  | PoliticalActionEffect['kind']
  | 'initMeasures'
  | 'takeMeasure'
  | 'playMeasure'
  | 'resetMeasuresRound'
  | 'recordTurnHash';

export interface BaseEffect {
  contextCoord?: AxialCoord; // ContextTile binding (AGENTS §3.5 step 1)
}

export interface AddResourcesEffect extends BaseEffect {
  kind: 'addResources';
  playerID: string;
  resource: ResourceId;
  amount: number; // base amount before modifiers
  cost?: Partial<Record<ResourceId, number>>; // paid from player personal supply
}

export interface DrawTileEffect extends BaseEffect {
  kind: 'drawTile';
  playerID: string;
  turn: number;
}

export interface PlaceTileEffect extends BaseEffect {
  kind: 'placeTile';
  playerID: string;
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

interface RegisterMeasureEffect extends BaseEffect {
  kind: 'registerMeasureEffect';
  instance: Omit<ActiveMeasureEffect, 'id'>;
}

type ExpireMeasureEffects = BaseEffect & { kind: 'expireMeasureEffects' } & (
  { boundary: 'settlementEnd' } | { boundary: 'turnStart'; playerID: string }
);

export interface AddNoiseEffect extends BaseEffect {
  kind: 'addNoise';
  resource: ResourceId;
  amount: number;
}

export type PoliticalActionEffect = BaseEffect & { playerID: string } & (
  | { kind: 'placeOrMoveInfluence'; markerId: string; targetTileId: string; sourceTileId?: string }
  | { kind: 'formalizeInfluence'; tileId: string; resources: ResourceId[] }
  | { kind: 'convertResources'; tileId: string; input: ResourceId; output: ResourceId; alternative?: string }
);

export interface InitMeasuresEffect extends BaseEffect {
  kind: 'initMeasures';
  expansion: ExpansionId;
  deck: readonly string[];
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
  targetPlayerID?: string;
}
export interface ResetMeasuresRoundEffect extends BaseEffect {
  kind: 'resetMeasuresRound';
}

interface RecordTurnHashEffect extends BaseEffect {
  kind: 'recordTurnHash';
  turn: number;
  playerID: string;
}

export type EffectDescriptor =
  | AddResourcesEffect
  | DrawTileEffect
  | PlaceTileEffect
  | ResolveHotspotAtEffect
  | ApplyProductionAtEffect
  | RegisterMeasureEffect
  | ExpireMeasureEffects
  | AddNoiseEffect
  | PoliticalActionEffect
  | InitMeasuresEffect
  | TakeMeasureEffect
  | PlayMeasureEffect
  | ResetMeasuresRoundEffect
  | RecordTurnHashEffect;

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
  const bank = copyBalances(G.resources.bank);
  const noise = copyBalances(G.resources.noise);
  const supplies = new Map<string, ResourceAmounts>();
  let changed = false;

  function transfer({ resource, amount, ...route }: BankTransfer): ResolveResult {
    if (!registry.has(resource)) return { ok: false, reason: 'inactive-resource' };
    if (!isResourceCount(amount)) return { ok: false, reason: 'invalid-resource-amount' };

    let account = noise;
    if (route.to !== 'Noise') {
      const { playerID } = route;
      if (!Object.hasOwn(G.players, playerID)) return { ok: false, reason: 'no-player' };
      account = supplies.get(playerID) ?? copyBalances(G.players[playerID].personal.resources);
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
    G.resources = { bank, noise };
    for (const [playerID, balances] of supplies) G.players[playerID].personal.resources = balances;
  }

  return { transfer, commit };
}

// CORE-01-06-00-07(b) and -11: build the complete payment without mutating game zones.
function planPayment(
  G: CoreState,
  registry: ResourceRegistry,
  effect: EffectDescriptor & { playerID: string },
  hooks: readonly ExpansionHooks[],
  baseCost?: Partial<ResourceAmounts>,
): { ok: true; transaction: ReturnType<typeof createBankTransaction> } | { ok: false; reason?: string } {
  const cost: Partial<ResourceAmounts> = Object.assign(Object.create(null), baseCost);
  for (const hook of hooks) {
    const delta = hook.costIncreases?.({ G, effect, cost });
    for (const [resource, amount] of Object.entries(delta ?? {})) cost[resource] = (cost[resource] ?? 0) + (amount ?? 0);
  }
  const transaction = createBankTransaction(G, registry);
  for (const [resource, amount] of Object.entries(cost)) {
    const result = transaction.transfer({ from: 'PersonalSupply', to: 'Bank', playerID: effect.playerID, resource, amount: amount ?? 0 });
    if (!result.ok) return { ok: false, reason: result.reason };
  }
  return { ok: true, transaction };
}

function isProhibited(G: CoreState, effect: EffectDescriptor, hooks: readonly ExpansionHooks[]): boolean {
  return hooks.some(hook => hook.prohibitions?.({ G, effect }));
}

function modifyOutput(G: CoreState, effect: EffectDescriptor, hooks: readonly ExpansionHooks[], baseAmount: number): number {
  let amount = baseAmount;
  for (const hook of hooks) amount = hook.outputModifiers?.({ G, effect, amount }) ?? amount;
  return Math.max(0, amount);
}

// CORE-01-04-11 and CORE-01-06-06: transfer the actual object between zones.
function placeSupplyMarker(G: CoreState, supply: Influence[], index: number, tileId: string): void {
  const [marker] = supply.splice(index, 1);
  (G.influencesOnBoard ??= []).push({ ...marker, tileId });
}

function planPoliticalAction(
  G: CoreState,
  requested: PoliticalActionEffect,
  active: readonly ExpansionModule[],
): { ok: true; commit: () => void } | { ok: false; reason?: string } {
  const registry = createMatchResourceRegistry(active);
  const hooks = active.flatMap(module => module.hooks ?? []);
  if (!Object.hasOwn(G.players, requested.playerID)) return { ok: false, reason: 'no-player' };
  const player = G.players[requested.playerID];
  const supply = player.personal.influence;
  const board = G.influencesOnBoard ?? [];
  const tileId = requested.kind === 'placeOrMoveInfluence' ? requested.targetTileId : requested.tileId;
  const placement = G.tiles.board.find(tile => tile.tileId === tileId);
  if (!placement) return { ok: false, reason: 'tile-not-on-board' };
  const tile = G.allTiles[tileId];
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
    const payment = planPayment(G, registry, effect, localHooks);
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
    if (Object.values(G.players).some(p => p.personal.influence.some(marker => marker.starting))) {
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
    const payment = planPayment(G, registry, effect, localHooks, cost);
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
  const payment = planPayment(G, registry, effect, localHooks, { [effect.input]: alternative?.cost ?? 3 });
  if (!payment.ok) return payment;
  const amount = modifyOutput(G, effect, localHooks, 1);
  const payout = payment.transaction.transfer({
    from: 'Bank', to: 'PersonalSupply', playerID: player.id, resource: effect.output, amount,
  });
  if (!payout.ok) return { ok: false, reason: payout.reason };
  return { ok: true, commit: payment.transaction.commit };
}

// CORE-01-04-05A/-05B: previews and placements share the same legality and payment check.
function planTilePlacement(G: CoreState, effect: PlaceTileEffect, registry: ResourceRegistry, hooks: readonly ExpansionHooks[]) {
  if (G.tiles.drawResolution?.tileId !== effect.tileId) return { ok: false, reason: 'tile-not-drawn' } as const;
  if (!Object.hasOwn(G.players, effect.playerID)) return { ok: false, reason: 'no-player' } as const;
  if (!isLegalPlacement(G.tiles.board, effect.coord, getTopology(G.cfg.topology))) {
    return { ok: false, reason: 'illegal-coordinate' } as const;
  }
  const placement = { ...effect, contextCoord: effect.coord };
  if (isProhibited(G, placement, hooks)) return { ok: false, reason: 'prohibited' } as const;
  return planPayment(G, registry, placement, hooks);
}

// CORE-01-04-04/-06/-07 and VAR-01-01-04 through -08: resolve attempts in the current draw phase.
function drawTile(G: CoreState, effect: DrawTileEffect, registry: ResourceRegistry, hooks: readonly ExpansionHooks[]): ResolveResult {
  if (G.tiles.drawResolution) return { ok: false, reason: 'draw-pending' };
  if (!Object.hasOwn(G.players, effect.playerID)) return { ok: false, reason: 'no-player' };
  const { tileRecycling } = G.cfg.variants;
  const attempted = new Set<string>();
  const geometry = legalPlacementCoords(G.tiles.board, getTopology(G.cfg.topology));

  while (G.tiles.drawPile.length > 0) {
    const index = tileRecycling ? G.tiles.drawPile.findIndex(id => !attempted.has(id)) : 0;
    if (index < 0) break;
    const [tileId] = G.tiles.drawPile.splice(index, 1);
    attempted.add(tileId);
    const drawn = { tileId, legalCoords: [] as AxialCoord[] };
    G.tiles.drawResolution = drawn;

    drawn.legalCoords = geometry.filter(coord => planTilePlacement(G, {
      kind: 'placeTile', tileId, coord, playerID: effect.playerID,
    }, registry, hooks).ok);
    if (drawn.legalCoords.length > 0) return { ok: true };

    G.tiles.drawResolution = null;
    if (tileRecycling && geometry.length === 0) {
      // VAR-01-01-05: reshuffle by match seed, turn and attempt, skipping returned IDs on the next draw.
      G.tiles.drawPile = shuffleSeeded([...G.tiles.drawPile, tileId], `${G.matchSeed}|tile-recycling|${effect.turn}|${attempted.size}`);
    } else {
      G.tiles.discardFaceUp.push(tileId);
    }
  }
  return { ok: true };
}

type MeasureAction = TakeMeasureEffect | PlayMeasureEffect;

function planMeasureRegistration(
  G: CoreState,
  instance: Omit<ActiveMeasureEffect, 'id'>,
): { ok: true; commit: () => void } | { ok: false; reason: string } {
  // EXP-01-07-08/-09 and EXP-03-03-02A: keep an eligible card play independent of its card zone.
  const climate = instance.sourceCardId === 'CLM_M11';
  if (!G.cfg.expansions.exp01 || (climate && !G.cfg.expansions.exp03)) return { ok: false, reason: 'inactive-measure' };
  const target = instance.targetPlayerID;
  // EXP-01-08-M09-03 and EXP-03-08-M11-03.
  if (!Object.hasOwn(G.players, instance.owner)
      || (instance.sourceCardId === 'ECO_M03' ? target !== undefined : target === undefined || !Object.hasOwn(G.players, target))
      || (instance.sourceCardId === 'ECO_M09' && instance.owner === target)) return { ok: false, reason: 'invalid-target' };
  const id = `${instance.sourceCardId}:${instance.playNumber}`;
  if (G.activeMeasureEffects?.some(registered => registered.id === id)) return { ok: false, reason: 'duplicate-effect' };
  return { ok: true, commit: () => { (G.activeMeasureEffects ??= []).push({ ...instance, id }); } };
}

function measureUsage(G: CoreState): Record<string, boolean> {
  const legacy = G.exp?.exp01?.measures;
  const flags = G.playedMeasureThisRound ??= legacy?.usedThisRound ?? Object.fromEntries(
    Object.keys(G.players).map(playerID => [playerID, false]),
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
  effect: MeasureAction,
  active: readonly ExpansionModule[],
): { ok: true; commit: () => void } | { ok: false; reason?: string } {
  const { expansion, playerID, measureId } = effect;
  const deck = G.cfg.expansions[expansion] ? G.exp?.[expansion]?.measures : undefined;
  if (!deck || !Object.hasOwn(G.players, playerID)) return { ok: false, reason: 'measure-action-unavailable' };
  const take = effect.kind === 'takeMeasure';
  const hand = deck.hands[playerID] ?? [];
  const index = (take ? deck.open : hand).indexOf(measureId);
  if (index < 0) return { ok: false, reason: take ? 'not-open' : 'not-in-hand' };
  // EXP-01-06-02..03: both limits are shared across decks.
  const flags = G.playedMeasureThisRound ?? G.exp?.exp01?.measures?.usedThisRound;
  if (!take && flags?.[playerID]) return { ok: false, reason: 'limit-per-round' };
  const enabled = (Object.keys(G.cfg.expansions) as ExpansionId[]).filter(id => G.cfg.expansions[id]);
  if (take && enabled.reduce((sum, id) => sum + (G.exp?.[id]?.measures?.hands[playerID]?.length ?? 0), 0) >= 2) {
    return { ok: false, reason: 'hand-full' };
  }
  const rules = active.find(module => module.id === expansion)?.measureRules;
  const rule = effect.kind === 'playMeasure' ? rules?.[measureId] : undefined;
  const playNumber = (deck.playCounts[measureId] ?? 0) + 1;
  if (!take && playNumber > 2) return { ok: false, reason: 'play-limit' };
  if (!take && rules && !rule) return { ok: false, reason: 'measure-unavailable' };
  const target = effect.kind === 'playMeasure' ? effect.targetPlayerID : undefined;
  if (rule?.targetPlayer
    ? target === undefined || !Object.hasOwn(G.players, target) || (rule.targetPlayer === 'opponent' && target === playerID)
    : target !== undefined) return { ok: false, reason: 'invalid-target' };
  const registration = rule?.continuingEffect && planMeasureRegistration(G, {
    sourceCardId: rule.continuingEffect, owner: playerID, playNumber: playNumber === 1 ? 1 : 2,
    ...(target === undefined ? {} : { targetPlayerID: target }),
  });
  if (registration && !registration.ok) return registration;

  // EXP-01-06-04C and CORE-01-06-00-07/-11: plan the complete payment before moving cards.
  const hooks = active.flatMap(module => module.hooks ?? []);
  if (isProhibited(G, effect, hooks)) return { ok: false, reason: 'prohibited' };
  const payment = planPayment(G, createMatchResourceRegistry(active), effect, hooks, rule?.cost);
  if (!payment.ok) return payment;

  return { ok: true, commit: () => {
    payment.transaction.commit();
    registration?.commit();
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

export function createResolver(modules?: readonly ExpansionModule[]) {
  function activeModules(G: CoreState) {
    return modules?.filter(module => G.cfg.expansions[module.id]) ?? createExpansionRegistry(G.cfg.expansions);
  }

  function previewPoliticalAction(G: CoreState, effect: PoliticalActionEffect): boolean {
    return planPoliticalAction(G, effect, activeModules(G)).ok;
  }
  function previewMeasureAction(G: CoreState, effect: MeasureAction): boolean {
    return planMeasureAction(G, effect, activeModules(G)).ok;
  }

  function resolveEffect(G: CoreState, requested: EffectDescriptor): ResolveResult {
    // CORE-01-06-00-05(c): production checks local prohibitions on the producing Tile.
    const effect = requested.kind === 'applyProductionAt' ? { ...requested, contextCoord: requested.coord } : requested;
    if (effect.kind === 'recordTurnHash') {
      // AGENTS 5.3: hash the completed turn, excluding the previous checkpoint.
      G.lastTurnHash = stableHash({ state: { ...G, lastTurnHash: undefined }, turn: effect.turn, playerID: effect.playerID });
      return { ok: true };
    }

    if (effect.kind === 'registerMeasureEffect') {
      const registration = planMeasureRegistration(G, effect.instance);
      if (!registration.ok) return registration;
      registration.commit();
      return { ok: true };
    }

    if (effect.kind === 'expireMeasureEffects') {
      // CORE-01-07-10/-11/-14/-17, EXP-01-08-M03-03, EXP-01-08-M09-04/-07 and EXP-03-08-M11-04.
      const previous = G.activeMeasureEffects;
      if (!previous) return { ok: true };
      const remaining = previous.filter(instance => effect.boundary === 'settlementEnd'
        ? instance.sourceCardId === 'CLM_M11'
        : instance.sourceCardId !== 'CLM_M11' || instance.owner !== effect.playerID);
      if (remaining.length === 0) delete G.activeMeasureEffects;
      else if (remaining.length !== previous.length) G.activeMeasureEffects = remaining;
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
        hands: Object.fromEntries(Object.keys(G.players).map(playerID => [playerID, []])),
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
      if (G.playedMeasureThisRound || G.exp?.exp01?.measures) {
        const flags = measureUsage(G);
        for (const id of Object.keys(flags)) flags[id] = false;
      }
      return { ok: true };
    }

    const active = activeModules(G);
    const hooks = active.map(module => module.hooks).filter(hook => hook !== undefined);

    if (effect.kind === 'takeMeasure' || effect.kind === 'playMeasure') {
      const plan = planMeasureAction(G, effect, active);
      if (!plan.ok) return plan;
      plan.commit();
      return { ok: true };
    }

    if (effect.kind === 'drawTile') return drawTile(G, effect, createMatchResourceRegistry(active), hooks);
    if (effect.kind === 'placeTile') {
      // CORE-01-04-04/-05B: transfer the offered tile and its payment together.
      const plan = planTilePlacement(G, effect, createMatchResourceRegistry(active), hooks);
      if (!plan.ok) return plan;
      const topology = getTopology(G.cfg.topology);
      // CORE-01-06-02/-02A: only a first full enclosure can generate an event.
      const candidates = G.tiles.board.filter(p => !p.enclosureProcessed && G.allTiles[p.tileId]?.kind === 'Hotspot'
        && topology.adjacent(p.coord, effect.coord) && !isFullySurrounded(G, p.coord));
      const placed = { tileId: effect.tileId, coord: effect.coord };
      plan.transaction.commit();
      G.tiles.board.push(placed);
      G.tiles.drawResolution = null;

      // CORE-01-06-03/-03A: resolve all enclosures before the political action, in ordinal Tile ID order.
      if (G.allTiles[placed.tileId]?.kind === 'Hotspot') candidates.push(placed);
      candidates.sort((a, b) => a.tileId < b.tileId ? -1 : a.tileId > b.tileId ? 1 : 0);
      for (const candidate of candidates) {
        resolveEffect(G, { kind: 'resolveHotspotAt', coord: candidate.coord });
      }
      return { ok: true };
    }

    if (effect.kind === 'resolveHotspotAt') {
      const placement = G.tiles.board.find(p => p.coord.q === effect.coord.q && p.coord.r === effect.coord.r);
      const hotspot = placement && G.allTiles[placement.tileId];
      // CORE-01-06-01/-02A: check geometry and the persisted guard before evaluating the event.
      if (!placement || placement.enclosureProcessed || hotspot?.kind !== 'Hotspot'
          || !isFullySurrounded(G, placement.coord)) return { ok: true };

      // CORE-01-06-00-05(d) and CORE-01-06-04(b)/(c): bind the Hotspot, then check its majority and outcome.
      const outcome = { ...effect, contextCoord: placement.coord };
      const winner = computeMajority(G, placement.coord);
      // EXP-02-02-G-07: the special Inner Order outcome never awards Influence.
      if (winner !== null && hotspot.hotspotOutcome !== 'regulation' && !isProhibited(G, outcome, hooks)) {
        // CORE-01-06-05/-06/-07 and CORE-01-06-00-07(a): transfer one existing marker without a payer.
        const supply = G.players[winner].personal.influence;
        const amount = modifyOutput(G, outcome, hooks, 1);
        if (amount === 1 && supply.length > 0) placeSupplyMarker(G, supply, supply.length - 1, placement.tileId);
      }
      // CORE-01-06-04(d)/-04A: consume the enclosure even when its outcome did not execute.
      placement.enclosureProcessed = true;
      return { ok: true };
    }

    if (effect.kind === 'placeOrMoveInfluence' || effect.kind === 'formalizeInfluence' || effect.kind === 'convertResources') {
      const plan = planPoliticalAction(G, effect, active);
      if (!plan.ok) return plan;
      plan.commit();
      return { ok: true };
    }

    // 1) Assign ContextTile (already part of descriptor)
    const immune = isStartCommitteeContext(G, effect.contextCoord); // AGENTS §3.7

    // 2) Prohibitions
    if (!immune && isProhibited(G, effect, hooks)) return { ok: false, reason: 'prohibited' };

    switch (effect.kind) {
      case 'addResources': { // CORE-01-06-00-07(b), CORE-01-06-00-11
        const registry = createMatchResourceRegistry(active);
        if (!registry.has(effect.resource)) return { ok: false, reason: 'inactive-resource' };
        if (!Object.hasOwn(G.players, effect.playerID)) return { ok: false, reason: 'no-player' };

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
        const limits = G.cfg.expansions.exp01 && G.cfg.expansions.exp03 ? G.activeMeasureEffects : undefined;
        for (const pid of plan.winners) {
          const limited = limits?.some(instance => instance.sourceCardId === 'CLM_M11' && instance.targetPlayerID === pid);
          const amount = limited ? Math.min(plan.share, 1) : plan.share;
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

  return Object.assign(resolveEffect, { previewPoliticalAction, previewMeasureAction });
}
