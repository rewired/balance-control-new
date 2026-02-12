# Local LLM Bot — Ollama Runbook

This guide runs the LLM bot locally using Ollama. The bot never constructs moves: it picks from enumerated legal options only (AGENTS §4.1) and falls back deterministically if the model is unavailable.

## Prereqs
- Node.js 20.11+ and pnpm 10 (repo uses `packageManager: pnpm@10.18.0`)
- Ollama installed:
  - Windows: https://ollama.com/download
  - Linux/macOS: `curl -fsSL https://ollama.com/install.sh | sh`

## Model
For ~8GB VRAM:
- `llama3.2:3b-instruct-q4_K_M` or
- `phi3:mini` (quantized)

Pull a model:
```
ollama pull llama3.2:3b-instruct-q4_K_M
```

Start Ollama (default port 11434):
```
ollama serve
```

## Run the bot runner (headless)
From repo root:
```
BOT=llm OLLAMA_MODEL="llama3.2:3b-instruct-q4_K_M" pnpm --filter @bc/server bot:run
```
Environment variables:
- `BOT=llm|random` (default: random)
- `OLLAMA_HOST` (default: http://127.0.0.1:11434)
- `OLLAMA_MODEL` (required for `BOT=llm`)
- `N` number of placement steps (default 6)

Behavior:
- Enumerates legal political actions for the current player.
- Sends only the list of option IDs to the model and expects strict JSON `{ "optionId": "..." }`.
- If validation fails or Ollama is unreachable, falls back to the first legal option.

## Troubleshooting
- "ECONNREFUSED": ensure `ollama serve` is running and `OLLAMA_HOST` is correct.
- GPU OOM: try a smaller or more heavily quantized model.
- Empty options: occurs late in a match when no political actions remain.