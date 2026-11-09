import { Client } from 'boardgame.io/client';
import { coreStateForHash } from '@bc/exp-00-core';
import { exp01Economy } from '@bc/exp-01-economy';
import { exp03Climate } from '@bc/exp-03-climate';
import {
  __resetRegisteredExpansionsForTest, createResolver, ensureExpansionSlice, registerExpansion,
  type BoardPlacement, type CoreState,
} from '@bc/rules';
import { stableHash } from '@bc/shared';
import { beforeEach, describe, expect, it } from 'vitest';
import { createBCGame } from './factory.js';

type CoreClient = ReturnType<typeof Client<CoreState>>;
const unpayableTiles = ['Committee-8', 'Committee-9'];

function moveMarker(client: CoreClient, markerId: string, targetTileId: string, sourceTileId?: string): void {
  client.moves.doPoliticalAction({ type: 'placeOrMoveInfluence', payload: { markerId, targetTileId, sourceTileId } });
}

function markerCounts(G: CoreState): number[] {
  return Object.keys(G.exp.core.players).map(id => G.exp.core.influencesOnBoard?.filter(marker => marker.owner === id).length ?? 0);
}

function fixtureClient(
  config: unknown,
  board: BoardPlacement[],
  draw: string[],
  markers: { owner: string; tileId: string }[],
  { numPlayers = 2, prepare }: { numPlayers?: number; prepare?: (G: CoreState) => void } = {},
): CoreClient {
  const game = createBCGame(config);
  const setup = game.setup!;
  game.setup = (context, data) => {
    const G = setup(context, data);
    G.exp.core.tiles.board.push(...board);
    G.exp.core.tiles.discardFaceUp = G.exp.core.tiles.drawPile.filter(id => !draw.includes(id) && !board.some(tile => tile.tileId === id));
    G.exp.core.tiles.drawPile = draw;
    G.exp.core.influencesOnBoard = markers.map(({ owner, tileId }) => {
      const marker = G.exp.core.players[owner].personal.influence.shift()!;
      return { ...marker, tileId };
    });
    prepare?.(G);
    return G;
  };
  return Client({ game, numPlayers });
}

function seedBoardInfluence(G: CoreState, owner: string, tileId: string, count: number): void {
  const markers = G.exp.core.players[owner].personal.influence.splice(0, count);
  const formalized = Array.from({ length: count - markers.length }, (_, i) => ({ id: `INF-${owner}-F${i + 1}`, owner }));
  G.exp.core.influencesOnBoard!.push(...[...markers, ...formalized].map(marker => ({ ...marker, tileId })));
}

function terminalState(client: CoreClient, turn: number, playerID: string, winners: string[]) {
  const { G, ctx, _stateID, isActive } = client.getState()!;
  expect(ctx.turn).toBe(turn);
  expect(ctx.currentPlayer).toBe(playerID);
  expect(ctx.gameover).toEqual({ winners });
  expect(isActive).toBe(false);
  expect(G.exp.core.tiles.drawResolution).toBeNull();

  const { lastTurnHash, ...completed } = coreStateForHash(G);
  expect(lastTurnHash).toMatch(/^[0-9a-f]{64}$/);
  const persisted = JSON.parse(JSON.stringify(completed));
  expect(lastTurnHash).toBe(stableHash({ state: persisted, turn, playerID }));

  const source = G.exp.core.influencesOnBoard?.find(marker => marker.owner === playerID);
  const marker = source ?? G.exp.core.players[playerID].personal.influence[0];
  const target = G.exp.core.tiles.board.find(tile => tile.tileId !== 'StartCommittee' && tile.tileId !== source?.tileId)!;
  client.moves.placeTile({ q: -1, r: 0 });
  moveMarker(client, marker.id, target.tileId, source?.tileId);
  const after = client.getState()!;
  expect(after._stateID).toBe(_stateID);
  expect(after.ctx).toEqual(ctx);
  expect(after.G).toEqual(G);
  return { G, ctx };
}

