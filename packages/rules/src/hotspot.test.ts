import { describe, it, expect } from 'vitest';
import { isFullySurrounded, resolveHotspot } from './hotspot.js';
import type { CoreState, Tile } from './types.js';
unction base(): CoreState {
  const hotspot: Tile = { id: 'H1', kind: 'Hotspot' } as any;
  // 6 neighbor fillers
  const fillers: Tile[] = Array.from({ length: 6 }, (_, i) => ({ id: `F${i+1}`, kind: 'Committee' } as any));
  const all: Record<string, Tile> = { [hotspot.id]: hotspot, ...Object.fromEntries(fillers.map(t=>[t.id,t])) };
  const board = [ { tileId: 'H1', coord: { q:0,r:0 } } ];
  return {
    matchSeed: 's',
    tiles: { drawPile: [], discardFaceUp: [], board },
    allTiles: all,
    players: {
      '0': { id: '0', personal: { resources: [], influence: [ { id:'i1', owner:'0' } ] } },
      '1': { id: '1', personal: { resources: [], influence: [] } },
    },
    resources: { bank: [], noise: [] },
    influencesOnBoard: [ { tileId: 'F1', owner: '0', count: 1 } ],
  };
}

function surround(G: CoreState) {
  const nbrs = [ {q:+1,r:0},{q:+1,r:-1},{q:0,r:-1},{q:-1,r:0},{q:-1,r:+1},{q:0,r:+1} ];
  const ids = ['F1','F2','F3','F4','F5','F6'];
  for (let k=0;k<6;k++) G.tiles.board.push({ tileId: ids[k], coord: { q: nbrs[k].q, r: nbrs[k].r } });
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
    surround(G);
    resolveHotspot(G, { q:0,r:0 });
    const onHotspot = (G.influencesOnBoard ?? []).find(i=>i.tileId==='H1'&&i.owner==='0');
    expect(onHotspot?.count ?? 0).toBe(1);
    expect(G.players['0'].personal.influence).toHaveLength(0);
  });
});