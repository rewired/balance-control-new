# Changelog\n
## 2026-02-11 — Task 0001: Workspace skeleton & tooling
- Scaffolded pnpm workspace with packages: @bc/rules, @bc/game, @bc/server, @bc/client-web, @bc/bot-llm, @bc/shared.
- Added TypeScript strict base config with project references.
- Set up ESLint + Prettier across repo.
- Added Vitest with placeholder tests in each package.
- Created Vite React client that renders a placeholder and imports @bc/shared.
- Added .nvmrc (Node 20.11.1) and engines in root package.json.
- Added root scripts: build/lint/test/dev.

- Pinned packageManager to pnpm@10.18.0 to match local toolchain; removed UTF-8 BOMs from package.json files to fix vitest/Vite PostCSS config parsing during tests.
## 2026-02-11 — Task 0002: boardgame.io hello-game\n- Added minimal CounterGame with deterministic increment move (non-normative).\n- Wired @bc/server with boardgame.io Server and lobby (dev via tsx).\n- Updated client to support Hotseat and Network (Lobby) modes.\n- Replaced tsconfig-paths plugin with explicit Vite aliases for stability.\n- Fixed BOM issues in package.json files; normalized deps for boardgame.io.\n
## 2026-02-11 — Task 0003: Core state model\n- Added core types (zones, tiles, resources, influence) in @bc/rules.\n- Added zod GameConfig schema and seeded shuffle utility in @bc/shared.\n- Implemented deterministic setup builder (Start Committee on Board; others in DrawPile) and CoreGame wrapper.\n- Unit tests for starting Influence counts and tile totals with CORE references.\n
