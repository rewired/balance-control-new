import { Client } from 'boardgame.io/client';
import {
  __resetRegisteredExpansionsForTest, ensureExpansionSlice, politicalMoveOptions, registerExpansion,
  type CoreState, type MeasureDeckState,
} from '@bc/rules';
import { exp01Economy } from '@bc/exp-01-economy';
import { beforeEach, describe, expect, it } from 'vitest';
import { exp03Climate } from './expansions/climate.js';
import { createBCGame } from './factory.js';

type CoreClient = ReturnType<typeof Client<CoreState>>;

function takeIntoFixtureHand(deck: MeasureDeckState, card: string, owner: string): void {
  const slot = deck.open.indexOf(card);
  if (slot >= 0) deck.open[slot] = null;
  else deck.drawPile.splice(deck.drawPile.indexOf(card), 1);
  deck.hands[owner].push(card);
}

function bargainingFixture(eco: number): CoreClient {
  const game = createBCGame({ expansions: { exp01: true } });
  const setup = game.setup!;
  game.setup = (context, data) => {
    const G = setup(context, data);
    const deck = G.exp!.exp01!.measures!;
    takeIntoFixtureHand(deck, 'ECO_M03', '0');
    deck.finalDiscard = [...deck.drawPile, ...deck.open.filter(card => card !== null)];
    for (const card of deck.finalDiscard) deck.playCounts[card] = 2;
    deck.open.fill(null);
    deck.drawPile = [];
    G.players['0'].personal.resources.ECO = eco;
    return G;
  };
  return Client({ game, numPlayers: 2 });
}

function place(client: CoreClient): string {
  const offer = client.getState()!.G.tiles.drawResolution!;
  client.moves.placeTile(offer.legalCoords[0]);
  return offer.tileId;
}

function mark(client: CoreClient, tileId: string): void {
  const { G, ctx } = client.getState()!;
  const markerId = G.players[ctx.currentPlayer].personal.influence[0].id;
  client.moves.doPoliticalAction({ type: 'placeOrMoveInfluence', payload: { markerId, targetTileId: tileId } });
}

