import { Client } from 'boardgame.io/client';
import { exp01Economy } from '@bc/exp-01-economy';
import { exp03Climate } from '@bc/exp-03-climate';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  __resetRegisteredExpansionsForTest, createResolver, ensureExpansionSlice, politicalMoveOptions, registerExpansion,
  type BoardPlacement, type CoreState, type CostIncreasesArgs, type ExpansionHooks, type PaymentSelection,
} from '@bc/rules';
import { createBCGame } from './factory.js';
import { checkStartCommitteeFormalization } from './index.js';
import { engineMoveOptions } from './legal-options.js';

const committee = { tileId: 'Committee-1', coord: { q: 1, r: 0 } };
const lobbyist = { tileId: 'Lobbyist-1', coord: { q: 2, r: 0 } };
const grassroots = { tileId: 'Grassroots-1', coord: { q: 3, r: 0 } };
const otherGrassroots = { tileId: 'Grassroots-2', coord: { q: 0, r: -1 } };
const nearbyGrassroots = { tileId: 'Grassroots-3', coord: { q: 1, r: -1 } };
const threeSteps = { tileId: 'DOM-W3-1', coord: { q: 3, r: 1 } };
const fourSteps = { tileId: 'DOM-W5-1', coord: { q: 4, r: 1 } };
const draw = ['Committee-2', 'Committee-3', 'Committee-4', 'Committee-5'];

function clientWithBoard(
  setupFixture: (G: CoreState) => void = () => {},
  config: unknown = {},
  numPlayers = 2,
  board: BoardPlacement[] = [committee, lobbyist, grassroots, otherGrassroots],
  rules: Parameters<typeof createBCGame>[1] = 'current',
) {
  const game = createBCGame(config, rules);
  const setup = game.setup!;
  game.setup = (context, data) => {
    const G = setup(context, data);
    G.exp.core.tiles.board.push(...board);
    G.exp.core.tiles.discardFaceUp = G.exp.core.tiles.drawPile.filter(id => !draw.includes(id) && !board.some(p => p.tileId === id));
    G.exp.core.tiles.drawPile = [...draw];
    setupFixture(G);
    return G;
  };
  return Client({ game, numPlayers });
}

type TestClient = ReturnType<typeof clientWithBoard>;

function placeDraw(client: TestClient): string {
  const offer = client.getState()!.G.exp.core.tiles.drawResolution!;
  client.moves.placeTile(offer.legalCoords[0]);
  return offer.tileId;
}

function influence(client: TestClient, markerId: string, targetTileId: string, sourceTileId?: string, resources?: string[]): void {
  client.moves.doPoliticalAction({ type: 'placeOrMoveInfluence', payload: { markerId, targetTileId, sourceTileId, resources } });
}

