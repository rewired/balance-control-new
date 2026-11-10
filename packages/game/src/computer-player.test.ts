import { Client } from 'boardgame.io/client';
import { CreateGameReducer, InitializeGame } from '#boardgame-internal';
import { expect, it } from 'vitest';
import { chooseComputerMove } from './computer-player.js';
import { createComputerPosition } from './computer-position.js';
import { createBCGame } from './factory.js';
import { engineMoveOptions, hashEngineState, previewEngineOptions } from './legal-options.js';
import hotseatReplay from './fixtures/hotseat-c2082d6d.json';
import sixSeatReplay from './fixtures/hotseat-dd5f7d6d.json';

function recordedHotseat(replay: typeof hotseatReplay | typeof sixSeatReplay = hotseatReplay) {
  const { numPlayers, ...setupData } = replay.setup.game;
  const game = { ...createBCGame(setupData, 'recorded'), seed: replay.setup.engineSeed };
  const reduce = CreateGameReducer({ game });
  const initial = InitializeGame({ game, numPlayers, setupData });
  const play = (state: typeof initial, { move, playerID, args }: typeof replay.actions[number]) =>
    reduce(state, { type: 'MAKE_MOVE', payload: { type: move, playerID, args } });
  return { game, initial, play };
}

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

it('recalls a marker from the next player in the recorded Hotseat turn 63', () => {
  const { game, initial, play } = recordedHotseat();
  const state = hotseatReplay.actions.slice(0, 125).reduce(play, initial);
  expect(state.ctx).toMatchObject({ turn: 63, currentPlayer: '2' });
  const positionHash = 'fbc608530b8ea807d9c5f929828810a727cc9f45cd3832a5e35db196448a30ca';
  expect(hashEngineState(state)).toBe(positionHash);

  const original = hotseatReplay.actions.slice(125).reduce(play, structuredClone(state));
  expect(original.ctx).toMatchObject({ turn: 64, gameover: { winners: ['0'] } });
  expect(hashEngineState(original)).toBe('2ac5982599ba56c440f763a9e93ebe00dba36e4f929176ffb142e2e4fa2b21a3');

  const position = createComputerPosition(state);
  const workerGame = createBCGame({ ...position.G.cfg, matchSeed: position.G.matchSeed });
  const choice = chooseComputerMove(workerGame, position, '2')!;
  expect(choice).toMatchObject({ moveType: 'doPoliticalAction', parameters: [{ type: 'recallInfluence' }] });
  expect(hashEngineState(state)).toBe(positionHash);

  const afterRecall = Array.from(previewEngineOptions(game, state, [choice]))[0].next;
  expect(afterRecall.ctx).toMatchObject({ turn: 64, currentPlayer: '0' });
  expect(afterRecall.G.exp.core.influencesOnBoard?.filter(marker => marker.owner === '0')).toHaveLength(5);
  const continued = hotseatReplay.actions.slice(126).reduce(play, afterRecall);
  expect(continued.ctx).toMatchObject({ turn: 65, currentPlayer: '1' });
  expect(continued.ctx.gameover).toBeUndefined();
}, 20_000);

it('builds the same worker position and chooses the same action when the hidden order changes', () => {
  const game = createBCGame({ matchSeed: 'private-order', expansions: { exp01: true, exp02: true, exp03: true } });
  const state = Client({ game, numPlayers: 2, playerID: '0' }).store.getState();
  const reordered = structuredClone(state);
  reordered.G.exp.core.tiles.drawPile.reverse();
  for (const id of ['exp01', 'exp02', 'exp03'] as const) reordered.G.exp[id]!.measures!.drawPile.reverse();
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

it('assigns distinct, stable search styles by match seed and seat without changing the simulated state', () => {
  const game = createBCGame({ matchSeed: 'seat-styles', addOn56: true });
  const state = InitializeGame({ game, numPlayers: 6 });
  const first = createComputerPosition(state);
  expect(Object.keys(first.styles)).toEqual(state.ctx.playOrder);
  expect(new Set(Object.values(first.styles).map(style => JSON.stringify(style))).size).toBe(6);
  expect(new Set(Object.values(first.styles).map(style => style.impulsivity)).size).toBe(6);
  expect(new Set(Object.values(first.styles).map(style => style.riskTolerance)).size).toBe(6);
  expect(createComputerPosition({ ...state, _stateID: state._stateID + 1, ctx: { ...state.ctx, turn: 2 } }).styles)
    .toEqual(first.styles);

  const { styles, ...position } = createComputerPosition({ ...state, G: { ...state.G, matchSeed: 'other-seat-styles' } });
  const { styles: firstStyles, ...firstPosition } = first;
  expect(styles).not.toEqual(firstStyles);
  expect(position).toEqual(firstPosition);
});

it('can choose different legal moves when the seed changes the search styles for the same position', () => {
  const { game, initial, play } = recordedHotseat();
  const state = hotseatReplay.actions.slice(0, 19).reduce(play, initial);
  const playerID = state.ctx.currentPlayer;
  const original = createComputerPosition(state);
  const reseeded = createComputerPosition({ ...state, G: { ...state.G, matchSeed: 'other-seat-styles' } });
  expect(reseeded.G).toEqual(original.G);

  const damage = chooseComputerMove(game, reseeded, playerID)!;
  const relocate = chooseComputerMove(game, original, playerID)!;
  expect(damage.parameters[0]).toMatchObject({ type: 'damageResort' });
  expect(relocate.parameters[0]).toMatchObject({ type: 'placeOrMoveInfluence' });
  expect(Array.from(previewEngineOptions(game, state, [damage, relocate]))).toHaveLength(2);
}, 20_000);

it('can favor the immediate position when only impulsivity increases', () => {
  const { game, initial, play } = recordedHotseat();
  const state = hotseatReplay.actions.slice(0, 19).reduce(play, initial);
  const playerID = state.ctx.currentPlayer;
  const position = createComputerPosition(state);
  const choose = (impulsivity: number) => chooseComputerMove(game, {
    ...position,
    styles: { ...position.styles, [playerID]: { ...position.styles[playerID], impulsivity } },
  }, playerID);

  expect(choose(0.05)).toMatchObject({ parameters: [{ type: 'damageResort' }] });
  expect(choose(0.25)).toMatchObject({ parameters: [{ type: 'placeOrMoveInfluence' }] });
}, 20_000);

it('can favor the stronger expected continuation when only risk tolerance increases', () => {
  const { game, initial, play } = recordedHotseat(sixSeatReplay);
  const state = sixSeatReplay.actions.slice(0, 15).reduce(play, initial);
  const playerID = state.ctx.currentPlayer;
  const position = createComputerPosition(state);
  const choose = (riskTolerance: number) => chooseComputerMove(game, {
    ...position,
    styles: { ...position.styles, [playerID]: { ...position.styles[playerID], riskTolerance } },
  }, playerID);

  const cautious = choose(0.2)!;
  const daring = choose(0.8)!;
  expect(cautious).toMatchObject({ moveType: 'doPoliticalAction', contextTile: 'INF-W4-2' });
  expect(daring).toMatchObject({ moveType: 'doPoliticalAction', contextTile: 'FOR-W2-1' });
  expect(Array.from(previewEngineOptions(game, state, [cautious, daring]))).toHaveLength(2);
}, 20_000);

it('takes a Security Measure, trades for SEC and blocks rival production under the recorded pre-cap rules', () => {
  const game = createBCGame({ matchSeed: 'security-planning', expansions: { exp02: true } }, 'recorded');
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
