import { CreateGameReducer, InitializeGame } from '#boardgame-internal';
import { expect, it } from 'vitest';
import { chooseComputerMove } from './computer-player.js';
import { createComputerPosition } from './computer-position.js';
import { createBCGame } from './factory.js';
import { hashEngineState, previewEngineOptions } from './legal-options.js';
import replay from './fixtures/hotseat-dd5f7d6d.json';

it('values usable reserve markers and fewer co-winners in the recorded six-seat endgame', () => {
  const { numPlayers, ...setupData } = replay.setup.game;
  const game = { ...createBCGame(setupData, 'recorded'), seed: replay.setup.engineSeed };
  const reduce = CreateGameReducer({ game });
  let state = InitializeGame({ game, numPlayers, setupData });
  const checkpoints = new Map<number, typeof state>();
  for (const { playerID, move, args } of replay.actions) {
    if ([166, 207, 217].includes(state._stateID)) checkpoints.set(state.ctx.turn, structuredClone(state));
    state = reduce(state, { type: 'MAKE_MOVE', payload: { type: move, playerID, args } });
  }
  expect(hashEngineState(state)).toBe('64e763339c2da655294d6b9d1fce170689379b79029c612f2be0a7111381a90f');
  expect(state.ctx.gameover).toEqual({ winners: ['0', '1', '2', '4', '5'] });

  function playChosenMove(turn: number) {
    const before = checkpoints.get(turn)!;
    const position = createComputerPosition(before);
    const workerGame = createBCGame({ ...position.G.cfg, matchSeed: position.G.matchSeed });
    const choice = chooseComputerMove(workerGame, position, before.ctx.currentPlayer)!;
    return Array.from(previewEngineOptions(game, before, [choice]))[0].next;
  }

  const deployed = playChosenMove(82);
  expect(deployed.G.exp.core.players['3'].personal.influence).toHaveLength(2);
  expect(deployed.G.exp.core.influencesOnBoard?.filter(marker => marker.owner === '3')).toHaveLength(3);
  const lastOwnTurn = playChosenMove(102);
  expect(lastOwnTurn.G.exp.core.players['5'].personal.influence).toHaveLength(0);
  const lastTurn = playChosenMove(107);
  expect(lastTurn.ctx.gameover.winners).toContain('4');
  expect(lastTurn.ctx.gameover.winners).toHaveLength(4);
}, 40_000);
