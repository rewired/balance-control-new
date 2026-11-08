import { Client } from 'boardgame.io/client';
import { exp01Economy } from '@bc/exp-01-economy';
import {
  __resetRegisteredExpansionsForTest, ensureExpansionSlice, registerExpansion,
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
  return Object.keys(G.players).map(id => G.influencesOnBoard?.filter(marker => marker.owner === id).length ?? 0);
}

function fixtureClient(
  config: unknown,
  board: BoardPlacement[],
  draw: string[],
  markers: { owner: string; tileId: string }[],
): CoreClient {
  const game = createBCGame(config);
  const setup = game.setup!;
  game.setup = (context, data) => {
    const G = setup(context, data);
    G.tiles.board.push(...board);
    G.tiles.discardFaceUp = G.tiles.drawPile.filter(id => !draw.includes(id) && !board.some(tile => tile.tileId === id));
    G.tiles.drawPile = draw;
    G.influencesOnBoard = markers.map(({ owner, tileId }) => {
      const marker = G.players[owner].personal.influence.shift()!;
      return { ...marker, tileId };
    });
    return G;
  };
  return Client({ game, numPlayers: 2 });
}

function terminalState(client: CoreClient, turn: number, playerID: string, winners: string[]) {
  const { G, ctx, _stateID, isActive } = client.getState()!;
  expect(ctx.turn).toBe(turn);
  expect(ctx.currentPlayer).toBe(playerID);
  expect(ctx.gameover).toEqual({ winners });
  expect(isActive).toBe(false);
  expect(G.tiles.drawResolution).toBeNull();

  const { lastTurnHash, ...completed } = G;
  expect(lastTurnHash).toMatch(/^[0-9a-f]{64}$/);
  const persisted = JSON.parse(JSON.stringify(completed));
  expect(lastTurnHash).toBe(stableHash({ state: persisted, turn, playerID }));

  const source = G.influencesOnBoard?.find(marker => marker.owner === playerID);
  const marker = source ?? G.players[playerID].personal.influence[0];
  const target = G.tiles.board.find(tile => tile.tileId !== 'StartCommittee' && tile.tileId !== source?.tileId)!;
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
  expect(client.getState()!.G.tiles.drawPile).toHaveLength(70);

  for (let q = 1; q <= 71; q++) {
    const { G, ctx } = client.getState()!;
    const playerID = String((q - 1) % 2);
    expect(ctx.turn).toBe(q);
    expect(ctx.currentPlayer).toBe(playerID);
    const markerId = `INF-${playerID}-${q <= 8 ? Math.ceil(q / 2) : 1}`;
    const sourceTileId = G.influencesOnBoard?.find(marker => marker.id === markerId)?.tileId;
    const offer = G.tiles.drawResolution!;
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
      const delta = Object.values(next.G.players).map(({ id, personal }) => Object.fromEntries(
        Object.entries(personal.resources).map(([resort, count]) => [resort, count - placed.G.players[id].personal.resources[resort]]),
      ));
      expect(delta).toEqual([{ DOM: 3, FOR: 5, INF: 1 }, { DOM: 2, FOR: 2, INF: 1 }]);
      // CORE-01-06-15: the tie on INF-W3-2 sends one resource to Noise.
      expect(next.G.resources.noise).toEqual({ ...placed.G.resources.noise, INF: placed.G.resources.noise.INF + 1 });
    }
  }

  const final = terminalState(client, 71, '0', ['0', '1']);
  expect(final.G.tiles.drawPile).toEqual([]);
  expect(final.G.tiles.discardFaceUp).toEqual([]);
  expect(final.G.tiles.board).toHaveLength(72);
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
  expect(settled.G.players['0'].personal.resources.DOM).toBe(1);
  client.moves.placeTile({ q: -3, r: 0 });
  moveMarker(client, 'INF-0-2', 'Committee-9', 'Committee-7');

  const drawn = client.getState()!;
  expect(drawn.ctx.turn).toBe(4);
  expect(drawn.ctx.gameover).toBeUndefined();
  expect(drawn.G.tiles.drawPile).toEqual([]);
  expect(drawn.G.tiles.drawResolution?.tileId).toBe('DOM-W3-1');
  expect(markerCounts(drawn.G)).toEqual([2, 1]);
  client.moves.placeTile({ q: 2, r: 0 });

  // CORE-01-09-01A: the Hotspot and full political sequence precede the final Settlement.
  const placed = client.getState()!;
  expect(placed.ctx.gameover).toBeUndefined();
  expect(placed.ctx.activePlayers).toEqual({ '1': 'ExactlyOnePoliticalAction' });
  expect(placed.G.tiles.board.find(tile => tile.tileId === 'Hotspot-1')?.enclosureProcessed).toBe(true);
  expect(placed.G.influencesOnBoard).toContainEqual({ id: 'INF-1-4', owner: '1', starting: true, tileId: 'Hotspot-1' });
  expect(markerCounts(placed.G)).toEqual([2, 2]);
  client.moves.doPoliticalAction({ type: 'exp01_playMeasure', payload: { measureId } });

  const extra = client.getState()!;
  expect(extra.ctx.gameover).toBeUndefined();
  expect(extra.ctx.activePlayers).toEqual({ '1': 'AdditionalPoliticalAction' });
  expect(extra.ctx.playOrderPos).toBe(1);
  expect(extra.G.lastTurnHash).toBe(drawn.G.lastTurnHash);
  expect(extra.G.players['0'].personal.resources.DOM).toBe(1);
  expect(extra.G.players['1'].personal.resources.DOM).toBe(0);
  moveMarker(client, 'INF-1-2', 'DOM-W3-1');

  const final = terminalState(client, 4, '1', ['1']);
  expect(markerCounts(final.G)).toEqual([2, 3]);
  expect(final.G.players['0'].personal.resources.DOM).toBe(2);
  expect(final.G.players['1'].personal.resources.DOM).toBe(3);
  const measures = final.G.exp!.exp01!.measures!;
  expect(measures.hands['1']).toEqual([]);
  expect(measures.recycle).toContain(measureId);
  expect(measures.usedThisRound['1']).toBe(true);
  expect(final.G.lastTurnHash).toBe('afc0bf6daf484f15407086b94634eb04f75cb2531b1875a2912e6633e964564e');
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
  expect(placed.G.tiles.drawPile).toEqual(unpayableTiles);
  expect(placed.G.players['0'].personal.resources.DOM).toBe(0);
  expect(placed.G.players['1'].personal.resources.DOM).toBe(0);
  moveMarker(client, 'INF-0-2', 'Committee-7');

  // CORE-01-09-01B/-01C: the next draw ends the begun turn before its political slot.
  const final = terminalState(client, 2, '1', ['0']);
  expect(final.G.tiles.board).toEqual(placed.G.tiles.board);
  expect(final.G.tiles.drawPile).toEqual([]);
  expect(final.G.tiles.discardFaceUp.slice(-unpayableTiles.length)).toEqual(unpayableTiles);
  expect(final.G.resources.bank.DOM).toBe(0);
  expect(final.G.players['0'].personal.resources.DOM).toBe(2);
  expect(final.G.players['1'].personal.resources.DOM).toBe(0);
  expect(markerCounts(final.G)).toEqual([2, 0]);
  expect(final.G.lastTurnHash).toBe('95b49fd2b690f6f28ee6bfb8021da0429519cafeb60416c9d78b090d5d8cff26');
  return final;
}

describe('S09: endgame replays through boardgame.io', () => {
  beforeEach(() => {
    __resetRegisteredExpansionsForTest();
    registerExpansion(exp01Economy());
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
