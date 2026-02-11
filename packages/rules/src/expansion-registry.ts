import type { AxialCoord, CoreState, ExpansionId, ResortTile } from './types.js';
import type { ResourceRegistry, ResourceAmounts } from './resources.js';
import type { EffectDescriptor } from './effects.js';
import type { ExpansionFlags } from './schemas.js';

export interface ProhibitionsArgs { G: CoreState; effect: EffectDescriptor }
export interface CostIncreasesArgs { G: CoreState; effect: EffectDescriptor; cost?: Partial<ResourceAmounts> }
export interface OutputModifiersArgs { G: CoreState; effect: EffectDescriptor; amount: number }
export interface ProductionModifiersArgs { G: CoreState; coord: AxialCoord; tile: ResortTile; amount: number }
export type ProductionModifier = (amount: number) => number;

export interface ExpansionHooks {
  prohibitions?: (args: ProhibitionsArgs) => boolean;
  costIncreases?: (args: CostIncreasesArgs) => Partial<ResourceAmounts> | void;
  outputModifiers?: (args: OutputModifiersArgs) => number | void;
  productionModifiers?: (args: ProductionModifiersArgs) => ProductionModifier[] | void;
}

export interface ExpansionModule {
  id: ExpansionId;
  registerResources(registry: ResourceRegistry): void;
  setupExpansionState(G: CoreState, ctx: { numPlayers: number; seed: string }): void;
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

export function ensureExpansionSlice<T extends object>(G: CoreState, id: ExpansionId, initial: T): T {
  if (!G.exp) (G as CoreState & { exp: NonNullable<CoreState['exp']> }).exp = {} as NonNullable<CoreState['exp']>;
  const exp = G.exp as Record<string, unknown>;
  if (!exp[id]) exp[id] = initial as unknown as NonNullable<CoreState['exp']>[keyof NonNullable<CoreState['exp']>];
  return exp[id] as T;
}
