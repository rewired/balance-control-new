import type { AxialCoord, BoardPlacement } from './types.js';
import { legalPlacementCoords, AdjacentFn } from './placement.js';

export interface DrawResult {
  drawn: string | null;
  drawPile: string[];
  discardFaceUp: string[];
  legalCoords: AxialCoord[];
}

// CORE-01-04-06..07: If drawn tile cannot be legally placed, move to DiscardFaceUp and draw again.
export function drawUntilPlaceable(
  drawPile: string[],
  discardFaceUp: string[],
  board: BoardPlacement[],
  adjacent: AdjacentFn,
): DrawResult {
  const pile = drawPile.slice();
  const disc = discardFaceUp.slice();
  while (pile.length > 0) {
    const tileId = pile.shift()!; // draw from top
    const legal = legalPlacementCoords(board, adjacent);
    if (legal.length > 0) {
      return { drawn: tileId, drawPile: pile, discardFaceUp: disc, legalCoords: legal };
    }
    disc.push(tileId);
  }
  return { drawn: null, drawPile: pile, discardFaceUp: disc, legalCoords: [] };
}