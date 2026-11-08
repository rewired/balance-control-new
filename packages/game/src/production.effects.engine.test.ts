import { Client } from 'boardgame.io/client';
import { exp01Economy } from '@bc/exp-01-economy';
import { exp02Security } from '@bc/exp-02-security';
import { exp03Climate } from '@bc/exp-03-climate';
import {
  __resetRegisteredExpansionsForTest, createResolver, ensureExpansionSlice, getControl, registerExpansion, z,
  type BoardPlacement, type CoreState, type ExpansionHooks, type ExpansionId,
} from '@bc/rules';
import { beforeEach, describe, expect, it } from 'vitest';
import { createBCGame } from './factory.js';

type CoreClient = ReturnType<typeof Client<CoreState>>;
const dom = { tileId: 'DOM-W5-1', coord: { q: 1, r: 0 } };
const lobbyist = { tileId: 'Lobbyist-1', coord: { q: 2, r: 0 } };
const registerPayload = z.object({
  sourceCardId: z.enum(['ECO_M09', 'CLM_M11']),
  playNumber: z.union([z.literal(1), z.literal(2)]),
  targetPlayerID: z.string(),
}).strict();
type RegisterPayload = z.infer<typeof registerPayload>;

function installModule(id: ExpansionId, hooks: ExpansionHooks): void {
  const base = { exp01: exp01Economy, exp02: exp02Security, exp03: exp03Climate }[id]();
  registerExpansion({
    ...base,
    hooks: { ...base.hooks, ...hooks },
    tiles: undefined,
    measureDeck: undefined,
    registerResources: () => {},
    setupExpansionState: G => { ensureExpansionSlice(G, id, {}); },
    extendMoves: id === 'exp01' ? ({ add }) => add({
      // The test invokes the registration stage of a successful Measure via the real move router.
      type: 'test_registerProductionEffect',
      isPlayMeasure: true,
      payloadSchema: registerPayload,
      execute: (G, owner, payload: RegisterPayload) => createResolver()(G, {
        kind: 'registerMeasureEffect', instance: { ...payload, owner, duration: payload.sourceCardId === 'CLM_M11' ? 'ownerNextTurn' : 'thisRound' },
      }),
    }) : undefined,
  });
}

function setupMatch(
  board: BoardPlacement[],
  owned: Record<string, string[]>,
  numPlayers = 2,
  remaining = 5,
  seed?: (G: CoreState) => void,
  exp03 = true,
): CoreClient {
  const game = createBCGame({ matchSeed: 'task-0030-production-effects', expansions: { exp01: true, exp02: true, exp03 } });
  const setup = game.setup!;
  game.setup = (context, data) => {
    const G = setup(context, data);
    const draw = Array.from({ length: remaining }, (_, index) => `Committee-${index + 1}`);
    G.exp.core.tiles.board.push(...board);
    G.exp.core.tiles.discardFaceUp = G.exp.core.tiles.drawPile.filter(id => !draw.includes(id) && !board.some(p => p.tileId === id));
    G.exp.core.tiles.drawPile = draw;
    G.exp.core.influencesOnBoard = Object.entries(owned).flatMap(([id, tileIds]) => tileIds.map(tileId => ({
      ...G.exp.core.players[id].personal.influence.shift()!, tileId,
    })));
    seed?.(G);
    return G;
  };
  return Client({ game, numPlayers });
}

function placeTile(client: CoreClient): string {
  const { G, ctx } = client.getState()!;
  const tileId = G.exp.core.tiles.drawResolution!.tileId;
  client.moves.placeTile({ q: -ctx.turn, r: 0 });
  return tileId;
}

function placeMarker(client: CoreClient, targetTileId: string): void {
  const { G, ctx } = client.getState()!;
  const markerId = G.exp.core.players[ctx.currentPlayer].personal.influence[0].id;
  client.moves.doPoliticalAction({ type: 'placeOrMoveInfluence', payload: { markerId, targetTileId } });
}

function register(client: CoreClient, sourceCardId: RegisterPayload['sourceCardId'], targetPlayerID: string, playNumber: 1 | 2 = 1): void {
  client.moves.doPoliticalAction({ type: 'test_registerProductionEffect', payload: { sourceCardId, targetPlayerID, playNumber } });
}

