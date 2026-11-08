import { MatchConfigSchema } from '@bc/rules';
import { describe, it, expect } from 'vitest';
import { resolveProductionForTile } from './production.js';
import type { CoreState, Tile } from '@bc/rules';
import type { ExpansionModule } from '@bc/rules';

function stateWithResort(q=1,r=0,w=1): CoreState {
  const tile: Tile = { id: 'DOM-W1-1', kind: 'ResortTile', resort: 'DOM', w } as const;
  return {
    cfg: MatchConfigSchema.parse({ expansions: { exp01: true, exp02: false, exp03: false } }),
    matchSeed: 's',
    exp: {
      core: {
        tiles: { drawPile: [], drawResolution: null, discardFaceUp: [], board: [ { tileId: tile.id, coord: { q, r } } ] },
        allTiles: { [tile.id]: tile },
        players: {
          '0': { id: '0', personal: { resources: { DOM: 0, FOR: 0, INF: 0 }, influence: [] } },
          '1': { id: '1', personal: { resources: { DOM: 0, FOR: 0, INF: 0 }, influence: [] } },
        },
        resources: { bank: { DOM:0,FOR:0,INF:0 }, noise: { DOM:0,FOR:0,INF:0 } },
        influencesOnBoard: [ { tileId: 'DOM-W1-1', owner: '0', id: 'test-1' } ],
      },
    },
  };
}

describe('Production hooks — CORE-01-06-16', () => {
  it('applies each eligible doubling to the printed value before any additive change', () => {
    const G = stateWithResort(1, 0, 1);
    const mod: ExpansionModule = {
      id: 'exp01', registerResources: () => {}, setupExpansionState: () => {},
      hooks: {
        productionModifiers: () => [
          { kind: 'double', source: 'measure' }, { kind: 'additive', source: 'measure', delta: 1 }, { kind: 'double', source: 'measure' },
        ],
      },
    };
    resolveProductionForTile(G, { q: 1, r: 0 }, [mod]);
    expect(G.exp.core.players['0'].personal.resources.DOM).toBe(5);
    expect(G.exp.core.resources.noise.DOM).toBe(0);
  });

  it('floors a negative combined output to zero before distribution', () => {
    const G = stateWithResort(1, 0, 1);
    G.exp.core.resources.bank.DOM = 2;
    const mod: ExpansionModule = {
      id: 'exp01', registerResources: () => {}, setupExpansionState: () => {},
      hooks: { productionModifiers: () => [{ kind: 'double', source: 'measure' }, { kind: 'additive', source: 'measure', delta: -3 }] },
    };
    resolveProductionForTile(G, { q: 1, r: 0 }, [mod]);
    expect(G.exp.core.players['0'].personal.resources.DOM).toBe(0);
    expect(G.exp.core.resources.noise.DOM).toBe(0);
    expect(G.exp.core.resources.bank.DOM).toBe(2);
  });
});
