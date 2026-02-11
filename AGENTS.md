# AGENTS.md — BALANCE // CONTROL (Software Edition)

This repository contains the TypeScript implementation of **BALANCE // CONTROL** using **boardgame.io** as the rules engine, with:

* Hotseat play (single device)
* Network multiplayer (server + lobby)
* LLM-driven bot (local model running alongside the game)

This file is the operational contract for Codex (and humans). Follow it strictly.

---

# 0. Non-Negotiables

## 0.1 Rules are Source of Truth

The game must implement the normative rule specifications in `/docs/rules/`:

* `000-core.md` — CORE-01 Simulation Specification (v1.0.14)
* `001-expansion01.md` — EXP-01 Economy & Labor (v1.3)
* `002-expansion02.md` — EXP-02 Security & Order (v1.0)
* `003-expansion03.md` — EXP-03 Climate & Future (v1.0)
* `notation.md` — Notation Specification (informative, non-normative)

No implicit rules.
If something is not stated in the specs, it does not exist.

---

## 0.2 Determinism

* All game state transitions must be deterministic.
* Randomness must be seeded and derived from the game state / match seed.
* A replay of the same match with the same actions must yield identical results.
* No reliance on system time, Math.random, or non-seeded randomness.

---

## 0.3 Use NPM Solutions

Prefer existing, maintained npm packages over custom implementations.
Only build custom code for domain-specific rules.

---

## 0.4 Keep the Repo Clean

* Do not generate or commit temporary files.
* If tooling creates temp artifacts (e.g., codegen), clean them up in the same PR.
* No commented-out legacy logic.
* No duplicate rule implementations.

---

## 0.5 Normative File Anchoring

Every implemented rule must reference its exact normative section.

Implementation rule:

* Each move or effect implementation must contain a comment referencing the exact rule section.
* Format: `// CORE-01-06-16(a)(3)`
* If no rule reference can be cited → do not implement.

No silent interpretation allowed.

---

## 0.6 No Rule Drift Policy

If ambiguity exists between:

* CORE and Expansion
* Expansion vs Expansion
* Symbolic notation vs normative text

Then:

1. Apply Rule Hierarchy (CORE-01-10).
2. If still unclear:

   * Create `/docs/design-decisions/DD-XXXX-<topic>.md`
   * Explain ambiguity
   * Propose deterministic resolution
   * Wait for approval before implementation

No implicit resolution inside code.

---

# 1. Tech Stack

## 1.1 Package Manager / Language

* `pnpm` workspace
* TypeScript (strict)
* Node LTS (defined via `.nvmrc` and/or `engines`)

---

## 1.2 Engine / UI

* `boardgame.io` for rules + multiplayer server
* React for web UI (hotseat + online client)

---

## 1.3 Persistence

* SQLite for match persistence
* SQLite Vector extension (future: match search, embeddings, analysis indices)
* Use maintained sqlite-vector solution
* Persistence must remain optional (in-memory mode must exist)

---

## 1.4 Topology

Board adjacency uses pluggable topology.

Default: Hex topology.

Topology implementation must provide:

```
Adjacent(TileA, TileB) → Boolean
```

Changing topology must not modify any rule outside adjacency evaluation.

---

## 1.5 Visual Namespace

Guideline: `/docs/design/visual-namespace.md`

Visual layer must not affect rules logic.

---

## 1.6 Resource Model Generalization

The engine must not hardcode resource types.

CORE defines DOM, FOR, INF.
Expansions introduce ECO, SEC, CLM.

Implementation rules:

* Resources are defined by registry.
* Expansions register resource types.
* Core logic must not switch on string literals like "DOM".

If an expansion is disabled:

* Its resource type must not exist in state.
* No empty arrays.
* No ghost counters.

---

# 2. Repository Layout (Target)

```
/packages
  /rules          Domain types + pure helper logic (no boardgame.io)
  /game           boardgame.io Game definition (moves, phases, end)
  /server         boardgame.io server + lobby + persistence (SQLite)
  /client-web     React UI (hotseat + online)
  /bot-llm        LLM bot adapter (local model)
  /shared         shared utilities (logger, config, schemas)

/docs
  /rules
  /tasks
  /design-decisions
  /changelog.md

/scripts
```

---

# 3. Rules-to-Code Mapping Principles

## 3.1 Zones are First-Class

CORE defines zones for all objects.

Implement zones explicitly in the game state.
Every object exists in exactly one zone at any time.

---

## 3.2 ContextTile Binding

