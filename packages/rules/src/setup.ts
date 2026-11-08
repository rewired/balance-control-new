import type { CoreState } from './types.js';
import { createMatchResourceRegistry } from './resources.js';
import { createExpansionRegistry } from './expansion-registry.js';
import { MatchConfigSchema, validateMatchPlayerCount, type MatchConfigInput } from './schemas.js';

export { createResortTiles } from './tiles.js';

export function buildInitialCoreState(numPlayers: number, matchSeed: string, config: MatchConfigInput = {}): CoreState {
  const cfg = MatchConfigSchema.parse(config);
  const invalidCount = validateMatchPlayerCount(numPlayers, cfg.addOn56);
  if (invalidCount) throw new RangeError(invalidCount);
  const modules = createExpansionRegistry(cfg.expansions);
  const [foundation] = modules;
  return foundation.initializeMatch({
    numPlayers,
    matchSeed,
    cfg,
    registry: createMatchResourceRegistry(modules),
    tiles: modules.flatMap(module => module.tiles?.(cfg) ?? []),
  });
}

