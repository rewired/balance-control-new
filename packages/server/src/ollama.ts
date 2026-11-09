import type { LLMBackend } from '@bc/bot-llm';

export const ollamaHost = process.env.OLLAMA_HOST ?? 'http://127.0.0.1:11434';

export function localOllamaOrigin(host: string): string {
  const url = new URL(host);
  if (!['http:', 'https:'].includes(url.protocol) || !['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname)) {
    throw new Error('Ollama must run on a local address.');
  }
  return url.origin;
}

export async function listOllamaModels(host: string): Promise<string[]> {
  const res = await fetch(`${host}/api/tags`, { redirect: 'error', signal: AbortSignal.timeout(4000) });
  if (!res.ok) throw new Error(`Ollama returned HTTP ${res.status}.`);
  const data = await res.json() as { models?: { name?: unknown; size?: number }[] };
  if (!Array.isArray(data.models)) throw new Error('Ollama did not return a model list.');
  const models = data.models.flatMap(({ name, size }) =>
    typeof name === 'string' && name.length > 0 && (size ?? 0) > 0 && !name.endsWith(':cloud') ? [name] : []);
  return [...new Set(models)].sort();
}

export function makeOllamaBackend(host: string, model: string, context: number, think: boolean, signal?: AbortSignal): LLMBackend {
  return {
    async complete(prompt: string, optionCount: number): Promise<string> {
      const timeout = AbortSignal.timeout(180_000);
      const res = await fetch(`${host}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: signal ? AbortSignal.any([signal, timeout]) : timeout,
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
      if (!res.ok) throw new Error(`Ollama returned HTTP ${res.status}.`);
      const json = await res.json() as { response?: unknown; output_text?: unknown; message?: { content?: unknown } };
      return String(json.response ?? json.output_text ?? json.message?.content ?? '').trim();
    },
  };
}
