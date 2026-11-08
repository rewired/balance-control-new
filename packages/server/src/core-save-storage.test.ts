import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { State } from 'boardgame.io';
import { Client } from 'boardgame.io/client';
import { CreateGameReducer, InitializeGame } from 'boardgame.io/internal';
import { CounterGame, createBCGame, hashEngineState, migrateCoreMatchState, type setupCoreMatch } from '@bc/game';
import { describe, expect, it } from 'vitest';
import { FlatFile } from '#boardgame-server';
import { CoreSaveStorage } from './core-save-storage.js';

type CoreG = ReturnType<typeof setupCoreMatch>;

function legacyG({ exp: { core, ...optional }, ...metadata }: CoreG) {
  return { ...metadata, ...core, ...(Object.keys(optional).length ? { exp: optional } : {}) };
}

function legacySave({ G, _undo, _redo, ...engine }: State<CoreG>) {
  return {
    ...engine, G: legacyG(G),
    _undo: _undo.map(entry => ({ ...entry, G: legacyG(entry.G) })),
    _redo: _redo.map(entry => ({ ...entry, G: legacyG(entry.G) })),
  };
}

function json(value: unknown): unknown {
  return JSON.parse(JSON.stringify(value));
}

describe('CORE saves in boardgame.io FlatFile storage', () => {
  it.each([{}, { exp01: true }, { exp01: true, exp02: true, exp03: true }])('loads and continues a legacy match with %j', async expansions => {
    const dir = await mkdtemp(join(tmpdir(), 'bc-core-save-'));
    try {
      const original = new FlatFile({ dir });
      await original.connect();
      const game = createBCGame({ matchSeed: 'legacy-save', expansions });
      const client = Client({ game, numPlayers: 2, playerID: '0' });
      const initial = client.store.getState();
      const { tileId, legalCoords } = initial.G.exp.core.tiles.drawResolution!;
      client.moves.placeTile(legalCoords[0]);
      const placed = client.store.getState();
      client.undo();
      const saved = client.store.getState();
      expect(saved._undo).toHaveLength(1);
      expect(saved._redo).toHaveLength(1);
      const legacy = legacySave(saved);
      const metadata = { gameName: game.name!, players: { '0': { id: 0 }, '1': { id: 1 } }, createdAt: 0, updatedAt: 0 };
      await original.createMatch('core', { initialState: legacySave(initial), metadata });
      await original.setState('core', legacy, placed.deltalog);

      const storage = new CoreSaveStorage({ dir });
      await storage.connect();
      const loaded = await storage.fetch('core', { state: true, initialState: true, metadata: true, log: true });
      expect(loaded.state).toEqual(json(saved));
      expect(loaded.initialState).toEqual(json(initial));
      expect(loaded.metadata).toEqual(metadata);
      expect(loaded.log).toEqual(json(placed.deltalog));
      expect(migrateCoreMatchState(loaded.state)).toBe(loaded.state);
      expect((await original.fetch('core', { state: true })).state).toEqual(json(legacy));

      const reduce = CreateGameReducer({ game });
      const resumed = reduce(loaded.state, { type: 'REDO', payload: { playerID: '0' } });
      expect(resumed.G).toEqual(json(placed.G));
      expect(resumed.ctx.activePlayers).toEqual({ '0': 'ExactlyOnePoliticalAction' });
      const parameters = { type: 'placeOrMoveInfluence', payload: {
        markerId: resumed.G.exp.core.players['0'].personal.influence[0].id, targetTileId: tileId,
      } };
      const next = reduce(resumed, { type: 'MAKE_MOVE', payload: { type: 'doPoliticalAction', playerID: '0', args: [parameters] } });
      client.redo();
      client.moves.doPoliticalAction(parameters);
      expect(next.ctx.turn).toBe(2);
      expect(hashEngineState(next)).toBe(hashEngineState(client.store.getState()));
      await storage.setState('core', next, next.deltalog);
      expect((await original.fetch('core', { state: true })).state).toEqual(json(next));
      expect((await storage.fetch('core', { state: true })).state).toEqual(json(next));

      const counter = InitializeGame({ game: CounterGame, numPlayers: 2 });
      await original.createMatch('counter', { initialState: counter, metadata: { ...metadata, gameName: CounterGame.name! } });
      expect((await storage.fetch('counter', { state: true })).state).toEqual(json(counter));
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
});
