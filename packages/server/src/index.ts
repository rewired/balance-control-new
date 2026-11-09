import { Server } from '#boardgame-server';
import { join } from 'node:path';
import { CoreGame, CounterGame } from '@bc/game';
import { CoreSaveStorage } from './core-save-storage.js';
import { addOllamaRoutes } from './ollama-routes.js';
import { logsDirectory, matchLogDirectory } from './match-log-path.js';
import { logNetworkMatches } from './network-match-logs.js';
import { addHotseatLogRoute } from './hotseat-match-logs.js';

const PORT = Number(process.env.PORT) || 8000;
const origins = [
  'http://localhost:5173',
  'https://localhost:5173',
  'http://127.0.0.1:5173',
  'https://127.0.0.1:5173',
];

const saveDirectory = process.env.FLATFILE_DIR;
const server = Server({
  games: [CounterGame, CoreGame],
  db: saveDirectory ? new CoreSaveStorage({ dir: await matchLogDirectory(saveDirectory) }) : undefined,
  // Dev-only permissive origin; tightened in later tasks
  origins,
});

addOllamaRoutes(server.router, origins);
addHotseatLogRoute(server.router, origins, join(logsDirectory, 'hotseat'));
logNetworkMatches(server.db, join(logsDirectory, 'network'));
server.run(PORT);
console.log(`boardgame.io server running on http://localhost:${PORT}`);
