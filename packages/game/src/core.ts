import type { Game } from 'boardgame.io';
import { buildInitialCoreState } from '@bc/rules';
import type { CoreState } from '@bc/rules';

// Setup uses matchID as deterministic seed anchor
export const CoreGame: Game<CoreState> = {
  name: 'core',
  setup: (ctx): CoreState => {
    const seed = String(ctx.matchID ?? 'match');
    const num = Number(ctx.numPlayers ?? 2);
    // CORE-01-03-01..02: Start Committee on Board; others in DrawPile (in buildInitialCoreState)
    return buildInitialCoreState(num, seed);
  },
};
export default CoreGame;