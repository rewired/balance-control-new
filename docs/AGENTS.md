# AGENTS.md — BALANCE // CONTROL  
## Boardgame.io Rewrite · Server-authoritative · Rule-first

This repository contains a server-authoritative implementation of the board game
**BALANCE // CONTROL**, built on top of **boardgame.io** and managed via **pnpm**.

You are an engineering agent.
Your job is to implement tasks **exactly** as specified, without inventing rules,
shortcuts, or alternative interpretations.

---

## 0) Absolute priority: THE GAME RULES

**The written game rules are the highest authority in this repository.**

- Software exists to **enforce and reproduce the rules**, not to reinterpret them.
- If a technical decision conflicts with the rules, **the rules win**.
- If a rule is unclear, implement the **minimal safe behavior** and document the ambiguity.
- Never “fix” or “improve” rules in code.

Violations of the rules are considered **critical defects**, even if tests pass.

---

## 1) Rule-first architecture (NON-NEGOTIABLE)

### Separation of concerns
- **Rules Core** defines what is allowed and what happens.
- **boardgame.io** defines *when* things happen (turns, phases, order).
- **Client** renders state and sends intents.
- **Server** is the single source of truth.

Rules must be implementable and testable **without boardgame.io imports**.

---

## 2) boardgame.io usage constraints (MANDATORY)

boardgame.io is used **only** for:
- turn order
- phases
- hooks (`onBegin`, `onEnd`)
- multiplayer synchronization
- move dispatch

It must **not** be used to encode game rules.

### Hard rules
- No custom turn engine
- No alternative round tracking
- No duplicate timing logic outside phases/hooks
- Settlement is a **dedicated phase**, not a side effect

---

## 3) Settlement & Majority invariants (MANDATORY)

The following mechanics are **foundational invariants**:

- Majority calculation is performed by **exactly one rule function**
- Settlement:
  - happens in a dedicated `settlement` phase
  - evaluates each tile independently
  - resolves:
    - no influence → no yield
    - majority → full yield
    - tie → split + remainder → noise pool
- Noise is a **first-class pool** in game state

No alternative implementations are allowed.

---

## 4) Expansions: registry-based, never ad-hoc

Expansions must **never** patch moves or core logic directly.

### Allowed expansion mechanisms
- Data definitions (tiles, measures, marker types)
- Registry-based rule hooks:
  - majority modifiers
  - yield modifiers
  - cost resolvers
- Optional expansion-owned state under:
  `G.extensions[expansionId]`

### Forbidden
- `if (expansionX)` in moves or rules
- Direct mutation of core state from expansion hooks
- Expansion-specific timing logic

If an expansion cannot be expressed via registry + hooks,
the architecture must be revised **before** implementation.

---

## 5) State & determinism rules

- Game state (`G`) must be:
  - plain JSON
  - serializable
  - deterministic
- No classes, Maps, Sets, Dates, or hidden references
- Derived values (majority, control, hotspot status) must **not** be stored
- Randomness:
  - only if explicitly required by rules
  - always via seeded RNG owned by server/core

---

## 6) Language & naming (MANDATORY)

- **English-only identifiers**
- No German names in:
  - files
  - variables
  - types
  - functions
- Canonical domain terms only:
  `influence`, `tile`, `board`, `hotspot`, `committee`, `lobbyist`,
  `overlay`, `measure`, `resource`, `noise`, `settlement`

Player-facing text defaults to English unless specified otherwise.

---

## 7) Comments & documentation (MANDATORY)

Comments must explain:
- rule enforcement
- edge cases
- invariants
- expansion hook behavior
- determinism assumptions

Use short, high-signal comments.
Public APIs require TSDoc/JSDoc.

---

## 8) Temporary file hygiene (MANDATORY)

Any temporary or helper files created during implementation:
- **must be removed** before task completion

Forbidden leftovers:
- scratch scripts
- debug helpers
- abandoned refactors
- commented-out experiments

Leaving temporary files behind is considered **task failure**.

---

## 9) Changelog discipline (MANDATORY)

Maintain `CHANGELOG.md` at repository root.

Every task / PR must add:
- date (YYYY-MM-DD)
- scope (core / server / client / expansion)
- summary of changes
- **Rule impact** section if rules are touched or clarified

---

## 10) Repository structure (target)

- `apps/client` — React + Vite UI
- `apps/server` — boardgame.io server (authoritative)
- `packages/game-core` — rules, state, registries (no UI/server deps)
- `packages/exp-*` — expansions (optional, plugin-style)

---

## 11) Testing requirements

### Mandatory test layers
1. **Rules Core tests**
   - majority resolution
   - settlement
   - tie handling
   - noise accumulation
2. **Golden replay tests**
   - deterministic move sequences → exact end state
3. **Thin integration tests**
   - move wiring
   - phase transitions

Tests must prove **rule correctness**, not framework behavior.

---

## 12) Commit & task discipline

For each task:
1. Read the task description.
2. Implement **only** what is specified.
3. Update `CHANGELOG.md`.
4. Add or adjust tests.
5. Ensure `pnpm -r test` and `pnpm -r build` pass.
6. Provide a concise summary and file list.

---

## 13) If something conflicts

If you encounter a conflict between:
- framework behavior
- architectural convenience
- performance
- or tooling

and the **game rules**:

→ Stop.  
→ Implement the rules correctly.  
→ Document the issue.  
→ Do not introduce workarounds that weaken rule fidelity.

---

## Rule documentation workflow (MANDATORY)

This repository treats game rules as a three-layer system:

1) Canon (human-readable):
   - Location: /docs/rules/canon/*.md
   - This is the normative rule text (player-facing).
   - Every rule that constrains behavior must have a stable Rule ID.

2) Contracts (machine-readable):
   - Location: /docs/rules/contracts/*.md
   - Each implemented rule MUST have a contract entry:
     - rule_id, scope, inputs, outputs, invariants, edge cases
   - Agents MUST implement from the contract, not from memory or interpretation.

3) Rule ↔ Code Mapping:
   - Location: /docs/rules/rule-mapping.md
   - Every rule implementation MUST be mapped to concrete code symbols.

Task requirement:
- Every task that touches rules MUST:
  - reference the affected rule IDs
  - update the relevant contract(s)
  - update rule-mapping.md
  - include at least one test referencing the rule ID(s)

---

## Guiding principle

> This codebase exists to make the rules of  
> **BALANCE // CONTROL**  
> precise, deterministic, and unambiguous —  
> not to reinterpret them.
