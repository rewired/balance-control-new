import type { Game } from 'boardgame.io';
import { buildInitialCoreState } from '@bc/rules';
import type { CoreState } from '@bc/rules';
import { CorePhases } from './core.turns.js';

// Setup uses matchID as deterministic seed anchor
export const CoreGame: Game<CoreState> = {
  name: 'core',
  setup: (ctx): CoreState => {
    const seed = String(ctx.matchID ?? 'match');
    const num = Number(ctx.numPlayers ?? 2);
    return buildInitialCoreState(num, seed);
  },
  phases: CorePhases,
};
export default CoreGame;


