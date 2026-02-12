# Task 0029 REPLACEMENT CHARACTER (U+FFFD) Repo Hygiene + LLM Bot Runbook + UTF-8 Enforcement

**Date:** 2026-02-12
**Style:** Codex task contract (Inputs / Outputs / Constraints / Invariants / Acceptance / PR Checklist)

---

## Goal

Bring the repository to a state where REPLACEMENT CHARACTER (U+FFFD)Tasks bis inkl. 0028 sind abgeschlossenREPLACEMENT CHARACTER (U+FFFD) **nachweisbar stimmt** REPLACEMENT CHARACTER (U+FFFD) konkret durch:

1. **vollstREPLACEMENT CHARACTER (U+FFFD)ndige, lauffREPLACEMENT CHARACTER (U+FFFD)hige Doku** fREPLACEMENT CHARACTER (U+FFFD)r den Local-LLM-Bot (0028)
2. **tatsREPLACEMENT CHARACTER (U+FFFD)chliche Integration** des `@bc/bot-llm` in eine ausfREPLACEMENT CHARACTER (U+FFFD)hrbare Runner-Option (ohne Gameplay-REPLACEMENT CHARACTER (U+FFFD)nderungen)
3. **UTF-8-Sauberkeit** im gesamten Repo inkl. automatischer PrREPLACEMENT CHARACTER (U+FFFD)fung (keine stillen Encoding-Fallen mehr)
4. **Task-Nachvollziehbarkeit**: offene Checklisten-Punkte in den relevanten Task-MDs schlieREPLACEMENT CHARACTER (U+FFFD)en oder korrekt als REPLACEMENT CHARACTER (U+FFFD)not doneREPLACEMENT CHARACTER (U+FFFD) markieren.

---

## Context / Problem Statement

Im aktuellen ZIP-Stand sind harte Indikatoren vorhanden, dass REPLACEMENT CHARACTER (U+FFFD)alles fertigREPLACEMENT CHARACTER (U+FFFD) nicht stimmt:

* `docs/tasks/0028_local_llm_bot.md` hat eine **unchecked** PR-Checklist-Position (REPLACEMENT CHARACTER (U+FFFD)Clear docs on how to run with a local modelREPLACEMENT CHARACTER (U+FFFD)).
* Es existiert ein Paket `@bc/bot-llm`, aber **keine** sichtbare, ausfREPLACEMENT CHARACTER (U+FFFD)hrbare Integration im Server/Game Runner (nur REPLACEMENT CHARACTER (U+FFFD)laterREPLACEMENT CHARACTER (U+FFFD)-Text).
* Mehrere Repo-Dateien sind **nicht valide UTF-8** (Windows-1252 / invalid bytes), inkl. Task-MDs und Quellcode, wodurch REPLACEMENT CHARACTER (U+FFFD)Encoding-FixREPLACEMENT CHARACTER (U+FFFD)-Tasks faktisch nicht abgeschlossen sind.

Task 0029 soll diese LREPLACEMENT CHARACTER (U+FFFD)cke schlieREPLACEMENT CHARACTER (U+FFFD)en REPLACEMENT CHARACTER (U+FFFD) sauber, deterministisch, ohne MechanikREPLACEMENT CHARACTER (U+FFFD)nderungen.

---

## Inputs

* Repository state (current main branch / ZIP stand).
* `docs/tasks/0028_local_llm_bot.md`
* `@bc/bot-llm` package inkl. Adapter/Tests
* `@bc/server`, `@bc/game`
* Existing scripts under `scripts/` (encoding fixes)
* `AGENTS.md` non-negotiables:

  * determinism / no rules drift
  * rules as source of truth (`/docs/rules/*`)
  * bot must choose only from **enumerated legal options**

---

## Outputs

### O1 REPLACEMENT CHARACTER (U+FFFD) Local LLM Bot Runbook (Docs)

Create a minimal but complete REPLACEMENT CHARACTER (U+FFFD)how-to runREPLACEMENT CHARACTER (U+FFFD) documentation for a local model, aligned to the chosen approach (Ollama-first):

* New doc: `docs/llm/local-bot-ollama.md` (or equivalent path)

  * Install steps (Windows/Linux)
  * Pull model(s) suitable for RTX 2070 / 8GB VRAM (quantized options)
  * Runtime config (env vars / ports)
  * How the bot is wired (what component calls what)
  * Troubleshooting (common errors: model not running, timeout, GPU OOM)
* Update `README.md`:

  * Align pnpm version to the repoREPLACEMENT CHARACTER (U+FFFD)REPLACEMENT CHARACTER (U+FFFD)s `packageManager` ([pnpm@10.x](mailto:pnpm@10.x))
  * Add a short REPLACEMENT CHARACTER (U+FFFD)LLM Bot (Local)REPLACEMENT CHARACTER (U+FFFD) section linking to the runbook

### O2 REPLACEMENT CHARACTER (U+FFFD) Executable Integration Path (No UI required)

Add a **real** integration point so the bot can actually be used in a dev run:

* Add a runner option in `@bc/server` (or a small CLI wrapper) that can start a match with:

  * `BOT=random` (existing or minimal baseline)
  * `BOT=llm` (uses `@bc/bot-llm`)
* The integration must:

  * obtain **legal moves only** from the engine (existing enumerator)
  * pass only enumerated options into the LLM (Legal-Option Picker)
  * return a single chosen option, validated against the same legal list
  * include a **safe fallback** if the model is unavailable (e.g., choose uniformly random from legal options)

