import { MatchConfigSchema } from './schemas.js';
import { describe, it, expect } from 'vitest';
import { createResolver } from './effects.js';
import type { CoreState, Tile } from './types.js';

describe('PlaceOrMoveInfluence zones', () => {
  it('moves one Influence from PersonalSupply to Board tile', () => {
    const C1: Tile = { id: 'C1', kind: 'Committee' } as unknown as Tile;
    const G: CoreState = {
      cfg: MatchConfigSchema.parse({ expansions: { exp01: false, exp02: false, exp03: false } }),
      matchSeed: 's',
      tiles: { drawPile: [], drawResolution: null, discardFaceUp: [], board: [ { tileId: 'C1', coord: { q:1,r:0 } } ] },
      allTiles: { C1 },
      players: { '0': { id: '0', personal: { resources: { DOM:0,FOR:0,INF:0 }, influence: [ { id:'i1', owner:'0' } ] } } },
      resources: { bank: { DOM:0,FOR:0,INF:0 }, noise: { DOM:0,FOR:0,INF:0 } },
      influencesOnBoard: [],
    };
    const resolve = createResolver([]);
    const res = resolve(G, {
      kind: 'placeOrMoveInfluence',
      playerID: '0',
      markerId: 'i1',
      targetTileId: 'C1',
    });
    expect(res.ok).toBe(true);
    expect(G.players['0'].personal.influence.length).toBe(0);
    expect(G.influencesOnBoard).toEqual([{ id: 'i1', owner: '0', tileId: 'C1' }]);
  });
});
