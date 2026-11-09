import type { AxialCoord } from '../types.js';
import { adjacent, hexNeighbors } from './hex.js';

export const topologyIds = ['hex'] as const;
export type TopologyId = typeof topologyIds[number];

export interface Topology {
  adjacent(a: AxialCoord, b: AxialCoord): boolean;
  neighbors(coord: AxialCoord): readonly AxialCoord[];
}

// CORE-01-00-T01 through -T04: adjacency and candidate enumeration share one attachment.
const topologies: Record<TopologyId, Topology> = {
  hex: { adjacent, neighbors: hexNeighbors },
};

export function getTopology(id: TopologyId = 'hex'): Topology {
  return topologies[id];
}
