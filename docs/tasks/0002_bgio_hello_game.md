# Task 0002 â€” boardgame.io Hello-Game (Hotseat + Network skeleton)

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

---

## Completion Protocol (MANDATORY)

When the implementation is finished, you MUST do all of the following before declaring the task complete:

1. Run:
   - pnpm lint
   - pnpm test
2. Update documentation:
   - /docs/changelog.md (required)
   - /docs/design-decisions/DD-XXXX-<topic>.md (if any architectural decision was made)
   - /docs/rules/ERRATA-XXXX.md (only if a rules ambiguity/defect was discovered; never for â€œconvenienceâ€)
3. Ensure repo hygiene:
   - No temporary files added
   - No dead state introduced when expansions are disabled
4. Fill the checklist below **in THIS FILE** with concrete results:
   - Use checked boxes [x]
   - Add short evidence notes (e.g., command output summary, file paths changed)
   - Do not leave placeholders

### Final Checklist (fill after completion)

- [x] pnpm lint passed (paste short summary): All packages lint: Done (no errors)
- [x] pnpm test passed (paste short summary):
```
shared: 1/1 passed
client-web: 1/1 passed
rules: 1/1 passed
game: 1/1 passed (client reducer increments)
bot-llm: 1/1 passed
server: 1/1 passed
```
- [x] Determinism verified (golden replay hash unchanged / added): n/a (no CORE rules yet; example move is deterministic)
- [x] No temporary files added: none (verified .gitignore; build artifacts ignored)
- [x] Rule references added in code (examples of references): non-normative hello-game only; documented in docs/design-decisions/DD-0002-vite-aliases-and-hello-game.md
- [x] Changelog updated: docs/changelog.md — added Task 0002 entry
- [x] Design decision doc added/updated: docs/design-decisions/DD-0002-vite-aliases-and-hello-game.md
- [x] Errata added/updated: n/a
- [x] Expansion isolation verified (disabled expansions leave no state): n/a (no expansions yet)
- [x] Bot contract checks (if touched): n/a
