import { shuffleSeeded } from '@bc/shared';
import type { CoreState, ResourceId, Tile, ResortTile, StartCommitteeTile } from './types.js';
import { CoreResorts } from './types.js';
import { createMatchResourceRegistry, makeEmptyResourceBank } from './resources.js';
import { createExpansionRegistry } from './expansion-registry.js';
import { MatchConfigSchema, validateMatchPlayerCount, type MatchConfigInput } from './schemas.js';

function makeId(prefix: string, n: number): string {
  return `${prefix}-${n}`;
}

// CORE-01-02-10..16 tile counts
const resortCounts: Record<ResourceId, Record<1|2|3|4|5, number>> = {
  DOM: { 1: 2, 2: 4, 3: 4, 4: 1, 5: 1 },
  FOR: { 1: 2, 2: 4, 3: 4, 4: 1, 5: 1 },
  INF: { 1: 2, 2: 4, 3: 4, 4: 1, 5: 1 },
};

const counts = {
  Committees: 10, // CORE-01-02-13
  Grassroots: 8,  // CORE-01-02-14
  Lobbyists: 9,   // CORE-01-02-15
  Hotspots: 8,    // CORE-01-02-16
};

function buildResortTiles(addOn56: boolean): ResortTile[] {
  const tiles: ResortTile[] = [];
  for (const resort of CoreResorts) {
    const c = resortCounts[resort];
    ([1,2,3,4,5] as const).forEach((w) => {
      // ADD56-01-01-02 through -10: one additional W2, W3 and W4 per CORE resort.
      const count = c[w] + (addOn56 && w >= 2 && w <= 4 ? 1 : 0);
      for (let i = 0; i < count; i++) {
        tiles.push({ id: makeId(`${resort}-W${w}`, i+1), kind: 'ResortTile', resort, w: Number(w) as 1|2|3|4|5 });
      }
    });
  }
  return tiles;
}

function buildStartCommittee(): StartCommitteeTile {
  return { id: 'StartCommittee', kind: 'StartCommittee' }; // CORE-01-02-01..03
}

function buildNonResortTiles(addOn56: boolean): Tile[] {
  const out: Tile[] = [];
  // ADD56-01-01-11 through -13: extra Committees, Lobbyists and Grassroots.
  for (let i = 0; i < counts.Committees + (addOn56 ? 2 : 0); i++) out.push({ id: makeId('Committee', i+1), kind: 'Committee' });
  for (let i = 0; i < counts.Grassroots + (addOn56 ? 2 : 0); i++) out.push({ id: makeId('Grassroots', i+1), kind: 'Grassroots' });
  for (let i = 0; i < counts.Lobbyists + (addOn56 ? 3 : 0); i++) out.push({ id: makeId('Lobbyist', i+1), kind: 'Lobbyist' });
  for (let i = 0; i < counts.Hotspots; i++) out.push({ id: makeId('Hotspot', i+1), kind: 'Hotspot' });
  // ADD56-01-01-14 through -16: labels identify the tiles, both use ordinary Hotspot resolution.
  if (addOn56) out.push({ id: 'Hotspot-DOM', kind: 'Hotspot' }, { id: 'Hotspot-FOR', kind: 'Hotspot' });
  return out;
}

export function buildInitialCoreState(numPlayers: number, matchSeed: string, config: MatchConfigInput = {}): CoreState {
  const cfg = MatchConfigSchema.parse(config);
  const invalidCount = validateMatchPlayerCount(numPlayers, cfg.addOn56);
  if (invalidCount) throw new RangeError(invalidCount);
  const registry = createMatchResourceRegistry(createExpansionRegistry(cfg.expansions));

  // Gather all tiles
  const start = buildStartCommittee();
  const resortTiles = buildResortTiles(cfg.addOn56);
  const others = buildNonResortTiles(cfg.addOn56);
  const allTilesArr: Tile[] = [start, ...resortTiles, ...others];

  // Index tiles
  const allTiles: Record<string, Tile> = Object.fromEntries(allTilesArr.map(t => [t.id, t]));

  // Shuffle draw pile deterministically (excluding Start Committee)
  const drawPool = [...resortTiles, ...others].map(t => t.id);
  const drawPile = shuffleSeeded(drawPool, matchSeed);

  // Setup players and starting Influence (CORE-01-03-04..06)
  // ADD56-01-02-01/-02: five and six players also start with two markers.
  const startingByPlayers: Record<number, number> = { 2: 4, 3: 3, 4: 2, 5: 2, 6: 2 };
  const starting = startingByPlayers[numPlayers];
  const players: Record<string, import('./types.js').PlayerState> = {};
  for (let p = 0; p < numPlayers; p++) {
    const id = String(p);
    players[id] = {
      id,
      personal: {
        resources: makeEmptyResourceBank(registry),
        // VAR-01-02-02/-03: the engine starts with player 0.
        influence: Array.from({ length: starting - (p === 0 && cfg.variants.firstPlayerHandicap ? 1 : 0) }, (_, i) => ({
          id: `INF-${id}-${i+1}`, owner: id, starting: true,
        })),
      },
    };
  }

  const state: CoreState = {
    matchSeed,
    cfg,
    tiles: {
      drawPile,
      drawResolution: null, // CORE-01-03-09
      discardFaceUp: [],
      board: [{ tileId: start.id, coord: { q: 0, r: 0 } }], // CORE-01-03-01
    },
    allTiles,
    players,
    resources: {
      bank: makeEmptyResourceBank(registry),
      noise: makeEmptyResourceBank(registry),
    },
  };

  return state;
}

