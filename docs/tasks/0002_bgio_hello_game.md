# Task 0002 — boardgame.io Hello-Game (Hotseat + Network skeleton)

## Goal
Introduce a minimal boardgame.io game that can run:
- locally in hotseat mode via the React client
- over the network via a server package

This is a connectivity + wiring task, not rule implementation.

## Inputs
- boardgame.io docs / standard patterns
- AGENTS.md constraints

## Outputs
- `@bc/game` exports a minimal `Game` definition.
- `@bc/server` runs a boardgame.io server and exposes a lobby endpoint.
- `@bc/client-web` connects to:
  - local hotseat client (no server)
  - network mode (server URL)
- One example move that changes state deterministically (e.g., increment a counter).

## Constraints
- No rule logic from CORE yet (that begins in Task 0003).
- Must be deterministic (no Math.random without a seed).
- Keep all networking/persistence optional.

## Invariants
- Hotseat mode works without server.
- Network mode works with server.

## Acceptance Criteria
- Running `pnpm dev` launches client.
- Running `pnpm --filter @bc/server dev` starts server.
- Client can create/join a match and execute the example move in both modes.
- Vitest includes at least one test that runs `Game` reducer and asserts state.

## PR Checklist
- [ ] Hotseat and network paths both documented
- [ ] No production code imports from test-only helpers
- [ ] Deterministic example move
