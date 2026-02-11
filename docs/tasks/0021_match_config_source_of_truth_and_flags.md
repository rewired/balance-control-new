# Task 0021 — Canonical Match Config Plumbing (Single Source of Truth)

## Goal

Establish **one canonical, deterministic path** for match configuration (including expansion enablement) that is available to **all lifecycle hooks and moves** without deriving flags from state shape.

This task is **plumbing only**: it creates the stable configuration surface that Task 0022 will build on.

## Inputs

* AGENTS 0.2 Determinism
* AGENTS 0.1 / 0.5 / 0.6 Rules anchoring & no drift
* AGENTS 3.8 Expansion Isolation
* Current code deriving enablement via `!!G.exp?.exp01` etc.
* Existing zod config schema (wherever currently defined)

## Outputs

### Code

1. **Canonical config stored in state**

   * Add a required `G.cfg` (or `G.config`) field to the core state.
   * `G.cfg` must contain the **validated canonical config**, at minimum:

     * `expansions: { exp01: boolean; exp02: boolean; exp03: boolean; ... }`
   * Populate `G.cfg` exactly once in `setup()` using zod validation.
   * `G.cfg` must be treated as **read-only** after setup.

2. **Config-only enablement helper**

   * Add helper: `isExpansionEnabled(cfg, 'exp01') -> boolean`
   * Prohibit use of `!!G.exp?.exp01` style derivation anywhere.

3. **Hard guard: config/state mismatch is deterministic**

   * Add helper: `assertExpansionStateMatchesConfig(G)`:

     * If `cfg.expansions.expXX === true` then the corresponding expansion slice **must exist**.
     * If `cfg.expansions.expXX === false` then the slice **may exist** (for replay/back-compat), but must be **treated as disabled**.
   * Decide and implement a single policy:

     * **Enabled but missing slice** → throw deterministic error (preferred)
     * **Disabled but slice exists** → no throw; slice ignored
   * Call the guard at deterministic choke points:

     * end of `setup()`
     * start of each `turn.onBegin` (or similar single entry point)
     * before any expansion registry construction

4. **Replace flag derivation**

   * Replace all remaining flag derivations with config usage:

     * `flags = G.cfg.expansions` (or `isExpansionEnabled(G.cfg, ...)`)
   * Expansion registries must be built **only** from `G.cfg`, never from state presence.

### Tests

Add deterministic tests for the policy above:

1. **Disabled config ignores present slice**

   * cfg: exp01=false
   * state: contains `G.exp.exp01`
   * Expect: exp01 features remain disabled (registry / hooks do not run exp01 behaviors).

2. **Enabled config requires slice**

   * cfg: exp01=true
   * state: missing `G.exp.exp01`
   * Expect: deterministic failure (throw) OR zod invalid state (depending on chosen policy).

### Docs

* Add `/docs/changelog.md` entry for Task 0021:

  * “Canonical match config stored in state; expansion enablement derived exclusively from config; mismatch guard added.”

## Constraints

* Boardgame.io compatible patterns only.
* No rule changes.
* No rebalancing.
* No new gameplay behavior beyond deterministically enforcing config/source-of-truth.

## Invariants

* Deterministic reconstruction of module set from `G.cfg` is possible at any time.
* Expansion isolation preserved: disabled expansions may not affect game via “ghost slices”.

## Acceptance Criteria

* No remaining instances of `!!G.exp?.expXX` (or equivalent) for enablement.
* `G.cfg` exists on every state and is validated at setup.
* Guard behavior is deterministic and covered by tests.
* Changelog updated.

---

## Commit Requirements

One clean commit:

* `task(0021): canonical match config plumbing`
* Includes code + tests + changelog.

## PR Checklist (Fill after implementation)

* [ ] pnpm lint passes
* [ ] pnpm test passes
* [ ] Determinism verified (no Date.now, no Math.random, no non-seeded sources)
* [ ] No temporary files committed
* [ ] Correct rule / contract references included where required
* [ ] Expansion isolation preserved (no ghost zones/resources when disabled)
* [ ] Changelog updated (/docs/changelog.md)
* [ ] If ambiguity required a decision: created /docs/design-decisions/DD-XXXX-<topic>.md

---
