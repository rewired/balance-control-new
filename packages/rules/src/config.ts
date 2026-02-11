import type { CoreState } from './types.js';
import type { ExpansionId, ExpansionFlags, MatchConfig } from './schemas.js';

export function isExpansionEnabled(cfg: Pick<MatchConfig, 'expansions'>, id: ExpansionId): boolean {
  return !!cfg.expansions[id];
}

export function assertExpansionStateMatchesConfig(G: CoreState): void {
  const flags: ExpansionFlags = G.cfg.expansions;
  const exp = G.exp ?? {} as NonNullable<CoreState['exp']>;
  for (const id of ['exp01','exp02','exp03'] as const) {
    const enabled = !!flags[id];
    const present = !!(exp as Record<string, unknown>)[id];
    if (enabled && !present) {
      throw new Error(`Expansion slice missing for enabled ${id}`);
    }
  }
}