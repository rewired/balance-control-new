import { hexDistance, type AxialCoord, type CoreState } from '@bc/rules';

const costByHexDistance = [undefined, 0, 1, 3] as const;

// CORE-01-04-12A/-12B: only relocation uses the distance and price table.
export function influenceMoveCost(G: CoreState, sourceTileId: string | undefined, target: AxialCoord): number | undefined {
  if (!G.cfg.variants.influenceDistance || sourceTileId === undefined) return 0;
  const source = G.exp.core.tiles.board.find(({ tileId }) => tileId === sourceTileId);
  return source && costByHexDistance[hexDistance(source.coord, target)];
}

// CORE-01-08-01 and ADD56-01-03-00-01.
export function influenceLimit(G: CoreState): number {
  return G.cfg.addOn56 ? 8 : 7;
}

// CORE-01-05-06A and CORE-01-09-03: score only real Influence on Board.
export function boardInfluenceScores(G: CoreState) {
  const scores = Object.fromEntries(Object.keys(G.exp.core.players).map(playerID => [playerID, 0]));
  for (const { owner } of G.exp.core.influencesOnBoard ?? []) {
    if (Object.hasOwn(scores, owner)) scores[owner]++;
  }
  return Object.entries(scores);
}

// CORE-01-09-00.
export function influenceLimitWinners(G: CoreState): string[] {
  const limit = influenceLimit(G);
  return boardInfluenceScores(G).filter(([, count]) => count === limit).map(([playerID]) => playerID);
}
