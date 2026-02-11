import { defineConfig } from 'vite';
import path from 'node:path';

export default defineConfig({
  resolve: {
    alias: {
      '@bc/game': path.resolve(__dirname, '../game/src/index.ts'),
      '@bc/shared': path.resolve(__dirname, '../shared/src/index.ts'),
      '@bc/rules': path.resolve(__dirname, '../rules/src/index.ts'),
    },
  },
});
