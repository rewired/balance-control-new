import { describe, it, expect } from 'vitest';
import { computeMajority, getControl } from './majority.js';
import { createResolver } from './effects.js';
import { buildInitialCoreState } from './setup.js';
import type { BoardPlacement } from './types.js';

const resort = { tileId: 'DOM-W3-1', coord: { q: 1, r: 0 } };
const lobbyist = { tileId: 'Lobbyist-1', coord: { q: 2, r: 0 } };
const neighboringLobbyist = { tileId: 'Lobbyist-2', coord: { q: 2, r: -1 } };

function stateWithTiles(...placements: BoardPlacement[]) {
  const G = buildInitialCoreState(2, 'majority');
  G.tiles.board.push(...placements);
  G.tiles.drawPile = G.tiles.drawPile.filter(id => !placements.some(placement => placement.tileId === id));
  return G;
}

describe('Canonical majority (CORE-01-05)', () => {
  it('reports positive tied leaders without assigning control', () => {
    const G = stateWithTiles(resort);
    G.influencesOnBoard = [
      { tileId: resort.tileId, owner: '0', id: 'test-1' },
      { tileId: resort.tileId, owner: '1', id: 'test-2' },
    ];
    expect(computeMajority(G, resort.coord, 'details')).toEqual({
      controller: null, leaders: ['0', '1'], scores: { '0': 1, '1': 1 },
    });
  });

  it('T01: awards the bonus only to the controller of a contested Lobbyist', () => {
    const G = stateWithTiles(resort, lobbyist);
    G.influencesOnBoard = [
      { tileId: resort.tileId, owner: '0', id: 'test-3' },
      { tileId: resort.tileId, owner: '1', id: 'test-4' },
      { tileId: lobbyist.tileId, owner: '0', id: 'test-5' },
      { tileId: lobbyist.tileId, owner: '0', id: 'test-6' },
      { tileId: lobbyist.tileId, owner: '1', id: 'test-7' },
    ];
    expect(computeMajority(G, resort.coord)).toBe('0');
    expect(computeMajority(G, resort.coord, 'details')).toEqual({
      controller: '0', leaders: ['0'], scores: { '0': 2, '1': 1 },
    });
  });

  it('T02: Start Committee stays uncontrolled beside a controlled Lobbyist', () => {
    const G = stateWithTiles({ ...lobbyist, coord: { q: 1, r: 0 } });
    G.influencesOnBoard = [{ tileId: lobbyist.tileId, owner: '0', id: 'test-8' }];
    expect(getControl(G, { q: 1, r: 0 })).toBe('0');
    expect(getControl(G, { q: 0, r: 0 })).toBeNull();
    expect(computeMajority(G, { q: 0, r: 0 }, 'details')).toEqual({
      controller: null, leaders: [], scores: { '0': 0, '1': 0 },
    });
  });

  it('neither gives bonuses to a Lobbyist nor receives bonuses from a tied Lobbyist', () => {
    const G = stateWithTiles(resort, lobbyist, neighboringLobbyist);
    G.influencesOnBoard = [
      { tileId: lobbyist.tileId, owner: '0', id: 'test-9' },
      { tileId: lobbyist.tileId, owner: '1', id: 'test-10' },
      { tileId: neighboringLobbyist.tileId, owner: '0', id: 'test-11' },
    ];
    expect(getControl(G, lobbyist.coord)).toBeNull();
    expect(computeMajority(G, resort.coord, 'details')).toEqual({
      controller: '0', leaders: ['0'], scores: { '0': 1, '1': 0 },
    });
  });

  it('grants control of empty Committees and Grassroots through stacking virtual bonuses', () => {
    const committee = { tileId: 'Committee-1', coord: { q: 1, r: 0 } };
    const grassroots = { tileId: 'Grassroots-1', coord: { q: 3, r: -1 } };
    const G = stateWithTiles(committee, grassroots, lobbyist, neighboringLobbyist);
    const place = (targetTileId: string) => createResolver()(G, {
      kind: 'placeOrMoveInfluence', playerID: '0', targetTileId, markerId: G.players['0'].personal.influence[0].id,
    });

    expect(getControl(G, committee.coord)).toBeNull();
    expect(place(lobbyist.tileId).ok).toBe(true);
    expect(getControl(G, committee.coord)).toBe('0');
    expect(place(neighboringLobbyist.tileId).ok).toBe(true);
    const markers = structuredClone(G.influencesOnBoard);
    for (const { coord } of [committee, grassroots]) {
      expect(getControl(G, coord)).toBe('0');
      expect(computeMajority(G, coord, 'details').scores).toEqual({ '0': 2, '1': 0 });
    }
    expect(G.influencesOnBoard).toEqual(markers);
    expect(G.players['0'].personal.influence).toHaveLength(2);
  });
});
