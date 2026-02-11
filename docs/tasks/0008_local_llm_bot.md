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
