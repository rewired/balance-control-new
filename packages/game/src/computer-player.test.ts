import { Client } from 'boardgame.io/client';
import { expect, it } from 'vitest';
import { chooseComputerMove } from './computer-player.js';
import { createComputerPosition } from './computer-position.js';
import { createBCGame } from './factory.js';
import { engineMoveOptions, hashEngineState } from './legal-options.js';

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

it('takes a Security Measure, trades for the missing SEC and blocks rival production', () => {
  const game = createBCGame({ matchSeed: 'security-planning', expansions: { exp02: true } });
  const setup = game.setup!;
  game.setup = (context, data) => {
    const G = setup(context, data);
    const { players, tiles } = G.exp.core;
    const board = [
      { tileId: 'Grassroots-1', coord: { q: 1, r: 0 } },
      { tileId: 'FOR-W2-1', coord: { q: 0, r: 1 } },
      { tileId: 'DOM-W5-1', coord: { q: -1, r: 0 } },
      { tileId: 'Hotspot-1', coord: { q: -2, r: 0 } },
      { tileId: 'Hotspot-2', coord: { q: -2, r: 1 } },
    ];
    tiles.board.push(...board);
    const draw = [...Array.from({ length: 6 }, (_, i) => `Hotspot-${i + 3}`),
      'AuthorityApparatus', 'InnerOrder', 'Lobbyist-1', 'Lobbyist-2'];
    tiles.discardFaceUp = tiles.drawPile.filter(id => !draw.includes(id) && !board.some(site => site.tileId === id));
    tiles.drawPile = draw;
    G.exp.core.influencesOnBoard = [
      ...players['0'].personal.influence.splice(0).map((marker, i) => ({ ...marker, tileId: board[i === 0 ? 1 : 0].tileId })),
      ...players['1'].personal.influence.splice(0).map((marker, i) => ({ ...marker, tileId: board[i === 0 ? 3 : 2].tileId })),
    ];
    Object.assign(players['0'].personal.resources, { FOR: 9, INF: 1 });
    players['0'].usedStartCommittee = true;
    const deck = G.exp.exp02!.measures!;
    const open = ['SEC_M01', 'SEC_M04', 'SEC_M07'];
    deck.drawPile = [...deck.open, ...deck.drawPile].filter((id): id is string => id !== null && !open.includes(id));
    deck.open = open;
    return G;
  };

  const client = Client({ game, numPlayers: 2, playerID: '0' });
  const actions: unknown[] = [];
  for (let step = 0; step < 24; step++) {
    const state = client.store.getState();
    if (state.G.exp.exp02?.regulations?.attached.length || state.ctx.gameover) break;
    const playerID = Object.keys(state.ctx.activePlayers ?? {})[0] ?? state.ctx.currentPlayer;
    const options = engineMoveOptions(state.G, state.ctx, playerID);
    const aiTurn = playerID === '0' && options[0].moveType === 'doPoliticalAction';
    const neutral = options.find(option => {
      if (option.moveType !== 'doPoliticalAction') return false;
      const { type, payload } = option.parameters[0] as { type: string; payload: { sourceTileId?: string; targetTileId?: string } };
      return type === 'placeOrMoveInfluence' && (
        (payload.sourceTileId === 'Hotspot-1' && payload.targetTileId === 'Hotspot-2')
        || (payload.sourceTileId === 'Hotspot-2' && payload.targetTileId === 'Hotspot-1')
      );
    });
    const option = aiTurn ? chooseComputerMove(game, createComputerPosition(state), playerID) : neutral ?? options[0];
    expect(options).toContainEqual(option);
    if (aiTurn) actions.push(option!.parameters[0]);
    client.updatePlayerID(playerID);
    client.moves[option!.moveType](...option!.parameters);
  }
  const { G } = client.store.getState();
  expect(actions).toEqual([
    { type: 'exp02_takeMeasure', payload: { measureId: 'SEC_M01' } },
    ...Array.from({ length: 3 }, () => ({
      type: 'convertResources', payload: { tileId: 'Grassroots-1', input: 'FOR', output: 'SEC' },
    })),
    { type: 'exp02_playMeasure', payload: { measureId: 'SEC_M01',
      regulation: { operation: 'place', regulationKind: 'Blockade', tileId: 'DOM-W5-1' } } },
  ]);
  expect(G.exp.core.players['0'].personal.resources.SEC).toBe(0);
  expect(G.exp.exp02?.regulations?.attached).toEqual([{ id: 'reg-1', kind: 'Blockade', tileId: 'DOM-W5-1' }]);
});

