import { describe, it, expect } from 'vitest';
import { drawUntilPlaceable } from './draw.js';
import type { BoardPlacement } from './types.js';

describe('Draw logic â€” CORE-01-04-06..07', () => {
  it('moves unplaceable tile to discard and redraws (simulated no-adjacency)', () => {
    const drawPile = ['T1','T2'];
    const discard: string[] = [];
    const board: BoardPlacement[] = [{ tileId: 'StartCommittee', coord: { q:0,r:0 } }];
        const res = drawUntilPlaceable(drawPile, discard, board, ((): any => false) as any);
    expect(res.drawn).toBeNull();
    expect(res.discardFaceUp).toEqual(['T1','T2']);
    expect(res.drawPile).toEqual([]);
  });
});



