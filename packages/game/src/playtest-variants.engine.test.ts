import { Client } from 'boardgame.io/client';
import { getControl, type BoardPlacement, type CoreState, type MatchConfigInput } from '@bc/rules';
import { describe, expect, it } from 'vitest';
import { createBCGame } from './factory.js';
import { engineMoveOptions } from './legal-options.js';

const committee = { tileId: 'Committee-1', coord: { q: 1, r: 0 } };
const secondCommittee = { tileId: 'Committee-2', coord: { q: 2, r: 0 } };
const producer = { tileId: 'SEC-W1-1', coord: { q: 1, r: -1 } };

function withBoard(config: MatchConfigInput, prepare: (G: CoreState) => BoardPlacement[], numPlayers = 2, draws = 5) {
  const game = createBCGame({ matchSeed: 'balance-variants', ...config });
  const setup = game.setup!;
  game.setup = (context, data) => {
    const G = setup(context, data);
    const board = prepare(G);
    const tiles = G.exp.core.tiles;
    tiles.board.push(...board);
    const remaining = tiles.drawPile.filter(id => !board.some(site => site.tileId === id));
    tiles.drawPile = remaining.filter(id => id.startsWith('Committee-')).slice(0, draws);
    tiles.discardFaceUp = remaining.filter(id => !tiles.drawPile.includes(id));
    return G;
  };
  return Client({ game, numPlayers });
}

type TestClient = ReturnType<typeof withBoard>;

function place(client: TestClient): string {
  const draw = client.getState()!.G.exp.core.tiles.drawResolution!;
  client.moves.placeTile(draw.legalCoords[0]);
  return draw.tileId;
}

function act(client: TestClient, type: string, payload: object): void {
  client.moves.doPoliticalAction({ type, payload });
}

function moveMarker(client: TestClient, targetTileId: string): void {
  const { G, ctx } = client.getState()!;
  const marker = G.exp.core.players[ctx.currentPlayer].personal.influence[0];
  const boardMarker = G.exp.core.influencesOnBoard?.find(item => item.owner === ctx.currentPlayer && item.tileId !== targetTileId);
  act(client, 'placeOrMoveInfluence', marker ? { markerId: marker.id, targetTileId }
    : { markerId: boardMarker!.id, sourceTileId: boardMarker!.tileId, targetTileId });
}

function onBoard(G: CoreState, id: string, tileId: string): string {
  const marker = G.exp.core.players[id].personal.influence.shift()!;
  (G.exp.core.influencesOnBoard ??= []).push({ ...marker, tileId });
  return marker.id;
}

