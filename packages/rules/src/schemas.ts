import { z } from 'zod';

// Expansion flags — explicit IDs only (Task 0010)
export const ExpansionIdEnum = z.enum(['exp01', 'exp02', 'exp03']);
export type ExpansionId = z.infer<typeof ExpansionIdEnum>;

// Strict expansions object; missing -> defaults to all false
export const ExpansionFlagsSchema = z
  .object({
    exp01: z.boolean().optional(),
    exp02: z.boolean().optional(),
    exp03: z.boolean().optional(),
  })
  .strict()
  .default({})
  .transform((v) => ({
    exp01: !!v.exp01,
    exp02: !!v.exp02,
    exp03: !!v.exp03,
  }));

export type ExpansionFlags = z.infer<typeof ExpansionFlagsSchema>;

// Canonical match config (strict) — focus of Task 0010
export const MatchConfigSchema = z
  .object({
    expansions: ExpansionFlagsSchema,
  })
  .strict();

export type MatchConfig = z.infer<typeof MatchConfigSchema>;

// Legacy/extended GameConfig (kept for future; includes defaults for topology/seed)
export const GameConfigSchema = z
  .object({
    numPlayers: z.number().int().min(2).max(4), // CORE-01 scope (no 5-6 add-on yet)
    topology: z.literal('hex').default('hex'), // CORE-01-00-07..11 (attachment exists; details later)
    matchSeed: z.string().min(1).default('match'),
    expansions: ExpansionFlagsSchema, // Task 0010
  })
  .strict();

export type GameConfig = z.infer<typeof GameConfigSchema>;