import { Client } from 'boardgame.io/client';
import { exp01Economy } from '@bc/exp-01-economy';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  __resetRegisteredExpansionsForTest, ensureExpansionSlice, politicalMoveOptions, registerExpansion,
  type BoardPlacement, type CoreState, type CostIncreasesArgs, type ExpansionHooks,
} from '@bc/rules';
import { createBCGame } from './factory.js';

const committee = { tileId: 'Committee-1', coord: { q: 1, r: 0 } };
const lobbyist = { tileId: 'Lobbyist-1', coord: { q: 2, r: 0 } };
const grassroots = { tileId: 'Grassroots-1', coord: { q: 3, r: 0 } };
const otherGrassroots = { tileId: 'Grassroots-2', coord: { q: 0, r: -1 } };
const draw = ['Committee-2', 'Committee-3', 'Committee-4', 'Committee-5'];

function clientWithBoard(
  setupFixture: (G: CoreState) => void = () => {},
  config: unknown = {},
  numPlayers = 2,
  board: BoardPlacement[] = [committee, lobbyist, grassroots, otherGrassroots],
) {
  const game = createBCGame(config);
  const setup = game.setup!;
  game.setup = (context, data) => {
    const G = setup(context, data);
    G.tiles.board.push(...board);
    G.tiles.discardFaceUp = G.tiles.drawPile.filter(id => !draw.includes(id) && !board.some(p => p.tileId === id));
    G.tiles.drawPile = [...draw];
    setupFixture(G);
    return G;
  };
  return Client({ game, numPlayers });
}

type TestClient = ReturnType<typeof clientWithBoard>;

function placeDraw(client: TestClient): string {
  const offer = client.getState()!.G.tiles.drawResolution!;
  client.moves.placeTile(offer.legalCoords[0]);
  return offer.tileId;
}

function influence(client: TestClient, markerId: string, targetTileId: string, sourceTileId?: string): void {
  client.moves.doPoliticalAction({ type: 'placeOrMoveInfluence', payload: { markerId, targetTileId, sourceTileId } });
}

function formalize(client: TestClient, tileId: string, resources: string[]): void {
  client.moves.doPoliticalAction({ type: 'formalizeInfluence', payload: { tileId, resources } });
}

function convert(client: TestClient, tileId: string, input: string, output: string): void {
  client.moves.doPoliticalAction({ type: 'convertResources', payload: { tileId, input, output } });
}

function expectRejected(client: TestClient, action: () => void): void {
  const before = client.getState()!;
  action();
  const after = client.getState()!;
  expect(after._stateID).toBe(before._stateID);
  expect(after.ctx).toEqual(before.ctx);
  expect(after.G).toEqual(before.G);
}

function placeStartingMarkers(G: CoreState, leaveUnplacedPlayer?: string): void {
  G.influencesOnBoard = Object.values(G.players).flatMap(player => {
    const supply = player.personal.influence;
    const tileId = player.id === '0' ? lobbyist.tileId : otherGrassroots.tileId;
    return supply.splice(0, supply.length - Number(player.id === leaveUnplacedPlayer)).map(marker => ({ ...marker, tileId }));
  });
}

function enableHooks(hooks: ExpansionHooks): void {
  registerExpansion({
    id: 'exp02',
    registerResources: registry => registry.register('SEC'),
    setupExpansionState: G => { ensureExpansionSlice(G, 'exp02', {}); },
    hooks,
  });
}

