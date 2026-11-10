import { Client } from 'boardgame.io/client';
import { createResolver, getControl, type CoreState } from '@bc/rules';
import { describe, expect, it } from 'vitest';
import { createBCGame } from './factory.js';
import { engineMoveOptions, hashEngineState, legalMoveOptions } from './legal-options.js';

const committee = { tileId: 'Committee-1', coord: { q: 1, r: 0 } };
const lobbyist = { tileId: 'Lobbyist-1', coord: { q: 2, r: 0 } };
const base = { tileId: 'Grassroots-1', coord: { q: 0, r: 1 } };
const resort = { tileId: 'DOM-W1-1', coord: { q: 1, r: 1 } };
const otherResort = { tileId: 'FOR-W2-1', coord: { q: 2, r: -1 } };
const tileId = resort.tileId;
const markerId = 'INF-1-1';
const counterLobby = { type: 'counterLobby', payload: { tileId: committee.tileId, lobbyistTileId: lobbyist.tileId, resources: ['DOM', 'DOM'] } };
const displace = { type: 'displaceInfluence', payload: { tileId, markerId, resources: ['DOM', 'DOM'] } };
const damage = { type: 'damageResort', payload: { tileId, resources: ['DOM', 'DOM', 'DOM'] } };

function fixture(disruption = true, prepare?: (G: CoreState) => void, security = false) {
  const game = createBCGame({
    matchSeed: 'disruption-test',
    expansions: { exp02: security },
  }, disruption ? 'current' : 'recorded');
  const setup = game.setup!;
  game.setup = (context, setupData) => {
    const G = setup(context, setupData);
    const { players, tiles } = G.exp.core;
    const board = [committee, lobbyist, base, resort, otherResort];
    const draw = ['Committee-2', 'Committee-3', 'Committee-4', 'Committee-5'];
    tiles.board.push(...board);
    tiles.discardFaceUp = tiles.drawPile.filter(id => !draw.includes(id) && !board.some(site => site.tileId === id));
    tiles.drawPile = draw;
    G.exp.core.influencesOnBoard = [
      ...players['0'].personal.influence.splice(0).map(marker => ({ ...marker, tileId: base.tileId })),
      ...players['1'].personal.influence.splice(0).map((marker, index) => ({ ...marker, tileId: index === 0 ? tileId : lobbyist.tileId })),
    ];
    Object.assign(players['0'].personal.resources, { DOM: 6, FOR: 2 });
    Object.assign(players['1'].personal.resources, { DOM: 1, FOR: 1 });
    prepare?.(G);
    return G;
  };
  const client = Client({ game, numPlayers: 2, playerID: '0' });
  const state = () => client.store.getState();
  const place = () => {
    client.updatePlayerID(state().ctx.currentPlayer);
    client.moves.placeTile(state().G.exp.core.tiles.drawResolution!.legalCoords[0]);
  };
  place();
  return { client, game, state, place };
}

