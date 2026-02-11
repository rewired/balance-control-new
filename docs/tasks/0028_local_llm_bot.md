# Task 0008 — Local LLM Bot (Legal-Option Picker) — node-llama-cpp + fallback

## Goal
Add an LLM-driven bot player that runs **locally** (RTX 2070 / 8GB VRAM) alongside the game, without compromising determinism or rules legality.

The bot must choose **only** from enumerated legal options.

## Inputs
- AGENTS.md LLM Bot Contract (must follow)
- Core move schema definitions (from Tasks 0003–0007)

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
- [ ] No model files committed
- [ ] GPU is optional at runtime
- [ ] Bot does not bypass rules
- [ ] Clear docs on how to run with a local model

---

## Completion Protocol (MANDATORY)

When the implementation is finished, you MUST do all of the following before declaring the task complete:

1. Run:
   - pnpm lint
   - pnpm test
2. Update documentation:
   - /docs/changelog.md (required)
   - /docs/design-decisions/DD-XXXX-<topic>.md (if any architectural decision was made)
   - /docs/rules/ERRATA-XXXX.md (only if a rules ambiguity/defect was discovered; never for “convenience”)
3. Ensure repo hygiene:
   - No temporary files added
   - No dead state introduced when expansions are disabled
4. Fill the checklist below **in THIS FILE** with concrete results:
   - Use checked boxes [x]
   - Add short evidence notes (e.g., command output summary, file paths changed)
   - Do not leave placeholders

### Final Checklist (fill after completion)

- [ ] pnpm lint passed (paste short summary):
- [ ] pnpm test passed (paste short summary):
- [ ] Determinism verified (golden replay hash unchanged / added):
- [ ] No temporary files added:
- [ ] Rule references added in code (examples of references):
- [ ] Changelog updated: (path + brief entry summary)
- [ ] Design decision doc added/updated: (path or “n/a”)
- [ ] Errata added/updated: (path or “n/a”)
- [ ] Expansion isolation verified (disabled expansions leave no state):
- [ ] Bot contract checks (if touched): schema + illegal fallback tested