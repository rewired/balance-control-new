import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Client } from 'boardgame.io/client';
import { CreateGameReducer } from 'boardgame.io/internal';
import { CoreGame, createMatchLogRecorder, verifyMatchLog } from '@bc/game';
import { expect, it, vi } from 'vitest';
import { Server } from '#boardgame-server';
import { addHotseatLogRoute } from './hotseat-match-logs.js';
import { parseMatchLogJsonl, readMatchLog } from './match-log-format.js';
import { logNetworkMatches } from './network-match-logs.js';

it('saves local Hotseat and in-memory network matches to their own files', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'bc-automatic-logs-'));
  const origin = 'http://localhost:5173';
  const server = Server({ games: [CoreGame], origins: [origin] });
  addHotseatLogRoute(server.router, [origin], join(dir, 'hotseat'));
  logNetworkMatches(server.db, join(dir, 'network'));
  const running = await server.run(0);
  try {
    const address = running.appServer.address();
    if (!address || typeof address === 'string') throw new Error('Expected a local TCP port');
    const baseURL = `http://127.0.0.1:${address.port}`;
    const matchID = '00000000-0000-4000-8000-000000000001';
    const client = Client({ game: CoreGame, numPlayers: 2, playerID: '0' });
    const initial = client.store.getState();
    const recorder = createMatchLogRecorder(initial, { mode: 'hotseat', matchID });
    const first = recorder.log;
    client.moves.placeTile(initial.G.exp.core.tiles.drawResolution!.legalCoords[0]);
    const placed = client.store.getState();
    const latest = recorder.record(placed, placed.deltalog ?? []);
    const upload = (log: unknown, from = origin) => fetch(`${baseURL}/match-logs/hotseat/${matchID}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json', Origin: from }, body: JSON.stringify(log),
    });
    const preflight = await fetch(`${baseURL}/match-logs/hotseat/${matchID}`, {
      method: 'OPTIONS', headers: { Origin: origin, 'Access-Control-Request-Method': 'PUT' },
    });
    expect(preflight.headers.get('access-control-allow-methods')).toContain('PUT');
    expect((await upload(latest, 'http://untrusted.test')).status).toBe(403);
    expect((await upload({ ...latest, result: 'invalid' })).status).toBe(400);
    expect((await upload(latest)).status).toBe(204);
    expect((await upload(first)).status).toBe(204);
    const hotseat = join(dir, 'hotseat', `${matchID}.match-log.jsonl`);
    expect(verifyMatchLog(await readMatchLog(hotseat))).toEqual(latest);
    const contents = await readFile(hotseat, 'utf8');
    const [header, step] = contents.trimEnd().split('\n');
    expect(JSON.parse(step)).toEqual(latest.steps[0]);
    expect(() => parseMatchLogJsonl(header + '\n')).toThrow(/action count/);

    const legacy = join(dir, 'legacy.match-log.json');
    await writeFile(legacy, JSON.stringify(latest, null, 2) + '\n');
    expect(verifyMatchLog(await readMatchLog(legacy))).toEqual(latest);

    const response = await fetch(`${baseURL}/games/core/create`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ numPlayers: 2 }),
    });
    expect(response.ok).toBe(true);
    const { matchID: networkID } = await response.json() as { matchID: string };
    const { state } = await server.db.fetch(networkID, { state: true });
    const reduce = CreateGameReducer({ game: CoreGame });
    const coord = state.G.exp.core.tiles.drawResolution!.legalCoords[0];
    const placedNetwork = reduce(state, { type: 'MAKE_MOVE', payload: { type: 'placeTile', args: [coord], playerID: '0' } });
    await server.db.setState(networkID, placedNetwork, placedNetwork.deltalog);
    await vi.waitFor(async () => {
      const network = await readMatchLog(join(dir, 'network', `${networkID}.match-log.jsonl`));
      const verified = verifyMatchLog(network);
      expect(verified.source).toEqual({ mode: 'network', matchID: networkID, networkStorage: 'memory' });
      expect(verified.steps).toHaveLength(1);
    });
  } finally {
    server.kill(running);
    await rm(dir, { recursive: true, force: true });
  }
});
