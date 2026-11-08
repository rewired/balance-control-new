import { Client } from 'boardgame.io/client';
import { describe, it, expect, beforeEach } from 'vitest';
import { createBCGame } from './factory.js';
import { registerExpansion, __resetRegisteredExpansionsForTest, createExpansionRegistry, ensureExpansionSlice, createResolver, z, type ExpansionModule } from '@bc/rules';

const TestPayload = z.object({ contextCoord: z.object({ q: z.number(), r: z.number() }) }).strict();

function makeTestModule(): ExpansionModule {
  return {
    id: 'exp01',
    registerResources: () => {},
    setupExpansionState: (G) => { ensureExpansionSlice(G, 'exp01', {}); },
    extendMoves: ({ add }) => {
      add({
        type: 'testAddDom',
        payloadSchema: TestPayload,
        execute: (G, playerID, payload) => {
          const { contextCoord } = TestPayload.parse(payload);
          const resolve = createResolver(createExpansionRegistry(G.cfg.expansions));
          return resolve(G, { kind: 'addResources', playerID, resource: 'DOM', amount: 1, contextCoord });
        },
      });
    },
    hooks: {
      costIncreases: ({ effect }) => effect.kind === 'addResources' ? { DOM: 1 } : undefined,
    },
  };
}

describe('Resolver enforcement via engine move routing', () => {
  beforeEach(() => { __resetRegisteredExpansionsForTest(); });

  it('rejects an unpayable effect without spending the slot, then accepts the immune context', () => {
    registerExpansion(makeTestModule());
    const client = Client({ game: createBCGame({ expansions: { exp01: true } }), numPlayers: 2 });
    client.moves.placeTile({ q: 1, r: 0 });
    const before = client.getState()!;

    client.moves.doPoliticalAction({ type: 'testAddDom', payload: { contextCoord: { q: 1, r: 0 } } });
    const rejected = client.getState()!;
    expect(rejected._stateID).toBe(before._stateID);
    expect(rejected.G.exp.core.players['0'].personal.resources.DOM).toBe(0);
    expect(rejected.ctx).toEqual(before.ctx);

    client.moves.doPoliticalAction({ type: 'testAddDom', payload: { contextCoord: { q: 0, r: 0 } } });
    const accepted = client.getState()!;
    expect(accepted.G.exp.core.players['0'].personal.resources.DOM).toBe(1);
    expect(accepted.ctx.currentPlayer).toBe('1');
    expect(accepted.ctx.activePlayers).toEqual({ '1': 'DrawAndPlaceTile' });
  });
});
