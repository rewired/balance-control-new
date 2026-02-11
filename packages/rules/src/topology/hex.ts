// CORE-01-00-T01..T05 Hex topology adapter (axial coords)
import type { AxialCoord } from '../types.js';

const NEIGHBORS: ReadonlyArray<AxialCoord> = [
  { q: +1, r: 0 },
  { q: +1, r: -1 },
  { q: 0, r: -1 },
  { q: -1, r: 0 },
  { q: -1, r: +1 },
  { q: 0, r: +1 },
];

export function add(a: AxialCoord, b: AxialCoord): AxialCoord { return { q: a.q + b.q, r: a.r + b.r }; }
export function eq(a: AxialCoord, b: AxialCoord): boolean { return a.q === b.q && a.r === b.r; }

export function hexNeighbors(c: AxialCoord): AxialCoord[] { return NEIGHBORS.map((d) => add(c, d)); }

export function adjacent(a: AxialCoord, b: AxialCoord): boolean {
  return hexNeighbors(a).some((n) => eq(n, b));
}