import { Client } from 'boardgame.io/client';
import { describe, it, expect, beforeEach } from 'vitest';
import { createBCGame } from './factory.js';
import { engineMoveOptions } from './legal-options.js';
import { registerExpansion, __resetRegisteredExpansionsForTest, type ExpansionModule, ensureExpansionSlice } from '@bc/rules';

function makeBlockingModule(): ExpansionModule {
  return {
    id: 'exp01',
    registerResources: () => {},
    setupExpansionState: (G) => { ensureExpansionSlice(G, 'exp01', {}); },
    hooks: {
      prohibitions: ({ effect }) => effect.kind === 'placeTile' && effect.coord.q === 1 && effect.coord.r === 0,
    },
  };
}

describe('PlaceTile prohibitions via the engine', () => {
  beforeEach(() => { __resetRegisteredExpansionsForTest(); });

  it('keeps the offered tile and draw stage after a rejected placement', () => {
    registerExpansion(makeBlockingModule());
    const client = Client({ game: createBCGame({ expansions: { exp01: true } }), numPlayers: 2 });
    const before = client.getState()!;
    const options = engineMoveOptions(before.G, before.ctx, '0');
    expect(options.every(option => option.moveType === 'placeTile')).toBe(true);
    expect(options.map(option => option.parameters[0])).not.toContainEqual({ q: 1, r: 0 });

    client.moves.doPoliticalAction({
      type: 'placeOrMoveInfluence', payload: { markerId: 'INF-0-1', targetTileId: before.G.exp.core.tiles.drawResolution!.tileId },
    });
    client.moves.placeTile({ q: 1, r: 0 });
    const rejected = client.getState()!;
    expect(rejected._stateID).toBe(before._stateID);
    expect(rejected.G).toEqual(before.G);
    expect(rejected.ctx).toEqual(before.ctx);

    client.moves.placeTile({ q: 0, r: 1 });
    const accepted = client.getState()!;
    expect(accepted.G.exp.core.tiles.board).toContainEqual({ tileId: before.G.exp.core.tiles.drawResolution!.tileId, coord: { q: 0, r: 1 } });
    expect(accepted.ctx.activePlayers).toEqual({ '0': 'ExactlyOnePoliticalAction' });
  });
});
