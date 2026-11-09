import type { LegalMoveOption } from '@bc/game';
import { LLMChoiceSchema } from '@bc/shared';

export interface LLMBackend { complete(prompt: string, optionCount: number): Promise<string> }
export type LLMFallback = 'invalid-response' | 'backend-error';

export async function chooseOptionWithLLM(
  options: readonly LegalMoveOption[], stateSummary: string, backend?: LLMBackend,
  onFallback?: (reason: LLMFallback, error?: unknown) => void,
): Promise<LegalMoveOption | undefined> {
  if (!options.length || !backend) return options[0];
  const prompt = [
    'You are playing BALANCE // CONTROL. Choose the listed action that best advances your chance of winning.',
    'Use only the visible position. Draw piles are unknown. Respond with only JSON of the form {"index":0}.',
    stateSummary,
    'Legal options (zero-based indices):',
    // AGENTS §4.3: keep preview hashes inside the engine boundary, including in the live runner.
    JSON.stringify(options.map(({ moveType, parameters, costBreakdown, contextTile }, index) =>
      ({ index, moveType, parameters, costBreakdown, contextTile }))),
  ].join('\n');
  let raw: string;
  try {
    raw = await backend.complete(prompt, options.length);
  } catch (error) {
    onFallback?.('backend-error', error);
    return options[0];
  }
  try {
    const { index } = LLMChoiceSchema.parse(JSON.parse(raw));
    if (options[index]) return options[index];
  } catch {
    // Use the same fallback for malformed JSON and out-of-range indices.
  }
  onFallback?.('invalid-response');
  return options[0];
}