When resolving any effect, determine the ContextTile exactly as specified in CORE-01-06-00-05.

Avoid implicit context.
If multiple tiles are referenced and no ContextTile is defined → effect is invalid.

---

## 3.3 Majority Computation is a Service

`computeMajority(tileCoord)` must be a single canonical function.

Used everywhere:

* Control checks
* Production distribution
* Hotspot resolution
* Expansion effects relying on majority

No alternative implementations allowed.

---

## 3.4 Expansions are Modular

Each expansion:

* May introduce new zones
* Must be toggled via match config flag
* Must not contaminate core state when disabled

---

## 3.5 Canonical Effect Resolver

All effect resolution must go through:

```
resolveEffect(effectDescriptor, state, context)
```

Resolver order:

1. Assign ContextTile
2. Evaluate prohibitions (Blockade first if active)
3. Apply cost increases
4. Apply output modifiers
5. Apply floors
6. Execute state change atomically

No move may directly mutate state outside this resolver.

---

## 3.6 Production Engine Canonical Order

Production must strictly follow CORE-01-06-16 order:

1. Printed value
2. Doubling
3. Production output modifiers
4. Floors
5. Majority check
6. Distribution / Noise

Golden tests must verify tie remainder goes to Noise.

---

## 3.7 Start Committee Immunity Enforcement

If ContextTile === StartCommittee:

* Ignore prohibitions
* Ignore cost modifiers
* Ignore output modifiers

Except:

* Formalization timing restriction still applies

Must be tested.

---

## 3.8 Expansion Isolation Layer

Each expansion must implement:

```
registerExpansion({
  resources,
  zones,
  modifiers,
  moveExtensions,
  productionHooks,
})
```

When disabled:

* No expansion state exists
* No hooks execute
* No modifier placeholders remain

Engine must behave as pure CORE.

---

# 4. LLM Bot Contract

## 4.1 Illegal Move Prevention

The bot must never execute illegal moves.

Process:

1. Enumerate legal move options deterministically
2. Provide options to LLM
3. LLM selects index only
4. Validate index
5. Execute only if valid
6. Fallback to deterministic safe move otherwise

---

## 4.2 Strict JSON Schema

LLM output must be strict JSON.
Validation via zod.

No free-form move construction.

---

## 4.3 No Context Guessing

Bot must not:

* Invent targets
* Construct costs
* Guess ContextTile

Engine provides:

```
legalMoves: Array<{
  moveType,
  parameters,
  costBreakdown,
  contextTile,
  resultingStateHashPreview
}>
```

LLM selects index only.

---

# 5. Testing Requirements

## 5.1 Unit Tests (Vitest)

Mandatory coverage:

* State transitions
* Majority calculation
* Production order
* Regulation resolution order
* Climate cost stacking
* Expansion toggles

---

## 5.2 Golden Replays

At least one golden test:

* Fixed seed
* Fixed action list
* Assert final state hash

---

## 5.3 Deterministic Hashing

After each full turn:

* Stable JSON serialization
* Canonical key ordering
* SHA-256 hash

Replay must produce identical hash.

---

## 5.4 Cross-Expansion Stack Tests

Mandatory integration tests for:

1. CORE only
2. CORE + EXP-01
3. CORE + EXP-02
4. CORE + EXP-03
5. CORE + 01 + 02
6. CORE + 01 + 03
7. CORE + 02 + 03
8. All expansions active

Specifically test:

* Cost stacking
* Production stacking
* Blockade precedence
* Climate + Regulation stacking order

---

## 5.5 No Dead State Policy

State must never contain:

* Empty expansion zones when disabled
* Regulation arrays when EXP-02 disabled
* Countdown zones when EXP-03 disabled
* Measure zones when respective expansion disabled

Tests must assert absence.

---

# 6. Documentation Contract

## 6.1 Mandatory Documentation Updates

Every PR that modifies:

* State model
* Resolver logic
* Production logic
* Majority calculation
* Expansion toggles

Must include:

1. Update `/docs/changelog.md`
2. If architectural → `/docs/design-decisions/DD-XXXX-<topic>.md`
3. If rule clarification → `/docs/rules/ERRATA-XXXX.md`

No code-only PRs.

---

## 6.2 PR Checklist (Always)

* `pnpm lint` passes
* `pnpm test` passes
* Determinism verified
* No temporary files
* Correct rule references included
* Expansion isolation preserved
* Bot validation tested (if touched)
* Changelog updated

---

END OF AGENTS.md
