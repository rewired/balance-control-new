import { z, ZodFirstPartyTypeKind, type ZodTypeAny } from 'zod';
import type { CoreState } from './types.js';
import { createExpansionRegistry, type ExpansionModule, type RulesModule } from './expansion-registry.js';
import { createResolver, type PaymentQuote, type ResolveResult } from './effects.js';
import { matchResourceIds } from './resources.js';
import { MeasureExtensionTargetSchema, PaymentSelectionSchema } from './schemas.js';

// MoveDefinition is rules-only (no boardgame.io types here per AGENTS §1.2)
export type MoveQuote<P> = Omit<PaymentQuote, 'payment'> & { payload: P };

export interface MoveDefinition<P> {
  type: string; // canonical move id (stable)
  payloadSchema: ZodTypeAny; // strict schema per AGENTS §4.2
  execute: (G: CoreState, playerID: string, payload: P) => ResolveResult;
  isPlayMeasure?: true;
  enumerate?: (G: CoreState, playerID: string) => P[]; // optional deterministic enumerator (AGENTS §4.1)
  quotes?: (G: CoreState, playerID: string) => MoveQuote<P>[];
}

export interface MoveCatalog {
  types: string[]; // stable lexicographic order for determinism
  schemas: Record<string, ZodTypeAny>;
  definitions: Record<string, MoveDefinition<unknown>>;
}

export interface MoveExtensionBuilder {
  add<P>(def: MoveDefinition<P>): void;
}

export function buildMoveCatalog(modules: readonly RulesModule[]): MoveCatalog {
  const defs: Record<string, MoveDefinition<unknown>> = Object.create(null);
  const schemas: Record<string, ZodTypeAny> = Object.create(null);

  const add = <P>(def: MoveDefinition<P>) => {
    if (defs[def.type]) throw new Error(`Duplicate move type: ${def.type}`);
    // Ensure schema is strict (no passthrough)
    const s = def.payloadSchema;
    // zod objects should be strict; other schema types are fine
    if ('_def' in s && (s as unknown as { _def?: { typeName?: unknown; unknownKeys?: unknown } })._def?.typeName === ZodFirstPartyTypeKind.ZodObject) {
      const isStrict = (s as unknown as { _def?: { typeName?: unknown; unknownKeys?: unknown } })._def?.unknownKeys === 'strict';
      if (!isStrict) throw new Error(`Move schema for ${def.type} must be strict (AGENTS §4.2)`);
    }
    defs[def.type] = {
      ...def,
      enumerate: def.quotes ? (G, playerID) => def.quotes!(G, playerID).map(quote => quote.payload) : def.enumerate,
      // The router supplies the output of the registered payload schema.
      execute: (G, playerID, payload) => def.execute(G, playerID, payload as P),
    };
    schemas[def.type] = s;
  };

  // All active modules contribute moves through the same builder (AGENTS §3.8).
  for (const mod of modules) {
    if ('measureDeck' in mod && mod.measureDeck) {
      add(measureMove(mod, 'takeMeasure'));
      add(measureMove(mod, 'playMeasure'));
    }
    mod.extendMoves?.({ add });
  }

  const types = Object.keys(defs).sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
  return { types, schemas, definitions: defs };
}

const MeasurePayload = z.object({ measureId: z.string().min(1), payment: PaymentSelectionSchema.optional() }).strict();
const PlayMeasurePayload = MeasurePayload.extend({
  targetPlayerID: z.string().min(1).optional(),
  targetTileId: z.string().min(1).optional(),
  targetResort: z.string().min(1).optional(),
  ...MeasureExtensionTargetSchema.shape,
});

// EXP-01-06-00A/-01A: each active deck exposes the same shared actions.
function measureMove(module: ExpansionModule, kind: 'takeMeasure' | 'playMeasure'): MoveDefinition<z.infer<typeof PlayMeasurePayload>> {
  const expansion = module.id;
  const resolve = createResolver();
  return {
    type: `${expansion}_${kind}`,
    payloadSchema: kind === 'playMeasure' ? PlayMeasurePayload : MeasurePayload,
    ...(kind === 'playMeasure' ? { isPlayMeasure: true } : {}),
    execute: (G, playerID, payload) => resolve(G, { kind, expansion, playerID, ...payload }),
    quotes: (G, playerID) => {
      const deck = G.exp?.[expansion]?.measures;
      const cards = kind === 'takeMeasure' ? deck?.open : deck?.hands[playerID];
      return (cards ?? []).flatMap(measureId => {
        if (!measureId) return [];
        const rule = kind === 'playMeasure' ? module.measureRules?.[measureId] : undefined;
        const players = rule?.targetPlayer
          ? Object.keys(G.exp.core.players).filter(id => rule.targetPlayer?.(G, playerID, id)) : [undefined];
        const tiles = rule?.targetTile ? G.exp.core.tiles.board.map(tile => tile.tileId) : [undefined];
        const resorts = rule?.targetResort ? matchResourceIds(G).filter(id => rule.targetResort?.(G, id)) : [undefined];
        const targets = rule?.extensionTarget ? [...rule.extensionTarget.options(G)] : [{}];
        const choices = players.flatMap(targetPlayerID => tiles.flatMap(targetTileId => resorts.flatMap(targetResort =>
          targets.map(extensionTarget => ({
          measureId, ...(targetPlayerID === undefined ? {} : { targetPlayerID }), ...(targetTileId === undefined ? {} : { targetTileId }),
          ...(targetResort === undefined ? {} : { targetResort }),
          ...extensionTarget,
        })))));
        return choices.flatMap(payload => resolve.actionQuotes(G, { kind, expansion, playerID, ...payload })
          .map(({ payment, ...quote }) => ({ ...quote, payload: { ...payload, ...(payment ? { payment } : {}) } })));
      });
    },
  };
}

export function* politicalMoveQuotes(G: CoreState, playerID: string, additional = false) {
  const catalog = buildMoveCatalog(createExpansionRegistry(G.cfg.expansions));
  for (const type of catalog.types) {
    const definition = catalog.definitions[type];
    if (additional && definition.isPlayMeasure) continue;
    const options = definition.quotes?.(G, playerID)
      ?? definition.enumerate?.(G, playerID).map(payload => ({ payload, costBreakdown: [], contextTile: null }))
      ?? [];
    for (const option of options) yield { type, ...option };
  }
}

export function* politicalMoveOptions(G: CoreState, playerID: string, additional = false) {
  for (const { type, payload } of politicalMoveQuotes(G, playerID, additional)) {
    yield { type, payload };
  }
}



