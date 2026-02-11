import type { AxialCoord, CoreState, Tile, Resort } from './types.js';
import { computeMajority } from './majority.js';

function getPlacement(state: CoreState, coord: AxialCoord) {
  return state.tiles.board.find((p) => p.coord.q === coord.q && p.coord.r === coord.r);
}

function printedValue(tile: Tile): number { return tile.kind === 'ResortTile' ? tile.w : 0 }

function addResources(state: CoreState, playerID: string, resort: Resort, n: number) {
  const p = state.players[playerID];
  for (let i = 0; i < n; i++) {
    const id = `${resort}-R-${playerID}-${p.personal.resources.length + 1}`;
    p.personal.resources.push({ id, resort });
  }
}

function addNoise(state: CoreState, resort: Resort, n: number) {
  for (let i = 0; i < n; i++) {
    const id = `${resort}-N-${state.resources.noise.length + 1}`;
    state.resources.noise.push({ id, resort });
  }
}

function scores(state: CoreState, coord: AxialCoord): Array<[string, number]> {
  // Mirror majority computation by sampling getControl over players using the same tally basis
  const players = Object.keys(state.players);
  // Rebuild score table via difference-of-control: computeMajority checks tie; here we want per-player tallies.
  // Approximate by checking influenceOnBoard counts only (no lobbyist bonus) would diverge; instead, sample via majority function is insufficient.
  // For correctness, rely on majority.ts internals: we recompute locally as base + lobbyist adjacency using the same interpretation.
  // Inline duplicate kept minimal and consistent: uses influencesOnBoard and adjacent Lobbyist counts.
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

export function resolveProductionForTile(state: CoreState, coord: AxialCoord): void {
  const placement = getPlacement(state, coord); if (!placement) return;
  const tile = state.allTiles[placement.tileId]; if (!tile || tile.kind !== 'ResortTile') return;
  // CORE-01-06-16 order
  let out = printedValue(tile); // 1. printed value
  // 2. doubling effects (none in core)
  // 3. production output modifiers (none in core)
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

export function resolveRoundSettlement(state: CoreState): void {
  // CORE-01-07 Round Settlement: produce for all ResortTiles on Board
  const coords = state.tiles.board
    .map(p => ({ tile: state.allTiles[p.tileId], coord: p.coord }))
    .filter(x => x.tile && x.tile.kind === 'ResortTile');
  for (const x of coords) resolveProductionForTile(state, x.coord);
}