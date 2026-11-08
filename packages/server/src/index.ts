import { Server } from '#boardgame-server';
import { CoreGame, CounterGame } from '@bc/game';
import { CoreSaveStorage } from './core-save-storage.js';

const PORT = Number(process.env.PORT) || 8000;

const server = Server({
  games: [CounterGame, CoreGame],
  db: process.env.FLATFILE_DIR ? new CoreSaveStorage({ dir: process.env.FLATFILE_DIR }) : undefined,
  // Dev-only permissive origin; tightened in later tasks
  origins: [
    'http://localhost:5173',
    'https://localhost:5173',
    'http://127.0.0.1:5173',
    'https://127.0.0.1:5173',
  ],
});

server.run(PORT);
console.log(`boardgame.io server running on http://localhost:${PORT}`);
