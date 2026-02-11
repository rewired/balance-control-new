import { z } from 'zod';

export const GameConfigSchema = z.object({
  numPlayers: z.number().int().min(2).max(4), // CORE-01 scope (no 5-6 add-on yet)
  topology: z.literal('hex').default('hex'), // CORE-01-00-07..11 (attachment exists; details later)
  matchSeed: z.string().min(1).default('match'),
});

export type GameConfig = z.infer<typeof GameConfigSchema>;