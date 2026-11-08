import { Client } from '#boardgame-client';
import { createBCGame, hashEngineState, legalMoveOptions } from '@bc/game';
import { chooseOptionWithLLM, type LLMBackend } from '@bc/bot-llm';

export async function runBotMatch(turns: number, backend?: LLMBackend, game = createBCGame({
  matchSeed: 'runner', expansions: { exp01: true },
})) {
  if (!Number.isSafeInteger(turns) || turns < 0) throw new RangeError('Turn count must be a nonnegative integer');
  const client = Client({ game, numPlayers: 2, playerID: '0' });
  let state = client.store.getState();
  while (state.ctx.gameover === undefined && state.ctx.turn <= turns) {
    const { ctx } = state;
    const playerID = Object.keys(ctx.activePlayers ?? {})[0] ?? ctx.currentPlayer;
    const options = legalMoveOptions(game, state, playerID);
    const choice = await chooseOptionWithLLM(options, `Turn=${ctx.turn} Player=${playerID}`, backend);
    // CORE-01-04-09A..09C: the engine skips a political slot with no legal actions.
    if (!choice) throw new Error(`No legal move for active player ${playerID} on turn ${ctx.turn}`);
    client.updatePlayerID(playerID);
    client.moves[choice.moveType](...choice.parameters);
    state = client.store.getState();
    if (choice.resultingStateHashPreview !== hashEngineState(state)) {
      throw new Error(`Move ${choice.moveType} differed from its engine preview`);
    }
  }
  return { turn: state.ctx.turn, gameover: state.ctx.gameover as unknown, hash: hashEngineState(state) };
}
