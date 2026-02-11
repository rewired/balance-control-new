import { shuffleSeeded } from '@bc/shared';
import type { CoreState, Resort, Tile, ResortTile, StartCommitteeTile } from './types.js';
import { CoreResorts } from './types.js';

function makeId(prefix: string, n: number): string {
  return `${prefix}-${n}`;
}

// CORE-01-02-10..16 tile counts
const resortCounts: Record<Resort, Record<1|2|3|4|5, number>> = {
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

function buildResortTiles(): ResortTile[] {
  const tiles: ResortTile[] = [];
  for (const resort of CoreResorts) {
    const c = resortCounts[resort];
    ([1,2,3,4,5] as const).forEach((w) => {
      const count = c[w as 1|2|3|4|5];
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

function buildNonResortTiles(): Tile[] {
  const out: Tile[] = [];
  for (let i = 0; i < counts.Committees; i++) out.push({ id: makeId('Committee', i+1), kind: 'Committee' });
  for (let i = 0; i < counts.Grassroots; i++) out.push({ id: makeId('Grassroots', i+1), kind: 'Grassroots' });
  for (let i = 0; i < counts.Lobbyists; i++) out.push({ id: makeId('Lobbyist', i+1), kind: 'Lobbyist' });
  for (let i = 0; i < counts.Hotspots; i++) out.push({ id: makeId('Hotspot', i+1), kind: 'Hotspot' });
  return out;
}

export function buildInitialCoreState(numPlayers: number, matchSeed: string): CoreState {
  // Gather all tiles
  const start = buildStartCommittee();
  const resortTiles = buildResortTiles();
  const others = buildNonResortTiles();
  const allTilesArr: Tile[] = [start, ...resortTiles, ...others];

  // Index tiles
  const allTiles: Record<string, Tile> = Object.fromEntries(allTilesArr.map(t => [t.id, t]));

  // Shuffle draw pile deterministically (excluding Start Committee)
  const drawPool = [...resortTiles, ...others].map(t => t.id);
  const drawPile = shuffleSeeded(drawPool, matchSeed);

  // Setup players and starting Influence (CORE-01-03-04..06)
  const startingByPlayers: Record<number, number> = { 2: 4, 3: 3, 4: 2 };
  const starting = startingByPlayers[numPlayers as 2|3|4] ?? 0;
  const players: Record<string, import("./types.js").PlayerState> = {};
  for (let p = 0; p < numPlayers; p++) {
    const id = String(p);
    players[id] = {
      id,
      personal: {
        resources: [],
        influence: Array.from({ length: starting }, (_, i) => ({ id: `INF-${id}-${i+1}`, owner: id })),
      },
    };
  }

  return {
    matchSeed,
    tiles: {
      drawPile,
      discardFaceUp: [],
      board: [{ tileId: start.id, coord: { q: 0, r: 0 } }], // CORE-01-03-01
    },
    allTiles,
    players,
    resources: {
      bank: [],
      noise: [],
    },
  };
}


