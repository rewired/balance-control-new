import type { AxialCoord, CoreState, ExpansionId, MeasureDuration, RegulationOperation, ResourceId, ResortTile, Tile } from './types.js';
import type { ResourceRegistry, ResourceAmounts } from './resources.js';
import type { EffectDescriptor } from './effects.js';
import type { ExpansionFlags, MatchConfig } from './schemas.js';

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
}

export interface ExpansionModule {
  id: ExpansionId;
  registerResources(registry: ResourceRegistry): void;
  setupExpansionState?(G: CoreState, ctx: { numPlayers: number; seed: string }): void;
  tiles?: (config: MatchConfig) => readonly Tile[];
  measureDeck?: (config: MatchConfig) => readonly string[];
  measureRules?: Readonly<Record<string, MeasureRule | undefined>>;
  conversionAlternatives?: (G: CoreState, playerID: string) => readonly ConversionAlternative[];
  extendMoves?: (builder: import('./moves.js').MoveExtensionBuilder) => void;
  hooks?: ExpansionHooks;
}

const _registered: ExpansionModule[] = [];

export function registerExpansion(module: ExpansionModule): void {
  if (_registered.find((m) => m.id === module.id)) return;
  _registered.push(module);
}

export function __resetRegisteredExpansionsForTest() {
  _registered.length = 0;
}

export function createExpansionRegistry(flags: ExpansionFlags | undefined): ExpansionModule[] {
  const enabled: ExpansionId[] = [];
  if (flags?.exp01) enabled.push('exp01');
  if (flags?.exp02) enabled.push('exp02');
  if (flags?.exp03) enabled.push('exp03');
  const filtered = _registered.filter((m) => enabled.includes(m.id));
  filtered.sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  return filtered;
}