describe('Disruption through boardgame.io', () => {
  it('suppresses a single committee link and expires after the affected player’s turn', () => {
    const { client, game, state, place } = fixture();
    const before = state();
    expect(getControl(before.G, committee.coord)).toBe('1');
    expect(getControl(before.G, otherResort.coord)).toBe('1');
    const quote = engineMoveOptions(before.G, before.ctx, '0').find(option =>
      JSON.stringify(option.parameters[0]) === JSON.stringify(counterLobby));
    expect(quote?.costBreakdown).toEqual([{ playerID: '0', resource: 'DOM', amount: 2 }]);
    const [preview] = legalMoveOptions(game, before, '0', [quote!]);
    client.moves.doPoliticalAction(counterLobby);
    expect(hashEngineState(state())).toBe(preview.resultingStateHashPreview);
    expect(getControl(state().G, committee.coord)).toBeNull();
    expect(getControl(state().G, otherResort.coord)).toBe('1');
    expect(state().G.exp.core.players['0'].personal.resources.DOM).toBe(4);
    place();
    const beforeFormalize = state();
    client.moves.doPoliticalAction({ type: 'formalizeInfluence', payload: { tileId: committee.tileId, resources: ['DOM', 'FOR'] } });
    expect(state()._stateID).toBe(beforeFormalize._stateID);
    client.moves.doPoliticalAction({
      type: 'placeOrMoveInfluence', payload: { markerId, sourceTileId: tileId, targetTileId: base.tileId },
    });
    expect(state().ctx.currentPlayer).toBe('0');
    expect(state().G.exp.core.counterLobbies).toBeUndefined();
    expect(getControl(state().G, committee.coord)).toBe('1');
  });

  it('lets only the owner respond with a legal neighbor and commits one payment', () => {
    const { client, game, state } = fixture(true, G => {
      G.exp.exp02!.regulations!.attached.push({ id: 'blocked', kind: 'Blockade', tileId: committee.tileId });
    }, true);
    const before = state();
    client.moves.doPoliticalAction(displace);
    const pending = state();
    expect(pending.ctx.currentPlayer).toBe('0');
    expect(pending.ctx.activePlayers).toEqual({ '1': 'ChooseDisplacement' });
    expect(pending.G.exp.core.players['0'].personal.resources.DOM).toBe(4);
    expect(engineMoveOptions(pending.G, pending.ctx, '0')).toEqual([]);
    const options = engineMoveOptions(pending.G, pending.ctx, '1');
    expect(options.map(option => option.contextTile)).not.toContain(committee.tileId);
    const quote = options.find(option => option.contextTile === base.tileId)!;
    const [preview] = legalMoveOptions(game, pending, '1', [quote]);
    client.moves.chooseDisplacement(base.tileId);
    expect(state()._stateID).toBe(before._stateID + 1);
    client.updatePlayerID('1');
    client.moves.chooseDisplacement(committee.tileId);
    expect(state()._stateID).toBe(before._stateID + 1);
    client.moves.chooseDisplacement(base.tileId);
    expect(hashEngineState(state())).toBe(preview.resultingStateHashPreview);
    expect(state().G.exp.core.pendingDisplacement).toBeUndefined();
    expect(state().G.exp.core.influencesOnBoard?.find(marker => marker.id === markerId)).toEqual({
      id: markerId, owner: '1', starting: true, tileId: base.tileId,
    });
    expect(state().G.exp.core.players['1'].personal.influence).toEqual([]);
    expect(state().G.exp.core.displacedThisRound).toEqual(['0']);
    expect(state().ctx.currentPlayer).toBe('1');
  });

  it('applies permanent damage to production, respects the floor and limits each player to one use', () => {
    const { client, state } = fixture();
    const before = state().G;
    client.moves.doPoliticalAction(damage);
    const after = structuredClone(state().G);
    expect(after.exp.core.players['0'].personal.resources.DOM).toBe(3);
    expect(after.exp.core.damagedResorts).toEqual([{ tileId, playerID: '0' }]);
    const resolve = createResolver();
    expect(resolve(after, {
      kind: 'damageResort', playerID: '0', tileId: otherResort.tileId, resources: ['DOM', 'DOM', 'DOM'],
    }).ok).toBe(false);
    expect(resolve(after, { kind: 'applyProductionAt', coord: resort.coord }).ok).toBe(true);
    expect(after.exp.core.players['1'].personal.resources.DOM).toBe(before.exp.core.players['1'].personal.resources.DOM);
    expect(getControl(after, resort.coord)).toBe('1');
  });

  it('rejects unpaid and disabled actions without creating variant state', () => {
    const disabled = fixture(false);
    const before = disabled.state();
    for (const action of [counterLobby, displace, damage]) {
      expect(engineMoveOptions(before.G, before.ctx, '0').some(option =>
        (option.parameters[0] as { type?: string }).type === action.type)).toBe(false);
      disabled.client.moves.doPoliticalAction(action);
      expect(hashEngineState(disabled.state())).toBe(hashEngineState(before));
    }
    const unpaid = fixture(true, G => { G.exp.core.players['0'].personal.resources.DOM = 1; });
    const unspent = unpaid.state();
    for (const action of [counterLobby, displace, damage]) {
      unpaid.client.moves.doPoliticalAction(action);
      expect(hashEngineState(unpaid.state())).toBe(hashEngineState(unspent));
    }
  });
});
