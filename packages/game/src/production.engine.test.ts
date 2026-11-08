import { Client } from 'boardgame.io/client';
import {
  __resetRegisteredExpansionsForTest, ensureExpansionSlice, registerExpansion,
  type CoreState, type CostIncreasesArgs, type ExpansionHooks, type ExpansionId,
} from '@bc/rules';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createBCGame } from './factory.js';

const resort = { tileId: 'DOM-W3-1', coord: { q: 0, r: 1 } };
type CoreClient = ReturnType<typeof Client<CoreState>>;

function registerHooks(id: ExpansionId, hooks: ExpansionHooks): void {
  registerExpansion({
    id,
    registerResources: () => {},
    setupExpansionState: G => { ensureExpansionSlice(G, id, {}); },
    hooks,
  });
}

function setupSettlement(expansions: Partial<Record<ExpansionId, boolean>>, tied = false): CoreClient {
  const game = createBCGame({ matchSeed: 'task-0030-production', expansions });
  const setup = game.setup!;
  game.setup = (context, data) => {
    const G = setup(context, data);
    const draw = ['Committee-1', 'Committee-2', 'Committee-3'];
    G.tiles.board.push(resort);
    G.tiles.discardFaceUp = G.tiles.drawPile.filter(id => id !== resort.tileId && !draw.includes(id));
    G.tiles.drawPile = draw;
    G.influencesOnBoard = (tied ? ['0', '1'] : ['0']).map(id => ({
      ...G.players[id].personal.influence.shift()!, tileId: resort.tileId,
    }));
    return G;
  };
  return Client({ game, numPlayers: 2 });
}

function placeMarker(client: CoreClient, targetTileId: string): void {
  const { G, ctx } = client.getState()!;
  const markerId = G.players[ctx.currentPlayer].personal.influence[0].id;
  client.moves.doPoliticalAction({ type: 'placeOrMoveInfluence', payload: { markerId, targetTileId } });
}

function openLastTurnOfRound(client: CoreClient): void {
  client.moves.placeTile({ q: 1, r: 0 });
  placeMarker(client, 'Committee-1');
  client.moves.placeTile({ q: 2, r: 0 });
  expect(client.getState()!.ctx.activePlayers).toEqual({ '1': 'ExactlyOnePoliticalAction' });
}

describe('Canonical Resort Production through boardgame.io', () => {
  beforeEach(() => __resetRegisteredExpansionsForTest());

  it('T07: pays the full automatic production without running player-paid cost hooks', () => {
    const costs = vi.fn(({ effect }: CostIncreasesArgs) => {
      if (effect.kind === 'applyProductionAt' || effect.kind === 'addResources'
          || (effect.kind === 'placeOrMoveInfluence' && effect.targetTileId === resort.tileId)) return { DOM: 1 };
    });
    registerHooks('exp02', { costIncreases: costs });
    const client = setupSettlement({ exp02: true });
    openLastTurnOfRound(client);
    const before = client.getState()!;
    expect(before.G.players['0'].personal.resources.DOM).toBe(0);
    expect(before.G.resources.bank.DOM).toBe(0);

    costs.mockClear();
    placeMarker(client, resort.tileId);
    expect(costs).toHaveBeenCalledOnce();
    expect(client.getState()!._stateID).toBe(before._stateID);
    expect(client.getState()!.G).toEqual(before.G);

    costs.mockClear();
    placeMarker(client, 'Committee-2');
    const settled = client.getState()!;
    expect(settled.ctx.turn).toBe(3);
    expect(settled.ctx.gameover).toBeUndefined();
    expect(settled.G.players['0'].personal.resources.DOM).toBe(3);
    expect(settled.G.players['1'].personal.resources.DOM).toBe(0);
    expect(settled.G.resources.noise.DOM).toBe(0);
    expect(settled.G.resources.bank.DOM).toBe(0);
    expect(costs.mock.calls.some(([{ effect }]) => effect.kind === 'applyProductionAt' || effect.kind === 'addResources')).toBe(false);
  });

  it.each([
    { exp03: true, share: 2, noise: 1 },
    { exp03: false, share: 0, noise: 0 },
  ])('doubles before adding active modifiers and floors once with exp03=$exp03', ({ exp03, share, noise }) => {
    registerHooks('exp01', { productionModifiers: () => [{ kind: 'additive', source: 'measure', delta: -6 }, { kind: 'double', source: 'measure' }] });
    registerHooks('exp02', { productionModifiers: () => [{ kind: 'additive', source: 'regulation', delta: -1 }] });
    const climateModifiers = vi.fn(() => [{ kind: 'additive', source: 'measure', delta: 6 }] as const);
    registerHooks('exp03', { productionModifiers: climateModifiers });
    const client = setupSettlement({ exp01: true, exp02: true, exp03 }, true);
    openLastTurnOfRound(client);
    placeMarker(client, 'Committee-2');

    // CORE-01-06-16(a)-(c): with Climate, 6 - 6 - 1 + 6 = 5; without it, -1 floors to 0.
    const { G, ctx } = client.getState()!;
    expect(ctx.turn).toBe(3);
    expect(climateModifiers).toHaveBeenCalledTimes(exp03 ? 1 : 0);
    expect(G.players['0'].personal.resources.DOM).toBe(share);
    expect(G.players['1'].personal.resources.DOM).toBe(share);
    expect(G.resources.noise.DOM).toBe(noise);
  });

  it('checks the producing tile prohibition before collecting output modifiers', () => {
    const productionModifiers = vi.fn(() => [{ kind: 'double', source: 'measure' }] as const);
    registerHooks('exp02', {
      prohibitions: ({ effect }) => effect.kind === 'applyProductionAt'
        && effect.contextCoord?.q === resort.coord.q && effect.contextCoord?.r === resort.coord.r,
      productionModifiers,
    });
    const client = setupSettlement({ exp02: true });
    openLastTurnOfRound(client);
    placeMarker(client, 'Committee-2');

    const { G, ctx } = client.getState()!;
    expect(ctx.turn).toBe(3);
    expect(productionModifiers).not.toHaveBeenCalled();
    expect(G.players['0'].personal.resources.DOM).toBe(0);
    expect(G.resources.noise.DOM).toBe(0);
  });
});
