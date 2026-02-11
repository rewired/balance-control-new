import type { Game } from 'boardgame.io';
import { buildInitialCoreState } from '@bc/rules';
import { MatchConfigSchema } from '@bc/rules';
import type { CoreState } from '@bc/rules';
import { CorePhases } from './core.turns.js';
import { resolveRoundSettlement, createExpansionRegistry } from '@bc/rules';

// Setup uses matchID as deterministic seed anchor
export const CoreGame: Game<CoreState> = {
  name: 'core',
  setup: (ctx): CoreState => {
    const seed = String(ctx.matchID ?? 'match');
    const num = Number(ctx.numPlayers ?? 2);
    const cfg = MatchConfigSchema.parse((ctx as unknown as { setupData?: unknown }).setupData ?? { expansions: {} });
    return buildInitialCoreState(num, seed, { expansions: cfg.expansions });
  },
  phases: CorePhases,
  turn: {
    onEnd: ({ G, ctx }) => {
      // CORE-01-07 Round Settlement at end of round
      if (ctx.playOrderPos === ctx.playOrder.length - 1) {
        { const flags = { exp01: !!G.exp?.exp01, exp02: !!G.exp?.exp02, exp03: !!G.exp?.exp03 }; const mods = createExpansionRegistry(flags); resolveRoundSettlement(G, mods); }
      }
    },
  },
};
export default CoreGame;




