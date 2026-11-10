import { Client } from 'boardgame.io/client';
import { createExpansionRegistry, createResolver, type EffectDescriptor } from '@bc/rules';
import { describe, expect, it } from 'vitest';
import { createBCGame } from './factory.js';
import { engineMoveOptions } from './legal-options.js';

const configurations = Array.from({ length: 8 }, (_, index) => ({
  exp01: Boolean(index & 1), exp02: Boolean(index & 2), exp03: Boolean(index & 4),
}));
const endHashes = [
  '10d5e641cc6e666372b98fcf6da4266116da35585c2c9c9df0f0fd3e7ca9f570',
  'baebc50b045b599184bf613bb4bb3f1d363b5f19f371391677d18bab2dcf46f1',
  '8f1187405b0716b918e674dfeb8c2e09545884e69d9cb19bf9284e9abb021182',
  'c3b71744b366d3e6da5355d248ad10e8a21173bae891aea070b95e074a66eb80',
  '40fb6fd0204ce163f9de7a093d54ee1e001b25db0b3edd33e19fcdd6cce9861a',
  '366ebd81ccba6c571033670dd71d0a7ce8c566b6d801224358c716bfec960975',
  '93efeea77fac7d206b23c4750345546621aec6abe5ec9b71acd5604a393f0629',
  '7adf28a4a5655e4b342f1c7883e1dc7a734a32ef671d685b6c9806686b6a18f7',
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
