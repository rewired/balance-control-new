import type { State } from 'boardgame.io';
import { Client } from 'boardgame.io/client';
import { CreateGameReducer } from 'boardgame.io/internal';
import { beforeEach, describe, expect, it } from 'vitest';
import {
  __resetRegisteredExpansionsForTest, createResolver, ensureExpansionSlice, getControl, registerExpansion, z,
  type BoardPlacement, type CoreState, type ExpansionHooks,
} from '@bc/rules';
import { createBCGame } from './factory.js';

const hotspot = { tileId: 'Hotspot-1', coord: { q: 1, r: 0 } };
const closingCoord = { q: 2, r: 0 };
const ring: BoardPlacement[] = [
  { tileId: 'Committee-1', coord: { q: 2, r: -1 } },
  { tileId: 'Lobbyist-1', coord: { q: 1, r: -1 } },
  { tileId: 'Committee-2', coord: { q: 0, r: 1 } },
  { tileId: 'Committee-3', coord: { q: 1, r: 1 } },
];
const nextTile = 'Committee-8';

function seedMarkers(G: CoreState, playerID: string, tileId: string, count: number): void {
  const markers = G.players[playerID].personal.influence.splice(0, count);
  (G.influencesOnBoard ??= []).push(...markers.map(marker => ({ ...marker, tileId })));
}

function setupGame(
  board: BoardPlacement[],
  firstDraw: string,
  seed: (G: CoreState) => void,
  hooks?: ExpansionHooks,
) {
  registerExpansion({
    id: 'exp02',
    registerResources: () => {},
    setupExpansionState: G => { ensureExpansionSlice(G, 'exp02', {}); },
    hooks,
    extendMoves: ({ add }) => {
      // Test probe through the real move router. Hotspot resolution has no public move.
      add({
        type: 'testRetryHotspot',
        payloadSchema: z.object({}).strict(),
        execute: G => createResolver()(G, { kind: 'resolveHotspotAt', coord: hotspot.coord }),
      });
    },
  });

  const game = createBCGame({ matchSeed: 'T04-hotspot', expansions: { exp02: true } });
  const setup = game.setup!;
  game.setup = (context, data) => {
    const G = setup(context, data);
    G.tiles.board.push(...board.map(placement => ({ ...placement })));
    const draw = [firstDraw, nextTile, 'Committee-9'];
    G.tiles.discardFaceUp = G.tiles.drawPile.filter(id => !draw.includes(id) && !board.some(p => p.tileId === id));
    G.tiles.drawPile = draw;
    seed(G);
    return G;
  };
  return { game, client: Client({ game, numPlayers: 2 }) };
}

function retryFromSave(game: ReturnType<typeof createBCGame>, state: State<CoreState>): State<CoreState> {
  const saved: State<CoreState> = JSON.parse(JSON.stringify(state));
  const action = { type: 'testRetryHotspot', payload: {} };
  return CreateGameReducer({ game })(saved, {
    type: 'MAKE_MOVE',
    payload: { type: 'doPoliticalAction', args: [action], playerID: saved.ctx.currentPlayer },
  });
}

function processed(G: CoreState, tileId = hotspot.tileId) {
  return G.tiles.board.find(p => p.tileId === tileId)?.enclosureProcessed;
}

