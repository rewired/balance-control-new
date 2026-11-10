import { getTopology, hexDistance, type BoardPlacement, type CoreState, type DisruptionTarget } from '@bc/rules';
import { getControl } from './majority.js';

// CORE-01-04-29/-31/-33: base costs for the three political actions.
export const disruptionCost = { counterLobby: 2, displaceInfluence: 2, damageResort: 3 } as const;

// CORE-01-04-28/-29/-31/-33: measure range from real markers, including a marker on the target.
function hasMarkerInRange(G: CoreState, playerID: string, target: BoardPlacement, range: number): boolean {
  const ownTiles = new Set(G.exp.core.influencesOnBoard?.filter(marker => marker.owner === playerID).map(marker => marker.tileId));
  return G.exp.core.tiles.board.some(tile => ownTiles.has(tile.tileId) && hexDistance(tile.coord, target.coord) <= range);
}

// CORE-01-04-32: every response destination is already on the board and adjacent to the source.
export function displacementDestinations(G: CoreState, source: BoardPlacement): BoardPlacement[] {
  const { adjacent } = getTopology(G.cfg.topology);
  return G.exp.core.tiles.board.filter(tile =>
    G.exp.core.allTiles[tile.tileId].kind !== 'StartCommittee' && adjacent(source.coord, tile.coord));
}

// CORE-01-04-29/-31/-33: share target checks between the move catalog and the resolver.
export function disruptionTarget(G: CoreState, playerID: string, requested: DisruptionTarget) {
  const core = G.exp.core;
  if (!G.cfg.variants.disruption || core.pendingDisplacement) return undefined;
  const site = core.tiles.board.find(tile => tile.tileId === requested.tileId);
  if (!site) return undefined;
  const kind = core.allTiles[site.tileId].kind;
  if (requested.kind === 'counterLobby') {
    if (kind !== 'Committee' || core.counterLobbies?.some(effect => effect.tileId === site.tileId)) return undefined;
    const lobbyist = core.tiles.board.find(tile => tile.tileId === requested.lobbyistTileId);
    if (!lobbyist || core.allTiles[lobbyist.tileId].kind !== 'Lobbyist'
        || !getTopology(G.cfg.topology).adjacent(site.coord, lobbyist.coord)
        || !hasMarkerInRange(G, playerID, site, 2)) return undefined;
    const controller = getControl(G, lobbyist.coord);
    if (controller === null || controller === playerID) return undefined;
    return { kind: requested.kind, counterLobby: { tileId: site.tileId, lobbyistTileId: lobbyist.tileId, controller } };
  }
  if (requested.kind === 'displaceInfluence') {
    if (kind === 'StartCommittee' || core.displacedThisRound?.includes(playerID)) return undefined;
    const marker = core.influencesOnBoard?.find(item => item.id === requested.markerId && item.tileId === site.tileId);
    if (!marker || marker.owner === playerID || !hasMarkerInRange(G, playerID, site, 1)) return undefined;
    const destinations = displacementDestinations(G, site);
    if (!destinations.length) return undefined;
    return { kind: requested.kind, marker, destinations };
  }
  if (kind !== 'ResortTile' || core.damagedResorts?.some(damage => damage.tileId === site.tileId || damage.playerID === playerID)
      || !hasMarkerInRange(G, playerID, site, 2)) return undefined;
  const controller = getControl(G, site.coord);
  if (controller === null || controller === playerID) return undefined;
  return { kind: requested.kind, damage: { tileId: site.tileId, playerID } };
}
