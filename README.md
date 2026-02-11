# BALANCE // CONTROL — Monorepo Skeleton

- Node LTS: 20.11.x (`.nvmrc` provided)
- Package manager: pnpm 9

## Commands
- `pnpm install` — install workspace deps
- `pnpm dev` — start web client (Vite)
- `pnpm build` — build all packages (`tsc -b` / Vite)
- `pnpm test` — run vitest in all packages
- `pnpm lint` — run eslint across workspace

## Packages
- `@bc/shared` — shared utils (TypeScript lib)
- `@bc/rules` — domain types & helpers
- `@bc/game` — boardgame.io game def (later)
- `@bc/server` — multiplayer server (later)
- `@bc/client-web` — React client via Vite
- `@bc/bot-llm` — LLM bot adapter (later)
## Running the Hello Game (Task 0002)

- Hotseat: `pnpm dev` then open http://localhost:5173 (click “Hotseat”).
- Network: in one terminal `pnpm --filter @bc/server dev` (runs on 8000). In another terminal `pnpm dev`, switch to “Network”. Optionally set `VITE_SERVER_URL=http://localhost:8000` when running the client.

The example increment move is non-normative and exists only to validate wiring.
