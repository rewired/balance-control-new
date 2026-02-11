import { describe, it, expect } from 'vitest';
import { computeMajority } from './majority.js';
import type { CoreState, Tile } from './types.js';

function baseState(): CoreState {
  const start: Tile = { id: 'StartCommittee', kind: 'StartCommittee' } as const;
  const dom1: Tile = { id: 'DOM-W1-1', kind: 'ResortTile', resort: 'DOM', w: 1 } as const;
  const lobby1: Tile = { id: 'Lobbyist-1', kind: 'Lobbyist' } as any;
  const lobby2: Tile = { id: 'Lobbyist-2', kind: 'Lobbyist' } as any;
  const allTiles: Record<string, Tile> = {
    [start.id]: start,
    [dom1.id]: dom1,
    [lobby1.id]: lobby1,
    [lobby2.id]: lobby2,
  };
  return {
    matchSeed: 's',
    tiles: {
      drawPile: [],
      discardFaceUp: [],
      board: [
        { tileId: start.id, coord: { q: 0, r: 0 } },
        { tileId: dom1.id, coord: { q: 1, r: 0 } },
        { tileId: lobby1.id, coord: { q: 2, r: 0 } },
        { tileId: lobby2.id, coord: { q: 1, r: -1 } },
      ],
    },
    allTiles,
    players: {
      '0': { id: '0', personal: { resources: [], influence: [] } },
      '1': { id: '1', personal: { resources: [], influence: [] } },
    },
    resources: { bank: [], noise: [] },
    influencesOnBoard: [],
  };
}

describe('computeMajority — CORE-01-05', () => {
  it('simple majority (no lobbyists)', () => {
    const G = baseState();
    G.influencesOnBoard = [
      { tileId: 'DOM-W1-1', owner: '0', count: 2 },
      { tileId: 'DOM-W1-1', owner: '1', count: 1 },
    ];
    expect(computeMajority(G, { q: 1, r: 0 })).toBe('0'); // CORE-01-05-01
  });

  it('tie returns null', () => {
    const G = baseState();
    G.influencesOnBoard = [
      { tileId: 'DOM-W1-1', owner: '0', count: 1 },
      { tileId: 'DOM-W1-1', owner: '1', count: 1 },
    ];
    expect(computeMajority(G, { q: 1, r: 0 })).toBeNull(); // CORE-01-05-02
  });

  it('lobbyist adjacency changes outcome (CORE-01-05-04..06)', () => {
    const G = baseState();
    G.influencesOnBoard = [
      { tileId: 'DOM-W1-1', owner: '0', count: 1 },
      { tileId: 'DOM-W1-1', owner: '1', count: 1 },
      { tileId: 'Lobbyist-1', owner: '0', count: 1 }, // adjacent at (2,0)
    ];
    expect(computeMajority(G, { q: 1, r: 0 })).toBe('0');
  });

  it('multiple adjacent lobbyists stack +1 each', () => {
    const G = baseState();
    G.influencesOnBoard = [
      { tileId: 'DOM-W1-1', owner: '0', count: 1 },
      { tileId: 'DOM-W1-1', owner: '1', count: 1 },
      { tileId: 'Lobbyist-1', owner: '0', count: 1 }, // (2,0)
      { tileId: 'Lobbyist-2', owner: '0', count: 1 }, // (1,-1)
    ];
    expect(computeMajority(G, { q: 1, r: 0 })).toBe('0');
  });
});