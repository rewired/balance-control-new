import { describe, it, expect } from 'vitest';
import { adjacent } from '@bc/rules';
import { getTopology } from '@bc/rules';
import { isLegalPlacement, legalPlacementCoords } from './placement.js';
import type { BoardPlacement } from '@bc/rules';

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

  it('enumerates only the neighbors from the configured attachment', () => {
    const board: BoardPlacement[] = [{ tileId: 'StartCommittee', coord: { q:0,r:0 } }];
    const legal = legalPlacementCoords(board, getTopology('orthogonal'));
    expect(legal).toHaveLength(4);
    expect(legal).not.toContainEqual({ q: 1, r: -1 });
  });
});