describe('optional balancing playtests through boardgame.io', () => {
  it.each([false, true])('caps stocks only after regular or final Settlement (final=%s)', final => {
    const client = withBoard({
      expansions: { exp02: true }, variants: { resourceCap: true, securityProduction: true },
    }, G => {
      expect(G.exp.core.allTiles[producer.tileId]).toMatchObject({ kind: 'ResortTile', resort: 'SEC', w: 1 });
      onBoard(G, '0', producer.tileId);
      G.exp.core.players['0'].personal.resources.SEC = 12;
      G.exp.core.players['1'].personal.resources.DOM = 15;
      Object.assign(G.exp.core.resources.bank, { SEC: 3, DOM: 2 });
      return [producer];
    }, 2, final ? 2 : 5);
    moveMarker(client, place(client));
    expect(client.getState()!.G.exp.core.players['1'].personal.resources.DOM).toBe(15);
    moveMarker(client, place(client));
    const { G, ctx } = client.getState()!;
    expect(Boolean(ctx.gameover)).toBe(final);
    expect(G.exp.core.players['0'].personal.resources.SEC).toBe(12);
    expect(G.exp.core.players['1'].personal.resources.DOM).toBe(12);
    expect(G.exp.core.resources.bank).toMatchObject({ SEC: 2, DOM: 2 });
    expect(G.exp.core.resources.noise).toMatchObject({ SEC: 1, DOM: 3 });
  });

  it('omits SEC production and Challenge when EXP-02 is disabled', () => {
    const client = withBoard({ variants: { securityProduction: true, committeeChallenge: true } }, () => []);
    const { G } = client.getState()!;
    expect(G.exp.exp02).toBeUndefined();
    expect(G.exp.core.allTiles[producer.tileId]).toBeUndefined();
    expect(G.exp.core.players['0'].personal.resources).not.toHaveProperty('SEC');
    place(client);
    const state = client.getState()!;
    expect(engineMoveOptions(state.G, state.ctx, '0').some(option =>
      (option.parameters[0] as { type?: string }).type === 'challengeInfluence')).toBe(false);
  });

  it('suspends one Committee marker through its owner’s turn and preserves real Board influence', () => {
    let target = '';
    const client = withBoard({ expansions: { exp02: true }, variants: { committeeChallenge: true } }, G => {
      target = onBoard(G, '2', committee.tileId);
      for (const player of Object.values(G.exp.core.players)) {
        while (player.personal.influence.length) onBoard(G, player.id, secondCommittee.tileId);
      }
      G.exp.core.players['0'].personal.resources.SEC = 2;
      Object.assign(G.exp.core.players['2'].personal.resources, { DOM: 1, FOR: 1 });
      return [committee, secondCommittee];
    }, 3);
    place(client);
    const before = client.getState()!;
    expect(getControl(before.G, committee.coord)).toBe('2');
    const quote = engineMoveOptions(before.G, before.ctx, '0').find(option =>
      (option.parameters[0] as { type?: string }).type === 'challengeInfluence');
    expect(quote).toMatchObject({
      contextTile: committee.tileId, costBreakdown: [{ playerID: '0', resource: 'SEC', amount: 2 }],
    });
    act(client, 'challengeInfluence', { markerId: target });
    const after = client.getState()!;
    expect(after.G.exp.core.influencesOnBoard?.find(marker => marker.id === target)).toMatchObject({
      owner: '2', tileId: committee.tileId, challengedAt: committee.tileId,
    });
    expect(after.G.exp.core.resources.bank.SEC).toBe(2);
    expect(getControl(after.G, committee.coord)).toBeNull();
    moveMarker(client, place(client));
    const nextTile = place(client);
    const victim = client.getState()!;
    act(client, 'formalizeInfluence', { tileId: committee.tileId, resources: ['DOM', 'FOR'] });
    expect(client.getState()!._stateID).toBe(victim._stateID);
    const marker = victim.G.exp.core.influencesOnBoard!.find(item => item.owner === '2' && item.id !== target)!;
    act(client, 'placeOrMoveInfluence', { markerId: marker.id, sourceTileId: marker.tileId, targetTileId: nextTile });
    expect(getControl(client.getState()!.G, committee.coord)).toBe('2');
    expect(client.getState()!.G.exp.core.influencesOnBoard?.find(item => item.id === target)?.challengedAt).toBeUndefined();
  });

  it('assigns reproducible Grassroots profiles and shares one Efficient exchange across players per round', () => {
    const config = { variants: { variableGrassroots: true } } as const;
    let efficient = '', bulk = '';
    const prepare = (G: CoreState): BoardPlacement[] => {
      const grass = Object.values(G.exp.core.allTiles).filter(tile => tile.kind === 'Grassroots');
      efficient = grass.find(tile => tile.kind === 'Grassroots' && tile.grassrootsRate === 'efficient')!.id;
      bulk = grass.find(tile => tile.kind === 'Grassroots' && tile.grassrootsRate === 'bulk')!.id;
      for (const player of Object.values(G.exp.core.players)) {
        while (player.personal.influence.length) onBoard(G, player.id, player.id === '0' ? committee.tileId : secondCommittee.tileId);
      }
      G.exp.core.players['0'].personal.resources.INF = 5;
      G.exp.core.players['1'].personal.resources.INF = 4;
      return [committee, secondCommittee, { tileId: efficient, coord: { q: 1, r: -1 } }, { tileId: bulk, coord: { q: 0, r: -1 } }];
    };
    const client = withBoard(config, prepare);
    expect(withBoard(config, prepare).getState()!.G.exp.core.allTiles).toEqual(client.getState()!.G.exp.core.allTiles);
    place(client);
    const before = client.getState()!;
    const trade = (tileId: string) => ({ tileId, input: 'INF', output: 'DOM' });
    const formalize = (tileId: string) => ({ tileId: committee.tileId, resources: ['DOM', 'INF'], conversion: trade(tileId) });
    act(client, 'formalizeInfluence', formalize(bulk));
    expect(client.getState()!._stateID).toBe(before._stateID);
    act(client, 'formalizeInfluence', formalize(efficient));
    const used = client.getState()!;
    expect(used.G.exp.core.usedEfficientGrassroots).toEqual([efficient]);
    expect(used.G.exp.core.players['0'].personal.resources.INF).toBe(2);
    place(client);
    const other = client.getState()!;
    act(client, 'convertResources', trade(efficient));
    expect(client.getState()!._stateID).toBe(other._stateID);
    act(client, 'convertResources', trade(bulk));
    const settled = client.getState()!;
    expect(settled.G.exp.core.players['1'].personal.resources).toMatchObject({ INF: 0, DOM: 2 });
    expect(settled.G.exp.core.usedEfficientGrassroots).toBeUndefined();
    place(client);
    act(client, 'convertResources', trade(efficient));
    expect(client.getState()!.G.exp.core.players['0'].personal.resources).toMatchObject({ INF: 0, DOM: 1 });
  });
});
