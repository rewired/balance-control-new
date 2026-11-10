import type { AxialCoord, BoardPlacement, CoreState, ExpansionId, MeasureDuration, PendingHotspot, PendingRegulationChoice, ResourceId, ResortTile, Tile } from './types.js';
import type { ResourceRegistry, ResourceAmounts } from './resources.js';
import type { AddResourcesEffect, EffectDescriptor, EffectResolver, PlayMeasureEffect, RegisterMeasureEffect, ResolveHotspotAtEffect, ResolveRegulationEffect } from './effects.js';
import type { ExpansionFlags, FixedPaymentSelection, HotspotChoice, MatchConfig, MeasureExtensionTarget, PaymentSelection, SubstitutionSelection } from './schemas.js';
import type { MajorityResult } from './rule-services.js';

export interface ProhibitionsArgs { G: CoreState; effect: EffectDescriptor }
export interface CostIncreasesArgs { G: CoreState; effect: EffectDescriptor; cost?: Partial<ResourceAmounts> }
export interface OutputModifiersArgs { G: CoreState; effect: EffectDescriptor; amount: number }
export interface Surcharge {
  id: string;
  source: 'measure' | 'regulation';
  resources?: readonly ResourceId[];
  origin?: ExpansionId;
}
export interface ProductionModifiersArgs { G: CoreState; coord: AxialCoord; tile: ResortTile; amount: number }
export type ProductionModifier = { source: 'measure' | 'regulation' | 'other' } & (
  { kind: 'double' } | { kind: 'additive'; delta: number }
);

export interface MeasureRule {
  cost: Readonly<Partial<ResourceAmounts>>;
  targetPlayer?: (G: CoreState, owner: string, target: string) => boolean;
  targetTile?: (G: CoreState, playerID: string, tile: Tile, coord: AxialCoord) => boolean;
  targetResort?: (G: CoreState, resort: ResourceId) => boolean;
  resourceOutputs?: (G: CoreState, playerID: string, placement?: BoardPlacement) => readonly AddResourcesEffect[];
  extensionTarget?: {
    options(G: CoreState): Iterable<MeasureExtensionTarget>;
    plan(G: CoreState, effect: PlayMeasureEffect): MeasureTargetPlan;
  };
  duration?: MeasureDuration;
}

export interface StagedOperation {
  cost?: Partial<ResourceAmounts>;
  commit(): void;
}

export type MeasureTargetPlan = {
  ok: true;
  placement?: BoardPlacement;
  registration?: MeasureExtensionTarget & { targetTileId?: string };
  operation?: StagedOperation;
} | { ok: false; reason: string };

export interface ExtensionAction {
  political?: true;
  context(G: CoreState, effect: ResolveRegulationEffect): { placement: BoardPlacement } | { reason: string };
  plan(G: CoreState, effect: ResolveRegulationEffect, placement: BoardPlacement): StagedOperation | undefined;
}

export interface EffectDecision {
  contextTile: string | null;
  options: Iterable<{ effect: ResolveRegulationEffect; choice(payment?: PaymentSelection): HotspotChoice }>;
  select(choice: HotspotChoice): ResolveRegulationEffect | undefined;
  consumeOnCompletion?: readonly string[];
}
export interface ConversionAlternative {
  id: string;
  input: ResourceId;
  cost: number;
}

export interface FixedPaymentOption {
  selection: FixedPaymentSelection;
  cost: Readonly<ResourceAmounts>;
}

export type PaymentSubstitutionGroup = {
  [Key in keyof SubstitutionSelection]-?: {
    key: Key;
    options: readonly {
      choice: NonNullable<SubstitutionSelection[Key]>;
      from: ResourceId;
      to: ResourceId;
      markUsed?: string;
    }[];
  };
}[keyof SubstitutionSelection];

export interface HotspotInfluencePayment {
  outcome: Exclude<PendingHotspot['outcome'], 'regulation'>;
  options: readonly {
    choice: Exclude<HotspotChoice, { kind: 'decline' | 'regulation' }>;
    cost: Readonly<ResourceAmounts>;
  }[];
}

