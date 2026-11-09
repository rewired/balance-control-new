import { Client } from 'boardgame.io/client';
import { chooseComputerMove, createBCGame, createComputerPosition, hashEngineState } from '@bc/game';
import { expect, it } from 'vitest';
import { submitCoreOption } from './BoardCore.js';

it('finishes and replays a local match with two bots, including a decision in the human turn', () => {
  const game = createBCGame({ matchSeed: 'local-computers', expansions: { exp01: true, exp02: true, exp03: true } });
  const setup = game.setup!;
  game.setup = (context, data) => {
    const G = setup(context, data);
    const core = G.exp.core;
    const ring = [
      { tileId: 'InnerOrder', coord: { q: 1, r: 0 } },
      { tileId: 'Committee-1', coord: { q: 2, r: -1 } },
      { tileId: 'Committee-2', coord: { q: 1, r: -1 } },
      { tileId: 'Committee-3', coord: { q: 0, r: 1 } },
      { tileId: 'Committee-4', coord: { q: 1, r: 1 } },
    ];
    const draw = ['Committee-5', 'DOM-W1-1', 'FOR-W1-1'];
    core.tiles.board.push(...ring);
    core.tiles.discardFaceUp = core.tiles.drawPile.filter(id => !draw.includes(id) && !ring.some(tile => tile.tileId === id));
    core.tiles.drawPile = draw;
    core.influencesOnBoard = [{ ...core.players['1'].personal.influence.shift()!, tileId: 'InnerOrder' }];
    core.players['1'].personal.resources.SEC = 2;
    return G;
  };

  const play = () => {
    const client = Client({ game, numPlayers: 3, playerID: '0' });
    client.moves.placeTile({ q: 2, r: 0 });
    const state = () => client.store.getState();
    const computerMove = () => {
      const before = state();
      const hash = hashEngineState(before);
      const playerID = Object.keys(before.ctx.activePlayers ?? {})[0] ?? before.ctx.currentPlayer;
      expect(['1', '2']).toContain(playerID);
      const choice = chooseComputerMove(game, createComputerPosition(before), playerID)!;
      expect(choice).toBeDefined();
      expect(hashEngineState(state())).toBe(hash);
      client.updatePlayerID(playerID);
      submitCoreOption(client.moves, choice);
      expect(state()._stateID).toBe(before._stateID + 1);
    };

    expect(state().ctx.currentPlayer).toBe('0');
    expect(state().ctx.activePlayers).toEqual({ '1': 'ResolveHotspot' });
    computerMove();
    expect(state().ctx.activePlayers).toEqual({ '0': 'ExactlyOnePoliticalAction' });
    client.updatePlayerID('0');
    client.moves.doPoliticalAction({ type: 'placeOrMoveInfluence', payload: { markerId: 'INF-0-1', targetTileId: 'Committee-5' } });

    for (let step = 0; step < 10 && state().ctx.gameover === undefined; step++) computerMove();
    expect(state().ctx.gameover).toBeDefined();
    expect(state().G.exp.core.influencesOnBoard).toEqual(expect.arrayContaining([
      expect.objectContaining({ owner: '1', tileId: 'DOM-W1-1' }),
      expect.objectContaining({ owner: '2' }),
    ]));
    return hashEngineState(state());
  };

  expect(play()).toBe(play());
});