function replayFullCoreMatch() {
  const client = Client({ game: createBCGame({ matchSeed: 'task-0030-full-core' }), numPlayers: 2 });
  const hashes: string[] = [];
  expect(client.getState()!.G.exp.core.tiles.drawPile).toHaveLength(70);

  for (let q = 1; q <= 71; q++) {
    const { G, ctx } = client.getState()!;
    const playerID = String((q - 1) % 2);
    expect(ctx.turn).toBe(q);
    expect(ctx.currentPlayer).toBe(playerID);
    const markerId = `INF-${playerID}-${q <= 8 ? Math.ceil(q / 2) : 1}`;
    const sourceTileId = G.exp.core.influencesOnBoard?.find(marker => marker.id === markerId)?.tileId;
    const offer = G.exp.core.tiles.drawResolution!;
    client.moves.placeTile({ q, r: 0 });
    const placed = client.getState()!;
    expect(placed.ctx.activePlayers).toEqual({ [playerID]: 'ExactlyOnePoliticalAction' });
    expect(placed.ctx.gameover).toBeUndefined();
    expect(placed.G.lastTurnHash).toBe(G.lastTurnHash);
    moveMarker(client, markerId, offer.tileId, sourceTileId);
    const next = client.getState()!;
    expect(next.G.lastTurnHash).toMatch(/^[0-9a-f]{64}$/);
    hashes.push(next.G.lastTurnHash!);

    if (q === 71) {
      // CORE-01-07-01A and CORE-01-09-01C: the final Settlement runs in the shortened round.
      expect(next.ctx.playOrderPos).toBe(0);
      const delta = Object.values(next.G.exp.core.players).map(({ id, personal }) => Object.fromEntries(
        Object.entries(personal.resources).map(([resort, count]) => [resort, count - placed.G.exp.core.players[id].personal.resources[resort]]),
      ));
      expect(delta).toEqual([{ DOM: 3, FOR: 5, INF: 1 }, { DOM: 2, FOR: 2, INF: 1 }]);
      // CORE-01-06-15: the tie on INF-W3-2 sends one resource to Noise.
      expect(next.G.exp.core.resources.noise).toEqual({ ...placed.G.exp.core.resources.noise, INF: placed.G.exp.core.resources.noise.INF + 1 });
    }
  }

  const final = terminalState(client, 71, '0', ['0', '1']);
  expect(final.G.exp.core.tiles.drawPile).toEqual([]);
  expect(final.G.exp.core.tiles.discardFaceUp).toEqual([]);
  expect(final.G.exp.core.tiles.board).toHaveLength(72);
  expect(markerCounts(final.G)).toEqual([4, 4]);
  expect(new Set(hashes).size).toBe(71);
  expect(final.G.lastTurnHash).toBe('06033bb8ff0535ed345c7adb61bbfd1b4f62458376d42dfc43914a1c76442ad5');
  return { ...final, hashes };
}

