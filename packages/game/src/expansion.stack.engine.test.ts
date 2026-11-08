import { Client } from 'boardgame.io/client';
import { createExpansionRegistry, createResolver, type EffectDescriptor } from '@bc/rules';
import { describe, expect, it } from 'vitest';
import { createBCGame } from './factory.js';
import { engineMoveOptions } from './legal-options.js';

const configurations = Array.from({ length: 8 }, (_, index) => ({
  exp01: Boolean(index & 1), exp02: Boolean(index & 2), exp03: Boolean(index & 4),
}));
const endHashes = [
  '9b7d3d3487997031ece3cfcb7eaf1096cc92b06262dea7effe1a6fe516a0c879',
  '298921034ea688d47f086e77f2ef0ad797d08725aa12743d936297a7b53c1194',
  '0c97de169c8bded7443809ad6314ef94432dd3288978701b65d859a3770c3591',
  'e0176c9a4746c9327f18b8df495e5a95eb59ef0b03daeca02aee052b68a0eb3e',
  'f4efd14fc7b60612db00798db76d52da9aabd4a20afb4dc7e9216fa59ded90de',
  '98b02f37c4e131cd42fb0f669257df74e5d7c5213d63aca84257c76e1ca73905',
  '50282a5d58558239289d091d5a1274750a51478e562682b5c84a2bcd73d72f4b',
  'c3e9a866acce89d513b163c5072eddb9b139f446bee5766bcf9f49d799cb2f84',
];
const tied = { tileId: 'DOM-W5-1', coord: { q: 1, r: 0 } };
const blocked = { tileId: 'FOR-W5-1', coord: { q: 2, r: 0 } };
const costed = { tileId: 'INF-W1-1', coord: { q: 0, r: 1 } };
const empty = { tileId: 'INF-W2-1', coord: { q: 0, r: -1 } };
type Instance = Extract<EffectDescriptor, { kind: 'registerMeasureEffect' }>['instance'];

function replay(expansions: (typeof configurations)[number]) {
  const { exp01, exp02, exp03 } = expansions;
  const game = createBCGame({ matchSeed: '0030-expansion-stack', expansions });
  const setup = game.setup!;
  game.setup = (context, data) => {
    const G = setup(context, data);
    const board = [tied, blocked, costed, empty];
    const draw = ['Committee-7', 'Committee-8'];
    G.exp.core.tiles.discardFaceUp = G.exp.core.tiles.drawPile.filter(id => !draw.includes(id) && !board.some(tile => tile.tileId === id));
    G.exp.core.tiles.drawPile = draw;
    G.exp.core.tiles.board.push(...board);
    G.exp.core.influencesOnBoard = [['0', tied.tileId], ['1', tied.tileId], ['0', blocked.tileId]].map(([owner, tileId]) => ({
      ...G.exp.core.players[owner].personal.influence.shift()!, tileId,
    }));
    Object.assign(G.exp.core.players['0'].personal.resources, { FOR: 4, DOM: 1, ...(exp03 ? { CLM: 1 } : {}) });

    const resolve = createResolver();
    const register = (instance: Instance) => expect(resolve(G, { kind: 'registerMeasureEffect', instance }).ok).toBe(true);
    if (exp01) {
      register({ sourceCardId: 'ECO_M02', owner: '1', playNumber: 1, targetTileId: tied.tileId, duration: 'thisRound' });
      register({ sourceCardId: 'ECO_M04', owner: '1', playNumber: 1, targetTileId: tied.tileId, duration: 'thisRound' });
      register({ sourceCardId: 'ECO_M06', owner: '1', playNumber: 1, targetPlayerID: '0', duration: 'untilConsumed' });
    }
    if (exp02) {
      const zones = G.exp!.exp02!.regulations!;
      zones.attached.push(
        { id: 'reg-1', kind: 'Administration', tileId: costed.tileId },
        { id: 'reg-2', kind: 'SecurityLevel', tileId: tied.tileId },
        { id: 'reg-3', kind: 'SecurityLevel', tileId: tied.tileId },
        { id: 'reg-4', kind: 'Blockade', tileId: blocked.tileId },
      );
      zones.serial = 4;
      register({ sourceCardId: 'SEC_M14', owner: '1', playNumber: 1, targetTileId: costed.tileId,
        targetRegulationId: 'reg-1', duration: 'thisRound' });
    }
    if (exp03) {
      register({ sourceCardId: 'CLM_M01', owner: '1', playNumber: 1, targetTileId: costed.tileId, duration: 'ownerNextTurn' });
      register({ sourceCardId: 'CLM_M02', owner: '0', playNumber: 1, targetResort: 'INF', duration: 'throughNextRound' });
      if (exp01) {
        const deck = G.exp!.exp03!.measures!;
        const slot = deck.open.indexOf('CLM_M11');
        if (slot >= 0) deck.open[slot] = null;
        else deck.drawPile.splice(deck.drawPile.indexOf('CLM_M11'), 1);
        deck.hands['1'].push('CLM_M11');
        Object.assign(G.exp.core.players['1'].personal.resources, { CLM: 1, ECO: 1 });
      }
    }
    return G;
  };
  const client = Client({ game, numPlayers: 2 });
  client.moves.placeTile({ q: -1, r: 0 });
  const before = client.getState()!;
  const markerId = before.G.exp.core.players['0'].personal.influence[0].id;
  const options = engineMoveOptions(before.G, before.ctx, '0');
  expect(options.some(option => option.contextTile === blocked.tileId)).toBe(!exp02);
  if (exp02) {
    client.moves.doPoliticalAction({ type: 'placeOrMoveInfluence', payload: { markerId, targetTileId: blocked.tileId } });
    expect(client.getState()!._stateID).toBe(before._stateID);
    expect(client.getState()!.G).toEqual(before.G);
  }

  const surcharges = {
    ...(exp01 ? { 'ECO_M06:1': 'FOR' } : {}),
    ...(exp02 ? { 'reg-1:0': 'FOR', 'reg-1:1': 'FOR' } : {}),
    ...(exp03 ? { 'CLM_M01:1': 'DOM', 'CLM_M02:1': 'CLM' } : {}),
  };
  const parameters = [{
    type: 'placeOrMoveInfluence', payload: {
      markerId, targetTileId: costed.tileId,
      ...(Object.keys(surcharges).length ? { payment: { surcharges } } : {}),
    },
  }];
  const quote = options.find(option => JSON.stringify(option.parameters) === JSON.stringify(parameters));
  const forCost = Number(exp01) + (exp02 ? 2 : 0);
  expect(quote).toMatchObject({
    contextTile: costed.tileId, costBreakdown: [
      ...(forCost ? [{ playerID: '0', resource: 'FOR', amount: forCost }] : []),
      ...(exp03 ? [{ playerID: '0', resource: 'DOM', amount: 1 }, { playerID: '0', resource: 'CLM', amount: 1 }] : []),
    ],
  });
  client.moves.doPoliticalAction(...parameters);
  const paid = client.getState()!;
  expect(paid.ctx.currentPlayer).toBe('1');
  expect(paid.G.exp.core.resources.bank).toMatchObject({ FOR: forCost, DOM: Number(exp03), ...(exp03 ? { CLM: 1 } : {}) });
  expect(paid.G.exp.core.activeMeasureEffects?.some(effect => effect.sourceCardId === 'ECO_M06') ?? false).toBe(false);
  client.moves.placeTile({ q: -2, r: 0 });
  if (exp01 && exp03) {
    client.moves.doPoliticalAction({ type: 'exp03_playMeasure', payload: { measureId: 'CLM_M11', targetPlayerID: '0' } });
    expect(client.getState()!.ctx.activePlayers).toEqual({ '1': 'AdditionalPoliticalAction' });
  }
  client.moves.doPoliticalAction({
    type: 'placeOrMoveInfluence', payload: { markerId: 'INF-1-2', targetTileId: 'Committee-8' },
  });
  return client.getState()!;
}

