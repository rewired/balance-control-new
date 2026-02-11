import { describe, it, expect } from 'vitest';
import { resolveProductionForTile } from './production.js';
import type { CoreState, Tile } from './types.js';
import type { ExpansionModule } from './expansion-registry.js';

function stateWithResort(q=1,r=0,w=1): CoreState {
  const tile: Tile = { id: 'DOM-W1-1', kind: 'ResortTile', resort: 'DOM', w } as const;
  return {
    matchSeed: 's',
    tiles: { drawPile: [], discardFaceUp: [], board: [ { tileId: tile.id, coord: { q, r } } ] },
    allTiles: { [tile.id]: tile },
    players: {
      '0': { id: '0', personal: { resources: { DOM: 0, FOR: 0, INF: 0 }, influence: [] } },
      '1': { id: '1', personal: { resources: { DOM: 0, FOR: 0, INF: 0 }, influence: [] } },
    },
    resources: { bank: { DOM:0,FOR:0,INF:0 }, noise: { DOM:0,FOR:0,INF:0 } },
    influencesOnBoard: [ { tileId: 'DOM-W1-1', owner: '0', count: 1 } ],
  };
}

describe('Production hooks — Task 0015', () => {
  it('applies +1 modifier at step 3 before floors/majority', () => {
    const G = stateWithResort(1,0,1);
    const mod: ExpansionModule = {
      id: 'exp01', registerResources: () => {}, setupExpansionState: () => {},
      hooks: { productionModifiers: () => [ (n) => n + 1 ] }
    };
    resolveProductionForTile(G, { q:1, r:0 }, [mod]);
    expect(G.players['0'].personal.resources.DOM).toBe(2);
    expect(G.resources.noise.DOM).toBe(0);
  });
  it('negative modifier is clamped by floors before majority/distribution', () => {
    const G = stateWithResort(1,0,1);
    const mod: ExpansionModule = {
      id: 'exp01', registerResources: () => {}, setupExpansionState: () => {},
      hooks: { productionModifiers: () => [ (n) => n - 5 ] }
    };
    resolveProductionForTile(G, { q:1, r:0 }, [mod]);
    // out becomes -4 then floored to 0, nothing distributed nor to Noise
    expect(G.players['0'].personal.resources.DOM).toBe(0);
    expect(G.resources.noise.DOM).toBe(0);
  });
});