it('plays a production Measure on the most productive friendly resort', () => {
  const game = createBCGame({ matchSeed: 'production-planning', expansions: { exp01: true } });
  const setup = game.setup!;
  game.setup = (context, data) => {
    const G = setup(context, data);
    const { players, tiles } = G.exp.core;
    const board = [
      { tileId: 'FOR-W5-1', coord: { q: 1, r: 0 } },
      { tileId: 'ECO-W1-1', coord: { q: 0, r: 1 } },
      { tileId: 'DOM-W5-1', coord: { q: -1, r: 0 } },
    ];
    tiles.board.push(...board);
    const draw = Array.from({ length: 5 }, (_, i) => `Hotspot-${i + 1}`);
    tiles.discardFaceUp = tiles.drawPile.filter(id => !draw.includes(id) && !board.some(site => site.tileId === id));
    tiles.drawPile = draw;
    G.exp.core.influencesOnBoard = [
      ...players['0'].personal.influence.splice(0).map((marker, i) => ({ ...marker, tileId: board[i % 2].tileId })),
      ...players['1'].personal.influence.splice(0).map(marker => ({ ...marker, tileId: board[2].tileId })),
    ];
    Object.assign(players['0'].personal.resources, { ECO: 1, FOR: 1 });
    const deck = G.exp.exp01!.measures!;
    const index = deck.open.indexOf('ECO_M02');
    if (index >= 0) deck.open[index] = deck.drawPile.shift()!;
    else deck.drawPile.splice(deck.drawPile.indexOf('ECO_M02'), 1);
    deck.hands['0'].push('ECO_M02');
    return G;
  };

  const client = Client({ game, numPlayers: 2, playerID: '0' });
  client.moves.placeTile({ q: 1, r: -1 });
  const state = client.store.getState();
  const option = chooseComputerMove(game, createComputerPosition(state), '0');
  expect(option).toMatchObject({
    moveType: 'doPoliticalAction', contextTile: 'FOR-W5-1',
    parameters: [{ type: 'exp01_playMeasure', payload: { measureId: 'ECO_M02', targetTileId: 'FOR-W5-1' } }],
  });
});

it('trades surplus resources for the CLM missing from a Climate Measure in hand', () => {
  const game = createBCGame({ matchSeed: 'climate-planning', expansions: { exp03: true } });
  const setup = game.setup!;
  game.setup = (context, data) => {
    const G = setup(context, data);
    const { players, tiles } = G.exp.core;
    const board = [
      { tileId: 'Grassroots-1', coord: { q: 1, r: 0 } },
      { tileId: 'FOR-W5-1', coord: { q: 0, r: 1 } },
      { tileId: 'DOM-W5-1', coord: { q: -1, r: 0 } },
    ];
    tiles.board.push(...board);
    const draw = Array.from({ length: 7 }, (_, i) => `Hotspot-${i + 1}`);
    tiles.discardFaceUp = tiles.drawPile.filter(id => !draw.includes(id) && !board.some(site => site.tileId === id));
    tiles.drawPile = draw;
    G.exp.core.influencesOnBoard = [
      ...players['0'].personal.influence.splice(0).map((marker, i) => ({ ...marker, tileId: board[i % 2].tileId })),
      ...players['1'].personal.influence.splice(0).map(marker => ({ ...marker, tileId: 'DOM-W5-1' })),
    ];
    players['0'].personal.resources.FOR = 9;
    players['0'].usedStartCommittee = true;
    const deck = G.exp.exp03!.measures!;
    const card = 'CLM_M12';
    const openSlot = deck.open.indexOf(card);
    if (openSlot >= 0) deck.open[openSlot] = deck.drawPile.shift()!;
    else deck.drawPile.splice(deck.drawPile.indexOf(card), 1);
    deck.hands['0'].push(card);
    return G;
  };

  const client = Client({ game, numPlayers: 2, playerID: '0' });
  client.moves.placeTile({ q: 1, r: -1 });
  const option = chooseComputerMove(game, createComputerPosition(client.store.getState()), '0');
  expect(option).toMatchObject({
    moveType: 'doPoliticalAction',
    parameters: [{ type: 'convertResources', payload: { tileId: 'Grassroots-1', input: 'FOR', output: 'CLM' } }],
  });
  client.moves[option!.moveType](...option!.parameters);
  expect(client.store.getState().G.exp.core.players['0'].personal.resources.CLM).toBe(1);
});

