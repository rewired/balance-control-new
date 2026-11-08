import type { AxialCoord, CoreState } from './types.js';
import { getCoreExpansion } from './expansion-registry.js';

export interface MajorityBreakdown { [playerID: string]: number }
export interface MajorityResult {
  controller: string | null;
  leaders: string[];
  scores: MajorityBreakdown;
}

export function computeMajority(G: CoreState, coord: AxialCoord): string | null;
export function computeMajority(G: CoreState, coord: AxialCoord, format: 'details'): MajorityResult;
export function computeMajority(G: CoreState, coord: AxialCoord, format?: 'details'): string | null | MajorityResult {
  const core = getCoreExpansion();
  return format ? core.computeMajority(G, coord, format) : core.computeMajority(G, coord);
}

export function getControl(G: CoreState, coord: AxialCoord): string | null {
  return computeMajority(G, coord);
}

export function isFullySurrounded(G: CoreState, coord: AxialCoord): boolean {
  return getCoreExpansion().isFullySurrounded(G, coord);
}
