import type { ResourceId, ResortTile } from './types.js';

export function createResortTiles(resort: ResourceId, counts: Partial<Record<ResortTile['w'], number>>): ResortTile[] {
  return ([1, 2, 3, 4, 5] as const).flatMap(w => Array.from({ length: counts[w] ?? 0 }, (_, i) => ({
    id: `${resort}-W${w}-${i + 1}`, kind: 'ResortTile', resort, w,
  })));
}
// CORE-01-04-22A and VAR-01-07-02/-03: the printed exchange, before local effects.
export function grassrootsExchange(rate?: 'standard' | 'efficient' | 'bulk'): { cost: number; output: number } {
  if (rate === 'efficient') return { cost: 2, output: 1 };
  if (rate === 'bulk') return { cost: 4, output: 2 };
  return { cost: 3, output: 1 };
}