describe('Paid Measures through boardgame.io', () => {
  beforeEach(() => {
    __resetRegisteredExpansionsForTest();
    const economy = exp01Economy();
    registerExpansion({
      ...economy,
      hooks: {
        ...economy.hooks,
        productionModifiers: ({ tile }) => tile.id === 'DOM-W5-1' ? [{ source: 'measure', kind: 'double' }] : [],
      },
    });
    registerExpansion(exp03Climate());
  });

  it('T11: rejects an unaffordable Collective Bargaining without registration, refill or usage', () => {
    const client = bargainingFixture(0);
    place(client);
    const before = client.getState()!;
    expect([...politicalMoveOptions(before.G, '0')].some(option => option.type === 'exp01_playMeasure')).toBe(false);
    client.moves.doPoliticalAction({ type: 'exp01_playMeasure', payload: { measureId: 'ECO_M03' } });
    const rejected = client.getState()!;
    expect(rejected._stateID).toBe(before._stateID);
    expect(rejected.ctx).toEqual(before.ctx);
    expect(rejected.G).toEqual(before.G);
  });

  it('T12: pays two ECO and refills the empty market before the additional action', () => {
    const client = bargainingFixture(2);
    const tile = place(client);
    client.moves.doPoliticalAction({ type: 'exp01_playMeasure', payload: { measureId: 'ECO_M03' } });
    const { G, ctx } = client.getState()!;
    const deck = G.exp!.exp01!.measures!;
    expect(G.players['0'].personal.resources.ECO).toBe(0);
    expect(G.resources.bank.ECO).toBe(2);
    expect(deck.open).toEqual(['ECO_M03', null, null]);
    expect(deck.playCounts.ECO_M03).toBe(1);
    expect(deck.recycle).toEqual([]);
    expect(G.activeMeasureEffects?.map(instance => instance.id)).toEqual(['ECO_M03:1']);
    expect(ctx.activePlayers).toEqual({ '0': 'AdditionalPoliticalAction' });
    client.moves.doPoliticalAction({ type: 'exp01_takeMeasure', payload: { measureId: 'ECO_M03' } });
    expect(client.getState()!.G.exp!.exp01!.measures!.hands['0']).toEqual(['ECO_M03']);
    expect(client.getState()!.G.activeMeasureEffects?.map(instance => instance.id)).toEqual(['ECO_M03:1']);
    expect(client.getState()!.G.tiles.board.some(placed => placed.tileId === tile)).toBe(true);
    mark(client, place(client));
    expect(client.getState()!.G.activeMeasureEffects).toBeUndefined();
  });

  it('plays and pays Investment Freeze and Supply Chain Disruption through their actual decks', () => {
    const game = createBCGame({ expansions: { exp01: true, exp03: true } });
    const setup = game.setup!;
    game.setup = (context, data) => {
      const G = setup(context, data);
      takeIntoFixtureHand(G.exp!.exp01!.measures!, 'ECO_M09', '0');
      takeIntoFixtureHand(G.exp!.exp03!.measures!, 'CLM_M11', '1');
      Object.assign(G.players['0'].personal.resources, { ECO: 2, INF: 1 });
      Object.assign(G.players['1'].personal.resources, { ECO: 1, CLM: 1 });
      G.resources.bank.DOM = 5;
      const resortId = 'DOM-W5-1';
      const draw = ['Committee-1', 'Committee-2'];
      G.tiles.discardFaceUp = G.tiles.drawPile.filter(id => id !== resortId && !draw.includes(id));
      G.tiles.drawPile = draw;
      G.tiles.board.push({ tileId: resortId, coord: { q: 0, r: 1 } });
      G.influencesOnBoard = [{ ...G.players['1'].personal.influence.shift()!, tileId: resortId }];
      return G;
    };
    const client = Client({ game, numPlayers: 2 });
    const first = place(client);
    const before = client.getState()!;
    client.moves.doPoliticalAction({ type: 'exp01_playMeasure', payload: { measureId: 'ECO_M09', targetPlayerID: '0' } });
    expect(client.getState()!._stateID).toBe(before._stateID);
    client.moves.doPoliticalAction({ type: 'exp01_playMeasure', payload: { measureId: 'ECO_M09', targetPlayerID: '1' } });
    expect(client.getState()!.G.activeMeasureEffects?.[0].id).toBe('ECO_M09:1');
    mark(client, first);

    const second = place(client);
    client.moves.doPoliticalAction({ type: 'exp03_playMeasure', payload: { measureId: 'CLM_M11', targetPlayerID: '1' } });
    expect(client.getState()!.G.activeMeasureEffects?.map(effect => effect.id)).toEqual(['ECO_M09:1', 'CLM_M11:1']);
    mark(client, second);

    const { G, ctx } = client.getState()!;
    expect(ctx.gameover).toEqual({ winners: ['1'] });
    expect(G.resources.bank).toMatchObject({ ECO: 3, INF: 1, CLM: 1, DOM: 4 });
    expect(G.players['1'].personal.resources).toMatchObject({ DOM: 1, ECO: 0, CLM: 0 });
    expect(G.activeMeasureEffects?.map(effect => effect.id)).toEqual(['CLM_M11:1']);
  });

  it('offers the Investment Program alternative at a virtually controlled Grassroots only', () => {
    registerExpansion({
      id: 'exp02',
      registerResources: () => {},
      setupExpansionState: G => { ensureExpansionSlice(G, 'exp02', {}); },
      hooks: {
        prohibitions: ({ effect }) => effect.kind === 'convertResources' && effect.contextCoord?.q === 2,
        costIncreases: ({ effect }) => effect.kind === 'convertResources' && effect.contextCoord?.r === -1 ? { FOR: 1 } : undefined,
      },
    });
    const game = createBCGame({ expansions: { exp01: true, exp02: true } });
    const setup = game.setup!;
    game.setup = (context, data) => {
      const G = setup(context, data);
      const board = [
        { tileId: 'Lobbyist-1', coord: { q: 1, r: 0 } },
        { tileId: 'InvestmentProgram', coord: { q: 2, r: 0 } },
        { tileId: 'Grassroots-1', coord: { q: 1, r: -1 } },
      ];
      G.tiles.drawPile = G.tiles.drawPile.filter(id => !board.some(placement => placement.tileId === id));
      G.tiles.board.push(...board);
      G.influencesOnBoard = [{ ...G.players['0'].personal.influence.shift()!, tileId: 'Lobbyist-1' }];
      Object.assign(G.players['0'].personal.resources, { ECO: 2, FOR: 1 });
      return G;
    };
    const client = Client({ game, numPlayers: 2 });
    place(client);
    const before = client.getState()!;
    const payload = { tileId: 'Grassroots-1', input: 'ECO', output: 'DOM' };
    client.moves.doPoliticalAction({ type: 'convertResources', payload });
    expect(client.getState()!._stateID).toBe(before._stateID);
    const alternative = { type: 'convertResources', payload: { ...payload, alternative: 'investmentProgram' } };
    expect([...politicalMoveOptions(before.G, '0')]).toContainEqual(alternative);
    client.moves.doPoliticalAction(alternative);
    const { G, ctx } = client.getState()!;
    expect(ctx.currentPlayer).toBe('1');
    expect(G.players['0'].personal.resources).toMatchObject({ ECO: 0, FOR: 0, DOM: 1 });
    expect(G.resources.bank).toMatchObject({ ECO: 2, FOR: 1, DOM: 0 });
  });
});
