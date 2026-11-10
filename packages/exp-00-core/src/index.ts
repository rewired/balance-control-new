import { shuffleSeeded } from '@bc/shared';
import { createResortTiles, makeEmptyResourceBank, type CoreModule, type PlayerState, type ResourceId, type Tile } from '@bc/rules';
import { registerCorePoliticalMoves } from './political-moves.js';
import { createResolver } from './resolver.js';
import { computeMajority } from './majority.js';
import { isFullySurrounded } from './hotspot.js';

export { CoreStages, CoreTurn } from './turn.js';
export { boardInfluenceScores, influenceLimit } from './influence.js';
export { checkStartCommitteeFormalization, isProhibited, modifyOutput, startCommitteeCost } from './resolver.js';
export { engineMoveOptions, type EngineMoveOption } from './move-options.js';
export { planProductionForTile, productionReceipt } from './production.plan.js';
export { coreStateForHash } from './state-migration.js';
export { migrateCoreMatchState } from './match-migration.js';

export const CoreResorts: readonly ResourceId[] = ['DOM', 'FOR', 'INF']; // CORE-01-02-04A

export function createCoreExpansion(): CoreModule {
  return {
    id: 'core',
    createResolver,
    computeMajority,
    isFullySurrounded,
    // CORE-01-02-04A: domestic, foreign and infrastructure are the CORE resorts.
    registerResources: registry => CoreResorts.forEach(resort => registry.register(resort)),
    tiles: ({ addOn56 }) => buildCoreTiles(addOn56),
    extendMoves: registerCorePoliticalMoves,
    initializeMatch,
  };
}

function buildCoreTiles(addOn56: boolean): Tile[] {
  // CORE-01-02-10..12 and ADD56-01-01-02..10: same distribution for all three CORE resorts.
  const counts = { 1: 2, 2: addOn56 ? 5 : 4, 3: addOn56 ? 5 : 4, 4: addOn56 ? 2 : 1, 5: 1 };
  const tiles: Tile[] = [
    { id: 'StartCommittee', kind: 'StartCommittee' }, // CORE-01-02-01..03
    ...CoreResorts.flatMap(resort => createResortTiles(resort, counts)),
  ];
  // CORE-01-02-13..16 and ADD56-01-01-11..13.
  for (const [kind, count] of [
    ['Committee', addOn56 ? 12 : 10],
    ['Grassroots', addOn56 ? 10 : 8],
    ['Lobbyist', addOn56 ? 12 : 9],
    ['Hotspot', 8],
  ] as const) {
    for (let i = 1; i <= count; i++) tiles.push({ id: `${kind}-${i}`, kind });
  }
  // ADD56-01-01-14..16: labels identify the tiles, both use ordinary Hotspot resolution.
  if (addOn56) tiles.push({ id: 'Hotspot-DOM', kind: 'Hotspot' }, { id: 'Hotspot-FOR', kind: 'Hotspot' });
  return tiles;
}

const initializeMatch: CoreModule['initializeMatch'] = ({ numPlayers, matchSeed, cfg, registry, tiles }) => {
  // CORE-01-03-01..02: the Start Committee starts on the board; shuffle all other tiles.
  const start = tiles.find(tile => tile.kind === 'StartCommittee');
  if (!start) throw new Error('CORE setup requires the Start Committee tile');
  const drawPool = tiles.filter(tile => tile !== start).map(tile => tile.id);
  // VAR-01-07-01: use a separate seeded order for rates, preserving the draw shuffle.
  const grassroots = cfg.variants.variableGrassroots
    ? shuffleSeeded(tiles.filter(tile => tile.kind === 'Grassroots').map(tile => tile.id), `${matchSeed}|grassroots-rates`)
    : [];
  const profiles = ['standard', 'efficient', 'bulk'] as const;
  const rates = new Map(grassroots.map((id, index) => [id, profiles[index % profiles.length]]));

  // CORE-01-03-04..06 and ADD56-01-02-01..02: five and six players also start with two markers.
  const startingByPlayers: Record<number, number> = { 2: 4, 3: 3, 4: 2, 5: 2, 6: 2 };
  const starting = startingByPlayers[numPlayers];
  const players: Record<string, PlayerState> = {};
  for (let p = 0; p < numPlayers; p++) {
    const id = String(p);
    players[id] = {
      id,
      personal: {
        resources: makeEmptyResourceBank(registry), // CORE-01-03-07
        // VAR-01-02-02..03: the engine starts with player 0.
        influence: Array.from({ length: starting - (p === 0 && cfg.variants.firstPlayerHandicap ? 1 : 0) }, (_, i) => ({
          id: `INF-${id}-${i + 1}`, owner: id, starting: true,
        })),
      },
    };
  }

  return {
    matchSeed,
    cfg,
    exp: {
      core: {
        tiles: {
          drawPile: shuffleSeeded(drawPool, matchSeed),
          drawResolution: null, // CORE-01-03-09
          discardFaceUp: [],
          board: [{ tileId: start.id, coord: { q: 0, r: 0 } }], // CORE-01-03-01
        },
        allTiles: Object.fromEntries(tiles.map(tile => {
          const grassrootsRate = rates.get(tile.id);
          return [tile.id, grassrootsRate ? { ...tile, grassrootsRate } : tile];
        })),
        players,
        resources: {
          bank: makeEmptyResourceBank(registry), // CORE-01-03-08
          noise: makeEmptyResourceBank(registry), // CORE-01-03-07
        },
      },
    },
  };
};
