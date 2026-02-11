import { describe, it, expect } from 'vitest';
import { resolveProductionForTile } from './production.js';
import type { CoreState, Tile } from './types.js';

function stateWithResort(q=1,r=0,w=5): CoreState {
  const tile: Tile = { id: 'DOM-W1-1', kind: 'ResortTile', resort: 'DOM', w } as const;
  return {
    matchSeed: 's',
    tiles: { drawPile: [], discardFaceUp: [], board: [ { tileId: tile.id, coord: { q, r } } ] },
    allTiles: { [tile.id]: tile },
    players: {
      '0': { id: '0', personal: { resources: [], influence: [] } },
      '1': { id: '1', personal: { resources: [], influence: [] } },
    },
    resources: { bank: [], noise: [] },
    influencesOnBoard: [],
  };
}

describe('Production — CORE-01-06-16', () => {
  it('awards all to controlling player', () => {
    const G = stateWithResort(1,0,3);
    G.influencesOnBoard = [ { tileId: 'DOM-W1-1', owner: '0', count: 1 } ];
    resolveProductionForTile(G, { q:1, r:0 });
    expect(G.players['0'].personal.resources).toHaveLength(3);
    expect(G.resources.noise).toHaveLength(0);
  });
  it('tie splits evenly; remainder to Noise', () => {
    const G = stateWithResort(1,0,5);
    G.influencesOnBoard = [ { tileId: 'DOM-W1-1', owner: '0', count: 1 }, { tileId: 'DOM-W1-1', owner: '1', count: 1 } ];
    resolveProductionForTile(G, { q:1, r:0 });
    expect(G.players['0'].personal.resources).toHaveLength(2);
    expect(G.players['1'].personal.resources).toHaveLength(2);
    expect(G.resources.noise).toHaveLength(1);
  });
});