function replayLastPlacementWithMeasure() {
  const client = fixtureClient(
    { matchSeed: 'task-0030-final-measure', expansions: { exp01: true } },
    [
      { tileId: 'Hotspot-1', coord: { q: 1, r: 0 } },
      { tileId: 'Committee-1', coord: { q: 2, r: -1 } },
      { tileId: 'Lobbyist-1', coord: { q: 1, r: -1 } },
      { tileId: 'DOM-W1-1', coord: { q: 0, r: 1 } },
      { tileId: 'Committee-2', coord: { q: 1, r: 1 } },
    ],
    ['Committee-7', 'Committee-8', 'Committee-9', 'DOM-W3-1'],
    [{ owner: '0', tileId: 'DOM-W1-1' }, { owner: '1', tileId: 'Lobbyist-1' }],
  );
  const measureId = client.getState()!.G.exp!.exp01!.measures!.open[0];
  client.moves.placeTile({ q: -1, r: 0 });
  moveMarker(client, 'INF-0-2', 'Committee-7');
  client.moves.placeTile({ q: -2, r: 0 });
  client.moves.doPoliticalAction({ type: 'exp01_takeMeasure', payload: { measureId } });
  const settled = client.getState()!;
  expect(settled.ctx.turn).toBe(3);
  expect(settled.G.exp.core.players['0'].personal.resources.DOM).toBe(1);
  client.moves.placeTile({ q: -3, r: 0 });
  moveMarker(client, 'INF-0-2', 'Committee-9', 'Committee-7');

  const drawn = client.getState()!;
  expect(drawn.ctx.turn).toBe(4);
  expect(drawn.ctx.gameover).toBeUndefined();
  expect(drawn.G.exp.core.tiles.drawPile).toEqual([]);
  expect(drawn.G.exp.core.tiles.drawResolution?.tileId).toBe('DOM-W3-1');
  expect(markerCounts(drawn.G)).toEqual([2, 1]);
  client.moves.placeTile({ q: 2, r: 0 });

  // CORE-01-09-01A: the Hotspot and full political sequence precede the final Settlement.
  const placed = client.getState()!;
  expect(placed.ctx.gameover).toBeUndefined();
  expect(placed.ctx.activePlayers).toEqual({ '1': 'ExactlyOnePoliticalAction' });
  expect(placed.G.exp.core.tiles.board.find(tile => tile.tileId === 'Hotspot-1')?.enclosureProcessed).toBe(true);
  expect(placed.G.exp.core.influencesOnBoard).toContainEqual({ id: 'INF-1-4', owner: '1', starting: true, tileId: 'Hotspot-1' });
  expect(markerCounts(placed.G)).toEqual([2, 2]);
  client.moves.doPoliticalAction({ type: 'exp01_playMeasure', payload: { measureId } });

  const extra = client.getState()!;
  expect(extra.ctx.gameover).toBeUndefined();
  expect(extra.ctx.activePlayers).toEqual({ '1': 'AdditionalPoliticalAction' });
  expect(extra.ctx.playOrderPos).toBe(1);
  expect(extra.G.lastTurnHash).toBe(drawn.G.lastTurnHash);
  expect(extra.G.exp.core.players['0'].personal.resources.DOM).toBe(1);
  expect(extra.G.exp.core.players['1'].personal.resources.DOM).toBe(0);
  moveMarker(client, 'INF-1-2', 'DOM-W3-1');

  const final = terminalState(client, 4, '1', ['1']);
  expect(markerCounts(final.G)).toEqual([2, 3]);
  expect(final.G.exp.core.players['0'].personal.resources.DOM).toBe(2);
  expect(final.G.exp.core.players['1'].personal.resources.DOM).toBe(3);
  const measures = final.G.exp!.exp01!.measures!;
  expect(measures.hands['1']).toEqual([]);
  expect(measures.recycle).toContain(measureId);
  expect(final.G.exp.core.playedMeasureThisRound!['1']).toBe(true);
  expect(final.G.lastTurnHash).toBe('83aa91da6a850af720209d3dd63cb0fd133c8193c4753ccb4d3d75b589915f4b');
  return final;
}

function replayUnsuccessfulFinalDraw() {
  const client = fixtureClient(
    { matchSeed: 'task-0030-final-draw', expansions: { exp02: true }, variants: { tileRecycling: true } },
    [{ tileId: 'DOM-W2-1', coord: { q: 0, r: 1 } }],
    ['Committee-7', ...unpayableTiles],
    [{ owner: '0', tileId: 'DOM-W2-1' }],
  );
  client.moves.placeTile({ q: 1, r: 0 });
  const placed = client.getState()!;
  expect(placed.G.exp.core.tiles.drawPile).toEqual(unpayableTiles);
  expect(placed.G.exp.core.players['0'].personal.resources.DOM).toBe(0);
  expect(placed.G.exp.core.players['1'].personal.resources.DOM).toBe(0);
  moveMarker(client, 'INF-0-2', 'Committee-7');

  // CORE-01-09-01B/-01C: the next draw ends the begun turn before its political slot.
  const final = terminalState(client, 2, '1', ['0']);
  expect(final.G.exp.core.tiles.board).toEqual(placed.G.exp.core.tiles.board);
  expect(final.G.exp.core.tiles.drawPile).toEqual([]);
  expect(final.G.exp.core.tiles.discardFaceUp.slice(-unpayableTiles.length)).toEqual(unpayableTiles);
  expect(final.G.exp.core.resources.bank.DOM).toBe(0);
  expect(final.G.exp.core.players['0'].personal.resources.DOM).toBe(2);
  expect(final.G.exp.core.players['1'].personal.resources.DOM).toBe(0);
  expect(markerCounts(final.G)).toEqual([2, 0]);
  expect(final.G.lastTurnHash).toBe('95b49fd2b690f6f28ee6bfb8021da0429519cafeb60416c9d78b090d5d8cff26');
  return final;
}