function formalize(client: TestClient, tileId: string, resources: string[], payment?: PaymentSelection): void {
  client.moves.doPoliticalAction({ type: 'formalizeInfluence', payload: { tileId, resources, ...(payment ? { payment } : {}) } });
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
  G.exp.core.influencesOnBoard = Object.values(G.exp.core.players).flatMap(player => {
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
    const client = clientWithBoard(G => { G.exp.core.players['0'].personal.resources.DOM = 1; });
    const chosen = client.getState()!.G.exp.core.players['0'].personal.influence[1];
    const opponent = client.getState()!.G.exp.core.players['1'].personal.influence[0];
    placeDraw(client);
    expectRejected(client, () => client.moves.doPoliticalAction({ type: 'chooseNoop' }));
    expectRejected(client, () => influence(client, opponent.id, committee.tileId));
    expectRejected(client, () => influence(client, chosen.id, 'StartCommittee'));
    expectRejected(client, () => influence(client, chosen.id, 'Committee-3'));
    influence(client, chosen.id, committee.tileId);
    expect(client.getState()!.G.exp.core.influencesOnBoard).toEqual([{ ...chosen, tileId: committee.tileId }]);
    expect(client.getState()!.G.exp.core.players['0'].personal.influence).not.toContainEqual(chosen);

    placeDraw(client);
    influence(client, opponent.id, grassroots.tileId);
    placeDraw(client);
    expectRejected(client, () => influence(client, opponent.id, committee.tileId, grassroots.tileId));
    expectRejected(client, () => influence(client, chosen.id, committee.tileId, committee.tileId));
    expectRejected(client, () => influence(client, chosen.id, 'StartCommittee', committee.tileId));
    expectRejected(client, () => influence(client, chosen.id, grassroots.tileId));
    expectRejected(client, () => influence(client, chosen.id, grassroots.tileId, lobbyist.tileId));
    influence(client, chosen.id, grassroots.tileId, committee.tileId, ['DOM']);
    expect(client.getState()!.G.exp.core.influencesOnBoard).toEqual([
      { ...chosen, tileId: grassroots.tileId }, { ...opponent, tileId: grassroots.tileId },
    ]);
  });

  // CORE-01-04-12A/-12B: exercise quoted payments and execution through the same public move.
  it.each([
    { target: lobbyist, resources: [], dom: 0, forAmount: 0 },
    { target: otherGrassroots, resources: ['FOR'], dom: 0, forAmount: 1 },
    { target: threeSteps, resources: ['DOM', 'DOM', 'FOR'], dom: 2, forAmount: 1 },
  ])('quotes and charges the exact distance cost to $target.tileId', ({ target, resources, dom, forAmount }) => {
    const client = clientWithBoard(G => {
      const { personal } = G.exp.core.players['0'];
      G.exp.core.influencesOnBoard = [{ ...personal.influence.shift()!, tileId: committee.tileId }];
      Object.assign(personal.resources, { DOM: 3, FOR: 1 });
    }, {}, 2, [committee, lobbyist, grassroots, otherGrassroots, threeSteps, fourSteps]);
    placeDraw(client);
    const { G, ctx } = client.getState()!;
    const marker = G.exp.core.influencesOnBoard![0];
    const payload = { markerId: marker.id, sourceTileId: committee.tileId, targetTileId: target.tileId };
    const options = engineMoveOptions(G, ctx, '0');
    expect(options).toContainEqual(expect.objectContaining({
      moveType: 'doPoliticalAction',
      parameters: [{ type: 'placeOrMoveInfluence', payload: { ...payload, ...(resources.length && { resources }) } }],
      costBreakdown: [
        ...(dom ? [{ playerID: '0', resource: 'DOM', amount: dom }] : []),
        ...(forAmount ? [{ playerID: '0', resource: 'FOR', amount: forAmount }] : []),
      ],
    }));
    expect(options).not.toContainEqual(expect.objectContaining({
      parameters: [{ type: 'placeOrMoveInfluence', payload: expect.objectContaining({
        sourceTileId: committee.tileId, targetTileId: fourSteps.tileId,
      }) }],
    }));
    for (const invalid of [
      { ...payload, targetTileId: fourSteps.tileId, resources: ['DOM', 'DOM', 'DOM'] },
      { ...payload, targetTileId: threeSteps.tileId, resources: ['FOR', 'FOR', 'FOR'] },
      { ...payload, targetTileId: threeSteps.tileId, resources: ['DOM', 'DOM', 'SEC'] },
      { ...payload, targetTileId: threeSteps.tileId, resources: ['DOM'] },
    ]) {
      expectRejected(client, () => client.moves.doPoliticalAction({ type: 'placeOrMoveInfluence', payload: invalid }));
    }
    client.moves.doPoliticalAction({ type: 'placeOrMoveInfluence', payload: { ...payload, ...(resources.length && { resources }) } });
    const after = client.getState()!.G.exp.core;
    expect(after.influencesOnBoard).toEqual([{ ...marker, tileId: target.tileId }]);
    expect(after.players['0'].personal.resources).toMatchObject({ DOM: 3 - dom, FOR: 1 - forAmount });
    expect(after.resources.bank).toMatchObject({ DOM: dom, FOR: forAmount });
  });

  it.each([true, false])('preserves free placement and uses the distance rule for current matches (%s)', influenceDistance => {
    const client = clientWithBoard(G => {
      const { personal } = G.exp.core.players['0'];
      G.exp.core.influencesOnBoard = [{ ...personal.influence.shift()!, tileId: committee.tileId }];
    }, {}, 2, [committee, fourSteps], influenceDistance ? 'current' : 'recorded');
    placeDraw(client);
    const { G } = client.getState()!;
    const marker = G.exp.core.influencesOnBoard![0];
    const supply = G.exp.core.players['0'].personal.influence[0];
    if (influenceDistance) {
      expectRejected(client, () => influence(client, marker.id, fourSteps.tileId, committee.tileId));
      influence(client, supply.id, fourSteps.tileId);
    } else {
      influence(client, marker.id, fourSteps.tileId, committee.tileId);
    }
    expect(client.getState()!.G.exp.core.influencesOnBoard).toContainEqual({
      ...(influenceDistance ? supply : marker), tileId: fourSteps.tileId,
    });
  });

  it.each([false, true])('binds movement costs and prohibitions to the destination (distance pricing %s)', influenceDistance => {
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
      for (const marker of G.exp.core.influencesOnBoard!) {
        if (marker.owner === '0') marker.tileId = committee.tileId;
      }
      Object.assign(G.exp.core.players['0'].personal.resources, { DOM: influenceDistance ? 2 : 1, FOR: 1 });
      if (influenceDistance) G.exp.core.players['1'].personal.resources.FOR = 1;
    }, { expansions: { exp02: true } }, 2, undefined, influenceDistance ? 'current' : 'recorded');
    placeDraw(client);
    const markerId = 'INF-0-1';
    const resources = influenceDistance ? ['DOM'] : undefined;
    costs.mockClear();
    influence(client, markerId, grassroots.tileId, committee.tileId, resources);
    const { G } = client.getState()!;
    expect(costs.mock.calls.filter(([args]) => args.effect.kind === 'placeOrMoveInfluence')).toHaveLength(1);
    expect(G.exp.core.resources.bank).toMatchObject({ DOM: influenceDistance ? 2 : 1, FOR: 1 });
    expect(G.exp.core.influencesOnBoard).toContainEqual({ id: markerId, owner: '0', starting: true, tileId: grassroots.tileId });

    placeDraw(client);
    influence(client, 'INF-1-1', committee.tileId, otherGrassroots.tileId, influenceDistance ? ['FOR'] : undefined);
    placeDraw(client);
    expectRejected(client, () => influence(client, markerId, lobbyist.tileId, grassroots.tileId));
    expectRejected(client, () => influence(client, 'INF-0-2', grassroots.tileId, committee.tileId, resources));
  });

  it('requires all starting markers before either kind of Committee can formalize', () => {
    const client = clientWithBoard(G => {
      placeStartingMarkers(G, '1');
      Object.assign(G.exp.core.players['0'].personal.resources, { DOM: 2, FOR: 1, INF: 1 });
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
    expect(G.exp.core.players['0'].personal.influence).toEqual([{ id: 'INF-0-F1', owner: '0' }]);
    expect(G.exp.core.players['0'].personal.resources).toEqual({ DOM: 1, FOR: 0, INF: 1 });
    expect(G.exp.core.resources.bank).toEqual({ DOM: 1, FOR: 1, INF: 0 });
  });

  it.each([
    { numPlayers: 2, addOn56: false, cap: 7 },
    { numPlayers: 5, addOn56: true, cap: 8 },
  ])('uses virtual control and respects the $numPlayers-player cap of $cap markers', ({ numPlayers, addOn56, cap }) => {
    const client = clientWithBoard(G => {
      placeStartingMarkers(G);
      const owned = G.exp.core.influencesOnBoard!.filter(marker => marker.owner === '0').length;
      G.exp.core.players['0'].personal.influence.push(...Array.from({ length: cap - owned - 1 }, (_, i) => ({
        id: `INF-0-F${i + 1}`, owner: '0',
      })));
      Object.assign(G.exp.core.players['0'].personal.resources, { DOM: 2, FOR: 2 });
      G.exp.core.tiles.drawPile.push('Committee-6', 'Committee-7', 'Committee-8');
      G.exp.core.tiles.discardFaceUp = G.exp.core.tiles.discardFaceUp.filter(id => !G.exp.core.tiles.drawPile.includes(id));
    }, { addOn56 }, numPlayers, [committee, lobbyist, grassroots, otherGrassroots, nearbyGrassroots]);
    placeDraw(client);
    const before = client.getState()!.G;
    expect(before.exp.core.influencesOnBoard!.some(marker => marker.tileId === committee.tileId)).toBe(false);
    expectRejected(client, () => formalize(client, otherGrassroots.tileId, ['DOM', 'FOR']));
    expectRejected(client, () => formalize(client, committee.tileId, ['DOM', 'INF']));
    formalize(client, committee.tileId, ['DOM', 'FOR']);
    const after = client.getState()!.G;
    const owned = [...after.exp.core.players['0'].personal.influence, ...after.exp.core.influencesOnBoard!.filter(marker => marker.owner === '0')];
    expect(owned).toHaveLength(cap);
    expect(new Set(owned.map(marker => marker.id)).size).toBe(cap);

    for (let i = 1; i < numPlayers; i++) {
      placeDraw(client);
      influence(client, `INF-${i}-1`, nearbyGrassroots.tileId, otherGrassroots.tileId);
    }
    placeDraw(client);
    expectRejected(client, () => formalize(client, committee.tileId, ['DOM', 'FOR']));
  });

  it.each([false, true])('requires a single fixed Greenwashing fee for standard formalization only when Climate=%s', climate => {
    if (climate) registerExpansion(exp03Climate());
    const client = clientWithBoard(G => {
      placeStartingMarkers(G);
      Object.assign(G.exp.core.players['0'].personal.resources, { DOM: 2, FOR: 1, INF: 1, ...(climate ? { CLM: 1 } : {}) });
      if (climate) for (const [index, owner] of ['0', '1'].entries()) {
        expect(createResolver()(G, { kind: 'registerMeasureEffect', instance: {
          sourceCardId: 'CLM_M05', owner, playNumber: index + 1, duration: 'ownerNextTurn',
        } }).ok).toBe(true);
      }
    }, { expansions: { exp03: climate } });
    placeDraw(client);
    const { G, ctx } = client.getState()!;
    const options = engineMoveOptions(G, ctx, '0');
    const startOptions = options.filter(option => option.contextTile === 'StartCommittee');
    expect(startOptions.length).toBeGreaterThan(0);
    expect(startOptions.every(option => !JSON.stringify(option.parameters).includes('greenwashing'))).toBe(true);
    expectRejected(client, () => formalize(client, 'StartCommittee', ['DOM', 'FOR', 'INF', 'DOM'], { greenwashing: 'INF' }));
    const resources = ['DOM', 'FOR'];
    const alternatives = options.filter(option => option.contextTile === committee.tileId
      && JSON.stringify(option.parameters).includes('"resources":["DOM","FOR"]'));
    if (climate) {
      expect(alternatives.map(option => option.costBreakdown)).toEqual(['CLM', 'INF'].map(resource => [
        { playerID: '0', resource: 'DOM', amount: 1 }, { playerID: '0', resource: 'FOR', amount: 1 },
        { playerID: '0', resource, amount: 1 },
      ]));
      expectRejected(client, () => formalize(client, committee.tileId, resources));
      formalize(client, committee.tileId, resources, { greenwashing: 'CLM' });
      expect(client.getState()!.G.exp.core.resources.bank).toMatchObject({ DOM: 1, FOR: 1, CLM: 1, INF: 0 });
    } else {
      expect(alternatives).toHaveLength(1);
      expectRejected(client, () => formalize(client, committee.tileId, resources, { greenwashing: 'INF' }));
      formalize(client, committee.tileId, resources);
      expect(client.getState()!.G.exp.core.resources.bank).toEqual({ DOM: 1, FOR: 1, INF: 0 });
    }
    expect(client.getState()!.G.exp.core.players['0'].personal.influence).toEqual([{ id: 'INF-0-F1', owner: '0' }]);
  });

  it('formalizes through Start Committee without control or modifiers, at most once per player', () => {
    enableHooks({
      prohibitions: ({ effect }) => effect.kind === 'formalizeInfluence',
      costIncreases: ({ effect }) => effect.kind === 'formalizeInfluence' ? { FOR: 99 } : undefined,
      outputModifiers: ({ effect, amount }) => effect.kind === 'formalizeInfluence' ? 0 : amount,
    });
    const client = clientWithBoard(G => {
      placeStartingMarkers(G);
      Object.assign(G.exp.core.players['0'].personal.resources, { DOM: 4, FOR: 2, INF: 2 });
    }, { expansions: { exp02: true } });
    placeDraw(client);
    expectRejected(client, () => formalize(client, committee.tileId, ['DOM', 'FOR']));
    expectRejected(client, () => formalize(client, 'StartCommittee', ['DOM', 'FOR', 'INF']));
    expectRejected(client, () => formalize(client, 'StartCommittee', ['DOM', 'DOM', 'FOR', 'FOR']));
    const cost = ['DOM', 'FOR', 'INF', 'DOM'];
    formalize(client, 'StartCommittee', cost);
    const { G } = client.getState()!;
    expect(G.exp.core.players['0'].usedStartCommittee).toBe(true);
    expect(G.exp.core.players['1'].usedStartCommittee).toBeUndefined();
    expect(G.exp.core.players['0'].personal.influence).toEqual([{ id: 'INF-0-F1', owner: '0' }]);
    expect(G.exp.core.players['0'].personal.resources).toMatchObject({ DOM: 2, FOR: 1, INF: 1 });
    expect(G.exp.core.resources.bank).toMatchObject({ DOM: 2, FOR: 1, INF: 1 });
    influence(client, 'INF-1-1', placeDraw(client), otherGrassroots.tileId);
    placeDraw(client);
    expectRejected(client, () => formalize(client, 'StartCommittee', cost));
  });

  it.each([
    { reason: 'starting-influence-unplaced', unplaced: true },
    { reason: 'insufficient', unaffordable: true },
    { reason: 'committee-unavailable', used: true },
    { reason: 'influence-cap', atCap: true },
    { reason: undefined },
  ])('reports Start Committee availability and the cause $reason without spending anything', ({
    reason, unplaced, unaffordable, used, atCap,
  }) => {
    const client = clientWithBoard(G => {
      placeStartingMarkers(G, unplaced ? '1' : undefined);
      const player = G.exp.core.players['0'];
      Object.assign(player.personal.resources, { DOM: 2, FOR: 2, INF: unaffordable ? 0 : 1 });
      if (used) player.usedStartCommittee = true;
      if (atCap) player.personal.influence.push(...[1, 2, 3].map(index => ({ id: `INF-0-F${index}`, owner: '0' })));
    });
    placeDraw(client);
    const { G, ctx } = client.getState()!;
    const before = structuredClone(G);
    const status = checkStartCommitteeFormalization(G, '0', 'StartCommittee');
    const legal = engineMoveOptions(G, ctx, '0').filter(option => option.contextTile === 'StartCommittee');
    expect(status).toEqual(reason ? { ok: false, reason } : { ok: true });
    expect(legal.length > 0).toBe(status.ok);
    expect(G).toEqual(before);
  });

  it('converts active resorts with virtual control and atomically charges additional costs', () => {
    registerExpansion(exp01Economy());
    enableHooks({ costIncreases: ({ effect }) => effect.kind === 'convertResources' ? { FOR: 1 } : undefined });
    const client = clientWithBoard(G => {
      placeStartingMarkers(G);
      Object.assign(G.exp.core.players['0'].personal.resources, { ECO: 3, DOM: 3, FOR: 1 });
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
    expect(G.exp.core.players['0'].personal.resources).toMatchObject({ ECO: 0, DOM: 4, FOR: 0 });
    expect(G.exp.core.resources.bank).toMatchObject({ ECO: 3, DOM: 0, FOR: 1 });
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
      G.exp.core.players['0'].personal.resources.DOM = 3;
    }, { expansions: { exp02: true } });
    placeDraw(client);
    expect(client.getState()!.ctx.activePlayers).toEqual({ '0': 'ExactlyOnePoliticalAction' });
    convert(client, grassroots.tileId, 'DOM', 'FOR');
    const { G, ctx } = client.getState()!;
    expect(ctx.currentPlayer).toBe('1');
    expect(G.exp.core.players['0'].personal.resources).toMatchObject({ DOM: 0, FOR: 0 });
    expect(G.exp.core.resources.bank).toMatchObject({ DOM: 3, FOR: 0 });
  });

  it('automatically completes a slot when no legal political action is available', () => {
    enableHooks({ prohibitions: ({ effect }) => effect.kind === 'placeOrMoveInfluence' });
    const client = clientWithBoard(undefined, { expansions: { exp02: true } }, 2, []);
    const placed = placeDraw(client);
    const { G, ctx } = client.getState()!;
    expect(ctx.currentPlayer).toBe('1');
    expect(ctx.turn).toBe(2);
    expect(G.exp.core.tiles.board.some(tile => tile.tileId === placed)).toBe(true);
    expect(G.exp.core.players['0'].personal.influence).toHaveLength(4);
    expect(G.exp.core.resources.bank).toEqual({ DOM: 0, FOR: 0, INF: 0, SEC: 0 });
    expect(G.lastTurnHash).toMatch(/^[0-9a-f]{64}$/);
  });

  it('automatically completes an empty additional slot after preserving the played Measure', () => {
    registerExpansion({ ...exp01Economy(), measureRules: undefined });
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
    expect(G.exp.core.playedMeasureThisRound!['0']).toBe(true);
    expect(measures.hands['0']).toHaveLength(1);
    expect(measures.finalDiscard).toContain(measureId);
  });
});
