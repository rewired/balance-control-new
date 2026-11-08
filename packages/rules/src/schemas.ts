import { z } from 'zod';
import { topologyIds } from './topology/index.js';
import { RegulationKinds } from './types.js';

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

const VariantFlagsSchema = z.object({
  tileRecycling: z.boolean().default(false), // VAR-01-01-01
  firstPlayerHandicap: z.boolean().default(false), // VAR-01-02-01
}).strict().default({});

export const MatchConfigSchema = z
  .object({
    expansions: ExpansionFlagsSchema,
    topology: z.enum(topologyIds).default('hex'), // CORE-01-00-09
    variants: VariantFlagsSchema,
    addOn56: z.boolean().default(false), // ADD56-01-01-01
  })
  .strict();

export type MatchConfig = z.infer<typeof MatchConfigSchema>;
export type MatchConfigInput = z.input<typeof MatchConfigSchema>;

const PaymentId = z.string().min(1);
export const PaymentSelectionSchema = z.object({
  surcharges: z.record(PaymentId).optional(),
  replacement: z.object({ costId: PaymentId, resource: PaymentId }).strict().optional(),
  transfers: z.array(z.object({ costId: PaymentId, effectId: PaymentId, playerID: PaymentId }).strict()).optional(),
  council: z.object({ effectId: PaymentId, resource: PaymentId }).strict().optional(),
}).strict();
export type PaymentSelection = z.infer<typeof PaymentSelectionSchema>;
export const RegulationOperationSchema = z.discriminatedUnion('operation', [
  z.object({ operation: z.literal('place'), regulationKind: z.enum(RegulationKinds), tileId: PaymentId }).strict(),
  z.object({ operation: z.literal('move'), regulationId: PaymentId, tileId: PaymentId }).strict(),
  z.object({ operation: z.literal('remove'), regulationId: PaymentId }).strict(),
  z.object({ operation: z.literal('removeAll'), tileId: PaymentId }).strict(),
]);

export const MatchSetupDataSchema = MatchConfigSchema.extend({ matchSeed: z.string().min(1).default('match') });

export function validateMatchPlayerCount(numPlayers: number, addOn56: boolean): string | undefined {
  if (!Number.isInteger(numPlayers) || numPlayers < 2 || numPlayers > 6) return 'A match requires 2 to 6 players';
  if (addOn56 !== (numPlayers >= 5)) return 'Enable the 5–6-player add-on exactly for matches with 5 or 6 players';
}

export const GameConfigSchema = MatchSetupDataSchema.extend({ numPlayers: z.number().int().min(2).max(6) })
  .superRefine(({ numPlayers, addOn56 }, context) => {
    const message = validateMatchPlayerCount(numPlayers, addOn56);
    if (message) context.addIssue({ code: 'custom', path: ['numPlayers'], message });
  });

export type GameConfig = z.infer<typeof GameConfigSchema>;
