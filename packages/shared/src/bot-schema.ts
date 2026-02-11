import { z } from 'zod';

export const LLMChoiceSchema = z.object({ optionId: z.string().min(1) }).strict();
export type LLMChoice = z.infer<typeof LLMChoiceSchema>;