describe('CORE political actions through boardgame.io', () => {
  beforeEach(() => __resetRegisteredExpansionsForTest());

  it('places and relocates one specific marker, preserving identity and ownership', () => {
    const client = clientWithBoard();
    const chosen = client.getState()!.G.players['0'].personal.influence[1];
    const opponent = client.getState()!.G.players['1'].personal.influence[0];
    placeDraw(client);
    expectRejected(client, () => client.moves.doPoliticalAction({ type: 'chooseNoop' }));
    expectRejected(client, () => influence(client, opponent.id, committee.tileId));
    expectRejected(client, () => influence(client, chosen.id, 'StartCommittee'));
    expectRejected(client, () => influence(client, chosen.id, 'Committee-3'));
    influence(client, chosen.id, committee.tileId);
    expect(client.getState()!.G.influencesOnBoard).toEqual([{ ...chosen, tileId: committee.tileId }]);
    expect(client.getState()!.G.players['0'].personal.influence).not.toContainEqual(chosen);

    placeDraw(client);
    influence(client, opponent.id, grassroots.tileId);
    placeDraw(client);
    expectRejected(client, () => influence(client, opponent.id, committee.tileId, grassroots.tileId));
    expectRejected(client, () => influence(client, chosen.id, committee.tileId, committee.tileId));
    expectRejected(client, () => influence(client, chosen.id, 'StartCommittee', committee.tileId));
    expectRejected(client, () => influence(client, chosen.id, grassroots.tileId));
    expectRejected(client, () => influence(client, chosen.id, grassroots.tileId, lobbyist.tileId));
    influence(client, chosen.id, grassroots.tileId, committee.tileId);
    expect(client.getState()!.G.influencesOnBoard).toEqual([
      { ...chosen, tileId: grassroots.tileId }, { ...opponent, tileId: grassroots.tileId },
    ]);
  });

  it('binds movement costs and prohibitions to the destination, and preserves the marker when payment fails', () => {
    const costs = vi.fn(({ effect }: CostIncreasesArgs) => {
      if (effect.kind === 'placeOrMoveInfluence' && effect.contextCoord?.q === grassroots.coord.q) return { DOM: 1, FOR: 1 };
    });
    enableHooks({
      prohibitions: ({ effect }) => effect.kind === 'placeOrMoveInfluence' && effect.contextCoord?.q === lobbyist.coord.q,
      costIncreases: costs,
      outputModifiers: ({ effect }) => {
        if (effect.kind === 'placeOrMoveInfluence') throw new Error('Influence relocation is not output');
      },
    });
    const client = clientWithBoard(G => {
      placeStartingMarkers(G);
      Object.assign(G.players['0'].personal.resources, { DOM: 1, FOR: 1 });
    }, { expansions: { exp02: true } });
    placeDraw(client);
    const markerId = 'INF-0-1';
    costs.mockClear();
    influence(client, markerId, grassroots.tileId, lobbyist.tileId);
    const { G } = client.getState()!;
    expect(costs.mock.calls.filter(([args]) => args.effect.kind === 'placeOrMoveInfluence')).toHaveLength(1);
    expect(G.resources.bank).toMatchObject({ DOM: 1, FOR: 1 });
    expect(G.influencesOnBoard).toContainEqual({ id: markerId, owner: '0', starting: true, tileId: grassroots.tileId });

    placeDraw(client);
    influence(client, 'INF-1-1', committee.tileId, otherGrassroots.tileId);
    placeDraw(client);
    expectRejected(client, () => influence(client, markerId, lobbyist.tileId, grassroots.tileId));
    expectRejected(client, () => influence(client, 'INF-0-2', grassroots.tileId, lobbyist.tileId));
  });

  it('requires all starting markers before either kind of Committee can formalize', () => {
    const client = clientWithBoard(G => {
      placeStartingMarkers(G, '1');
      Object.assign(G.players['0'].personal.resources, { DOM: 2, FOR: 1, INF: 1 });
    });
    placeDraw(client);
    expectRejected(client, () => formalize(client, committee.tileId, ['DOM', 'FOR']));
    expectRejected(client, () => formalize(client, 'StartCommittee', ['DOM', 'FOR', 'INF', 'DOM']));
    influence(client, 'INF-0-1', committee.tileId, lobbyist.tileId);
    placeDraw(client);
    influence(client, 'INF-1-4', otherGrassroots.tileId);
    placeDraw(client);
    expectRejected(client, () => formalize(client, committee.tileId, ['DOM', 'DOM']));
    expectRejected(client, () => formalize(client, committee.tileId, ['DOM', 'ECO']));
    formalize(client, committee.tileId, ['DOM', 'FOR']);
    const { G } = client.getState()!;
    expect(G.players['0'].personal.influence).toEqual([{ id: 'INF-0-F1', owner: '0' }]);
    expect(G.players['0'].personal.resources).toEqual({ DOM: 1, FOR: 0, INF: 1 });
    expect(G.resources.bank).toEqual({ DOM: 1, FOR: 1, INF: 0 });
  });

  it.each([
    { numPlayers: 2, addOn56: false, cap: 7 },
    { numPlayers: 5, addOn56: true, cap: 8 },
  ])('uses virtual control and respects the $numPlayers-player cap of $cap markers', ({ numPlayers, addOn56, cap }) => {
    const client = clientWithBoard(G => {
      placeStartingMarkers(G);
      const owned = G.influencesOnBoard!.filter(marker => marker.owner === '0').length;
      G.players['0'].personal.influence.push(...Array.from({ length: cap - owned - 1 }, (_, i) => ({
        id: `INF-0-F${i + 1}`, owner: '0',
      })));
      Object.assign(G.players['0'].personal.resources, { DOM: 2, FOR: 2 });
      G.tiles.drawPile.push('Committee-6', 'Committee-7', 'Committee-8');
      G.tiles.discardFaceUp = G.tiles.discardFaceUp.filter(id => !G.tiles.drawPile.includes(id));
    }, { addOn56 }, numPlayers);
    placeDraw(client);
    const before = client.getState()!.G;
    expect(before.influencesOnBoard!.some(marker => marker.tileId === committee.tileId)).toBe(false);
    expectRejected(client, () => formalize(client, otherGrassroots.tileId, ['DOM', 'FOR']));
    expectRejected(client, () => formalize(client, committee.tileId, ['DOM', 'INF']));
    formalize(client, committee.tileId, ['DOM', 'FOR']);
    const after = client.getState()!.G;
    const owned = [...after.players['0'].personal.influence, ...after.influencesOnBoard!.filter(marker => marker.owner === '0')];
    expect(owned).toHaveLength(cap);
    expect(new Set(owned.map(marker => marker.id)).size).toBe(cap);

    for (let i = 1; i < numPlayers; i++) influence(client, `INF-${i}-1`, placeDraw(client), otherGrassroots.tileId);
    placeDraw(client);
    expectRejected(client, () => formalize(client, committee.tileId, ['DOM', 'FOR']));
  });

  it('formalizes through Start Committee without control or modifiers, at most once per player', () => {
    enableHooks({
      prohibitions: ({ effect }) => effect.kind === 'formalizeInfluence',
      costIncreases: ({ effect }) => effect.kind === 'formalizeInfluence' ? { FOR: 99 } : undefined,
      outputModifiers: ({ effect, amount }) => effect.kind === 'formalizeInfluence' ? 0 : amount,
    });
    const client = clientWithBoard(G => {
      placeStartingMarkers(G);
      Object.assign(G.players['0'].personal.resources, { DOM: 4, FOR: 2, INF: 2 });
    }, { expansions: { exp02: true } });
    placeDraw(client);
    expectRejected(client, () => formalize(client, committee.tileId, ['DOM', 'FOR']));
    expectRejected(client, () => formalize(client, 'StartCommittee', ['DOM', 'FOR', 'INF']));
    expectRejected(client, () => formalize(client, 'StartCommittee', ['DOM', 'DOM', 'FOR', 'FOR']));
    const cost = ['DOM', 'FOR', 'INF', 'DOM'];
    formalize(client, 'StartCommittee', cost);
    const { G } = client.getState()!;
    expect(G.players['0'].usedStartCommittee).toBe(true);
    expect(G.players['1'].usedStartCommittee).toBeUndefined();
    expect(G.players['0'].personal.influence).toEqual([{ id: 'INF-0-F1', owner: '0' }]);
    expect(G.players['0'].personal.resources).toMatchObject({ DOM: 2, FOR: 1, INF: 1 });
    expect(G.resources.bank).toMatchObject({ DOM: 2, FOR: 1, INF: 1 });
    influence(client, 'INF-1-1', placeDraw(client), otherGrassroots.tileId);
    placeDraw(client);
    expectRejected(client, () => formalize(client, 'StartCommittee', cost));
  });

  it('converts active resorts with virtual control and atomically charges additional costs', () => {
    registerExpansion(exp01Economy());
    enableHooks({ costIncreases: ({ effect }) => effect.kind === 'convertResources' ? { FOR: 1 } : undefined });
    const client = clientWithBoard(G => {
      placeStartingMarkers(G);
      Object.assign(G.players['0'].personal.resources, { ECO: 3, DOM: 3, FOR: 1 });
    }, { expansions: { exp01: true, exp02: true } });
    placeDraw(client);
    expectRejected(client, () => convert(client, otherGrassroots.tileId, 'ECO', 'DOM'));
    expectRejected(client, () => convert(client, grassroots.tileId, 'ECO', 'ECO'));
    expectRejected(client, () => convert(client, grassroots.tileId, 'ECO', 'CLM'));
    expectRejected(client, () => convert(client, grassroots.tileId, 'INF', 'DOM'));
    const { G: before } = client.getState()!;
    const choice = { type: 'convertResources', payload: { tileId: grassroots.tileId, input: 'ECO', output: 'DOM' } };
    expect([...politicalMoveOptions(before, '0')]).toContainEqual(choice);
    client.moves.doPoliticalAction(choice);
    const { G } = client.getState()!;
    expect(G.players['0'].personal.resources).toMatchObject({ ECO: 0, DOM: 4, FOR: 0 });
    expect(G.resources.bank).toMatchObject({ ECO: 3, DOM: 0, FOR: 1 });
    influence(client, 'INF-1-1', placeDraw(client), otherGrassroots.tileId);
    placeDraw(client);
    expectRejected(client, () => convert(client, grassroots.tileId, 'DOM', 'ECO'));
  });

  it('treats a paid conversion reduced to zero output as a legal action', () => {
    enableHooks({
      prohibitions: ({ effect }) => effect.kind === 'placeOrMoveInfluence',
      outputModifiers: ({ effect }) => effect.kind === 'convertResources' ? -1 : undefined,
    });
    const client = clientWithBoard(G => {
      placeStartingMarkers(G);
      G.players['0'].personal.resources.DOM = 3;
    }, { expansions: { exp02: true } });
    placeDraw(client);
    expect(client.getState()!.ctx.activePlayers).toEqual({ '0': 'ExactlyOnePoliticalAction' });
    convert(client, grassroots.tileId, 'DOM', 'FOR');
    const { G, ctx } = client.getState()!;
    expect(ctx.currentPlayer).toBe('1');
    expect(G.players['0'].personal.resources).toMatchObject({ DOM: 0, FOR: 0 });
    expect(G.resources.bank).toMatchObject({ DOM: 3, FOR: 0 });
  });

  it('automatically completes a slot when no legal political action is available', () => {
    enableHooks({ prohibitions: ({ effect }) => effect.kind === 'placeOrMoveInfluence' });
    const client = clientWithBoard(undefined, { expansions: { exp02: true } }, 2, []);
    const placed = placeDraw(client);
    const { G, ctx } = client.getState()!;
    expect(ctx.currentPlayer).toBe('1');
    expect(ctx.turn).toBe(2);
    expect(G.tiles.board.some(tile => tile.tileId === placed)).toBe(true);
    expect(G.players['0'].personal.influence).toHaveLength(4);
    expect(G.resources.bank).toEqual({ DOM: 0, FOR: 0, INF: 0, SEC: 0 });
    expect(G.lastTurnHash).toMatch(/^[0-9a-f]{64}$/);
  });

  it('automatically completes an empty additional slot after preserving the played Measure', () => {
    registerExpansion(exp01Economy());
    enableHooks({ prohibitions: ({ effect }) => effect.kind === 'placeOrMoveInfluence' });
    const client = clientWithBoard(G => {
      const measures = G.exp!.exp01!.measures!;
      const [first, second, third] = measures.open;
      measures.hands['0'] = [first!, second!];
      measures.open.fill(null);
      measures.finalDiscard.push(third!, ...measures.drawPile.splice(0));
      measures.playCounts[first!] = 1;
    }, { expansions: { exp01: true, exp02: true } }, 2, []);
    placeDraw(client);
    const measureId = client.getState()!.G.exp!.exp01!.measures!.hands['0'][0];
    client.moves.doPoliticalAction({ type: 'exp01_playMeasure', payload: { measureId } });
    const { G, ctx } = client.getState()!;
    const measures = G.exp!.exp01!.measures!;
    expect(ctx.currentPlayer).toBe('1');
    expect(ctx.turn).toBe(2);
    expect(G.playedMeasureThisRound!['0']).toBe(true);
    expect(measures.hands['0']).toHaveLength(1);
    expect(measures.finalDiscard).toContain(measureId);
  });
});
