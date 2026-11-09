import { MatchConfigSchema, type CoreExpansionState, type CoreState, type ExpansionsState } from '@bc/rules';

type OptionalExpansionState = Omit<ExpansionsState, 'core'>;
export type LegacyCoreState = Omit<CoreState, 'exp'> & CoreExpansionState & { exp?: OptionalExpansionState };

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

export function hasUnsupportedTopology(state: unknown): boolean {
  return isRecord(state) && typeof state.matchSeed === 'string' && isRecord(state.cfg)
    && !MatchConfigSchema.shape.topology.safeParse(state.cfg.topology).success;
}

function isLegacyCoreState(value: unknown): value is LegacyCoreState {
  return isRecord(value) && typeof value.matchSeed === 'string' && isRecord(value.cfg)
    && isRecord(value.tiles) && isRecord(value.allTiles) && isRecord(value.players) && isRecord(value.resources)
    && (value.exp === undefined || (isRecord(value.exp) && !Object.hasOwn(value.exp, 'core')));
}

export function migrateCoreState(state: CoreState | LegacyCoreState): CoreState;
export function migrateCoreState(state: unknown): unknown;
export function migrateCoreState(state: unknown): unknown {
  if (!isLegacyCoreState(state)) return state;
  const { cfg, matchSeed, exp, lastTurnHash, ...core } = state;
  return {
    cfg, matchSeed,
    ...(lastTurnHash === undefined ? {} : { lastTurnHash }),
    exp: { core, ...exp },
  } satisfies CoreState;
}

// AGENTS §5.3: retain the hash input used by replays recorded before CORE was namespaced.
export function coreStateForHash({ exp: { core, ...optional }, ...metadata }: CoreState): LegacyCoreState {
  return { ...metadata, ...core, ...(Object.keys(optional).length ? { exp: optional } : {}) };
}
