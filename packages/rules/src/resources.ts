import type { ResourceId } from './types.js';

export interface ResourceMeta { label?: string; icon?: string }

export interface ResourceRegistry {
  register(id: ResourceId, meta?: ResourceMeta): void;
  list(): ResourceId[];
  has(id: ResourceId): boolean;
}

export function createResourceRegistry(): ResourceRegistry {
  const ids: ResourceId[] = [];
  const set = new Set<ResourceId>();
  function register(id: ResourceId, ) {
    if (set.has(id)) return;
    set.add(id);
    ids.push(id);
  }
  return {
    register,
    list: () => ids.slice(),
    has: (id: ResourceId) => set.has(id),
  };
}

export function createCoreResourceRegistry(): ResourceRegistry {
  const r = createResourceRegistry();
  // Deterministic insertion order
  r.register('DOM');
  r.register('FOR');
  r.register('INF');
  return r;
}

export type ResourceAmounts = Record<ResourceId, number>;

export function makeEmptyResourceBank(registry: ResourceRegistry): ResourceAmounts {
  const out: ResourceAmounts = Object.create(null);
  for (const id of registry.list()) out[id] = 0;
  return out;
}

export function assertKnownKeys(registry: ResourceRegistry, amounts: Partial<ResourceAmounts>) {
  for (const k of Object.keys(amounts)) if (!registry.has(k)) throw new Error(`Unknown resource: ${k}`);
}

export function addResources(registry: ResourceRegistry, bank: ResourceAmounts, delta: Partial<ResourceAmounts>): void {
  assertKnownKeys(registry, delta);
  for (const k of Object.keys(delta)) bank[k] += delta[k]!;
}

export function canPay(registry: ResourceRegistry, bank: ResourceAmounts, cost: Partial<ResourceAmounts>): boolean {
  assertKnownKeys(registry, cost);
  for (const k of Object.keys(cost)) if ((bank[k] ?? 0) < (cost[k] ?? 0)) return false;
  return true;
}

export function subResources(registry: ResourceRegistry, bank: ResourceAmounts, cost: Partial<ResourceAmounts>): void {
  if (!canPay(registry, bank, cost)) throw new Error('Insufficient resources');
  for (const k of Object.keys(cost)) bank[k] -= cost[k]!;
}

export function assertNonNegative(bank: ResourceAmounts): void {
  for (const [k, v] of Object.entries(bank)) if (v < 0) throw new Error(`Negative balance: ${k}=${v}`);
}