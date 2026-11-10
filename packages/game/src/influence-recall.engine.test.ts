import { Client } from 'boardgame.io/client';
import { createResolver, getControl } from '@bc/rules';
import { describe, expect, it } from 'vitest';
import { createBCGame } from './factory.js';
import { engineMoveOptions, hashEngineState, legalMoveOptions } from './legal-options.js';

const target = { tileId: 'Committee-1', coord: { q: 1, r: 0 } };
const alternative = { tileId: 'Committee-2', coord: { q: 2, r: 0 } };
const attackerTile = { tileId: 'DOM-W2-1', coord: { q: 0, r: 1 } };
const resources = ['DOM', 'FOR', 'INF'];

function fixture(legacy = false, blocked = false) {
  const game = createBCGame({
    matchSeed: 'recall',
    expansions: { exp02: blocked },
  }, legacy ? 'recorded' : 'current');
  const originalSetup = game.setup!;
  game.setup = (ctx, setupData) => {
    const G = originalSetup(ctx, setupData);
    const { players, tiles } = G.exp.core;
    const board = [target, alternative, attackerTile];
    const draw = ['Committee-3', 'Committee-4', 'Committee-5', 'Committee-6'];
    tiles.board.push(...board);
    tiles.discardFaceUp = tiles.drawPile.filter(id => !draw.includes(id) && !board.some(site => site.tileId === id));
    tiles.drawPile = draw;
    G.exp.core.influencesOnBoard = [
      ...players['0'].personal.influence.splice(0).map(marker => ({ ...marker, tileId: attackerTile.tileId })),
      ...players['1'].personal.influence.splice(0).map((marker, i) => ({ ...marker, tileId: i ? alternative.tileId : target.tileId })),
    ];
    Object.assign(players['0'].personal.resources, { DOM: 4, FOR: 4, INF: 4 });
    Object.assign(players['1'].personal.resources, { DOM: 1, FOR: 1 });
    if (blocked) G.exp.exp02!.regulations!.attached.push({ id: 'reg-1', kind: 'Blockade', tileId: target.tileId });
    return G;
  };
  const client = Client({ game, numPlayers: 2 });
  const place = () => {
    const draw = client.getState()!.G.exp.core.tiles.drawResolution!;
    client.moves.placeTile(draw.legalCoords[0]);
  };
  const recall = (markerId: string, payment = resources) =>
    client.moves.doPoliticalAction({ type: 'recallInfluence', payload: { markerId, resources: payment } });
  return { game, client, place, recall };
}

describe('InfluenceRecall through boardgame.io', () => {
  it('transfers the real marker atomically and allows a fresh recall in the next round', () => {
    const { game, client, place, recall } = fixture();
    place();
    const before = client.getState()!;
    expect(before.G.cfg.variants.influenceRecall).toBe(true);
    const markerId = 'INF-1-1';
    expect(getControl(before.G, target.coord)).toBe('1');
    recall('INF-0-1');
    recall(markerId, ['DOM', 'DOM', 'FOR']);
    expect(client.getState()!.G).toEqual(before.G);
    const quote = engineMoveOptions(before.G, before.ctx, '0').find(option =>
      option.contextTile === target.tileId && (option.parameters[0] as { type?: string }).type === 'recallInfluence');
    expect(quote?.costBreakdown).toEqual(resources.map(resource => ({ playerID: '0', resource, amount: 1 })));
    const [preview] = legalMoveOptions(game, before, '0', [quote!]);
    recall(markerId);
    const after = client.getState()!;
    expect(hashEngineState(after)).toBe(preview.resultingStateHashPreview);
    expect(after.G.exp.core.players['0'].personal.resources).toMatchObject({ DOM: 3, FOR: 3, INF: 3 });
    expect(after.G.exp.core.players['1'].personal.influence).toContainEqual({
      id: markerId, owner: '1', starting: true, recalled: true,
    });
    expect(after.G.exp.core.influencesOnBoard?.some(marker => marker.id === markerId)).toBe(false);
    expect(getControl(after.G, target.coord)).toBeNull();
    expect(after.G.exp.core.recalledThisRound).toEqual(['0']);
    const snapshot = structuredClone(after.G);
    expect(createResolver()(snapshot, { kind: 'recallInfluence', playerID: '0', markerId: 'INF-1-2', resources }))
      .toEqual({ ok: false, reason: 'recall-unavailable' });

    place();
    client.moves.doPoliticalAction({ type: 'formalizeInfluence', payload: { tileId: alternative.tileId, resources: ['DOM', 'FOR'] } });
    expect(client.getState()!.G.exp.core.players['1'].personal.influence).toHaveLength(2);
    expect(client.getState()!.G.exp.core.recalledThisRound).toBeUndefined();
    place();
    recall('INF-1-2');
    expect(client.getState()!.G.exp.core.recalledThisRound).toEqual(['0']);
  });

  it.each([
    { legacy: true, blocked: false },
    { legacy: false, blocked: true },
  ])('rejects the target when legacy=$legacy and blocked=$blocked', ({ legacy, blocked }) => {
    const { client, place, recall } = fixture(legacy, blocked);
    place();
    const before = client.getState()!;
    expect(engineMoveOptions(before.G, before.ctx, '0').some(option => option.contextTile === target.tileId &&
      (option.parameters[0] as { type?: string }).type === 'recallInfluence')).toBe(false);
    recall('INF-1-1');
    expect(hashEngineState(client.getState()!)).toBe(hashEngineState(before));
  });
});
