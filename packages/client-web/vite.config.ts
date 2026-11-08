import { defineConfig } from 'vite';
import path from 'node:path';

export default defineConfig({
  resolve: {
    alias: {
      '@bc/game': path.resolve(__dirname, '../game/src/index.ts'),
      '@bc/shared': path.resolve(__dirname, '../shared/src/index.ts'),
      '@bc/rules': path.resolve(__dirname, '../rules/src/index.ts'),
      '@bc/exp-01-economy': path.resolve(__dirname, '../exp-01-economy/src/index.ts'),
      '@bc/exp-00-core': path.resolve(__dirname, '../exp-00-core/src/index.ts'),
      '@bc/exp-02-security': path.resolve(__dirname, '../exp-02-security/src/index.ts'),
      '@bc/exp-03-climate': path.resolve(__dirname, '../exp-03-climate/src/index.ts'),
    },
  },
});