it('takes a Standard Committee when it needs more Influence and has spent its Start Committee use', () => {
  const game = createBCGame({ matchSeed: 'committee-access' });
  const setup = game.setup!;
  game.setup = (context, data) => {
    const G = setup(context, data);
    const { players, tiles } = G.exp.core;
    const board = [
      { tileId: 'Committee-1', coord: { q: 1, r: 0 } },
      { tileId: 'DOM-W5-1', coord: { q: 0, r: 1 } },
      { tileId: 'FOR-W5-1', coord: { q: -1, r: 0 } },
    ];
    tiles.board.push(...board);
    const draw = Array.from({ length: 7 }, (_, i) => `Grassroots-${i + 1}`);
    tiles.discardFaceUp = tiles.drawPile.filter(id => !draw.includes(id) && !board.some(site => site.tileId === id));
    tiles.drawPile = draw;
    G.exp.core.influencesOnBoard = [
      ...players['0'].personal.influence.splice(0).map(marker => ({ ...marker, tileId: 'DOM-W5-1' })),
      ...players['1'].personal.influence.splice(0).map(marker => ({ ...marker, tileId: 'FOR-W5-1' })),
    ];
    Object.assign(players['0'].personal.resources, { DOM: 8, FOR: 6 });
    players['0'].usedStartCommittee = true;
    return G;
  };

  const client = Client({ game, numPlayers: 2, playerID: '0' });
  client.moves.placeTile({ q: 1, r: -1 });
  const state = client.store.getState();
  const option = chooseComputerMove(game, createComputerPosition(state), '0');
  expect(option).toMatchObject({ moveType: 'doPoliticalAction', contextTile: 'Committee-1' });
  client.moves[option!.moveType](...option!.parameters);
  expect(client.store.getState().G.exp.core.influencesOnBoard).toContainEqual(expect.objectContaining({
    owner: '0', tileId: 'Committee-1',
  }));
});

it('takes the immediate Hotspot win in the placement phase', () => {
  const game = createBCGame({ matchSeed: 'winning-enclosure' });
  const setup = game.setup!;
  game.setup = (context, data) => {
    const G = setup(context, data);
    const { players, tiles } = G.exp.core;
    const board = [
      { tileId: 'Hotspot-1', coord: { q: 2, r: 0 } },
      { tileId: 'Committee-1', coord: { q: 2, r: -1 } },
      { tileId: 'Committee-2', coord: { q: 3, r: -1 } },
      { tileId: 'Committee-3', coord: { q: 3, r: 0 } },
      { tileId: 'Committee-4', coord: { q: 2, r: 1 } },
      { tileId: 'Committee-5', coord: { q: 1, r: 1 } },
      { tileId: 'DOM-W5-1', coord: { q: 0, r: 1 } },
    ];
    tiles.board.push(...board);
    const draw = ['Grassroots-1', 'Committee-6', 'Committee-7'];
    tiles.discardFaceUp = tiles.drawPile.filter(id => !draw.includes(id) && !board.some(site => site.tileId === id));
    tiles.drawPile = draw;
    const supply = players['0'].personal.influence;
    G.exp.core.influencesOnBoard = [
      ...supply.splice(0).map(marker => ({ ...marker, tileId: 'Hotspot-1' })),
      ...Array.from({ length: 2 }, (_, i) => ({ id: `INF-0-F${i + 1}`, owner: '0', tileId: 'Hotspot-1' })),
      ...players['1'].personal.influence.splice(0).map(marker => ({ ...marker, tileId: 'DOM-W5-1' })),
    ];
    supply.push({ id: 'INF-0-F3', owner: '0' });
    return G;
  };

  const client = Client({ game, numPlayers: 2, playerID: '0' });
  const option = chooseComputerMove(game, createComputerPosition(client.store.getState()), '0');
  expect(option).toMatchObject({ moveType: 'placeTile', parameters: [{ q: 1, r: 0 }] });
  client.moves[option!.moveType](...option!.parameters);
  expect(client.store.getState().ctx.gameover).toEqual({ winners: ['0'] });
});
