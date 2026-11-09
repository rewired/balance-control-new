import { Server } from '#boardgame-server';
import { CoreGame, CounterGame } from '@bc/game';
import { CoreSaveStorage } from './core-save-storage.js';
import { addOllamaRoutes } from './ollama-routes.js';
import { matchLogDirectory } from './match-log-path.js';

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
server.run(PORT);
console.log(`boardgame.io server running on http://localhost:${PORT}`);
