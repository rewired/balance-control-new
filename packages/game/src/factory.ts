import type { Game } from 'boardgame.io';
import type { CoreState } from '@bc/rules';
import { MatchConfigSchema, buildInitialCoreState, createExpansionRegistry, assertExpansionStateMatchesConfig } from '@bc/rules';
import { CorePhases } from './core.turns.js';
import { createResolver } from '@bc/rules';

import './expansions.bootstrap.js';

export function createBCGame(defaultConfig?: unknown): Game<CoreState> {
  return {
    name: 'core',
    setup: (ctx): CoreState => {
      const seed = String(ctx.matchID ?? 'match');
      const num = Number(ctx.numPlayers ?? 2);
      const cfg = MatchConfigSchema.parse((ctx as unknown as { setupData?: unknown }).setupData ?? defaultConfig ?? { expansions: {} });
      const G = buildInitialCoreState(num, seed, cfg);
      // Module setup hooks
      const modules = createExpansionRegistry(cfg.expansions);
      for (const m of modules) m.setupExpansionState(G, { numPlayers: num, seed });
      assertExpansionStateMatchesConfig(G);
      return G;
    },
    phases: CorePhases,
    turn: {
      onEnd: ({ G, ctx }) => {
        if (ctx.playOrderPos === ctx.playOrder.length - 1) {
          const mods = createExpansionRegistry(G.cfg.expansions);
          const resolve = createResolver(mods);
          for (const p of G.tiles.board) {
            resolve(G, { kind: 'applyProductionAt', coord: p.coord, contextCoord: p.coord });
          }
        }
      },
    },
  };
}

export const CoreGame = createBCGame({ expansions: {} });
