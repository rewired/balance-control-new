import type { CoreState } from './types.js';
import type { ExpansionId, ExpansionFlags, MatchConfig } from './schemas.js';

export function isExpansionEnabled(cfg: Pick<MatchConfig, 'expansions'>, id: ExpansionId): boolean {
  return !!cfg.expansions[id];
}

export function assertExpansionStateMatchesConfig(G: CoreState): void {
  const flags: ExpansionFlags = G.cfg.expansions;
  const exp = G.exp;
  if (!exp?.core) throw new Error('Missing mandatory CORE slice');
  for (const id of ['exp01','exp02','exp03'] as const) {
    const enabled = !!flags[id];
    const present = Object.hasOwn(exp, id);
    if (enabled && !present) {
      throw new Error(`Expansion slice missing for enabled ${id}`);
    }
    if (!enabled && present) {
      throw new Error(`Expansion slice present for disabled ${id}`);
    }
  }
}
