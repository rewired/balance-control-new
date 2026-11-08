import { z } from 'zod';

export const LLMChoiceSchema = z.object({ index: z.number().int().nonnegative() }).strict();
export type LLMChoice = z.infer<typeof LLMChoiceSchema>;
