import type { Game } from 'boardgame.io';
import { buildInitialCoreState } from '@bc/rules';
import type { CoreState } from '@bc/rules';
import { CorePhases } from './core.turns.js';
import { resolveRoundSettlement } from '@bc/rules';

// Setup uses matchID as deterministic seed anchor
export const CoreGame: Game<CoreState> = {
  name: 'core',
  setup: (ctx): CoreState => {
    const seed = String(ctx.matchID ?? 'match');
    const num = Number(ctx.numPlayers ?? 2);
    return buildInitialCoreState(num, seed);
  },
  phases: CorePhases,
  turn: {
    onEnd: ({ G, ctx }) => {
      // CORE-01-07 Round Settlement at end of round
      if (ctx.playOrderPos === ctx.playOrder.length - 1) {
        resolveRoundSettlement(G);
      }
    },
  },
};
export default CoreGame;


