/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach } from 'vitest';
import { createBCGame } from './factory.js';
import { CorePhases } from './core.turns.js';
import { registerExpansion, __resetRegisteredExpansionsForTest, type ExpansionModule, ensureExpansionSlice } from '@bc/rules';

function makeBlockingModule(): ExpansionModule {
  return {
    id: 'exp01',
    registerResources: () => void 0,
    setupExpansionState: (G) => { ensureExpansionSlice(G, 'exp01', {} as Record<string, unknown>); },
    hooks: {
      prohibitions: ({ effect }) => {
        if ((effect as any).kind === 'placeTile' && (effect as any).contextCoord?.q === 1 && (effect as any).contextCoord?.r === 0) return true;
        return false;
      },
    },
  };
}

describe('PlaceTile prohibitions via resolver - Task 0020 Phase 2', () => {
  beforeEach(() => { __resetRegisteredExpansionsForTest(); });

  it('blocks placement at prohibited coord', () => {
    registerExpansion(makeBlockingModule());
    const Game = createBCGame({ expansions: { exp01: true } });
    const setup = Game.setup as unknown as (ctx: { matchID: string; numPlayers: number; setupData?: unknown }) => any;
    const G = setup({ matchID: 't', numPlayers: 2, setupData: { expansions: { exp01: true } } });

    // trigger onBegin to generate a pending offer
    CorePhases.DrawAndPlaceTile.onBegin!({ G } as any);
    const pending = (G as any).turn?.pending;
    expect(pending).toBeDefined();

    const move = (coord: { q:number; r:number }) => (CorePhases.DrawAndPlaceTile.moves as any).placeTile({ G } as any, coord);

    // Attempt prohibited placement at {1,0}
    move({ q: 1, r: 0 });

    // Assert: board does not contain the pending tile at prohibited coord and pending still present
    const hasAtProhibited = (G as any).tiles.board.some((p: any) => p.coord.q === 1 && p.coord.r === 0 && p.tileId === pending.tileId);
    expect(hasAtProhibited).toBe(false);
    expect((G as any).turn?.pending).toBeDefined();
  });
});
