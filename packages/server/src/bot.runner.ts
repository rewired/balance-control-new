import type { LLMBackend } from '@bc/bot-llm';
import { createBCGame } from '@bc/game';
import { runBotDuel, runBotMatch } from './bot-match.js';

const BOT = (process.env.BOT ?? 'random').toLowerCase();
const OLLAMA_HOST = process.env.OLLAMA_HOST ?? 'http://127.0.0.1:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL ?? 'llama3.2:3b-instruct-q4_K_M';

function makeOllamaBackend(host: string, model: string, context: number, think: boolean): LLMBackend {
  return {
    async complete(prompt: string, optionCount: number): Promise<string> {
      const res = await fetch(`${host}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(180_000),
        redirect: 'error',
        body: JSON.stringify({
          model, prompt, stream: false, think, keep_alive: '20m',
          format: {
            type: 'object', required: ['index'], additionalProperties: false,
            properties: { index: { type: 'integer', minimum: 0, maximum: optionCount - 1 } },
          },
          options: { temperature: 0, seed: 1, num_ctx: context, num_predict: think ? 1024 : 64 },
        }),
      });
      if (!res.ok) throw new Error(`ollama http ${res.status}`);
      const json = await res.json() as { response?: unknown; output_text?: unknown; message?: { content?: unknown } };
      const text = String(json.response ?? json.output_text ?? json.message?.content ?? '');
      return text.trim();
    }
  };
}

async function main() {
  if (BOT === 'duel') {
    const host = new URL(OLLAMA_HOST);
    if (!['127.0.0.1', 'localhost', '[::1]'].includes(host.hostname)) throw new Error('The duel uses a local Ollama host');
    if (!process.env.OLLAMA_MODEL) throw new Error('Set OLLAMA_MODEL to a model shown by ollama list');
    const seeds = (process.env.SEEDS ?? 'duel-1,duel-2').split(',').map(seed => seed.trim());
    const openingTurns = Number(process.env.OPENING_TURNS ?? 0);
    const enabled = (process.env.BOT_EXPANSIONS ?? '').split(',').map(id => id.trim()).filter(Boolean);
    const flags = ['exp01', 'exp02', 'exp03'];
    if (enabled.some(id => !flags.includes(id))) throw new Error('BOT_EXPANSIONS accepts exp01, exp02, exp03');
    const expansions = Object.fromEntries(flags.map(id => [id, enabled.includes(id)]));
    const context = Number(process.env.OLLAMA_CONTEXT ?? (enabled.length ? 16384 : 8192));
    if (!Number.isSafeInteger(context) || context < 2048) throw new Error('OLLAMA_CONTEXT must be an integer of at least 2048');
    const think = process.env.OLLAMA_THINK === '1';
    console.log(JSON.stringify({ model: OLLAMA_MODEL, seeds, openingTurns, expansions, context, think }));
    const result = await runBotDuel(seeds, makeOllamaBackend(host.origin, OLLAMA_MODEL, context, think), {
      openingTurns,
      makeGame: matchSeed => createBCGame({ matchSeed, expansions }),
      onProgress: progress => console.log(JSON.stringify({ progress })),
      onGame: leg => console.log(JSON.stringify(leg)),
    });
    console.log(JSON.stringify({ totals: result }));
    return;
  }
  if (BOT !== 'llm' && BOT !== 'random') throw new Error('BOT must be random, llm, or duel');
  const backend = BOT === 'llm' ? makeOllamaBackend(OLLAMA_HOST, OLLAMA_MODEL, 16384, process.env.OLLAMA_THINK === '1') : undefined;
  console.log(backend ? `[runner] BOT=llm using ${OLLAMA_HOST} model=${OLLAMA_MODEL}` : '[runner] BOT=random (deterministic fallback policy)');
  const result = await runBotMatch(Number(process.env.N ?? 6), backend);
  console.log(`[runner] done turn=${result.turn} hash=${result.hash}`);
}

main().catch(error => { console.error(error); process.exitCode = 1; });
