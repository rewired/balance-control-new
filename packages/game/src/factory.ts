import type { Game } from 'boardgame.io';
import type { CoreState } from '@bc/rules';
import { MatchSetupDataSchema, buildInitialCoreState, createExpansionRegistry, createResolver, assertExpansionStateMatchesConfig, validateMatchPlayerCount } from '@bc/rules';
import { CoreTurn } from './core.turns.js';

import './expansions.bootstrap.js';

export function setupCoreMatch(numPlayers: number, setupData: unknown = {}): CoreState {
  // CORE-01-03-01..08: build match state before the engine begins the first turn.
  const { matchSeed, ...cfg } = MatchSetupDataSchema.parse(setupData);
  const G = buildInitialCoreState(numPlayers, matchSeed, cfg);
  const modules = createExpansionRegistry(cfg.expansions);
  const resolve = createResolver(modules);
  for (const module of modules) {
    module.setupExpansionState(G, { numPlayers, seed: matchSeed });
    if (module.measureDeck) {
      const deck = resolve(G, { kind: 'initMeasures', expansion: module.id, deck: module.measureDeck(cfg) });
      if (!deck.ok) throw new Error(`Measure setup failed for ${module.id}: ${deck.reason}`);
    }
  }
  assertExpansionStateMatchesConfig(G);
  return G;
}

export function createBCGame(defaultConfig?: unknown): Game<CoreState, Record<string, unknown>, unknown> {
  const defaults = MatchSetupDataSchema.parse(defaultConfig ?? {});
  return {
    name: 'core',
    minPlayers: 2,
    maxPlayers: 6,
    seed: defaults.matchSeed,
    validateSetupData: (setupData, numPlayers) => {
      const result = MatchSetupDataSchema.safeParse(setupData === undefined ? defaults : setupData);
      return result.success ? validateMatchPlayerCount(numPlayers, result.data.addOn56) : result.error.message;
    },
    setup: ({ ctx }, setupData) => setupCoreMatch(ctx.numPlayers, setupData === undefined ? defaults : setupData),
    turn: { ...CoreTurn },
    events: {
      endGame: false,
      endPhase: false,
      endTurn: false,
      setPhase: false,
      endStage: false,
      setStage: false,
      pass: false,
      setActivePlayers: false,
    },
  };
}

export const CoreGame = createBCGame({ expansions: {} });
