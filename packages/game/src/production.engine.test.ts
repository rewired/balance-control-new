import { Client } from 'boardgame.io/client';
import {
  __resetRegisteredExpansionsForTest, ensureExpansionSlice, registerExpansion,
  type BoardPlacement, type CoreState, type CostIncreasesArgs, type ExpansionHooks, type ExpansionId,
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

function setupSettlement(expansions: Partial<Record<ExpansionId, boolean>>, tied = false, board: BoardPlacement[] = [resort]): CoreClient {
  const game = createBCGame({ matchSeed: 'task-0030-production', expansions });
  const setup = game.setup!;
  game.setup = (context, data) => {
    const G = setup(context, data);
    const draw = ['Committee-1', 'Committee-2', 'Committee-3'];
    G.exp.core.tiles.board.push(...board);
    G.exp.core.tiles.discardFaceUp = G.exp.core.tiles.drawPile.filter(id => !board.some(placement => placement.tileId === id) && !draw.includes(id));
    G.exp.core.tiles.drawPile = draw;
    G.exp.core.influencesOnBoard = (tied ? ['0', '1'] : ['0']).map(id => ({
      ...G.exp.core.players[id].personal.influence.shift()!, tileId: resort.tileId,
    }));
    return G;
  };
  return Client({ game, numPlayers: 2 });
}

function placeMarker(client: CoreClient, targetTileId: string): void {
  const { G, ctx } = client.getState()!;
  const markerId = G.exp.core.players[ctx.currentPlayer].personal.influence[0].id;
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

  it.each([
    { rules: 'current', final: false, capped: true },
    { rules: 'current', final: true, capped: true },
    { rules: 'recorded', final: false, capped: false },
  ] as const)('applies the resort cap at Settlement under $rules rules (final=$final)', ({ rules, final, capped }) => {
    registerExpansion({
      id: 'exp02',
      registerResources: registry => registry.register('SEC'),
      setupExpansionState: G => { ensureExpansionSlice(G, 'exp02', {}); },
    });
    const game = createBCGame({ expansions: { exp02: true } }, rules);
    const setup = game.setup!;
    game.setup = (context, data) => {
      const G = setup(context, data);
      const { players, tiles, resources } = G.exp.core;
      const draw = final ? ['Committee-1', 'Committee-2'] : ['Committee-1', 'Committee-2', 'Committee-3'];
      tiles.board.push(resort);
      tiles.discardFaceUp = tiles.drawPile.filter(id => id !== resort.tileId && !draw.includes(id));
      tiles.drawPile = draw;
      G.exp.core.influencesOnBoard = [{ ...players['0'].personal.influence.shift()!, tileId: resort.tileId }];
      players['0'].personal.resources.DOM = 11;
      players['1'].personal.resources.SEC = 15;
      Object.assign(resources.bank, { DOM: 5, SEC: 7 });
      return G;
    };
    const client = Client({ game, numPlayers: 2 });
    openLastTurnOfRound(client);
    expect(client.getState()!.G.exp.core.players['1'].personal.resources.SEC).toBe(15);
    placeMarker(client, 'Committee-2');
    const { G, ctx } = client.getState()!;
    expect(Boolean(ctx.gameover)).toBe(final);
    expect(G.exp.core.players['0'].personal.resources.DOM).toBe(capped ? 12 : 14);
    expect(G.exp.core.players['1'].personal.resources.SEC).toBe(capped ? 12 : 15);
    expect(G.exp.core.resources.bank).toMatchObject({ DOM: 2, SEC: 7 });
    expect(G.exp.core.resources.noise).toMatchObject(capped ? { DOM: 2, SEC: 3 } : { DOM: 0, SEC: 0 });
  });

  it('T07: pays the full automatic production without running player-paid cost hooks', () => {
    const costs = vi.fn(({ effect }: CostIncreasesArgs) => {
      if (effect.kind === 'applyProductionAt' || effect.kind === 'addResources'
          || (effect.kind === 'placeOrMoveInfluence' && effect.targetTileId === resort.tileId)) return { DOM: 1 };
    });
    registerHooks('exp02', { costIncreases: costs });
    const client = setupSettlement({ exp02: true });
    openLastTurnOfRound(client);
    const before = client.getState()!;
    expect(before.G.exp.core.players['0'].personal.resources.DOM).toBe(0);
    expect(before.G.exp.core.resources.bank.DOM).toBe(0);

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
    expect(settled.G.exp.core.players['0'].personal.resources.DOM).toBe(3);
    expect(settled.G.exp.core.players['1'].personal.resources.DOM).toBe(0);
    expect(settled.G.exp.core.resources.noise.DOM).toBe(0);
    expect(settled.G.exp.core.resources.bank.DOM).toBe(0);
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
    expect(G.exp.core.players['0'].personal.resources.DOM).toBe(share);
    expect(G.exp.core.players['1'].personal.resources.DOM).toBe(share);
    expect(G.exp.core.resources.noise.DOM).toBe(noise);
  });

  it('checks the producing tile prohibition before collecting output modifiers', () => {
    const productionModifiers = vi.fn(() => [{ kind: 'double', source: 'measure' }] as const);
    const otherProhibitions = vi.fn(({ effect }: CostIncreasesArgs) => effect.kind === 'applyProductionAt');
    registerHooks('exp01', { prohibitions: otherProhibitions });
    registerHooks('exp02', {
      priorityProhibition: ({ effect }) => effect.kind === 'applyProductionAt'
        && effect.contextCoord?.q === resort.coord.q && effect.contextCoord?.r === resort.coord.r,
      productionModifiers,
    });
    const client = setupSettlement({ exp01: true, exp02: true });
    openLastTurnOfRound(client);
    placeMarker(client, 'Committee-2');

    const { G, ctx } = client.getState()!;
    expect(ctx.turn).toBe(3);
    expect(otherProhibitions.mock.calls.some(([{ effect }]) => effect.kind === 'applyProductionAt')).toBe(false);
    expect(productionModifiers).not.toHaveBeenCalled();
    expect(G.exp.core.players['0'].personal.resources.DOM).toBe(0);
    expect(G.exp.core.resources.noise.DOM).toBe(0);
  });

  it('T18: settles ResortTiles in ordinal Tile ID order even with reversed board insertion', () => {
    const seen: string[] = [];
    registerHooks('exp02', { productionModifiers: ({ tile }) => { seen.push(tile.id); } });
    const earlier = { tileId: 'DOM-W1-1', coord: { q: -1, r: 0 } };
    const client = setupSettlement({ exp02: true }, false, [resort, earlier]);
    openLastTurnOfRound(client);
    placeMarker(client, 'Committee-2');

    expect(client.getState()!.ctx.turn).toBe(3);
    expect(seen).toEqual([earlier.tileId, resort.tileId]);
  });
});
