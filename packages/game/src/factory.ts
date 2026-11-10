import type { Game } from 'boardgame.io';
import type { CoreState } from '@bc/rules';
import { MatchSetupDataSchema, buildInitialCoreState, createExpansionRegistry, createResolver, assertExpansionStateMatchesConfig, registerExpansion, validateMatchPlayerCount } from '@bc/rules';
import { createCoreExpansion, CoreTurn } from '@bc/exp-00-core';
import { exp01Economy } from '@bc/exp-01-economy';
import { exp02Security } from '@bc/exp-02-security';
import { exp03Climate } from '@bc/exp-03-climate';

for (const module of [createCoreExpansion(), exp01Economy(), exp02Security(), exp03Climate()]) registerExpansion(module);

type SetupRules = 'current' | 'recorded';

export function setupCoreMatch(numPlayers: number, setupData: unknown = {}, rules: SetupRules = 'current'): CoreState {
  // CORE-01-03-01..08: build match state before the engine begins the first turn.
  const { matchSeed, ...cfg } = MatchSetupDataSchema.parse(setupData);
  // CORE-01-07-04A and CORE-01-04-23: new matches record both rules at setup.
  if (rules === 'current') {
    cfg.variants.resourceCap = true;
    cfg.variants.influenceRecall = true;
  }
  const G = buildInitialCoreState(numPlayers, matchSeed, cfg);
  const modules = createExpansionRegistry(cfg.expansions);
  const resolve = createResolver(modules);
  for (const module of modules) {
    module.setupExpansionState?.(G, { numPlayers, seed: matchSeed });
    if ('measureDeck' in module && module.measureDeck) {
      const deck = resolve(G, { kind: 'initMeasures', expansion: module.id, deck: module.measureDeck(cfg) });
      if (!deck.ok) throw new Error(`Measure setup failed for ${module.id}: ${deck.reason}`);
    }
  }
  assertExpansionStateMatchesConfig(G);
  return G;
}

export function createBCGame(defaultConfig?: unknown, rules: SetupRules = 'current'): Game<CoreState, Record<string, unknown>, unknown> {
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
    setup: ({ ctx }, setupData) => setupCoreMatch(ctx.numPlayers, setupData === undefined ? defaults : setupData, rules),
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