describe('S09: endgame replays through boardgame.io', () => {
  beforeEach(() => {
    __resetRegisteredExpansionsForTest();
    // The shortened replay isolates the final action sequence with a fixture deck.
    registerExpansion({ ...exp01Economy(), measureRules: undefined, tiles: undefined,
      measureDeck: () => ['ECO_M01', 'ECO_M02', 'ECO_M03', 'ECO_M04', 'ECO_M05', 'ECO_M06', 'ECO_M07', 'ECO_M08'],
    });
  });

  it('replays the entire seeded CORE deck, settles the shortened final round once and shares victory', () => {
    expect(replayFullCoreMatch()).toEqual(replayFullCoreMatch());
  }, 20_000);

  it('settles a regular round boundary once after the last Tile, Hotspot, Measure and additional action', () => {
    expect(replayLastPlacementWithMeasure()).toEqual(replayLastPlacementWithMeasure());
  });

  it('settles once after exhausting an unpayable final draw, omitting its political action', () => {
    registerExpansion({
      id: 'exp02',
      registerResources: () => {},
      setupExpansionState: G => { ensureExpansionSlice(G, 'exp02', {}); },
      hooks: {
        costIncreases: ({ effect }) => {
          if (effect.kind === 'placeTile' && unpayableTiles.includes(effect.tileId)) return { DOM: 1 };
        },
      },
    });
    expect(replayUnsuccessfulFinalDraw()).toEqual(replayUnsuccessfulFinalDraw());
  });
});

