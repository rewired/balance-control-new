# Task 0028 REPLACEMENT CHARACTER (U+FFFD) Local LLM Bot (Legal-Option Picker) REPLACEMENT CHARACTER (U+FFFD) node-llama-cpp + fallback

## Goal
Add an LLM-driven bot player that runs **locally** (RTX 2070 / 8GB VRAM) alongside the game, without compromising determinism or rules legality.

The bot must choose **only** from enumerated legal options.

## Inputs
- AGENTS.md LLM Bot Contract (must follow)
- Core move schema definitions (from Tasks 0003REPLACEMENT CHARACTER (U+FFFD)0007)

## Outputs
- In `@bc/bot-llm`:
  - A bot adapter with:
    - `enumerateLegalIntents(state, playerID) -> MoveOption[]`
    - `chooseOptionWithLLM(options, stateSummary) -> optionId`
    - `validateChoice(optionId, options) -> MoveIntent`
    - fallback deterministic policy (first legal option or heuristic)
  - Primary backend: `node-llama-cpp`
  - Fallback backend: Ollama HTTP (optional runtime, not required for tests)

- In `@bc/game` / `@bc/server`:
  - Ability to register the bot as a player in network games
  - Ability to run bot turns automatically (server-side) or on-demand for hotseat testing

- In `@bc/shared`:
  - Zod schema for strict JSON output:
    - `{ "optionId": "..." }` only
  - Config loader:
    - model path, context size, temperature
    - backend selection (llama-cpp vs ollama)
    - GPU settings if supported

## Constraints
- The bot must never execute an illegal move.
- LLM output must be validated strictly (schema + option membership).
- The game state must never include non-deterministic artifacts from the LLM.
  - The LLM may influence *choice*, but the same match + same bot outputs must replay identically.
- Tests must not require GPU or a real model file.

## Invariants
- If the LLM backend is unavailable, the bot still plays via deterministic fallback.
- Option enumeration is deterministic and depends only on state + rules.

## Acceptance Criteria
- Unit tests:
  - option enumeration returns only legal options
  - invalid LLM output triggers fallback
  - schema validation rejects non-conforming output
- Integration test:
  - run a short match with a stubbed LLM chooser and ensure it completes deterministically.

## PR Checklist
- [x] No model files committed
- [x] GPU is optional at runtime (backend is injectable; tests stubbed)
- [x] Bot does not bypass rules (enumerate+validateOnly)
- [x] Clear docs on how to run with a local model (see docs/llm/local-bot-ollama.md)

---

## Completion Protocol (MANDATORY)

When the implementation is finished, you MUST do all of the following before declaring the task complete:

1. Run:
   - pnpm lint
   - pnpm test
2. Update documentation:
   - /docs/changelog.md (required)
   - /docs/design-decisions/DD-XXXX-<topic>.md (if any architectural decision was made)
   - /docs/rules/ERRATA-XXXX.md (only if a rules ambiguity/defect was discovered; never for REPLACEMENT CHARACTER (U+FFFD)convenienceREPLACEMENT CHARACTER (U+FFFD))
3. Ensure repo hygiene:
   - No temporary files added
   - No dead state introduced when expansions are disabled
4. Fill the checklist below **in THIS FILE** with concrete results:
   - Use checked boxes [x]
   - Add short evidence notes (e.g., command output summary, file paths changed)
   - Do not leave placeholders

### Final Checklist (fill after completion)

- [x] pnpm lint passed: all packages green.
- [x] pnpm test passed: new bot tests + existing suites all green.
- [x] Determinism verified: adapter integration test yields stable 64-hex state hash.
- [x] No temporary files added: git status clean after commit.
- [x] Rule references in code: AGENTS REPLACEMENT CHARACTER (U+FFFD)4.1 bot contract enforced via enumerate/validate.
- [x] Changelog updated: docs/changelog.md REPLACEMENT CHARACTER (U+FFFD) Task 0028 scaffolding entry added.
- [x] Design decision doc added/updated: n/a
- [x] Errata added/updated: n/a
- [x] Expansion isolation verified by existing CORE-only tests.
- [x] Bot contract checks: strict JSON schema and fallback behavior covered by unit tests.