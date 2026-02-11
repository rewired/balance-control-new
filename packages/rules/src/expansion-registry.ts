import type { CoreState, ExpansionId } from './types.js';
import type { ResourceRegistry } from './resources.js';
import type { ExpansionFlags } from './schemas.js';

export interface ExpansionHooks {
  prohibitions?: unknown;
  costIncreases?: unknown;
  outputModifiers?: unknown;
  productionModifiers?: unknown;
}

export interface ExpansionModule {
  id: ExpansionId;
  registerResources(registry: ResourceRegistry): void;
  setupExpansionState(G: CoreState, ctx: { numPlayers: number; seed: string }): void;
  extendMoves?: (moves: unknown) => void;
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