> Scope note: This task is **not** about making the LLM REPLACEMENT CHARACTER (U+FFFD)smartREPLACEMENT CHARACTER (U+FFFD), only about making it **real and runnable**.

### O3 REPLACEMENT CHARACTER (U+FFFD) UTF-8 Repository Cleanup + Enforcement

Make the repo deterministically UTF-8-clean and keep it that way:

* Convert all text sources to UTF-8:

  * `docs/**/*.md`
  * `packages/**/*.{ts,tsx,js,mjs,json}`
  * scripts, configs, etc.
* Add a *single* enforceable check:

  * `pnpm check:encoding` (new or existing) fails CI if any non-UTF-8 text file exists
  * Ensure it catches common Windows-1252 bytes and also REPLACEMENT CHARACTER (U+FFFD)replacement charREPLACEMENT CHARACTER (U+FFFD) corruption (U+FFFD) if thatREPLACEMENT CHARACTER (U+FFFD)REPLACEMENT CHARACTER (U+FFFD)s part of your hygiene rules
* Ensure the existing fix scripts (if kept) are themselves valid UTF-8 and documented.

### O4 REPLACEMENT CHARACTER (U+FFFD) Task Closure Evidence

Update relevant task docs so the completion claim is backed by the repo:

* `docs/tasks/0028_local_llm_bot.md`: checklist completed + links to runbook
* Any tasks in the 0017REPLACEMENT CHARACTER (U+FFFD)0022 range that are REPLACEMENT CHARACTER (U+FFFD)template-yREPLACEMENT CHARACTER (U+FFFD) or incomplete:

  * either finalize their PR checklist sections
  * or explicitly mark remaining items as TODO with clear reason
  * goal: no REPLACEMENT CHARACTER (U+FFFD)looks done but isnREPLACEMENT CHARACTER (U+FFFD)REPLACEMENT CHARACTER (U+FFFD)tREPLACEMENT CHARACTER (U+FFFD) artifacts

---

## Constraints

* **No gameplay/rules changes.** This is hygiene + integration plumbing only.
* **Determinism preserved.**

  * Bot may be nondeterministic in *choice*, but must never mutate state outside the standard move pipeline.
  * Any randomness must flow through approved RNG paths (as defined in your contracts).
* **No direct state mutation** from bot modules.
* **No new external services** besides local model runtime (Ollama). No cloud calls.
* Keep code style consistent (format/lint/test passing).

---

## Invariants

* The LLM bot chooses **only** from enumerated legal intents/options.
* The engine remains the single source of truth for legality.
* UTF-8 enforcement must be consistent across OS (Windows/Linux).
* No drift in `/docs/rules/*` content.

---

## Acceptance Criteria

1. **Docs**

* `docs/llm/local-bot-ollama.md` exists and contains a runnable sequence to:

  * install Ollama
  * pull a model
  * start the service
  * run the repo with `BOT=llm`
* `README.md` references the doc and pnpm version is consistent with `packageManager`.

2. **Integration**

* There is a command (documented) that starts a game where the bot side can be `llm`.
* If Ollama is not reachable, the system logs a clear warning and **falls back** to a legal random pick.
* Add at least one **smoke test** that proves:

  * given a legal options array, the picker returns one of them
  * illegal outputs are rejected and re-picked/fallbacked

3. **UTF-8**

* `pnpm check:encoding` exists and fails when a non-UTF-8 file is introduced.
* Running the encoding fix results in **zero** non-UTF-8 findings.
* No new invalid bytes in task docs, scripts, or source files.

4. **Task closure**

* `docs/tasks/0028_local_llm_bot.md` PR checklist is fully checked or explicitly and correctly updated.
* The repo no longer contains task docs that *claim* completion while leaving critical checklist items undone.

---

## Implementation Notes (Suggested)

* Prefer a simple env-driven config:

  * `BOT=llm|random`
  * `OLLAMA_HOST=http://127.0.0.1:11434`
  * `OLLAMA_MODEL=<model>`
* Keep bot integration isolated (no cross-contamination into rules package).
* For encoding:

  * Choose one canonical approach: Node script using `iconv-lite` + glob, or a strict UTF-8 read test.
  * Make CI run `pnpm check:encoding` by default.

---

## PR Checklist

* [x] All Acceptance Criteria satisfied
* [x] `pnpm lint` passes (workspace green)
* [x] `pnpm test` passes
* [x] `pnpm check:encoding` passes locally
* [x] `README.md` updated (pnpm + LLM bot link)
* [x] `docs/llm/local-bot-ollama.md` added and validated end-to-end
* [x] `docs/tasks/0028_local_llm_bot.md` checklist updated and references runbook
* [x] No rules/spec files changed under `/docs/rules/`
* [x] CHANGELOG updated

---

Wenn du willst, kann ich dir im nREPLACEMENT CHARACTER (U+FFFD)chsten Schritt direkt die **konkrete File-Liste** (Encoding-Fails + minimaler Patch-Plan pro Ordner) aus dem ZIP herausziehen und als REPLACEMENT CHARACTER (U+FFFD)Implementation PlanREPLACEMENT CHARACTER (U+FFFD) in 0029 ergREPLACEMENT CHARACTER (U+FFFD)nzen REPLACEMENT CHARACTER (U+FFFD) aber als Task-Contract ist das hier bereits belastbar und Codex-fREPLACEMENT CHARACTER (U+FFFD)tterbar.
