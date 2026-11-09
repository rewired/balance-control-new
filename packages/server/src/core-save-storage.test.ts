import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { State } from 'boardgame.io';
import { Client } from 'boardgame.io/client';
import { CreateGameReducer, InitializeGame } from 'boardgame.io/internal';
import { CoreGame, CounterGame, createBCGame, hashEngineState, migrateCoreMatchState, verifyMatchLog, type setupCoreMatch } from '@bc/game';
import { describe, expect, it } from 'vitest';
import { FlatFile } from '#boardgame-server';
import { CoreSaveStorage } from './core-save-storage.js';
import { readMatchLog } from './match-log-format.js';
import { logNetworkMatches } from './network-match-logs.js';

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
  it('exports authoritative persisted actions without exposing lobby data', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'bc-core-log-'));
    try {
      const storage = new CoreSaveStorage({ dir: join(dir, 'saves') });
      await storage.connect();
      const logs = join(dir, 'logs');
      logNetworkMatches(storage, logs);
      const initialState = InitializeGame({ game: CoreGame, numPlayers: 2, setupData: { matchSeed: 'network-log' } });
      await storage.createMatch('logged-match', { initialState, metadata: {
        gameName: 'core', players: { '0': { id: 0, name: 'private-name', credentials: 'private-credential' } },
        createdAt: 0, updatedAt: 0,
      } });
      expect((await storage.exportMatchLog('logged-match')).steps).toHaveLength(0);
      const reduce = CreateGameReducer({ game: CoreGame });
      const coord = initialState.G.exp.core.tiles.drawResolution!.legalCoords[0];
      for (const action of [
        { type: 'MAKE_MOVE', payload: { type: 'placeTile', args: [coord], playerID: '0' } },
        { type: 'UNDO', payload: { type: null, args: null, playerID: '0' } },
      ] as const) {
        const { state } = await storage.fetch('logged-match', { state: true });
        const next = reduce(state, action);
        expect(next._stateID).toBe(state._stateID + 1);
        await storage.setState('logged-match', next, next.deltalog);
      }
      const exported = await storage.exportMatchLog('logged-match');
      const serialized = JSON.stringify(exported);
      const written = await readMatchLog(join(logs, 'logged-match.match-log.jsonl'));
      expect(verifyMatchLog(written)).toEqual(exported);
      expect(serialized).not.toMatch(/private-name|private-credential/);
      expect(exported.setup.game.matchSeed).toBe('network-log');
      expect(exported.steps.map(step => step.action.kind)).toEqual(['move', 'undo']);
      expect(exported.steps[1].after.stateHash).toBe(exported.initial.stateHash);
      expect(verifyMatchLog(JSON.parse(serialized))).toEqual(exported);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it('keeps a saved match with a retired topology closed without rewriting its file', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'bc-core-save-'));
    try {
      const storage = new CoreSaveStorage({ dir });
      await storage.connect();
      const game = createBCGame();
      const start = InitializeGame({ game, numPlayers: 2 });
      const saved = { ...start, G: { ...start.G, cfg: { ...start.G.cfg, topology: 'orthogonal' } } };
      const metadata = { gameName: game.name!, players: { '0': { id: 0 }, '1': { id: 1 } }, createdAt: 0, updatedAt: 0 };
      await storage.createMatch('retired-topology', { initialState: saved, metadata });

      const loaded = await storage.fetch('retired-topology', { state: true, initialState: true });
      expect(loaded.state.ctx.gameover).toEqual({ unsupportedTopology: true });
      expect(loaded.initialState.ctx.gameover).toEqual({ unsupportedTopology: true });
      expect(loaded.state.G).toEqual(json(saved.G));

      const raw = new FlatFile({ dir });
      await raw.connect();
      expect((await raw.fetch('retired-topology', { state: true })).state).toEqual(json(saved));
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

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
