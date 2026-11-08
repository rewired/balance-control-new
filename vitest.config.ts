import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  resolve: {
    alias: {
      '@bc/shared': path.resolve(__dirname, 'packages/shared/src/index.ts'),
      '@bc/rules': path.resolve(__dirname, 'packages/rules/src/index.ts'),
      '@bc/game': path.resolve(__dirname, 'packages/game/src/index.ts'),
      '@bc/bot-llm': path.resolve(__dirname, 'packages/bot-llm/src/index.ts'),
      '@bc/exp-01-economy': path.resolve(__dirname, 'packages/exp-01-economy/src/index.ts'),
      '@bc/exp-00-core': path.resolve(__dirname, 'packages/exp-00-core/src/index.ts'),
      '@bc/exp-02-security': path.resolve(__dirname, 'packages/exp-02-security/src/index.ts'),
      '@bc/exp-03-climate': path.resolve(__dirname, 'packages/exp-03-climate/src/index.ts'),
    },
  },
  test: {
    environment: 'node',
    passWithNoTests: false,
  },
});
