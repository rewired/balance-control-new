import type { AxialCoord } from '../types.js';
import { adjacent, hexNeighbors } from './hex.js';

export const topologyIds = ['hex', 'orthogonal'] as const;
export type TopologyId = typeof topologyIds[number];

export interface Topology {
  adjacent(a: AxialCoord, b: AxialCoord): boolean;
  neighbors(coord: AxialCoord): readonly AxialCoord[];
}

// CORE-01-00-T01 through -T04: adjacency and candidate enumeration share one attachment.
const topologies: Record<TopologyId, Topology> = {
  hex: { adjacent, neighbors: hexNeighbors },
  orthogonal: {
    adjacent: (a, b) => Math.abs(a.q - b.q) + Math.abs(a.r - b.r) === 1,
    neighbors: ({ q, r }) => [{ q: q + 1, r }, { q, r: r - 1 }, { q: q - 1, r }, { q, r: r + 1 }],
  },
};

export function getTopology(id: TopologyId = 'hex'): Topology {
  return topologies[id];
}
