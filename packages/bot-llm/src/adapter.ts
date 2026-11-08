import type { LegalMoveOption } from '@bc/game';
import { LLMChoiceSchema } from '@bc/shared';

export interface LLMBackend { complete(prompt: string): Promise<string> }

export async function chooseOptionWithLLM(
  options: readonly LegalMoveOption[], stateSummary: string, backend?: LLMBackend,
): Promise<LegalMoveOption | undefined> {
  if (!options.length || !backend) return options[0];
  const prompt = [
    'Choose one legal option. Respond with only JSON of the form {"index":0}.',
    stateSummary,
    JSON.stringify(options.map((option, index) => ({ index, ...option }))),
  ].join('\n');
  try {
    const raw = await backend.complete(prompt);
    const { index } = LLMChoiceSchema.parse(JSON.parse(raw));
    return options[index] ?? options[0];
  } catch {
    return options[0];
  }
}
