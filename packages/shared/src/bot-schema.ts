import { z } from 'zod';

export const LLMChoiceSchema = z.object({ index: z.number().int().nonnegative() }).strict();
export type LLMChoice = z.infer<typeof LLMChoiceSchema>;

export const OllamaMoveRequestSchema = z.object({
  model: z.string().min(1).max(256),
  prompt: z.string().min(1).max(100_000),
  optionCount: z.number().int().min(2).max(64),
  expanded: z.boolean(),
}).strict();