export interface ExpansionHooks {
  priorityProhibition?: (args: ProhibitionsArgs) => boolean;
  prohibitions?: (args: ProhibitionsArgs) => boolean;
  costIncreases?: (args: CostIncreasesArgs) => Partial<ResourceAmounts> | void;
  surcharges?: (args: CostIncreasesArgs) => readonly Surcharge[] | void;
  outputModifiers?: (args: OutputModifiersArgs) => number | void;
  // CORE-01-06-16-00: report only effects eligible for this tile's production instance.
  productionModifiers?: (args: ProductionModifiersArgs) => readonly ProductionModifier[] | void;
  excludeProductionModifier?: (args: ProductionModifiersArgs, modifier: ProductionModifier) => boolean;
  productionReceiptLimit?: (G: CoreState, playerID: string) => number | undefined;
  paymentRules?: (G: CoreState, effect: EffectDescriptor & { playerID: string }, resources: readonly ResourceId[]) => PaymentRules;
  politicalAttempt?: (G: CoreState, playerID: string) => PoliticalAttemptRule | undefined;
  fixedPaymentOptions?: (args: ProhibitionsArgs) => readonly FixedPaymentOption[] | undefined;
  hotspotInfluencePayment?: (G: CoreState, effect: ResolveHotspotAtEffect) => HotspotInfluencePayment | undefined;
  hotspotDecision?: (G: CoreState, tileId: string, playerID: string) =>
    (EffectDecision & Pick<PendingHotspot, 'outcome'>) | undefined;
  followUpDecision?: (G: CoreState, pending: PendingRegulationChoice) => EffectDecision | undefined;
  beforeHotspot?: (G: CoreState, tileId: string) => readonly { effect: EffectDescriptor; consume: string }[];
  beforeSettlement?: (G: CoreState) => readonly { effect?: EffectDescriptor; consume: string }[];
}

export interface PaymentRules {
  waive?: (cost: Surcharge) => boolean;
  replacements?: (cost: Surcharge) => readonly { resource: ResourceId; amount: number }[];
  transfers?: readonly { effectId: string; playerIDs: readonly string[]; consumeOnCommit?: string }[];
  substitutions?: readonly PaymentSubstitutionGroup[];
}

export interface PoliticalAttemptRule {
  consume: readonly string[];
  consumeOnEmptySlot?: true;
  consumeOnFailure?: (reason: string | undefined, isPayableWithout: (surcharges: readonly string[]) => boolean) => boolean;
}

interface ModuleContributions {
  registerResources(registry: ResourceRegistry): void;
  setupExpansionState?(G: CoreState, ctx: { numPlayers: number; seed: string }): void;
  tiles?: (config: MatchConfig) => readonly Tile[];
  conversionAlternatives?: (G: CoreState, playerID: string) => readonly ConversionAlternative[];
  conversionBaseOutput?: (G: CoreState, resource: ResourceId) => number | undefined;
  extendMoves?: (builder: import('./moves.js').MoveExtensionBuilder) => void;
  hooks?: ExpansionHooks;
}

export interface CoreModule extends ModuleContributions {
  id: 'core';
  createResolver(modules?: readonly RulesModule[]): EffectResolver;
  computeMajority(G: CoreState, coord: AxialCoord): string | null;
  computeMajority(G: CoreState, coord: AxialCoord, format: 'details'): MajorityResult;
  isFullySurrounded(G: CoreState, coord: AxialCoord): boolean;
  initializeMatch(context: {
    numPlayers: number;
    matchSeed: string;
    cfg: MatchConfig;
    registry: ResourceRegistry;
    tiles: readonly Tile[];
  }): CoreState;
}

export interface ExpansionModule extends ModuleContributions {
  id: ExpansionId;
  measureDeck?: (config: MatchConfig) => readonly string[];
  measureRules?: Readonly<Record<string, MeasureRule | undefined>>;
  measurePrefix?: string;
  measureDiscountResource?: ResourceId;
  canRegisterMeasure?: (G: CoreState, instance: RegisterMeasureEffect['instance']) => boolean;
  actions?: Partial<Record<ResolveRegulationEffect['kind'], ExtensionAction>>;
}

export type RulesModule = CoreModule | ExpansionModule;

// EXP-01-06-05E: discount only the printed cost before combining any operation costs.
export function measureBaseCost(G: CoreState, module: ExpansionModule | undefined, measureId: string): Partial<ResourceAmounts> {
  const cost = { ...module?.measureRules?.[measureId]?.cost };
  const resource = module?.measureDiscountResource;
  if (G.cfg.variants.measureRegulationAccess && resource !== undefined) {
    const amount = cost[resource] ?? 0;
    if (amount > 1) cost[resource] = amount - 1;
    else delete cost[resource];
  }
  return cost;
}

const registered: ExpansionModule[] = [];
let core: CoreModule | undefined;

export function registerExpansion(module: RulesModule): void {
  if (module.id === 'core') {
    core ??= module;
    return;
  }
  if (registered.some(m => m.id === module.id)) return;
  registered.push(module);
  registered.sort((a, b) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
}

export function __resetRegisteredExpansionsForTest() {
  registered.length = 0;
}

export function getCoreExpansion(): CoreModule {
  if (!core) throw new Error('Register the mandatory CORE expansion before using the rules engine');
  return core;
}

export function createExpansionRegistry(
  flags: ExpansionFlags | undefined,
  candidates: readonly RulesModule[] = registered,
): [CoreModule, ...ExpansionModule[]] {
  const enabled = candidates.filter((module): module is ExpansionModule =>
    module.id !== 'core' && flags?.[module.id] === true);
  return [getCoreExpansion(), ...enabled];
}
