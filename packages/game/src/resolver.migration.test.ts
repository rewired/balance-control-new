/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach } from 'vitest';
import { createBCGame } from './factory.js'; import { CorePhases } from './core.turns.js';
import { registerExpansion, __resetRegisteredExpansionsForTest, createExpansionRegistry, ensureExpansionSlice, type ExpansionModule, type CoreState } from '@bc/rules';
import { type MoveDefinition, type MoveExtensionBuilder } from '@bc/rules';
import { createResolver } from '@bc/rules';

const TestPayload: any = { parse: (x: unknown) => x };

function makeTestModule(): ExpansionModule {
  return {
    id: 'exp01',
    registerResources: () => void 0,
    setupExpansionState: (G) => { ensureExpansionSlice(G, 'exp01', {} as Record<string, unknown>); },
    extendMoves: ({ add }: MoveExtensionBuilder) => {
      const def: MoveDefinition<any> = {
        type: 'testAddDom',
        payloadSchema: TestPayload,
        execute: (G: CoreState, p) => {
          const mods = createExpansionRegistry({ exp01: true, exp02: false, exp03: false });
          const resolve = createResolver(mods);
          resolve(G, { kind: 'addResources', playerID: p.playerID, resource: 'DOM', amount: p.amount, contextCoord: p.contextCoord });
        },
      };
      add(def as unknown as MoveDefinition<unknown>);
    },
    hooks: {
      costIncreases: ({ cost }) => {
        if (cost) cost.DOM = (cost.DOM ?? 0) + 1; else return { DOM: 1 };
      },
    },
  };
}

describe('Resolver enforcement via move routing — Task 0020', () => {
  beforeEach(() => { __resetRegisteredExpansionsForTest(); });

  it('cost increase applies on normal tile (fails), but is ignored on Start Committee', () => {
    registerExpansion(makeTestModule());
    const Game = createBCGame({ expansions: { exp01: true } });
    const setup = Game.setup as unknown as (ctx: { matchID: string; numPlayers: number; setupData?: unknown }) => CoreState;
    const G = setup({ matchID: 't', numPlayers: 2, setupData: { expansions: { exp01: true } } });

    const move = (action: any) => (CorePhases.ExactlyOnePoliticalAction.moves as any).doPoliticalAction({ G, ctx: { playOrderPos: 0, playOrder: ['0','1'] } } as any, action);

    // Normal tile context (q:1,r:0) ? cost increase makes it unpayable -> no gain
    move({ type: 'testAddDom', payload: { playerID: '0', amount: 1, contextCoord: { q: 1, r: 0 } } });
    expect(G.players['0'].personal.resources.DOM).toBe(0);

    // Start Committee context (q:0,r:0) ? immunity ignores cost increases -> gain applies
    move({ type: 'testAddDom', payload: { playerID: '0', amount: 1, contextCoord: { q: 0, r: 0 } } });
    expect(G.players['0'].personal.resources.DOM).toBe(1);
  });
});


