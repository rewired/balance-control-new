# Local Ollama bot and paired duels

To play in the browser, start Ollama, build the workspace with `pnpm build`, and run `pnpm --filter @bc/server dev` alongside `pnpm dev`. Open **Hotseat → Player seats** and use **Check Ollama** to check the connection and refresh the installed models. Pick a model for any seat, including Player 1. The setup checks that each selected model is still installed when you start the match.

Run Ollama locally and use `ollama list` to pick an installed model. Build the workspace before starting the runner.

```powershell
pnpm build
$env:BOT = 'duel'
$env:OLLAMA_MODEL = 'your-installed-model-tag'
$env:SEEDS = 'duel-1,duel-2'
pnpm --filter @bc/server bot:run
```

Each seed runs twice, with Ollama on seat `0` and then seat `1`. Both games begin at the same engine state. The opponent uses the same search as the browser's Hotseat bot. Games run through final Settlement and report board Influence, the outcome, model requests, and fallback counts. The totals include only pairs in which the model made a valid choice whenever called. A request failure stops the run.

| Variable | Effect |
| --- | --- |
| `SEEDS` | Comma-separated match seeds. Defaults to `duel-1,duel-2`. |
| `OPENING_TURNS` | Defaults to `0` for complete games. A positive value plays those turns with a shared first-legal policy, then lets the bots play the rest. Use this for an endgame pilot and report it separately from full games. |
| `BOT_EXPANSIONS` | Comma-separated `exp01`, `exp02`, `exp03`. Defaults to CORE only. |
| `OLLAMA_CONTEXT` | Context limit in tokens. Defaults to 8192 for CORE and 16384 with expansions. |
| `OLLAMA_THINK` | Set to `1` to request thinking on supported models. Defaults to off. |
| `OLLAMA_HOST` | Loopback URL for the duel. Defaults to `http://127.0.0.1:11434`. |

The prompt contains the goal, a rule brief, normative text for visible Measures, the visible board and player supplies, and a deterministic sample of legal options with costs. Both bots use the same public state boundary. The model receives neither true nor simulated pile order, match seed, PRNG state, or engine hashes. The engine validates the selected option before applying it. Ollama uses [structured outputs](https://docs.ollama.com/capabilities/structured-outputs) and the runner checks the returned index again.

For a smoke test with Ollama choosing for both seats, set `BOT=llm` and `N` to a turn limit (default 6). `BOT=random` runs the same smoke test using the first legal option at each decision, without making any model requests.
