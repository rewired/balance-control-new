# BALANCE // CONTROL

- Node.js 24 LTS (`.nvmrc` pins 24.22.2)
- Package manager: pnpm 10

## Commands
- `pnpm install` - install workspace deps
- `pnpm dev` - start web client (Vite)
- `pnpm build` - build all packages (`tsc -b` / Vite)
- `pnpm test` - run vitest in all packages
- `pnpm lint` - run eslint across workspace

## Packages
- `@bc/shared` - shared utils (TypeScript lib)
- `@bc/rules` - domain types & helpers
- `@bc/game` - boardgame.io game definition
- `@bc/server` - multiplayer server
- `@bc/client-web` - React client via Vite
- `@bc/bot-llm` - LLM bot adapter
## Playing in the browser

- Hotseat: run `pnpm dev` and open http://localhost:5173. Choose the player count and expansions, then start the match on the same device.
- Against the computer: in **Hotseat**, set **Computer opponents** to `1` or more. For a solo game, fill every seat except one with a computer opponent. The bots run in your browser without Ollama or a game server.
- Network: run `pnpm --filter @bc/server dev` on port 8000, then run `pnpm dev` and choose Network. Enter a player name, choose expansions in **New network match**, and join the created match from the list. Set `VITE_SERVER_URL` when using a different server address.
- In either mode, **Variants** lets you enable tile recycling and the first-player handicap independently.
- Leave **Seed (optional)** blank for a fresh seed. To repeat an opening, copy the seed from the match header and enter it with the same match settings.
- In a match with expansions, use **Measures** to browse the market and hands. Select a card to read its rules and choose a legal action with its target and payment. Security matches also show **Regulations**, with links to the affected tiles.
- For the playtest instructions, see [Task 0031](docs/tasks/0031_core_hotseat_playtest.md).


## LLM Bot (Local)
The [Ollama runbook](docs/llm/local-bot-ollama.md) describes the separate terminal runner for testing a local language model.
