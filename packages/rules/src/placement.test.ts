import { describe, it, expect } from 'vitest';
import { adjacent } from './topology/hex.js';
import { isLegalPlacement, legalPlacementCoords } from './placement.js';
import type { BoardPlacement } from './types.js';

describe('Hex adjacency and placement — CORE-01-04-05/08', () => {
  it('adjacent axial neighbors match expected set', () => {
    expect(adjacent({ q:0, r:0 }, { q:1, r:0 })).toBe(true);
    expect(adjacent({ q:0, r:0 }, { q:2, r:0 })).toBe(false);
  });

  it('legal placement next to Start Committee works; same coord illegal', () => {
    const board: BoardPlacement[] = [{ tileId: 'StartCommittee', coord: { q:0,r:0 } }];
    expect(isLegalPlacement(board, { q:1, r:0 })).toBe(true);
    expect(isLegalPlacement(board, { q:0, r:0 })).toBe(false);
  });

  it('unplaceable drawn tile would be discarded (simulated via no-adjacency)', () => {
    const board: BoardPlacement[] = [{ tileId: 'StartCommittee', coord: { q:0,r:0 } }];
    const legal = legalPlacementCoords(board, ((a: {q:number;r:number}, b: {q:number;r:number}) => false));
    expect(legal.length).toBe(0);
  });
});

