import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  resolve: {
    alias: {
      '@bc/shared': path.resolve(__dirname, 'packages/shared/src/index.ts'),
      '@bc/rules': path.resolve(__dirname, 'packages/rules/src/index.ts'),
      '@bc/game': path.resolve(__dirname, 'packages/game/src/index.ts'),
    },
  },
  test: {
    environment: 'node',
    passWithNoTests: false,
  },
});
