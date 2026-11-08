import type { ResourceId, ResortTile } from './types.js';

export function createResortTiles(resort: ResourceId, counts: Partial<Record<ResortTile['w'], number>>): ResortTile[] {
  return ([1, 2, 3, 4, 5] as const).flatMap(w => Array.from({ length: counts[w] ?? 0 }, (_, i) => ({
    id: `${resort}-W${w}-${i + 1}`, kind: 'ResortTile', resort, w,
  })));
}
