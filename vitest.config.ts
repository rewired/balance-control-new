import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  resolve: {
    alias: [
      { find: '@bc/shared', replacement: path.resolve(__dirname, 'packages/shared/src/index.ts') },
      { find: '@bc/rules', replacement: path.resolve(__dirname, 'packages/rules/src/index.ts') },
      { find: '@bc/game', replacement: path.resolve(__dirname, 'packages/game/src/index.ts') },
      { find: '@bc/bot-llm', replacement: path.resolve(__dirname, 'packages/bot-llm/src/index.ts') },
      // Alias only the code entry points so asset subpaths resolve from the packages.
      { find: /^@bc\/exp-00-core$/, replacement: path.resolve(__dirname, 'packages/exp-00-core/src/index.ts') },
      { find: /^@bc\/exp-01-economy$/, replacement: path.resolve(__dirname, 'packages/exp-01-economy/src/index.ts') },
      { find: /^@bc\/exp-02-security$/, replacement: path.resolve(__dirname, 'packages/exp-02-security/src/index.ts') },
      { find: /^@bc\/exp-03-climate$/, replacement: path.resolve(__dirname, 'packages/exp-03-climate/src/index.ts') },
    ],
  },
  test: {
    environment: 'node',
    passWithNoTests: false,
  },
});
