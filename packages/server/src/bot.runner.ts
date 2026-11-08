import type { LLMBackend } from '@bc/bot-llm';
import { runBotMatch } from './bot-match.js';

const BOT = (process.env.BOT ?? 'random').toLowerCase();
const OLLAMA_HOST = process.env.OLLAMA_HOST ?? 'http://127.0.0.1:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL ?? 'llama3.2:3b-instruct-q4_K_M';

function makeOllamaBackend(host: string, model: string): LLMBackend {
  return {
    async complete(prompt: string): Promise<string> {
      const res = await fetch(`${host}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model, prompt, stream: false })
      });
      if (!res.ok) throw new Error(`ollama http ${res.status}`);
      const json = await res.json() as { response?: unknown; output_text?: unknown; message?: { content?: unknown } };
      const text = String(json.response ?? json.output_text ?? json.message?.content ?? '');
      return text.trim();
    }
  };
}

async function main() {
  const backend = BOT === 'llm' ? makeOllamaBackend(OLLAMA_HOST, OLLAMA_MODEL) : undefined;
  console.log(backend ? `[runner] BOT=llm using ${OLLAMA_HOST} model=${OLLAMA_MODEL}` : '[runner] BOT=random (deterministic fallback policy)');
  const result = await runBotMatch(Number(process.env.N ?? 6), backend);
  console.log(`[runner] done turn=${result.turn} hash=${result.hash}`);
}

main().catch(error => { console.error(error); process.exitCode = 1; });