describe('CORE-01-09-00: victory at the Influence limit', () => {
  beforeEach(() => __resetRegisteredExpansionsForTest());

  it.each([
    [2, 7, []], [2, 7, ['Committee-9']], [5, 8, ['Committee-9']], [6, 8, ['Committee-9']],
  ])('ends with %i players on marker %i with remaining tiles %j', (numPlayers, limit, remaining) => {
    const draw = Array.from({ length: numPlayers + 1 }, (_, i) => `Committee-${i + 2}`);
    draw.push(...remaining);
    const client = fixtureClient({ matchSeed: 'influence-limit', addOn56: numPlayers > 2 }, [
      { tileId: 'Committee-1', coord: { q: 1, r: 0 } },
      { tileId: 'Committee-10', coord: { q: -1, r: 0 } },
      { tileId: 'DOM-W1-1', coord: { q: 0, r: 1 } },
    ], draw, [{ owner: '0', tileId: 'DOM-W1-1' }], {
      numPlayers,
      prepare: G => {
        seedBoardInfluence(G, '0', 'Committee-1', limit - 2);
        for (const player of Object.values(G.exp.core.players).slice(1)) {
          seedBoardInfluence(G, player.id, 'Committee-10', player.personal.influence.length);
        }
        Object.assign(G.exp.core.players['0'].personal.resources, { DOM: 1, FOR: 1 });
      },
    });

    client.moves.placeTile({ q: 2, r: 0 });
    client.moves.doPoliticalAction({ type: 'formalizeInfluence', payload: { tileId: 'Committee-1', resources: ['DOM', 'FOR'] } });
    const formalized = client.getState()!;
    expect(formalized.ctx.gameover).toBeUndefined();
    expect(formalized.ctx.currentPlayer).toBe('1');
    expect(markerCounts(formalized.G)[0]).toBe(limit - 1);
    const [lastMarker] = formalized.G.exp.core.players['0'].personal.influence;
    expect(lastMarker).toBeDefined();

    for (let i = 1; i < numPlayers; i++) {
      client.moves.placeTile({ q: i + 2, r: 0 });
      moveMarker(client, `INF-${i}-1`, `Committee-${i + 2}`, 'Committee-10');
    }
    client.moves.placeTile({ q: numPlayers + 2, r: 0 });
    const beforeWin = client.getState()!;
    expect(beforeWin.ctx.gameover).toBeUndefined();
    expect(beforeWin.G.exp.core.tiles.drawPile).toEqual(remaining);
    moveMarker(client, lastMarker.id, `Committee-${numPlayers + 2}`);

    const { G } = terminalState(client, numPlayers + 1, '0', ['0']);
    expect(markerCounts(G)[0]).toBe(limit);
    expect(G.exp.core.tiles.drawPile).toEqual(remaining);
    expect(G.exp.core.players['0'].personal.resources).toEqual(beforeWin.G.exp.core.players['0'].personal.resources);
  });

  it.each([false, true])('stops later enclosures when the winning Hotspot award requires a fee: %s', paid => {
    if (paid) registerExpansion(exp03Climate());
    const client = fixtureClient({ matchSeed: 'hotspot-influence-limit', expansions: { exp03: paid } }, [
      { tileId: 'Hotspot-1', coord: { q: 2, r: 0 } },
      { tileId: 'Committee-1', coord: { q: 2, r: -1 } },
      { tileId: 'Lobbyist-1', coord: { q: 1, r: -1 } },
      { tileId: 'Committee-2', coord: { q: 0, r: 1 } },
      { tileId: 'Committee-3', coord: { q: 1, r: 1 } },
      { tileId: 'Committee-4', coord: { q: 3, r: 0 } },
      { tileId: 'Committee-5', coord: { q: 3, r: -1 } },
      { tileId: 'Committee-6', coord: { q: 2, r: 1 } },
    ], ['Hotspot-2', 'Committee-7'], [], {
      prepare: G => {
        seedBoardInfluence(G, '0', 'Lobbyist-1', 6);
        seedBoardInfluence(G, '1', 'Hotspot-1', 6);
        for (const player of Object.values(G.exp.core.players)) {
          player.personal.influence.push({ id: `INF-${player.id}-F3`, owner: player.id });
          if (paid) player.personal.resources.CLM = 1;
        }
        if (paid) {
          const registration = createResolver()(G, { kind: 'registerMeasureEffect', instance: {
            sourceCardId: 'CLM_M05', owner: '1', playNumber: 1, duration: 'ownerNextTurn',
          } });
          expect(registration.ok).toBe(true);
        }
      },
    });

    client.moves.placeTile({ q: 1, r: 0 });
    if (paid) {
      expect(client.getState()!.ctx.activePlayers).toEqual({ '1': 'ResolveHotspot' });
      expect(client.getState()!.ctx.gameover).toBeUndefined();
      client.updatePlayerID('1');
      client.moves.chooseHotspotOutcome({ kind: 'greenwashing', resource: 'CLM' });
    }

    const { G } = terminalState(client, 1, '0', ['1']);
    expect(markerCounts(G)).toEqual([6, 7]);
    expect(G.exp.core.tiles.drawPile).toEqual(['Committee-7']);
    expect(G.exp.core.pendingHotspot).toBeUndefined();
    expect(G.exp.core.remainingHotspots).toBeUndefined();
    expect(G.exp.core.tiles.board.find(tile => tile.tileId === 'Hotspot-1')?.enclosureProcessed).toBe(true);
    expect(G.exp.core.tiles.board.find(tile => tile.tileId === 'Hotspot-2')?.enclosureProcessed).toBeUndefined();
    if (paid) {
      expect(G.exp.core.players['1'].personal.resources.CLM).toBe(0);
      expect(G.exp.core.players['0'].personal.resources.CLM).toBe(1);
      expect(G.exp.core.resources.bank.CLM).toBe(1);
    }
  });
});