describe('Cross-expansion cost and Settlement matrix through boardgame.io', () => {
  it.each(configurations)('resolves CORE with exp01=$exp01 exp02=$exp02 exp03=$exp03', expansions => {
    const { G, ctx } = replay(expansions);
    const { exp01, exp02, exp03 } = expansions;
    expect(ctx.gameover).toBeDefined();
    // CORE-01-06-16/-16A: apply doubling and reductions before tied shares and the receipt cap.
    const output = (exp01 ? 9 : 5) - (exp02 ? 2 : 0);
    const share = Math.floor(output / 2);
    expect(G.exp.core.players['0'].personal.resources).toMatchObject({
      DOM: Number(!exp03) + (exp01 && exp03 ? 1 : share),
      FOR: 4 - Number(exp01) - (exp02 ? 2 : 0) + (exp02 ? 0 : exp01 && exp03 ? 1 : 5), INF: 1,
    });
    expect(G.exp.core.players['1'].personal.resources).toMatchObject({ DOM: share, FOR: 0, INF: 0 });
    expect(G.exp.core.resources.noise).toMatchObject({ DOM: 1, FOR: 0, INF: 0 });
    const activeIds = Object.entries(expansions).filter(([, enabled]) => enabled).map(([id]) => id);
    expect(createExpansionRegistry(G.cfg.expansions).map(module => module.id)).toEqual(['core', ...activeIds]);
    expect(Object.keys(G.exp)).toEqual(['core', ...activeIds]);
    expect(G.exp?.exp02?.regulations !== undefined).toBe(exp02);
    expect(G.exp.core.activeMeasureEffects?.every(instance => instance.sourceCardId.startsWith('CLM_')) ?? true).toBe(true);
    expect(JSON.stringify(G)).not.toMatch(/countdown/i);
    const expected = endHashes[configurations.indexOf(expansions)];
    expect(G.lastTurnHash).toBe(expected);
    expect(replay(expansions).G.lastTurnHash).toBe(expected);
  });
});
