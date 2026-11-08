import { MatchConfigSchema } from '@bc/rules';
/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect } from 'vitest';
import { isFullySurrounded } from './hotspot.js';
import { createResolver } from '@bc/rules';
import type { CoreState, Tile } from '@bc/rules';

function base(): CoreState {
  const hotspot: Tile = { id: 'H1', kind: 'Hotspot' } as any;
  // 6 neighbor fillers
  const fillers: Tile[] = Array.from({ length: 6 }, (_, i) => ({ id: `F${i+1}`, kind: 'Committee' } as any));
  const all: Record<string, Tile> = { [hotspot.id]: hotspot, ...Object.fromEntries(fillers.map(t=>[t.id,t])) };
  const board = [ { tileId: 'H1', coord: { q:0,r:0 } } ];
  return {
    cfg: MatchConfigSchema.parse({ expansions: { exp01: false, exp02: false, exp03: false } }),
    matchSeed: 's',
    exp: {
      core: {
        tiles: { drawPile: [], drawResolution: null, discardFaceUp: [], board },
        allTiles: all,
        players: {
          '0': { id: '0', personal: { resources: {}, influence: [ { id:'i1', owner:'0' } ] } },
          '1': { id: '1', personal: { resources: {}, influence: [] } },
        },
        resources: { bank: {}, noise: {} },
        influencesOnBoard: [ { tileId: 'H1', owner: '0', id: 'i0' } ],
      },
    },
  };
}

function surround(G: CoreState) {
  const nbrs = [ {q:+1,r:0},{q:+1,r:-1},{q:0,r:-1},{q:-1,r:0},{q:-1,r:+1},{q:0,r:+1} ];
  const ids = ['F1','F2','F3','F4','F5','F6'];
  for (let k=0;k<6;k++) G.exp.core.tiles.board.push({ tileId: ids[k], coord: { q: nbrs[k].q, r: nbrs[k].r } });
}

describe('Hotspot — CORE-01-06', () => {
  it('triggers only when fully surrounded', () => {
    const G = base();
    expect(isFullySurrounded(G, { q:0,r:0 })).toBe(false);
    surround(G);
    expect(isFullySurrounded(G, { q:0,r:0 })).toBe(true);
  });
  it('awards 1 influence to majority player if available', () => {
    const G = base();
    surround(G); { const resolve = createResolver([]); resolve(G, { kind: 'resolveHotspotAt', coord: { q:0,r:0 }, contextCoord: { q:0,r:0 } }); }
    expect(G.exp.core.influencesOnBoard).toEqual([
      { tileId: 'H1', owner: '0', id: 'i0' },
      { tileId: 'H1', owner: '0', id: 'i1' },
    ]);
    expect(G.exp.core.players['0'].personal.influence).toHaveLength(0);
  });
});