describe('T04: first Hotspot enclosure through boardgame.io', () => {
  beforeEach(() => __resetRegisteredExpansionsForTest());

  it('leaves the event pending while an adjacent position is still empty', () => {
    const { client } = setupGame([...ring.slice(0, -1), hotspot], 'Committee-7', G => {
      seedMarkers(G, '0', hotspot.tileId, 1);
    });
    const before = client.getState()!.G;
    client.moves.placeTile(closingCoord);
    const { G, ctx } = client.getState()!;
    expect(ctx.activePlayers).toEqual({ '0': 'ExactlyOnePoliticalAction' });
    expect(processed(G)).toBeUndefined();
    expect(G.influencesOnBoard).toEqual(before.influencesOnBoard);
    expect(G.players['0'].personal.influence).toEqual(before.players['0'].personal.influence);
  });

  it('pays exactly one existing marker, then rejects a second payout from restored state', () => {
    const { game, client } = setupGame([...ring, hotspot], 'Committee-7', G => {
      seedMarkers(G, '0', hotspot.tileId, 1);
    }, {
      costIncreases: ({ effect }) => {
        if (effect.kind === 'resolveHotspotAt') throw new Error('The automatic payout has no payer');
      },
    });
    const before = client.getState()!.G;
    const supply = before.players['0'].personal.influence;
    const paid = supply[supply.length - 1];
    expect(processed(before)).toBeUndefined();

    client.moves.placeTile(closingCoord);
    const state = client.getState()!;
    expect(state.ctx.activePlayers).toEqual({ '0': 'ExactlyOnePoliticalAction' });
    expect(processed(state.G)).toBe(true);
    expect(state.G.players['0'].personal.influence).toEqual(supply.slice(0, -1));
    expect(state.G.influencesOnBoard).toEqual([
      ...before.influencesOnBoard!,
      { ...paid, tileId: hotspot.tileId },
    ]);

    const retried = retryFromSave(game, client.store.getState());
    expect(retried.ctx.turn).toBe(state.ctx.turn + 1);
    expect(processed(retried.G)).toBe(true);
    expect(retried.G.influencesOnBoard).toEqual(state.G.influencesOnBoard);
    expect(retried.G.players['0'].personal.influence).toEqual(state.G.players['0'].personal.influence);
  });

  it.each(['tie', 'empty supply', 'prohibition', 'zero output'] as const)(
    'consumes the event with %s, even when a payout would become possible later',
    reason => {
      const { game, client } = setupGame([...ring, hotspot], 'Committee-7', G => {
        seedMarkers(G, '0', hotspot.tileId, reason === 'empty supply' ? 4 : 1);
        if (reason === 'tie') seedMarkers(G, '1', hotspot.tileId, 1);
        if (reason === 'empty supply') {
          seedMarkers(G, '1', 'Committee-1', 4);
          Object.assign(G.players['0'].personal.resources, { DOM: 2, FOR: 1, INF: 1 });
        }
      }, {
        prohibitions: ({ G, effect }) => reason === 'prohibition' && effect.kind === 'resolveHotspotAt'
          && effect.contextCoord?.q === hotspot.coord.q && effect.contextCoord?.r === hotspot.coord.r
          && !G.tiles.board.some(p => p.tileId === nextTile),
        outputModifiers: ({ G, effect }) => {
          if (reason === 'zero output' && effect.kind === 'resolveHotspotAt'
              && !G.tiles.board.some(p => p.tileId === nextTile)) return 0;
        },
      });

      const before = client.getState()!.G;
      client.moves.placeTile(closingCoord);
      const closed = client.getState()!.G;
      expect(processed(closed)).toBe(true);
      expect(closed.influencesOnBoard).toEqual(before.influencesOnBoard);
      expect(closed.players).toEqual(before.players);
      expect(closed.resources).toEqual(before.resources);

      if (reason === 'empty supply') {
        client.moves.doPoliticalAction({
          type: 'formalizeInfluence', payload: { tileId: 'StartCommittee', resources: ['DOM', 'FOR', 'INF', 'DOM'] },
        });
      } else {
        client.moves.doPoliticalAction({
          type: 'placeOrMoveInfluence',
          payload: {
            markerId: closed.players['0'].personal.influence[0].id,
            targetTileId: reason === 'tie' ? hotspot.tileId : 'Committee-7',
          },
        });
      }
      client.moves.placeTile(client.getState()!.G.tiles.drawResolution!.legalCoords[0]);
      const ready = client.getState()!;
      expect(ready.ctx.activePlayers).toEqual({ '1': 'ExactlyOnePoliticalAction' });
      expect(ready.G.tiles.board.some(p => p.tileId === nextTile)).toBe(true);
      expect(getControl(ready.G, hotspot.coord)).toBe('0');
      expect(ready.G.players['0'].personal.influence.length).toBeGreaterThan(0);

      const retried = retryFromSave(game, client.store.getState());
      expect(retried.ctx.turn).toBe(ready.ctx.turn + 1);
      expect(processed(retried.G)).toBe(true);
      expect(retried.G.influencesOnBoard).toEqual(ready.G.influencesOnBoard);
      expect(retried.G.players['0'].personal.influence).toEqual(ready.G.players['0'].personal.influence);
    },
  );

  it.each([
    { drawnId: 'Hotspot-1', existingId: 'Hotspot-2' },
    { drawnId: 'Hotspot-2', existingId: 'Hotspot-1' },
  ])(
    'pays the lower ID first with $drawnId drawn and $existingId already on the Board',
    ({ drawnId, existingId }) => {
      const { client } = setupGame([
        { tileId: existingId, coord: closingCoord }, ...ring,
        { tileId: 'Committee-4', coord: { q: 3, r: 0 } },
        { tileId: 'Committee-5', coord: { q: 3, r: -1 } },
        { tileId: 'Committee-6', coord: { q: 2, r: 1 } },
      ], drawnId, G => {
        seedMarkers(G, '0', 'Lobbyist-1', 1);
        seedMarkers(G, '0', existingId, 2);
      });
      const before = client.getState()!.G;
      const [remaining] = before.players['0'].personal.influence;
      expect(processed(before, existingId)).toBeUndefined();

      client.moves.placeTile(hotspot.coord);
      const { G, ctx } = client.getState()!;
      expect(ctx.activePlayers).toEqual({ '0': 'ExactlyOnePoliticalAction' });
      expect(processed(G, drawnId)).toBe(true);
      expect(processed(G, existingId)).toBe(true);
      expect(getControl(G, closingCoord)).toBe('0');
      expect(getControl(G, hotspot.coord)).toBe('0');
      expect(G.players['0'].personal.influence).toEqual([]);
      expect(G.influencesOnBoard).toEqual([
        ...before.influencesOnBoard!,
        { ...remaining, tileId: 'Hotspot-1' },
      ]);
    },
  );
});
