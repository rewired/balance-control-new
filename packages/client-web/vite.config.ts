import { defineConfig } from 'vite';
import path from 'node:path';

export default defineConfig({
  server: {
    fs: { deny: ['.env', '.env.*', '*.{crt,pem}', '**/.git/**', '**/logs/**'] },
  },
  resolve: {
    alias: [
      { find: '@bc/bot-llm', replacement: path.resolve(__dirname, '../bot-llm/src/index.ts') },
      { find: '@bc/game', replacement: path.resolve(__dirname, '../game/src/index.ts') },
      { find: '@bc/shared', replacement: path.resolve(__dirname, '../shared/src/index.ts') },
      { find: '@bc/rules', replacement: path.resolve(__dirname, '../rules/src/index.ts') },
      // Alias only the code entry points so asset subpaths resolve from the packages.
      { find: /^@bc\/exp-00-core$/, replacement: path.resolve(__dirname, '../exp-00-core/src/index.ts') },
      { find: /^@bc\/exp-01-economy$/, replacement: path.resolve(__dirname, '../exp-01-economy/src/index.ts') },
      { find: /^@bc\/exp-02-security$/, replacement: path.resolve(__dirname, '../exp-02-security/src/index.ts') },
      { find: /^@bc\/exp-03-climate$/, replacement: path.resolve(__dirname, '../exp-03-climate/src/index.ts') },
    ],
  },
});
