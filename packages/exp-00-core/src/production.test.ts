import { MatchConfigSchema } from '@bc/rules';
import { describe, it, expect } from 'vitest';
import { resolveProductionForTile } from './production.js';
import { createResolver } from '@bc/rules';
import type { CoreState, Tile } from '@bc/rules';

function stateWithResort(q=1,r=0,w=5): CoreState {
  const tile: Tile = { id: 'DOM-W1-1', kind: 'ResortTile', resort: 'DOM', w } as const;
  return {
    cfg: MatchConfigSchema.parse({ expansions: { exp01: false, exp02: false, exp03: false } }),
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
        influencesOnBoard: [],
      },
    },
  };
}

describe('Production — CORE-01-06-16', () => {
  it('awards all to controlling player', () => {
    const G = stateWithResort(1,0,3);
    G.exp.core.influencesOnBoard = [ { tileId: 'DOM-W1-1', owner: '0', id: 'test-1' } ];
    resolveProductionForTile(G, { q:1, r:0 });
    expect(G.exp.core.players['0'].personal.resources.DOM).toBe(3);
    expect(G.exp.core.resources.noise.DOM).toBe(0);
  });
  it('splits production among the canonical tied leaders and sends the remainder to Noise', () => {
    const G = stateWithResort(1,0,5);
    G.exp.core.resources.bank.DOM = 7;
    G.exp.core.allTiles['Lobbyist-1'] = { id: 'Lobbyist-1', kind: 'Lobbyist' };
    G.exp.core.tiles.board.push({ tileId: 'Lobbyist-1', coord: { q: 2, r: 0 } });
    G.exp.core.influencesOnBoard = [
      { tileId: 'DOM-W1-1', owner: '1', id: 'test-2' },
      { tileId: 'Lobbyist-1', owner: '0', id: 'test-3' },
      { tileId: 'Lobbyist-1', owner: '0', id: 'test-4' },
      { tileId: 'Lobbyist-1', owner: '1', id: 'test-5' },
    ];
    resolveProductionForTile(G, { q:1, r:0 });
    expect(G.exp.core.players['0'].personal.resources.DOM).toBe(2);
    expect(G.exp.core.players['1'].personal.resources.DOM).toBe(2);
    expect(G.exp.core.resources.noise.DOM).toBe(1);
    expect(G.exp.core.resources.bank.DOM).toBe(2);
  });

  it('T03: a ResortTile with no positive leader pays neither players nor Noise', () => {
    const G = stateWithResort(1, 0, 3);
    G.exp.core.resources.bank.DOM = 2;
    const before = structuredClone(G);
    resolveProductionForTile(G, { q: 1, r: 0 });
    expect(G).toEqual(before);
  });

  it('rolls back the whole payout if a later recipient cannot accept it', () => {
    const G = stateWithResort(1, 0, 5);
    G.exp.core.influencesOnBoard = [
      { tileId: 'DOM-W1-1', owner: '0', id: 'test-6' },
      { tileId: 'DOM-W1-1', owner: '1', id: 'test-7' },
    ];
    G.exp.core.players['1'].personal.resources.DOM = Number.MAX_SAFE_INTEGER;
    G.exp.core.resources.bank.DOM = 7;
    const before = structuredClone(G);

    const result = createResolver()(G, { kind: 'applyProductionAt', coord: { q: 1, r: 0 }, contextCoord: { q: 1, r: 0 } });

    expect(result.ok).toBe(false);
    expect(G).toEqual(before);
  });
});
