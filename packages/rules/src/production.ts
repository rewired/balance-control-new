import type { AxialCoord, CoreState, Tile, ResourceId, ResortTile } from './types.js';
import { computeMajority } from './majority.js';
import type { ExpansionModule, ProductionModifier } from './expansion-registry.js';

export function collectProductionModifiers(G: CoreState, coord: AxialCoord, tile: ResortTile, modules: ExpansionModule[]): ProductionModifier[] {
  if (!modules || modules.length === 0) return [];
  const out: ProductionModifier[] = [];
  for (const m of modules) {
    const list = m.hooks?.productionModifiers?.({ G, coord, tile, amount: tile.w });
    if (Array.isArray(list)) out.push(...list);
  }
  return out;
}

function getPlacement(state: CoreState, coord: AxialCoord) {
  return state.tiles.board.find((p) => p.coord.q === coord.q && p.coord.r === coord.r);
}

function printedValue(tile: Tile): number { return tile.kind === 'ResortTile' ? tile.w : 0 }

function addResources(state: CoreState, playerID: string, resort: ResourceId, n: number) {
  const amounts = state.players[playerID].personal.resources;
  amounts[resort] = (amounts[resort] ?? 0) + n;
}

function addNoise(state: CoreState, resort: ResourceId, n: number) {
  const noise = state.resources.noise;
  noise[resort] = (noise[resort] ?? 0) + n;
}

function scores(state: CoreState, coord: AxialCoord): Array<[string, number]> {
  const players = Object.keys(state.players);
  const placement = getPlacement(state, coord); if (!placement) return players.map(pid => [pid, 0]);
  const tileId = placement.tileId;
  function base(pid: string) {
    const list = state.influencesOnBoard ?? [];
    return list.filter(i => i.tileId === tileId && i.owner === pid).reduce((a,b)=>a+b.count,0);
  }
  function lobbyAdj(pid: string) {
    const deltas = [ {q:+1,r:0},{q:+1,r:-1},{q:0,r:-1},{q:-1,r:0},{q:-1,r:+1},{q:0,r:+1} ];
    let bonus = 0;
    for (const d of deltas) {
      const ncoord = { q: coord.q + d.q, r: coord.r + d.r };
      const place = getPlacement(state, ncoord);
      if (!place) continue;
      const t = state.allTiles[place.tileId];
      if (t && t.kind === 'Lobbyist') {
        const present = (state.influencesOnBoard ?? []).find(i => i.tileId === place.tileId && i.owner === pid)?.count ?? 0;
        if (present > 0) bonus += 1;
      }
    }
    return bonus;
  }
  return players.map(pid => [pid, base(pid) + lobbyAdj(pid)]);
}

export function resolveProductionForTile(state: CoreState, coord: AxialCoord, modules: ExpansionModule[] = []): void {
  const placement = getPlacement(state, coord); if (!placement) return;
  const tile = state.allTiles[placement.tileId]; if (!tile || tile.kind !== 'ResortTile') return;
  // CORE-01-06-16 order
  let out = printedValue(tile); // 1. printed value
  // 2. doubling effects (none in core)
  // 3. production output modifiers
  const modifiers = collectProductionModifiers(state, coord, tile, modules);
  for (const f of modifiers) out = f(out);
  // 4. floors (ensure non-negative)
  if (out < 0) out = 0;
  if (out === 0) return;
  // 5. Majority check
  const winner = computeMajority(state, coord);
  if (winner) {
    addResources(state, winner, tile.resort, out);
    return;
  }
  // tie: split evenly among top players
  const sc = scores(state, coord);
  const max = Math.max(...sc.map(([,v]) => v));
  const tops = sc.filter(([,v]) => v === max).map(([pid]) => pid);
  if (max <= 0 || tops.length === 0) { addNoise(state, tile.resort, out); return; }
  const share = Math.floor(out / tops.length);
  const rem = out - share * tops.length;
  for (const pid of tops) addResources(state, pid, tile.resort, share);
  if (rem > 0) addNoise(state, tile.resort, rem); // CORE-01-06-15 remainder to Noise
}

export function resolveRoundSettlement(state: CoreState, modules: ExpansionModule[] = []): void {
  // CORE-01-07 Round Settlement: produce for all ResortTiles on Board
  const coords = state.tiles.board
    .map(p => ({ tile: state.allTiles[p.tileId], coord: p.coord }))
    .filter(x => x.tile && x.tile.kind === 'ResortTile');
  for (const x of coords) resolveProductionForTile(state, x.coord, modules);
}
