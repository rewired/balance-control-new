# Codex Task — BALANCE // CONTROL (Software Edition)

**Date:** 2026-02-11  
**Style:** Codex task contract (Inputs / Outputs / Constraints / Invariants / Acceptance / PR Checklist)

**Primary contract:** `AGENTS.md` (repo root)  
Key anchors:
- Determinism: AGENTS §0.2  
- Rules anchoring & no drift: AGENTS §0.1, §0.5, §0.6  
- Resource generalization: AGENTS §1.6  
- Expansions modular + isolation: AGENTS §3.4, §3.8, §5.4, §5.5  
- Canonical effect resolver: AGENTS §3.5  
- Production order: AGENTS §3.6  
- Start Committee immunity: AGENTS §3.7  
- Tests + golden replays + hashing: AGENTS §5.1–§5.3

**Context:** Task 0016 is completed. This bundle defines **fix tasks 0017–0022** to close remaining architectural gaps before starting Task 0027+ (next feature work).

---

# Task 0017 — Encoding & Text Normalization (UTF‑8, No BOM)

## Goal
Eliminate mixed encodings (cp1252), mojibake artifacts (e.g., `AGENTS Ã‚§…`), and BOMs to prevent diff-noise and tooling issues.

This task is intentionally “formatty”, but **only** for encoding correctness.

## Inputs
- Current repo state (post Task 0016).
- `AGENTS.md` §0.4 (Keep the Repo Clean), §0.2 (Determinism) — avoid any behavior changes beyond encoding.

## Outputs
### Repo normalization
- Ensure **all tracked text files** are:
  - UTF‑8
  - no BOM
  - LF line endings (unless repo policy dictates otherwise; do not introduce CRLF drift)
- Fix any mojibake sequences in code comments and docs (e.g. `Ã‚§` → `§`) where they appear.

### Guardrails
- Add an `.editorconfig` (if missing) to lock:
  - charset = utf-8
  - end_of_line = lf
  - insert_final_newline = true
- Add a lightweight script (optional) under `/scripts/`:
  - `scripts/check-encoding.mjs` that fails CI if a file is not UTF‑8 / contains BOM.
  - Keep dependencies minimal.

### Docs
- Add a short entry to `/docs/changelog.md`: “Normalized repo to UTF‑8 (no BOM) to ensure clean diffs and stable tooling.”

## Constraints
- **No semantic code changes** (beyond fixing broken characters in string literals/comments where required).
- Do not reformat unrelated code; keep diff limited to encoding fixes.

## Invariants
- `pnpm test` results unchanged (besides potential fixes for previously broken character parsing).

## Acceptance Criteria
- No remaining cp1252 files.
- No BOM characters.
- No `Ã` mojibake remnants in tracked files.
- Lint/test pass.


---

## Commit Requirements

Create **one clean commit** for this task.

- Commit message format: `task(00XX): <short summary>`
- No WIP commits.
- No unrelated formatting churn (except Task 0017 which is explicitly an encoding/format normalization task).
- Include docs/tests in the same commit when required.

After completing the task, **fill in the PR Checklist** below by changing `[ ]` to `[x]`.

---

## PR Checklist (Fill after implementation)

- [ ] `pnpm lint` passes
- [ ] `pnpm test` passes
- [ ] Determinism verified (no `Date.now`, no `Math.random`, no non-seeded sources)
- [ ] No temporary files committed
- [ ] Correct rule / contract references included where required
- [ ] Expansion isolation preserved (no ghost zones/resources when disabled)
- [ ] Changelog updated (`/docs/changelog.md`) when task modifies behavior/architecture
- [ ] If ambiguity required a decision: created `/docs/design-decisions/DD-XXXX-<topic>.md`

