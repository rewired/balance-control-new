export async function listOllamaModels(server: string, signal?: AbortSignal): Promise<string[]> {
  let response: Response;
  try {
    response = await fetch(`${server}/bots/ollama/models`, { signal: signal ?? AbortSignal.timeout(6000) });
  } catch {
    throw new Error('Game server unavailable. Start it to use Ollama.');
  }
  const result = await response.json() as { models?: string[]; error?: string };
  if (!response.ok || !result.models) throw new Error(result.error ?? 'Could not check Ollama.');
  return result.models;
}
