import { Client } from 'boardgame.io/client';
import { expect, it } from 'vitest';
import { chooseComputerMove } from './computer-player.js';
import { createComputerPosition } from './computer-position.js';
import { createBCGame } from './factory.js';
import { hashEngineState } from './legal-options.js';

it('ties the game by blocking the opponent’s last-turn Hotspot payout', () => {
  const game = createBCGame({ matchSeed: 'hotspot-trap' });
  const setup = game.setup!;
  game.setup = (context, data) => {
    const G = setup(context, data);
    const { players, tiles } = G.exp.core;
    const ring = [
      { tileId: 'Hotspot-1', coord: { q: 1, r: 0 } },
      { tileId: 'Committee-1', coord: { q: 2, r: -1 } },
      { tileId: 'Committee-2', coord: { q: 1, r: -1 } },
      { tileId: 'Committee-3', coord: { q: 0, r: 1 } },
      { tileId: 'Committee-4', coord: { q: 1, r: 1 } },
    ];
    const draw = ['DOM-W5-1', 'Committee-5'];
    tiles.board.push(...ring);
    tiles.discardFaceUp = tiles.drawPile.filter(id => !draw.includes(id) && !ring.some(tile => tile.tileId === id));
    tiles.drawPile = draw;
    G.exp.core.influencesOnBoard = [
      { ...players['0'].personal.influence.shift()!, tileId: 'Committee-1' },
      { ...players['1'].personal.influence.shift()!, tileId: 'Hotspot-1' },
    ];
    return G;
  };

  function play(avoidTrap: boolean) {
    const client = Client({ game, numPlayers: 2, playerID: '0' });
    client.moves.placeTile({ q: -1, r: 0 });
    if (avoidTrap) {
      const state = client.store.getState();
      const hash = hashEngineState(state);
      const option = chooseComputerMove(game, createComputerPosition(state), '0');
      expect(option).toMatchObject({ moveType: 'doPoliticalAction', contextTile: 'Hotspot-1' });
      expect(hashEngineState(state)).toBe(hash);
      client.moves[option!.moveType](...option!.parameters);
    } else {
      client.moves.doPoliticalAction({
        type: 'placeOrMoveInfluence', payload: { markerId: 'INF-0-2', targetTileId: 'DOM-W5-1' },
      });
    }
    client.updatePlayerID('1');
    client.moves.placeTile({ q: 2, r: 0 });
    client.moves.doPoliticalAction({
      type: 'placeOrMoveInfluence', payload: { markerId: 'INF-1-2', targetTileId: 'Committee-5' },
    });
    return client.store.getState().ctx.gameover;
  }

  expect(play(false)).toEqual({ winners: ['1'] });
  expect(play(true)).toEqual({ winners: ['0', '1'] });
});

it('builds the same worker position and chooses the same action when the hidden order changes', () => {
  const game = createBCGame({ matchSeed: 'private-order', expansions: { exp01: true, exp02: true, exp03: true } });
  const state = Client({ game, numPlayers: 2, playerID: '0' }).store.getState();
  const reordered = structuredClone(state);
  reordered.G.exp.core.tiles.drawPile.reverse();
  for (const id of ['exp01', 'exp02', 'exp03'] as const) reordered.G.exp[id]!.measures!.drawPile.reverse();
  reordered.G.matchSeed = 'another-hidden-seed';
  reordered.G.lastTurnHash = 'another-hidden-hash';
  const visible = createComputerPosition(state);
  const other = createComputerPosition(reordered);
  expect(other).toEqual(visible);
  const noPeeking = { get() { throw new Error('Read a hidden draw pile'); } };
  Object.defineProperty(reordered.G.exp.core.tiles, 'drawPile', noPeeking);
  for (const id of ['exp01', 'exp02', 'exp03'] as const) {
    Object.defineProperty(reordered.G.exp[id]!.measures!, 'drawPile', noPeeking);
  }
  expect(createComputerPosition(reordered)).toEqual(visible);
  expect(visible.G.exp.core.tiles.drawPile.slice().sort()).toEqual(state.G.exp.core.tiles.drawPile.slice().sort());
  for (const id of ['exp01', 'exp02', 'exp03'] as const) {
    expect(visible.G.exp[id]!.measures!.drawPile.slice().sort()).toEqual(state.G.exp[id]!.measures!.drawPile.slice().sort());
  }
  const choice = chooseComputerMove(game, visible, '0');
  expect(choice).toBeDefined();
  expect(chooseComputerMove(game, other, '0')).toEqual(choice);
});
