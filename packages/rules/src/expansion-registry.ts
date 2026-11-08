import type { AxialCoord, BoardPlacement, BoardRegulation, CoreState, ExpansionId, MeasureDuration, PendingRegulationChoice, RegulationKind, RegulationOperation, ResourceId, ResortTile, Tile } from './types.js';
import type { ResourceRegistry, ResourceAmounts } from './resources.js';
import type { EffectDescriptor, EffectResolver, RegisterMeasureEffect, ResolveRegulationEffect } from './effects.js';
import type { ExpansionFlags, MatchConfig } from './schemas.js';
import type { MajorityResult } from './rule-services.js';

export interface ProhibitionsArgs { G: CoreState; effect: EffectDescriptor }
export interface CostIncreasesArgs { G: CoreState; effect: EffectDescriptor; cost?: Partial<ResourceAmounts> }
export interface OutputModifiersArgs { G: CoreState; effect: EffectDescriptor; amount: number }
export interface Surcharge {
  id: string;
  source: 'measure' | 'regulation';
  resources?: readonly ResourceId[];
  climate?: true;
}
export interface ProductionModifiersArgs { G: CoreState; coord: AxialCoord; tile: ResortTile; amount: number }
export type ProductionModifier = { source: 'measure' | 'regulation' | 'other' } & (
  { kind: 'double' } | { kind: 'additive'; delta: number }
);

export interface MeasureRule {
  cost: Readonly<Partial<ResourceAmounts>>;
  targetPlayer?: 'any' | 'opponent';
  targetTile?: (G: CoreState, playerID: string, tile: Tile, coord: AxialCoord) => boolean;
  targetResort?: 'any' | 'unique';
  gainTargetResort?: true;
  targetRegulation?: true;
  regulation?: { timing: 'immediate' | 'settlement'; operation: RegulationOperation['operation']; hotspotOnly?: true };
  duration?: MeasureDuration;
}

export interface ConversionAlternative {
  id: string;
  input: ResourceId;
  cost: number;
}

export interface ExpansionHooks {
  blockade?: (args: ProhibitionsArgs) => boolean;
  prohibitions?: (args: ProhibitionsArgs) => boolean;
  costIncreases?: (args: CostIncreasesArgs) => Partial<ResourceAmounts> | void;
  surcharges?: (args: CostIncreasesArgs) => readonly Surcharge[] | void;
  outputModifiers?: (args: OutputModifiersArgs) => number | void;
  // CORE-01-06-16-00: report only effects eligible for this tile's production instance.
  productionModifiers?: (args: ProductionModifiersArgs) => readonly ProductionModifier[] | void;
  suppressMeasureProduction?: (G: CoreState, coord: AxialCoord) => boolean;
  productionReceiptLimit?: (G: CoreState, playerID: string) => number | undefined;
  paymentModifiers?: (G: CoreState, effect: EffectDescriptor & { playerID: string }) => PaymentModifiers;
  budgetDeficits?: (G: CoreState, playerID?: string) => readonly string[];
  greenwashing?: (G: CoreState) => readonly ('CLM' | 'INF')[] | undefined;
  beforeHotspot?: (G: CoreState, tileId: string) => readonly { effect: ResolveRegulationEffect; consume: string }[];
  beforeSettlement?: (G: CoreState) => readonly { effect?: ResolveRegulationEffect; consume: string }[];
}

export interface PaymentModifiers {
  waiveClimateSurcharges?: boolean;
  replaceSurcharge?: boolean;
  transferSurchargeIds?: readonly string[];
  councils?: readonly { id: string; resource: ResourceId }[];
  partnerships?: readonly { id: string; resource: ResourceId }[];
}

interface ModuleContributions {
  registerResources(registry: ResourceRegistry): void;
  setupExpansionState?(G: CoreState, ctx: { numPlayers: number; seed: string }): void;
  tiles?: (config: MatchConfig) => readonly Tile[];
  conversionAlternatives?: (G: CoreState, playerID: string) => readonly ConversionAlternative[];
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
  canRegisterMeasure?: (G: CoreState, instance: RegisterMeasureEffect['instance']) => boolean;
  regulations?: RegulationRules;
}

export interface RegulationRules {
  initialize(G: CoreState): void;
  attached(G: CoreState): readonly BoardRegulation[];
  mayAttach(tile: Tile, kind: RegulationKind): boolean;
  context(G: CoreState, operation: RegulationOperation): BoardPlacement | undefined;
  authorityContext(G: CoreState, request: ResolveRegulationEffect): BoardPlacement | undefined;
  operations(G: CoreState, kind: RegulationOperation['operation']): Iterable<RegulationOperation>;
  plan(G: CoreState, operation: RegulationOperation, playerID: string, authorityTileId?: string):
    { cost?: Partial<ResourceAmounts>; commit(): void } | undefined;
  followUpOperations(G: CoreState, pending: PendingRegulationChoice): readonly RegulationOperation[];
  permitsFollowUp(pending: PendingRegulationChoice, operation: RegulationOperation): boolean;
  followUpContext(G: CoreState, pending: PendingRegulationChoice): string | null;
}

export type RulesModule = CoreModule | ExpansionModule;

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

export function getRegulationRules(G: CoreState, modules: readonly RulesModule[] = createExpansionRegistry(G.cfg.expansions)) {
  return modules.find((module): module is ExpansionModule => module.id !== 'core' && !!module.regulations)?.regulations;
}
