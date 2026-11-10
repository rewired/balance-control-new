import { Client } from 'boardgame.io/client';
import { createExpansionRegistry, createResolver, type EffectDescriptor } from '@bc/rules';
import { describe, expect, it } from 'vitest';
import { createBCGame } from './factory.js';
import { engineMoveOptions } from './legal-options.js';

const configurations = Array.from({ length: 8 }, (_, index) => ({
  exp01: Boolean(index & 1), exp02: Boolean(index & 2), exp03: Boolean(index & 4),
}));
const endHashes = [
  '1f1ef475015e496f4dcc5609e286c301fb844ba5fc78b4c95a9c449ca6d6d25d',
  '2b908276a7d958c0a1bde51af130c8098ef48d40aaf48b6aec4fe61f28b8711e',
  '7cf7585b9b83ce575bc67cc20ebd4df3924a53f4ad99d364ecc90e8443700854',
  '56696fb43d9e897de3561514963906839b8e5e317a568f689a9b95cb53a5dde6',
  'ad8b0cfdf38dfd221258e1f069da49ffc002e5138cc4cd6028404d2fc09583fe',
  'a1af93dd2e014bfa11dd0b3f0a7a5789dbb57e5280ae9be73e8a5562f9a5d707',
  '2c3a710360c8b7712f1810ced8644fc27fad8a1ceb3501bc427c2c179bbd6a70',
  '2b09501b4156401b814f163fbfb5961218956b3a9e3ad06827f284660050c212',
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