describe('Production effects through boardgame.io', () => {
  beforeEach(() => __resetRegisteredExpansionsForTest());

  it('filters both directions of Measure output and doubling only under current sole control', () => {
    installModule('exp01', { productionModifiers: () => [
      { source: 'measure', kind: 'double' }, { source: 'measure', kind: 'additive', delta: -2 },
    ] });
    installModule('exp02', { productionModifiers: () => [
      { source: 'regulation', kind: 'additive', delta: -2 }, { source: 'other', kind: 'additive', delta: 1 },
    ] });
    installModule('exp03', { productionModifiers: () => [{ source: 'measure', kind: 'additive', delta: 3 }] });
    const tied = { tileId: 'FOR-W3-1', coord: { q: 0, r: 1 } };
    const other = { tileId: 'INF-W5-1', coord: { q: -1, r: 1 } };
    const client = setupMatch([dom, lobbyist, tied, other], {
      '0': [tied.tileId, other.tileId], '1': [tied.tileId],
    });

    const first = placeTile(client);
    register(client, 'ECO_M09', '1');
    const armed = client.getState()!;
    expect(armed.ctx.activePlayers).toEqual({ '0': 'AdditionalPoliticalAction' });
    expect(armed.G.exp.core.activeMeasureEffects).toEqual([
      { id: 'ECO_M09:1', sourceCardId: 'ECO_M09', playNumber: 1, owner: '0', targetPlayerID: '1', duration: 'thisRound' },
    ]);
    expect(getControl(armed.G, dom.coord)).toBeNull();
    placeMarker(client, first);
    placeTile(client);
    placeMarker(client, lobbyist.tileId);

    const firstSettlement = client.getState()!;
    expect(firstSettlement.ctx.turn).toBe(3);
    expect(getControl(firstSettlement.G, dom.coord)).toBe('1');
    expect(firstSettlement.G.exp.core.players['1'].personal.resources).toMatchObject({ DOM: 4, FOR: 3 });
    expect(firstSettlement.G.exp.core.players['0'].personal.resources).toMatchObject({ FOR: 3, INF: 10 });
    expect(firstSettlement.G.exp.core.activeMeasureEffects).toBeUndefined();

    placeMarker(client, placeTile(client));
    placeMarker(client, placeTile(client));
    expect(client.getState()!.G.exp.core.players['1'].personal.resources.DOM).toBe(14);
  });

  it('caps only final receipts per tile, preserving the original remainder and unissued bank stock', () => {
    installModule('exp01', { productionModifiers: ({ tile }) => tile.id === dom.tileId ? [{ source: 'measure', kind: 'double' }] : [] });
    installModule('exp02', { productionModifiers: ({ tile }) => tile.id === dom.tileId ? [{ source: 'regulation', kind: 'additive', delta: -1 }] : [] });
    installModule('exp03', {});
    const tied = { tileId: 'FOR-W5-1', coord: { q: 0, r: 1 } };
    const zeroShare = { tileId: 'INF-W1-1', coord: { q: 2, r: -1 } };
    const client = setupMatch([dom, lobbyist, tied, zeroShare], {
      '1': [lobbyist.tileId, tied.tileId], '2': [tied.tileId, zeroShare.tileId],
    }, 3, 3, G => { Object.assign(G.exp.core.resources.bank, { DOM: 5, FOR: 7, INF: 1 }); });

    const first = placeTile(client);
    register(client, 'CLM_M11', '1');
    placeMarker(client, first);
    const second = placeTile(client);
    register(client, 'CLM_M11', '1', 2);
    placeMarker(client, second);
    const third = placeTile(client);
    register(client, 'ECO_M09', '1');
    expect(client.getState()!.G.exp.core.activeMeasureEffects?.map(effect => effect.id)).toEqual(['CLM_M11:1', 'CLM_M11:2', 'ECO_M09:1']);
    placeMarker(client, third);

    const { G, ctx } = client.getState()!;
    expect(ctx.gameover).toEqual({ winners: ['1', '2'] });
    expect(G.exp.core.players['0'].personal.resources).toEqual({ DOM: 0, FOR: 0, INF: 0 });
    expect(G.exp.core.players['1'].personal.resources).toEqual({ DOM: 1, FOR: 1, INF: 0 });
    expect(G.exp.core.players['2'].personal.resources).toEqual({ DOM: 0, FOR: 2, INF: 0 });
    expect(G.exp.core.resources.noise).toEqual({ DOM: 0, FOR: 1, INF: 1 });
    expect(G.exp.core.resources.bank).toEqual({ DOM: 4, FOR: 3, INF: 0 });
    expect(G.exp.core.activeMeasureEffects?.map(effect => effect.id)).toEqual(['CLM_M11:1', 'CLM_M11:2']);
  });

  it('expires the cap immediately before its owner actually begins the next turn', () => {
    installModule('exp01', {});
    installModule('exp02', {});
    installModule('exp03', {});
    const client = setupMatch([dom], { '0': [dom.tileId] });
    placeMarker(client, placeTile(client));
    const second = placeTile(client);
    register(client, 'CLM_M11', '0');
    placeMarker(client, second);
    expect(client.getState()!.G.exp.core.players['0'].personal.resources.DOM).toBe(1);
    expect(client.getState()!.G.exp.core.activeMeasureEffects?.[0].owner).toBe('1');

    placeMarker(client, placeTile(client));
    expect(client.getState()!.ctx.currentPlayer).toBe('1');
    expect(client.getState()!.G.exp.core.activeMeasureEffects).toBeUndefined();
    placeMarker(client, placeTile(client));
    expect(client.getState()!.G.exp.core.players['0'].personal.resources.DOM).toBe(6);
  });

  it('rejects Supply Chain Disruption when its source expansion is disabled', () => {
    installModule('exp01', {});
    installModule('exp02', {});
    const client = setupMatch([dom], { '0': [dom.tileId] }, 2, 5, undefined, false);
    placeTile(client);
    const before = client.getState()!;
    register(client, 'CLM_M11', '1');
    expect(client.getState()!._stateID).toBe(before._stateID);
    expect(client.getState()!.G).toEqual(before.G);
    expect(client.getState()!.G).not.toHaveProperty('activeMeasureEffects');
  });
});
