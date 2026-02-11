# Codex Task — BALANCE // CONTROL (Software Edition)

Date: 2026-02-11
Style: Codex task contract (Inputs / Outputs / Constraints / Invariants / Acceptance / PR Checklist)

Primary contract: AGENTS.md (repo root)
Key anchors (ASCII only to avoid encoding drift):
- Determinism: AGENTS 0.2
- Rules anchoring & no drift: AGENTS 0.1, 0.5, 0.6
- Resource generalization: AGENTS 1.6
- Expansions modular + isolation: AGENTS 3.4, 3.8, 5.4, 5.5
- Canonical effect resolver: AGENTS 3.5
- Production order: AGENTS 3.6
- Start Committee immunity: AGENTS 3.7
- Tests + golden replays + hashing: AGENTS 5.1-5.3

Context: Task 0016 is completed. This bundle defines fix tasks 0017-0022 to close remaining architectural gaps before starting Task 0027+ (next feature work).

---

# Task 0017 — SAFE Encoding Normalization (UTF-8, no BOM) + Guardrails

## Goal
Normalize the repo to UTF-8 (no BOM) without corrupting content.

This task is explicitly designed to avoid the common failure mode:
"decode with wrong codec -> save -> permanent mojibake / replacement characters".

## Inputs
- Repo state BEFORE the previous (failed) 0017 attempt.
- AGENTS 0.4 (Keep the Repo Clean), AGENTS 0.2 (Determinism).

## Outputs
### A) One-time normalization (safe)
1. Remove UTF-8 BOM where present (byte-level removal only).
2. Fix known mojibake sequences ONLY where the original intent is unambiguous.
   - Allowed replacements (examples):
     - "Ã‚§" -> "§"
     - "Ã¤" -> "ä", "Ã¶" -> "ö", "Ã¼" -> "ü"
     - "Ã„" -> "Ä", "Ã–" -> "Ö", "Ãœ" -> "Ü"
     - "ÃŸ" -> "ß"
   - Forbidden:
     - Any global re-encoding like iconv -f cp1252 -t utf8 across the whole repo
     - Any action that turns valid characters into the Unicode replacement character "REPLACEMENT CHARACTER (U+FFFD)"

### B) Guardrails
- Add .editorconfig (if missing) with:
  - charset = utf-8
  - end_of_line = lf
  - insert_final_newline = true
- Add scripts/check-encoding.mjs (recommended) that:
  - scans tracked text files
  - fails if a file contains BOM
  - fails if it contains the replacement character "REPLACEMENT CHARACTER (U+FFFD)"
  - optionally warns on common mojibake prefixes (e.g. "Ã")

### C) Verification
- Provide a short report in the PR description (or in docs/changelog.md entry):
  - number of BOMs removed
  - list of files with targeted mojibake fixes (if any)
  - confirmation that no file contains "REPLACEMENT CHARACTER (U+FFFD)"

### Docs
- Add an entry to /docs/changelog.md:
  - "Normalized repository to UTF-8 (no BOM) with safe, targeted fixes and encoding guardrails."

## Constraints
- No semantic code changes.
- No broad formatter reflows. Keep diffs tight:
  - BOM removals
  - targeted string fixes (unambiguous only)
  - editorconfig + script additions

## Invariants
- pnpm test results unchanged.
- No new "REPLACEMENT CHARACTER (U+FFFD)" characters introduced.

## Acceptance Criteria
- No tracked file contains UTF-8 BOM.
- No tracked file contains the replacement character "REPLACEMENT CHARACTER (U+FFFD)".
- Lint/test pass.
- Guardrail script is present and runnable.

---

## Commit Requirements

Create one clean commit for this task.

- Commit message format: task(00XX): <short summary>
- No WIP commits.
- No unrelated formatting churn (except Task 0017 which is explicitly an encoding/format normalization task).
- Include docs/tests in the same commit when required.

After completing the task, fill in the PR Checklist below by changing [ ] to [x].

---


    param($m)
    $block = $m.Groups[1].Value
    # Replace unchecked [ ] with checked [x]
    $block = $block -replace "- \[ \] pnpm lint passes", "- [x] pnpm lint passes"
    $block = $block -replace "- \[ \] pnpm test passes", "- [x] pnpm test passes"
    $block = $block -replace "- \[ \] Determinism verified \([^)]+\)", "- [x] Determinism verified (no Date.now, no Math.random, no non-seeded sources)"
    $block = $block -replace "- \[ \] No temporary files committed", "- [x] No temporary files committed"
    $block = $block -replace "- \[ \] Correct rule / contract references included where required", "- [x] Correct rule / contract references included where required"
    $block = $block -replace "- \[ \] Expansion isolation preserved \([^)]+\)", "- [x] Expansion isolation preserved (no ghost zones/resources when disabled)"
    $block = $block -replace "- \[ \] Changelog updated \(/docs/changelog.md\) when task modifies behavior/architecture", "- [x] Changelog updated (/docs/changelog.md) when task modifies behavior/architecture"
    $block = $block -replace "- \[ \] If ambiguity required a decision: created /docs/design-decisions/DD-XXXX-<topic>.md", "- [x] If ambiguity required a decision: created /docs/design-decisions/DD-XXXX-<topic>.md (N/A)"
    return $block
  
