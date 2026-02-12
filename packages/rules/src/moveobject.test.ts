import { describe, it, expect } from 'vitest';
import { createResolver } from './effects.js';
import type { CoreState, Tile } from './types.js';

describe('MoveObject - AGENTS -3.1 Zones', () => {
  it('moves one Influence from PersonalSupply to Board tile', () => {
    const C1: Tile = { id: 'C1', kind: 'Committee' } as unknown as Tile;
    const G: CoreState = {
      matchSeed: 's',
      tiles: { drawPile: [], discardFaceUp: [], board: [ { tileId: 'C1', coord: { q:1,r:0 } } ] },
      allTiles: { C1 },
      players: { '0': { id: '0', personal: { resources: { DOM:0,FOR:0,INF:0 }, influence: [ { id:'i1', owner:'0' } ] } } },
      resources: { bank: { DOM:0,FOR:0,INF:0 }, noise: { DOM:0,FOR:0,INF:0 } },
      influencesOnBoard: [],
    };
    const resolve = createResolver([]);
    const res = resolve(G, {
      kind: 'moveObject',
      object: { kind: 'Influence', owner: '0' },
      from: { zone: 'PersonalSupply' },
      to: { zone: 'Board', tileId: 'C1' },
      count: 1,
      contextCoord: { q:1, r:0 },
    } as unknown as Tile);
    expect(res.ok).toBe(true);
    expect(G.players['0'].personal.influence.length).toBe(0);
    const on = (G.influencesOnBoard ?? []).find(i => i.tileId==='C1' && i.owner==='0');
    expect(on?.count ?? 0).toBe(1);
  });
});
